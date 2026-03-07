# FlowForge Deployment Guide

## Local Deployment

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

3. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### Option 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

   Follow the prompts. For production deployment:
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "chore: initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/flowforge.git
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

### Option 3: One-Click Deploy

Click the button below to deploy directly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/flowforge)

## Environment Variables

If you need environment variables:

1. Create `.env.local` file (see `.env.local.example`)
2. Add variables in Vercel Dashboard:
   - Project Settings → Environment Variables
   - Add each variable with appropriate scope (Production/Preview/Development)

## Build Configuration

The project uses Next.js 14 with the following configuration:

- **Framework**: Next.js (auto-detected by Vercel)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

These are automatically configured in `vercel.json`.

## Post-Deployment

After deployment, Vercel will provide:
- Production URL (e.g., `flowforge.vercel.app`)
- Preview URLs for each branch/PR
- Automatic deployments on git push

## Troubleshooting

### Build Fails
- Check Node.js version (use 18+)
- Clear `.next` folder and rebuild
- Check for console errors in build logs

### Runtime Errors
- Check browser console for errors
- Verify all dependencies are in `package.json`
- Check Vercel function logs in dashboard

### Performance
- Enable compression in `next.config.js`
- Optimize images using Next.js Image component
- Use React.memo for expensive components
