/**
 * Next.js Middleware - DISABLED FOR DEBUGGING
 * 
 * Re-enable after fixing upload issues
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simply pass through all requests
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
