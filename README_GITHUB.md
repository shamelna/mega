# MEGA LEAN Assessment Tool 🎯

![LEAN Maturity Assessment](https://img.shields.io/badge/Status-Production%20Ready-success)
![Version](https://img.shields.io/badge/Version-2.1.0-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

A comprehensive web application for evaluating organizational LEAN maturity across 7 key dimensions with advanced analytics, PDF reports, and intelligent recommendations.

## ✨ Features

### 🎯 Core Capabilities
- **35-Question Assessment** across 7 LEAN dimensions
- **Real-Time Scoring** with instant maturity level calculation
- **Spider/Radar Charts** for visual performance analysis
- **Intelligent Feedback** with AI-generated recommendations
- **PDF Report Generation** with professional formatting
- **Cloud Storage** via Supabase (PostgreSQL)
- **User Authentication** with secure sign-up/sign-in
- **Role-Based Access** (User & Admin roles)

### 📊 Analytics & Reporting
- **Individual Assessment Results** with detailed breakdowns
- **Dashboard Analytics** showing latest completed assessment
- **CSV Data Export** for external analysis
- **GDPR Compliance** with personal data export
- **Historical Tracking** of all assessments
- **Comparative Analysis** across dimensions

### 👨‍💼 Admin Features
- **User Management** (activate/deactivate accounts)
- **Role Management** (promote to admin)
- **Statistics Dashboard** (assessments, users, scores)
- **Assessment Filtering** by user, company, status
- **Bulk Data Export** to CSV
- **Individual PDF Generation** for any assessment

### 📱 User Experience
- **Responsive Design** works on all devices
- **Draft Saving** to complete assessments later
- **Progress Tracking** shows completion status
- **Assessment History** with edit capability
- **Visual Progress Rings** for scores
- **Color-Coded Results** for quick insights

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for cloud features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR-USERNAME/mega-lean-assessment-tool.git
cd mega-lean-assessment-tool
```

2. **Open in browser**
   - Simply open `index.html` in your browser, or
   - Use a local server (recommended):

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server
```

3. **Access the application**
   - Navigate to `http://localhost:8000`
   - Create an account and start assessing!

## 📖 Documentation

- **[Quick Start Guide](QUICKSTART.md)** - Get running in 3 minutes
- **[User Manual](README.md)** - Complete feature documentation
- **[Deployment Guide](DEPLOYMENT.md)** - Deploy to production
- **[Fixes Applied](FIXES_APPLIED.md)** - Recent bug fixes
- **[PDF Export Features](PDF_EXPORT_FEATURES.md)** - Export documentation
- **[Enhancement Roadmap](ENHANCEMENTS.md)** - 77 suggested improvements

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **PDF Generation**: jsPDF + Chart.js
- **Hosting**: Static file hosting (Netlify, Vercel, GitHub Pages)

### File Structure
```
windsurf-project/
├── index.html              # Main application HTML
├── styles.css              # All styling and responsive design
├── config.js               # Configuration and constants
├── auth.js                 # Authentication logic
├── assessment.js           # Assessment form and calculations
├── admin.js                # Admin dashboard and management
├── export.js               # PDF generation and data export
├── app.js                  # Main application logic
├── .gitignore              # Git ignore rules
├── README.md               # Full documentation
├── QUICKSTART.md           # Quick start guide
├── DEPLOYMENT.md           # Deployment instructions
├── FIXES_APPLIED.md        # Bug fixes documentation
├── PDF_EXPORT_FEATURES.md  # Export features guide
├── ENHANCEMENTS.md         # Future enhancement roadmap
└── CHANGELOG.md            # Version history
```

## 🎯 Assessment Dimensions

1. **Leadership & Culture** - LEAN principle promotion and continuous improvement culture
2. **Customer Value Focus** - Understanding and delivering customer value
3. **Process Efficiency** - Standardization and process optimization
4. **Waste Elimination (Muda)** - Identifying and eliminating the 8 types of waste
5. **Continuous Improvement (Kaizen)** - Kaizen culture and practices
6. **Flow and Pull Systems** - Workflow optimization
7. **Problem Solving & Root Cause Analysis** - Structured problem-solving capabilities

## 📊 Maturity Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| **Novice** | 0-48% | Initial LEAN implementation with limited practices |
| **Emerging** | 49-66% | Developing LEAN practices with some consistency |
| **Developing** | 67-82% | Established LEAN practices with good maturity |
| **Advanced** | 83-100% | Highly mature and embedded LEAN culture |

## 🔧 Configuration

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create the following tables:

**profiles table:**
```sql
create table profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  role text default 'user',
  is_active boolean default true,
  created_at timestamp with time zone default now()
);
```

**assessments table:**
```sql
create table assessments (
  id serial primary key,
  user_email text not null,
  user_name text,
  company_name text not null,
  assessor_name text not null,
  assessment_date date,
  responses jsonb not null,
  results jsonb,
  is_draft boolean default false,
  created_at timestamp with time zone default now()
);
```

3. Update `config.js` with your Supabase credentials:
```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## 🌐 Deployment

### Netlify (Recommended)
1. Push code to GitHub
2. Connect repository to Netlify
3. Deploy automatically on push
4. Update Supabase redirect URLs

### Vercel
```bash
vercel --prod
```

### GitHub Pages
1. Enable GitHub Pages in repository settings
2. Select `main` branch
3. Access at `https://username.github.io/mega-lean-assessment-tool`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

This is a proprietary project. For collaboration inquiries, contact [info@kaizenacademy.education](mailto:info@kaizenacademy.education).

## 📜 License

© 2024 MEGA LEAN Assessment Tool  
Designed by **Kaizen Academy™**  
All rights reserved.

## 📞 Support

- **Website**: [https://mega.kaizenacademy.education](https://mega.kaizenacademy.education)
- **Email**: [info@kaizenacademy.education](mailto:info@kaizenacademy.education)

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- MEGA Kaizen Academy for LEAN expertise
- The Continuous Improvement community

---

**Built with ❤️ by Kaizen Academy™**
