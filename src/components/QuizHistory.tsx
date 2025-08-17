
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Trophy, Brain, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { mongodbClient } from '@/integrations/mongodb/client';
import { useAuth } from '@/contexts/AuthContext';

interface QuizHistoryItem {
  id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  time_taken: number;
  category?: {
    name: string;
    color: string;
  };
  analysis?: {
    overall_feedback: string;
    weak_areas: any[];
    study_recommendations: any[];
    next_steps: string[];
  };
}

const QuizHistory = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-800/50 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-800/50 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-800/50 h-32 rounded-lg"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Please Log In</h3>
          <p className="text-gray-400">You need to be logged in to view your quiz history.</p>
        </CardContent>
      </Card>
    );
  }

  const { data: quizHistory = [], isLoading } = useQuery({
    queryKey: ['quiz-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await mongodbClient.getQuizAttempts();
    },
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-800/50 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-800/50 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-800/50 h-32 rounded-lg"></div>
      </div>
    );
  }

  if (quizHistory.length === 0) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Quiz History</h3>
          <p className="text-gray-400">Start taking quizzes to see your history and AI recommendations here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-purple-400" />
        <h2 className="text-2xl font-bold text-white">Quiz History</h2>
        <Badge variant="outline" className="border-purple-500/50 text-purple-400">
          {quizHistory.length} attempts
        </Badge>
      </div>

      <div className="space-y-4">
        {quizHistory.map((quiz) => (
          <Card key={quiz.id} className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${quiz.category?.color || '#6b7280'}`}></div>
                  <div>
                    <CardTitle className="text-lg text-white">{quiz.category?.name || 'Unknown Category'}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(quiz.completed_at)}
                      </div>
                      {quiz.time_taken && (
                        <div>Time: {formatTime(quiz.time_taken)}</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(quiz.score, quiz.total_questions)}`}>
                    {quiz.score}/{quiz.total_questions}
                  </div>
                  <div className="text-sm text-gray-400">
                    {Math.round((quiz.score / quiz.total_questions) * 100)}%
                  </div>
                </div>
              </div>
            </CardHeader>

            {quiz.analysis && quiz.analysis.overall_feedback && (
              <CardContent className="pt-0">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                      <Brain className="w-4 h-4 mr-2" />
                      View AI Recommendations
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    {/* Overall Feedback */}
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        AI Feedback
                      </h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{quiz.analysis.overall_feedback}</p>
                    </div>

                    {/* Weak Areas */}
                    {quiz.analysis?.weak_areas && quiz.analysis.weak_areas.length > 0 && (
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4 text-red-400" />
                          Areas for Improvement
                        </h4>
                        <div className="space-y-2">
                          {quiz.analysis.weak_areas.map((area: any, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <Badge className={`${getPriorityColor(area.priority)} text-xs`}>
                                {area.priority?.toUpperCase() || 'MEDIUM'}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{area.topic}</p>
                                <p className="text-gray-400 text-xs mt-1">{area.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Study Recommendations */}
                    {quiz.analysis?.study_recommendations && quiz.analysis.study_recommendations.length > 0 && (
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          Study Recommendations
                        </h4>
                        <div className="space-y-3">
                          {quiz.analysis.study_recommendations.map((rec: any, index: number) => (
                            <div key={index} className="border-l-2 border-blue-500 pl-3">
                              <p className="text-white text-sm font-medium">{rec.topic}</p>
                              {rec.tips && rec.tips.length > 0 && (
                                <ul className="list-disc list-inside text-gray-400 text-xs mt-1 space-y-1">
                                  {rec.tips.slice(0, 2).map((tip: string, tipIndex: number) => (
                                    <li key={tipIndex}>{tip}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    {quiz.analysis.next_steps && quiz.analysis.next_steps.length > 0 && (
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-3">Next Steps</h4>
                        <div className="space-y-2">
                          {quiz.analysis.next_steps.map((step: string, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                                {index + 1}
                              </div>
                              <p className="text-gray-300 text-sm flex-1">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuizHistory;
