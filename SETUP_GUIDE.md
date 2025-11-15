# LearnAura - Internet-Powered Learning Layer Setup Guide

## 🎯 Overview

This guide will help you set up the upgraded LearnAura system with internet-powered teaching guides for teachers and parents.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or bun package manager
- ✅ A Supabase account ([signup here](https://supabase.com))
- ✅ An OpenAI API key ([get one here](https://platform.openai.com))
- ✅ Claude Code with MCP servers configured (for Brave Search & YouTube)

---

## 🗄️ Part 1: Supabase Database Setup

### Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `learnaura`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to you
4. Wait for project to finish setting up (~2 minutes)

### Step 2: Run Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this repository
3. Copy the entire SQL content
4. Paste it into the SQL Editor
5. Click **Run** to execute

This will create:
- ✅ All database tables (users, classes, students, assessments, resources, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Database indexes for performance
- ✅ Triggers and functions

### Step 3: Get Your Supabase Credentials

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon Public Key** (starts with `eyJ...`)

---

## 🔑 Part 2: Environment Configuration

### Step 1: Create Environment File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...your-anon-key

# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-...your-openai-key

# Note: Brave Search and YouTube transcripts handled via MCP
```

### Step 2: Verify Configuration

Run this command to check if your environment variables are loaded:

```bash
npm run dev
```

If you see errors about missing environment variables, double-check your `.env` file.

---

## 🤖 Part 3: MCP (Model Context Protocol) Setup

The system uses MCP to access Brave Search and YouTube transcripts through Claude Code.

### What is MCP?

MCP allows Claude to call external tools like web search and video transcripts. These run through your Claude Desktop app.

### Configure MCP Servers

1. Open your Claude Desktop config file:
   - **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the MCP servers:

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your_brave_api_key_here"
      }
    },
    "youtube-transcript": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-youtube-transcript"]
    }
  }
}
```

3. Get a Brave Search API Key:
   - Go to [Brave Search API](https://brave.com/search/api/)
   - Sign up for a free account
   - Copy your API key
   - Replace `your_brave_api_key_here` in the config

4. Restart Claude Desktop

### Verify MCP is Working

In Claude Code, you should now have access to:
- `brave_search` - Search the web
- `youtube_transcript` - Get video transcripts

You can test by asking Claude: "Search for teaching strategies for visual learners"

---

## 📦 Part 4: Install Dependencies

```bash
cd aura-learn
npm install
```

This installs:
- ✅ Supabase client
- ✅ OpenAI SDK
- ✅ React Query (for data fetching)
- ✅ All UI components

---

## 🚀 Part 5: Run the Application

### Development Mode

```bash
npm run dev
```

The app will start at [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
npm run build
npm run preview
```

---

## 🧪 Part 6: Testing the System

### Test Flow 1: Teacher View

1. Navigate to `/teaching-guide`
2. Click "View Teaching Guide" on any category (e.g., "Visual Learner")
3. Wait while the system:
   - 🔍 Searches Brave for teaching resources
   - 📺 Fetches YouTube transcripts
   - 🤖 Generates AI insights
   - 💾 Saves to Supabase
4. Review the generated guide with:
   - Strategies
   - Activities
   - Resources
   - Lesson Plan

### Test Flow 2: Parent View

1. Navigate to `/parent-guide`
2. Click "How to Support at Home" on a child
3. Review parent-friendly guidance with:
   - Simple strategies
   - Home activities
   - Weekly checklist
   - Encouraging language

---

## 🔧 Part 7: Customization

### Modify Student Categories

Edit `src/lib/supabase.ts`:

```typescript
export type StudentCategory =
  | 'slow_processing'
  | 'fast_processor'
  | 'your_custom_category'; // Add your category

export const categoryDisplayNames: Record<StudentCategory, string> = {
  slow_processing: 'Slow Processing',
  fast_processor: 'Fast Processor',
  your_custom_category: 'Your Custom Category', // Add display name
};
```

### Change AI Model

Edit `src/services/ai-insights.ts`:

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview', // Change to 'gpt-3.5-turbo' for faster/cheaper
  // ... rest of config
});
```

### Adjust Cache Duration

Teaching guides are cached for 7 days by default. To change:

Edit `src/hooks/useTeachingGuide.ts`:

```typescript
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7); // Change to 14, 30, etc.
```

---

## 🐛 Part 8: Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Check that `.env` file exists and contains:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Restart dev server after updating `.env`.

---

### Issue: "OpenAI API error"

**Solutions**:
1. Verify API key is correct
2. Check you have credits in your OpenAI account
3. Check internet connection
4. Try reducing `max_tokens` in `ai-insights.ts`

---

### Issue: "MCP tools not found"

**Solutions**:
1. Verify Claude Desktop config is correct
2. Restart Claude Desktop
3. Check MCP server logs in Claude Desktop
4. For Brave Search: Verify API key is valid

---

### Issue: "Database connection failed"

**Solutions**:
1. Check Supabase project is active
2. Verify Project URL and Anon Key are correct
3. Check RLS policies are enabled
4. Try regenerating Anon Key in Supabase Dashboard

---

### Issue: "Teaching guide loading forever"

**Solutions**:
1. Check browser console for errors
2. Verify OpenAI API key is valid
3. Check MCP servers are running
4. Try regenerating the guide
5. Check Supabase database has teaching_guides table

---

## 📊 Part 9: Data Management

### View Data in Supabase

1. Go to Supabase Dashboard → **Table Editor**
2. Browse tables:
   - `internet_resources` - Cached web search results
   - `youtube_transcripts` - Cached video transcripts
   - `teaching_guides` - Generated AI insights
   - `students` - Student records
   - `classes` - Class records

### Clear Cache

To force regeneration of guides:

1. Go to Supabase Dashboard → **Table Editor**
2. Select `teaching_guides` table
3. Delete rows for specific categories/topics
4. Or run SQL:

```sql
DELETE FROM teaching_guides WHERE expires_at < NOW();
```

---

## 🔐 Part 10: Security Best Practices

### API Keys

- ✅ Never commit `.env` to Git (already in `.gitignore`)
- ✅ Use environment variables for all secrets
- ✅ Rotate keys regularly
- ✅ Use separate keys for dev/prod

### Supabase RLS

Row Level Security is already configured to ensure:
- Teachers only see their own classes
- Parents only see their own children
- Resources are publicly readable (cached data)

### OpenAI Safety

The AI prompts are designed to:
- Generate educational content only
- Focus on evidence-based strategies
- Use encouraging, non-judgmental language
- Avoid medical or psychological diagnoses

---

## 📈 Part 11: Performance Optimization

### Caching Strategy

The system uses 3 levels of caching:

1. **Browser**: React Query caches for 1 hour
2. **Database**: Supabase stores guides for 7 days
3. **MCP**: Internet resources cached in DB

### Reduce API Costs

1. **Increase cache duration** (see Part 7)
2. **Use GPT-3.5** instead of GPT-4 (faster, cheaper)
3. **Limit concurrent requests** in `useTeachingGuide.ts`
4. **Reuse resources** across similar categories

### Database Indexes

Already created for fast queries:
- `idx_internet_resources_category_topic`
- `idx_youtube_transcripts_category_topic`
- `idx_teaching_guides_class_category`

---

## 🎨 Part 12: UI Customization

### Change Color Scheme

Edit `src/index.css` to modify CSS variables:

```css
:root {
  --primary: 210 100% 50%; /* Change primary color */
  --pastel-mint: 160 60% 85%; /* Customize pastels */
  /* ... more variables */
}
```

### Add New Category Icons

Edit `src/pages/TeachingGuide.tsx`:

```typescript
import { YourIcon } from "lucide-react";

const categoryConfig = {
  your_category: {
    icon: YourIcon,
    color: "from-blue-500 to-purple-500",
    description: "Your description",
    studentCount: 0,
  },
};
```

---

## 🚢 Part 13: Deployment

### Deploy to Vercel

```bash
npm run build
vercel --prod
```

Set environment variables in Vercel Dashboard.

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Important: MCP in Production

**Note**: MCP servers run through Claude Desktop, which is a local application. For production:

**Option A**: Build a backend API that calls Brave Search and YouTube APIs directly
**Option B**: Use serverless functions to proxy MCP calls
**Option C**: Keep MCP for development only, use cached data in production

---

## 📞 Part 14: Support

### Getting Help

- **Documentation**: Check this README first
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **OpenAI Docs**: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- **MCP Docs**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)

### Common Questions

**Q: How much does this cost to run?**

A: Costs depend on usage:
- Supabase: Free tier supports ~500MB database
- OpenAI: ~$0.01-0.03 per teaching guide generation
- Brave Search: Free tier includes 2,000 queries/month

**Q: Can I use this offline?**

A: Partially. Once guides are cached in Supabase, they work offline. But generating new guides requires internet for API calls.

**Q: How do I add real authentication?**

A: Implement Supabase Auth:
1. Enable authentication in Supabase Dashboard
2. Add login/signup pages
3. Use `supabase.auth.signIn()`
4. RLS policies already configured

---

## ✅ Part 15: Checklist

Before going live, verify:

- [ ] Supabase database schema is created
- [ ] Environment variables are set
- [ ] MCP servers are configured (or alternative API integration)
- [ ] Application runs without errors
- [ ] Teaching guides generate successfully
- [ ] Parent guides display correctly
- [ ] Data saves to Supabase
- [ ] API keys are secure (not in Git)
- [ ] Cache is working
- [ ] UI looks good on mobile and desktop

---

## 🎉 Congratulations!

Your LearnAura internet-powered learning layer is now set up!

Next steps:
1. Add real class and student data
2. Test with actual teachers and parents
3. Customize categories for your needs
4. Deploy to production
5. Monitor API usage and costs

Happy teaching! 🚀
