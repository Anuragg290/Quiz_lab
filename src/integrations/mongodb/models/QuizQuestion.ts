import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizQuestion extends Document {
  categoryId: mongoose.Types.ObjectId;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty?: string;
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'QuizCategory',
    required: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length === 4;
      },
      message: 'Options must have exactly 4 items'
    }
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  explanation: {
    type: String,
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
}, {
  timestamps: true,
});

export const QuizQuestion = mongoose.model<IQuizQuestion>('QuizQuestion', quizQuestionSchema);
