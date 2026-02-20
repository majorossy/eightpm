// GraphQL client with retry logic for Magento 2 backend

// Cache duration in seconds
export const CACHE_DURATION = 60 * 5; // 5 minutes

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  nonRetryableStatuses: [400, 401, 403, 404, 422],
};

// Error types that indicate network/timeout issues (should retry)
const RETRYABLE_ERROR_MESSAGES = [
  'fetch failed',
  'network error',
  'timeout',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'socket hang up',
];

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return RETRYABLE_ERROR_MESSAGES.some(msg => message.includes(msg.toLowerCase()));
  }
  return false;
}

function isRetryableStatus(status: number): boolean {
  if (RETRY_CONFIG.nonRetryableStatuses.includes(status)) {
    return false;
  }
  return status >= 500 || status === 429;
}

function getRetryDelay(attempt: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const jitter = exponentialDelay * 0.25 * Math.random();
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  context: string = 'fetch'
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok && isRetryableStatus(response.status)) {
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delay = getRetryDelay(attempt);
          await sleep(delay);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isRetryableError(error) && attempt < RETRY_CONFIG.maxRetries) {
        const delay = getRetryDelay(attempt);
        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error(`[${context}] Request failed after ${RETRY_CONFIG.maxRetries} retries`);
}

// GraphQL endpoint - server-side hits Magento directly; client-side proxies through /api/graphql
export const MAGENTO_GRAPHQL_URL =
  typeof window !== 'undefined'
    ? '/api/graphql'
    : (process.env.MAGENTO_GRAPHQL_URL || 'https://app:8443/graphql');

// Magento media URL for images (browser-accessible)
export const MAGENTO_MEDIA_URL = process.env.NEXT_PUBLIC_MAGENTO_MEDIA_URL || 'https://magento.test/media';

// Next.js extended fetch options
interface NextFetchRequestInit extends RequestInit {
  next?: { revalidate?: number };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface FetchOptions {
  cache?: boolean;
  revalidate?: number;
}

export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: FetchOptions = { cache: true, revalidate: CACHE_DURATION }
): Promise<T> {
  const fetchOptions: NextFetchRequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  };

  // Add Next.js caching options
  if (options.cache) {
    fetchOptions.next = { revalidate: options.revalidate };
  } else {
    fetchOptions.cache = 'no-store';
  }

  const response = await fetchWithRetry(
    MAGENTO_GRAPHQL_URL,
    fetchOptions,
    'GraphQL'
  );

  const result: GraphQLResponse<T> = await response.json();

  if (result.errors) {
    if (!result.data) {
      throw new Error(result.errors.map(e => e.message).join(', '));
    }
  }

  if (!result.data) {
    throw new Error('No data returned from GraphQL');
  }

  return result.data;
}
