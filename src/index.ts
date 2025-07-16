import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../app';

dotenv.config();

const port = process.env.PORT || 3000;
const mongooseUri = process.env.MONGOOSE_URI || '';

mongoose.connect(mongooseUri)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err: Error) => {
    console.error('MongoDB connection error:', err);
  });
