import { NextResponse } from 'next/server';
import { getStorageInfo } from '@/lib/storage';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const storageInfo = getStorageInfo();
    
    return NextResponse.json({
      storage: storageInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting storage status:', error);
    return NextResponse.json(
      { error: 'Failed to get storage status' },
      { status: 500 }
    );
  }
}
