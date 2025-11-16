# Teaching Guide Generation Workflow - Complete Explanation

## 📋 Overview

The Teaching Guide system combines **3 data sources** to create personalized teaching strategies:

1. **Brave Search API** - External blogs and websites
2. **YouTube Transcripts** - Video content analysis
3. **Teaching Guide Chunks** - Official curriculum documents (stored in Supabase)
4. **BlackBox AI** - Synthesizes everything into actionable strategies

---

## 🔄 Complete Workflow (Step-by-Step)

### When a Teacher Clicks "View Teaching Guide"

```
User Action: Click "View Teaching Guide" for "Visual Learner" + "Mathematics"
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: Check Cache (Supabase)                                     │
│ - Look for existing guide in teaching_guides table                 │
│ - If found and not expired (< 7 days old) → Return cached guide   │
│ - If not found or expired → Generate new guide                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2: Fetch External Resources (Brave Search API)                │
│                                                                     │
│ Frontend calls: searchTeachingStrategies()                         │
│         ↓                                                           │
│ Backend API: GET /api/teaching-resources/Visual%20Learner          │
│         ↓                                                           │
│ Brave Search: Query = "teaching strategies for visual learners"    │
│         ↓                                                           │
│ Returns:                                                            │
│   • 3-5 blog articles (e.g., Edutopia, Understood.org)            │
│   • 2-3 YouTube video links                                        │
│                                                                     │
│ Example Response:                                                   │
│ {                                                                   │
│   "blogs": [                                                        │
│     "https://www.edutopia.org/visual-learning-strategies",         │
│     "https://www.understood.org/visual-learners-guide"             │
│   ],                                                                │
│   "youtube_links": [                                                │
│     "https://www.youtube.com/watch?v=abc123"                        │
│   ]                                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 3: Fetch YouTube Transcripts                                  │
│                                                                     │
│ For each YouTube URL:                                               │
│   • Extract video ID                                                │
│   • Call YouTube Transcript API (via BlackBox AI tool)             │
│   • Get full transcript text                                        │
│                                                                     │
│ Example Transcript:                                                 │
│ "Welcome to today's video on visual learning strategies.           │
│  Visual learners process information best through images,           │
│  diagrams, and spatial understanding. Here are 5 key strategies..." │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 4: Save Resources to Supabase (Optional)                      │
│                                                                     │
│ Table: internet_resources                                           │
│ {                                                                   │
│   student_category: "visual_learner",                              │
│   curriculum_topic: "Mathematics",                                 │
│   title: "Visual Learning Strategies",                             │
│   url: "https://...",                                               │
│   snippet: "Research-based strategies...",                          │
│   resource_type: "article",                                         │
│   source: "brave_search",                                           │
│   relevance_score: 0.95                                             │
│ }                                                                   │
│                                                                     │
│ Table: youtube_transcripts                                          │
│ {                                                                   │
│   video_url: "https://youtube.com/watch?v=abc123",                 │
│   video_id: "abc123",                                               │
│   title: "Teaching Visual Learners",                                │
│   transcript_text: "Full transcript...",                            │
│   student_category: "visual_learner",                              │
│   curriculum_topic: "Mathematics"                                  │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 5: Query Teaching Guide Chunks (Future Enhancement)           │
│                                                                     │
│ **NOT YET IMPLEMENTED** - This is where official curriculum         │
│ documents would be queried from teaching_guides_chunks table        │
│                                                                     │
│ Planned Query:                                                      │
│ SELECT * FROM teaching_guides_chunks                                │
│ WHERE applicable_grades @> ARRAY['CM1', 'CM2']                     │
│   AND topic ILIKE '%mathematics%'                                  │
│   AND guide_type = 'pedagogical_strategies'                        │
│                                                                     │
│ Would return: Official teaching strategies from French             │
│ Education Nationale curriculum guides                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 6: Generate AI Insights (BlackBox AI)                         │
│                                                                     │
│ Input to AI:                                                        │
│ • Student Category: "Visual Learner"                                │
│ • Curriculum Topic: "Mathematics"                                   │
│ • Web Resources: [3-5 articles with titles, URLs, snippets]        │
│ • YouTube Transcripts: [2-3 full transcripts]                      │
│ • Teaching Guide Chunks: [Official curriculum strategies] (future) │
│ • Audience: "teacher" or "parent"                                   │
│ • Grade Level: "CM1/CM2"                                            │
│                                                                     │
│ AI Prompt:                                                          │
│ "You are an expert educational consultant. Based on the web         │
│  resources, YouTube transcripts, and official curriculum guides,    │
│  create a comprehensive teaching guide for Visual Learner students  │
│  learning Mathematics. Include:                                     │
│  1. Summary of learning profile                                     │
│  2. 3-5 key strategies with explanations                            │
│  3. 3-4 practical activities                                        │
│  4. Recommended resources                                           │
│  5. Lesson plan (Support/Core/Advanced groups)"                     │
│                                                                     │
│ AI Output (Structured JSON):                                        │
│ {                                                                   │
│   "summary": "Visual learners process math concepts best...",       │
│   "strategies": [                                                   │
│     {                                                               │
│       "title": "Use Visual Representations",                        │
│       "description": "Draw diagrams for word problems...",          │
│       "why_it_works": "Visual learners retain 65% more..."          │
│     }                                                               │
│   ],                                                                │
│   "activities": [...],                                              │
│   "resources": [...],                                               │
│   "lessonPlan": "# Mathematics Lesson Plan\n## Support Group..."   │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 7: Save Generated Guide to Supabase                           │
│                                                                     │
│ Table: teaching_guides                                              │
│ {                                                                   │
│   class_id: "abc123",                                               │
│   student_category: "visual_learner",                              │
│   curriculum_topic: "Mathematics",                                 │
│   audience: "teacher",                                              │
│   summary: "Visual learners process...",                            │
│   strategies: [{...}],                                              │
│   activities: [{...}],                                              │
│   resources: [{...}],                                               │
│   lesson_plan: "# Mathematics Lesson Plan...",                      │
│   expires_at: "2025-11-23T00:00:00Z"  // 7 days cache              │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Step 8: Display in UI                                               │
│                                                                     │
│ TeachingGuidePanel component shows:                                 │
│ • Summary section                                                   │
│ • Strategies with expandable details                                │
│ • Activities with materials and steps                               │
│ • Resource links (clickable)                                        │
│ • Lesson plan (formatted markdown)                                  │
│ • YouTube videos (embedded players)                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Data Sources Explained

### 1. Brave Search API (External Web Resources)
**Purpose:** Get latest research, blog posts, and teaching strategies from the internet

**What it provides:**
- Educational blog articles (Edutopia, Understood.org, TeachThought)
- Research papers and academic articles
- Teacher resource websites
- YouTube video links

**Example Query:**
```
"teaching strategies for visual learners mathematics elementary school"
```

**Example Results:**
```json
{
  "blogs": [
    "https://www.edutopia.org/article/visual-learning-strategies-math",
    "https://www.understood.org/articles/visual-learners-math-tips",
    "https://www.teachthought.com/learning/visual-learning-mathematics"
  ],
  "youtube_links": [
    "https://www.youtube.com/watch?v=abc123",
    "https://www.youtube.com/watch?v=def456"
  ]
}
```

### 2. YouTube Transcripts
**Purpose:** Extract detailed teaching strategies from educational videos

**What it provides:**
- Full transcript text from teaching videos
- Practical demonstrations and examples
- Expert educator advice
- Step-by-step teaching methods

**Example Transcript:**
```
"Welcome to today's video on teaching math to visual learners.
Visual learners need to see concepts represented graphically.
Here are 5 strategies:
1. Use color-coded manipulatives for fractions
2. Draw number lines for addition/subtraction
3. Create visual anchor charts for formulas
..."
```

### 3. Teaching Guide Chunks (Official Curriculum) - **FUTURE**
**Purpose:** Incorporate official French Education Nationale curriculum guidelines

**What it will provide:**
- Official pedagogical strategies
- Curriculum-aligned activities
- Assessment guidelines
- Differentiation recommendations

**Database:** `teaching_guides_chunks` table in Supabase

**Example Chunk:**
```json
{
  "doc_id": "guide_math_cm1",
  "guide_type": "pedagogical_strategies",
  "applicable_grades": ["CM1", "CM2"],
  "topic": "Fractions",
  "section_header": "Differentiation Strategies",
  "chunk_text": "For students who need visual support, use fraction bars and pie charts. Provide manipulatives for hands-on exploration..."
}
```

**Status:** 
- ✅ Database schema created
- ✅ Ingestion pipeline ready
- ✅ 8 teaching guide PDFs available in `pdfs/teaching_guides/`
- ⏳ **NOT YET INTEGRATED** into the AI generation workflow

### 4. BlackBox AI (Synthesis Engine)
**Purpose:** Combine all sources into coherent, actionable teaching strategies

**What it does:**
1. Reads all web resources, transcripts, and curriculum chunks
2. Identifies common themes and best practices
3. Synthesizes information into structured format
4. Generates specific, actionable strategies
5. Creates differentiated lesson plans
6. Tailors content for teacher vs. parent audience

**AI Prompt Structure:**
```
System: You are an expert educational consultant...

User: 
Learning Profile: Visual Learner
Curriculum Topic: Mathematics
Grade Level: CM1/CM2

WEB RESOURCES:
1. "Visual Learning Strategies" - https://edutopia.org/...
   Summary: Research shows visual learners retain 65% more...

2. "Math for Visual Learners" - https://understood.org/...
   Summary: Use color-coding, diagrams, and graphic organizers...

YOUTUBE TRANSCRIPTS:
1. Video: "Teaching Math to Visual Learners"
   Transcript: "Welcome to today's video. Visual learners need..."

OFFICIAL CURRICULUM (future):
1. French Education Nationale Guide - Fractions
   "For students who need visual support, use fraction bars..."

Generate a comprehensive teaching guide with strategies, activities, and lesson plan.
```

---

## 📊 Current vs. Future State

### ✅ Currently Working
1. **Brave Search API** - Fetching external resources
2. **YouTube Transcripts** - Extracting video content
3. **BlackBox AI** - Synthesizing web + video content
4. **Caching** - Storing guides in Supabase for 7 days
5. **UI Display** - Showing strategies, activities, resources

### ⏳ Future Enhancement
1. **Teaching Guide Chunks Integration**
   - Query official curriculum documents from `teaching_guides_chunks`
   - Add to AI prompt alongside web resources
   - Ensure strategies align with French curriculum standards

**To implement:**
```typescript
// In useTeachingGuide.ts, add before Step 5:

// Step 4.5: Query Teaching Guide Chunks
const curriculumChunks = await supabase
  .from('teaching_guides_chunks')
  .select('*')
  .contains('applicable_grades', [gradeLevel])
  .ilike('topic', `%${curriculumTopic}%`)
  .eq('guide_type', 'pedagogical_strategies')
  .limit(5);

// Then pass to AI:
const insights = await generateTeachingInsight({
  studentCategory,
  curriculumTopic,
  webResources,
  youtubeTranscripts: transcripts,
  curriculumChunks: curriculumChunks.data, // NEW
  audience,
  gradeLevel,
  studentCount,
});
```

---

## 🔍 Example: Complete Flow for "Visual Learner + Mathematics"

### Input
- Student Category: Visual Learner
- Topic: Mathematics
- Grade: CM1
- Audience: Teacher

### Step-by-Step Processing

1. **Brave Search** finds:
   - 3 blog articles about visual learning in math
   - 2 YouTube videos on teaching strategies

2. **YouTube Transcripts** extract:
   - 15-minute video transcript on visual math strategies
   - 10-minute video on using manipulatives

3. **Teaching Guide Chunks** (future) would find:
   - Official French curriculum strategies for visual learners
   - Recommended activities from Education Nationale guides

4. **BlackBox AI** synthesizes:
   - Combines insights from all 3 sources
   - Identifies 5 key strategies (e.g., "Use color-coded manipulatives")
   - Creates 4 practical activities (e.g., "Fraction Bar Activity")
   - Generates differentiated lesson plan
   - Provides resource links

5. **Output** includes:
   ```json
   {
     "summary": "Visual learners process mathematical concepts best through diagrams, color-coding, and spatial representations...",
     "strategies": [
       {
         "title": "Color-Coded Manipulatives",
         "description": "Use different colors for different operations...",
         "why_it_works": "Visual learners retain 65% more information when color is used strategically..."
       }
     ],
     "activities": [
       {
         "name": "Fraction Bar Exploration",
         "duration": "30 minutes",
         "materials": ["Fraction bars", "Colored paper", "Markers"],
         "steps": ["1. Distribute fraction bars...", "2. Have students..."]
       }
     ],
     "resources": [
       {
         "title": "Visual Learning Strategies",
         "url": "https://edutopia.org/...",
         "type": "article"
       }
     ],
     "lessonPlan": "# Mathematics Lesson Plan\n## Support Group\n- Use physical manipulatives..."
   }
   ```

---

## 💡 Key Benefits of This Approach

1. **Evidence-Based:** Combines research articles with practical video demonstrations
2. **Up-to-Date:** Brave Search provides latest teaching strategies
3. **Curriculum-Aligned:** (Future) Incorporates official French curriculum guidelines
4. **Personalized:** Tailored to specific student learning profiles
5. **Actionable:** Provides concrete activities and lesson plans
6. **Cached:** Saves results for 7 days to reduce API calls

---

## 🚀 Next Steps to Complete Integration

1. **Ingest Teaching Guide PDFs**
   ```bash
   cd aura-learn/backend/assessment_pipeline/teaching_guides
   python run_ingestion.py
   ```

2. **Update AI Prompt** to include curriculum chunks

3. **Test Complete Workflow** with all 3 data sources

4. **Monitor Performance** and adjust caching strategy

---

## 📝 Summary

**The Teaching Guide system works like this:**

1. Teacher clicks "View Teaching Guide" for a student category + topic
2. System fetches external resources (Brave Search API)
3. System extracts YouTube video transcripts
4. System queries official curriculum documents (future)
5. BlackBox AI synthesizes everything into actionable strategies
6. Result is cached for 7 days and displayed in UI

**Current Status:** Steps 1-3 and 5-6 are working. Step 4 (curriculum chunks) is ready but not yet integrated into the AI workflow.
