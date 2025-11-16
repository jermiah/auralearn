"""
External Teaching Resources Service
Retrieves teaching strategies and resources for different student learning segments using Brave Search API
"""

import os
import requests
from typing import Dict, List, Optional
from dotenv import load_dotenv

load_dotenv()


class TeachingResourcesService:
    """Service to retrieve external teaching resources for student segments"""

    def __init__(self):
        self.api_key = os.getenv('BRAVE_SEARCH_API_KEY')
        self.base_url = "https://api.search.brave.com/res/v1/web/search"
        
        # Segment to search query mapping
        self.segment_queries = {
            "Slow Processing": "teaching strategies for slow processing students elementary school",
            "Fast Processor": "teaching strategies for fast learner students gifted education",
            "High Energy / Needs Movement": "kinesthetic learning strategies active students classroom",
            "Visual Learner": "visual learning strategies teaching techniques elementary",
            "Logical Learner": "logical mathematical learning strategies teaching methods",
            "Sensitive / Low Confidence": "teaching strategies for sensitive students building confidence",
            "Easily Distracted": "teaching strategies for distracted students focus attention",
            "Needs Repetition": "teaching strategies repetition reinforcement learning techniques"
        }

    def get_resources_for_segment(self, segment: str) -> Dict[str, any]:
        """
        Retrieve teaching resources for a specific student segment

        Args:
            segment: Student learning segment name

        Returns:
            Dictionary with blogs and YouTube links
        """
        if segment not in self.segment_queries:
            return {
                "segment": segment,
                "error": f"Unknown segment: {segment}",
                "blogs": [],
                "youtube_links": []
            }

        query = self.segment_queries[segment]
        
        # Get general web results (blogs/articles)
        blogs = self._search_blogs(query)
        
        # Get YouTube videos
        youtube_links = self._search_youtube(query)

        return {
            "segment": segment,
            "blogs": blogs[:3],  # Top 3 blogs
            "youtube_links": youtube_links[:3]  # Top 3 videos
        }

    def _search_blogs(self, query: str) -> List[str]:
        """
        Search for blog articles and educational resources

        Args:
            query: Search query

        Returns:
            List of blog/article URLs
        """
        try:
            headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": self.api_key
            }

            params = {
                "q": query,
                "count": 10,  # Get more to filter
                "search_lang": "en",
                "result_filter": "web"
            }

            response = requests.get(self.base_url, headers=headers, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            
            # Extract URLs from web results
            blogs = []
            if "web" in data and "results" in data["web"]:
                for result in data["web"]["results"]:
                    url = result.get("url", "")
                    # Filter for educational/blog content
                    if url and self._is_educational_url(url):
                        blogs.append(url)
                        if len(blogs) >= 3:
                            break

            return blogs

        except Exception as e:
            print(f"Error searching blogs: {e}")
            return []

    def _search_youtube(self, query: str) -> List[str]:
        """
        Search for YouTube videos

        Args:
            query: Search query

        Returns:
            List of YouTube video URLs
        """
        try:
            headers = {
                "Accept": "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": self.api_key
            }

            # Add "youtube" to query for better video results
            youtube_query = f"{query} site:youtube.com"

            params = {
                "q": youtube_query,
                "count": 10,
                "search_lang": "en"
            }

            response = requests.get(self.base_url, headers=headers, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            
            # Extract YouTube URLs
            youtube_links = []
            if "web" in data and "results" in data["web"]:
                for result in data["web"]["results"]:
                    url = result.get("url", "")
                    if "youtube.com/watch" in url or "youtu.be/" in url:
                        youtube_links.append(url)
                        if len(youtube_links) >= 3:
                            break

            return youtube_links

        except Exception as e:
            print(f"Error searching YouTube: {e}")
            return []

    def _is_educational_url(self, url: str) -> bool:
        """
        Check if URL is likely educational content

        Args:
            url: URL to check

        Returns:
            True if educational, False otherwise
        """
        educational_domains = [
            "edutopia.org",
            "teachthought.com",
            "understood.org",
            "scholastic.com",
            "education.com",
            "readingrockets.org",
            "learningdisabilities.org",
            "weareteachers.com",
            "teachhub.com",
            "responsiveclassroom.org",
            "blog",
            "article",
            "resource",
            "guide",
            "strategy",
            "teaching"
        ]

        url_lower = url.lower()
        return any(domain in url_lower for domain in educational_domains)

    def get_all_segments_resources(self) -> Dict[str, Dict]:
        """
        Retrieve resources for all supported segments

        Returns:
            Dictionary mapping segments to their resources
        """
        results = {}
        for segment in self.segment_queries.keys():
            print(f"Fetching resources for: {segment}")
            results[segment] = self.get_resources_for_segment(segment)

        return results

    def get_supported_segments(self) -> List[str]:
        """
        Get list of supported student segments

        Returns:
            List of segment names
        """
        return list(self.segment_queries.keys())


# Flask/FastAPI endpoint example
def create_teaching_resources_endpoint():
    """
    Example endpoint implementation for Flask/FastAPI
    """
    from flask import Flask, jsonify, request
    
    app = Flask(__name__)
    service = TeachingResourcesService()

    @app.route('/api/teaching-resources/<segment>', methods=['GET'])
    def get_resources(segment):
        """Get teaching resources for a specific segment"""
        resources = service.get_resources_for_segment(segment)
        return jsonify(resources)

    @app.route('/api/teaching-resources/segments', methods=['GET'])
    def get_segments():
        """Get list of supported segments"""
        segments = service.get_supported_segments()
        return jsonify({"segments": segments})

    @app.route('/api/teaching-resources/all', methods=['GET'])
    def get_all_resources():
        """Get resources for all segments"""
        resources = service.get_all_segments_resources()
        return jsonify(resources)

    return app


# CLI usage example
if __name__ == "__main__":
    import sys
    import json

    service = TeachingResourcesService()

    if len(sys.argv) > 1:
        segment = sys.argv[1]
        print(f"\nFetching resources for: {segment}\n")
        resources = service.get_resources_for_segment(segment)
        print(json.dumps(resources, indent=2))
    else:
        print("Supported segments:")
        for segment in service.get_supported_segments():
            print(f"  - {segment}")
        
        print("\nUsage: python teaching_resources_service.py '<segment_name>'")
        print("Example: python teaching_resources_service.py 'Visual Learner'")
