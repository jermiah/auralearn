/**
 * Curriculum Radar Component
 * Dynamic-axis radar for curriculum domain mastery
 * Domains extracted from backend API (curriculum_chunks table)
 * NO HARDCODED domain names
 */

import React, { useEffect, useState } from 'react';
import DynamicRadarChart from './DynamicRadarChart';
import { generateRadarAxes } from '@/utils/radar-axis-generator';
import { getDomainColor } from '@/utils/radar-color-palette';
import type { RadarDataPoint, CurriculumMasteryData } from '@/types/radar-types';

export interface CurriculumRadarProps {
  classId: string;
  subject?: string;
  height?: number;
  className?: string;
}

export default function CurriculumRadar({
  classId,
  subject,
  height = 400,
  className = '',
}: CurriculumRadarProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [masteryData, setMasteryData] = useState<CurriculumMasteryData | null>(null);

  useEffect(() => {
    async function loadCurriculumMastery() {
      try {
        setLoading(true);
        setError(null);

        // Fetch curriculum mastery from backend API
        const url = new URL(`http://localhost:5000/api/radar/mastery/${classId}`);
        if (subject) {
          url.searchParams.set('subject', subject);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Failed to fetch curriculum mastery: ${response.statusText}`);
        }

        const data: CurriculumMasteryData = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setMasteryData(data);

        // Convert domain scores to radar format
        const domainScoresMap: Record<string, number> = {};
        data.domain_scores.forEach((domain) => {
          domainScoresMap[domain.domain] = domain.value;
        });

        // Generate radar axes (auto-group if >10 domains)
        const axes = generateRadarAxes(domainScoresMap, 100, 10);

        // Add colors based on domain IDs
        const coloredAxes = axes.map((axis) => ({
          ...axis,
          color: getDomainColor(axis.id),
        }));

        setRadarData(coloredAxes);
      } catch (err) {
        console.error('Error loading curriculum mastery:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadCurriculumMastery();
  }, [classId, subject]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-semibold">Error Loading Data</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (radarData.length === 0 || !masteryData) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-600 dark:text-gray-400">No curriculum data available</p>
      </div>
    );
  }

  const colors = radarData.map((axis) => getDomainColor(axis.id));

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Curriculum Domain Mastery
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {masteryData.subject} - Class average by domain (0-100 scale)
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {masteryData.domain_scores.length} domains assessed
        </p>
      </div>

      <DynamicRadarChart
        data={radarData}
        maxValue={100}
        colors={colors}
        height={height}
        showLegend={false}
        showTooltip={true}
        gridType="polygon"
      />

      {/* Domain scores breakdown */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Domain Breakdown
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {masteryData.domain_scores
            .sort((a, b) => b.value - a.value)
            .map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getDomainColor(domain.domain) }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {domain.domain}
                  </span>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {domain.value}%
                  </span>
                  <span className="text-gray-500 dark:text-gray-500 text-[10px]">
                    ({domain.students_assessed} students)
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Mastery summary */}
      <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-teal-700 dark:text-teal-400 mb-1">Strong Domains</p>
            <p className="text-lg font-bold text-teal-900 dark:text-teal-300">
              {masteryData.domain_scores.filter((d) => d.value >= 75).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-teal-700 dark:text-teal-400 mb-1">Developing</p>
            <p className="text-lg font-bold text-teal-900 dark:text-teal-300">
              {masteryData.domain_scores.filter((d) => d.value >= 50 && d.value < 75).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-teal-700 dark:text-teal-400 mb-1">Needs Support</p>
            <p className="text-lg font-bold text-teal-900 dark:text-teal-300">
              {masteryData.domain_scores.filter((d) => d.value < 50).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
