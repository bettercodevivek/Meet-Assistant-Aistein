import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import Conversation from '@/lib/db/models/Conversation';
import KnowledgeBase from '@/lib/db/models/KnowledgeBase';
import { requireAdmin } from '@/lib/auth/adminMiddleware';
import bcrypt from 'bcryptjs';

// GET all users
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectDB();
    
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    // Get conversation count and KB count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const conversationCount = await Conversation.countDocuments({ userId: user._id });
        const knowledgeBaseCount = await KnowledgeBase.countDocuments({ userId: user._id });
        
        return {
          id: String(user._id),
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          isActive: user.isActive,
          conversationCount,
          knowledgeBaseCount,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      users: usersWithStats,
    });
  } catch (error) {
    console.error('Get users error:', error);
    
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

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    await connectDB();
    
    const body = await request.json();
    const { username, password, email } = body;
    
    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await User.create({
      username,
      password: hashedPassword,
      email: email || `${username}@temp.local`,
      role: 'user',
      isActive: true,
      createdBy: admin._id,
    });
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: String(newUser._id),
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    
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

