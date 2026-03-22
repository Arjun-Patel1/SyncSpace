import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db'; 
import boardRoutes from './routes/boardRoutes';
import listRoutes from './routes/listRoutes';
import cardRoutes from './routes/cardRoutes';
import authRoutes from './routes/authRoutes';
import messageRoutes from './routes/messageRoutes'; // Messaging routes
import { protect } from './middleware/auth';

// Load environment variables
dotenv.config();

// Connect to the database
connectDB(); 

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Allow all temporarily
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', protect, boardRoutes);
app.use('/api/lists', protect, listRoutes); 
app.use('/api/cards', protect, cardRoutes);
app.use('/api/messages', protect, messageRoutes); 

// Basic Health Check Route
app.get('/', (req, res) => {
    res.send('SyncSpace API is running');
});

// Create HTTP server and wrap it with Socket.io
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*', // Allow all temporarily
        methods: ['GET', 'POST']
    }
});

// Real-time Socket Connection
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // --- BOARD LOGIC ---
    socket.on('join_board', (boardId) => {
        socket.join(boardId);
        console.log(`User joined board room: ${boardId}`);
    });

    socket.on('board_changed', (boardId) => {
        socket.to(boardId).emit('update_board');
    });

    // --- CHAT ROOM LOGIC ---
    // 1. Join a specific chat room (Global or Team)
    socket.on('join_chat', (roomId) => {
        socket.join(`chat_${roomId}`);
        console.log(`User joined chat room: chat_${roomId}`);
    });

    // 2. Broadcast a new message to everyone in that specific room
    socket.on('send_message', (data) => {
        // data should look like { roomId: 'global', message: { ...populatedMessageData } }
        socket.to(`chat_${data.roomId}`).emit('receive_message', data.message);
    });

    // --- ⚡ NEW: NOTIFICATION LOGIC ---
    socket.on('send_notification', (data) => {
        // Broadcasts to everyone ELSE in the board room
        // data looks like { roomId: '12345', message: 'Arjun completed a task!' }
        socket.to(data.roomId).emit('receive_notification', { message: data.message });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start the server
const PORT = Number(process.env.PORT) || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});