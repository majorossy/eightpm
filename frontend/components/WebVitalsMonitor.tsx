'use client';

import { useEffect } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { trackWebVitals, type WebVitalMetric, isAnalyticsAvailable } from '@/lib/analytics';

/**
 * WebVitalsMonitor - Reports Core Web Vitals metrics to Google Analytics 4
 *
 * Metrics tracked:
 * - CLS (Cumulative Layout Shift) - Visual stability (threshold: good < 0.1, poor > 0.25)
 * - FCP (First Contentful Paint) - Time to first content (threshold: good < 1.8s, poor > 3s)
 * - INP (Interaction to Next Paint) - Responsiveness (threshold: good < 200ms, poor > 500ms)
 * - LCP (Largest Contentful Paint) - Loading performance (threshold: good < 2.5s, poor > 4s)
 * - TTFB (Time to First Byte) - Server response time (threshold: good < 800ms, poor > 1.8s)
 *
 * In development: Logs to console with color coding
 * In production: Sends to Google Analytics 4
 *
 * @see CARD-7C for SEO monitoring implementation
 * @see https://web.dev/vitals/ for Core Web Vitals thresholds
 */

function reportMetric(metric: Metric) {
  // Convert web-vitals Metric to our WebVitalMetric type
  const webVitalMetric: WebVitalMetric = {
    name: metric.name as WebVitalMetric['name'],
    value: metric.value,
    rating: metric.rating as WebVitalMetric['rating'],
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  };

  // Send to Google Analytics 4 (works in both dev and production)
  if (isAnalyticsAvailable()) {
    trackWebVitals(webVitalMetric);
  }

  // Fallback: Send to custom endpoint for aggregation (production only)
  // This is useful for creating custom dashboards or alerting
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_VITALS_ENDPOINT) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
    });

    // Use sendBeacon for reliability during page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(process.env.NEXT_PUBLIC_VITALS_ENDPOINT, body);
    } else {
      fetch(process.env.NEXT_PUBLIC_VITALS_ENDPOINT, {
        method: 'POST',
        body,
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {
        // Silently fail - vitals reporting should not impact user experience
      });
    }
  }
}

export default function WebVitalsMonitor() {
  useEffect(() => {
    // Register all Core Web Vitals metrics
    // These callbacks fire once per page load with final metric values
    onCLS(reportMetric);
    onFCP(reportMetric);
    onINP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
  }, []);

  // This component renders nothing - it's just a side-effect provider
  return null;
}
