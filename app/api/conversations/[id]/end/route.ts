import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Conversation from '@/lib/db/models/Conversation';
import Message from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth/middleware';
import { generateConversationSummary } from '@/lib/utils/summaryGenerator';

// POST end conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectDB();
    
    const { id } = await params;
    
    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({
      _id: id,
      userId: user.userId,
    });
    
    if (!conversation) {
      return NextResponse.json(
        { success: false, message: 'Conversation not found' },
        { status: 404 }
      );
    }
    
    // Get all messages from this conversation
    const messages = await Message.find({ conversationId: id })
      .sort({ timestamp: 1 });
    
    // Generate final conversation summary using OpenAI
    const conversationSummary = await generateConversationSummary(
      messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
      }))
    );
    
    // Update conversation with final summary and mark as completed
    // IMPORTANT: Do NOT modify the knowledge base - only save summary to conversation
    await Conversation.findByIdAndUpdate(id, {
      status: 'completed',
      conversationSummary: conversationSummary,
      lastMessageAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      message: 'Conversation ended successfully',
    });
  } catch (error) {
    console.error('End conversation error:', error);
    
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

