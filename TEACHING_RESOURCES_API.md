# Teaching Resources API - External Resource Retrieval

## Overview

The Teaching Resources Service retrieves external teaching strategies and resources for different student learning segments using the Brave Search API. This service powers the Teaching Guide section of the application.

## Architecture

```
Frontend (React)
    ↓
Teaching Resources API Endpoint
    ↓
TeachingResourcesService (Python)
    ↓
Brave Search API
    ↓
Returns: Blogs + YouTube Videos
```

## Student Learning Segments

The service supports 8 different student learning profiles:

1. **Slow Processing** - Students who need more time to process information
2. **Fast Processor** - Gifted students who learn quickly
3. **High Energy / Needs Movement** - Kinesthetic learners
4. **Visual Learner** - Students who learn best through visual aids
5. **Logical Learner** - Students who excel with logical/mathematical approaches
6. **Sensitive / Low Confidence** - Students needing emotional support
7. **Easily Distracted** - Students with attention challenges
8. **Needs Repetition** - Students who benefit from reinforcement

## API Endpoints

### 1. Get Resources for Specific Segment

**Endpoint**: `GET /api/teaching-resources/<segment>`

**Example**:
```bash
GET /api/teaching-resources/Visual%20Learner
```

**Response**:
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
    "https://www.youtube.com/watch?v=def456",
    "https://www.youtube.com/watch?v=ghi789"
  ]
}
```

### 2. Get All Supported Segments

**Endpoint**: `GET /api/teaching-resources/segments`

**Response**:
```json
{
  "segments": [
    "Slow Processing",
    "Fast Processor",
    "High Energy / Needs Movement",
    "Visual Learner",
    "Logical Learner",
    "Sensitive / Low Confidence",
    "Easily Distracted",
    "Needs Repetition"
  ]
}
```

### 3. Get Resources for All Segments

**Endpoint**: `GET /api/teaching-resources/all`

**Response**:
```json
{
  "Slow Processing": {
    "segment": "Slow Processing",
    "blogs": ["url1", "url2", "url3"],
    "youtube_links": ["url1", "url2", "url3"]
  },
  "Fast Processor": {
    "segment": "Fast Processor",
    "blogs": ["url1", "url2", "url3"],
    "youtube_links": ["url1", "url2", "url3"]
  },
  ...
}
```

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
# Brave Search API
BRAVE_SEARCH_API_KEY=your_brave_api_key_here
```

### 2. Get Brave Search API Key

1. Go to [Brave Search API](https://brave.com/search/api/)
2. Sign up for an account
3. Get your API key
4. Add it to `.env`

### 3. Install Dependencies

```bash
pip install requests python-dotenv
```

## Usage

### Python Service (Backend)

```python
from teaching_resources_service import TeachingResourcesService

# Initialize service
service = TeachingResourcesService()

# Get resources for a specific segment
resources = service.get_resources_for_segment("Visual Learner")
print(resources)

# Get all supported segments
segments = service.get_supported_segments()
print(segments)

# Get resources for all segments
all_resources = service.get_all_segments_resources()
print(all_resources)
```

### CLI Usage

```bash
# Get resources for a specific segment
python backend/teaching_resources_service.py "Visual Learner"

# List all supported segments
python backend/teaching_resources_service.py
```

### React Component (Frontend)

```tsx
import TeachingResources from '@/pages/TeachingResources';

// Use in your app
<Route path="/teaching-resources" element={<TeachingResources />} />
```

## Search Query Mapping

The service maps each segment to an optimized search query:

| Segment | Search Query |
|---------|--------------|
| Slow Processing | "teaching strategies for slow processing students elementary school" |
| Fast Processor | "teaching strategies for fast learner students gifted education" |
| High Energy / Needs Movement | "kinesthetic learning strategies active students classroom" |
| Visual Learner | "visual learning strategies teaching techniques elementary" |
| Logical Learner | "logical mathematical learning strategies teaching methods" |
| Sensitive / Low Confidence | "teaching strategies for sensitive students building confidence" |
| Easily Distracted | "teaching strategies for distracted students focus attention" |
| Needs Repetition | "teaching strategies repetition reinforcement learning techniques" |

## Resource Filtering

### Blog/Article Filtering

The service prioritizes educational domains:
- edutopia.org
- teachthought.com
- understood.org
- scholastic.com
- education.com
- readingrockets.org
- weareteachers.com
- And URLs containing: blog, article, resource, guide, strategy, teaching

### YouTube Video Filtering

- Extracts videos from youtube.com/watch and youtu.be URLs
- Returns up to 3 most relevant videos
- Embeds videos directly in the UI

## Error Handling

### Unknown Segment
```json
{
  "segment": "Unknown Segment",
  "error": "Unknown segment: Unknown Segment",
  "blogs": [],
  "youtube_links": []
}
```

### API Errors
- Network errors return empty arrays
- Timeout errors (10s) return empty arrays
- Invalid API key returns error message

## Integration with Teaching Guide

The Teaching Resources page integrates with your existing Teaching Guide:

1. **Student Assessment** → Identifies learning segments
2. **Teaching Guide** → Shows internal strategies from ingested PDFs
3. **Teaching Resources** → Shows external resources from Brave Search

## Rate Limits

Brave Search API has rate limits:
- Free tier: 2,000 queries/month
- Paid tiers: Higher limits available

Consider caching results to reduce API calls.

## Caching Strategy (Recommended)

```python
# Add caching to reduce API calls
from functools import lru_cache
from datetime import datetime, timedelta

class CachedTeachingResourcesService(TeachingResourcesService):
    def __init__(self):
        super().__init__()
        self.cache = {}
        self.cache_duration = timedelta(days=7)  # Cache for 7 days
    
    def get_resources_for_segment(self, segment: str):
        # Check cache first
        if segment in self.cache:
            cached_data, cached_time = self.cache[segment]
            if datetime.now() - cached_time < self.cache_duration:
                return cached_data
        
        # Fetch fresh data
        data = super().get_resources_for_segment(segment)
        self.cache[segment] = (data, datetime.now())
        return data
```

## Testing

```bash
# Test the service
python backend/teaching_resources_service.py "Visual Learner"

# Expected output:
# {
#   "segment": "Visual Learner",
#   "blogs": [...],
#   "youtube_links": [...]
# }
```

## Deployment

### Netlify Functions

Create `netlify/functions/teaching-resources.ts`:

```typescript
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const segment = event.queryStringParameters?.segment;
  
  // Call Python service or implement in TypeScript
  // Return resources
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      segment,
      blogs: [],
      youtube_links: []
    })
  };
};
```

## Future Enhancements

1. **Add more segments** - Expand to cover more learning profiles
2. **Multi-language support** - Search in French for French curriculum
3. **Resource rating** - Allow teachers to rate resources
4. **Favorites** - Save favorite resources
5. **PDF generation** - Export resources as PDF
6. **Email sharing** - Share resources via email

## Support

For issues or questions:
- Check Brave Search API documentation
- Verify API key is valid
- Check rate limits
- Review error logs

## License

This service uses the Brave Search API. Review their terms of service for usage guidelines.
