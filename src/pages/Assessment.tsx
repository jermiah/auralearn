import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Link2, Copy, Users, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedClassId, setCopiedClassId] = useState<string | null>(null);

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

  const getAssessmentLink = (classId: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/student-selection/${classId}`;
  };

  const copyToClipboard = async (classId: string) => {
    const link = getAssessmentLink(classId);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedClassId(classId);
      toast.success(t('assessment.linkCopied'));
      setTimeout(() => setCopiedClassId(null), 2000);
    } catch (error) {
      toast.error(t('assessment.linkCopyFailed'));
    }
  };

  const openAssessmentLink = (classId: string) => {
    const link = getAssessmentLink(classId);
    window.open(link, "_blank");
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">{t('assessment.title')}</h1>
        <p className="text-muted-foreground">
          {t('assessment.description')}
        </p>
      </div>

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
        <div className="grid gap-4">
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
                <div className="p-4 bg-secondary rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{t('assessment.assessmentLink')}</span>
                  </div>
                  <code className="block text-sm bg-card p-3 rounded-lg border break-all">
                    {getAssessmentLink(classItem.id)}
                  </code>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(classItem.id)}
                    className="flex-1 rounded-xl"
                    variant={copiedClassId === classItem.id ? "secondary" : "default"}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copiedClassId === classItem.id ? t('assessment.copied') : t('assessment.copyLink')}
                  </Button>
                  <Button
                    onClick={() => openAssessmentLink(classItem.id)}
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t('assessment.openLink')}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  <p className="font-medium mb-1">{t('assessment.howToUse')}</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>{t('assessment.instructions.step1')}</li>
                    <li>{t('assessment.instructions.step2')}</li>
                    <li>{t('assessment.instructions.step3')}</li>
                    <li>{t('assessment.instructions.step4')}</li>
                  </ol>
                </div>
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
  );
}
