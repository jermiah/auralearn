/**
 * Cognitive Assessment Management Page (Teacher Interface)
 * 
 * Allows teachers to:
 * - Generate cognitive assessments for students
 * - Preview generated questions
 * - Send parent assessment links
 * - View triangulation results
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Brain,
  Users,
  Send,
  Eye,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Mail,
} from 'lucide-react';
import { generateCognitiveAssessment, type CognitiveQuestion } from '@/services/gemini-cognitive-generator';
import { initiateCognitiveAssessment, generateParentLink } from '@/services/cognitive-assessment-service';

interface Student {
  id: string;
  name: string;
  class_id: string;
  last_assessment_date?: string;
  parent_email?: string;
  assessment_status?: 'pending' | 'student_complete' | 'parent_complete' | 'both_complete';
}

interface Class {
  id: string;
  name: string;
  grade_level: string;
  students: Student[];
}

export default function CognitiveAssessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingForStudent, setGeneratingForStudent] = useState<string | null>(null);
  const [sendingParentLink, setSendingParentLink] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<CognitiveQuestion[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [currentPreviewStudent, setCurrentPreviewStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadClasses();
    }
  }, [user]);

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      // Get all classes for this teacher
      const { data: classesData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('name');

      if (classError) throw classError;

      // Get students for each class with assessment status
      const classesWithStudents = await Promise.all(
        (classesData || []).map(async (cls) => {
          const { data: studentsData } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', cls.id)
            .order('name');

          // Get assessment schedule for each student
          const studentsWithStatus = await Promise.all(
            (studentsData || []).map(async (student) => {
              const { data: scheduleData } = await supabase
                .from('cognitive_assessment_schedule')
                .select('*')
                .eq('student_id', student.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              return {
                ...student,
                last_assessment_date: scheduleData?.last_student_assessment,
                assessment_status: scheduleData
                  ? scheduleData.student_completed && scheduleData.parent_completed
                    ? 'both_complete'
                    : scheduleData.student_completed
                    ? 'student_complete'
                    : scheduleData.parent_completed
                    ? 'parent_complete'
                    : 'pending'
                  : 'pending',
              };
            })
          );

          return {
            ...cls,
            students: studentsWithStatus,
          };
        })
      );

      setClasses(classesWithStudents);
      if (classesWithStudents.length > 0) {
        setSelectedClass(classesWithStudents[0]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAssessment = async (student: Student) => {
    setGeneratingForStudent(student.id);
    try {
      // Generate questions using Gemini
      const assessment = await generateCognitiveAssessment('fr', selectedClass?.grade_level as 'CM1' | 'CM2');

      // Initiate assessment in database
      await initiateCognitiveAssessment(student.id, 'student', 'fr');

      toast.success(`Cognitive assessment generated for ${student.name}`);
      
      // Show preview
      setPreviewQuestions(assessment.questions);
      setCurrentPreviewStudent(student);
      setShowPreviewDialog(true);

      // Reload to update status
      await loadClasses();
    } catch (error) {
      console.error('Error generating assessment:', error);
      toast.error('Failed to generate assessment. Please check your API key configuration.');
    } finally {
      setGeneratingForStudent(null);
    }
  };

  const handleSendParentLink = async (student: Student) => {
    if (!student.parent_email) {
      toast.error('No parent email on file for this student');
      return;
    }

    setSendingParentLink(student.id);
    try {
      const { link } = await generateParentLink(student.id, student.parent_email);

      // In production, send email here
      // For now, copy to clipboard
      await navigator.clipboard.writeText(link);
      
      toast.success(`Parent assessment link copied to clipboard!`);
      toast.info(`Send this link to ${student.parent_email}`);
    } catch (error) {
      console.error('Error generating parent link:', error);
      toast.error('Failed to generate parent link');
    } finally {
      setSendingParentLink(null);
    }
  };

  const handleViewTriangulation = (student: Student) => {
    navigate(`/cognitive-triangulation/${student.id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'both_complete':
        return <Badge className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Complete</Badge>;
      case 'student_complete':
        return <Badge className="bg-blue-600"><Clock className="w-3 h-3 mr-1" />Student Done</Badge>;
      case 'parent_complete':
        return <Badge className="bg-purple-600"><Clock className="w-3 h-3 mr-1" />Parent Done</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Classes Found</CardTitle>
            <CardDescription>
              Create a class first to start cognitive assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/create-class')}>
              Create Class
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            Cognitive Assessments
          </h1>
          <p className="text-muted-foreground mt-1">
            Triangulated assessment: Student self-perception + Parent observation
          </p>
        </div>
      </div>

      {/* Class Selector */}
      <Tabs value={selectedClass?.id} onValueChange={(id) => {
        const cls = classes.find(c => c.id === id);
        if (cls) setSelectedClass(cls);
      }}>
        <TabsList>
          {classes.map((cls) => (
            <TabsTrigger key={cls.id} value={cls.id}>
              {cls.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {classes.map((cls) => (
          <TabsContent key={cls.id} value={cls.id} className="space-y-4">
            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Cognitive Assessments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <strong>15 questions</strong> across 6 validated domains: Processing Speed, Working Memory, 
                  Attention & Focus, Learning Style, Self-Efficacy, and Motivation.
                </p>
                <p>
                  <strong>Research-backed:</strong> Based on MSLQ, BRIEF-2, WISC-V, and UDL principles.
                </p>
                <p>
                  <strong>Triangulation:</strong> Compare student self-perception with parent observation 
                  to identify discrepancies and gain deeper insights.
                </p>
              </CardContent>
            </Card>

            {/* Students List */}
            <div className="grid gap-4">
              {cls.students.map((student) => (
                <Card key={student.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{student.name}</h3>
                          {getStatusBadge(student.assessment_status || 'pending')}
                        </div>
                        {student.last_assessment_date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Last assessment: {new Date(student.last_assessment_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* Generate Assessment Button */}
                        <Button
                          onClick={() => handleGenerateAssessment(student)}
                          disabled={generatingForStudent === student.id}
                          variant="default"
                        >
                          {generatingForStudent === student.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 mr-2" />
                              Generate Assessment
                            </>
                          )}
                        </Button>

                        {/* Send Parent Link Button */}
                        <Button
                          onClick={() => handleSendParentLink(student)}
                          disabled={sendingParentLink === student.id || !student.parent_email}
                          variant="outline"
                        >
                          {sendingParentLink === student.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Parent Link
                            </>
                          )}
                        </Button>

                        {/* View Triangulation Button */}
                        {student.assessment_status === 'both_complete' && (
                          <Button
                            onClick={() => handleViewTriangulation(student)}
                            variant="secondary"
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            View Analysis
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {cls.students.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No students in this class yet
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Assessment Preview - {currentPreviewStudent?.name}
            </DialogTitle>
            <DialogDescription>
              15 questions across 6 cognitive domains (French + English)
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {previewQuestions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          Question {index + 1} - {question.domain.replace(/_/g, ' ').toUpperCase()}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <strong>Student (FR):</strong> {question.student_fr}
                        </CardDescription>
                        <CardDescription className="mt-1">
                          <strong>Parent (FR):</strong> {question.parent_fr}
                        </CardDescription>
                      </div>
                      {question.reverse && (
                        <Badge variant="secondary">Reverse Scored</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>English (Student):</strong> {question.student_en}</p>
                      <p><strong>English (Parent):</strong> {question.parent_en}</p>
                      <p className="text-muted-foreground">
                        <strong>Research:</strong> {question.research_basis}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
