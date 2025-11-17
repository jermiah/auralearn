# LearnAura - Personalized Learning for Every Student

**Assess today. Teach better tomorrow.**

---

## 🔥 The Problem Schools Face — Reality in France Today

Every French classroom follows the same model: **one teacher, around thirty students, and only 55 minutes** to teach.

But behind this apparent simplicity lies the biggest challenge in French education:

### **A single classroom contains 30 different levels.**

Some students are 2–3 years ahead.
Some are 2–3 years behind.
Others are struggling with attention, confidence, motivation, language barriers, or specific learning needs.

This extreme heterogeneity forces teachers to do the impossible:

- Teach advanced students who finish everything early
- Support students who cannot access the lesson
- Manage behavior caused by boredom, frustration, or confusion
- Follow the national curriculum
- Create differentiated materials for multiple levels
- **All within the same 55-minute period**

### The Result?

**1. Students fall behind silently** — Because teachers simply can't diagnose learning gaps in time.

**2. Fast learners lose interest** — Because the lesson is too slow or too repetitive for them.

**3. Teachers drown in workload** — Because preparing 2–4 versions of every lesson takes 10–15 hours per week.

**This is not a teacher problem. This is a structural system problem.**

Teachers cannot personalize for 30 students at once with the tools they have today.

- The Ministry knows it.
- Teachers know it.
- Parents know it.
- Students feel it.

**This is the challenge LearnAura solves.**

---

## ⭐ What LearnAura Does

LearnAura gives teachers a complete, instant understanding of every student — academically, cognitively, and behaviourally — and generates the exact resources needed to teach a mixed-level classroom effectively.

### 1. Academic Assessment (10 questions)

The academic assessment is built directly from the **official French national curriculum**.
The system uses AI to automatically generate smart, curriculum-aligned questions tailored to the grade and subject selected.

**Teachers can:**
- Share one assessment link with the entire class
- Or generate personalized versions for each student

**Students complete 10 questions, and LearnAura immediately identifies who is:**
- Advanced
- On track
- Needs attention
- Struggling
- Needs immediate support

All results appear in a clean, colour-coded **heatmap that teachers understand in seconds**.

---

### 2. Cognitive Profile Assessment (15 questions)

The cognitive assessment shows **how** each student learns — not just what they know.

**It measures:**
- Processing speed
- Working memory
- Attention
- Learning style
- Self-confidence
- Motivation

**Dual Assessment Approach:**

1. **Student self-assessment** — Powered by a smart **voice agent** that talks with the student, listens to them, and adapts to their pace and comfort level. This makes the assessment more personal, more accurate, and more authentic.

2. **Parent assessment** — Similar 15 questions about their child, providing external perspective on learning behaviors.

3. **Combined profile** — Both assessments are averaged for accurate, triangulated insights that reduce single-source bias.

**Teachers instantly see each student's:**
- Primary learning category
- Secondary category

**Examples include:**
- Visual learner
- Slow processor
- Needs repetition
- Easily distracted
- Sensitive / low confidence
- High-energy learner
- Fast processor
- Logical learner

**Insights that usually take months now appear in minutes.**

---

### 3. Automatic Teaching Strategies Based on Real Pedagogy

**This is the core innovation.**

Every strategy LearnAura generates comes from:
- The **official French Ministry of Education curriculum**
- The **official teaching guides**
- The top **teacher blogs**
- The top **educational videos**
- Modern classroom best practices

Our system extracts, transcribes, and synthesizes these sources to create **practical, modern, realistic** strategies for each learner profile.

Nothing is generic.
Nothing is random.
It is **real French pedagogy**, enriched with today's best techniques.

---

### 4. Automatic Support / Core / Advanced Worksheets

In **one click**, LearnAura generates differentiated worksheets so every student works at the right level.

- **Support group** — Scaffolded content for struggling students
- **Core group** — Standard curriculum-aligned content
- **Advanced group** — Enriched, challenging content

Everything is personalized.
Everything is instant.
**Zero extra work for teachers.**

---

## 🌟 The Benefits for Schools

### 1. Identify student needs in minutes — not months

Instant clarity → better decisions → faster progress.

### 2. Every lesson becomes more effective

Teachers know exactly who needs what before class begins.

### 3. Dramatic improvement in student outcomes

- Struggling students catch up
- Advanced students grow
- Confidence increases for everyone

### 4. Behaviour improves naturally

Because lessons finally match each student's learning needs.

### 5. Differentiation becomes easy

Support, Core, Advanced — all generated automatically.

### 6. Stronger parent communication

- Clear reports
- Clear understanding
- Clear collaboration
- Parents actively participate in assessment process

### 7. Fully aligned with the official French curriculum

Teachers know it is safe, compliant, and academically rigorous.

### 8. Monday-morning ready

- Assess Friday → Teach Monday
- Instant heatmap, instant strategies, instant worksheets
- Works in any collège or primary school

---

## 🚀 Getting Started

### Prerequisites
- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Python 3.11+ - [download here](https://www.python.org/downloads/)
- Supabase account - [sign up here](https://supabase.com)

### Quick Start

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd aura-learn

# Install frontend dependencies
npm install

# Set up Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development servers
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd backend
python app.py
```

Visit `http://localhost:5173` to see the application.

## 📚 Documentation

### Quick Guides
- **[Quick Start](QUICKSTART.md)** - Get up and running
- **[Setup Guide](SETUP_GUIDE.md)** - Complete installation
- **[Deployment Guide](docs/scoring/DEPLOYMENT_GUIDE.md)** - Deploy combined scoring system

### Full Documentation
See **[docs/README.md](docs/README.md)** for complete documentation index.

Key sections:
- **Assessment System** - How academic and cognitive assessments work
- **Scoring System** - Combined scoring algorithm (cognitive 60% + academic 40%)
- **Teaching Resources** - Automatic strategy and worksheet generation
- **Database Setup** - Supabase configuration and migrations

### Hackathon
- **[Hackathon Alignment](docs/product/HACKATHON_ALIGNMENT.md)** - How LearnAura solves the challenge

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn-ui** - Component library

### Backend
- **Python 3.11** - Backend language
- **Flask** - API framework
- **Supabase** - Database and authentication
- **PostgreSQL** - Database
- **Gemini AI** - Assessment generation
- **Mistral AI** - OCR and document processing

### AI & Integrations
- **Voice Agent** - Student cognitive assessment
- **Brave Search** - Teaching resource discovery
- **Blackbox AI** - Code assistance and development support

## 🔧 Development

### Running Tests
```sh
# Frontend tests
npm run test

# Backend validation
cd backend
python validate_combined_scoring.py
```

### Database Migrations

All SQL migrations are in `supabase/migrations/`. See [supabase/migrations/README.md](supabase/migrations/README.md) for details.

To apply the latest combined scoring system:
1. Open Supabase SQL Editor
2. Copy contents of `supabase/migrations/supabase-combined-scoring-system.sql`
3. Run it
4. Execute: `python backend/populate_category_scores.py --force`

### Code Quality

This project uses **Blackbox AI** for code assistance and maintaining code quality.

## 📁 Project Structure

```
aura-learn/
├── src/                    # Frontend React application
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── lib/              # Utilities and helpers
│   └── i18n/             # Translations (French/English)
│
├── backend/               # Python backend
│   ├── app.py            # Main Flask application
│   ├── assessment_handler.py
│   ├── populate_category_scores.py
│   ├── validate_combined_scoring.py
│   └── assessment_pipeline/  # Document ingestion
│
├── supabase/migrations/   # Database migrations
│
├── docs/                  # Documentation
│   ├── assessments/      # Assessment system
│   ├── scoring/          # Scoring algorithms
│   ├── product/          # Product documentation
│   └── ...
│
└── public/               # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For questions or issues:
- Check the [documentation](docs/README.md)
- Review [troubleshooting guides](docs/scoring/DEPLOYMENT_GUIDE.md#troubleshooting)
- Open an issue on GitHub

## 🎓 About

LearnAura is designed to solve the critical challenge facing French education: how to effectively teach 30 students at 30 different levels within a 55-minute class period.

Built for teachers, by understanding teachers.

**Assess today. Teach better tomorrow.**

---

**Made with ❤️ for French Education**
