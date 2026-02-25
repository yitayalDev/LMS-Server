import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import mongoose from 'mongoose';
import { initSocket } from './socket';

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lmsuog')
    .then(() => {
        console.log('MongoDB Connected');
        server.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    })
    .catch((err: any) => console.log(err));
