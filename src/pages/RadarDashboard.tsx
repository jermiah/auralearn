/**
 * Radar Dashboard Page
 * Central hub for all radar chart visualizations
 * Tab-based interface for switching between different radar views
 */

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import StudentLearningRadar from '@/components/RadarChart/StudentLearningRadar';
import CognitiveRadar from '@/components/RadarChart/CognitiveRadar';
import TriangulationRadar from '@/components/RadarChart/TriangulationRadar';
import CurriculumRadar from '@/components/RadarChart/CurriculumRadar';
import GroupRadar from '@/components/RadarChart/GroupRadar';

type RadarViewType =
  | 'student_learning'
  | 'cognitive'
  | 'triangulation'
  | 'curriculum'
  | 'group_comparison';

interface TabConfig {
  id: RadarViewType;
  label: string;
  description: string;
  icon: string;
}

const RADAR_TABS: TabConfig[] = [
  {
    id: 'student_learning',
    label: 'Student Learning Profile',
    description: '8-axis learning categories (0-100 scale)',
    icon: '👤',
  },
  {
    id: 'cognitive',
    label: 'Cognitive Domains',
    description: '6-axis cognitive assessment (1-5 scale)',
    icon: '🧠',
  },
  {
    id: 'triangulation',
    label: 'Multi-Perspective',
    description: 'Student, parent, and teacher comparison',
    icon: '🔺',
  },
  {
    id: 'curriculum',
    label: 'Curriculum Mastery',
    description: 'Domain mastery by subject (dynamic axes)',
    icon: '📚',
  },
  {
    id: 'group_comparison',
    label: 'Group Performance',
    description: 'Support vs Core vs Advanced groups',
    icon: '👥',
  },
];

export default function RadarDashboard() {
  const { studentId } = useParams<{ studentId?: string }>();
  const [searchParams] = useSearchParams();
  const classId = searchParams.get('classId') || 'default_class';
  const subject = searchParams.get('subject') || undefined;

  const [activeTab, setActiveTab] = useState<RadarViewType>('student_learning');

  // Render active radar view
  const renderRadarView = () => {
    switch (activeTab) {
      case 'student_learning':
        return studentId ? (
          <StudentLearningRadar
            studentId={studentId}
            classId={classId}
            showComparison={true}
            height={450}
            className="w-full"
          />
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            Please select a student to view their learning profile
          </div>
        );

      case 'cognitive':
        return studentId ? (
          <CognitiveRadar
            studentId={studentId}
            showStrengthsHighlight={true}
            height={450}
            className="w-full"
          />
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            Please select a student to view their cognitive profile
          </div>
        );

      case 'triangulation':
        return studentId ? (
          <TriangulationRadar studentId={studentId} height={500} className="w-full" />
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            Please select a student to view triangulation assessment
          </div>
        );

      case 'curriculum':
        return (
          <CurriculumRadar classId={classId} subject={subject} height={450} className="w-full" />
        );

      case 'group_comparison':
        return <GroupRadar classId={classId} subject={subject} height={500} className="w-full" />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Radar Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Multi-dimensional student assessment visualizations
          </p>
          {studentId && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Student ID: {studentId} | Class ID: {classId}
              {subject && ` | Subject: ${subject}`}
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex overflow-x-auto">
            {RADAR_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-6 py-4 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'bg-white dark:bg-gray-800 border-b-2 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tab.icon}</span>
                  <div>
                    <p
                      className={`font-semibold text-sm ${
                        activeTab === tab.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {tab.label}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        activeTab === tab.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {tab.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Radar View Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {renderRadarView()}
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            About Radar Charts
          </h3>
          <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>Dynamic Axes:</strong> All category names and domains are loaded from the
                database - no hardcoded values
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>Auto-Grouping:</strong> If more than 10 domains exist, low-variance
                domains are automatically grouped
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>Multi-Scale Support:</strong> Student learning (0-100), cognitive domains
                (1-5), curriculum mastery (0-100)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">•</span>
              <span>
                <strong>Triangulation:</strong> Validates assessment consistency across student,
                parent, and teacher perspectives
              </span>
            </li>
          </ul>
        </div>

        {/* Export Options (Future Enhancement) */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            onClick={() => window.print()}
          >
            Print Dashboard
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            disabled
            title="Coming soon"
          >
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
