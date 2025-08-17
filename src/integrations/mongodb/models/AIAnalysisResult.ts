import mongoose, { Document, Schema } from 'mongoose';

export interface IAIAnalysisResult extends Document {
  userId: mongoose.Types.ObjectId;
  quizAttemptId: mongoose.Types.ObjectId;
  overallFeedback?: string;
  weakAreas?: string[];
  studyRecommendations?: string[];
  nextSteps?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const aiAnalysisResultSchema = new Schema<IAIAnalysisResult>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quizAttemptId: {
    type: Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    required: true,
  },
  overallFeedback: {
    type: String,
    trim: true,
  },
  weakAreas: [{
    type: String,
    trim: true,
  }],
  studyRecommendations: [{
    type: String,
    trim: true,
  }],
  nextSteps: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

export const AIAnalysisResult = mongoose.model<IAIAnalysisResult>('AIAnalysisResult', aiAnalysisResultSchema);
