import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI 또는 MONGO_URI 환경변수가 설정되지 않았습니다.",
      );
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB 연결 에러: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
