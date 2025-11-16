import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface AssessmentData {
  id: string;
  student_id: string;
  questions_data: any[];
  answers: any[];
  score: number;
  total_questions: number;
  category_determined: string;
  confidence_score: number;
  time_taken: number;
  started_at: string;
  completed_at: string;
  student?: {
    name: string;
    class_id: string;
    primary_category: string;
    classes?: {
      name: string;
      grade_level: string;
      subject: string;
    };
  };
}

export interface ReportData {
  assessment: AssessmentData;
  studentName: string;
  className: string;
  subject: string;
  gradeLevel: string;
  scorePercentage: number;
  timeFormatted: string;
  categoryName: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  aiSummary?: string;
}

/**
 * Fetch assessment data for a student
 */
export async function getAssessmentData(assessmentId: string): Promise<AssessmentData | null> {
  try {
    const { data, error } = await supabase
      .from('student_assessments')
      .select(`
        *,
        students (
          name,
          class_id,
          primary_category,
          classes (
            name,
            grade_level,
            subject
          )
        )
      `)
      .eq('id', assessmentId)
      .single();

    if (error) {
      console.error('Error fetching assessment data:', error);
      return null;
    }

    return data as AssessmentData;
  } catch (error) {
    console.error('Error in getAssessmentData:', error);
    return null;
  }
}

/**
 * Fetch all assessments for a student
 */
export async function getStudentAssessments(studentId: string): Promise<AssessmentData[]> {
  try {
    const { data, error } = await supabase
      .from('student_assessments')
      .select(`
        *,
        students (
          name,
          class_id,
          primary_category,
          classes (
            name,
            grade_level,
            subject
          )
        )
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching student assessments:', error);
      return [];
    }

    return (data as AssessmentData[]) || [];
  } catch (error) {
    console.error('Error in getStudentAssessments:', error);
    return [];
  }
}

/**
 * Analyze assessment results
 */
export function analyzeAssessment(assessment: AssessmentData): {
  strengths: string[];
  weaknesses: string[];
  categoryBreakdown: Record<string, { correct: number; total: number }>;
} {
  const categoryBreakdown: Record<string, { correct: number; total: number }> = {};
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Analyze by category
  assessment.answers.forEach((answer, index) => {
    const question = assessment.questions_data[index];
    const category = question.category;

    if (!categoryBreakdown[category]) {
      categoryBreakdown[category] = { correct: 0, total: 0 };
    }

    categoryBreakdown[category].total++;
    if (answer.is_correct) {
      categoryBreakdown[category].correct++;
    }
  });

  // Determine strengths and weaknesses
  Object.entries(categoryBreakdown).forEach(([category, stats]) => {
    const percentage = (stats.correct / stats.total) * 100;
    if (percentage >= 70) {
      strengths.push(category);
    } else if (percentage < 50) {
      weaknesses.push(category);
    }
  });

  return { strengths, weaknesses, categoryBreakdown };
}

/**
 * Generate recommendations based on assessment
 */
export function generateRecommendations(
  assessment: AssessmentData,
  analysis: ReturnType<typeof analyzeAssessment>
): string[] {
  const recommendations: string[] = [];
  const scorePercentage = (assessment.score / assessment.total_questions) * 100;

  // Score-based recommendations
  if (scorePercentage >= 80) {
    recommendations.push('Excellent performance! Consider advancing to more challenging material.');
  } else if (scorePercentage >= 60) {
    recommendations.push('Good progress. Focus on reinforcing concepts in weaker areas.');
  } else {
    recommendations.push('Additional support recommended. Consider one-on-one tutoring or review sessions.');
  }

  // Category-based recommendations
  if (assessment.category_determined === 'visual_learner') {
    recommendations.push('Use visual aids, diagrams, and charts to enhance learning.');
  } else if (assessment.category_determined === 'needs_repetition') {
    recommendations.push('Provide multiple practice opportunities and review sessions.');
  } else if (assessment.category_determined === 'fast_processor') {
    recommendations.push('Offer enrichment activities and advanced challenges.');
  }

  // Weakness-based recommendations
  if (analysis.weaknesses.length > 0) {
    recommendations.push(`Focus on improving: ${analysis.weaknesses.join(', ')}`);
  }

  // Time-based recommendations
  const avgTimePerQuestion = assessment.time_taken / assessment.total_questions;
  if (avgTimePerQuestion < 10) {
    recommendations.push('Encourage taking more time to read questions carefully.');
  } else if (avgTimePerQuestion > 60) {
    recommendations.push('Practice time management and quick decision-making skills.');
  }

  return recommendations;
}

/**
 * Prepare report data
 */
export async function prepareReportData(assessmentId: string): Promise<ReportData | null> {
  const assessment = await getAssessmentData(assessmentId);
  if (!assessment || !assessment.student) return null;

  const analysis = analyzeAssessment(assessment);
  const recommendations = generateRecommendations(assessment, analysis);

  const scorePercentage = (assessment.score / assessment.total_questions) * 100;
  const minutes = Math.floor(assessment.time_taken / 60);
  const seconds = assessment.time_taken % 60;
  const timeFormatted = `${minutes}m ${seconds}s`;

  return {
    assessment,
    studentName: assessment.student.name,
    className: assessment.student.classes?.name || 'Unknown Class',
    subject: assessment.student.classes?.subject || 'Unknown Subject',
    gradeLevel: assessment.student.classes?.grade_level || 'Unknown Grade',
    scorePercentage,
    timeFormatted,
    categoryName: assessment.category_determined,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    recommendations,
  };
}

/**
 * Generate PDF report from HTML element
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height in mm

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate PDF report directly (without HTML element)
 */
export async function generatePDFReport(reportData: ReportData): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let yPosition = 20;
    const lineHeight = 7;
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Academic Assessment Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += lineHeight * 2;

    // Student Info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Student: ${reportData.studentName}`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`Class: ${reportData.className}`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`Subject: ${reportData.subject}`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`Grade Level: ${reportData.gradeLevel}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Assessment Results
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Assessment Results', margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Score: ${reportData.assessment.score}/${reportData.assessment.total_questions} (${reportData.scorePercentage.toFixed(1)}%)`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`Time Taken: ${reportData.timeFormatted}`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`Learning Profile: ${reportData.categoryName}`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`Confidence: ${(reportData.assessment.confidence_score * 100).toFixed(1)}%`, margin, yPosition);
    yPosition += lineHeight * 2;

    // AI Summary (if available)
    if (reportData.aiSummary) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Performance Summary', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const summaryLines = pdf.splitTextToSize(reportData.aiSummary, contentWidth);
      summaryLines.forEach((line: string) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight;
    }

    // Strengths
    if (reportData.strengths.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Strengths', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      reportData.strengths.forEach((strength) => {
        pdf.text(`• ${strength}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight;
    }

    // Areas for Improvement
    if (reportData.weaknesses.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Areas for Improvement', margin, yPosition);
      yPosition += lineHeight;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      reportData.weaknesses.forEach((weakness) => {
        pdf.text(`• ${weakness}`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight;
    }

    // Recommendations
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recommendations', margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    reportData.recommendations.forEach((rec) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      const recLines = pdf.splitTextToSize(`• ${rec}`, contentWidth - 5);
      recLines.forEach((line: string) => {
        pdf.text(line, margin + 5, yPosition);
        yPosition += lineHeight;
      });
    });

    // Footer
    const date = new Date(reportData.assessment.completed_at).toLocaleDateString();
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Generated on ${date}`, pageWidth / 2, 285, { align: 'center' });

    // Save
    const filename = `Assessment_Report_${reportData.studentName.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
}
