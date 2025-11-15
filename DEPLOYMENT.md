# Deployment Guide

## Netlify Deployment

### Environment Variables Setup

This application requires the following environment variables to be configured in Netlify:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add the following variables:

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BLACKBOX_API_KEY=your_blackbox_api_key
```

### Important Notes

- **VITE_ Prefix**: All environment variables with the `VITE_` prefix are intentionally exposed in the client-side bundle. This is standard for Vite applications.
- **Public Keys**: The keys above (Clerk publishable key, Supabase anon key) are designed to be public and safe to expose in client-side code.
- **Secrets Scanning**: The `netlify.toml` file is configured to omit these VITE_ variables from secrets scanning since they're meant to be public.

### Build Configuration

The build is configured in `netlify.toml`:
- **Build command**: `bun run build`
- **Publish directory**: `dist`
- **Node version**: 18

### Deployment Steps

1. **Push to GitHub**: Commit and push your changes
2. **Netlify Auto-Deploy**: Netlify will automatically detect the push and start building
3. **Environment Variables**: Ensure all required environment variables are set in Netlify dashboard
4. **Build Success**: Once the build completes, your site will be live

### Troubleshooting

If you encounter secrets scanning errors:
1. Verify that `netlify.toml` exists in the root of your project
2. Ensure the `omit_keys` section includes all VITE_ prefixed variables
3. Check that environment variables are set in Netlify dashboard, not in a committed `.env` file

### Local Development

For local development:
1. Copy `.env.example` to `.env`
2. Fill in your actual API keys and URLs
3. Never commit the `.env` file to version control
