# Pythia Analytics

Privacy-first predictive analytics with differential privacy and real-time forecasting.

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is created, go to Settings > API
3. Copy your project URL and anon key
4. Create a `.env` file in the root directory with:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. Database Migration

The database schema will be automatically created when you connect to Supabase. The migration files in `supabase/migrations/` contain:

- Events table for analytics data
- Alerts table for notifications
- Forecasts table for predictions
- Proper RLS policies for security

### 3. Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set the build command to: `npm run build`
3. Set the publish directory to: `dist`
4. Add the same environment variables from your `.env` file to Netlify's environment variables

### 4. Environment Variables

Add these to both your local `.env` file and Netlify's environment variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
NETLIFY_URL=your_netlify_site_url
SITE_URL=your_netlify_site_url
```

## Features

- **Differential Privacy**: Client-side noise injection for maximum privacy protection
- **Real-time Analytics**: Live visitor tracking and event monitoring
- **Predictive Modeling**: Forecast trends with Prophet and LLM-powered predictions
- **Cookieless Tracking**: No cookies, no persistent identifiers
- **Beautiful Dashboard**: Intuitive interface with actionable insights

## Testing

Use the dashboard test buttons or browser console:

```javascript
// Check status
pythiaStatus()

// Send test event
pythia('test_event', 1)

// Manual flush
flushPythia()
```

## Privacy

All data is processed with differential privacy (ε=1.0) and noise injection happens client-side before transmission.

---

*Ready for new Supabase and Netlify connections*