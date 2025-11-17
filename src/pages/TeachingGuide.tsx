import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Zap,
  Activity,
  Eye,
  Brain,
  Heart,
  Target,
  Repeat,
  BookOpen,
  Loader2,
} from "lucide-react";
import { StudentCategory, categoryDisplayNames, supabase } from "@/lib/supabase";
import { TeachingGuidePanel } from "@/components/TeachingGuidePanel";

// Category configuration with icons and colors (without student counts - these come from DB)
const categoryConfig: Record<
  StudentCategory,
  { icon: typeof Clock; color: string; description: string }
> = {
  slow_processing: {
    icon: Clock,
    color: "from-blue-500 to-cyan-500",
    description: "Students who need extra time to process information and complete tasks",
  },
  fast_processor: {
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    description: "Students who grasp concepts quickly and need enrichment",
  },
  high_energy: {
    icon: Activity,
    color: "from-green-500 to-emerald-500",
    description: "Students who learn best through movement and hands-on activities",
  },
  visual_learner: {
    icon: Eye,
    color: "from-purple-500 to-pink-500",
    description: "Students who learn best through visual representations and diagrams",
  },
  logical_learner: {
    icon: Brain,
    color: "from-indigo-500 to-blue-500",
    description: "Students who excel with structured, sequential thinking",
  },
  sensitive_low_confidence: {
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    description: "Students who need emotional support and confidence building",
  },
  easily_distracted: {
    icon: Target,
    color: "from-red-500 to-orange-500",
    description: "Students who struggle with sustained attention and focus",
  },
  needs_repetition: {
    icon: Repeat,
    color: "from-teal-500 to-cyan-500",
    description: "Students who benefit from repeated practice and review",
  },
};

export default function TeachingGuide() {
  const [selectedCategory, setSelectedCategory] = useState<StudentCategory | null>(null);
  const [curriculumTopic, setCurriculumTopic] = useState("mathematics");
  const [classData, setClassData] = useState<any>({});
  const [totalStudents, setTotalStudents] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<StudentCategory, number>>({
    slow_processing: 0,
    fast_processor: 0,
    high_energy: 0,
    visual_learner: 0,
    logical_learner: 0,
    sensitive_low_confidence: 0,
    easily_distracted: 0,
    needs_repetition: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    async function fetchClassData() {
      try {
        // Try to get class from localStorage first
        const storedClass = localStorage.getItem("currentClass");
        let classId = storedClass ? JSON.parse(storedClass).id : null;

        if (!classId) {
          // If no class in localStorage, get the first class for the current teacher
          const { data: user } = await supabase.auth.getUser();
          if (user?.user) {
            const { data: classes } = await supabase
              .from("classes")
              .select("*")
              .eq("teacher_id", user.user.id)
              .limit(1);

            if (classes && classes.length > 0) {
              classId = classes[0].id;
              setClassData(classes[0]);
            }
          }
        } else {
          setClassData(JSON.parse(storedClass));
        }

        if (classId) {
          // Fetch students for this class and count by category
          const { data: students, error } = await supabase
            .from("students")
            .select("id, name, primary_category, secondary_category, category_scores")
            .eq("class_id", classId);

          if (error) throw error;

          if (students) {
            setTotalStudents(students.length);

            // Count students by category (using both primary_category and category_scores)
            const counts: Record<StudentCategory, number> = {
              slow_processing: 0,
              fast_processor: 0,
              high_energy: 0,
              visual_learner: 0,
              logical_learner: 0,
              sensitive_low_confidence: 0,
              easily_distracted: 0,
              needs_repetition: 0,
            };

            students.forEach((student) => {
              // First, count by primary_category if set
              if (student.primary_category) {
                counts[student.primary_category as StudentCategory]++;
              }
              // If no primary_category, use category_scores
              else if (student.category_scores) {
                const categories = Object.entries(student.category_scores) as [StudentCategory, number][];
                categories.forEach(([category, score]) => {
                  // Count student in categories where they score >= 50
                  if (score >= 50 && category in counts) {
                    counts[category]++;
                  }
                });
              }
            });

            setCategoryCounts(counts);
          }
        } else {
          // No class found - use demo/default values
          setTotalStudents(30);
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
        // Fallback to demo values
        setTotalStudents(30);
      } finally {
        setLoading(false);
      }
    }

    fetchClassData();
  }, []);

  const handleOpenGuide = (category: StudentCategory) => {
    setSelectedCategory(category);
  };

  const handleClosePanel = () => {
    setSelectedCategory(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your teaching guides...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Teaching Guide</h1>
              <p className="text-muted-foreground">
                AI-powered strategies for every learning profile
              </p>
            </div>
          </div>

          {/* Class Summary */}
          <Card className="bg-gradient-to-br from-pastel-mint/20 to-pastel-sky/20 border-none">
            <CardHeader>
              <CardTitle className="text-lg">Class Intelligence Summary</CardTitle>
              <CardDescription>
                Your class has {totalStudents} students with diverse learning profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This guide combines research from educational websites, teaching blogs, YouTube
                expert videos, and official French Education Nationale curriculum teaching guides to provide you with the most effective strategies for each student
                category. Each guide is generated based on current best practices.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(categoryConfig) as StudentCategory[]).map((category) => {
            const config = categoryConfig[category];
            const Icon = config.icon;
            const studentCount = categoryCounts[category];

            return (
              <Card
                key={category}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {categoryDisplayNames[category]}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1">
                          {studentCount} {studentCount === 1 ? 'student' : 'students'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-3">{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleOpenGuide(category)}
                    className="w-full bg-gradient-to-r from-primary to-info hover:opacity-90"
                    disabled={studentCount === 0}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {studentCount === 0 ? 'No Students in Category' : 'View Teaching Guide'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-pastel-lavender/20 to-pastel-coral/20 border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Powered by AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Each teaching guide is generated in real-time using:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>• Official French Education Nationale curriculum teaching guides</li>
              <li>• Latest educational research and articles</li>
              <li>• Expert teaching videos and demonstrations</li>
              <li>• AI-powered insight generation combining all sources</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Teaching Guide Panel (Drawer/Modal) */}
      {selectedCategory && (
        <TeachingGuidePanel
          category={selectedCategory}
          curriculumTopic={curriculumTopic}
          audience="teacher"
          classId={classData.id || "demo-class"}
          studentCount={categoryCounts[selectedCategory]}
          gradeLevel={classData.grade_level}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
