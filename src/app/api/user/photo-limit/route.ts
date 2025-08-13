import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPhotoLimit } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const limitCheck = await checkPhotoLimit(workspaceId, session.user.id);

    return NextResponse.json(limitCheck);

  } catch (error) {
    console.error('Error checking photo limit:', error);
    return NextResponse.json(
      { error: 'Failed to check photo limit' },
      { status: 500 }
    );
  }
}
