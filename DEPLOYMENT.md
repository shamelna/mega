# Deployment Guide

This guide will help you deploy the MEGA LEAN Assessment Tool to various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:
- All project files (HTML, CSS, JS)
- Supabase account configured
- Access to your chosen hosting platform

## 🚀 Deployment Options

### Option 1: Netlify (Recommended)

**Easiest deployment option with drag-and-drop interface**

1. **Sign up** for a free account at [netlify.com](https://www.netlify.com)

2. **Deploy via Drag & Drop**:
   - Log in to Netlify
   - Drag the entire project folder to the Netlify dashboard
   - Wait for deployment to complete
   - Your site will be live at `https://random-name.netlify.app`

3. **Configure Custom Domain** (Optional):
   - Go to Domain Settings
   - Add your custom domain
   - Update DNS records as instructed

4. **Enable HTTPS**:
   - Automatically enabled by Netlify
   - SSL certificate provisioned automatically

### Option 2: Vercel

**Great for Git-based deployments**

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd windsurf-project
   vercel
   ```

3. **Follow prompts**:
   - Link to your Vercel account
   - Configure project settings
   - Deploy

4. **Production Deployment**:
   ```bash
   vercel --prod
   ```

### Option 3: GitHub Pages

**Free hosting for static sites**

1. **Create GitHub Repository**:
   ```bash
   cd windsurf-project
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/mega-lean.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to repository Settings
   - Navigate to Pages section
   - Select `main` branch
   - Click Save
   - Your site will be at `https://YOUR-USERNAME.github.io/mega-lean/`

### Option 4: Traditional Web Hosting

**For standard web hosting services (cPanel, etc.)**

1. **Connect via FTP**:
   - Use FileZilla or similar FTP client
   - Connect to your hosting server

2. **Upload Files**:
   - Upload all files to `public_html` or `www` directory
   - Maintain the file structure

3. **Set Permissions**:
   - Files: 644
   - Folders: 755

4. **Access Your Site**:
   - Visit your domain
   - The application should load immediately

## 🔧 Post-Deployment Configuration

### Update Supabase Redirect URLs

After deployment, update Supabase settings:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Authentication > URL Configuration
4. Add your production URL to:
   - Site URL
   - Redirect URLs

Example:
```
Site URL: https://your-domain.com
Redirect URLs: 
- https://your-domain.com
- https://your-domain.com/**
```

### Enable CORS (if needed)

Most platforms handle CORS automatically, but if you encounter issues:

In Supabase, add your domain to allowed origins:
1. Navigate to Project Settings
2. API section
3. Add your domain to CORS origins

## 🔐 Security Checklist

Before going live:

- [ ] HTTPS enabled (automatic with Netlify/Vercel)
- [ ] Supabase RLS (Row Level Security) enabled
- [ ] Redirect URLs configured in Supabase
- [ ] Password requirements enforced
- [ ] Email confirmation enabled (optional)
- [ ] Admin users properly configured

## 📊 Performance Optimization

### Enable Caching

Add these headers (platform dependent):

**Netlify** - Create `netlify.toml`:
```toml
[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

**Vercel** - Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*).js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000"
        }
      ]
    }
  ]
}
```

### Minify Assets (Optional)

For production, consider minifying:
```bash
# Install minifier
npm install -g terser clean-css-cli

# Minify JavaScript
terser app.js -o app.min.js
terser auth.js -o auth.min.js
terser assessment.js -o assessment.min.js
terser config.js -o config.min.js

# Minify CSS
cleancss styles.css -o styles.min.css

# Update HTML references to .min versions
```

## 🧪 Testing

After deployment, test:

1. **Authentication**:
   - Sign up new user
   - Sign in existing user
   - Password reset

2. **Assessment**:
   - Create new assessment
   - Save as draft
   - Complete assessment
   - View results

3. **Responsive Design**:
   - Test on mobile
   - Test on tablet
   - Test on desktop

4. **Cross-Browser**:
   - Chrome
   - Firefox
   - Safari
   - Edge

## 📱 Custom Domain Setup

### Netlify Custom Domain

1. Add domain in Netlify:
   - Site Settings > Domain Management
   - Add custom domain

2. Update DNS records:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5

   Type: CNAME
   Name: www
   Value: your-site.netlify.app
   ```

### Vercel Custom Domain

1. Add domain in Vercel dashboard
2. Update DNS:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

## 🔄 Continuous Deployment

### GitHub Integration

**Netlify**:
1. Connect GitHub repository
2. Set build command: (none for static site)
3. Publish directory: `/`
4. Auto-deploy on push

**Vercel**:
1. Import Git repository
2. Configure project
3. Deploy automatically on commit

## 📈 Monitoring

### Analytics (Optional)

Add Google Analytics:
```html
<!-- Add to index.html before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking (Optional)

Add Sentry:
```html
<script src="https://browser.sentry-cdn.com/sentry.min.js"></script>
<script>
  Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
</script>
```

## 🆘 Troubleshooting

### Issue: Site Not Loading
- Check DNS propagation (can take 24-48 hours)
- Verify all files uploaded correctly
- Check browser console for errors

### Issue: Authentication Failing
- Verify Supabase redirect URLs
- Check Supabase API keys
- Ensure HTTPS is enabled

### Issue: CORS Errors
- Add your domain to Supabase CORS settings
- Check Supabase API configuration

## 📞 Support

For deployment issues:
- **Netlify**: [docs.netlify.com](https://docs.netlify.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **GitHub Pages**: [docs.github.com/pages](https://docs.github.com/pages)

---

**Happy Deploying! 🚀**
