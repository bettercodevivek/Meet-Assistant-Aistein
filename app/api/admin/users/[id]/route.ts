import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import Conversation from '@/lib/db/models/Conversation';
import KnowledgeBase from '@/lib/db/models/KnowledgeBase';
import Message from '@/lib/db/models/Message';
import { requireAdmin } from '@/lib/auth/adminMiddleware';

// GET single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const { id } = await params;
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get user statistics
    const [conversationCount, knowledgeBaseCount, messageCount] = await Promise.all([
      Conversation.countDocuments({ userId: id }),
      KnowledgeBase.countDocuments({ userId: id }),
      Message.countDocuments({ 
        conversationId: { 
          $in: await Conversation.find({ userId: id }).distinct('_id') 
        } 
      }),
    ]);
    
    return NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        conversationCount,
        knowledgeBaseCount,
        messageCount,
      },
    });
  } catch (error) {
    console.error('Get user details error:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update user status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;
    
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prevent deactivating admin users
    if (user.role === 'admin' && isActive === false) {
      return NextResponse.json(
        { success: false, message: 'Cannot deactivate admin users' },
        { status: 400 }
      );
    }
    
    user.isActive = isActive;
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const { id } = await params;
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prevent deleting admin users
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete admin users' },
        { status: 400 }
      );
    }
    
    // Get all conversations for this user
    const conversations = await Conversation.find({ userId: id });
    const conversationIds = conversations.map(c => c._id);
    
    // Delete all related data
    await Promise.all([
      Message.deleteMany({ conversationId: { $in: conversationIds } }),
      Conversation.deleteMany({ userId: id }),
      KnowledgeBase.deleteMany({ userId: id }),
      User.findByIdAndDelete(id),
    ]);
    
    return NextResponse.json({
      success: true,
      message: 'User and all related data deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

