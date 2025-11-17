/**
 * Service for retrieving official French Education Nationale curriculum teaching guides
 */

import { supabase } from '../lib/supabase';

export interface CurriculumGuideChunk {
  id: string;
  doc_id: string;
  guide_type: string;
  applicable_grades: string[];
  topic: string;
  subtopic: string;
  section_header: string;
  chunk_text: string;
  page_start: number;
  page_end: number;
  is_general: boolean;
  lang: string;
  created_at: string;
}

export interface RetrieveCurriculumGuidesParams {
  topic: string;
  gradeLevel?: string;
  guideType?: string; // 'pedagogical', 'strategy', 'activity', 'assessment'
  limit?: number;
}

/**
 * Retrieve relevant curriculum guide chunks from the database
 */
export async function retrieveCurriculumGuides(
  params: RetrieveCurriculumGuidesParams
): Promise<CurriculumGuideChunk[]> {
  const { topic, gradeLevel, guideType, limit = 10 } = params;

  try {
    let query = supabase
      .from('teaching_guides_chunks')
      .select('*')
      .eq('lang', 'fr')
      .ilike('topic', `%${topic}%`);

    // Filter by grade level if provided
    if (gradeLevel) {
      query = query.contains('applicable_grades', [gradeLevel]);
    } else {
      // Include general guides if no specific grade
      query = query.or(`is_general.eq.true,applicable_grades.cs.{CM1,CM2}`);
    }

    // Filter by guide type if provided
    if (guideType) {
      query = query.eq('guide_type', guideType);
    }

    // Limit results
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error retrieving curriculum guides:', error);
      return [];
    }

    console.log(`✅ Retrieved ${data?.length || 0} curriculum guide chunks for topic: ${topic}`);
    return data || [];
  } catch (error) {
    console.error('Error in retrieveCurriculumGuides:', error);
    return [];
  }
}

/**
 * Search curriculum guides by keyword/phrase
 */
export async function searchCurriculumGuides(
  searchTerm: string,
  gradeLevel?: string,
  limit: number = 10
): Promise<CurriculumGuideChunk[]> {
  try {
    let query = supabase
      .from('teaching_guides_chunks')
      .select('*')
      .eq('lang', 'fr')
      .or(`topic.ilike.%${searchTerm}%,subtopic.ilike.%${searchTerm}%,chunk_text.ilike.%${searchTerm}%`);

    if (gradeLevel) {
      query = query.contains('applicable_grades', [gradeLevel]);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Error searching curriculum guides:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} curriculum guide chunks matching: ${searchTerm}`);
    return data || [];
  } catch (error) {
    console.error('Error in searchCurriculumGuides:', error);
    return [];
  }
}

/**
 * Get curriculum guides for a specific learning category context
 * This maps student categories to relevant curriculum topics
 */
export async function getCurriculumGuidesForCategory(
  studentCategory: string,
  curriculumTopic: string,
  gradeLevel?: string
): Promise<CurriculumGuideChunk[]> {
  // Map student category to pedagogical approaches
  const categoryToGuideType: Record<string, string> = {
    slow_processing: 'strategy',
    fast_processor: 'strategy',
    high_energy: 'activity',
    visual_learner: 'pedagogical',
    logical_learner: 'pedagogical',
    sensitive_low_confidence: 'strategy',
    easily_distracted: 'strategy',
    needs_repetition: 'strategy',
  };

  const preferredGuideType = categoryToGuideType[studentCategory] || 'pedagogical';

  // Retrieve guides for the curriculum topic with the preferred guide type
  const guides = await retrieveCurriculumGuides({
    topic: curriculumTopic,
    gradeLevel,
    guideType: preferredGuideType,
    limit: 5,
  });

  // If no specific guides found, fall back to general guides
  if (guides.length === 0) {
    return retrieveCurriculumGuides({
      topic: curriculumTopic,
      gradeLevel,
      limit: 5,
    });
  }

  return guides;
}

/**
 * Format curriculum guide chunks into a readable text for AI processing
 */
export function formatCurriculumGuidesForAI(guides: CurriculumGuideChunk[]): string {
  if (guides.length === 0) {
    return '';
  }

  const formattedText = guides
    .map((guide, index) => {
      return `
## Official Curriculum Guide ${index + 1}
**Document:** ${guide.doc_id}
**Type:** ${guide.guide_type}
**Topic:** ${guide.topic} - ${guide.subtopic}
**Section:** ${guide.section_header}
**Grade Levels:** ${guide.applicable_grades.join(', ')}
**Pages:** ${guide.page_start}-${guide.page_end}

${guide.chunk_text}

---
`;
    })
    .join('\n');

  return `
# OFFICIAL FRENCH EDUCATION NATIONALE CURRICULUM TEACHING GUIDES

${formattedText}
`;
}
