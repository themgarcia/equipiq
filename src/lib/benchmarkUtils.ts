import type { BenchmarkType } from '@/types/equipment';
import type { DistanceUnit } from '@/hooks/useDistanceUnit';

/**
 * Format a benchmark range for display, converting miles → km if distanceUnit is 'km'.
 * Hours are universal and pass through unchanged.
 * Calendar-based categories return "Calendar-based".
 */
export function formatBenchmarkRange(
  benchmarkType: BenchmarkType,
  benchmarkRange: string | null,
  distanceUnit: DistanceUnit = 'mi'
): string {
  if (benchmarkType === 'calendar' || !benchmarkRange) return 'Calendar-based';
  if (benchmarkType === 'hours') return benchmarkRange;

  // benchmarkType === 'miles'
  if (distanceUnit === 'mi') return benchmarkRange;

  // Convert miles to km: parse "150,000–200,000 mi"
  const numbers = benchmarkRange.match(/[\d,]+/g);
  if (!numbers || numbers.length < 2) return benchmarkRange;

  const low = Math.round(parseInt(numbers[0].replace(/,/g, ''), 10) * 1.609 / 5000) * 5000;
  const high = Math.round(parseInt(numbers[1].replace(/,/g, ''), 10) * 1.609 / 5000) * 5000;

  return `${low.toLocaleString()}–${high.toLocaleString()} km`;
}
