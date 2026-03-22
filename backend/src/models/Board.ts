import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    // ⚡ NEW: Instead of one owner, we have an array of members with specific permissions
    members: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        role: { 
            type: String, 
            enum: ['owner', 'admin', 'editor', 'viewer'], 
            default: 'editor' 
        }
    }]
}, { timestamps: true });

export default mongoose.model('Board', boardSchema);