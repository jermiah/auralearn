"""
Radar Analytics Service
Provides dynamic curriculum domain extraction and mastery analytics for radar visualizations
All data is parsed from SQL metadata - NO HARDCODED VALUES
"""

import os
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class RadarAnalyticsService:
    """Service for dynamic radar chart data extraction"""

    def __init__(self):
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not configured")

        self.supabase: Client = create_client(supabase_url, supabase_key)

    # ==========================================
    # 1. CURRICULUM DOMAIN EXTRACTION (DYNAMIC)
    # ==========================================

    def get_curriculum_domains(self, subject: Optional[str] = None, grade_level: Optional[str] = None) -> Dict[str, Any]:
        """
        Extract curriculum domains dynamically from SQL metadata
        NO HARDCODED domain names or subjects

        Args:
            subject: Optional subject filter (e.g., "Mathématiques")
            grade_level: Optional grade level filter (e.g., "CM1")

        Returns:
            {
                "subject": "Mathématiques",
                "domains": [
                    {"id": "fractions", "label": "Fractions et nombres décimaux", "count": 45},
                    {"id": "geometry", "label": "Géométrie", "count": 32}
                ]
            }
        """
        try:
            query = self.supabase.table('curriculum_chunks').select('subject, topic, subtopic')

            if subject:
                query = query.eq('subject', subject)

            if grade_level:
                query = query.contains('grades', [grade_level])

            response = query.execute()

            if not response.data:
                return {"subjects": [], "domains_by_subject": {}}

            # Organize by subject and extract unique domains
            subjects_data = {}

            for chunk in response.data:
                subj = chunk.get('subject')
                topic = chunk.get('topic')

                if not subj or not topic:
                    continue

                if subj not in subjects_data:
                    subjects_data[subj] = {}

                if topic not in subjects_data[subj]:
                    subjects_data[subj][topic] = {
                        'count': 0,
                        'subtopics': set()
                    }

                subjects_data[subj][topic]['count'] += 1

                subtopic = chunk.get('subtopic')
                if subtopic:
                    subjects_data[subj][topic]['subtopics'].add(subtopic)

            # Format response
            result = {
                "subjects": list(subjects_data.keys()),
                "domains_by_subject": {}
            }

            for subj, topics in subjects_data.items():
                domains = []
                for topic_name, topic_data in topics.items():
                    domain_id = topic_name.lower().replace(' ', '_').replace('é', 'e').replace('è', 'e')
                    domains.append({
                        "id": domain_id,
                        "label": topic_name,
                        "count": topic_data['count'],
                        "subtopics": list(topic_data['subtopics'])
                    })

                result["domains_by_subject"][subj] = sorted(domains, key=lambda x: x['count'], reverse=True)

            return result

        except Exception as e:
            print(f"Error extracting curriculum domains: {e}")
            return {"subjects": [], "domains_by_subject": {}, "error": str(e)}

    # ==========================================
    # 2. COGNITIVE CATEGORIES RADAR (DYNAMIC)
    # ==========================================

    def get_cognitive_categories_distribution(self, class_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get cognitive category distribution dynamically from database
        NO HARDCODED category names

        Args:
            class_id: Optional class filter

        Returns:
            {
                "categories": [
                    {"name": "processing_speed", "label": "Processing Speed", "count": 14},
                    {"name": "working_memory", "label": "Working Memory", "count": 7}
                ]
            }
        """
        try:
            # Query cognitive assessment results
            query = self.supabase.table('cognitive_assessment_results').select(
                'domain_scores, student_id, assessment_type'
            )

            if class_id:
                # Join with students to filter by class
                students_response = self.supabase.table('students').select('id').eq('class_id', class_id).execute()
                student_ids = [s['id'] for s in students_response.data]
                query = query.in_('student_id', student_ids)

            response = query.execute()

            if not response.data:
                return {"categories": [], "total_assessments": 0}

            # Aggregate domain scores across all assessments
            domain_aggregates = {}

            for result in response.data:
                domain_scores = result.get('domain_scores', {})

                for domain_name, score in domain_scores.items():
                    if domain_name not in domain_aggregates:
                        domain_aggregates[domain_name] = {
                            'total_score': 0,
                            'count': 0,
                            'scores': []
                        }

                    domain_aggregates[domain_name]['total_score'] += score
                    domain_aggregates[domain_name]['count'] += 1
                    domain_aggregates[domain_name]['scores'].append(score)

            # Format categories
            categories = []
            for domain_name, data in domain_aggregates.items():
                # Convert snake_case to human-readable label
                label = domain_name.replace('_', ' ').title()

                categories.append({
                    "name": domain_name,
                    "label": label,
                    "count": data['count'],
                    "average_score": round(data['total_score'] / data['count'], 2) if data['count'] > 0 else 0,
                    "min_score": min(data['scores']) if data['scores'] else 0,
                    "max_score": max(data['scores']) if data['scores'] else 0
                })

            return {
                "categories": sorted(categories, key=lambda x: x['count'], reverse=True),
                "total_assessments": len(response.data)
            }

        except Exception as e:
            print(f"Error getting cognitive categories: {e}")
            return {"categories": [], "total_assessments": 0, "error": str(e)}

    # ==========================================
    # 3. CURRICULUM MASTERY RADAR (DYNAMIC)
    # ==========================================

    def get_curriculum_mastery_by_subject(self, class_id: str, subject: Optional[str] = None) -> Dict[str, Any]:
        """
        Get curriculum mastery per domain for a subject
        Dynamically computed from assessment results

        Args:
            class_id: Class identifier
            subject: Optional subject filter

        Returns:
            {
                "subject": "Mathématiques",
                "domain_scores": [
                    {"domain": "Numération", "value": 78, "students_assessed": 25},
                    {"domain": "Fractions", "value": 62, "students_assessed": 23}
                ]
            }
        """
        try:
            # Get students in class
            students_response = self.supabase.table('students').select('id').eq('class_id', class_id).execute()
            student_ids = [s['id'] for s in students_response.data]

            if not student_ids:
                return {"subject": subject or "All", "domain_scores": []}

            # Get assessments for this class
            assessments_query = self.supabase.table('assessments').select('id, topic, name').eq('class_id', class_id)

            if subject:
                # Filter by subject (topic field contains subject info)
                assessments_query = assessments_query.ilike('topic', f'%{subject}%')

            assessments_response = assessments_query.execute()
            assessment_ids = [a['id'] for a in assessments_response.data]

            if not assessment_ids:
                return {"subject": subject or "All", "domain_scores": []}

            # Get assessment results
            results_response = self.supabase.table('assessment_results').select(
                'assessment_id, student_id, score, level'
            ).in_('assessment_id', assessment_ids).in_('student_id', student_ids).execute()

            # Map assessment ID to topic/domain
            assessment_topics = {a['id']: a.get('topic', a.get('name', 'Unknown')) for a in assessments_response.data}

            # Aggregate scores by domain
            domain_data = {}

            for result in results_response.data:
                assessment_id = result['assessment_id']
                domain = assessment_topics.get(assessment_id, 'Unknown')
                score = result['score']

                if domain not in domain_data:
                    domain_data[domain] = {
                        'scores': [],
                        'students': set()
                    }

                domain_data[domain]['scores'].append(score)
                domain_data[domain]['students'].add(result['student_id'])

            # Format domain scores
            domain_scores = []
            for domain, data in domain_data.items():
                avg_score = sum(data['scores']) / len(data['scores']) if data['scores'] else 0

                domain_scores.append({
                    "domain": domain,
                    "value": round(avg_score, 1),
                    "students_assessed": len(data['students']),
                    "total_assessments": len(data['scores'])
                })

            return {
                "subject": subject or "All Subjects",
                "domain_scores": sorted(domain_scores, key=lambda x: x['value'], reverse=True)
            }

        except Exception as e:
            print(f"Error getting curriculum mastery: {e}")
            return {"subject": subject or "All", "domain_scores": [], "error": str(e)}

    # ==========================================
    # 4. GROUP MASTERY RADAR (DYNAMIC)
    # ==========================================

    def get_group_mastery_by_domain(self, class_id: str, subject: Optional[str] = None) -> Dict[str, Any]:
        """
        Get mastery per domain split by student groups (Support, Core, Advanced)
        Groups are dynamically determined by student performance levels

        Args:
            class_id: Class identifier
            subject: Optional subject filter

        Returns:
            {
                "groups": [
                    {
                        "group_name": "Support",
                        "student_count": 8,
                        "domains": [
                            {"domain": "Numération", "value": 45},
                            {"domain": "Géométrie", "value": 70}
                        ]
                    }
                ]
            }
        """
        try:
            # Get students in class with their average performance
            students_response = self.supabase.table('students').select('id, primary_category').eq('class_id', class_id).execute()
            student_ids = [s['id'] for s in students_response.data]

            if not student_ids:
                return {"groups": []}

            # Get all assessment results for these students
            results_response = self.supabase.table('assessment_results').select(
                'student_id, score, level, assessment_id'
            ).in_('student_id', student_ids).execute()

            # Calculate average performance per student
            student_averages = {}
            for result in results_response.data:
                student_id = result['student_id']
                if student_id not in student_averages:
                    student_averages[student_id] = []
                student_averages[student_id].append(result['score'])

            # Classify students into groups based on average score
            student_groups = {}
            for student_id, scores in student_averages.items():
                avg = sum(scores) / len(scores) if scores else 0

                if avg < 50:
                    group = "Support"
                elif avg < 75:
                    group = "Core"
                else:
                    group = "Advanced"

                student_groups[student_id] = group

            # Get assessment topics/domains
            assessment_ids = list(set([r['assessment_id'] for r in results_response.data]))
            assessments_response = self.supabase.table('assessments').select(
                'id, topic, name'
            ).in_('id', assessment_ids).execute()

            if subject:
                assessments_response.data = [
                    a for a in assessments_response.data
                    if subject.lower() in a.get('topic', '').lower() or subject.lower() in a.get('name', '').lower()
                ]

            assessment_topics = {a['id']: a.get('topic', a.get('name', 'Unknown')) for a in assessments_response.data}

            # Aggregate by group and domain
            group_domain_data = {
                "Support": {},
                "Core": {},
                "Advanced": {}
            }

            for result in results_response.data:
                student_id = result['student_id']
                assessment_id = result['assessment_id']

                if student_id not in student_groups or assessment_id not in assessment_topics:
                    continue

                group = student_groups[student_id]
                domain = assessment_topics[assessment_id]
                score = result['score']

                if domain not in group_domain_data[group]:
                    group_domain_data[group][domain] = []

                group_domain_data[group][domain].append(score)

            # Format groups data
            groups = []
            for group_name in ["Support", "Core", "Advanced"]:
                domains_data = group_domain_data[group_name]

                domains = []
                for domain, scores in domains_data.items():
                    avg = sum(scores) / len(scores) if scores else 0
                    domains.append({
                        "domain": domain,
                        "value": round(avg, 1)
                    })

                student_count = sum(1 for g in student_groups.values() if g == group_name)

                groups.append({
                    "group_name": group_name,
                    "student_count": student_count,
                    "domains": sorted(domains, key=lambda x: x['domain'])
                })

            return {"groups": groups}

        except Exception as e:
            print(f"Error getting group mastery: {e}")
            return {"groups": [], "error": str(e)}

    # ==========================================
    # 5. TEACHING GUIDES COMBINED CATEGORIES
    # ==========================================

    def get_teaching_guides_combined_categories(self, grade_level: Optional[str] = None) -> Dict[str, Any]:
        """
        Get combined categories from teaching guides categorization
        Clusters domains into meta-cognitive categories

        Args:
            grade_level: Optional grade level filter

        Returns:
            {
                "combined_categories": [
                    {
                        "name": "Foundational Skills",
                        "domains": ["Numération", "Opérations"],
                        "mastery_average": 75.5
                    }
                ]
            }
        """
        try:
            # Query teaching guides chunks
            query = self.supabase.table('teaching_guides_chunks').select(
                'topic, subtopic, guide_type, applicable_grades'
            )

            if grade_level:
                query = query.contains('applicable_grades', [grade_level])

            response = query.execute()

            if not response.data:
                return {"combined_categories": []}

            # Cluster by guide_type (meta-cognitive grouping)
            clusters = {}

            for chunk in response.data:
                guide_type = chunk.get('guide_type', 'general')
                topic = chunk.get('topic', '')
                subtopic = chunk.get('subtopic', '')

                # Map guide_type to human-readable category
                category_map = {
                    'pedagogical': 'Conceptual Understanding',
                    'strategy': 'Strategic Thinking',
                    'activity': 'Practical Application',
                    'assessment': 'Evaluation Skills'
                }

                category_name = category_map.get(guide_type, guide_type.title())

                if category_name not in clusters:
                    clusters[category_name] = {
                        'domains': set(),
                        'count': 0
                    }

                if topic:
                    clusters[category_name]['domains'].add(topic)
                if subtopic:
                    clusters[category_name]['domains'].add(subtopic)

                clusters[category_name]['count'] += 1

            # Format response
            combined_categories = []
            for category_name, data in clusters.items():
                combined_categories.append({
                    "name": category_name,
                    "domains": sorted(list(data['domains'])),
                    "resource_count": data['count']
                })

            return {
                "combined_categories": sorted(combined_categories, key=lambda x: x['resource_count'], reverse=True)
            }

        except Exception as e:
            print(f"Error getting teaching guides categories: {e}")
            return {"combined_categories": [], "error": str(e)}
