import mongoose, { Schema, Document } from 'mongoose';

export interface IList extends Document {
  title: string;
  boardId: mongoose.Types.ObjectId; // Links back to the Board
  position: number; // For ordering lists
}

const ListSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  position: { type: Number, required: true, default: 0 }
}, { timestamps: true });

export default mongoose.model<IList>('List', ListSchema);
