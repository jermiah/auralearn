# Brave Search API Setup Guide

## Step 1: Get Your Brave Search API Key

1. Go to [Brave Search API](https://brave.com/search/api/)
2. Click "Get Started" or "Sign Up"
3. Create an account or sign in
4. Navigate to your dashboard
5. Create a new API key
6. Copy your API key

## Step 2: Add API Key to Your Environment

### For Backend (Python)

Add this line to your `.env` file in the `aura-learn/backend/` directory:

```bash
# Brave Search API
BRAVE_SEARCH_API_KEY=your_brave_api_key_here
```

**Full `.env` file should look like:**

```bash
# Existing variables
MISTRAL_API_KEY=your_mistral_key
MISTRAL_MODEL=mistral-ocr-2505
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key

# Add this new line
BRAVE_SEARCH_API_KEY=your_brave_api_key_here
```

### For Frontend (if using Netlify Functions)

Add to your Netlify environment variables:
1. Go to Netlify Dashboard
2. Site Settings → Environment Variables
3. Add: `BRAVE_SEARCH_API_KEY` = `your_brave_api_key_here`

## Step 3: Test the Service

### Test CLI (Python)

```bash
# Navigate to project directory
cd aura-learn

# Activate virtual environment (if using one)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Test the service
python backend/teaching_resources_service.py "Visual Learner"
```

**Expected Output:**
```json
{
  "segment": "Visual Learner",
  "blogs": [
    "https://www.edutopia.org/article/visual-learning-strategies",
    "https://www.teachthought.com/learning/visual-learners-guide",
    "https://www.understood.org/visual-learning-tips"
  ],
  "youtube_links": [
    "https://www.youtube.com/watch?v=abc123",
    "https://www.youtube.com/watch?v=def456"
  ]
}
```

### Test All Segments

```bash
# List all supported segments
python backend/teaching_resources_service.py

