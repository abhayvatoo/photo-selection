import { NextRequest } from 'next/server';
import { getCSRFToken } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return getCSRFToken(request);
}
