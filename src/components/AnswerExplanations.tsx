
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';

interface QuestionExplanation {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

interface AnswerExplanationsProps {
  explanations: QuestionExplanation[];
  loading: boolean;
}

const AnswerExplanations: React.FC<AnswerExplanationsProps> = ({ explanations, loading }) => {
  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400 animate-pulse" />
            AI Answer Explanations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">Generating detailed explanations for your answers...</div>
        </CardContent>
      </Card>
    );
  }

  if (!explanations || explanations.length === 0) return null;

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          AI Answer Explanations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {explanations.map((explanation, index) => (
            <div key={index} className="border border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                {explanation.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-2">Question {index + 1}</h4>
                  <p className="text-gray-300 mb-3">{explanation.question}</p>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">Your answer:</span>
                      <Badge variant={explanation.isCorrect ? "default" : "destructive"} className="text-xs">
                        {explanation.userAnswer}
                      </Badge>
                    </div>
                    
                    {!explanation.isCorrect && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Correct answer:</span>
                        <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                          {explanation.correctAnswer}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-800/50 p-3 rounded-md">
                    <h5 className="text-yellow-400 text-sm font-medium mb-2 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4" />
                      Explanation
                    </h5>
                    <p className="text-gray-300 text-sm leading-relaxed">{explanation.explanation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnswerExplanations;
