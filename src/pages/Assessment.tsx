import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Link2, Copy, Users, ExternalLink, AlertCircle, Loader2, Sparkles, 
  Eye, RefreshCw, Mail, User, Shield, Download 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth, SubjectType, GradeLevelType } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { generateAssessmentQuestions, AssessmentQuestion } from "@/services/gemini-assessment-generator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getClassStudentsWithTokens, 
  generateTokenAssessmentLink,
  regenerateAssessmentToken,
  type Student 
} from "@/services/assessment-token-service";

interface Class {
  id: string;
  name: string;
  grade_level: string | null;
  subject: string | null;
  student_count: number;
}

export default function Assessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [generatingForClass, setGeneratingForClass] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<AssessmentQuestion[]>([]);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [currentPreviewClass, setCurrentPreviewClass] = useState<Class | null>(null);
  const [selectedClassStudents, setSelectedClassStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<string | null>(null);
  const [regeneratingToken, setRegeneratingToken] = useState<string | null>(null);

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
        .from("classes")
        .select("id, name, grade_level, subject")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (classError) throw classError;

      // For each class, count students
      const classesWithCounts = await Promise.all(
        (classesData || []).map(async (classItem) => {
          const { count } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classItem.id);

          return {
            ...classItem,
            student_count: count || 0,
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error: any) {
      console.error("Error loading classes:", error);
      toast.error(t('assessment.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentsForClass = async (classId: string) => {
    setLoadingStudents(classId);
    try {
      const students = await getClassStudentsWithTokens(classId);
      setSelectedClassStudents(students);
    } catch (error: any) {
      console.error("Error loading students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoadingStudents(null);
    }
  };

  const generateQuestionsPreview = async (classItem: Class) => {
    setGeneratingForClass(classItem.id);
    setCurrentPreviewClass(classItem);
    
    try {
      const subject = (user?.primary_subject || 'mathematiques') as SubjectType;
      const gradeLevel = (user?.primary_grade_level || 'CM1') as GradeLevelType;
      const language = i18n.language.startsWith('fr') ? 'fr' : 'en';

      toast.info(t('assessment.generatingQuestions') || 'Generating AI questions...');

      const questions = await generateAssessmentQuestions(
        { subject, gradeLevel, language: language as 'en' | 'fr' },
        10
      );

      setPreviewQuestions(questions);
      setShowPreviewDialog(true);
      
      toast.success(t('assessment.questionsGenerated') || 'Questions generated successfully!');
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast.error(error.message || 'Failed to generate questions. Please try again.');
    } finally {
      setGeneratingForClass(null);
    }
  };

  const regenerateQuestions = async () => {
    if (!currentPreviewClass) return;
    setShowPreviewDialog(false);
    await generateQuestionsPreview(currentPreviewClass);
  };

  const getClassWideLink = (classId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/student-selection/${classId}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleRegenerateToken = async (studentId: string, studentName: string) => {
    setRegeneratingToken(studentId);
    try {
      const newToken = await regenerateAssessmentToken(studentId);
      if (newToken) {
        toast.success(`New token generated for ${studentName}`);
        // Reload students to show new token
        if (selectedClassStudents.length > 0) {
          const classId = selectedClassStudents[0].class_id;
          await loadStudentsForClass(classId);
        }
      } else {
        toast.error('Failed to regenerate token');
      }
    } catch (error) {
      console.error('Error regenerating token:', error);
      toast.error('Failed to regenerate token');
    } finally {
      setRegeneratingToken(null);
    }
  };

  const downloadStudentLinks = (classItem: Class, students: Student[]) => {
    const csv = [
      ['Student Name', 'Token Link', 'Parent Email', 'Parent Email 2', 'Category'].join(','),
      ...students.map(s => [
        s.name,
        generateTokenAssessmentLink(s.assessment_token),
        s.parent_email || '',
        s.parent_email_2 || '',
        s.primary_category || 'Not assessed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${classItem.name}-assessment-links.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">{t('assessment.loadingClasses')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('assessment.title')}</h1>
          <p className="text-muted-foreground">
            Share assessment links with your students - choose between secure individual links or class-wide access
          </p>
        </div>

        {/* AI Generation Info Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Curriculum-Aligned Smart Assessments</h3>
                <p className="text-sm text-muted-foreground">
                  Every question is generated directly from the official French national curriculum.
Assessments are fully aligned with the required learning objectives and offer a clear view of how well students understand the expected knowledge.
Their results help teachers follow progress over time and support each student more effectively
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {classes.length === 0 ? (
          <Card className="p-12 rounded-2xl text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">{t('assessment.noClasses.title')}</h3>
            <p className="text-gray-500 mb-6">
              {t('assessment.noClasses.description')}
            </p>
            <Button onClick={() => navigate("/create-class")} size="lg">
              {t('assessment.noClasses.action')}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6">
            {classes.map((classItem) => (
              <Card key={classItem.id} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{classItem.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {classItem.grade_level && <span>{classItem.grade_level}</span>}
                        {classItem.grade_level && classItem.subject && <span> • </span>}
                        {classItem.subject && <span>{classItem.subject}</span>}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {classItem.student_count} {classItem.student_count === 1 ? t('assessment.student') : t('assessment.students')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview Questions Button */}
                  <Button
                    onClick={() => generateQuestionsPreview(classItem)}
                    disabled={generatingForClass === classItem.id}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    {generatingForClass === classItem.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating AI Questions...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Preview AI-Generated Questions
                      </>
                    )}
                  </Button>

                  {/* Tabs for Individual vs Class-Wide Links */}
                  <Tabs defaultValue="individual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger 
                        value="individual"
                        onClick={() => {
                          if (selectedClassStudents.length === 0 || selectedClassStudents[0].class_id !== classItem.id) {
                            loadStudentsForClass(classItem.id);
                          }
                        }}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Individual Links (Secure)
                      </TabsTrigger>
                      <TabsTrigger value="classwide">
                        <Users className="w-4 h-4 mr-2" />
                        Class-Wide Link
                      </TabsTrigger>
                    </TabsList>

                    {/* Individual Student Links Tab */}
                    <TabsContent value="individual" className="space-y-4 mt-4">
                      {loadingStudents === classItem.id ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                      ) : selectedClassStudents.length > 0 && selectedClassStudents[0].class_id === classItem.id ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-muted-foreground">
                              Secure, personalized links for each student
                            </p>
                            <Button
                              onClick={() => downloadStudentLinks(classItem, selectedClassStudents)}
                              variant="outline"
                              size="sm"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download CSV
                            </Button>
                          </div>
                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                              {selectedClassStudents.map((student) => {
                                const tokenLink = generateTokenAssessmentLink(student.assessment_token);
                                return (
                                  <Card key={student.id} className="p-4">
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                          <User className="w-4 h-4 text-muted-foreground" />
                                          <div>
                                            <p className="font-semibold">{student.name}</p>
                                            {student.primary_category && (
                                              <Badge variant="outline" className="text-xs mt-1">
                                                {student.primary_category}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {student.parent_email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Mail className="w-3 h-3" />
                                          <span>{student.parent_email}</span>
                                        </div>
                                      )}

                                      <div className="bg-secondary p-2 rounded text-xs break-all">
                                        {tokenLink}
                                      </div>

                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => copyToClipboard(tokenLink, student.name)}
                                          variant={copiedLink === tokenLink ? "secondary" : "default"}
                                          size="sm"
                                          className="flex-1"
                                        >
                                          <Copy className="w-3 h-3 mr-1" />
                                          {copiedLink === tokenLink ? 'Copied!' : 'Copy Link'}
                                        </Button>
                                        <Button
                                          onClick={() => handleRegenerateToken(student.id, student.name)}
                                          variant="outline"
                                          size="sm"
                                          disabled={regeneratingToken === student.id}
                                        >
                                          {regeneratingToken === student.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <RefreshCw className="w-3 h-3" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Click "Individual Links" tab to load student links
                        </div>
                      )}
                    </TabsContent>

                    {/* Class-Wide Link Tab */}
                    <TabsContent value="classwide" className="space-y-4 mt-4">
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-400 p-4 rounded">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Note:</strong> This link allows any student to select any name. 
                          Use individual links for better security and tracking.
                        </p>
                      </div>

                      <div className="p-4 bg-secondary rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Class-Wide Assessment Link</span>
                        </div>
                        <code className="block text-sm bg-card p-3 rounded-lg border break-all">
                          {getClassWideLink(classItem.id)}
                        </code>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(getClassWideLink(classItem.id), 'Class link')}
                          className="flex-1 rounded-xl"
                          variant={copiedLink === getClassWideLink(classItem.id) ? "secondary" : "default"}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copiedLink === getClassWideLink(classItem.id) ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                          onClick={() => window.open(getClassWideLink(classItem.id), "_blank")}
                          variant="outline"
                          className="flex-1 rounded-xl"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Link
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        <p className="font-medium mb-1">How to use:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Copy the link above</li>
                          <li>Share with students via email, LMS, or classroom platform</li>
                          <li>Students select their name and complete assessment</li>
                          <li>View results in Dashboard</li>
                        </ol>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" onClick={() => navigate("/create-class")} className="rounded-xl">
            {t('assessment.createNewClass')}
          </Button>
          <Button onClick={() => navigate("/dashboard")} className="rounded-xl">
            {t('assessment.viewDashboard')}
          </Button>
        </div>
      </div>

      {/* Question Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              AI-Generated Assessment Preview
            </DialogTitle>
            <DialogDescription>
              Preview of 10 questions generated for {currentPreviewClass?.name}. 
              Students will see similar questions when they take the assessment.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {previewQuestions.map((question, index) => (
                <Card key={question.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-lg">
                        Question {index + 1}
                      </h4>
                      <Badge variant="outline">
                        Difficulty: {question.difficulty_level}/10
                      </Badge>
                    </div>
                    
                    <p className="text-base">{question.question}</p>
                    
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div
                          key={option.value}
                          className={`p-3 rounded-lg border-2 ${
                            option.value === question.correct_answer
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{option.value}.</span>
                            <span>{option.label}</span>
                            {option.value === question.correct_answer && (
                              <Badge variant="default" className="ml-auto bg-green-600">
                                Correct Answer
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{question.category}</Badge>
                      <Badge variant="secondary">{question.subject}</Badge>
                      <Badge variant="secondary">{question.grade_level}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={regenerateQuestions}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generate New Questions
            </Button>
            <Button
              onClick={() => setShowPreviewDialog(false)}
              className="flex-1"
            >
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
