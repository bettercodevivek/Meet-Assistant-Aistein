import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Conversation from '@/lib/db/models/Conversation';
import Message from '@/lib/db/models/Message';
import User from '@/lib/db/models/User';
import { requireAdmin } from '@/lib/auth/adminMiddleware';

// GET all conversations from all users
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    const query = userId ? { userId } : {};
    
    const conversations = await Conversation.find(query)
      .populate('knowledgeBaseId', 'name')
      .populate('userId', 'username email')
      .sort({ lastMessageAt: -1 })
      .limit(100);
    
    // Get message count for each conversation
    const conversationsWithStats = await Promise.all(
      conversations.map(async (conv) => {
        const messageCount = await Message.countDocuments({ conversationId: conv._id });
        
        const knowledgeBase = conv.knowledgeBaseId ? {
          id: String((conv.knowledgeBaseId as any)._id),
          name: (conv.knowledgeBaseId as any).name,
        } : null;
        
        const user = conv.userId ? {
          id: String((conv.userId as any)._id),
          username: (conv.userId as any).username,
          email: (conv.userId as any).email,
        } : null;
        
        return {
          id: String(conv._id),
          title: conv.title,
          avatarId: conv.avatarId,
          status: conv.status,
          createdAt: conv.createdAt,
          lastMessageAt: conv.lastMessageAt,
          messageCount,
          knowledgeBase,
          user,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      conversations: conversationsWithStats,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
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

