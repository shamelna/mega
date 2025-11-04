# MEGA LEAN Assessment Tool

A comprehensive web application for evaluating organizational LEAN maturity across 7 key dimensions.

## 🌟 Features

### Core Functionality
- **User Authentication** - Secure sign-up, sign-in, and password reset via Supabase
- **Cloud Storage** - All assessments stored securely in the cloud
- **Multi-Dimensional Assessment** - Evaluate 7 LEAN dimensions with 35 questions
- **Real-Time Scoring** - Instant calculation and visualization of results
- **Draft Saving** - Save progress and complete assessments later
- **Role-Based Access** - User and Admin roles with different permissions
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices

### Assessment Dimensions
1. **Leadership & Culture** - LEAN principle promotion and continuous improvement culture
2. **Customer Value Focus** - Understanding and delivering customer value
3. **Process Efficiency** - Standardization and process optimization
4. **Waste Elimination (Muda)** - Identifying and eliminating the 8 types of waste
5. **Continuous Improvement (Kaizen)** - Kaizen culture and practices
6. **Flow and Pull Systems** - Workflow optimization
7. **Problem Solving & Root Cause Analysis** - Structured problem-solving capabilities

### Maturity Levels
- **Novice** (0-31%) - Limited LEAN implementation
- **Emerging** (32-48%) - Emerging but inconsistent practices
- **Developing** (49-66%) - Strong foundation with room for refinement
- **Advanced** (67%+) - Deeply embedded LEAN culture

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for cloud features
- Supabase account (already configured)

### Installation

1. **Clone or download** the project files to your local machine

2. **File Structure**
   ```
   windsurf-project/
   ├── index.html          # Main HTML structure
   ├── styles.css          # All styling and responsive design
   ├── config.js           # Configuration and constants
   ├── auth.js             # Authentication logic
   ├── assessment.js       # Assessment form and calculations
   ├── app.js              # Main application logic
   └── README.md           # This file
   ```

3. **Open the application**
   - Simply open `index.html` in your web browser
   - Or use a local development server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js http-server
     npx http-server
     ```

### Deployment
This is a static web application that can be deployed to:
- **Netlify** - Drag and drop deployment
- **Vercel** - Git-based deployment
- **GitHub Pages** - Free hosting for static sites
- **Any web hosting service** - Upload all files to web root

## 📖 User Guide

### Creating an Account
1. Click the **Sign Up** tab
2. Enter your full name, email, and password
3. Confirm your password
4. Click **Create Account**
5. Check your email for confirmation (if required)

### Taking an Assessment
1. Sign in to your account
2. Click **New Assessment**
3. Fill in company information
4. Answer all 35 questions honestly
5. Click **Submit Assessment** to complete
6. Or click **Save Draft** to continue later

### Viewing Results
1. Click **My Dashboard** to see your latest results
2. View overall LEAN maturity score
3. Review individual dimension scores
4. Identify areas for improvement

### Managing Assessments
1. Click **My Assessments** to view all saved assessments
2. **Edit** to modify draft assessments
3. **Delete** to remove assessments
4. Filter and search functionality (coming soon)

### Admin Features
- View all assessments from all users
- Monitor organizational LEAN maturity trends
- Access is granted manually by system administrators

## 🛠️ Technical Details

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Static file hosting compatible

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Database Schema

**profiles table**
```sql
- id (UUID, primary key)
- email (TEXT)
- full_name (TEXT)
- role (TEXT) - 'user' or 'admin'
- created_at (TIMESTAMP)
```

**assessments table**
```sql
- id (SERIAL, primary key)
- user_email (TEXT)
- user_name (TEXT)
- company_name (TEXT)
- assessor_name (TEXT)
- assessment_date (DATE)
- responses (JSONB)
- results (JSONB)
- is_draft (BOOLEAN)
- created_at (TIMESTAMP)
```

## 🎨 Customization

### Branding
Update colors in `styles.css`:
```css
--primary-color: #821874;    /* Purple */
--secondary-color: #159eda;  /* Blue */
--accent-color: #7EBEC5;     /* Teal */
```

### Logo
Replace the logo URL in `index.html`:
```html
<img src="YOUR_LOGO_URL" alt="Logo" class="logo">
```

### Questions
Modify questions in `config.js`:
```javascript
const QUESTIONS = [
    { id: 1, dimension: 0, text: 'Your question here' },
    // ...
];
```

## 🔒 Security Features

- Secure password requirements (8+ characters)
- Email validation
- Row Level Security (RLS) in Supabase
- HTTPS encryption (when deployed)
- XSS protection
- CSRF protection via Supabase

## 📊 Data Privacy

- User data stored securely in Supabase cloud
- No third-party analytics tracking
- Users can delete their own assessments
- Admin access is explicitly granted
- Compliant with data protection best practices

## 🐛 Troubleshooting

### Cannot Sign In
- Check email and password
- Verify email confirmation (check spam folder)
- Clear browser cache and cookies

### Assessments Not Saving
- Check internet connection
- Verify you're signed in
- Check browser console for errors

### Display Issues
- Clear browser cache
- Try a different browser
- Disable browser extensions

## 🔄 Future Enhancements

- [ ] Export results to PDF
- [ ] Comparison charts (track progress over time)
- [ ] Team assessments and collaboration
- [ ] Customizable assessment templates
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Assessment scheduling
- [ ] Bulk import/export

## 📞 Support

For support, please contact:
- **Email**: info@kaizenacademy.education
- **Website**: Visit [Kaizen Academy](https://kaizenacademy.education/)

## 📜 License

© 2024 MEGA LEAN Assessment Tool  
Designed by **Kaizen Academy™**

All rights reserved.

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- MEGA Kaizen Academy for LEAN expertise
- The Continuous Improvement community

---

**Version**: 2.0.0  
**Last Updated**: 2024  
**Maintained by**: Kaizen Academy™
