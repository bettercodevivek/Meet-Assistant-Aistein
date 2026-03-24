import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Conversation from '@/lib/db/models/Conversation';
import Message from '@/lib/db/models/Message';
import { requireAuth } from '@/lib/auth/middleware';

// POST add message to conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireAuth(request);
    await connectDB();
    
    const { id } = await params;
    const { role, content } = await request.json();
    
    if (!role || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
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
    
    const message = await Message.create({
      conversationId: id,
      role,
      content,
    });
    
    // Update conversation's last message timestamp
    await Conversation.findByIdAndUpdate(id, {
      lastMessageAt: new Date(),
    });
    
    return NextResponse.json({
      success: true,
      message: {
        id: String(message._id),
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
      },
    });
  } catch (error) {
    console.error('Add message error:', error);
    
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

