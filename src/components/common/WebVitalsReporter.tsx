'use client';

import { useReportWebVitals } from 'next/web-vitals';

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      route: window.location.pathname,
      metric: metric.name,
      value: metric.value,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/v1/metrics', body);
    } else {
      fetch('/api/v1/metrics', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        keepalive: true,
      }).catch(() => {});
    }
  });

  return null;
}
