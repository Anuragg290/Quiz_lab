
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Cpu, Globe, ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const timelineEvents = [
  {
    year: 1936,
    title: "Turing Machine Concept",
    person: "Alan Turing",
    description: "Alan Turing introduces the concept of the Turing machine, laying the theoretical foundation for computer science.",
    icon: User,
    color: "from-purple-500 to-blue-500"
  },
  {
    year: 1947,
    title: "First Computer Bug",
    person: "Grace Hopper",
    description: "Grace Hopper finds the first actual computer 'bug' - a moth trapped in a Harvard Mark II computer.",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500"
  },
  {
    year: 1969,
    title: "ARPANET Created",
    person: "DARPA",
    description: "The first successful message sent over ARPANET, the precursor to the modern Internet.",
    icon: Globe,
    color: "from-cyan-500 to-green-500"
  },
  {
    year: 1971,
    title: "First Microprocessor",
    person: "Intel",
    description: "Intel releases the 4004, the world's first commercially available microprocessor.",
    icon: Cpu,
    color: "from-green-500 to-yellow-500"
  },
  {
    year: 1991,
    title: "World Wide Web",
    person: "Tim Berners-Lee",
    description: "Tim Berners-Lee creates the World Wide Web, revolutionizing information sharing.",
    icon: Globe,
    color: "from-yellow-500 to-red-500"
  }
];

const pioneers = [
  {
    name: "Ada Lovelace",
    title: "First Computer Programmer",
    period: "1815-1852",
    contribution: "Wrote the first computer algorithm for Babbage's Analytical Engine",
    image: "👩‍💻"
  },
  {
    name: "Alan Turing",
    title: "Father of Computer Science",
    period: "1912-1954",
    contribution: "Developed the Turing machine concept and helped break the Enigma code",
    image: "🧠"
  },
  {
    name: "Grace Hopper",
    title: "Programming Pioneer",
    period: "1906-1992",
    contribution: "Developed the first compiler and coined the term 'computer bug'",
    image: "🔬"
  },
  {
    name: "John von Neumann",
    title: "Computer Architecture Pioneer",
    period: "1903-1957",
    contribution: "Developed the von Neumann architecture used in most computers today",
    image: "🏗️"
  }
];

const trivia = [
  {
    question: "What does 'WWW' stand for?",
    answer: "World Wide Web",
    funFact: "The first website ever created is still online at info.cern.ch"
  },
  {
    question: "Which company created the first personal computer?",
    answer: "IBM (though Altair 8800 was earlier)",
    funFact: "The IBM PC 5150 was released in 1981 and became the industry standard"
  },
  {
    question: "What was the first programming language?",
    answer: "Assembly language (or Fortran for high-level)",
    funFact: "FORTRAN was created in 1957 and is still used today in scientific computing"
  }
];

const History = () => {
  const navigate = useNavigate();
  const [selectedTrivia, setSelectedTrivia] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 mt-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            History of Computer Science
          </h1>
        </div>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-gray-800">
            <TabsTrigger value="timeline" className="data-[state=active]:bg-purple-600">Timeline</TabsTrigger>
            <TabsTrigger value="pioneers" className="data-[state=active]:bg-purple-600">Pioneers</TabsTrigger>
            <TabsTrigger value="trivia" className="data-[state=active]:bg-purple-600">Trivia</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-8">
            <div className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Major Milestones</h2>
                <p className="text-gray-400 text-lg">Key events that shaped computer science</p>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-cyan-500"></div>

                {timelineEvents.map((event, index) => (
                  <div key={event.year} className="relative flex items-start gap-8 mb-12">
                    {/* Timeline node */}
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${event.color} flex items-center justify-center flex-shrink-0 border-4 border-gray-900 relative z-10`}>
                      <event.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <Card className="flex-1 bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-2xl font-bold text-purple-400">{event.year}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">{event.person}</span>
                        </div>
                        <CardTitle className="text-xl text-white">{event.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 leading-relaxed">{event.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pioneers" className="mt-8">
            <div className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Computing Pioneers</h2>
                <p className="text-gray-400 text-lg">Visionaries who built the foundation of modern computing</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pioneers.map((pioneer, index) => (
                  <Card 
                    key={pioneer.name} 
                    className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-all duration-300 hover:scale-105"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">{pioneer.image}</div>
                        <div>
                          <CardTitle className="text-xl text-white">{pioneer.name}</CardTitle>
                          <p className="text-purple-400 font-medium">{pioneer.title}</p>
                          <p className="text-gray-500 text-sm">{pioneer.period}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 leading-relaxed">{pioneer.contribution}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trivia" className="mt-8">
            <div className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">CS Trivia</h2>
                <p className="text-gray-400 text-lg">Fun facts and interesting tidbits about computing history</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-2xl text-white text-center mb-6">
                      Question {selectedTrivia + 1} of {trivia.length}
                    </CardTitle>
                    <div className="text-center">
                      <h3 className="text-xl text-purple-400 mb-8">{trivia[selectedTrivia].question}</h3>
                      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mb-6">
                        <p className="text-lg text-white font-medium mb-4">{trivia[selectedTrivia].answer}</p>
                        <div className="flex items-center gap-2 text-cyan-400">
                          <BookOpen className="w-4 h-4" />
                          <p className="text-sm">{trivia[selectedTrivia].funFact}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTrivia(Math.max(0, selectedTrivia - 1))}
                        disabled={selectedTrivia === 0}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setSelectedTrivia(Math.min(trivia.length - 1, selectedTrivia + 1))}
                        disabled={selectedTrivia === trivia.length - 1}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        Next
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default History;
