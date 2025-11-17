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

# Test each segment
python backend/teaching_resources_service.py "Slow Processing"
python backend/teaching_resources_service.py "Fast Processor"
python backend/teaching_resources_service.py "High Energy / Needs Movement"
python backend/teaching_resources_service.py "Visual Learner"
python backend/teaching_resources_service.py "Logical Learner"
python backend/teaching_resources_service.py "Sensitive / Low Confidence"
python backend/teaching_resources_service.py "Easily Distracted"
python backend/teaching_resources_service.py "Needs Repetition"
```

## Step 4: Integrate with Your App

### Option A: Flask Backend

Create a Flask endpoint in your existing backend:

```python
# In your Flask app (e.g., backend/app.py)
from teaching_resources_service import TeachingResourcesService

service = TeachingResourcesService()

@app.route('/api/teaching-resources/<segment>', methods=['GET'])
def get_teaching_resources(segment):
    resources = service.get_resources_for_segment(segment)
    return jsonify(resources)

@app.route('/api/teaching-resources/segments', methods=['GET'])
def get_segments():
    segments = service.get_supported_segments()
    return jsonify({"segments": segments})
```

### Option B: Netlify Functions

Create `netlify/functions/teaching-resources.ts`:

```typescript
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const segment = event.queryStringParameters?.segment;
  
  if (!segment) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Segment parameter required' })
    };
  }

  try {
    // Call Python service or implement in TypeScript
    const response = await fetch(`${process.env.PYTHON_SERVICE_URL}/teaching-resources/${segment}`);
    const data = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch resources' })
    };
  }
};
```

## Step 5: Update Frontend

The React component is already created at `src/pages/TeachingResources.tsx`.

Update your routing to include it:

```tsx
// In your App.tsx or router configuration
import TeachingResources from '@/pages/TeachingResources';

// Add route
<Route path="/teaching-resources" element={<TeachingResources />} />
```

Update the API endpoint in `TeachingResources.tsx` to match your backend:

```tsx
// Change this line in TeachingResources.tsx
const response = await fetch(`/api/teaching-resources/${encodeURIComponent(segment)}`);

// To your actual endpoint, e.g.:
const response = await fetch(`https://your-backend.com/api/teaching-resources/${encodeURIComponent(segment)}`);
```

## Troubleshooting

### Error: "BRAVE_SEARCH_API_KEY not found"
- Make sure you added the key to your `.env` file
- Restart your Python process after adding the key
- Check that `.env` file is in the correct directory

### Error: "401 Unauthorized"
- Your API key is invalid or expired
- Get a new API key from Brave Search dashboard

### Error: "429 Too Many Requests"
- You've hit the rate limit
- Free tier: 2,000 queries/month
- Consider implementing caching (see TEACHING_RESOURCES_API.md)

### No Results Returned
- Check your internet connection
- Verify the Brave Search API is working
- Try a different segment

## API Rate Limits

**Free Tier:**
- 2,000 queries per month
- ~66 queries per day
- Consider caching results to reduce API calls

**Paid Tiers:**
- Higher limits available
- Check Brave Search pricing page

## Caching (Recommended)

To reduce API calls, implement caching:

```python
# Add to teaching_resources_service.py
from functools import lru_cache
from datetime import datetime, timedelta

class CachedTeachingResourcesService(TeachingResourcesService):
    def __init__(self):
        super().__init__()
        self.cache = {}
        self.cache_duration = timedelta(days=7)
    
    def get_resources_for_segment(self, segment: str):
        if segment in self.cache:
            cached_data, cached_time = self.cache[segment]
            if datetime.now() - cached_time < self.cache_duration:
                return cached_data
        
        data = super().get_resources_for_segment(segment)
        self.cache[segment] = (data, datetime.now())
        return data
```

## Next Steps

1. ✅ Get Brave Search API key
2. ✅ Add to `.env` file
3. ✅ Test CLI
4. ✅ Set up backend endpoint
5. ✅ Test frontend integration
6. ✅ Deploy to production

## Support

- Brave Search API Docs: https://brave.com/search/api/
- Issues: Check TEACHING_RESOURCES_API.md
- Questions: Review the documentation files
