# LearnAura - Personalized Learning for Every Student

LearnAura gives teachers a complete, instant understanding of every student — academically, cognitively, and behaviourally — and generates the exact resources needed to teach a mixed-level classroom effectively.

## 🎯 What LearnAura Does

### 1. Academic Assessment
- 10 curriculum-aligned questions per student
- Instant heatmap showing who is advanced, on track, struggling, or needs support
- Built directly from official French national curriculum

### 2. Cognitive Profile Assessment
- **Student self-assessment**: 15 questions via smart voice agent
- **Parent assessment**: 15 parallel questions about their child
- **Combined profile**: Both averaged for accurate, triangulated insights
- Measures: processing speed, working memory, attention, learning style, confidence, motivation

### 3. Automatic Teaching Strategies
- Generated from official French Ministry teaching guides
- Based on real pedagogy, not generic advice
- Personalized for each student's learning profile

### 4. Differentiated Worksheets
- One-click generation of Support/Core/Advanced materials
- Fully personalized and curriculum-aligned
- Saves teachers 5+ hours per week

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
