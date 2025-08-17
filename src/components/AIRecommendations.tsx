
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, ExternalLink, Target, TrendingUp, BookOpen, Play, FileText, Globe } from 'lucide-react';

interface WeakArea {
  topic: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface Resource {
  title: string;
  url: string;
  type: 'tutorial' | 'video' | 'documentation' | 'article';
}

interface StudyRecommendation {
  topic: string;
  tips: string[];
  resources: Resource[];
}

interface AIAnalysis {
  weakAreas: WeakArea[];
  studyRecommendations: StudyRecommendation[];
  overallFeedback: string;
  nextSteps: string[];
}

interface AIRecommendationsProps {
  analysis: AIAnalysis;
  loading: boolean;
}

const AIRecommendations: React.FC<AIRecommendationsProps> = ({ analysis, loading }) => {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'documentation': return <FileText className="w-4 h-4" />;
      case 'tutorial': return <BookOpen className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-400">Analyzing your performance and generating personalized recommendations...</div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Overall Feedback */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 leading-relaxed">{analysis.overallFeedback}</p>
        </CardContent>
      </Card>

      {/* Weak Areas */}
      {analysis.weakAreas && analysis.weakAreas.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-red-400" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.weakAreas.map((area, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                  <Badge className={`${getPriorityColor(area.priority)} text-xs`}>
                    {area.priority.toUpperCase()}
                  </Badge>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{area.topic}</h4>
                    <p className="text-gray-400 text-sm mt-1">{area.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Recommendations */}
      {analysis.studyRecommendations && analysis.studyRecommendations.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Personalized Study Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analysis.studyRecommendations.map((rec, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">{rec.topic}</h4>
                  
                  {/* Tips */}
                  <div className="mb-4">
                    <h5 className="text-gray-300 font-medium mb-2">Study Tips:</h5>
                    <ul className="list-disc list-inside space-y-1">
                      {rec.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="text-gray-400 text-sm">{tip}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Resources */}
                  {rec.resources && rec.resources.length > 0 && (
                    <div>
                      <h5 className="text-gray-300 font-medium mb-2">Recommended Resources:</h5>
                      <div className="space-y-2">
                        {rec.resources.map((resource, resIndex) => (
                          <Button
                            key={resIndex}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start border-gray-700 text-gray-300 hover:bg-gray-800"
                            onClick={() => window.open(resource.url, '_blank')}
                          >
                            {getResourceIcon(resource.type)}
                            <span className="ml-2 flex-1 text-left">{resource.title}</span>
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {analysis.nextSteps && analysis.nextSteps.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-gray-300 flex-1">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIRecommendations;
