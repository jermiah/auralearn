import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  category: string;
  difficulty_level: number;
  question_type: string;
  base_question: string;
  options: { value: string; label: string }[];
  correct_answer: string;
  explanation: string;
}

interface Answer {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  time_taken: number;
}

interface AssessmentResult {
  score: number;
  total_questions: number;
  category_determined: string;
  confidence_score: number;
  time_taken: number;
}

const StudentAssessment = () => {
  const { classId, studentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [student, setStudent] = useState<{ id: string; name: string } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    loadStudentAndQuestions();
  }, [classId, studentId]);

  const loadStudentAndQuestions = async () => {
    setIsLoading(true);

    try {
      // Load student info
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("id, name")
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Load assessment questions (adaptive difficulty)
      const { data: questionsData, error: questionsError } = await supabase
        .from("assessment_questions")
        .select("*")
        .eq("is_active", true)
        .order("difficulty_level");

      if (questionsError) throw questionsError;

      // Select 10 questions with adaptive difficulty (start medium)
      const selectedQuestions = selectAdaptiveQuestions(questionsData || []);
      setQuestions(selectedQuestions);
    } catch (error: any) {
      console.error("Error loading assessment:", error);
      toast({
        title: "Error",
        description: "Failed to load assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectAdaptiveQuestions = (allQuestions: any[]): Question[] => {
    // Start with medium difficulty (5-6)
    // We'll implement true adaptive logic in the handleNext function
    const startingDifficulty = 5;

    // Get 10 questions starting at medium difficulty
    const selectedQuestions: Question[] = [];
    const usedIds = new Set<string>();

    // Group questions by difficulty
    const questionsByDifficulty = allQuestions.reduce((acc, q) => {
      if (!acc[q.difficulty_level]) {
        acc[q.difficulty_level] = [];
      }
      acc[q.difficulty_level].push(q);
      return acc;
    }, {} as Record<number, any[]>);

    let currentDifficulty = startingDifficulty;

    for (let i = 0; i < 10; i++) {
      const availableQuestions = questionsByDifficulty[currentDifficulty] || [];
      const unusedQuestions = availableQuestions.filter(q => !usedIds.has(q.id));

      if (unusedQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
        const selectedQuestion = unusedQuestions[randomIndex];
        selectedQuestions.push(selectedQuestion);
        usedIds.add(selectedQuestion.id);
      }
    }

    return selectedQuestions;
  };

  const startAssessment = () => {
    setAssessmentStarted(true);
    setStartTime(new Date());
    setQuestionStartTime(new Date());
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      toast({
        title: "Please select an answer",
        description: "You must select an answer before continuing.",
        variant: "destructive",
      });
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    const timeTaken = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);

    // Record answer
    const newAnswer: Answer = {
      question_id: currentQuestion.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      time_taken: timeTaken,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
      setQuestionStartTime(new Date());
    } else {
      // Assessment complete
      submitAssessment(updatedAnswers);
    }
  };

  const calculateCategoryAndScore = (answers: Answer[]): { category: string; confidence: number } => {
    const correctCount = answers.filter(a => a.is_correct).length;
    const scorePercentage = (correctCount / answers.length) * 100;

    // Determine category based on score
    let category = "average_learner";
    let confidence = 0.5;

    if (scorePercentage >= 80) {
      category = "fast_processor";
      confidence = 0.85;
    } else if (scorePercentage >= 70) {
      category = "logical_learner";
      confidence = 0.75;
    } else if (scorePercentage >= 50) {
      category = "visual_learner";
      confidence = 0.65;
    } else if (scorePercentage >= 40) {
      category = "high_energy";
      confidence = 0.60;
    } else if (scorePercentage >= 30) {
      category = "needs_repetition";
      confidence = 0.70;
    } else {
      category = "slow_processing";
      confidence = 0.75;
    }

    // Adjust confidence based on answer consistency
    const avgTimeTaken = answers.reduce((sum, a) => sum + a.time_taken, 0) / answers.length;
    if (avgTimeTaken < 10) {
      confidence -= 0.1; // Too fast might indicate guessing
    } else if (avgTimeTaken > 60) {
      confidence -= 0.05; // Very slow might indicate uncertainty
    }

    return { category, confidence: Math.max(0.5, Math.min(1.0, confidence)) };
  };

  const submitAssessment = async (finalAnswers: Answer[]) => {
    setIsSubmitting(true);

    try {
      const totalTimeTaken = Math.floor((new Date().getTime() - (startTime?.getTime() || 0)) / 1000);
      const correctCount = finalAnswers.filter(a => a.is_correct).length;
      const { category, confidence } = calculateCategoryAndScore(finalAnswers);

      // Save to database
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("student_assessments")
        .insert({
          student_id: studentId,
          questions_data: questions,
          answers: finalAnswers,
          score: correctCount,
          total_questions: questions.length,
          category_determined: category,
          confidence_score: confidence,
          time_taken: totalTimeTaken,
          started_at: startTime?.toISOString(),
          completed_at: new Date().toISOString(),
          needs_reassessment: false,
          next_assessment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Update student's primary category
      await supabase
        .from("students")
        .update({ primary_category: category })
        .eq("id", studentId);

      // Show results
      setResult({
        score: correctCount,
        total_questions: questions.length,
        category_determined: category,
        confidence_score: confidence,
        time_taken: totalTimeTaken,
      });
      setShowResult(true);

      toast({
        title: "Assessment Complete!",
        description: `You scored ${correctCount} out of ${questions.length}. Great job!`,
      });
    } catch (error: any) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to submit assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryDisplayName = (category: string): string => {
    const categoryNames: Record<string, string> = {
      slow_processing: "Slow Processing",
      fast_processor: "Fast Processor",
      high_energy: "High Energy",
      visual_learner: "Visual Learner",
      logical_learner: "Logical Learner",
      sensitive_low_confidence: "Sensitive/Low Confidence",
      easily_distracted: "Easily Distracted",
      needs_repetition: "Needs Repetition",
      average_learner: "Average Learner",
    };
    return categoryNames[category] || category;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Assessment Complete!</CardTitle>
            <CardDescription className="text-lg">
              Great job, {student?.name}! Here are your results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Score</p>
                <p className="text-3xl font-bold text-blue-600">
                  {result.score}/{result.total_questions}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.round((result.score / result.total_questions) * 100)}%
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600 mb-1">Time Taken</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.floor(result.time_taken / 60)}m {result.time_taken % 60}s
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Learning Profile</p>
              <p className="text-2xl font-bold text-gray-800 mb-2">
                {getCategoryDisplayName(result.category_determined)}
              </p>
              <div className="flex items-center gap-2">
                <Progress value={result.confidence_score * 100} className="flex-1" />
                <span className="text-sm font-medium text-gray-600">
                  {Math.round(result.confidence_score * 100)}% confidence
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Your teacher will receive these results</strong> and will create a personalized
                learning plan just for you. You'll be able to take another assessment in 30 days to track your progress!
              </p>
            </div>

            <Button
              onClick={() => navigate(`/student-selection/${classId}`)}
              className="w-full"
              size="lg"
            >
              Back to Student Selection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessmentStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-2">Welcome, {student?.name}!</CardTitle>
            <CardDescription className="text-lg">
              You're about to start your learning assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg space-y-3">
              <h3 className="font-semibold text-lg text-blue-900">Assessment Guidelines:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <Circle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>You will answer <strong>10 questions</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Take your time and read each question carefully</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>There are no wrong answers - just do your best!</span>
                </li>
                <li className="flex items-start gap-2">
                  <Circle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Your teacher will use these results to help you learn better</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={startAssessment}
              className="w-full"
              size="lg"
              disabled={questions.length === 0}
            >
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {student?.name}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{currentQuestion.base_question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
              {currentQuestion.options?.map((option: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedAnswer === option.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleAnswerSelect(option.value)}
                >
                  <RadioGroupItem value={option.value} id={`option-${index}`} />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer text-base"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleNext}
                disabled={!selectedAnswer || isSubmitting}
                className="flex-1"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : currentQuestionIndex === questions.length - 1 ? (
                  "Submit Assessment"
                ) : (
                  "Next Question"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAssessment;
