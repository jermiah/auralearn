# LearnAura - Quick Start Guide

## 🚀 Get Up and Running in 2 Minutes

The app now works **WITHOUT** configuration! You can try it immediately in demo mode.

---

## ✅ Step 1: Run the App

```bash
npm run dev
```

The app will start at [http://localhost:5173](http://localhost:5173)

---

## ✅ Step 2: Explore the New Features

### **Teaching Guide** (`/teaching-guide`)
1. Click "Teaching Guide" in the sidebar
2. You'll see 8 learning profile categories
3. Click "View Teaching Guide" on any category
4. See AI-generated strategies, activities, and resources

### **Parent Guide** (`/parent-guide`)
1. Click "Parent Guide" in the sidebar
2. See mock child profiles
3. Click "How to Support at Home"
4. View parent-friendly guidance

---

## ⚙️ Current Status

### ✅ **Working Now (Demo Mode)**
- All pages load correctly
- Teaching Guide UI displays
- Parent Guide UI displays
- Navigation works
- Mock data shows

### ⏳ **Needs Configuration (For Full Features)**
- **Supabase**: Database caching
- **OpenAI**: AI insight generation
- **MCP**: Brave Search & YouTube transcripts

---

## 🔧 To Enable Full Features

### 1. **Supabase Setup** (Optional - for data persistence)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to SQL Editor → Run `supabase-schema.sql`
4. Go to Settings → API → Copy:
   - Project URL
   - Anon public key
5. Uncomment and add to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

### 2. **OpenAI Setup** (Optional - for AI insights)

1. Get API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Uncomment and add to `.env`:
   ```env
   VITE_OPENAI_API_KEY=sk-...
   ```

### 3. **MCP Setup** (Optional - for internet search)

See [SETUP_GUIDE.md](SETUP_GUIDE.md) Part 3 for MCP configuration.

---

## 🎯 What Works Without Configuration

### ✅ **All existing LearnAura features:**
- Home page
- Create Class
- Assessment
- Dashboard
- Worksheets
- Settings

### ✅ **New UI features:**
- Teaching Guide page layout
- Parent Guide page layout
- Navigation updates
- Visual design

### ⚠️ **What needs config:**
- Clicking "View Teaching Guide" button (needs OpenAI/MCP)
- Data persistence (needs Supabase)
- Real internet search (needs MCP)

---

## 🐛 Troubleshooting

### **White Screen / Blank Page**

✅ **FIXED!** The app now works without Supabase configured.

You should see console warnings like:
```
⚠️ Supabase not configured. Using placeholder values.
📝 To enable full functionality, add credentials to .env
```

This is normal and the app will work in demo mode.

---

### **"View Teaching Guide" Button Doesn't Work**

This is expected without OpenAI configured. The button will:
- Show loading spinner
- Eventually show an error or fallback response
- Still display the UI correctly

To fix: Add OpenAI API key to `.env`

---

## 📂 Project Structure

```
aura-learn/
├── src/
│   ├── pages/
│   │   ├── TeachingGuide.tsx      ← NEW: Teacher view
│   │   └── ParentGuide.tsx        ← NEW: Parent view
│   ├── components/
│   │   ├── TeachingGuidePanel.tsx ← NEW: Detail panel
│   │   └── Sidebar.tsx            ← UPDATED: New navigation
│   ├── services/
│   │   ├── mcp-integration.ts     ← NEW: Brave & YouTube
│   │   └── ai-insights.ts         ← NEW: OpenAI integration
│   ├── hooks/
│   │   └── useTeachingGuide.ts    ← NEW: Data fetching
│   └── lib/
│       └── supabase.ts            ← NEW: Database client
├── supabase-schema.sql            ← NEW: Database schema
├── SETUP_GUIDE.md                 ← Full setup instructions
├── IMPLEMENTATION_SUMMARY.md      ← Technical overview
└── QUICKSTART.md                  ← This file!
```

---

## 🎨 What to See

### **Teaching Guide Page**
- 8 beautiful category cards
- Each with icon, gradient, description
- Student counts
- "View Teaching Guide" buttons

### **Parent Guide Page**
- Child profile cards
- Learning characteristic badges
- Current topic display
- "How to Support at Home" button

### **Navigation**
- "Teaching Guide" replaces "Insights"
- "Parent Guide" added with heart icon
- Updated icons throughout

---

## ✨ Next Steps

1. **Try the demo**: Explore all pages
2. **Configure Supabase**: For data persistence
3. **Add OpenAI key**: For AI insights
4. **Setup MCP**: For real-time internet search
5. **Deploy**: When ready for production

---

## 📞 Need Help?

- **Full setup**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Technical details**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Database schema**: See [supabase-schema.sql](supabase-schema.sql)

---

## 🎉 You're Ready!

The app is now running and ready to explore. Configure the optional services when you're ready for full functionality.

**Enjoy your upgraded LearnAura! 🚀**
