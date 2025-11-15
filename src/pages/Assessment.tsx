import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Brain, ChevronRight } from "lucide-react";

interface Question {
  id: number;
  text: string;
  type: string;
  options: string[];
  correct: number;
}

const assessmentQuestions: Question[] = [
  {
    id: 1,
    text: "What comes next in the pattern: 2, 4, 6, 8, ?",
    type: "pattern",
    options: ["9", "10", "11", "12"],
    correct: 1
  },
  {
    id: 2,
    text: "If all roses are flowers and some flowers are red, can we conclude that some roses are red?",
    type: "logic",
    options: ["Yes, definitely", "No, not necessarily", "Sometimes", "Cannot determine"],
    correct: 1
  },
  {
    id: 3,
    text: "Arrange in order: seed, flower, fruit, plant",
    type: "sequencing",
    options: ["seed→plant→flower→fruit", "plant→seed→flower→fruit", "seed→flower→plant→fruit", "flower→seed→plant→fruit"],
    correct: 0
  },
  {
    id: 4,
    text: "What is 15% of 200?",
    type: "math",
    options: ["20", "25", "30", "35"],
    correct: 2
  },
  {
    id: 5,
    text: "Which word is the odd one out: run, walk, swim, blue?",
    type: "logic",
    options: ["run", "walk", "swim", "blue"],
    correct: 3
  },
  {
    id: 6,
    text: "If 3x + 5 = 20, what is x?",
    type: "math",
    options: ["3", "4", "5", "6"],
    correct: 2
  },
  {
    id: 7,
    text: "Complete: Triangle has 3 sides, Square has 4 sides, Pentagon has __ sides",
    type: "pattern",
    options: ["4", "5", "6", "7"],
    correct: 1
  },
  {
    id: 8,
    text: "A story's main character learns to be brave. What is the theme?",
    type: "reading",
    options: ["Friendship", "Courage", "Nature", "Technology"],
    correct: 1
  }
];

export default function Assessment() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const classData = localStorage.getItem("currentClass");
    if (!classData) {
      toast.error("No class data found");
      navigate("/create-class");
      return;
    }
    const parsed = JSON.parse(classData);
    setStudents(parsed.students);
    setSelectedStudent(parsed.students[0]?.id);
  }, [navigate]);

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers({ ...answers, [questionId]: answerIndex });
  };

  const nextQuestion = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const completeAssessment = () => {
    if (Object.keys(answers).length < assessmentQuestions.length) {
      toast.error("Please answer all questions");
      return;
    }

    // Calculate score
    let correct = 0;
    assessmentQuestions.forEach(q => {
      if (answers[q.id] === q.correct) correct++;
    });
    const score = Math.round((correct / assessmentQuestions.length) * 100);

    // Generate demo data for all students
    const studentResults = students.map((student, index) => {
      const isLiveStudent = student.id === selectedStudent;
      const studentScore = isLiveStudent ? score : Math.floor(Math.random() * 40) + 50;
      const level = studentScore < 50 ? 1 : studentScore < 65 ? 2 : studentScore < 80 ? 3 : studentScore < 90 ? 4 : 5;
      
      return {
        ...student,
        score: studentScore,
        level,
        color: level <= 2 ? "struggling" : level === 3 ? "attention" : level === 4 ? "ontrack" : "advanced"
      };
    });

    localStorage.setItem("assessmentResults", JSON.stringify(studentResults));
    toast.success("Assessment complete! Generating insights...");
    navigate("/dashboard");
  };

  const question = assessmentQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;

  if (students.length === 0) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Adaptive Assessment</h1>
        <p className="text-muted-foreground">
          Assessing: <span className="font-semibold text-primary">
            {students.find(s => s.id === selectedStudent)?.name}
          </span> (29 others auto-completed)
        </p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Question {currentQuestion + 1} of {assessmentQuestions.length}
          </span>
          <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-info transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card className="p-8 rounded-2xl shadow-lg">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-pastel-mint text-primary text-xs font-medium mb-3">
                {question.type.toUpperCase()}
              </div>
              <h3 className="text-xl font-semibold text-foreground">{question.text}</h3>
            </div>
          </div>

          <RadioGroup
            value={answers[question.id]?.toString()}
            onValueChange={(value) => handleAnswer(question.id, parseInt(value))}
          >
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    answers[question.id] === index
                      ? "border-primary bg-pastel-mint"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                  onClick={() => handleAnswer(question.id, index)}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-medium">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={previousQuestion}
          disabled={currentQuestion === 0}
          className="rounded-xl"
        >
          Previous
        </Button>

        {currentQuestion === assessmentQuestions.length - 1 ? (
          <Button onClick={completeAssessment} className="rounded-xl px-8">
            Complete Assessment
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={nextQuestion}
            disabled={answers[question.id] === undefined}
            className="rounded-xl"
          >
            Next Question
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
