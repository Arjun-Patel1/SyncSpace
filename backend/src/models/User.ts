import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // ⚡ Restored: The username field
    username: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    // The new Application-Level Role
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);