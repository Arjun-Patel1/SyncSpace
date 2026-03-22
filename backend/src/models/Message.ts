import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    content: { 
        type: String, 
        required: true 
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // ⚡ THE MAGIC: If null, it's Global. If it has an ID, it's Team Chat.
    boardId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Board', 
        default: null 
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt

export default mongoose.model('Message', messageSchema);