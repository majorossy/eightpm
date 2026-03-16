import { NextRequest, NextResponse } from 'next/server';

const GRAPHQL_ENDPOINT = process.env.MAGENTO_GRAPHQL_URL || 'https://magento.test/graphql';
const MAX_BODY_SIZE = 64 * 1024; // 64KB
const FETCH_TIMEOUT_MS = 15_000; // 15 seconds

/**
 * GraphQL proxy for client-side components.
 * Avoids CORS and self-signed cert issues by routing through the Next.js server.
 */
export async function POST(request: NextRequest) {
  try {
    // Reject oversized requests before parsing
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { errors: [{ message: 'Request body too large' }] },
        { status: 413 }
      );
    }

    const body = await request.json();

    const serialized = JSON.stringify(body);
    if (serialized.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { errors: [{ message: 'Request body too large' }] },
        { status: 413 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header for authenticated requests
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers,
        body: serialized,
        cache: 'no-store',
        signal: controller.signal,
      });

      const data = await response.json();
      return NextResponse.json(data);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[api/graphql] Proxy error:', message);
    return NextResponse.json(
      { errors: [{ message: 'GraphQL proxy error' }] },
      { status: 502 }
    );
  }
}
