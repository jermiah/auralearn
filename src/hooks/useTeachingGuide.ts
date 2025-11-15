/**
 * React hooks for fetching and managing teaching guides
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, StudentCategory, TeachingGuide } from '../lib/supabase';
import {
  searchTeachingStrategies,
  batchFetchYouTubeTranscripts,
} from '../services/internet-intelligence';
import { generateTeachingInsight } from '../services/blackbox-insights';

export interface FetchTeachingGuideParams {
  classId: string;
  studentCategory: StudentCategory;
  curriculumTopic: string;
  audience: 'teacher' | 'parent';
  gradeLevel?: string;
  studentCount?: number;
}

/**
 * Fetch or generate a teaching guide
 */
export function useTeachingGuide(params: FetchTeachingGuideParams) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['teachingGuide', params],
    queryFn: async () => {
      const { classId, studentCategory, curriculumTopic, audience } = params;

      // Check if Supabase is configured
      const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL &&
                                    import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Check if we have a cached guide in Supabase (only if configured)
      if (isSupabaseConfigured) {
        try {
          const { data: cachedGuide, error } = await supabase
            .from('teaching_guides')
            .select('*')
            .eq('class_id', classId)
            .eq('student_category', studentCategory)
            .eq('curriculum_topic', curriculumTopic)
            .eq('audience', audience)
            .gte('expires_at', new Date().toISOString())
            .single();

          if (cachedGuide && !error) {
            console.log('✅ Using cached teaching guide');
            return cachedGuide as TeachingGuide;
          }
        } catch (err) {
          console.warn('⚠️ Supabase cache check failed, generating new guide:', err);
        }
      }

      // Generate new guide
      console.log('🔄 Generating new teaching guide...');

      // Step 1: Search for teaching resources via MCP
      const webResources = await searchTeachingStrategies(
        studentCategory,
        curriculumTopic
      );

      // Step 2: Extract YouTube URLs and fetch transcripts
      const youtubeUrls = webResources
        .filter(r => r.type === 'video' && r.url.includes('youtube.com'))
        .map(r => r.url);

      const transcripts = await batchFetchYouTubeTranscripts(
        youtubeUrls,
        studentCategory,
        curriculumTopic
      );

      // Step 3: Save resources to Supabase (if configured)
      if (isSupabaseConfigured && webResources.length > 0) {
        try {
          await supabase.from('internet_resources').insert(
            webResources.map(r => ({
              student_category: studentCategory,
              curriculum_topic: curriculumTopic,
              title: r.title,
              url: r.url,
              snippet: r.snippet,
              resource_type: r.type,
              source: 'brave_search',
              relevance_score: r.relevanceScore,
            }))
          );
        } catch (err) {
          console.warn('⚠️ Failed to save resources to Supabase:', err);
        }
      }

      // Step 4: Save transcripts to Supabase (if configured)
      if (isSupabaseConfigured && transcripts.length > 0) {
        try {
          await supabase.from('youtube_transcripts').insert(
            transcripts.map(t => ({
              video_url: t.videoUrl,
              video_id: t.videoId,
              title: t.title,
              transcript_text: t.transcript,
              student_category: studentCategory,
              curriculum_topic: curriculumTopic,
              duration_seconds: t.durationSeconds,
            }))
          );
        } catch (err) {
          console.warn('⚠️ Failed to save transcripts to Supabase:', err);
        }
      }

      // Step 5: Generate AI insights
      const insights = await generateTeachingInsight({
        studentCategory,
        curriculumTopic,
        webResources,
        youtubeTranscripts: transcripts,
        audience,
        gradeLevel: params.gradeLevel,
        studentCount: params.studentCount,
      });

      // Step 6: Save teaching guide to Supabase (if configured)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Cache for 7 days

      const newGuide = {
        class_id: classId,
        student_category: studentCategory,
        curriculum_topic: curriculumTopic,
        audience,
        summary: insights.summary,
        strategies: insights.strategies,
        activities: insights.activities,
        resources: insights.resources,
        lesson_plan: insights.lessonPlan,
        home_support_checklist: insights.homeSupportChecklist,
        expires_at: expiresAt.toISOString(),
      };

      if (isSupabaseConfigured) {
        try {
          const { data: savedGuide, error: saveError } = await supabase
            .from('teaching_guides')
            .insert(newGuide)
            .select()
            .single();

          if (savedGuide && !saveError) {
            return savedGuide as TeachingGuide;
          }
        } catch (err) {
          console.warn('⚠️ Failed to save teaching guide to Supabase:', err);
        }
      }

      // Return the generated guide even if Supabase save fails or is not configured
      return { id: 'temp', ...newGuide, generated_at: new Date().toISOString() } as TeachingGuide;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!params.classId && !!params.studentCategory && !!params.curriculumTopic,
  });
}

/**
 * Fetch teaching resources for a category
 */
export function useTeachingResources(category: StudentCategory, topic: string) {
  return useQuery({
    queryKey: ['teachingResources', category, topic],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internet_resources')
        .select('*')
        .eq('student_category', category)
        .eq('curriculum_topic', topic)
        .order('relevance_score', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!category && !!topic,
  });
}

/**
 * Fetch YouTube transcripts for a category
 */
export function useYouTubeTranscripts(category: StudentCategory, topic: string) {
  return useQuery({
    queryKey: ['youtubeTranscripts', category, topic],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('youtube_transcripts')
        .select('*')
        .eq('student_category', category)
        .eq('curriculum_topic', topic);

      if (error) throw error;
      return data;
    },
    enabled: !!category && !!topic,
  });
}

/**
 * Regenerate a teaching guide (force refresh)
 */
export function useRegenerateGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: FetchTeachingGuideParams) => {
      const { classId, studentCategory, curriculumTopic, audience } = params;

      // Delete existing guide
      await supabase
        .from('teaching_guides')
        .delete()
        .eq('class_id', classId)
        .eq('student_category', studentCategory)
        .eq('curriculum_topic', curriculumTopic)
        .eq('audience', audience);

      // Invalidate cache to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['teachingGuide', params],
      });
    },
  });
}
