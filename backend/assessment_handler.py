"""
Backend Assessment Handler for Curriculum-Based Question Generation

This module integrates the curriculum-based assessment pipeline with the existing
assessment system. It handles the generation of curriculum-aligned questions
when a teacher creates an assessment link.

Architecture:
- Supabase Storage (PDFs) → Mistral OCR → structured JSON → curriculum_chunks table
- Metadata filter → Blackbox AI → assessment_questions table
"""

import os
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
import supabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_client = supabase.create_client(
    supabase_url=os.getenv('SUPABASE_URL'),
    supabase_key=os.getenv('SUPABASE_ANON_KEY')
)

class CurriculumAssessmentHandler:
    """Handles curriculum-based assessment generation for the existing system"""

    def __init__(self):
        self.supabase = supabase_client

    def generate_assessment_for_class(self, class_id: str) -> Dict[str, Any]:
        """
        Generate curriculum-aligned assessment questions for a class

        Args:
            class_id: The class ID for which to generate assessment

        Returns:
            Dict containing assessment metadata and link info
        """
        try:
            # Get class information
            class_info = self._get_class_info(class_id)
            if not class_info:
                raise ValueError(f"Class {class_id} not found")

            teacher_id = class_info['teacher_id']
            grade = class_info['grade_level']
            subject = class_info['subject']

            if not grade or not subject:
                raise ValueError(f"Class {class_id} missing grade or subject information")

            # Generate curriculum-aligned questions
            questions = self._generate_curriculum_questions(
                teacher_id=teacher_id,
                grade=grade,
                subject=subject,
                num_questions=10
            )

            # Save questions to assessment_questions table
            saved_questions = self._save_questions_to_database(questions, teacher_id)

            # Return assessment metadata (existing link generation will use this)
            return {
                'class_id': class_id,
                'class_name': class_info['name'],
                'grade': grade,
                'subject': subject,
                'questions_generated': len(saved_questions),
                'assessment_link': f'/student-selection/{class_id}',  # Existing link format
                'generated_at': datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Error generating assessment for class {class_id}: {e}")
            raise

    def _get_class_info(self, class_id: str) -> Optional[Dict[str, Any]]:
        """Get class information from database"""
        try:
            response = self.supabase.table('classes').select('*').eq('id', class_id).single().execute()
            return response.data
        except Exception as e:
            print(f"Error fetching class info: {e}")
            return None

    def _generate_curriculum_questions(self, teacher_id: str, grade: str,
                                     subject: str, num_questions: int = 10) -> List[Dict[str, Any]]:
        """
        Generate curriculum-aligned questions using the pipeline

        Args:
            teacher_id: Teacher identifier
            grade: Grade level
            subject: Subject
            num_questions: Number of questions to generate

        Returns:
            List of question dictionaries
        """
        try:
            # Query curriculum_chunks table with metadata filtering
            curriculum_chunks = self._retrieve_curriculum_chunks(grade, subject)

            if not curriculum_chunks:
                print(f"No curriculum chunks found for grade={grade}, subject={subject}")
                return self._generate_fallback_questions(grade, subject, num_questions)

            # Build LLM context from chunks
            context = self._build_llm_context(curriculum_chunks)

            # Call Blackbox AI to generate questions
            questions = self._call_blackbox_for_questions(context, grade, subject, num_questions)

            return questions

        except Exception as e:
            print(f"Error generating curriculum questions: {e}")
            return self._generate_fallback_questions(grade, subject, num_questions)

    def _retrieve_curriculum_chunks(self, grade: str, subject: str) -> List[Dict[str, Any]]:
        """
        Retrieve relevant curriculum chunks from Supabase using metadata filtering

        Args:
            grade: Grade level
            subject: Subject

        Returns:
            List of curriculum chunks
        """
        try:
            # Query curriculum_chunks table (assuming it exists in Supabase)
            # Note: This table needs to be created with the curriculum data
            query = self.supabase.table('curriculum_chunks').select('*')

            # Apply metadata filters
            query = query.eq('subject', subject)
            query = query.or_(f"grades.cs.{{{grade}}},is_cycle_wide.eq.true")

            # Limit results for context building
            query = query.limit(20)

            response = query.execute()
            chunks = response.data or []

            print(f"Retrieved {len(chunks)} curriculum chunks for {subject} grade {grade}")
            return chunks

        except Exception as e:
            print(f"Error retrieving curriculum chunks: {e}")
            return []

    def _build_llm_context(self, chunks: List[Dict[str, Any]]) -> str:
        """
        Build LLM context from curriculum chunks

        Args:
            chunks: List of curriculum chunks

        Returns:
            Formatted context string
        """
        context_parts = []

        for chunk in chunks[:10]:  # Limit context size
            chunk_text = chunk.get('chunk_text', '')
            topic = chunk.get('topic', '')
            subtopic = chunk.get('subtopic', '')

            context_part = f"Topic: {topic}"
            if subtopic:
                context_part += f" - {subtopic}"
            context_part += f"\nContent: {chunk_text}\n"

            context_parts.append(context_part)

        return "\n".join(context_parts)

    def _call_blackbox_for_questions(self, context: str, grade: str, subject: str,
                                   num_questions: int) -> List[Dict[str, Any]]:
        """
        Call Blackbox AI to generate assessment questions

        Args:
            context: Curriculum context
            grade: Grade level
            subject: Subject
            num_questions: Number of questions

        Returns:
            List of generated questions
        """
        try:
            # Import Blackbox client
            from backend.assessment_pipeline.blackbox_client import call_blackbox_ai

            # Build prompt
            prompt = self._build_question_generation_prompt(context, grade, subject, num_questions)

            # Call Blackbox AI
            messages = [
                {
                    "role": "system",
                    "content": "You are an expert educational assessment designer. Generate curriculum-aligned multiple choice questions in French."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]

            response = call_blackbox_ai(messages)

            # Parse response into question format
            questions = self._parse_blackbox_response(response.content)

            return questions

        except Exception as e:
            print(f"Error calling Blackbox AI: {e}")
            return []

    def _build_question_generation_prompt(self, context: str, grade: str,
                                        subject: str, num_questions: int) -> str:
        """Build the question generation prompt"""
        return f"""
        Based on the following French curriculum content for {grade} grade {subject}:

        {context}

        Generate {num_questions} multiple choice questions in French that assess student understanding of this curriculum content.

        Requirements:
        - Questions must be in French
        - Each question should have 4 options (A, B, C, D)
        - Only one correct answer
        - Questions should test comprehension of the curriculum objectives
        - Difficulty level appropriate for {grade} grade
        - Include explanations for correct answers

        Format each question as:
        Question: [Question text]
        A) [Option A]
        B) [Option B]
        C) [Option C]
        D) [Option D]
        Correct: [Letter]
        Explanation: [Brief explanation]

        Separate questions with ---
        """

    def _parse_blackbox_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse Blackbox AI response into question format"""
        questions = []
        sections = response.split('---')

        for section in sections:
            if not section.strip():
                continue

            try:
                lines = section.strip().split('\n')
                question_data = {}

                for line in lines:
                    line = line.strip()
                    if line.startswith('Question:'):
                        question_data['base_question'] = line.replace('Question:', '').strip()
                    elif line.startswith('A)'):
                        if 'options' not in question_data:
                            question_data['options'] = []
                        question_data['options'].append({
                            'value': 'A',
                            'label': line.replace('A)', '').strip()
                        })
                    elif line.startswith('B)'):
                        question_data['options'].append({
                            'value': 'B',
                            'label': line.replace('B)', '').strip()
                        })
                    elif line.startswith('C)'):
                        question_data['options'].append({
                            'value': 'C',
                            'label': line.replace('C)', '').strip()
                        })
                    elif line.startswith('D)'):
                        question_data['options'].append({
                            'value': 'D',
                            'label': line.replace('D)', '').strip()
                        })
                    elif line.startswith('Correct:'):
                        question_data['correct_answer'] = line.replace('Correct:', '').strip()
                    elif line.startswith('Explanation:'):
                        question_data['explanation'] = line.replace('Explanation:', '').strip()

                # Validate and format question
                if self._validate_question(question_data):
                    formatted_question = self._format_question(question_data)
                    questions.append(formatted_question)

            except Exception as e:
                print(f"Error parsing question section: {e}")
                continue

        return questions

    def _validate_question(self, question_data: Dict[str, Any]) -> bool:
        """Validate question data structure"""
        required_fields = ['base_question', 'options', 'correct_answer', 'explanation']
        return all(field in question_data for field in required_fields) and len(question_data.get('options', [])) == 4

    def _format_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format question for database storage"""
        return {
            'id': str(uuid.uuid4()),
            'category': 'curriculum_assessment',  # Default category
            'difficulty_level': 5,  # Medium difficulty
            'question_type': 'multiple_choice',
            'base_question': question_data['base_question'],
            'options': question_data['options'],
            'correct_answer': question_data['correct_answer'],
            'explanation': question_data['explanation'],
            'tags': ['curriculum', 'generated'],
            'is_active': True,
            'usage_count': 0
        }

    def _generate_fallback_questions(self, grade: str, subject: str, num_questions: int) -> List[Dict[str, Any]]:
        """Generate fallback questions when curriculum generation fails"""
        fallback_questions = []

        for i in range(num_questions):
            question = {
                'id': str(uuid.uuid4()),
                'category': 'general_knowledge',
                'difficulty_level': 3,
                'question_type': 'multiple_choice',
                'base_question': f"Question générale {i+1} sur {subject} en classe de {grade}",
                'options': [
                    {'value': 'A', 'label': 'Réponse A'},
                    {'value': 'B', 'label': 'Réponse B'},
                    {'value': 'C', 'label': 'Réponse C'},
                    {'value': 'D', 'label': 'Réponse D'}
                ],
                'correct_answer': 'A',
                'explanation': 'Question de secours générée automatiquement.',
                'tags': ['fallback'],
                'is_active': True,
                'usage_count': 0
            }
            fallback_questions.append(question)

        return fallback_questions

    def _save_questions_to_database(self, questions: List[Dict[str, Any]], teacher_id: str) -> List[Dict[str, Any]]:
        """Save generated questions to the assessment_questions table"""
        try:
            # Add created_by field
            for question in questions:
                question['created_by'] = teacher_id

            # Insert into Supabase
            response = self.supabase.table('assessment_questions').insert(questions).execute()

            saved_questions = response.data or []
            print(f"Saved {len(saved_questions)} questions to database")

            return saved_questions

        except Exception as e:
            print(f"Error saving questions to database: {e}")
            raise


# Flask route integration
def create_assessment_handler():
    """Create Flask route for assessment generation"""
    from flask import Flask, request, jsonify

    app = Flask(__name__)

    @app.route('/api/assessment/generate-for-class', methods=['POST'])
    def generate_assessment():
        """Generate assessment for a class"""
        try:
            data = request.get_json()
            class_id = data.get('class_id')

            if not class_id:
                return jsonify({'error': 'class_id is required'}), 400

            handler = CurriculumAssessmentHandler()
            result = handler.generate_assessment_for_class(class_id)

            return jsonify(result), 200

        except Exception as e:
            print(f"Error in assessment generation: {e}")
            return jsonify({'error': str(e)}), 500

    return app


# Standalone execution for testing
if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python assessment_handler.py <class_id>")
        sys.exit(1)

    class_id = sys.argv[1]

    handler = CurriculumAssessmentHandler()
    result = handler.generate_assessment_for_class(class_id)

    print("Assessment generated successfully:")
    print(f"Class: {result['class_name']}")
    print(f"Grade: {result['grade']}")
    print(f"Subject: {result['subject']}")
    print(f"Questions: {result['questions_generated']}")
    print(f"Link: {result['assessment_link']}")
