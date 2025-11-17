/**
 * Dynamic Radar Chart Component
 * Supports 3-12 axes with dynamic data
 * NO HARDCODED axis names or values
 */

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { RadarDataPoint } from '@/types/radar-types';

export interface DynamicRadarChartProps {
  data: RadarDataPoint[];
  datasets?: { label: string; data: RadarDataPoint[]; color: string }[];
  maxValue?: number;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  gridType?: 'polygon' | 'circle';
  height?: number;
  className?: string;
}

/**
 * Core Radar Chart Component
 * Dynamically renders radar chart with variable axes count
 */
export default function DynamicRadarChart({
  data,
  datasets,
  maxValue,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'],
  showLegend = true,
  showTooltip = true,
  gridType = 'polygon',
  height = 400,
  className = '',
}: DynamicRadarChartProps) {
  // Transform data for recharts format
  const chartData = React.useMemo(() => {
    if (datasets && datasets.length > 0) {
      // Multi-dataset mode (e.g., triangulation, group comparison)
      const allAxes = new Set<string>();
      datasets.forEach((dataset) => {
        dataset.data.forEach((point) => allAxes.add(point.axis));
      });

      const axes = Array.from(allAxes).sort();

      return axes.map((axis) => {
        const dataPoint: any = { axis };

        datasets.forEach((dataset) => {
          const point = dataset.data.find((p) => p.axis === axis);
          dataPoint[dataset.label] = point?.value || 0;
        });

        return dataPoint;
      });
    } else {
      // Single dataset mode
      return data.map((point) => ({
        axis: point.axis,
        value: point.value,
        max: point.max,
        category: point.category,
      }));
    }
  }, [data, datasets]);

  // Calculate max value if not provided
  const calculatedMaxValue = React.useMemo(() => {
    if (maxValue) return maxValue;

    if (datasets && datasets.length > 0) {
      return Math.max(
        ...datasets.flatMap((dataset) => dataset.data.map((point) => point.max || point.value))
      );
    }

    return Math.max(...data.map((point) => point.max || point.value));
  }, [data, datasets, maxValue]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const axisName = payload[0].payload.axis;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{axisName}</p>
        {payload.map((entry: any, index: number) => {
          if (entry.dataKey === 'axis') return null;

          const value = entry.value;
          const percentage = calculatedMaxValue > 0 ? ((value / calculatedMaxValue) * 100).toFixed(1) : 0;

          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {entry.name || 'Value'}: {value} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData}>
          <PolarGrid gridType={gridType} stroke="#e0e0e0" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: '#666', fontSize: 12 }}
            tickLine={false}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, calculatedMaxValue]}
            tick={{ fill: '#999', fontSize: 10 }}
          />

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {datasets && datasets.length > 0 ? (
            // Multi-dataset mode
            datasets.map((dataset, index) => (
              <Radar
                key={dataset.label}
                name={dataset.label}
                dataKey={dataset.label}
                stroke={dataset.color || colors[index % colors.length]}
                fill={dataset.color || colors[index % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))
          ) : (
            // Single dataset mode
            <Radar
              name="Value"
              dataKey="value"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.6}
              strokeWidth={2}
            />
          )}

          {showLegend && <Legend />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
