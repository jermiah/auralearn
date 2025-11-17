# LearnAura - BlackBox AI Integration Guide

## 🎯 Overview

LearnAura now uses **BlackBox AI** with tool calling for ALL AI-powered features:
- ✅ AI insight generation (teaching strategies)
- ✅ Brave Search (educational resources)
- ✅ YouTube transcripts (video content)

**One API key powers everything!**

---

## 🔑 Getting Your BlackBox API Key

1. Visit [blackbox.ai/api-keys](https://www.blackbox.ai/api-keys)
2. Sign up or log in
3. Generate a new API key
4. Copy the key (starts with `sk-...`)

---

## ⚙️ Configuration

### Step 1: Add API Key to `.env`

Uncomment and add your key:

```env
VITE_BLACKBOX_API_KEY=sk-your-actual-key-here
```

### Step 2: Restart Dev Server

```bash
npm run dev
```

That's it! 🎉

---

## 🔧 How It Works

### Architecture

```
User clicks "View Teaching Guide"
   ↓
useTeachingGuide Hook
   ↓
[1] searchTeachingStrategies()
    → BlackBox AI with Brave Search tool
    → Returns educational resources
   ↓
[2] batchFetchYouTubeTranscripts()
    → BlackBox AI with YouTube tool
    → Returns video transcripts
   ↓
[3] generateTeachingInsight()
    → BlackBox AI generates structured JSON
    → Combines all resources into guide
   ↓
Display in UI
```

### BlackBox AI Tool Calling

#### **Brave Search Tool**
```typescript
{
  type: 'function',
  function: {
    name: 'brave_search',
    description: 'Search the web using Brave Search API',
    parameters: {
      query: 'how to teach visual learners mathematics',
      count: 10
    }
  }
}
```

#### **YouTube Transcript Tool**
```typescript
{
  type: 'function',
  function: {
    name: 'get_youtube_transcript',
    description: 'Get transcript from YouTube video',
    parameters: {
      video_id: 'ABC123DEF456'
    }
  }
}
```

#### **Agentic Loop**
BlackBox AI:
1. Receives user prompt
2. Decides which tools to call
3. Executes tools
4. Processes results
5. Generates final response

---

## 📁 Key Files

### **New Files Created:**

1. **`src/services/blackbox-client.ts`**
   - BlackBox AI API client
   - Tool calling infrastructure
   - Agentic loop implementation
   - Structured response generation

2. **`src/services/internet-intelligence.ts`**
   - Brave Search integration via BlackBox
   - YouTube transcript fetching via BlackBox
   - Replaces `mcp-integration.ts`

3. **`src/services/blackbox-insights.ts`**
   - AI insight generation using BlackBox
   - Replaces `ai-insights.ts` (OpenAI)

### **Updated Files:**

1. **`src/hooks/useTeachingGuide.ts`**
   - Now imports from `internet-intelligence.ts`
   - Now imports from `blackbox-insights.ts`

2. **`.env`**
   - Added `VITE_BLACKBOX_API_KEY`
   - Removed OpenAI references

---

## 🎨 Features Enabled by BlackBox AI

### **1. Teaching Guide Generation**

When you click "View Teaching Guide":

1. **Brave Search** finds 10-15 educational resources:
   - Articles from edutopia.org, understood.org
   - Teaching blogs
   - Research papers
   - YouTube videos

2. **YouTube Transcripts** extracts content from videos:
   - Full text transcripts
   - Duration and metadata
   - Educational content analysis

3. **AI Insight Generation** creates:
   - Profile summary
   - 3-5 teaching strategies
   - 3-4 classroom activities
   - Resource recommendations
   - Lesson plan (teachers) or home checklist (parents)

### **2. Teacher vs Parent Content**

**Teachers get:**
- Classroom management strategies
- Lesson planning outlines
- 3-tier differentiation (Support/Core/Advanced)
- Assessment methods
- Group activities

**Parents get:**
- Home support strategies
- Simple daily activities
- Weekly checklist
- Confidence-building tips
- Warm, encouraging language

---

## 💰 Pricing

### BlackBox AI Costs (Estimated):
- **Free Tier**: Limited requests per month
- **Pro Tier**: ~$20/month for high usage
- **Cost per guide**: ~$0.01-0.03

### Supabase (Optional):
- **Free Tier**: 500MB database, 50,000 requests/month
- Caching reduces API costs by 80-90%

---

## 🧪 Testing

### Test Without API Key (Demo Mode):

```bash
npm run dev
```

- App loads ✅
- Teaching Guide UI displays ✅
- Clicking "View Teaching Guide" shows fallback data ✅

### Test With API Key (Full Features):

1. Add `VITE_BLACKBOX_API_KEY` to `.env`
2. Restart dev server
3. Navigate to `/teaching-guide`
4. Click "View Teaching Guide"
5. Watch console for:
   ```
   🔄 Agentic loop iteration 1
   🔧 Processing 1 tool calls
   📞 Calling tool: brave_search
   ✅ Agentic loop completed
   ```

---

## 🐛 Troubleshooting

### Issue: "BlackBox API key not configured"

**Solution:**
1. Check `.env` file has `VITE_BLACKBOX_API_KEY=sk-...`
2. Restart dev server (`npm run dev`)
3. Hard refresh browser (Ctrl+Shift+R)

---

### Issue: "API error: 401 Unauthorized"

**Solution:**
1. Verify API key is correct
2. Check key hasn't expired
3. Generate new key from BlackBox dashboard

---

### Issue: "Tool calling not working"

**Solution:**
1. BlackBox AI automatically handles tool calling
2. Check console for tool execution logs
3. Verify model supports tool calling: `blackboxai/google/gemini-2.0-flash-001`

---

### Issue: "Response not JSON"

**Solution:**
1. BlackBox AI should return JSON when prompted
2. Fallback parser tries to extract JSON from markdown
3. If fails, shows fallback response

---

## 📊 Monitoring

### Console Logs:

```
🤖 Generating AI insights with BlackBox AI for: { category, topic, audience }
🔍 Brave Search called with: { query, count }
📺 YouTube Transcript called with: { video_id }
🔄 Agentic loop iteration 1
🔧 Processing 2 tool calls
📞 Calling tool: brave_search
📞 Calling tool: get_youtube_transcript
✅ Agentic loop completed
```

### Supabase Monitoring (if configured):

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Check `teaching_guides` table for cached results
4. Monitor `internet_resources` for search results
5. View `youtube_transcripts` for video content

---

## 🎓 Example Workflow

### User Journey:

1. **User:** Clicks "View Teaching Guide" for "Visual Learner"
2. **Frontend:** Calls `useTeachingGuide` hook
3. **Hook:** Checks Supabase cache (miss)
4. **Hook:** Calls `searchTeachingStrategies()`
5. **Service:** BlackBox AI + Brave Search tool
   - Query: "how to teach visual learners mathematics"
   - Returns: 10 educational resources
6. **Hook:** Calls `batchFetchYouTubeTranscripts()`
7. **Service:** BlackBox AI + YouTube tool
   - Extracts transcripts from video URLs
8. **Hook:** Calls `generateTeachingInsight()`
9. **Service:** BlackBox AI generates structured guide
   - Input: Resources + Transcripts + Profile
   - Output: JSON with strategies, activities, lesson plan
10. **Hook:** Saves to Supabase (if configured)
11. **Frontend:** Displays in TeachingGuidePanel
12. **User:** Views strategies, activities, resources

---

## 🔄 Fallback System

### 3-Level Fallback:

1. **Supabase Cache** (7 days)
   - Instant load
   - No API calls

2. **BlackBox AI** (with tools)
   - Real-time generation
   - Uses API credits

3. **Mock Data** (if API fails)
   - Hardcoded fallback
   - Always works

---

## 🚀 Advanced Usage

### Custom Models:

Edit `src/services/blackbox-client.ts`:

```typescript
const model = 'blackboxai/anthropic/claude-3.5-sonnet'; // More capable
// or
const model = 'blackboxai/google/gemini-2.0-flash-001'; // Faster, cheaper
```

### Adjust Temperature:

```typescript
temperature: 0.7, // Balance creativity and consistency
```

### Increase Max Tokens:

```typescript
max_tokens: 3500, // For longer responses
```

---

## 📝 Best Practices

1. **Cache aggressively** - Use Supabase to avoid redundant API calls
2. **Monitor costs** - Check BlackBox AI dashboard for usage
3. **Test fallbacks** - Ensure app works without API key
4. **Handle errors** - Wrap API calls in try-catch
5. **Log everything** - Use console.log for debugging

---

## ✅ Checklist

Before deploying:

- [ ] BlackBox API key added to `.env`
- [ ] Supabase configured (optional but recommended)
- [ ] Tested teaching guide generation
- [ ] Tested parent guide generation
- [ ] Verified fallback responses work
- [ ] Checked console for errors
- [ ] Tested caching (load guide twice, second time instant)
- [ ] Reviewed API usage in BlackBox dashboard

---

## 🎉 You're All Set!

Your LearnAura system now has:
- ✅ AI-powered teaching insights
- ✅ Real-time internet search
- ✅ YouTube video analysis
- ✅ Structured JSON responses
- ✅ Fallback system
- ✅ Smart caching

**All powered by a single BlackBox AI API key!**

Happy teaching! 🚀
