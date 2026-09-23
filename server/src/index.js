import express from 'express';
import { createApi } from './routes/api.js';
import { openDatabase } from './db/index.js';
const db = openDatabase();
const app = express();
app.use(express.json({ limit: '100kb' }));
app.use('/api', createApi({ db }));
app.listen(Number(process.env.PORT || 3001), '127.0.0.1', () => console.log('Play Store Miner API ready'));
