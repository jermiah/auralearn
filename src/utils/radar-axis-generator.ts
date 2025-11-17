/**
 * Dynamic Radar Axis Generation
 * Automatically handles variable axis counts and grouping
 */

import type { RadarDataPoint } from '@/types/radar-types';

/**
 * Format domain/category name for display
 */
export function formatAxisLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate radar axes from data object (dynamic keys)
 * Auto-groups if more than maxAxes
 */
export function generateRadarAxes(
  data: Record<string, number>,
  maxValue: number,
  maxAxes: number = 10
): RadarDataPoint[] {
  const entries = Object.entries(data).filter(([_, value]) => value > 0);

  // If within limit, return all axes
  if (entries.length <= maxAxes) {
    return entries
      .map(([key, value]) => ({
        axis: formatAxisLabel(key),
        value,
        max: maxValue,
        id: key,
      }))
      .sort((a, b) => a.axis.localeCompare(b.axis));
  }

  // Group low-variance domains
  return groupDomainsByVariance(entries, maxValue, maxAxes);
}

/**
 * Group domains with similar scores to reduce axes count
 */
function groupDomainsByVariance(
  entries: [string, number][],
  maxValue: number,
  targetCount: number
): RadarDataPoint[] {
  // Sort by value
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);

  // Calculate variance
  const mean = sorted.reduce((sum, [_, v]) => sum + v, 0) / sorted.length;
  const variance = sorted.map(([key, value]) => ({
    key,
    value,
    deviation: Math.abs(value - mean),
  }));

  // Keep high-variance items, group low-variance ones
  const highVariance = variance.filter((item) => item.deviation > mean * 0.2);
  const lowVariance = variance.filter((item) => item.deviation <= mean * 0.2);

  const result: RadarDataPoint[] = highVariance.map((item) => ({
    axis: formatAxisLabel(item.key),
    value: item.value,
    max: maxValue,
    id: item.key,
  }));

  // Group remaining low-variance items
  if (lowVariance.length > 0) {
    const avgValue = lowVariance.reduce((sum, item) => sum + item.value, 0) / lowVariance.length;
    result.push({
      axis: 'Other Domains',
      value: Math.round(avgValue),
      max: maxValue,
      id: 'grouped_domains',
      category: lowVariance.map((item) => item.key).join(', '),
    });
  }

  return result.slice(0, targetCount);
}

/**
 * Generate axes for student learning categories (8 fixed)
 */
export function generateStudentLearningAxes(
  categoryScores: Record<string, number>
): RadarDataPoint[] {
  return Object.entries(categoryScores)
    .map(([key, value]) => ({
      axis: formatAxisLabel(key),
      value,
      max: 100,
      id: key,
    }))
    .sort((a, b) => a.axis.localeCompare(b.axis));
}

/**
 * Generate axes for cognitive domains (6 fixed)
 */
export function generateCognitiveAxes(
  domainScores: Record<string, number>,
  strengths: string[] = [],
  areasForSupport: string[] = []
): RadarDataPoint[] {
  return Object.entries(domainScores).map(([key, value]) => ({
    axis: formatAxisLabel(key),
    value,
    max: 5,
    id: key,
    category:
      strengths.includes(key)
        ? 'strength'
        : areasForSupport.includes(key)
        ? 'support'
        : 'normal',
  }));
}

/**
 * Normalize data to common scale for comparison
 */
export function normalizeToScale(
  value: number,
  currentMax: number,
  targetMax: number
): number {
  return (value / currentMax) * targetMax;
}

/**
 * Calculate optimal axis count based on data variance
 */
export function calculateOptimalAxisCount(data: Record<string, number>): number {
  const values = Object.values(data).filter((v) => v > 0);

  if (values.length <= 5) return values.length;
  if (values.length <= 8) return Math.min(values.length, 8);

  // Calculate coefficient of variation
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  // High variance: keep more axes (up to 12)
  // Low variance: group more aggressively (down to 6)
  if (cv > 0.5) return Math.min(12, values.length);
  if (cv > 0.3) return Math.min(10, values.length);
  return Math.min(8, values.length);
}

/**
 * Merge multiple radar datasets for comparison
 */
export function mergeRadarDatasets(
  datasets: { label: string; data: RadarDataPoint[] }[]
): { axes: string[]; datasets: { label: string; values: number[] }[] } {
  // Extract all unique axes
  const allAxes = new Set<string>();
  datasets.forEach((dataset) => {
    dataset.data.forEach((point) => allAxes.add(point.axis));
  });

  const axes = Array.from(allAxes).sort();

  // Align all datasets to same axes
  const alignedDatasets = datasets.map((dataset) => {
    const axisToValue = new Map(dataset.data.map((point) => [point.axis, point.value]));

    const values = axes.map((axis) => axisToValue.get(axis) || 0);

    return {
      label: dataset.label,
      values,
    };
  });

  return { axes, datasets: alignedDatasets };
}

/**
 * Filter axes by threshold (remove low-value axes)
 */
export function filterAxesByThreshold(
  data: RadarDataPoint[],
  threshold: number
): RadarDataPoint[] {
  return data.filter((point) => point.value >= threshold);
}

/**
 * Sort axes by value (descending)
 */
export function sortAxesByValue(data: RadarDataPoint[]): RadarDataPoint[] {
  return [...data].sort((a, b) => b.value - a.value);
}

/**
 * Sort axes alphabetically
 */
export function sortAxesAlphabetically(data: RadarDataPoint[]): RadarDataPoint[] {
  return [...data].sort((a, b) => a.axis.localeCompare(b.axis));
}
