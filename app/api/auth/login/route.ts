import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { comparePassword, generateToken } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing credentials' },
        { status: 400 }
      );
    }
    
    // Find user in database
    const user = await User.findOne({ username });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const isValidPassword = await comparePassword(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Migrate old users: add missing fields
    if (!user.role) {
      user.role = username === 'admin' ? 'admin' : 'user';
    }
    if (!user.email) {
      user.email = `${username}@temp.local`;
    }
    if (user.isActive === undefined) {
      user.isActive = true;
    }
    
    // Check if user account is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is inactive. Please contact administrator.' },
        { status: 403 }
      );
    }
    
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    
    const token = generateToken({
      userId: String(user._id),
      username: user.username,
      role: user.role,
    });
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

