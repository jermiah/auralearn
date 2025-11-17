"""
Flask Backend API for LearnAura
Serves teaching resources via Brave Search API
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from teaching_resources_service import TeachingResourcesService
from radar_analytics_service import RadarAnalyticsService
import os

app = Flask(__name__)

# Enable CORS for frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000", "http://localhost:8081", "https://*.netlify.app"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize services
teaching_service = TeachingResourcesService()
radar_service = RadarAnalyticsService()


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


# =====================================================
# RADAR ANALYTICS ENDPOINTS
# =====================================================

@app.route('/api/radar/curriculum/domains', methods=['GET'])
def get_curriculum_domains():
    """
    Get all curriculum domains dynamically from SQL
    Query params: subject (optional), grade_level (optional)
    """
    try:
        subject = request.args.get('subject')
        grade_level = request.args.get('grade_level')
        domains = radar_service.get_curriculum_domains(subject, grade_level)
        return jsonify(domains)
    except Exception as e:
        return jsonify({"error": str(e), "subjects": [], "domains_by_subject": {}}), 500


@app.route('/api/radar/cognitive/categories', methods=['GET'])
def get_cognitive_categories():
    """
    Get cognitive category distribution for radar chart
    Query params: class_id (optional)
    """
    try:
        class_id = request.args.get('class_id')
        categories = radar_service.get_cognitive_categories_distribution(class_id)
        return jsonify(categories)
    except Exception as e:
        return jsonify({"error": str(e), "categories": []}), 500


@app.route('/api/radar/mastery/<class_id>', methods=['GET'])
def get_curriculum_mastery(class_id):
    """
    Get curriculum mastery by domain for a class
    Query params: subject (optional)
    """
    try:
        subject = request.args.get('subject')
        mastery = radar_service.get_curriculum_mastery_by_subject(class_id, subject)
        return jsonify(mastery)
    except Exception as e:
        return jsonify({"error": str(e), "subject": subject or "All", "domain_scores": []}), 500


@app.route('/api/radar/groups/<class_id>', methods=['GET'])
def get_group_mastery(class_id):
    """
    Get group mastery (Support/Core/Advanced) by domain
    Query params: subject (optional)
    """
    try:
        subject = request.args.get('subject')
        groups = radar_service.get_group_mastery_by_domain(class_id, subject)
        return jsonify(groups)
    except Exception as e:
        return jsonify({"error": str(e), "groups": []}), 500


@app.route('/api/radar/teaching-guides/categories', methods=['GET'])
def get_teaching_guides_categories():
    """
    Get teaching guides combined categories (meta-cognitive clusters)
    Query params: grade_level (optional)
    """
    try:
        grade_level = request.args.get('grade_level')
        categories = radar_service.get_teaching_guides_combined_categories(grade_level)
        return jsonify(categories)
    except Exception as e:
        return jsonify({"error": str(e), "combined_categories": []}), 500


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
    print("LearnAura API Server")
    print("=" * 70)
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print(f"Brave Search API: {'Configured' if os.getenv('BRAVE_SEARCH_API_KEY') else 'Not configured'}")
    print("=" * 70)
    print("\nEndpoints:")
    print("  GET  /api/health")
    print("  GET  /api/teaching-resources/<segment>")
    print("  GET  /api/teaching-resources/segments")
    print("  GET  /api/teaching-resources/all")
    print("\nRadar Analytics:")
    print("  GET  /api/radar/curriculum/domains")
    print("  GET  /api/radar/cognitive/categories")
    print("  GET  /api/radar/mastery/<class_id>")
    print("  GET  /api/radar/groups/<class_id>")
    print("  GET  /api/radar/teaching-guides/categories")
    print("=" * 70)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
