import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    color: { type: String, default: 'bg-white' },
    listId: { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
    position: { type: Number, required: true },
    
    // ⚡ NEW: Enterprise Task Features
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate: { type: Date },
    
    // ⚡ NEW: Who is working on this? (Array of User IDs)
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Card', cardSchema);