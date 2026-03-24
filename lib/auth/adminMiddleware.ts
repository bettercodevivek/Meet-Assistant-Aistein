import { NextRequest } from 'next/server';
import { requireAuth } from './middleware';
import User from '../db/models/User';
import connectDB from '../db/mongodb';

export async function requireAdmin(request: NextRequest) {
  // First check if user is authenticated
  const authUser = requireAuth(request);
  
  // Connect to database and get full user details
  await connectDB();
  const user = await User.findById(authUser.userId);
  
  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return user;
}

