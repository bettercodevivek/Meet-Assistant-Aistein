import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminMiddleware';
import { promises as fs } from 'fs';
import path from 'path';

// GET current API key (masked)
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    
    const apiKey = process.env.HEYGEN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        apiKey: '',
        masked: '',
        isSet: false,
      });
    }
    
    // Mask the API key (show only last 4 characters)
    const masked = apiKey.length > 4 
      ? '•'.repeat(apiKey.length - 4) + apiKey.slice(-4)
      : '•'.repeat(apiKey.length);
    
    return NextResponse.json({
      success: true,
      apiKey: masked,
      isSet: true,
    });
  } catch (error) {
    console.error('Get API key error:', error);
    
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

// PUT update API key
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    
    const { apiKey } = await request.json();
    
    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { success: false, message: 'API key is required' },
        { status: 400 }
      );
    }
    
    // Update the .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, create new content
      envContent = '';
    }
    
    // Parse existing env vars
    const envLines = envContent.split('\n');
    let apiKeyUpdated = false;
    
    // Update or add HEYGEN_API_KEY
    const newEnvLines = envLines.map(line => {
      if (line.startsWith('HEYGEN_API_KEY=')) {
        apiKeyUpdated = true;
        return `HEYGEN_API_KEY=${apiKey}`;
      }
      return line;
    });
    
    // If not found, add it
    if (!apiKeyUpdated) {
      newEnvLines.push(`HEYGEN_API_KEY=${apiKey}`);
    }
    
    // Write back to file
    await fs.writeFile(envPath, newEnvLines.join('\n'), 'utf-8');
    
    // Update the process.env for current runtime
    process.env.HEYGEN_API_KEY = apiKey;
    
    return NextResponse.json({
      success: true,
      message: 'API key updated successfully. Please restart the server for changes to take effect.',
    });
  } catch (error) {
    console.error('Update API key error:', error);
    
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

