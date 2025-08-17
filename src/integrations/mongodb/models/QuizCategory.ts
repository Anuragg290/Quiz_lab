import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizCategory extends Document {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const quizCategorySchema = new Schema<IQuizCategory>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  icon: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

export const QuizCategory = mongoose.model<IQuizCategory>('QuizCategory', quizCategorySchema);
