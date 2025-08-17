
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, Award, Clock, Brain } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';
import { mongodbClient } from '@/integrations/mongodb/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import QuizHistory from '@/components/QuizHistory';

interface QuizStats {
  total_attempts: number;
  average_score: number;
  best_score: number;
  total_time_spent: number;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const { data: quizStats } = useQuery({
    queryKey: ['quiz-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await mongodbClient.getQuizStats();
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here's your learning progress.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm font-medium">Total Quizzes</p>
                  <p className="text-3xl font-bold text-white">{quizStats?.total_attempts || 0}</p>
                </div>
                <Trophy className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium">Average Score</p>
                  <p className="text-3xl font-bold text-white">
                    {quizStats?.average_score ? `${Math.round(quizStats.average_score)}%` : '0%'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-blue-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Best Score</p>
                  <p className="text-3xl font-bold text-white">
                    {quizStats?.best_score ? `${Math.round(quizStats.best_score)}%` : '0%'}
                  </p>
                </div>
                <Award className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border-orange-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm font-medium">Study Time</p>
                  <p className="text-3xl font-bold text-white">
                    {quizStats?.total_time_spent ? formatTime(quizStats.total_time_spent) : '0m'}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Quiz Generator Card */}
        <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-400" />
                  AI Quiz Generator
                </h3>
                <p className="text-gray-400 mb-4">Create custom quizzes on any topic using AI</p>
              </div>
              <Button
                onClick={() => navigate('/ai-quiz-generator')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Generate Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quiz History */}
        <QuizHistory />
      </div>
    </div>
  );
};

export default Dashboard;
