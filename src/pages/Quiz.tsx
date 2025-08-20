
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { mongodbClient } from '@/integrations/mongodb/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import AIRecommendations from '@/components/AIRecommendations';
import AnswerExplanations from '@/components/AnswerExplanations';

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizCategory {
  _id: string;
  name: string;
  color: string;
}

interface AIGeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const Quiz = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isTimedMode, setIsTimedMode] = useState(true);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [answerExplanations, setAnswerExplanations] = useState<any>(null);
  const [explanationsLoading, setExplanationsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [category, setCategory] = useState<QuizCategory | null>(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);

  // Check if this is an AI-generated quiz
  useEffect(() => {
    if (categoryId === 'ai-generated') {
      const storedQuiz = localStorage.getItem('aiGeneratedQuiz');
      if (storedQuiz) {
        const aiQuiz = JSON.parse(storedQuiz);
        const convertedQuestions: Question[] = aiQuiz.questions.map((q: AIGeneratedQuestion, index: number) => ({
          _id: `ai-${index}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }));
        setQuestions(convertedQuestions);
        setCategory({
          _id: 'ai-generated',
          name: `AI: ${aiQuiz.topic}`,
          color: 'purple'
        });
        setIsAIGenerated(true);
      } else {
        toast({
          title: "Quiz Not Found",
          description: "No AI-generated quiz found. Please generate a new one.",
          variant: "destructive",
        });
        navigate('/ai-quiz-generator');
      }
    }
  }, [categoryId, navigate, toast]);

  // Fetch regular quiz questions
  const { data: regularQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['quiz-questions', categoryId],
    queryFn: async () => {
      // Fetch more questions and randomize
      return await mongodbClient.getQuizQuestions(categoryId as string, { count: 20, random: true });
    },
    enabled: !!categoryId && categoryId !== 'ai-generated',
  });

  // Fetch category info for regular quizzes
  const { data: regularCategory } = useQuery({
    queryKey: ['quiz-category', categoryId],
    queryFn: async () => {
      const categories = await mongodbClient.getQuizCategories();
      return categories.find(cat => cat._id === categoryId);
    },
    enabled: !!categoryId && categoryId !== 'ai-generated',
  });

  // Set questions and category for regular quizzes
  useEffect(() => {
    if (!isAIGenerated && regularQuestions.length > 0) {
      setQuestions(regularQuestions);
    }
  }, [regularQuestions, isAIGenerated]);

  useEffect(() => {
    if (!isAIGenerated && regularCategory) {
      setCategory(regularCategory);
    }
  }, [regularCategory, isAIGenerated]);

  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;

  useEffect(() => {
    if (isTimedMode && timeLeft > 0 && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !quizCompleted) {
      handleQuizComplete();
    }
  }, [timeLeft, isTimedMode, quizCompleted]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestion] = selectedAnswer;
      setUserAnswers(newAnswers);

      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(userAnswers[currentQuestion + 1] ?? null);
      } else {
        handleQuizComplete();
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(userAnswers[currentQuestion - 1] ?? null);
    }
  };

  const handleQuizComplete = async () => {
    if (!user) return;

    const finalAnswers = [...userAnswers];
    if (selectedAnswer !== null && currentQuestion < totalQuestions) {
      finalAnswers[currentQuestion] = selectedAnswer;
    }
    
    // Ensure we have answers for all questions
    while (finalAnswers.length < totalQuestions) {
      finalAnswers.push(-1); // Use -1 for unanswered questions
    }

    const score = calculateScore(finalAnswers);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      // Only save to database if it's not an AI-generated quiz
      if (!isAIGenerated && categoryId) {
        const quizAttempt = await mongodbClient.createQuizAttempt({
          categoryId,
          score,
          totalQuestions,
          timeTaken,
          answers: finalAnswers.map((answer, index) => ({
            questionId: questions[index]._id,
            selectedAnswer: answer,
            isCorrect: answer === questions[index].correctAnswer,
          })),
        });

        // Generate AI analysis for regular quizzes if score is low
        const percentage = (score / totalQuestions) * 100;
        if (percentage < 80) {
          setAnalysisLoading(true);
          try {
            // Build simple weak areas from incorrect answers (top 3)
            const incorrect = questions
              .map((q, i) => ({ question: q, index: i, correct: finalAnswers[i] === q.correctAnswer }))
              .filter(x => !x.correct)
              .slice(0, 3);

            const weakAreaTopics = incorrect.map(x => x.question.question);

            // Persist minimal analysis for history
            await mongodbClient.createAIAnalysis({
              quizAttemptId: (quizAttempt as any)._id,
              overallFeedback: `You scored ${score}/${totalQuestions} (${Math.round(percentage)}%). Focus on the missed topics below.`,
              weakAreas: weakAreaTopics,
              studyRecommendations: [
                'Review explanations for incorrect answers',
                'Revisit notes for this category',
                'Practice 5–10 more questions in this topic'
              ],
              nextSteps: [
                'Retake the quiz after review',
                'Aim for at least 80% on the next attempt'
              ]
            });

            // Prepare richer client-side analysis object for immediate display
            const localWeakAreas = incorrect.map((x, idx) => ({
              topic: x.question.question,
              description: x.question.explanation || 'Review this concept and try a few practice questions.',
              priority: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low'
            }));

            const localStudyRecommendations = [
              {
                topic: category?.name || 'This category',
                tips: [
                  'Re-read each explanation for your incorrect answers',
                  'Summarize the core concept in your own words',
                  'Do 5–10 spaced-repetition practice questions'
                ],
                resources: []
              }
            ];

            setAiAnalysis({
              overallFeedback: `You scored ${score}/${totalQuestions} (${Math.round(percentage)}%). Focus on the missed topics below.`,
              weakAreas: localWeakAreas,
              studyRecommendations: localStudyRecommendations,
              nextSteps: [
                'Retake the quiz after review',
                'Aim for at least 80% on the next attempt'
              ]
            });
          } catch (error) {
            console.error('Error creating AI analysis:', error);
          } finally {
            setAnalysisLoading(false);
          }
        }
      }

      toast({
        title: "Quiz completed!",
        description: `You scored ${score}/${totalQuestions}`,
      });

      setQuizCompleted(true);
      setUserAnswers(finalAnswers);

      // Generate answer explanations for all quizzes
      setExplanationsLoading(true);
      try {
        // For now, we'll skip answer explanations as it requires additional setup
        // You can implement this later by adding an answer explanations endpoint
        console.log('Answer explanations would be generated here');
      } catch (error) {
        console.error('Error getting answer explanations:', error);
      } finally {
        setExplanationsLoading(false);
      }

    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz results",
        variant: "destructive",
      });
    }
  };

  const calculateScore = (answers: number[]) => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (questions[index] && answer === questions[index].correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (questionsLoading && !isAIGenerated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading questions...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <Card className="bg-gray-900/50 border-gray-800 max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-white text-2xl mb-4">No Questions Available</h2>
            <p className="text-gray-400 mb-6">This quiz category doesn't have any questions yet.</p>
            <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-purple-600 to-blue-600">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizCompleted) {
    const score = calculateScore(userAnswers);
    const percentage = (score / totalQuestions) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gray-900/50 border-gray-800 mt-8">
            <CardHeader className="text-center pb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-4xl font-bold text-white mb-4">Quiz Complete!</CardTitle>
              <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {score}/{totalQuestions}
              </div>
              <p className="text-2xl text-gray-300">
                {percentage >= 80 ? "Excellent!" : percentage >= 60 ? "Good job!" : "Keep practicing!"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {questions.map((question, index) => {
                  const userAnswer = userAnswers[index];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                                          <div key={question._id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium mb-2">{question.question}</p>
                          <p className="text-sm text-gray-400 mb-2">
                            Your answer: {userAnswer >= 0 ? question.options[userAnswer] : 'Not answered'} 
                            {!isCorrect && (
                              <span className="text-green-400 ml-2">
                                (Correct: {question.options[question.correctAnswer]})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-300">{question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex gap-4 mt-8 justify-center">
                <Button 
                  onClick={() => navigate('/dashboard')} 
                  variant="outline"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  View Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  Back to Home
                </Button>
                {isAIGenerated ? (
                  <Button 
                    onClick={() => navigate('/ai-quiz-generator')} 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Generate New Quiz
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    Retake Quiz
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Answer Explanations - Always show */}
          <div className="mt-8">
            <AnswerExplanations 
              explanations={answerExplanations} 
              loading={explanationsLoading} 
            />
          </div>

          {/* AI Recommendations - Only show for regular quizzes with scores below 80% */}
          {!isAIGenerated && percentage < 80 && (
            <div className="mt-8">
              <AIRecommendations analysis={aiAnalysis} loading={analysisLoading} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 mt-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(isAIGenerated ? '/ai-quiz-generator' : '/')}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isAIGenerated ? 'Back to Generator' : 'Back to Home'}
          </Button>
          
          {isTimedMode && (
            <div className="flex items-center gap-2 bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-white font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Question {currentQuestion + 1} of {totalQuestions}</span>
            <span className="text-gray-400">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white leading-relaxed">
              {currentQuestionData?.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestionData?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-300 ${
                    selectedAnswer === index
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                  }`}
                >
                  <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
          >
            {currentQuestion === totalQuestions - 1 ? 'Finish Quiz' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
