/**
 * Triangulation Radar Component
 * Triple-overlay radar comparing student, parent, and teacher assessments
 * Used for validating assessment consistency across perspectives
 */

import React, { useEffect, useState } from 'react';
import DynamicRadarChart from './DynamicRadarChart';
import { generateCognitiveAxes } from '@/utils/radar-axis-generator';
import type { RadarDataPoint, TriangulationRadarData } from '@/types/radar-types';
import { supabase } from '@/lib/supabase';

export interface TriangulationRadarProps {
  studentId: string;
  assessmentId?: string;
  height?: number;
  className?: string;
}

export default function TriangulationRadar({
  studentId,
  assessmentId,
  height = 450,
  className = '',
}: TriangulationRadarProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triangulationData, setTriangulationData] = useState<TriangulationRadarData | null>(null);
  const [datasets, setDatasets] = useState<{ label: string; data: RadarDataPoint[]; color: string }[]>([]);

  useEffect(() => {
    async function loadTriangulationData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch student self-assessment
        let studentQuery = supabase
          .from('cognitive_assessment_results')
          .select('*')
          .eq('student_id', studentId)
          .eq('assessment_type', 'student_self');

        if (assessmentId) {
          studentQuery = studentQuery.eq('assessment_id', assessmentId);
        }

        studentQuery = studentQuery.order('created_at', { ascending: false }).limit(1);

        const { data: studentResults, error: studentError } = await studentQuery;
        if (studentError) throw studentError;

        // Fetch parent assessment
        let parentQuery = supabase
          .from('cognitive_assessment_results')
          .select('*')
          .eq('student_id', studentId)
          .eq('assessment_type', 'parent');

        if (assessmentId) {
          parentQuery = parentQuery.eq('assessment_id', assessmentId);
        }

        parentQuery = parentQuery.order('created_at', { ascending: false }).limit(1);

        const { data: parentResults, error: parentError } = await parentQuery;
        if (parentError) throw parentError;

        // Fetch teacher assessment (from students table primary_category)
        const { data: studentRecord, error: recordError } = await supabase
          .from('students')
          .select('primary_category, category_scores')
          .eq('id', studentId)
          .single();

        if (recordError) throw recordError;

        if (!studentResults || studentResults.length === 0) {
          throw new Error('No student self-assessment found');
        }

        const studentScores = studentResults[0].domain_scores as Record<string, number>;
        const parentScores = parentResults && parentResults.length > 0
          ? (parentResults[0].domain_scores as Record<string, number>)
          : {};

        // Generate radar axes for each perspective
        const studentAxes = generateCognitiveAxes(studentScores);
        const parentAxes = parentResults && parentResults.length > 0
          ? generateCognitiveAxes(parentScores)
          : [];

        // Calculate triangulation score (agreement between assessments)
        const triangulationScore = calculateTriangulationScore(
          studentScores,
          parentScores
        );

        setTriangulationData({
          student_id: studentId,
          student_scores: studentScores,
          parent_scores: parentScores,
          teacher_category: studentRecord?.primary_category || '',
          triangulation_score: triangulationScore,
          assessment_date: studentResults[0].created_at,
        });

        // Build datasets for radar
        const radarDatasets: { label: string; data: RadarDataPoint[]; color: string }[] = [
          { label: 'Student Self-Assessment', data: studentAxes, color: '#3b82f6' }, // Blue
        ];

        if (parentAxes.length > 0) {
          radarDatasets.push({ label: 'Parent Assessment', data: parentAxes, color: '#10b981' }); // Green
        }

        // Add teacher assessment if available (convert category_scores to cognitive format)
        if (studentRecord?.category_scores) {
          const teacherCategoryScores = studentRecord.category_scores as Record<string, number>;
          // Map learning categories to cognitive domains (simplified approach)
          const teacherCognitiveScores = mapCategoriesToCognitive(teacherCategoryScores);
          const teacherAxes = generateCognitiveAxes(teacherCognitiveScores);
          radarDatasets.push({ label: 'Teacher Assessment', data: teacherAxes, color: '#f59e0b' }); // Amber
        }

        setDatasets(radarDatasets);
      } catch (err) {
        console.error('Error loading triangulation data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadTriangulationData();
  }, [studentId, assessmentId]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-semibold">Error Loading Data</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (datasets.length === 0 || !triangulationData) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-600 dark:text-gray-400">No triangulation data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Multi-Perspective Assessment
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Comparing student, parent, and teacher assessments
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Agreement Score:
          </span>
          <span
            className={`text-xs px-2 py-1 rounded ${
              triangulationData.triangulation_score >= 0.8
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : triangulationData.triangulation_score >= 0.6
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}
          >
            {(triangulationData.triangulation_score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <DynamicRadarChart
        data={datasets[0].data}
        datasets={datasets}
        maxValue={5}
        height={height}
        showLegend={true}
        showTooltip={true}
        gridType="polygon"
      />

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Assessment Insights
        </h4>
        <ul className="space-y-2 text-xs text-blue-800 dark:text-blue-400">
          <li className="flex items-start gap-2">
            <span className="mt-1">•</span>
            <span>
              {datasets.length} perspective{datasets.length > 1 ? 's' : ''} analyzed
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1">•</span>
            <span>
              Agreement score indicates{' '}
              {triangulationData.triangulation_score >= 0.8
                ? 'high consistency'
                : triangulationData.triangulation_score >= 0.6
                ? 'moderate consistency'
                : 'low consistency'}{' '}
              across assessments
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1">•</span>
            <span>
              Large discrepancies may indicate different perspectives on student abilities or
              need for reassessment
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Calculate triangulation score (0-1) based on agreement between assessments
 */
function calculateTriangulationScore(
  studentScores: Record<string, number>,
  parentScores: Record<string, number>
): number {
  const commonDomains = Object.keys(studentScores).filter((domain) => domain in parentScores);

  if (commonDomains.length === 0) return 0;

  let totalDifference = 0;
  const maxPossibleDifference = commonDomains.length * 4; // Max difference on 1-5 scale

  commonDomains.forEach((domain) => {
    const difference = Math.abs(studentScores[domain] - parentScores[domain]);
    totalDifference += difference;
  });

  // Convert to 0-1 score (1 = perfect agreement, 0 = maximum disagreement)
  return 1 - totalDifference / maxPossibleDifference;
}

/**
 * Map student learning categories (0-100) to cognitive domains (1-5)
 * This is a simplified mapping for visualization purposes
 */
function mapCategoriesToCognitive(categoryScores: Record<string, number>): Record<string, number> {
  // Simplified mapping - in production, use proper correlation matrix
  const cognitiveScores: Record<string, number> = {
    processing_speed: 3,
    working_memory: 3,
    attention_focus: 3,
    learning_style: 3,
    self_efficacy: 3,
    motivation_engagement: 3,
  };

  // Example mappings (simplified)
  if (categoryScores.slow_processing) {
    cognitiveScores.processing_speed = 1 + (categoryScores.slow_processing / 100) * 4;
  }
  if (categoryScores.easily_distracted) {
    cognitiveScores.attention_focus = 5 - (categoryScores.easily_distracted / 100) * 4;
  }
  if (categoryScores.sensitive_low_confidence) {
    cognitiveScores.self_efficacy = 5 - (categoryScores.sensitive_low_confidence / 100) * 4;
  }

  return cognitiveScores;
}
