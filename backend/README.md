# LearnAura Backend API

Flask backend API for serving teaching resources via Brave Search API.

## Setup

### 1. Install Dependencies

```bash
# Navigate to project root
cd aura-learn

# Activate virtual environment (if using one)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Add to your `backend/.env` file:

```bash
# Brave Search API
BRAVE_SEARCH_API_KEY=your_brave_search_api_key_here

# Flask Configuration
FLASK_ENV=development
PORT=5000

# Optional: Other API keys
MISTRAL_API_KEY=your_mistral_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

### 3. Run the Server

```bash
# From the backend directory
cd backend
python app.py
```

Or from the project root:

```bash
python backend/app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "LearnAura API",
  "version": "1.0.0"
}
```

### Get Teaching Resources for Segment
```
GET /api/teaching-resources/<segment>
```

**Example:**
```bash
curl http://localhost:5000/api/teaching-resources/Visual%20Learner
```

**Response:**
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

### Get Supported Segments
```
GET /api/teaching-resources/segments
```

**Response:**
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

### Get All Resources (Use with caution - rate limits)
```
GET /api/teaching-resources/all
```

## Testing

### Test with curl

```bash
# Health check
curl http://localhost:5000/api/health

# Get resources for Visual Learner
curl http://localhost:5000/api/teaching-resources/Visual%20Learner

# Get all segments
curl http://localhost:5000/api/teaching-resources/segments
```

### Test with Python

```bash
# Test the service directly
python backend/teaching_resources_service.py "Visual Learner"
```

## Frontend Integration

Update your frontend `.env` file:

```bash
VITE_API_URL=http://localhost:5000
```

The frontend will automatically call the backend API when fetching teaching resources.

## Production Deployment

### Option 1: Deploy with Frontend (Netlify)

Create `netlify/functions/teaching-resources.ts` to proxy requests to your Python backend.

### Option 2: Separate Backend Deployment

Deploy the Flask app to:
- **Heroku**: `heroku create` and push
- **Railway**: Connect GitHub repo
- **Render**: Deploy as web service
- **AWS Lambda**: Use Zappa or Serverless Framework

Update `VITE_API_URL` in frontend to point to your deployed backend.

## Troubleshooting

### Error: "BRAVE_SEARCH_API_KEY not found"
- Make sure you added the key to `backend/.env`
- Restart the Flask server after adding the key

### Error: "ModuleNotFoundError: No module named 'flask_cors'"
```bash
pip install Flask-CORS
```

### Error: "Port 5000 already in use"
Change the port in `.env`:
```bash
PORT=5001
```

### CORS Errors
The backend is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev port)
- `https://*.netlify.app` (Production)

Add more origins in `backend/app.py` if needed.

## Rate Limits

Brave Search API free tier:
- 2,000 queries/month
- ~66 queries/day

Consider implementing caching to reduce API calls.

## Development

### File Structure

```
backend/
├── app.py                          # Flask API server
├── teaching_resources_service.py   # Brave Search service
├── .env                            # Environment variables
├── .env.example                    # Environment template
└── README.md                       # This file
```

### Adding New Endpoints

Edit `backend/app.py`:

```python
@app.route('/api/your-endpoint', methods=['GET'])
def your_endpoint():
    # Your logic here
    return jsonify({"data": "value"})
```

## Support

For issues:
1. Check the console output for errors
2. Verify your Brave Search API key is valid
3. Check rate limits
4. Review the logs

## License

MIT License - See main project LICENSE file
