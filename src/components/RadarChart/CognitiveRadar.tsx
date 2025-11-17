/**
 * Cognitive Radar Component
 * 6-axis hexagonal radar for cognitive domains
 * Scale: 1-5
 * Domains dynamically loaded from cognitive_assessment_results.domain_scores JSONB
 */

import React, { useEffect, useState } from 'react';
import DynamicRadarChart from './DynamicRadarChart';
import { generateCognitiveAxes } from '@/utils/radar-axis-generator';
import { generateColorPalette } from '@/utils/radar-color-palette';
import type { RadarDataPoint, CognitiveRadarData } from '@/types/radar-types';
import { supabase } from '@/lib/supabase';

export interface CognitiveRadarProps {
  studentId: string;
  assessmentId?: string;
  showStrengthsHighlight?: boolean;
  height?: number;
  className?: string;
}

export default function CognitiveRadar({
  studentId,
  assessmentId,
  showStrengthsHighlight = true,
  height = 400,
  className = '',
}: CognitiveRadarProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [cognitiveData, setCognitiveData] = useState<CognitiveRadarData | null>(null);

  useEffect(() => {
    async function loadCognitiveData() {
      try {
        setLoading(true);
        setError(null);

        // Build query
        let query = supabase
          .from('cognitive_assessment_results')
          .select('*')
          .eq('student_id', studentId);

        if (assessmentId) {
          query = query.eq('assessment_id', assessmentId);
        }

        query = query.order('created_at', { ascending: false }).limit(1);

        const { data: assessmentResults, error: queryError } = await query;

        if (queryError) throw queryError;

        if (!assessmentResults || assessmentResults.length === 0) {
          throw new Error('No cognitive assessment results found');
        }

        const result = assessmentResults[0];
        const domainScores = result.domain_scores as Record<string, number>;
        const strengths = (result.strengths || []) as string[];
        const areasForSupport = (result.areas_for_support || []) as string[];

        // Generate radar axes with strength/support highlighting
        const axes = generateCognitiveAxes(
          domainScores,
          showStrengthsHighlight ? strengths : [],
          showStrengthsHighlight ? areasForSupport : []
        );

        setRadarData(axes);
        setCognitiveData({
          student_id: studentId,
          domain_scores: domainScores,
          strengths,
          areas_for_support: areasForSupport,
          overall_score: result.overall_score || 3,
          assessment_date: result.created_at,
        });
      } catch (err) {
        console.error('Error loading cognitive data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadCognitiveData();
  }, [studentId, assessmentId, showStrengthsHighlight]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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

  if (radarData.length === 0 || !cognitiveData) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <p className="text-gray-600 dark:text-gray-400">No cognitive data available</p>
      </div>
    );
  }

  const colors = generateColorPalette(1);

  // Color mapping for strengths/support highlighting
  const getPointColor = (category?: string) => {
    if (!showStrengthsHighlight || !category) return colors[0];
    if (category === 'strength') return '#10b981'; // Green
    if (category === 'support') return '#ef4444'; // Red
    return colors[0]; // Default purple
  };

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Cognitive Domain Profile
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          6-axis cognitive assessment (1-5 scale)
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Overall Score:
          </span>
          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
            {cognitiveData.overall_score.toFixed(1)}/5
          </span>
        </div>
      </div>

      <DynamicRadarChart
        data={radarData}
        maxValue={5}
        colors={colors}
        height={height}
        showLegend={false}
        showTooltip={true}
        gridType="polygon"
      />

      {showStrengthsHighlight && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          {cognitiveData.strengths.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                Strengths
              </h4>
              <ul className="space-y-1">
                {cognitiveData.strengths.map((strength) => (
                  <li
                    key={strength}
                    className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                    {strength.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Support */}
          {cognitiveData.areas_for_support.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                Areas for Support
              </h4>
              <ul className="space-y-1">
                {cognitiveData.areas_for_support.map((area) => (
                  <li
                    key={area}
                    className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                    {area.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Domain scores summary */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {radarData
          .sort((a, b) => b.value - a.value)
          .map((point) => (
            <div
              key={point.id}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getPointColor(point.category) }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {point.axis}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{point.value}/5</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
