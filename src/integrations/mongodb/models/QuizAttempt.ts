import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  score: number;
  totalQuestions: number;
  answers: Array<{
    questionId: mongoose.Types.ObjectId;
    selectedAnswer: number;
    isCorrect: boolean;
  }>;
  timeTaken?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quizAttemptSchema = new Schema<IQuizAttempt>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'QuizCategory',
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  totalQuestions: {
    type: Number,
    required: true,
    min: 1,
  },
  answers: [{
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'QuizQuestion',
      required: true,
    },
    selectedAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  }],
  timeTaken: {
    type: Number,
    min: 0,
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);
