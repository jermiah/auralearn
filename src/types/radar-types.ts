/**
 * Radar Chart Types - 100% Dynamic from SQL
 * NO HARDCODED VALUES - All data loaded from database
 */

import { StudentCategory } from '@/lib/supabase';

// ==========================================
// COGNITIVE DOMAINS (6 domains from SQL)
// ==========================================

export type CognitiveDomain =
  | 'processing_speed'
  | 'working_memory'
  | 'attention_focus'
  | 'learning_style'
  | 'self_efficacy'
  | 'motivation_engagement';

export const cognitiveDomainLabels: Record<CognitiveDomain, string> = {
  processing_speed: 'Processing Speed',
  working_memory: 'Working Memory',
  attention_focus: 'Attention & Focus',
  learning_style: 'Learning Style',
  self_efficacy: 'Self-Efficacy',
  motivation_engagement: 'Motivation & Engagement',
};

// ==========================================
// RADAR DATA STRUCTURES
// ==========================================

export interface RadarDataPoint {
  axis: string;       // Dynamic label from DB
  value: number;      // Score value
  max: number;        // Maximum value for this axis
  category?: string;  // Optional grouping
  id?: string;        // Domain/category ID for color mapping
}

export interface RadarChartConfig {
  title: string;
  subtitle?: string;
  maxValue: number;
  colors: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

// ==========================================
// STUDENT LEARNING CATEGORIES (8-axis)
// ==========================================

export interface StudentLearningRadarData {
  student_id: string;
  student_name?: string;
  category_scores: Record<StudentCategory, number>;  // 0-100 scale
  primary_category: StudentCategory;
  secondary_category?: StudentCategory;
  total_assessments?: number;
}

export interface StudentLearningRadarResponse {
  student: StudentLearningRadarData;
  radar_data: RadarDataPoint[];
}

// ==========================================
// COGNITIVE DOMAINS (6-axis)
// ==========================================

export interface CognitiveRadarData {
  student_id: string;
  assessment_type: 'student' | 'parent';
  domain_scores: Record<CognitiveDomain, number>;  // 1-5 scale
  overall_score: number;
  confidence_score: number;
  strengths: CognitiveDomain[];
  areas_for_support: CognitiveDomain[];
  assessed_at: string;
}

export interface CognitiveRadarResponse {
  cognitive: CognitiveRadarData;
  radar_data: RadarDataPoint[];
}

// ==========================================
// TRIANGULATION (Multi-perspective)
// ==========================================

export interface TriangulationRadarData {
  student_id: string;
  student_scores: Record<CognitiveDomain, number>;
  parent_scores: Record<CognitiveDomain, number>;
  teacher_category: StudentCategory;
  discrepancies: string[];
  agreements: string[];
  triangulation_score: number;  // 0-1 agreement level
}

export interface TriangulationRadarResponse {
  triangulation: TriangulationRadarData;
  radar_layers: {
    student: RadarDataPoint[];
    parent: RadarDataPoint[];
    teacher: RadarDataPoint[];
  };
}

// ==========================================
// CURRICULUM DOMAINS (Dynamic axes from SQL)
// ==========================================

export interface CurriculumDomain {
  id: string;           // Snake_case ID
  label: string;        // Human-readable label from DB
  count: number;        // Number of curriculum chunks
  subtopics?: string[]; // Related subtopics
}

export interface CurriculumDomainsResponse {
  subjects: string[];   // All subjects from DB
  domains_by_subject: Record<string, CurriculumDomain[]>;
}

export interface CurriculumMasteryData {
  subject: string;
  domain_scores: {
    domain: string;         // Dynamic from DB
    value: number;          // 0-100 mastery score
    students_assessed: number;
    total_assessments: number;
  }[];
}

// ==========================================
// GROUP COMPARISON (Support/Core/Advanced)
// ==========================================

export interface GroupMasteryData {
  group_name: string;     // Computed: "Support", "Core", "Advanced"
  student_count: number;
  domains: {
    domain: string;       // Dynamic domain name
    value: number;        // 0-100 average score
  }[];
}

export interface GroupMasteryResponse {
  groups: GroupMasteryData[];
}

// ==========================================
// TEACHING GUIDES CATEGORIES
// ==========================================

export interface TeachingGuideCategory {
  name: string;              // Meta-cognitive category name
  domains: string[];         // List of topics in this category
  resource_count: number;    // Number of teaching guide chunks
}

export interface TeachingGuideCategoriesResponse {
  combined_categories: TeachingGuideCategory[];
}

// ==========================================
// COGNITIVE CATEGORIES DISTRIBUTION
// ==========================================

export interface CognitiveCategoryDistribution {
  name: string;          // Domain name (from SQL enum)
  label: string;         // Human-readable label
  count: number;         // Number of assessments
  average_score: number; // Average score across all
  min_score: number;
  max_score: number;
}

export interface CognitiveCategoriesResponse {
  categories: CognitiveCategoryDistribution[];
  total_assessments: number;
}

// ==========================================
// API ERROR RESPONSE
// ==========================================

export interface RadarAPIError {
  error: string;
  details?: string;
}

// ==========================================
// RADAR CHART VIEW TYPES
// ==========================================

export type RadarViewType =
  | 'student-learning'
  | 'cognitive'
  | 'triangulation'
  | 'curriculum'
  | 'groups'
  | 'teaching-guides';

export interface RadarViewConfig {
  id: RadarViewType;
  label: string;
  description: string;
  icon: string;
  requiresStudentId?: boolean;
  requiresClassId?: boolean;
}
