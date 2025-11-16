# AuraLearn - Comprehensive Application Roadmap & Integration Guide

## Executive Summary

AuraLearn is an adaptive learning platform designed to help teachers and parents understand students' individual learning styles and provide personalized teaching strategies. This document outlines the complete application flow, integration strategy for French CM1/CM2 curriculum, and a roadmap for building a student-centered assessment system.

---

## Table of Contents

1. [Application Vision & Core Philosophy](#1-application-vision--core-philosophy)
2. [Current Application Architecture](#2-current-application-architecture)
3. [User Flows & Logic](#3-user-flows--logic)
4. [French CM1/CM2 Curriculum Integration Strategy](#4-french-cm1cm2-curriculum-integration-strategy)
5. [Student Understanding Framework](#5-student-understanding-framework)
6. [Assessment & Evaluation System](#6-assessment--evaluation-system)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Technical Architecture](#8-technical-architecture)
9. [Data Models & Relationships](#9-data-models--relationships)
10. [Future Enhancements](#10-future-enhancements)

---

## 1. Application Vision & Core Philosophy

### 1.1 Mission Statement

**"Understand every student's unique learning style to empower teachers and parents with actionable insights for personalized education."**

### 1.2 Core Principles

1. **Student-Centered:** Every feature focuses on understanding the individual student
2. **Evidence-Based:** Decisions driven by assessment data and learning science
3. **Actionable Insights:** Provide specific, implementable teaching strategies
4. **Curriculum-Aligned:** Integrate with French national curriculum (CM1/CM2)
5. **Accessible:** Simple for students, powerful for educators
6. **Privacy-First:** Secure student data with appropriate access controls

### 1.3 Key Stakeholders

| Stakeholder | Primary Need | How AuraLearn Helps |
|-------------|--------------|---------------------|
| **Students** | Learn effectively in their own style | Adaptive assessments identify learning preferences |
| **Teachers** | Understand each student's needs | Detailed profiles with teaching strategies |
| **Parents** | Support child's learning at home | Insights and guidance for home practice |
| **Administrators** | Track class/school performance | Aggregate analytics and trends |

---

## 2. Current Application Architecture

### 2.1 Technology Stack

```
Frontend:
├── React 18 with TypeScript
├── Vite (Build tool)
├── TailwindCSS (Styling)
├── Shadcn/ui (Component library)
├── React Router (Navigation)
├── i18next (Internationalization - EN/FR)
└── Clerk (Authentication - Teachers/Parents)

Backend:
├── Supabase (PostgreSQL database)
├── Supabase Auth (User management)
├── Row Level Security (Data protection)
└── Database Triggers (Automation)

AI/Intelligence:
├── BLACKBOX AI (Code assistance)
├── OpenAI/Claude (Planned - Question generation)
└── Custom algorithms (Category determination)
```

### 2.2 Current Features (Implemented)

✅ **Authentication System**
- Teacher sign-up/sign-in with Clerk
- Parent sign-up/sign-in with Clerk
- Role-based access control
- No authentication required for student assessments

✅ **Class Management**
- Create classes with grade level and subject
- Add students manually or via CSV upload
- View all students in a class
- Track student count per class

✅ **Student Assessment System**
- Public assessment portal (no login)
- 10-question adaptive assessment
- Multiple choice questions
- Real-time scoring
- Category determination (9 learning styles)
- Confidence score calculation
- Time tracking per question and total

✅ **Teacher Dashboard**
- Overview of all students across classes
- Performance level visualization (5 levels)
- Color-coded heatmap
- Improvement trend indicators
- Reassessment reminders
- Quick access to student profiles

✅ **Individual Student Profiles**
- Complete student information
- Assessment history timeline
- Learning category with confidence
- Recommended teaching strategies (5+ per category)
- Teacher notes system (5 note types)
- Parent contact information

✅ **Internationalization**
- English and French language support
- User preference storage
- Complete UI translation

✅ **Database Infrastructure**
- 20 sample assessment questions
- Automatic 30-day reassessment tracking
- Progress tracking functions
- Row-level security policies

---

## 3. User Flows & Logic

### 3.1 Teacher Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    TEACHER JOURNEY                          │
└─────────────────────────────────────────────────────────────┘

1. ONBOARDING
   ┌──────────────┐
   │ Sign Up      │
   │ (Clerk Auth) │──────► Select Role: Teacher
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Create       │
   │ First Class  │──────► Enter: Name, Grade, Subject
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Add Students │──────► Manual entry OR CSV upload
   └──────────────┘

2. ASSESSMENT DISTRIBUTION
   ┌──────────────┐
   │ Navigate to  │
   │ Assessment   │──────► /assessment
   │ Page         │
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Copy Link    │──────► Share with students
   │ for Class    │        (Email, QR code, etc.)
   └──────────────┘

3. MONITORING & INSIGHTS
   ┌──────────────┐
   │ Dashboard    │──────► View all students
   │              │        - Performance levels
   │              │        - Improvement trends
   │              │        - Reassessment alerts
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Click        │──────► Individual student profile
   │ Student      │        - Assessment history
   │              │        - Teaching strategies
   │              │        - Add notes
   └──────────────┘

4. ONGOING MANAGEMENT
   ┌──────────────┐
   │ Review       │──────► Check reassessment reminders
   │ Progress     │        Track improvement over time
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Adjust       │──────► Implement recommended strategies
   │ Teaching     │        Document observations
   └──────────────┘
```

### 3.2 Student Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT JOURNEY                          │
└─────────────────────────────────────────────────────────────┘

1. ACCESS ASSESSMENT
   ┌──────────────┐
   │ Receive Link │
   │ from Teacher │──────► Click link (no login required)
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Student      │
   │ Selection    │──────► /student-selection/:classId
   │ Page         │
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Select Name  │──────► Click on own name card
   │ from List    │
   └──────────────┘

2. TAKE ASSESSMENT
   ┌──────────────┐
   │ Read         │
   │ Instructions │──────► Understand guidelines
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Start        │──────► Begin timer
   │ Assessment   │
   └──────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ Answer Questions (10 total)          │
   │                                      │
   │ For each question:                   │
   │ 1. Read question carefully           │
   │ 2. Select answer (radio button)      │
   │ 3. Click "Next Question"             │
   │ 4. System records:                   │
   │    - Selected answer                 │
   │    - Time taken                      │
   │    - Correctness                     │
   └──────────────────────────────────────┘
          │
          ▼
   ┌──────────────┐
   │ Submit       │──────► After question 10
   │ Assessment   │
   └──────────────┘

3. VIEW RESULTS
   ┌──────────────────────────────────────┐
   │ Results Screen Shows:                │
   │ - Score (X/10)                       │
   │ - Percentage                         │
   │ - Time taken                         │
   │ - Learning profile category          │
   │ - Confidence level                   │
   │ - Encouragement message              │
   └──────────────────────────────────────┘
          │
          ▼
   ┌──────────────┐
   │ Return to    │
   │ Selection    │──────► Can take again in 30 days
   └──────────────┘
```

### 3.3 Parent Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    PARENT JOURNEY                           │
└─────────────────────────────────────────────────────────────┘

1. ONBOARDING
   ┌──────────────┐
   │ Sign Up      │
   │ (Clerk Auth) │──────► Select Role: Parent
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Link         │──────► Enter child's information
   │ Children     │        (Name, class, etc.)
   └──────────────┘

2. MONITORING (Planned)
   ┌──────────────┐
   │ Parent       │──────► View child's progress
   │ Dashboard    │        - Latest assessment
   │              │        - Learning category
   │              │        - Improvement trends
   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Parent       │──────► Strategies for home
   │ Guide        │        - How to support learning
   │              │        - Activities to try
   └──────────────┘
```

---

## 4. French CM1/CM2 Curriculum Integration Strategy

### 4.1 Understanding CM1/CM2 (Cours Moyen)

**CM1 (Cours Moyen 1ère année):**
- Age: 9-10 years old
- Grade equivalent: 4th grade (US), Year 5 (UK)
- Focus: Consolidating fundamental skills

**CM2 (Cours Moyen 2ème année):**
- Age: 10-11 years old
- Grade equivalent: 5th grade (US), Year 6 (UK)
- Focus: Preparing for secondary education (Collège)

### 4.2 French National Curriculum Structure

```
┌─────────────────────────────────────────────────────────────┐
│         FRENCH NATIONAL CURRICULUM (Cycle 3)                │
└─────────────────────────────────────────────────────────────┘

1. FRANÇAIS (French Language)
   ├── Lecture et compréhension (Reading & Comprehension)
   ├── Écriture (Writing)
   ├── Grammaire (Grammar)
   ├── Orthographe (Spelling)
   ├── Vocabulaire (Vocabulary)
   └── Expression orale (Oral Expression)

2. MATHÉMATIQUES (Mathematics)
   ├── Nombres et calculs (Numbers & Calculations)
   │   ├── Nombres entiers (Whole numbers)
   │   ├── Nombres décimaux (Decimals)
   │   ├── Fractions (Fractions)
   │   └── Calcul mental (Mental math)
   ├── Grandeurs et mesures (Measurements)
   │   ├── Longueurs (Lengths)
   │   ├── Masses (Weights)
   │   ├── Durées (Time)
   │   └── Aires et périmètres (Areas & Perimeters)
   ├── Espace et géométrie (Space & Geometry)
   │   ├── Figures planes (2D shapes)
   │   ├── Solides (3D shapes)
   │   └── Symétrie (Symmetry)
   └── Résolution de problèmes (Problem Solving)

3. SCIENCES ET TECHNOLOGIE (Science & Technology)
   ├── Matière, mouvement, énergie (Matter, Motion, Energy)
   ├── Le vivant (Living Things)
   ├── Matériaux et objets techniques (Materials & Technology)
   └── La planète Terre (Planet Earth)

4. HISTOIRE-GÉOGRAPHIE (History-Geography)
   ├── Histoire de France (French History)
   ├── Géographie de la France (French Geography)
   └── Éducation civique (Civic Education)

5. LANGUES VIVANTES (Foreign Languages)
   └── Anglais (English) - Primary focus

6. ARTS (Arts)
   ├── Arts plastiques (Visual Arts)
   └── Éducation musicale (Music)

7. ÉDUCATION PHYSIQUE ET SPORTIVE (Physical Education)
```

### 4.3 Curriculum Mapping to Assessment System

#### Current Gap Analysis

| Curriculum Area | Current Coverage | Gap | Priority |
|----------------|------------------|-----|----------|
| **Mathématiques** | ✅ 50% (10/20 questions) | Need more variety | HIGH |
| **Français** | ⚠️ 20% (4/20 questions) | Critical gap | HIGH |
| **Sciences** | ⚠️ 15% (3/20 questions) | Need expansion | MEDIUM |
| **Histoire-Géo** | ❌ 0% | Not covered | MEDIUM |
| **Langues** | ❌ 0% | Not covered | LOW |
| **Arts** | ❌ 0% | Not applicable | LOW |

#### Proposed Question Distribution (Per Subject)

```
TARGET: 200 Questions Total (20 per difficulty level, 1-10)

MATHÉMATIQUES (80 questions - 40%)
├── Nombres et calculs: 30 questions
│   ├── CM1 Level: Difficulty 3-6
│   └── CM2 Level: Difficulty 5-8
├── Grandeurs et mesures: 20 questions
│   ├── CM1 Level: Difficulty 3-6
│   └── CM2 Level: Difficulty 5-8
├── Géométrie: 20 questions
│   ├── CM1 Level: Difficulty 4-7
│   └── CM2 Level: Difficulty 6-9
└── Problèmes: 10 questions
    ├── CM1 Level: Difficulty 5-7
    └── CM2 Level: Difficulty 7-10

FRANÇAIS (80 questions - 40%)
├── Lecture/Compréhension: 25 questions
│   ├── CM1 Level: Difficulty 3-6
│   └── CM2 Level: Difficulty 5-8
├── Grammaire: 20 questions
│   ├── CM1 Level: Difficulty 4-7
│   └── CM2 Level: Difficulty 6-9
├── Orthographe: 15 questions
│   ├── CM1 Level: Difficulty 3-6
│   └── CM2 Level: Difficulty 5-8
├── Vocabulaire: 15 questions
│   ├── CM1 Level: Difficulty 3-6
│   └── CM2 Level: Difficulty 5-8
└── Conjugaison: 5 questions
    ├── CM1 Level: Difficulty 4-7
    └── CM2 Level: Difficulty 6-9

SCIENCES (30 questions - 15%)
├── Le vivant: 10 questions
│   ├── CM1 Level: Difficulty 3-6
│   └── CM2 Level: Difficulty 5-8
├── Matière et énergie: 10 questions
│   ├── CM1 Level: Difficulty 4-7
│   └── CM2 Level: Difficulty 6-9
└── Planète Terre: 10 questions
    ├── CM1 Level: Difficulty 4-7
    └── CM2 Level: Difficulty 6-9

HISTOIRE-GÉOGRAPHIE (10 questions - 5%)
├── Histoire: 5 questions
│   ├── CM1 Level: Difficulty 4-6
│   └── CM2 Level: Difficulty 6-8
└── Géographie: 5 questions
    ├── CM1 Level: Difficulty 4-6
    └── CM2 Level: Difficulty 6-8
```

### 4.4 Curriculum-Aligned Database Schema Enhancement

**Proposed Schema Updates:**

```sql
-- Add curriculum fields to classes table
ALTER TABLE classes ADD COLUMN curriculum_level TEXT CHECK (curriculum_level IN ('CM1', 'CM2'));
ALTER TABLE classes ADD COLUMN primary_subject TEXT;
ALTER TABLE classes ADD COLUMN secondary_subjects TEXT[];

-- Add curriculum metadata to questions
ALTER TABLE assessment_questions ADD COLUMN curriculum_level TEXT[];
ALTER TABLE assessment_questions ADD COLUMN curriculum_domain TEXT; -- Mathématiques, Français, etc.
ALTER TABLE assessment_questions ADD COLUMN curriculum_subdomain TEXT; -- Nombres et calculs, etc.
ALTER TABLE assessment_questions ADD COLUMN learning_objectives TEXT[]; -- Specific competencies

-- Example question with curriculum alignment
INSERT INTO assessment_questions (
  category,
  difficulty_level,
  question_type,
  base_question,
  options,
  correct_answer,
  explanation,
  tags,
  curriculum_level,
  curriculum_domain,
  curriculum_subdomain,
  learning_objectives
) VALUES (
  'logical_learner',
  5,
  'multiple_choice',
  'Quelle est la valeur de 3/4 + 1/4?',
  '[
    {"value": "1/2", "label": "1/2"},
    {"value": "4/8", "label": "4/8"},
    {"value": "1", "label": "1"},
    {"value": "4/4", "label": "4/4"}
  ]'::jsonb,
  '1',
  'Addition de fractions avec même dénominateur: 3/4 + 1/4 = 4/4 = 1',
  ARRAY['mathématiques', 'fractions', 'addition'],
  ARRAY['CM1', 'CM2'],
  'Mathématiques',
  'Nombres et calculs - Fractions',
  ARRAY[
    'Additionner des fractions de même dénominateur',
    'Simplifier une fraction',
    'Reconnaître une fraction égale à 1'
  ]
);
```

### 4.5 Adaptive Question Selection with Curriculum

**Enhanced Selection Algorithm:**

```typescript
interface CurriculumFilter {
  level: 'CM1' | 'CM2';
  primarySubject: string;
  secondarySubjects?: string[];
  gradeLevel: string;
}

const selectCurriculumAlignedQuestions = async (
  classId: string,
  studentId: string,
  currentDifficulty: number = 5
): Promise<Question[]> => {
  
  // 1. Get class curriculum settings
  const { data: classData } = await supabase
    .from('classes')
    .select('curriculum_level, primary_subject, secondary_subjects, grade_level')
    .eq('id', classId)
    .single();
  
  // 2. Get student's previous assessments to determine starting difficulty
  const { data: previousAssessments } = await supabase
    .from('student_assessments')
    .select('score, total_questions, category_determined')
    .eq('student_id', studentId)
    .order('assessment_date', { ascending: false })
    .limit(1);
  
  // Adjust starting difficulty based on previous performance
  if (previousAssessments && previousAssessments.length > 0) {
    const lastScore = previousAssessments[0].score;
    const lastTotal = previousAssessments[0].total_questions;
    const percentage = (lastScore / lastTotal) * 100;
    
    if (percentage >= 80) currentDifficulty = Math.min(currentDifficulty + 2, 10);
    else if (percentage <= 40) currentDifficulty = Math.max(currentDifficulty - 2, 1);
  }
  
  // 3. Build question query with curriculum filters
  let query = supabase
    .from('assessment_questions')
    .select('*')
    .eq('is_active', true)
    .contains('curriculum_level', [classData.curriculum_level]);
  
  // 4. Subject distribution (70% primary, 30% secondary)
  const primaryQuestionCount = 7;
  const secondaryQuestionCount = 3;
  
  // Get primary subject questions
  const { data: primaryQuestions } = await query
    .eq('curriculum_domain', classData.primary_subject)
    .gte('difficulty_level', currentDifficulty - 1)
    .lte('difficulty_level', currentDifficulty + 1)
    .limit(primaryQuestionCount * 2); // Get extra for randomization
  
  // Get secondary subject questions
  const { data: secondaryQuestions } = await query
    .in('curriculum_domain', classData.secondary_subjects || [])
    .gte('difficulty_level', currentDifficulty - 1)
    .lte('difficulty_level', currentDifficulty + 1)
    .limit(secondaryQuestionCount * 2);
  
  // 5. Randomly select and combine
  const selectedPrimary = shuffleArray(primaryQuestions || []).slice(0, primaryQuestionCount);
  const selectedSecondary = shuffleArray(secondaryQuestions || []).slice(0, secondaryQuestionCount);
  
  return [...selectedPrimary, ...selectedSecondary];
};
```

---

## 5. Student Understanding Framework

### 5.1 The 9 Learning Categories

AuraLearn identifies students into 9 distinct learning categories based on assessment performance and behavior patterns:

```
┌─────────────────────────────────────────────────────────────┐
│              LEARNING CATEGORY FRAMEWORK                    │
└─────────────────────────────────────────────────────────────┘

1. FAST PROCESSOR (Processeur Rapide)
   Score Range: 80-100%
   Characteristics:
   - Quick comprehension
   - Advanced thinking skills
   - Needs challenging material
   - May become bored easily
   
   Teaching Strategies:
   ✓ Provide advanced materials
   ✓ Offer leadership opportunities
   ✓ Encourage independent projects
   ✓ Use acceleration techniques
   ✓ Introduce complex problem-solving

2. LOGICAL LEARNER (Apprenant Logique)
   Score Range: 70-90%
   Characteristics:
   - Strong pattern recognition
   - Structured thinking
   - Analytical approach
   - Prefers step-by-step methods
   
   Teaching Strategies:
   ✓ Present information systematically
   ✓ Use logic puzzles and games
   ✓ Provide clear frameworks
   ✓ Connect to real-world applications
   ✓ Encourage problem-solving strategies

3. VISUAL LEARNER (Apprenant Visuel)
   Score Range: 50-80%
   Characteristics:
   - Learns best with images
   - Strong spatial awareness
   - Remembers what they see
   - Benefits from diagrams
   
   Teaching Strategies:
   ✓ Use diagrams and charts
   ✓ Incorporate videos and images
   ✓ Color-code information
   ✓ Create mind maps
   ✓ Use visual organizers

4. HIGH ENERGY (Haute Énergie)
   Score Range: 40-70%
   Characteristics:
   - Active and kinesthetic
   - Needs movement
   - Hands-on learner
   - Difficulty sitting still
   
   Teaching Strategies:
   ✓ Incorporate movement breaks
   ✓ Use hands-on activities
   ✓ Allow flexible seating
   ✓ Provide fidget tools
   ✓ Use active learning games

5. SENSITIVE/LOW CONFIDENCE (Sensible/Peu Confiant)
   Score Range: 30-60%
   Characteristics:
   - Needs encouragement
   - Fear of failure
   - Requires emotional support
   - Benefits from small wins
   
   Teaching Strategies:
   ✓ Provide positive reinforcement
   ✓ Set achievable goals
   ✓ Create safe environment
   ✓ Celebrate small successes
   ✓ Build confidence gradually

6. EASILY DISTRACTED (Facilement Distrait)
   Score Range: 20-50%
   Characteristics:
   - Short attention span
   - Difficulty focusing
   - Needs structured environment
   - Benefits from routines
   
   Teaching Strategies:
   ✓ Minimize distractions
   ✓ Use timers and schedules
   ✓ Break tasks into chunks
   ✓ Provide clear instructions
   ✓ Use attention-grabbing techniques

7. NEEDS REPETITION (Besoin de Répétition)
   Score Range: 30-60%
   Characteristics:
   - Requires multiple exposures
   - Benefits from practice
   - Slow but steady progress
   - Needs reinforcement
   
   Teaching Strategies:
   ✓ Use spaced repetition
   ✓ Provide multiple examples
   ✓ Review regularly
   ✓ Use different modalities
   ✓ Practice, practice, practice

8. SLOW PROCESSING (Traitement Lent)
   Score Range: 0-40%
   Characteristics:
   - Needs extra time
   - Careful and methodical
   - May have processing delays
   - Benefits from patience
   
   Teaching Strategies:
   ✓ Allow extended time
   ✓ Break down complex tasks
   ✓ Use step-by-step instructions
   ✓ Provide visual supports
   ✓ Check understanding frequently

9. AVERAGE LEARNER (Apprenant Moyen)
   Score Range: 40-70%
   Characteristics:
   - Balanced learning style
   - Responds to varied methods
   - Steady progress
   - Adaptable
   
   Teaching Strategies:
   ✓ Use mixed teaching methods
   ✓ Provide variety
   ✓ Balance challenge and support
   ✓ Encourage exploration
   ✓ Maintain engagement
```

### 5.2 Multi-Dimensional Student Profile

Beyond just the learning category, AuraLearn builds a comprehensive student profile:

```
┌─────────────────────────────────────────────────────────────┐
│           COMPREHENSIVE STUDENT PROFILE                     │
└─────────────────────────────────────────────────────────────┘

1. COGNITIVE PROFILE
   ├── Primary Learning Category
   ├── Confidence Score (0.5-1.0)
   ├── Performance Level (1-5)
   ├── Processing Speed (avg time per question)
   └── Consistency Score (variance in performance)

2. ACADEMIC PERFORMANCE
   ├── Overall Score Trend
   ├── Subject-Specific Strengths
   ├── Subject-Specific Weaknesses
   ├── Improvement Rate
   └── Curriculum Mastery Level

3. BEHAVIORAL PATTERNS
   ├── Response Time Patterns
   │   ├── Too fast (< 10 sec) → Possible guessing
   │   ├── Optimal (10-60 sec) → Thoughtful
   │   └── Too slow (> 60 sec) → Struggling
   ├── Answer Patterns
   │   ├── Consistent errors → Misconception
   │   ├── Random errors → Attention issues
   │   └── Progressive improvement → Learning
   └── Engagement Indicators
       ├── Assessment completion rate
       ├── Time of day patterns
       └── Reassessment participation

4. PROGRESS TRACKING
   ├── Assessment History (all attempts)
   ├── Category Evolution (changes over time)
   ├── Score Trajectory (improving/declining/stable)
   ├── Confidence Evolution
   └── Mastery Milestones

5. CONTEXTUAL FACTORS
   ├── Grade Level (CM1/CM2)
   ├── Class Context
   ├── Teacher Observations (notes)
   ├── Parent Feedback (planned)
   └── Special Needs (if any)
```

### 5.3 Confidence Score Calculation

The confidence score indicates how certain we are about the student's category assignment:

```typescript
/**
 * Confidence Score Algorithm
 * 
 * Base confidence determined by score percentage:
 * - 80%+ (Fast Processor): 0.85 base
 * - 70-79% (Logical): 0.75 base
 * - 50-69% (Visual): 0.65 base
 * - 40-49% (High Energy): 0.60 base
 * - 30-39% (Needs Repetition): 0.70 base
 * - <30% (Slow Processing): 0.75 base
 * 
 * Adjustments:
 * - Very fast answers (< 10 sec avg): -0.10 (possible guessing)
 * - Very slow answers (> 60 sec avg): -0.05 (uncertainty)
 * - Multiple assessments: +0.05 per assessment (max +0.15)
 * - Consistent category across assessments: +0.10
 * 
 * Final range: 0.50 - 1.00
 */

const calculateConfidenceScore = (
  scorePercentage: number,
  avgTimePerQuestion: number,
  assessmentHistory: Assessment[]
): number => {
  // Base confidence from score
  let confidence = getBaseConfidence(scorePercentage);
  
  // Time-based adjustments
  if (avgTimePerQuestion < 10) confidence -= 0.10;
  else if (avgTimePerQuestion > 60) confidence -= 0.05;
  
  // History-based adjustments
  if (assessmentHistory.length > 1) {
    confidence += Math.min(0.15, (assessmentHistory.length - 1) * 0.05);
    
    // Check category consistency
    const categories = assessmentHistory.map(a => a.category_determined);
    const mostCommon = getMostCommonCategory(categories);
    const consistency = categories.filter(c => c === mostCommon).length / categories.length;
    
    if (consistency >= 0.75) confidence += 0.10;
  }
  
  // Ensure bounds
  return Math.max(0.50, Math.min(1.00, confidence));
};
```

### 5.4 Actionable Insights Generation

For each student profile, AuraLearn generates specific, actionable recommendations:

```
┌─────────────────────────────────────────────────────────────┐
│              INSIGHT GENERATION FRAMEWORK                   │
└─────────────────────────────────────────────────────────────┘

FOR TEACHERS:
1. Immediate Actions (This Week)
   - Specific teaching strategies to implement
   - Classroom accommodations needed
   - Materials to prepare

2. Short-term Goals (This Month)
   - Skills to focus on
   - Progress checkpoints
   - Parent communication points

3. Long-term Development (This Term)
   - Learning trajectory
   - Skill progression plan
   - Reassessment schedule

FOR PARENTS:
1. Understanding Your Child
   - Learning style explanation
   - Strengths to celebrate
   - Areas needing support
