import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, School, BookOpen, CheckCircle, TrendingUp, Activity } from 'lucide-react';

interface KPIData {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalAssessments: number;
  completedAssessments: number;
  cognitiveAssessments: number;
  teachersBySchool: Array<{ school_name: string; count: number }>;
  classesByGrade: Array<{ grade: string; count: number }>;
  classesBySubject: Array<{ subject: string; count: number }>;
  assessmentsBySubject: Array<{ subject: string; count: number }>;
  recentActivity: Array<{
    date: string;
    teachers: number;
    students: number;
    assessments: number;
  }>;
  engagementMetrics: {
    avgAssessmentsPerTeacher: number;
    avgStudentsPerClass: number;
    assessmentCompletionRate: number;
    activeTeachersLast7Days: number;
  };
}

export default function AdminDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIData();
  }, []);

  async function fetchKPIData() {
    try {
      setLoading(true);

      // Fetch total teachers
      const { count: totalTeachers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher');

      // Fetch total students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Fetch total classes
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      // Fetch total assessments
      const { count: totalAssessments } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true });

      // Fetch completed academic assessments
      const { count: completedAssessments } = await supabase
        .from('assessment_responses')
        .select('*', { count: 'exact', head: true });

      // Fetch cognitive assessments
      const { count: cognitiveAssessments } = await supabase
        .from('cognitive_assessment_responses')
        .select('*', { count: 'exact', head: true });

      // Fetch teachers by school
      const { data: teachersBySchool } = await supabase
        .from('profiles')
        .select('school_name')
        .eq('role', 'teacher')
        .not('school_name', 'is', null);

      const schoolCounts = teachersBySchool?.reduce((acc: any, curr) => {
        const school = curr.school_name || 'Unknown';
        acc[school] = (acc[school] || 0) + 1;
        return acc;
      }, {});

      const teachersBySchoolArray = Object.entries(schoolCounts || {}).map(([school, count]) => ({
        school_name: school,
        count: count as number
      })).sort((a, b) => b.count - a.count);

      // Fetch classes by grade
      const { data: classes } = await supabase
        .from('classes')
        .select('grade, subject');

      const gradeCounts = classes?.reduce((acc: any, curr) => {
        acc[curr.grade] = (acc[curr.grade] || 0) + 1;
        return acc;
      }, {});

      const classesByGrade = Object.entries(gradeCounts || {}).map(([grade, count]) => ({
        grade,
        count: count as number
      })).sort((a, b) => a.grade.localeCompare(b.grade));

      // Fetch classes by subject
      const subjectCounts = classes?.reduce((acc: any, curr) => {
        acc[curr.subject] = (acc[curr.subject] || 0) + 1;
        return acc;
      }, {});

      const classesBySubject = Object.entries(subjectCounts || {}).map(([subject, count]) => ({
        subject,
        count: count as number
      })).sort((a, b) => b.count - a.count);

      // Fetch assessments by subject
      const { data: assessments } = await supabase
        .from('assessments')
        .select('subject');

      const assessmentSubjectCounts = assessments?.reduce((acc: any, curr) => {
        acc[curr.subject] = (acc[curr.subject] || 0) + 1;
        return acc;
      }, {});

      const assessmentsBySubject = Object.entries(assessmentSubjectCounts || {}).map(([subject, count]) => ({
        subject,
        count: count as number
      })).sort((a, b) => b.count - a.count);

      // Fetch recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentTeachers } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('role', 'teacher')
        .gte('created_at', sevenDaysAgo.toISOString());

      const { data: recentStudents } = await supabase
        .from('students')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      const { data: recentAssessmentResponses } = await supabase
        .from('assessment_responses')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      // Group by day
      const activityByDay: any = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        activityByDay[dateStr] = { teachers: 0, students: 0, assessments: 0 };
      }

      recentTeachers?.forEach(t => {
        const date = t.created_at.split('T')[0];
        if (activityByDay[date]) activityByDay[date].teachers++;
      });

      recentStudents?.forEach(s => {
        const date = s.created_at.split('T')[0];
        if (activityByDay[date]) activityByDay[date].students++;
      });

      recentAssessmentResponses?.forEach(a => {
        const date = a.created_at.split('T')[0];
        if (activityByDay[date]) activityByDay[date].assessments++;
      });

      const recentActivity = Object.entries(activityByDay).map(([date, data]: [string, any]) => ({
        date,
        teachers: data.teachers,
        students: data.students,
        assessments: data.assessments
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate engagement metrics
      const avgAssessmentsPerTeacher = totalTeachers ? (totalAssessments || 0) / totalTeachers : 0;

      // Get student count per class
      const { data: studentClassCounts } = await supabase
        .from('students')
        .select('class_id');

      const classStudentCounts = studentClassCounts?.reduce((acc: any, curr) => {
        acc[curr.class_id] = (acc[curr.class_id] || 0) + 1;
        return acc;
      }, {});

      const avgStudentsPerClass = totalClasses && classStudentCounts
        ? Object.values(classStudentCounts).reduce((sum: number, count: any) => sum + count, 0) / totalClasses
        : 0;

      const assessmentCompletionRate = totalAssessments
        ? ((completedAssessments || 0) / (totalAssessments || 1)) * 100
        : 0;

      // Active teachers in last 7 days
      const { count: activeTeachersLast7Days } = await supabase
        .from('assessments')
        .select('teacher_id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      setKpiData({
        totalTeachers: totalTeachers || 0,
        totalStudents: totalStudents || 0,
        totalClasses: totalClasses || 0,
        totalAssessments: totalAssessments || 0,
        completedAssessments: completedAssessments || 0,
        cognitiveAssessments: cognitiveAssessments || 0,
        teachersBySchool: teachersBySchoolArray,
        classesByGrade,
        classesBySubject,
        assessmentsBySubject,
        recentActivity,
        engagementMetrics: {
          avgAssessmentsPerTeacher: Math.round(avgAssessmentsPerTeacher * 10) / 10,
          avgStudentsPerClass: Math.round(avgStudentsPerClass * 10) / 10,
          assessmentCompletionRate: Math.round(assessmentCompletionRate * 10) / 10,
          activeTeachersLast7Days: activeTeachersLast7Days || 0
        }
      });
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading KPI Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Failed to load KPI data</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LearnAura Admin Dashboard</h1>
          <p className="text-muted-foreground">Real-time platform metrics and user engagement</p>
        </div>
        <button
          onClick={fetchKPIData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              {kpiData.engagementMetrics.activeTeachersLast7Days} active (7 days)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Avg {kpiData.engagementMetrics.avgStudentsPerClass} per class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Across {kpiData.teachersBySchool.length} schools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {kpiData.completedAssessments} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
          <CardDescription>Key performance indicators for platform adoption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Avg Assessments/Teacher</p>
              <p className="text-2xl font-bold text-green-600">
                {kpiData.engagementMetrics.avgAssessmentsPerTeacher}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Avg Students/Class</p>
              <p className="text-2xl font-bold text-blue-600">
                {kpiData.engagementMetrics.avgStudentsPerClass}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {kpiData.engagementMetrics.assessmentCompletionRate}%
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Cognitive Assessments</p>
              <p className="text-2xl font-bold text-orange-600">
                {kpiData.cognitiveAssessments}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers by School */}
      <Card>
        <CardHeader>
          <CardTitle>Teachers by School</CardTitle>
          <CardDescription>Distribution of teachers across schools</CardDescription>
        </CardHeader>
        <CardContent>
          {kpiData.teachersBySchool.length > 0 ? (
            <div className="space-y-2">
              {kpiData.teachersBySchool.map(({ school_name, count }) => (
                <div key={school_name} className="flex items-center justify-between border-b pb-2">
                  <span className="font-medium">{school_name}</span>
                  <span className="text-muted-foreground">{count} teachers</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No school data available</p>
          )}
        </CardContent>
      </Card>

      {/* Classes by Grade and Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Classes by Grade</CardTitle>
            <CardDescription>Distribution across grade levels</CardDescription>
          </CardHeader>
          <CardContent>
            {kpiData.classesByGrade.length > 0 ? (
              <div className="space-y-2">
                {kpiData.classesByGrade.map(({ grade, count }) => (
                  <div key={grade} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{grade}</span>
                    <span className="text-muted-foreground">{count} classes</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No grade data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classes by Subject</CardTitle>
            <CardDescription>Most popular subjects</CardDescription>
          </CardHeader>
          <CardContent>
            {kpiData.classesBySubject.length > 0 ? (
              <div className="space-y-2">
                {kpiData.classesBySubject.map(({ subject, count }) => (
                  <div key={subject} className="flex items-center justify-between border-b pb-2">
                    <span className="font-medium">{subject}</span>
                    <span className="text-muted-foreground">{count} classes</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No subject data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assessments by Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments by Subject</CardTitle>
          <CardDescription>Assessment generation across subjects</CardDescription>
        </CardHeader>
        <CardContent>
          {kpiData.assessmentsBySubject.length > 0 ? (
            <div className="space-y-2">
              {kpiData.assessmentsBySubject.map(({ subject, count }) => (
                <div key={subject} className="flex items-center justify-between border-b pb-2">
                  <span className="font-medium">{subject}</span>
                  <span className="text-muted-foreground">{count} assessments</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No assessment data available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
          <CardDescription>Daily platform usage trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {kpiData.recentActivity.map(({ date, teachers, students, assessments }) => (
              <div key={date} className="flex items-center justify-between border-b pb-2">
                <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{teachers} teachers</span>
                  <span>{students} students</span>
                  <span>{assessments} assessments</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hackathon Summary Card */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Hackathon Metrics Summary
          </CardTitle>
          <CardDescription>Key metrics for Blackbox AI x HumanEval evaluation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Adoption & Traction (40%)</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>{kpiData.totalTeachers} teachers</strong> registered across {kpiData.teachersBySchool.length} schools</li>
                <li><strong>{kpiData.totalStudents} students</strong> onboarded</li>
                <li><strong>{kpiData.totalClasses} classes</strong> created</li>
                <li><strong>{kpiData.completedAssessments} assessments</strong> completed</li>
                <li><strong>{kpiData.cognitiveAssessments} cognitive profiles</strong> generated</li>
                <li><strong>{kpiData.engagementMetrics.activeTeachersLast7Days} active teachers</strong> in last 7 days</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Engagement Quality</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Avg <strong>{kpiData.engagementMetrics.avgAssessmentsPerTeacher} assessments/teacher</strong></li>
                <li>Avg <strong>{kpiData.engagementMetrics.avgStudentsPerClass} students/class</strong></li>
                <li><strong>{kpiData.engagementMetrics.assessmentCompletionRate}%</strong> assessment completion rate</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
