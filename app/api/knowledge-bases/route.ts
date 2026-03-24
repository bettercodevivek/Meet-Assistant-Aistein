import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import KnowledgeBase from '@/lib/db/models/KnowledgeBase';
import { requireAuth } from '@/lib/auth/middleware';

// GET all knowledge bases
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);
    await connectDB();
    
    const knowledgeBases = await KnowledgeBase.find({ userId: user.userId })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      knowledgeBases: knowledgeBases.map(kb => ({
        id: String(kb._id),
        name: kb.name,
        prompt: kb.prompt,
        createdAt: kb.createdAt,
        updatedAt: kb.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get knowledge bases error:', error);
    
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

// POST create new knowledge base
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    await connectDB();
    
    const { name, prompt } = await request.json();
    
    if (!name || !prompt) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const knowledgeBase = await KnowledgeBase.create({
      userId: user.userId,
      name,
      prompt,
    });
    
    return NextResponse.json({
      success: true,
      knowledgeBase: {
        id: String(knowledgeBase._id),
        name: knowledgeBase.name,
        prompt: knowledgeBase.prompt,
        createdAt: knowledgeBase.createdAt,
        updatedAt: knowledgeBase.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create knowledge base error:', error);
    
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

