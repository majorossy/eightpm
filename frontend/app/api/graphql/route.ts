import { NextRequest, NextResponse } from 'next/server';

const GRAPHQL_ENDPOINT = process.env.MAGENTO_GRAPHQL_URL || 'https://magento.test/graphql';

/**
 * GraphQL proxy for client-side components.
 * Avoids CORS and self-signed cert issues by routing through the Next.js server.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header for authenticated requests
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[api/graphql] Proxy error:', error);
    return NextResponse.json(
      { errors: [{ message: 'GraphQL proxy error' }] },
      { status: 502 }
    );
  }
}
