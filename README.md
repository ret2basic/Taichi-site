# Taichi Audit Group - Portfolio & Blog Website

A modern, responsive portfolio and blog website for Taichi Audit Group, a leading DeFi security audit firm incubated from the DeFiHackLabs community.

## 🚀 Features

- **Modern Design**: Clean, professional design with gradient backgrounds and smooth animations
- **Responsive Layout**: Fully responsive across all devices
- **Multi-Chain Focus**: Highlights expertise in Solidity, Move, and Solana security
- **Blog Platform**: Integrated blog for security insights and research
- **Contact Forms**: Professional contact and audit request forms
- **Dark Mode**: Full dark mode support
- **Performance**: Optimized for speed and SEO

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## 📁 Project Structure

```
src/
├── app/
│   ├── blog/
│   │   └── page.tsx       # Blog page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── Navigation.tsx     # Navigation component
│   ├── HeroSection.tsx    # Hero section
│   ├── ServicesSection.tsx # Services section
│   ├── StatsSection.tsx   # Statistics section
│   ├── AboutSection.tsx   # About section
│   ├── ContactSection.tsx # Contact section
│   └── Footer.tsx         # Footer component
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd taichi-audit-group
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## 🎨 Customization

### Colors

The website uses a custom color palette defined in `tailwind.config.js`:
- Primary: Blue gradient (#0ea5e9 to #0284c7)
- Secondary: Purple gradient (#d946ef to #c026d3)

### Content

- **Hero Section**: Update stats and messaging in `HeroSection.tsx`
- **Services**: Modify service offerings in `ServicesSection.tsx`
- **About**: Update team information in `AboutSection.tsx`
- **Blog**: Add new blog posts in `src/app/blog/page.tsx`

### Styling

- Global styles: `src/app/globals.css`
- Tailwind config: `tailwind.config.js`
- Custom gradients and animations included

## 📝 Content Management

### Blog Posts

Blog posts are currently stored as static data in `src/app/blog/page.tsx`. Each post includes:
- Title and excerpt
- Full content (supports markdown-style formatting)
- Author and metadata
- Categories and tags
- View counts

### Contact Forms

The contact form in `ContactSection.tsx` includes:
- Basic contact information
- Project details
- Blockchain type selection
- Timeline preferences

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for environment-specific configuration:

```env
# Site configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SITE_NAME=Taichi Audit Group

# Contact form (if using a form service)
NEXT_PUBLIC_FORM_ENDPOINT=your-form-endpoint

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

### SEO Configuration

SEO metadata is configured in `src/app/layout.tsx`:
- Title and description
- OpenGraph tags
- Twitter Card support
- Structured data

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically

### Other Platforms

The project can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Docker
- Static export (for static hosting)

## 📊 Analytics & Monitoring

### Google Analytics

Add your Google Analytics ID to track website performance:

```javascript
// In src/app/layout.tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  strategy="afterInteractive"
/>
```

### Performance Monitoring

- Core Web Vitals tracking
- Real User Monitoring (RUM)
- Error tracking with Sentry (optional)

## 🔒 Security Features

- CSP headers for security
- Input validation on forms
- XSS protection
- CSRF protection
- Rate limiting (recommended for production)

## 📱 Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly navigation
- Optimized images and fonts
- Fast loading times

## 🎯 SEO Optimization

- Semantic HTML structure
- Proper heading hierarchy
- Meta tags and descriptions
- OpenGraph and Twitter Cards
- Structured data for rich snippets
- XML sitemap generation

## 🔄 Updates & Maintenance

### Regular Updates

- Keep dependencies updated
- Monitor for security vulnerabilities
- Update blog content regularly
- Review and update portfolio items

### Performance Monitoring

- Monitor Core Web Vitals
- Track conversion rates
- Analyze user behavior
- A/B test important sections

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support and questions:
- Email: hello@taichi-audit.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

## 🔗 Links

- [Live Website](https://taichi-audit.com)
- [DeFiHackLabs](https://defihacklabs.com)
- [Blog](https://taichi-audit.com/blog)

---

Built with ❤️ by the Taichi Audit Group team.
