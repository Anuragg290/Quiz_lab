const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class MongoDBClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      
      // Clear invalid token on 401/403 errors
      if (response.status === 401 || response.status === 403) {
        this.clearToken();
        // Reload the page to reset the auth state
        window.location.reload();
      }
      
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async signUp(email: string, password: string, fullName?: string) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return { data, error: null };
  }

  async signIn(email: string, password: string) {
    const data = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return { data, error: null };
  }

  async signOut() {
    this.clearToken();
    return { error: null };
  }

  // Quiz categories
  async getQuizCategories() {
    return this.request('/quiz-categories');
  }

  // Quiz questions
  async getQuizQuestions(categoryId: string) {
    return this.request(`/quiz-questions/${categoryId}`);
  }

  // Quiz attempts
  async createQuizAttempt(attemptData: {
    categoryId: string;
    score: number;
    totalQuestions: number;
    answers: Array<{
      questionId: string;
      selectedAnswer: number;
      isCorrect: boolean;
    }>;
    timeTaken?: number;
  }) {
    return this.request('/quiz-attempts', {
      method: 'POST',
      body: JSON.stringify(attemptData),
    });
  }

  async getQuizAttempts() {
    return this.request('/quiz-attempts');
  }

  // Quiz stats
  async getQuizStats() {
    return this.request('/quiz-stats');
  }

  // AI Analysis
  async createAIAnalysis(analysisData: {
    quizAttemptId: string;
    overallFeedback?: string;
    weakAreas?: string[];
    studyRecommendations?: string[];
    nextSteps?: string[];
  }) {
    return this.request('/ai-analysis', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  }

  // AI Quiz generation
  async generateQuiz(generationData: {
    topic: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
  }) {
    return this.request('/generate-quiz', {
      method: 'POST',
      body: JSON.stringify(generationData),
    });
  }

  // Seed data
  async seedData() {
    return this.request('/seed-data', {
      method: 'POST',
    });
  }
}

export const mongodbClient = new MongoDBClient();
