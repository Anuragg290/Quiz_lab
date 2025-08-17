
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Code, Database, Globe, Shield, Server, Clock, Cpu } from 'lucide-react';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { mongodbClient } from '@/integrations/mongodb/client';
import { seedData } from '@/utils/seedData';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Seed data on app load
  useEffect(() => {
    seedData();
  }, []);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['quiz-categories'],
    queryFn: async () => {
      return await mongodbClient.getQuizCategories();
    },
  });

  const iconMap: Record<string, React.ComponentType<any>> = {
    Code,
    Brain,
    Cpu,
    Database,
    Globe,
    Shield,
    Server,
    Clock,
  };

  const handleQuizStart = (categoryId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/quiz/${categoryId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              QuizCS
            </h1>
            <p className="text-gray-400 hidden md:block">Master Computer Science Concepts</p>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                Dashboard
              </Button>
            )}
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-white mb-6">
          Test Your <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Computer Science
          </span> Knowledge
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Challenge yourself with quizzes covering algorithms, data structures, programming concepts, and more. 
          Track your progress and become a CS expert!
        </p>
        
        {!user && (
          <div className="mb-12">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
            >
              Get Started - It's Free!
            </Button>
          </div>
        )}
      </div>

      {/* Quiz Categories */}
      <div className="container mx-auto px-4 pb-16">
        <h3 className="text-3xl font-bold text-white text-center mb-12">Choose Your Challenge</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories?.map((category) => {
            const IconComponent = iconMap[category.icon || 'Code'];
            
            return (
              <Card 
                key={category._id}
                className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-all duration-300 group cursor-pointer"
                onClick={() => handleQuizStart(category._id)}
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white group-hover:text-purple-400 transition-colors">
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400 mb-4">
                    {category.description}
                  </CardDescription>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 group-hover:scale-105 transition-transform duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuizStart(category._id);
                    }}
                  >
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-900/30 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-white text-center mb-12">Why Choose QuizCS?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Comprehensive Topics</h4>
              <p className="text-gray-400">
                Cover all major CS topics from basic programming to advanced algorithms
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Track Progress</h4>
              <p className="text-gray-400">
                Monitor your improvement with detailed analytics and history
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-600 to-green-600 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">Expert Explanations</h4>
              <p className="text-gray-400">
                Learn from detailed explanations for every question
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
