import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  avatarId: string;
  voiceId?: string;
  language?: string;
  knowledgeBaseId: mongoose.Types.ObjectId;
  title: string;
  status: 'active' | 'completed';
  sessionContext?: string;
  conversationSummary?: string;
  createdAt: Date;
  lastMessageAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  avatarId: {
    type: String,
    required: true,
  },
  voiceId: {
    type: String,
  },
  language: {
    type: String,
  },
  knowledgeBaseId: {
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeBase',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  sessionContext: {
    type: String,
    default: '',
  },
  conversationSummary: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
});

export default (mongoose.models.Conversation as Model<IConversation>) || mongoose.model<IConversation>('Conversation', ConversationSchema);

