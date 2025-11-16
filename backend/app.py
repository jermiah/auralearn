"""
Flask Backend API for LearnAura
Serves teaching resources via Brave Search API
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from teaching_resources_service import TeachingResourcesService
import os

app = Flask(__name__)

# Enable CORS for frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000", "https://*.netlify.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize service
teaching_service = TeachingResourcesService()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "LearnAura API",
        "version": "1.0.0"
    })


@app.route('/api/teaching-resources/<segment>', methods=['GET'])
def get_teaching_resources(segment):
    """
    Get teaching resources for a specific student segment
    
    Args:
        segment: Student learning segment name
        
    Returns:
        JSON with blogs and youtube_links
    """
    try:
        resources = teaching_service.get_resources_for_segment(segment)
        return jsonify(resources)
    except Exception as e:
        return jsonify({
            "error": str(e),
            "segment": segment,
            "blogs": [],
            "youtube_links": []
        }), 500


@app.route('/api/teaching-resources/segments', methods=['GET'])
def get_segments():
    """Get list of supported student segments"""
    try:
        segments = teaching_service.get_supported_segments()
        return jsonify({"segments": segments})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/teaching-resources/all', methods=['GET'])
def get_all_resources():
    """Get resources for all segments (use with caution - rate limits)"""
    try:
        all_resources = teaching_service.get_all_segments_resources()
        return jsonify(all_resources)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    print("=" * 70)
    print("🚀 LearnAura API Server")
    print("=" * 70)
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print(f"Brave Search API: {'✅ Configured' if os.getenv('BRAVE_SEARCH_API_KEY') else '❌ Not configured'}")
    print("=" * 70)
    print("\nEndpoints:")
    print("  GET  /api/health")
    print("  GET  /api/teaching-resources/<segment>")
    print("  GET  /api/teaching-resources/segments")
    print("  GET  /api/teaching-resources/all")
    print("=" * 70)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
