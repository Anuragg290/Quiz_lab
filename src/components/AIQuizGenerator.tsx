
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Play } from 'lucide-react';
import { mongodbClient } from '@/integrations/mongodb/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const AIQuizGenerator: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<{
    questions: GeneratedQuestion[];
    topic: string;
    difficulty: string;
  } | null>(null);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a topic for your quiz",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate quizzes",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const data = await mongodbClient.generateQuiz({
        topic: topic.trim(),
        difficulty,
        questionCount: 5
      });

      setGeneratedQuiz(data);
      
      toast({
        title: "Quiz Generated!",
        description: `Created 5 questions about "${topic}"`,
      });
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartQuiz = () => {
    if (generatedQuiz) {
      // Store the generated quiz in localStorage for the quiz component to use
      localStorage.setItem('aiGeneratedQuiz', JSON.stringify(generatedQuiz));
      window.location.href = '/quiz/ai-generated';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Quiz Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">
              Topic
            </label>
            <Input
              placeholder="e.g., React Hooks, Binary Trees, Promises in JavaScript"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white"
            />
          </div>
          
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">
              Difficulty
            </label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateQuiz}
            disabled={isGenerating || !topic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <Brain className="w-4 h-4 mr-2 animate-pulse" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate 5 Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedQuiz && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Generated Quiz: {generatedQuiz.topic}
              </CardTitle>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                {generatedQuiz.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              {generatedQuiz.questions.map((question, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">
                    {index + 1}. {question.question}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`p-2 rounded border text-sm ${
                          optIndex === question.correctAnswer
                            ? 'border-green-500/50 bg-green-500/10 text-green-400'
                            : 'border-gray-700 bg-gray-800/50 text-gray-300'
                        }`}
                      >
                        <span className="font-medium mr-2">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              onClick={handleStartQuiz}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start This Quiz
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIQuizGenerator;
