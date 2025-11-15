import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StudentResult {
  id: string;
  name: string;
  score: number;
  level: number;
  color: "struggling" | "attention" | "ontrack" | "advanced";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentResult[]>([]);

  useEffect(() => {
    const results = localStorage.getItem("assessmentResults");
    if (!results) {
      navigate("/create-class");
      return;
    }
    setStudents(JSON.parse(results));
  }, [navigate]);

  const getColorClass = (color: string) => {
    switch (color) {
      case "struggling": return "bg-level-struggling text-white";
      case "attention": return "bg-level-attention text-white";
      case "ontrack": return "bg-level-ontrack text-white";
      case "advanced": return "bg-level-advanced text-white";
      default: return "bg-muted";
    }
  };

  const getLevelIcon = (level: number) => {
    if (level <= 2) return <TrendingDown className="w-4 h-4" />;
    if (level <= 3) return <Minus className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  const stats = {
    struggling: students.filter(s => s.level <= 2).length,
    attention: students.filter(s => s.level === 3).length,
    ontrack: students.filter(s => s.level === 4).length,
    advanced: students.filter(s => s.level === 5).length,
    avgScore: Math.round(students.reduce((acc, s) => acc + s.score, 0) / students.length)
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Student Dashboard</h1>
        <p className="text-muted-foreground">Real-time classroom intelligence and insights</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-level-struggling/10 to-white">
          <div className="text-3xl font-bold text-level-struggling mb-1">{stats.struggling}</div>
          <div className="text-sm text-muted-foreground">Struggling</div>
        </Card>
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-level-attention/10 to-white">
          <div className="text-3xl font-bold text-level-attention mb-1">{stats.attention}</div>
          <div className="text-sm text-muted-foreground">Needs Attention</div>
        </Card>
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-level-ontrack/10 to-white">
          <div className="text-3xl font-bold text-level-ontrack mb-1">{stats.ontrack}</div>
          <div className="text-sm text-muted-foreground">On Track</div>
        </Card>
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-level-advanced/10 to-white">
          <div className="text-3xl font-bold text-level-advanced mb-1">{stats.advanced}</div>
          <div className="text-sm text-muted-foreground">Advanced</div>
        </Card>
        <Card className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-white">
          <div className="text-3xl font-bold text-primary mb-1">{stats.avgScore}%</div>
          <div className="text-sm text-muted-foreground">Avg Score</div>
        </Card>
      </div>

      <Card className="p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-foreground mb-6">Class Heatmap</h2>
        <div className="grid grid-cols-6 gap-3">
          {students.map((student) => (
            <div
              key={student.id}
              className={`p-4 rounded-xl ${getColorClass(student.color)} shadow-sm hover:shadow-md transition-all cursor-pointer group relative`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-sm font-bold">
                  {student.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold truncate w-full">{student.name.split(" ")[0]}</div>
                  <div className="text-xs opacity-90">Level {student.level}</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/80 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs p-2">
                <div className="font-bold mb-1">{student.name}</div>
                <div>Score: {student.score}%</div>
                <div>Level: {student.level}/5</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 rounded-2xl">
        <h2 className="text-2xl font-bold text-foreground mb-4">Detailed Student List</h2>
        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-all"
            >
              <div className={`w-12 h-12 rounded-full ${getColorClass(student.color)} flex items-center justify-center text-sm font-bold`}>
                {student.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{student.name}</div>
                <div className="text-sm text-muted-foreground">
                  {student.level <= 2 ? "Visual learner, needs repetition" : 
                   student.level === 3 ? "Logical thinker, easily distracted" :
                   student.level === 4 ? "Fast processor, verbal learner" :
                   "Advanced, high confidence"}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{student.score}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-card">
                  {getLevelIcon(student.level)}
                  <span className="text-sm font-medium">Level {student.level}</span>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg">
                  <Eye className="w-4 h-4 mr-1" />
                  Profile
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button onClick={() => navigate("/insights")} size="lg" className="rounded-xl px-8">
          View Class Insights
        </Button>
      </div>
    </div>
  );
}
