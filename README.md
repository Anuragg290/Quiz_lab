# Quiz Lab - MongoDB Version

A modern quiz application built with React, TypeScript, and MongoDB.

## Features

- 🧠 AI-powered quiz generation
- 📊 Quiz analytics and progress tracking
- 🎯 Multiple quiz categories
- 🔐 User authentication
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT
- **AI**: Google Gemini API
- **State Management**: React Query

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Google Gemini API key (for AI features)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd quiz-lab-main
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/quiz-lab

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Gemini API Key (for AI quiz generation)
GEMINI_API_KEY=your-gemini-api-key-here

# Server Configuration
PORT=3001

# Frontend API URL
VITE_API_URL=http://localhost:3001/api
```

### 4. Start MongoDB

Make sure MongoDB is running on your system. If you're using a local installation:

```bash
# Start MongoDB service
mongod
```

Or use MongoDB Atlas (cloud) and update the `MONGODB_URI` in your `.env` file.

### 5. Run the application

#### Development mode (both frontend and backend):
```bash
npm run dev:full
```

#### Or run them separately:

Backend server:
```bash
npm run server
```

Frontend development server:
```bash
npm run dev
```

### 6. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login

### Quiz Categories
- `GET /api/quiz-categories` - Get all quiz categories

### Quiz Questions
- `GET /api/quiz-questions/:categoryId` - Get questions for a category

### Quiz Attempts
- `POST /api/quiz-attempts` - Save quiz attempt
- `GET /api/quiz-attempts` - Get user's quiz history

### Quiz Stats
- `GET /api/quiz-stats` - Get user's quiz statistics

### AI Features
- `POST /api/generate-quiz` - Generate AI quiz
- `POST /api/ai-analysis` - Create AI analysis

### Data Management
- `POST /api/seed-data` - Seed initial data

## Database Schema

### Users
- `email` (string, unique)
- `password` (string, hashed)
- `fullName` (string, optional)
- `username` (string, optional)
- `avatarUrl` (string, optional)

### Quiz Categories
- `name` (string)
- `description` (string, optional)
- `color` (string, optional)
- `icon` (string, optional)

### Quiz Questions
- `categoryId` (ObjectId, ref: QuizCategory)
- `question` (string)
- `options` (array of strings)
- `correctAnswer` (number, 0-3)
- `explanation` (string, optional)
- `difficulty` (string, enum: easy/medium/hard)

### Quiz Attempts
- `userId` (ObjectId, ref: User)
- `categoryId` (ObjectId, ref: QuizCategory)
- `score` (number)
- `totalQuestions` (number)
- `answers` (array of answer objects)
- `timeTaken` (number, optional)
- `completedAt` (Date, optional)

### AI Analysis Results
- `userId` (ObjectId, ref: User)
- `quizAttemptId` (ObjectId, ref: QuizAttempt)
- `overallFeedback` (string, optional)
- `weakAreas` (array of strings, optional)
- `studyRecommendations` (array of strings, optional)
- `nextSteps` (array of strings, optional)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

