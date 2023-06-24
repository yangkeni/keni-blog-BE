import express from 'express';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/post.js';
import tagRoutes from './routes/tag.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

const app = express();

dotenv.config();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/tag', tagRoutes);

app.listen(8888, () => {
  console.log('Connected!');
});
