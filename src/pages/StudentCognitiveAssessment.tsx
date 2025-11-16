/**
 * Student Cognitive Assessment Page
 * 
 * Voice-based or web-based cognitive assessment for students
 * 15 questions with 5-point Likert scale
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Brain,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Mic,
  Type,
} from 'lucide-react';
import { submitResponse, completeAssessment } from '@/services/cognitive-assessment-service';
import type { CognitiveQuestion } from '@/services/gemini-cognitive-generator';

interface AssessmentSession {
  id: string;
  student_id: string;
  student_name: string;
  questions: CognitiveQuestion[];
  language: 'en' | 'fr';
}

const LIKERT_SCALE_FR = [
  { value: 1, label: 'Pas du tout comme moi', emoji: '😟' },
  { value: 2, label: 'Un peu comme moi', emoji: '😐' },
  { value: 3, label: 'Parfois comme moi', emoji: '🙂' },
  { value: 4, label: 'Souvent comme moi', emoji: '😊' },
  { value: 5, label: 'Exactement comme moi', emoji: '😄' },
];

const LIKERT_SCALE_EN = [
  { value: 1, label: 'Not at all like me', emoji: '😟' },
  { value: 2, label: 'A bit like me', emoji: '😐' },
  { value: 3, label: 'Sometimes like me', emoji: '🙂' },
  { value: 4, label: 'Mostly like me', emoji: '😊' },
  { value: 5, label: 'Exactly like me', emoji: '😄' },
];

export default function StudentCognitiveAssessment() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [useVoice, setUseVoice] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadAssessmentSession();
    }
  }, [sessionId]);

  const loadAssessmentSession = async () => {
    setIsLoading(true);
    try {
      // Get assessment session
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('cognitive_assessments')
        .select('*, students(name)')
        .eq('id', sessionId)
        .eq('assessment_type', 'student')
        .single();

      if (assessmentError) throw assessmentError;

      if (assessmentData.status === 'completed') {
        setIsComplete(true);
        return;
      }

      // Get questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('cognitive_assessment_questions')
        .select('questions')
        .eq('id', assessmentData.questions_id)
        .single();

      if (questionsError) throw questionsError;

      setSession({
        id: assessmentData.id,
        student_id: assessmentData.student_id,
        student_name: assessmentData.students?.name || 'Student',
        questions: questionsData.questions,
        language: assessmentData.language,
      });

      // Mark as in progress
      await supabase
        .from('cognitive_assessments')
        .update({ status: 'in_progress' })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error loading assessment:', error);
      toast.error('Failed to load assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseChange = (value: number) => {
    if (!session) return;
    
    const currentQuestion = session.questions[currentQuestionIndex];
    setResponses({
      ...responses,
      [currentQuestion.id]: value,
    });
  };

  const handleNext = async () => {
    if (!session) return;

    const currentQuestion = session.questions[currentQuestionIndex];
    const response = responses[currentQuestion.id];

    if (!response) {
      toast.error('Please select an answer before continuing');
      return;
    }

    // Save response to database
    try {
      await submitResponse(session.id, {
        question_id: currentQuestion.id,
        domain: currentQuestion.domain,
        response_value: response,
        response_time_ms: undefined,
        voice_transcript: undefined,
      });

      // Move to next question or complete
      if (currentQuestionIndex < session.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        await handleComplete();
      }
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('Failed to save response');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = async () => {
    if (!session) return;

    setIsSubmitting(true);
    try {
      await completeAssessment(session.id);
      setIsComplete(true);
      toast.success('Assessment completed! Thank you!');
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast.error('Failed to complete assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Thank you for completing the cognitive assessment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your teacher will review your responses and provide personalized learning strategies.
            </p>
            <Button onClick={() => navigate('/')} size="lg">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Not Found</CardTitle>
            <CardDescription>
              This assessment session could not be found or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / session.questions.length) * 100;
  const likertScale = session.language === 'fr' ? LIKERT_SCALE_FR : LIKERT_SCALE_EN;
  const questionText = session.language === 'fr' ? currentQuestion.student_fr : currentQuestion.student_en;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Cognitive Assessment
          </h1>
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {session.questions.length}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Voice/Text Toggle */}
      <div className="flex justify-center gap-2 mb-6">
        <Button
          variant={!useVoice ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUseVoice(false)}
        >
          <Type className="w-4 h-4 mr-2" />
          Text Mode
        </Button>
        <Button
          variant={useVoice ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUseVoice(true)}
          disabled
        >
          <Mic className="w-4 h-4 mr-2" />
          Voice Mode (Coming Soon)
        </Button>
      </div>

      {/* Question Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardDescription className="text-xs uppercase tracking-wide mb-2">
                {currentQuestion.domain.replace(/_/g, ' ')}
              </CardDescription>
              <CardTitle className="text-xl leading-relaxed">
                {questionText}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={responses[currentQuestion.id]?.toString()}
            onValueChange={(value) => handleResponseChange(parseInt(value))}
            className="space-y-3"
          >
            {likertScale.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-3 p-4 rounded-lg border-2 hover:border-primary transition-colors cursor-pointer"
              >
                <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                <Label
                  htmlFor={`option-${option.value}`}
                  className="flex-1 cursor-pointer flex items-center gap-3"
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-base">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!responses[currentQuestion.id] || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : currentQuestionIndex === session.questions.length - 1 ? (
            <>
              Complete
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Take your time and answer honestly. There are no right or wrong answers.</p>
      </div>
    </div>
  );
}
