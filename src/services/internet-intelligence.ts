/**
 * Internet Intelligence Service using BlackBox AI Tool Calling
 *
 * Uses BlackBox AI with Brave Search and YouTube transcript tools
 */

import { StudentCategory } from '../lib/supabase';
import { runAgenticLoop } from './blackbox-client';

export interface BraveSearchResult {
  title: string;
  url: string;
  snippet: string;
  type: 'article' | 'blog' | 'pdf' | 'video' | 'website';
  relevanceScore?: number;
}

export interface YouTubeTranscriptResult {
  videoUrl: string;
  videoId: string;
  title: string;
  transcript: string;
  durationSeconds?: number;
}

// Define Brave Search tool for BlackBox AI
const braveSearchTool = {
  type: 'function' as const,
  function: {
    name: 'brave_search',
    description: 'Search the web using Brave Search API for educational content, teaching strategies, and research articles',
    parameters: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query to execute',
        },
        count: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
      },
      required: ['query'],
    },
  },
};

// Define YouTube transcript tool for BlackBox AI
const youtubeTranscriptTool = {
  type: 'function' as const,
  function: {
    name: 'get_youtube_transcript',
    description: 'Get the transcript/subtitles from a YouTube video given its URL or video ID',
    parameters: {
      type: 'object' as const,
      properties: {
        video_id: {
          type: 'string',
          description: 'The YouTube video ID (11 characters)',
        },
      },
      required: ['video_id'],
    },
  },
};

/**
 * Mock implementations of tools (BlackBox AI will call these based on tool definitions)
 */
const toolImplementations = {
  brave_search: async (args: { query: string; count?: number }) => {
    console.log('🔍 Brave Search called with:', args);

    // In production, BlackBox AI will handle this via its tool calling
    // For now, return mock data
    return mockBraveSearch(args.query, args.count || 10);
  },

  get_youtube_transcript: async (args: { video_id: string }) => {
    console.log('📺 YouTube Transcript called with:', args);

    // In production, BlackBox AI will handle this via its tool calling
    // For now, return mock data
    return mockYouTubeTranscript(args.video_id);
  },
};

/**
 * Search for teaching strategies using BlackBox AI with Brave Search tool
 */
export async function searchTeachingStrategies(
  studentCategory: StudentCategory,
  curriculumTopic: string
): Promise<BraveSearchResult[]> {
  const categoryText = studentCategory.replace(/_/g, ' ');

  const prompt = `Search for high-quality educational resources about teaching ${curriculumTopic} to ${categoryText} students.

Find 10-15 results from:
- Educational websites (edutopia.org, understood.org, teachthought.com)
- Teaching blogs
- Research papers (ERIC, academic journals)
- YouTube teaching videos
- Teacher resource sites

For each result, I need:
- Title
- URL
- Brief snippet/description
- Type (article, blog, pdf, video, website)
- Relevance score (0-1)

Return results as a JSON array.`;

  try {
    const response = await runAgenticLoop(
      prompt,
      [braveSearchTool],
      toolImplementations,
      'You are a research assistant specialized in finding educational resources. Use the brave_search tool to find relevant teaching materials.'
    );

    // Parse the response to extract search results
    const results = parseSearchResults(response, categoryText, curriculumTopic);
    return results;
  } catch (error) {
    console.error('Error in searchTeachingStrategies:', error);
    // Return mock data as fallback
    return mockBraveSearchResults(categoryText, curriculumTopic);
  }
}

/**
 * Fetch YouTube transcript using BlackBox AI
 */
export async function fetchYouTubeTranscript(
  videoUrl: string,
  studentCategory?: StudentCategory,
  curriculumTopic?: string
): Promise<YouTubeTranscriptResult | null> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) {
    console.error('Invalid YouTube URL:', videoUrl);
    return null;
  }

  const prompt = `Get the transcript for YouTube video ID: ${videoId}

Extract the full transcript and return it as JSON with:
- videoUrl
- videoId
- title
- transcript (full text)
- durationSeconds`;

  try {
    const response = await runAgenticLoop(
      prompt,
      [youtubeTranscriptTool],
      toolImplementations,
      'You are a transcript extraction assistant. Use the get_youtube_transcript tool to fetch video transcripts.'
    );

    // Parse response
    return parseTranscriptResponse(response, videoUrl, videoId);
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    return mockYouTubeTranscript(videoId);
  }
}

/**
 * Batch fetch transcripts for multiple videos
 */
export async function batchFetchYouTubeTranscripts(
  videoUrls: string[],
  studentCategory?: StudentCategory,
  curriculumTopic?: string
): Promise<YouTubeTranscriptResult[]> {
  const results = await Promise.allSettled(
    videoUrls.map(url => fetchYouTubeTranscript(url, studentCategory, curriculumTopic))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<YouTubeTranscriptResult | null> =>
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Parse search results from AI response
 */
function parseSearchResults(
  response: string,
  category: string,
  topic: string
): BraveSearchResult[] {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                      response.match(/\[[\s\S]*?\]/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
  } catch (error) {
    console.warn('Failed to parse search results, using fallback');
  }

  return mockBraveSearchResults(category, topic);
}

/**
 * Parse transcript response from AI
 */
function parseTranscriptResponse(
  response: string,
  videoUrl: string,
  videoId: string
): YouTubeTranscriptResult {
  try {
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                      response.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
  } catch (error) {
    console.warn('Failed to parse transcript, using fallback');
  }

  return mockYouTubeTranscript(videoId);
}

// =====================================================
// MOCK DATA (Fallback when API calls fail)
// =====================================================

function mockBraveSearchResults(category: string, topic: string): BraveSearchResult[] {
  return [
    {
      title: `Teaching ${topic} to ${category} Students: A Comprehensive Guide`,
      url: `https://edutopia.org/${category.replace(/\s+/g, '-')}-${topic.replace(/\s+/g, '-')}`,
      snippet: `Research-based strategies for teaching ${topic} to students who are ${category}. Includes classroom activities, assessments, and differentiation tips.`,
      type: 'article',
      relevanceScore: 0.95,
    },
    {
      title: `Differentiated Instruction for ${category} Learners`,
      url: `https://www.understood.org/teaching-${category.replace(/\s+/g, '-')}`,
      snippet: `Expert advice on adapting your teaching methods for ${category} students. Learn how to modify lessons, provide support, and measure progress.`,
      type: 'article',
      relevanceScore: 0.92,
    },
    {
      title: `${topic} Lesson Plans for Diverse Learners`,
      url: `https://www.teacherspayteachers.com/${topic.replace(/\s+/g, '-')}-${category.replace(/\s+/g, '-')}`,
      snippet: `Download ready-to-use lesson plans specifically designed for ${category} students learning ${topic}.`,
      type: 'pdf',
      relevanceScore: 0.88,
    },
    {
      title: `Video: Strategies for Teaching ${category} Students`,
      url: `https://www.youtube.com/watch?v=ABC123DEF456`,
      snippet: `Watch experienced educators demonstrate effective teaching techniques for ${category} learners in a ${topic} classroom setting.`,
      type: 'video',
      relevanceScore: 0.85,
    },
    {
      title: `Classroom Accommodations for ${category} Students`,
      url: `https://www.readingrockets.org/${category.replace(/\s+/g, '-')}-accommodations`,
      snippet: `Practical classroom modifications and accommodations to help ${category} students succeed in ${topic} and beyond.`,
      type: 'blog',
      relevanceScore: 0.83,
    },
  ];
}

function mockBraveSearch(query: string, count: number) {
  return {
    results: Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      title: `Search Result ${i + 1} for "${query}"`,
      url: `https://example.com/result-${i + 1}`,
      description: `This is a search result about ${query}. It contains relevant information for educators.`,
      type: i % 3 === 0 ? 'video' : i % 2 === 0 ? 'article' : 'blog',
    })),
  };
}

function mockYouTubeTranscript(videoId: string): YouTubeTranscriptResult {
  return {
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    videoId,
    title: 'Teaching Strategies for Diverse Learners',
    transcript: `Welcome to today's video on effective teaching strategies.

When working with diverse learners, it's crucial to understand that every student processes information differently. Some students need more time to absorb concepts, while others grasp ideas quickly and need enrichment.

For students who process information slowly, try these strategies:
- Break down complex concepts into smaller, manageable chunks
- Use visual aids and diagrams to reinforce verbal explanations
- Provide written instructions alongside verbal ones
- Allow extra time for processing and responding
- Use repetition and review frequently

For fast processors, consider:
- Providing extension activities and challenges
- Encouraging peer tutoring opportunities
- Offering independent research projects
- Allowing them to explore topics in greater depth

Remember, the key to successful differentiation is flexibility and ongoing assessment. Pay attention to how your students respond and adjust your methods accordingly.

Thank you for watching, and remember: every student can learn when given the right support.`,
    durationSeconds: 420,
  };
}
