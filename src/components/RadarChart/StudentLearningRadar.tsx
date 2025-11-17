/**
 * Student Learning Radar Component
 * 8-axis radar for student learning categories
 * Scale: 0-100
 * Categories dynamically loaded from students.category_scores JSONB
 */

import React, { useEffect, useState } from 'react';
import DynamicRadarChart from './DynamicRadarChart';
import { generateRadarAxes, formatAxisLabel } from '@/utils/radar-axis-generator';
import { generateColorPalette } from '@/utils/radar-color-palette';
import type { RadarDataPoint, StudentLearningRadarData } from '@/types/radar-types';
import { supabase } from '@/lib/supabase';

export interface StudentLearningRadarProps {
  studentId: string;
  classId?: string;
  showComparison?: boolean;
  height?: number;
  className?: string;
}

export default function StudentLearningRadar({
  studentId,
  classId,
  showComparison = false,
  height = 400,
  className = '',
}: StudentLearningRadarProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [comparisonData, setComparisonData] = useState<RadarDataPoint[] | null>(null);

  useEffect(() => {
    async function loadStudentData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch student's category scores
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id, name, category_scores, primary_category, secondary_category')
          .eq('id', studentId)
          .single();

        if (studentError) throw studentError;

        if (!student || !student.category_scores) {
          throw new Error('No category scores found for student');
        }

        // Generate radar axes from category_scores JSONB
        const categoryScores = student.category_scores as Record<string, number>;
        const axes = generateRadarAxes(categoryScores, 100, 8);
        setRadarData(axes);

        // If comparison mode, fetch class average
        if (showComparison && classId) {
          const { data: classStudents, error: classError } = await supabase
            .from('students')
            .select('category_scores')
            .eq('class_id', classId);

          if (classError) throw classError;

          if (classStudents && classStudents.length > 0) {
            // Calculate class averages
            const categoryTotals: Record<string, { sum: number; count: number }> = {};

            classStudents.forEach((s) => {
              if (!s.category_scores) return;

              const scores = s.category_scores as Record<string, number>;
              Object.entries(scores).forEach(([category, score]) => {
                if (!categoryTotals[category]) {
                  categoryTotals[category] = { sum: 0, count: 0 };
                }
                categoryTotals[category].sum += score;
                categoryTotals[category].count += 1;
              });
            });

            // Calculate averages
            const classAverages: Record<string, number> = {};
            Object.entries(categoryTotals).forEach(([category, data]) => {
              classAverages[category] = Math.round(data.sum / data.count);
            });

            const comparisonAxes = generateRadarAxes(classAverages, 100, 8);
            setComparisonData(comparisonAxes);
          }
        }
      } catch (err) {
        console.error('Error loading student learning data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadStudentData();
  }, [studentId, classId, showComparison]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

  if (radarData.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const colors = generateColorPalette(2);

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Student Learning Profile
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          8-axis learning categories (0-100 scale)
        </p>
      </div>

      {showComparison && comparisonData ? (
        <DynamicRadarChart
          data={radarData}
          datasets={[
            { label: 'Student', data: radarData, color: colors[0] },
            { label: 'Class Average', data: comparisonData, color: colors[1] },
          ]}
          maxValue={100}
          height={height}
          showLegend={true}
          showTooltip={true}
          gridType="polygon"
        />
      ) : (
        <DynamicRadarChart
          data={radarData}
          maxValue={100}
          colors={colors}
          height={height}
          showLegend={false}
          showTooltip={true}
          gridType="polygon"
        />
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {radarData
          .sort((a, b) => b.value - a.value)
          .slice(0, 4)
          .map((point, index) => (
            <div
              key={point.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors[0] }}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{point.axis}</p>
                <p className="text-gray-600 dark:text-gray-400">{point.value}/100</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
