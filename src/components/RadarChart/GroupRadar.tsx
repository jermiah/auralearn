/**
 * Group Radar Component
 * Triple-overlay radar comparing Support, Core, and Advanced student groups
 * Groups dynamically classified based on performance (<50%, 50-75%, >75%)
 */

import React, { useEffect, useState } from 'react';
import DynamicRadarChart from './DynamicRadarChart';
import type { RadarDataPoint, GroupMasteryData } from '@/types/radar-types';

export interface GroupRadarProps {
  classId: string;
  subject?: string;
  height?: number;
  className?: string;
}

export default function GroupRadar({
  classId,
  subject,
  height = 450,
  className = '',
}: GroupRadarProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<GroupMasteryData[]>([]);

  useEffect(() => {
    async function loadGroupMastery() {
      try {
        setLoading(true);
        setError(null);

        // Fetch group mastery from backend API
        const url = new URL(`http://localhost:5000/api/radar/groups/${classId}`);
        if (subject) {
          url.searchParams.set('subject', subject);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Failed to fetch group mastery: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setGroupData(data.groups);
      } catch (err) {
        console.error('Error loading group mastery:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadGroupMastery();
  }, [classId, subject]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
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

  if (groupData.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-600 dark:text-gray-400">No group data available</p>
      </div>
    );
  }

  // Transform group data to radar datasets
  const datasets = groupData.map((group) => {
    const radarPoints: RadarDataPoint[] = group.domains.map((domain) => ({
      axis: domain.domain,
      value: domain.value,
      max: 100,
      id: domain.domain.toLowerCase().replace(/\s+/g, '_'),
    }));

    // Color coding for groups
    const groupColors: Record<string, string> = {
      Support: '#ef4444', // Red
      Core: '#f59e0b', // Amber
      Advanced: '#10b981', // Green
    };

    return {
      label: group.group_name,
      data: radarPoints,
      color: groupColors[group.group_name] || '#6b7280',
    };
  });

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Group Performance Comparison
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Support vs Core vs Advanced groups by domain (0-100 scale)
        </p>
      </div>

      {/* Group distribution summary */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        {groupData.map((group) => (
          <div
            key={group.group_name}
            className={`p-3 rounded-lg border ${
              group.group_name === 'Support'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : group.group_name === 'Core'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}
          >
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {group.group_name}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {group.student_count}
            </p>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">students</p>
          </div>
        ))}
      </div>

      <DynamicRadarChart
        data={datasets[0].data}
        datasets={datasets}
        maxValue={100}
        height={height}
        showLegend={true}
        showTooltip={true}
        gridType="polygon"
      />

      {/* Performance gaps analysis */}
      <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">
          Group Analysis
        </h4>
        <div className="space-y-2 text-xs text-orange-800 dark:text-orange-400">
          {groupData.map((group) => {
            const avgScore =
              group.domains.reduce((sum, d) => sum + d.value, 0) / group.domains.length;
            return (
              <div key={group.group_name} className="flex items-center justify-between">
                <span className="font-medium">{group.group_name} Group Average:</span>
                <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded">
                  {avgScore.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        {groupData.length >= 2 && (
          <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
            <p className="text-xs text-orange-700 dark:text-orange-500">
              <strong>Performance Gap:</strong>{' '}
              {(() => {
                const advancedAvg =
                  groupData.find((g) => g.group_name === 'Advanced')?.domains.reduce(
                    (sum, d) => sum + d.value,
                    0
                  ) /
                    (groupData.find((g) => g.group_name === 'Advanced')?.domains.length || 1) || 0;
                const supportAvg =
                  groupData.find((g) => g.group_name === 'Support')?.domains.reduce(
                    (sum, d) => sum + d.value,
                    0
                  ) /
                    (groupData.find((g) => g.group_name === 'Support')?.domains.length || 1) || 0;
                const gap = Math.abs(advancedAvg - supportAvg);
                return `${gap.toFixed(1)}% between Advanced and Support groups`;
              })()}
            </p>
          </div>
        )}
      </div>

      {/* Domain-specific gaps */}
      {groupData.length >= 2 && groupData[0].domains.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Largest Performance Gaps by Domain
          </h4>
          <div className="space-y-2">
            {(() => {
              // Calculate gaps for each domain
              const domainGaps = groupData[0].domains.map((_, index) => {
                const domainName = groupData[0].domains[index].domain;
                const values = groupData.map((g) => g.domains[index]?.value || 0);
                const gap = Math.max(...values) - Math.min(...values);
                return { domain: domainName, gap };
              });

              return domainGaps
                .sort((a, b) => b.gap - a.gap)
                .slice(0, 3)
                .map((item) => (
                  <div
                    key={item.domain}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">
                      {item.domain}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">{item.gap.toFixed(1)}% gap</span>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
