# Supabase Setup Guide for LearnAura

## 📋 Overview

Supabase provides:
- ✅ PostgreSQL database for storing teaching guides
- ✅ Automatic caching (reduce API costs by 80-90%)
- ✅ Row Level Security (teachers only see their data)
- ✅ Free tier (500MB, 50,000 requests/month)

**Time to complete:** 10-15 minutes

---

## Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email if needed

---

## Step 2: Create a New Project

1. Click "New Project"
2. Fill in project details:
   - **Name:** `learnaura` (or any name you prefer)
   - **Database Password:** Create a strong password
     - Write this down! You'll need it later
   - **Region:** Choose closest to you (e.g., US East, EU West)
   - **Pricing Plan:** Free (sufficient for testing)

3. Click "Create new project"
4. Wait 2-3 minutes for database to provision

---

## Step 3: Run Database Schema

### 3a. Open SQL Editor

1. In your Supabase dashboard, click **SQL Editor** in left sidebar
2. Click "+ New Query"

### 3b. Copy Schema SQL

1. In your project, open the file: `supabase-schema.sql`
2. Copy **ALL** the SQL code (it's a long file, ~400 lines)

### 3c. Paste and Run

1. Paste the copied SQL into the Supabase SQL Editor
2. Click "Run" (or press Ctrl+Enter)
3. Wait for execution (takes ~5-10 seconds)

### 3d. Verify Success

You should see:
- ✅ Green checkmark
- ✅ Message: "Success. No rows returned"

If you see errors, check:
- Did you copy the ENTIRE schema file?
- Try running it again (it's safe to run multiple times)

---

## Step 4: Get Your API Keys

### 4a. Navigate to API Settings

1. Click **Settings** (gear icon) in left sidebar
2. Click **API** under "Project Settings"

### 4b. Copy Project URL

1. Find "Project URL"
2. Copy it (looks like: `https://xxxxx.supabase.co`)
3. Save it temporarily (notepad, sticky note, etc.)

### 4c. Copy Anon Public Key

1. Scroll down to "Project API keys"
2. Find "anon" "public" key
3. Click the copy icon (looks like two squares)
4. Save it temporarily (it's a long string starting with `eyJ...`)

---

## Step 5: Configure Your App

### 5a. Open .env File

In your project folder, open the `.env` file

### 5b. Uncomment and Add Keys

Find these lines:
```env
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Uncomment** (remove the `#`) and **replace** with your actual values:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1...
```

### 5c. Save the File

Save `.env` and close it.

---

## Step 6: Restart Your App

1. **Stop** your dev server (Ctrl+C in terminal)
2. **Start** it again:
   ```bash
   npm run dev
   ```

3. Check the browser console - you should **NOT** see:
   ```
   ⚠️ Supabase not configured
   ```

If configured correctly, you'll see normal operation.

---

## Step 7: Test It Works

### Test 1: Generate a Teaching Guide

1. Navigate to `/teaching-guide`
2. Click "View Teaching Guide" on any category
3. Wait for generation (may take 10-30 seconds)
4. Guide should display

### Test 2: Check Database

1. Go back to Supabase Dashboard
2. Click **Table Editor** in left sidebar
3. Click `teaching_guides` table
4. You should see 1 row with your generated guide!

### Test 3: Test Caching

1. Click "View Teaching Guide" for **the same category** again
2. Should load **instantly** (from cache)
3. Check browser console - should see:
   ```
   ✅ Using cached teaching guide
   ```

---

## 🎉 Success!

Your Supabase is now configured! Benefits you now have:

✅ **Persistent storage** - Guides survive page refreshes
✅ **Fast loading** - Cached guides load instantly
✅ **Cost savings** - 90% fewer API calls
✅ **Scalability** - Can handle hundreds of guides

---

## 📊 Monitor Your Database

### View Stored Guides

1. Supabase Dashboard → **Table Editor**
2. Click `teaching_guides` table
3. See all cached guides with:
   - Student category
   - Curriculum topic
   - Audience (teacher/parent)
   - Expiration date
   - Full JSON content

### View Resources

1. Click `internet_resources` table
2. See all Brave Search results

### View Transcripts

1. Click `youtube_transcripts` table
2. See all YouTube video transcripts

---

## 🧹 Maintenance

### Clear Expired Guides

Guides automatically expire after 7 days. To manually clear:

1. Go to **SQL Editor**
2. Run this query:
   ```sql
   DELETE FROM teaching_guides WHERE expires_at < NOW();
   ```

### Clear All Cache

To force regeneration of all guides:

```sql
DELETE FROM teaching_guides;
DELETE FROM internet_resources;
DELETE FROM youtube_transcripts;
```

---

## 🔐 Security

### What's Protected?

✅ Teachers can only see their own classes
✅ Parents can only see their own children
✅ Resources are cached but public (no sensitive data)

### Row Level Security (RLS)

The schema already includes RLS policies that:
- Verify user identity before queries
- Filter results based on ownership
- Prevent unauthorized access

### API Keys

⚠️ **Never commit `.env` to Git!**
- Already in `.gitignore`
- Keep keys private
- Rotate if exposed

---

## 🐛 Troubleshooting

### Error: "relation 'teaching_guides' does not exist"

**Solution:**
- Schema wasn't run or failed
- Go back to Step 3
- Run `supabase-schema.sql` again

---

### Error: "Invalid API key"

**Solution:**
- Check for typos in `.env`
- Verify you copied the **anon public** key (not service_role)
- Try regenerating keys in Supabase Dashboard

---

### Error: "Row Level Security policy violation"

**Solution:**
- This is normal if not logged in
- For demo, RLS policies allow reads
- For production, implement authentication

---

### Guides not caching

**Check:**
1. Supabase configured correctly?
2. No errors in browser console?
3. Run this SQL to check:
   ```sql
   SELECT * FROM teaching_guides ORDER BY generated_at DESC;
   ```

---

## 📈 Upgrade to Production

### For Production Deployment:

1. **Add Authentication:**
   - Enable Supabase Auth in dashboard
   - Add login/signup pages
   - Protect routes

2. **Optimize RLS:**
   - Review policies for your use case
   - Add teacher/parent role checks

3. **Monitor Usage:**
   - Check database size (free tier: 500MB)
   - Monitor API requests
   - Set up alerts

4. **Backup:**
   - Supabase includes automatic backups (paid plans)
   - Export data periodically for extra safety

---

## 💰 Pricing (as of 2024)

### Free Tier (Perfect for testing):
- 500MB database
- 50,000 monthly active users
- 2GB file storage
- 50GB bandwidth

### Pro Tier ($25/month):
- 8GB database
- Unlimited API requests
- 100GB file storage
- 250GB bandwidth

For LearnAura, Free tier supports:
- ~1,000-2,000 cached teaching guides
- ~10-20 teachers
- ~100-200 students

---

## ✅ Checklist

Verify everything works:

- [ ] Created Supabase account
- [ ] Created new project
- [ ] Ran `supabase-schema.sql` in SQL Editor
- [ ] Copied Project URL to `.env`
- [ ] Copied Anon Key to `.env`
- [ ] Restarted dev server
- [ ] Generated a teaching guide
- [ ] Saw data in `teaching_guides` table
- [ ] Tested caching (instant load on 2nd try)

---

## 🆘 Need Help?

### Resources:
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **SQL Editor Guide:** [supabase.com/docs/guides/database](https://supabase.com/docs/guides/database)
- **RLS Guide:** [supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)

### Common Issues:
- **Schema errors:** Make sure to copy ENTIRE file
- **API key errors:** Double-check no extra spaces
- **Caching not working:** Check browser console for errors

---

## 🎓 Next Steps

After Supabase is working:

1. ✅ Configure BlackBox AI (see `BLACKBOX_INTEGRATION.md`)
2. ✅ Test full workflow (create class → assess → generate guides)
3. ✅ Monitor database usage
4. ✅ Consider adding authentication for production

---

**Congratulations! Your Supabase is ready!** 🎉

Now your LearnAura system has persistent storage, smart caching, and is ready to scale!
