import { NextRequest } from 'next/server';
import { verifyToken, TokenPayload } from './auth';

export function getAuthUser(request: NextRequest): TokenPayload | null {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

export function requireAuth(request: NextRequest): TokenPayload {
  const user = getAuthUser(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

