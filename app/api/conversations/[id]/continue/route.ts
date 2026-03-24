import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Conversation from '@/lib/db/models/Conversation';
import Message from '@/lib/db/models/Message';
import KnowledgeBase from '@/lib/db/models/KnowledgeBase';
import { requireAuth } from '@/lib/auth/middleware';
import { generateConversationSummary, createSessionContext } from '@/lib/utils/summaryGenerator';

// POST endpoint to continue a conversation with enhanced context
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectDB();
    
    const { id } = await params;
    
    // Fetch conversation with knowledge base
    const conversation = await Conversation.findOne({
      _id: id,
      userId: user.userId,
    }).populate('knowledgeBaseId');
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    // Fetch all messages from this conversation
    const messages = await Message.find({ conversationId: id })
      .sort({ timestamp: 1 });
    
    const knowledgeBase = conversation.knowledgeBaseId as any;
    
    // Generate summary if there are previous messages
    let conversationSummary = '';
    let sessionContext = knowledgeBase.prompt;
    
    if (messages.length > 0) {
      conversationSummary = await generateConversationSummary(
        messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString(),
        }))
      );
      
      sessionContext = createSessionContext(knowledgeBase.prompt, conversationSummary);
    }
    
    // Update conversation with new session context
    conversation.sessionContext = sessionContext;
    conversation.status = 'active';
    await conversation.save();
    
    return NextResponse.json({
      success: true,
      conversation: {
        id: String(conversation._id),
        title: conversation.title,
        avatarId: conversation.avatarId,
        voiceId: conversation.voiceId,
        language: conversation.language || 'en',
        knowledgeBase: {
          id: String(knowledgeBase._id),
          name: knowledgeBase.name,
          prompt: knowledgeBase.prompt,
        },
        sessionContext: sessionContext,
        status: conversation.status,
      },
        messages: messages.map(msg => ({
          id: String(msg._id),
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      conversationSummary: conversationSummary,
    });
  } catch (error) {
    console.error('Continue conversation error:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

