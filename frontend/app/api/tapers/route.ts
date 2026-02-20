import { NextRequest, NextResponse } from 'next/server';
import { heavyRateLimit } from '@/lib/rateLimit';

// GraphQL endpoint
const MAGENTO_GRAPHQL_URL = process.env.MAGENTO_GRAPHQL_URL || 'https://app:8443/graphql';

interface Taper {
  name: string;
  count: number;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface MagentoProduct {
  show_taper: string | null;
}

// Excluded taper values
const EXCLUDED_TAPERS = new Set([
  'not stored',
  'unknown',
  '',
  null,
]);

// Fetch all products with taper info in batches
async function fetchAllTapers(): Promise<Map<string, number>> {
  const taperCounts = new Map<string, number>();
  const PAGE_SIZE = 500;
  let currentPage = 1;
  let totalFetched = 0;
  let totalCount = 0;

  // Query to get show_taper from all products
  const query = `
    query GetTapers($pageSize: Int!, $currentPage: Int!) {
      products(search: "", pageSize: $pageSize, currentPage: $currentPage) {
        items {
          show_taper
        }
        total_count
      }
    }
  `;

  do {
    const response = await fetch(MAGENTO_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { pageSize: PAGE_SIZE, currentPage },
      }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    const result: GraphQLResponse<{
      products: { items: MagentoProduct[]; total_count: number };
    }> = await response.json();

    if (result.errors) {
      console.error('[tapers API] GraphQL errors:', result.errors);
      throw new Error(result.errors.map(e => e.message).join(', '));
    }

    const products = result.data?.products?.items || [];
    totalCount = result.data?.products?.total_count || 0;
    totalFetched += products.length;

    // Aggregate taper counts
    for (const product of products) {
      const taper = product.show_taper?.trim().toLowerCase();
      if (taper && !EXCLUDED_TAPERS.has(taper)) {
        taperCounts.set(taper, (taperCounts.get(taper) || 0) + 1);
      }
    }

    currentPage++;
  } while (totalFetched < totalCount);

  return taperCounts;
}

// Convert map to sorted array
function mapToSortedArray(taperCounts: Map<string, number>): Taper[] {
  return Array.from(taperCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // Sort by count descending
}

// Cache the results in memory for faster subsequent requests
let cachedTapers: Taper[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  // Check rate limit (heavy endpoint - 10 req/min)
  const rateLimitResult = await heavyRateLimit.check(request, 'tapers');
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    // Check cache
    if (cachedTapers && Date.now() - cacheTimestamp < CACHE_TTL) {
      const response = NextResponse.json({
        tapers: cachedTapers,
        totalTapers: cachedTapers.length,
        totalRecordings: cachedTapers.reduce((sum, t) => sum + t.count, 0),
        cached: true,
      });
      return heavyRateLimit.addHeaders(response, rateLimitResult);
    }

    const taperCounts = await fetchAllTapers();
    const tapers = mapToSortedArray(taperCounts);

    // Update cache
    cachedTapers = tapers;
    cacheTimestamp = Date.now();


    const response = NextResponse.json({
      tapers,
      totalTapers: tapers.length,
      totalRecordings: tapers.reduce((sum, t) => sum + t.count, 0),
      cached: false,
    });
    return heavyRateLimit.addHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('[tapers API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tapers' },
      { status: 500 }
    );
  }
}
