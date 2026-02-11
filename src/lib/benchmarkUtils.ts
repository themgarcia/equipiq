import { useMemo } from 'react';
import type { BenchmarkType } from '@/types/equipment';

/**
 * Detect whether the user's locale prefers metric units (km instead of miles).
 * Checks browser locale for Canadian/metric signals.
 * Returns a stable boolean via useMemo.
 */
export function useMetricUnits(): boolean {
  return useMemo(() => {
    const locale = navigator.language || 'en-US';
    // US locales use miles; everything else uses km
    if (locale.startsWith('en-US')) return false;
    // Canadian locales explicitly metric
    if (locale.startsWith('en-CA') || locale.startsWith('fr-CA')) return true;
    // Any non-US English or non-English locale → metric
    if (!locale.startsWith('en-US')) return true;
    return false;
  }, []);
}

/**
 * Format a benchmark range for display, converting miles → km if useMetric is true.
 * Hours are universal and pass through unchanged.
 * Calendar-based categories return "Calendar-based".
 */
export function formatBenchmarkRange(
  benchmarkType: BenchmarkType,
  benchmarkRange: string | null,
  useMetric: boolean
): string {
  if (benchmarkType === 'calendar' || !benchmarkRange) return 'Calendar-based';
  if (benchmarkType === 'hours') return benchmarkRange;

  // benchmarkType === 'miles'
  if (!useMetric) return benchmarkRange;

  // Convert miles to km: parse "150,000–200,000 mi"
  const numbers = benchmarkRange.match(/[\d,]+/g);
  if (!numbers || numbers.length < 2) return benchmarkRange;

  const low = Math.round(parseInt(numbers[0].replace(/,/g, ''), 10) * 1.609 / 5000) * 5000;
  const high = Math.round(parseInt(numbers[1].replace(/,/g, ''), 10) * 1.609 / 5000) * 5000;

  return `${low.toLocaleString()}–${high.toLocaleString()} km`;
}
