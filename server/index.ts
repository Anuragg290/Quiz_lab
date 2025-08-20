import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectDB } from '../src/integrations/mongodb/connection';
import { User, QuizCategory, QuizQuestion, QuizAttempt, AIAnalysisResult } from '../src/integrations/mongodb/models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health endpoint to verify DB target
app.get('/api/health', async (_req, res) => {
  try {
    const state = mongoose.connection.readyState; // 1 connected, 2 connecting
    const host = mongoose.connection.host;
    const name = mongoose.connection.name;
    const usingEnv = !!process.env.MONGODB_URI;
    res.json({
      status: 'ok',
      db: {
        connected: state === 1,
        host,
        name,
        viaEnv: usingEnv,
      }
    });
  } catch (e) {
    res.status(500).json({ status: 'error' });
  }
});

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      fullName,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
      },
      token,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quiz categories routes
app.get('/api/quiz-categories', async (req, res) => {
  try {
    const categories = await QuizCategory.find().sort({ createdAt: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quiz questions routes
app.get('/api/quiz-questions/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const countParam = Array.isArray(req.query.count) ? req.query.count[0] : req.query.count;
    const randomParam = Array.isArray(req.query.random) ? req.query.random[0] : req.query.random;
    const count = Math.max(1, Math.min(100, parseInt(String(countParam || '10'), 10)));
    const random = String(randomParam || 'false') === 'true';
    
    if (!categoryId || categoryId === 'undefined') {
      return res.json([]);
    }
    
    if (random) {
      const matchCategoryId = new mongoose.Types.ObjectId(categoryId);
      const questions = await QuizQuestion.aggregate([
        { $match: { categoryId: matchCategoryId } },
        { $sample: { size: count } },
      ]);
      return res.json(questions);
    } else {
      const questions = await QuizQuestion.find({ categoryId }).limit(count);
      return res.json(questions);
    }
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quiz attempts routes
app.post('/api/quiz-attempts', authenticateToken, async (req, res) => {
  try {
    const { categoryId, score, totalQuestions, answers, timeTaken } = req.body;
    const userId = (req as any).user.userId;

    const quizAttempt = new QuizAttempt({
      userId,
      categoryId,
      score,
      totalQuestions,
      answers,
      timeTaken,
      completedAt: new Date(),
    });

    await quizAttempt.save();

    res.status(201).json(quizAttempt);
  } catch (error) {
    console.error('Create quiz attempt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/quiz-attempts', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const attempts = await QuizAttempt.find({ userId })
      .populate('categoryId', 'name color')
      .populate('answers.questionId', 'question options correctAnswer explanation')
      .sort({ completedAt: -1 });

    const transformedAttempts = await Promise.all(attempts.map(async (attempt) => {
      const category = attempt.categoryId as any;
      const analysisDoc = await AIAnalysisResult.findOne({
        userId,
        quizAttemptId: attempt._id,
      }).sort({ createdAt: -1 });

      const analysis = analysisDoc ? {
        overall_feedback: analysisDoc.overallFeedback,
        weak_areas: analysisDoc.weakAreas,
        study_recommendations: analysisDoc.studyRecommendations,
        next_steps: analysisDoc.nextSteps,
      } : null;

      return {
        id: attempt._id,
        score: attempt.score,
        total_questions: attempt.totalQuestions,
        completed_at: attempt.completedAt,
        time_taken: attempt.timeTaken,
        category: {
          name: category?.name || 'Unknown Category',
          color: category?.color || '#6b7280'
        },
        analysis,
      };
    }));

    res.json(transformedAttempts);
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quiz stats route
app.get('/api/quiz-stats', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const attempts = await QuizAttempt.find({ userId });

    if (attempts.length === 0) {
      return res.json({
        total_attempts: 0,
        average_score: 0,
        best_score: 0,
        total_time_spent: 0,
      });
    }

    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + (attempt.totalQuestions || 0), 0);
    const averagePercentage = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
    const bestPercentage = Math.max(
      ...attempts.map(attempt => {
        const tq = attempt.totalQuestions || 0;
        return tq > 0 ? (attempt.score / tq) * 100 : 0;
      })
    );
    const totalTimeSpent = attempts.reduce((sum, attempt) => sum + (attempt.timeTaken || 0), 0);

    res.json({
      total_attempts: totalAttempts,
      average_score: Math.round(averagePercentage),
      best_score: Math.round(bestPercentage),
      total_time_spent: totalTimeSpent,
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Analysis routes
app.post('/api/ai-analysis', authenticateToken, async (req, res) => {
  try {
    const { quizAttemptId, overallFeedback, weakAreas, studyRecommendations, nextSteps } = req.body;
    const userId = (req as any).user.userId;

    const analysis = new AIAnalysisResult({
      userId,
      quizAttemptId,
      overallFeedback,
      weakAreas,
      studyRecommendations,
      nextSteps,
    });

    await analysis.save();

    res.status(201).json(analysis);
  } catch (error) {
    console.error('Create AI analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Quiz generation route
app.post('/api/generate-quiz', async (req, res) => {
  try {
    const { topic, difficulty = 'medium', questionCount = 5 } = req.body;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    // Return mock data when API key is not available or invalid
    const mockQuiz = {
      questions: [
        {
          question: "What is the time complexity of binary search?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
          correctAnswer: 1,
          explanation: "Binary search has a time complexity of O(log n) because it divides the search space in half with each iteration."
        },
        {
          question: "Which data structure uses LIFO (Last In, First Out)?",
          options: ["Queue", "Stack", "Tree", "Graph"],
          correctAnswer: 1,
          explanation: "A stack uses LIFO principle where the last element added is the first one to be removed."
        },
        {
          question: "What is the primary purpose of a hash table?",
          options: ["Sorting data", "Fast lookups", "Memory management", "Data compression"],
          correctAnswer: 1,
          explanation: "Hash tables provide average O(1) time complexity for insertions and lookups, making them ideal for fast data retrieval."
        }
      ],
      topic: topic,
      difficulty: difficulty
    };

    if (!geminiApiKey || geminiApiKey === 'your-gemini-api-key-here') {
      return res.json(mockQuiz);
    }

    const prompt = `
You are an expert Computer Science educator creating quiz questions.

Topic: ${topic}
Difficulty: ${difficulty}
Number of Questions: ${questionCount}

Create ${questionCount} multiple-choice questions about "${topic}" at ${difficulty} level.

Requirements:
- Each question should test understanding of key concepts
- Provide exactly 4 options (A, B, C, D) for each question
- Only one option should be correct
- Include a brief explanation for why the correct answer is right
- Make questions practical and relevant to real-world applications
- Ensure questions are at ${difficulty} difficulty level

Provide a JSON response with this exact structure:
{
  "questions": [
    {
      "question": "the question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": 0,
      "explanation": "brief explanation of why this answer is correct"
    }
  ],
  "topic": "${topic}",
  "difficulty": "${difficulty}"
}

Make sure:
- correctAnswer is the index (0-3) of the correct option
- Questions are clear and unambiguous
- Options are plausible and not obviously wrong
- Explanations are educational and concise

Provide ONLY the JSON response, no additional text.
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 64,
            topP: 0.95,
            maxOutputTokens: 4000,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        // Return mock data instead of throwing error
        return res.json(mockQuiz);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid Gemini API response structure');
        return res.json(mockQuiz);
      }

      const generatedText = data.candidates[0].content.parts[0].text;

      // Clean up the response to extract just the JSON
      let jsonText = generatedText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      const quizData = JSON.parse(jsonText);
      res.json(quizData);
    } catch (error) {
      console.error('Gemini API call failed, using mock data:', error);
      res.json(mockQuiz);
    }
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Seed data route
app.post('/api/seed-data', async (req, res) => {
  try {
    // Create categories
    const categories = [
      { name: 'JavaScript', description: 'Core JavaScript concepts', color: '#f7df1e', icon: 'Code' },
      { name: 'React', description: 'React framework fundamentals', color: '#61dafb', icon: 'Brain' },
      { name: 'Node.js', description: 'Server-side JavaScript', color: '#339933', icon: 'Server' },
      { name: 'Database', description: 'Database concepts and SQL', color: '#336791', icon: 'Database' },
      { name: 'Web Security', description: 'Web security best practices', color: '#ff6b6b', icon: 'Shield' },
      { name: 'API Design', description: 'RESTful API design principles', color: '#4ecdc4', icon: 'Globe' },
      { name: 'Performance', description: 'Web performance optimization', color: '#45b7d1', icon: 'Cpu' },
      { name: 'Testing', description: 'Software testing methodologies', color: '#96ceb4', icon: 'Clock' },
    ];

    // Create categories and store their IDs
    const categoryMap = new Map();
    for (const categoryData of categories) {
      let category = await QuizCategory.findOne({ name: categoryData.name });
      if (!category) {
        category = await QuizCategory.create(categoryData);
      }
      categoryMap.set(categoryData.name, category._id);
    }

    // Sample questions for each category
    const questions = [
      // JavaScript Questions
      {
        categoryId: categoryMap.get('JavaScript'),
        question: "What is the difference between '==' and '===' in JavaScript?",
        options: [
          "== checks value and type, === checks only value",
          "== checks only value, === checks value and type",
          "Both check value and type",
          "Both check only value"
        ],
        correctAnswer: 1,
        explanation: "== performs type coercion and checks value, while === checks both value and type without coercion.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('JavaScript'),
        question: "What is a closure in JavaScript?",
        options: [
          "A function that has access to variables in its outer scope",
          "A way to close browser tabs",
          "A method to end loops",
          "A type of array"
        ],
        correctAnswer: 0,
        explanation: "A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('JavaScript'),
        question: "What does 'this' keyword refer to in JavaScript?",
        options: [
          "Always refers to the global object",
          "Always refers to the function it's in",
          "Depends on how the function is called",
          "Always refers to the DOM element"
        ],
        correctAnswer: 2,
        explanation: "The 'this' keyword refers to the object that is currently executing the code, and its value depends on how the function is called.",
        difficulty: "medium"
      },

      // React Questions
      {
        categoryId: categoryMap.get('React'),
        question: "What is the purpose of useState hook in React?",
        options: [
          "To manage global state",
          "To add state to functional components",
          "To handle side effects",
          "To optimize performance"
        ],
        correctAnswer: 1,
        explanation: "useState is a React hook that allows functional components to have state variables.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('React'),
        question: "What is the virtual DOM in React?",
        options: [
          "A real DOM element",
          "A lightweight copy of the real DOM",
          "A browser API",
          "A JavaScript framework"
        ],
        correctAnswer: 1,
        explanation: "The virtual DOM is a lightweight copy of the real DOM that React uses to optimize rendering performance.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('React'),
        question: "What is the difference between props and state?",
        options: [
          "Props are mutable, state is immutable",
          "Props are immutable, state is mutable",
          "Both are mutable",
          "Both are immutable"
        ],
        correctAnswer: 1,
        explanation: "Props are read-only and passed from parent components, while state is mutable and managed within the component.",
        difficulty: "medium"
      },

      // Node.js Questions
      {
        categoryId: categoryMap.get('Node.js'),
        question: "What is the event loop in Node.js?",
        options: [
          "A loop that runs forever",
          "A mechanism that handles asynchronous operations",
          "A way to create infinite loops",
          "A debugging tool"
        ],
        correctAnswer: 1,
        explanation: "The event loop is a mechanism that allows Node.js to perform non-blocking I/O operations despite JavaScript being single-threaded.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('Node.js'),
        question: "What is the purpose of package.json?",
        options: [
          "To store user data",
          "To manage project dependencies and metadata",
          "To create HTML pages",
          "To run tests"
        ],
        correctAnswer: 1,
        explanation: "package.json contains project metadata and manages dependencies for Node.js projects.",
        difficulty: "easy"
      },
      {
        categoryId: categoryMap.get('Node.js'),
        question: "What does 'require' do in Node.js?",
        options: [
          "Makes HTTP requests",
          "Imports modules and files",
          "Creates new files",
          "Deletes files"
        ],
        correctAnswer: 1,
        explanation: "require is a function used to import modules and files in Node.js.",
        difficulty: "easy"
      },

      // Database Questions
      {
        categoryId: categoryMap.get('Database'),
        question: "What is a primary key in a database?",
        options: [
          "A key that opens the database",
          "A unique identifier for each record",
          "A foreign key reference",
          "A backup key"
        ],
        correctAnswer: 1,
        explanation: "A primary key is a unique identifier that uniquely identifies each record in a database table.",
        difficulty: "easy"
      },
      {
        categoryId: categoryMap.get('Database'),
        question: "What is the difference between SQL and NoSQL?",
        options: [
          "SQL is newer than NoSQL",
          "SQL uses structured data, NoSQL uses unstructured data",
          "SQL is faster than NoSQL",
          "NoSQL is always better than SQL"
        ],
        correctAnswer: 1,
        explanation: "SQL databases use structured, relational data, while NoSQL databases can handle unstructured data more flexibly.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('Database'),
        question: "What is normalization in databases?",
        options: [
          "Making data smaller",
          "Organizing data to reduce redundancy",
          "Speeding up queries",
          "Backing up data"
        ],
        correctAnswer: 1,
        explanation: "Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.",
        difficulty: "medium"
      },

      // Web Security Questions
      {
        categoryId: categoryMap.get('Web Security'),
        question: "What is XSS (Cross-Site Scripting)?",
        options: [
          "A type of CSS attack",
          "Injecting malicious scripts into web pages",
          "A database attack",
          "A network protocol"
        ],
        correctAnswer: 1,
        explanation: "XSS is a security vulnerability that allows attackers to inject malicious scripts into web pages viewed by other users.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('Web Security'),
        question: "What is CSRF (Cross-Site Request Forgery)?",
        options: [
          "A type of virus",
          "Forcing users to perform unwanted actions",
          "A database attack",
          "A network protocol"
        ],
        correctAnswer: 1,
        explanation: "CSRF is an attack that forces authenticated users to perform unwanted actions on a website they're currently authenticated to.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('Web Security'),
        question: "What is the purpose of HTTPS?",
        options: [
          "To make websites faster",
          "To encrypt data transmission",
          "To store data securely",
          "To create backups"
        ],
        correctAnswer: 1,
        explanation: "HTTPS encrypts data transmission between the client and server, providing security and privacy.",
        difficulty: "easy"
      },

      // API Design Questions
      {
        categoryId: categoryMap.get('API Design'),
        question: "What does REST stand for?",
        options: [
          "Remote State Transfer",
          "Representational State Transfer",
          "Remote Service Transfer",
          "Representational Service Transfer"
        ],
        correctAnswer: 1,
        explanation: "REST stands for Representational State Transfer, an architectural style for designing networked applications.",
        difficulty: "easy"
      },
      {
        categoryId: categoryMap.get('API Design'),
        question: "What HTTP status code represents 'Not Found'?",
        options: [
          "200",
          "404",
          "500",
          "403"
        ],
        correctAnswer: 1,
        explanation: "HTTP status code 404 represents 'Not Found', indicating that the requested resource could not be found.",
        difficulty: "easy"
      },
      {
        categoryId: categoryMap.get('API Design'),
        question: "What is the purpose of API versioning?",
        options: [
          "To make APIs faster",
          "To maintain backward compatibility",
          "To reduce costs",
          "To improve security"
        ],
        correctAnswer: 1,
        explanation: "API versioning allows developers to maintain backward compatibility while introducing new features or changes.",
        difficulty: "medium"
      },

      // Performance Questions
      {
        categoryId: categoryMap.get('Performance'),
        question: "What is lazy loading?",
        options: [
          "Loading all content at once",
          "Loading content only when needed",
          "Loading content slowly",
          "Loading content in the background"
        ],
        correctAnswer: 1,
        explanation: "Lazy loading is a technique that delays loading of non-critical resources until they are needed.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('Performance'),
        question: "What is caching?",
        options: [
          "Storing data temporarily for faster access",
          "Deleting old data",
          "Compressing data",
          "Backing up data"
        ],
        correctAnswer: 0,
        explanation: "Caching is storing data temporarily in a faster storage location to improve access speed.",
        difficulty: "easy"
      },
      {
        categoryId: categoryMap.get('Performance'),
        question: "What is the critical rendering path?",
        options: [
          "The fastest way to render",
          "The sequence of steps the browser takes to render a page",
          "A debugging tool",
          "A performance metric"
        ],
        correctAnswer: 1,
        explanation: "The critical rendering path is the sequence of steps the browser takes to convert HTML, CSS, and JavaScript into pixels on the screen.",
        difficulty: "medium"
      },

      // Testing Questions
      {
        categoryId: categoryMap.get('Testing'),
        question: "What is unit testing?",
        options: [
          "Testing the entire application",
          "Testing individual components in isolation",
          "Testing user interfaces",
          "Testing databases"
        ],
        correctAnswer: 1,
        explanation: "Unit testing involves testing individual components or functions in isolation to ensure they work correctly.",
        difficulty: "easy"
      },
      {
        categoryId: categoryMap.get('Testing'),
        question: "What is the difference between unit tests and integration tests?",
        options: [
          "Unit tests are faster",
          "Unit tests test individual components, integration tests test component interactions",
          "Integration tests are easier to write",
          "Unit tests are more important"
        ],
        correctAnswer: 1,
        explanation: "Unit tests test individual components in isolation, while integration tests test how components work together.",
        difficulty: "medium"
      },
      {
        categoryId: categoryMap.get('Testing'),
        question: "What is test-driven development (TDD)?",
        options: [
          "Writing tests after code",
          "Writing tests before writing code",
          "Writing code without tests",
          "Writing documentation first"
        ],
        correctAnswer: 1,
        explanation: "TDD is a development methodology where you write tests before writing the actual code.",
        difficulty: "medium"
      }
    ];

    // Create questions
    for (const questionData of questions) {
      const existingQuestion = await QuizQuestion.findOne({ 
        question: questionData.question,
        categoryId: questionData.categoryId 
      });
      if (!existingQuestion) {
        await QuizQuestion.create(questionData);
      }
    }

    res.json({ message: 'Data seeded successfully' });
  } catch (error) {
    console.error('Seed data error:', error);
    res.status(500).json({ error: 'Failed to seed data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
