import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-lab';
    await mongoose.connect(uri);
    // Log sanitized target (no credentials)
    try {
      const parsed = new URL(uri);
      const host = parsed.host;
      const db = parsed.pathname.replace(/^\//, '') || '(default)';
      const usingEnv = !!process.env.MONGODB_URI;
      console.log(`MongoDB connected successfully to ${host}/${db}${usingEnv ? '' : ' (local fallback)'}`);
    } catch {
      console.log('MongoDB connected successfully');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
};
