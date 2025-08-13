import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkWorkspaceLimit } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitCheck = await checkWorkspaceLimit(session.user.id);

    return NextResponse.json(limitCheck);

  } catch (error) {
    console.error('Error checking workspace limit:', error);
    return NextResponse.json(
      { error: 'Failed to check workspace limit' },
      { status: 500 }
    );
  }
}
