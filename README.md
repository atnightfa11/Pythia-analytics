# Pythia Analytics

Privacy-first predictive analytics with differential privacy and real-time forecasting.

## Quick Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/heathergrass/Pythia-analytics)

## Setup (5 minutes)

1. **Deploy** - Click the button above or fork and connect to Netlify
2. **Database** - Create a [Supabase](https://supabase.com) project and run the migrations from `supabase/migrations/`
3. **Environment** - Add your Supabase credentials to Netlify environment variables
4. **Test** - Visit `/.netlify/functions/test-connection` to verify setup

## Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NETLIFY_URL=https://your-site.netlify.app
PYTHON_SERVICE_URL=https://forecasting-service.fly.dev
```

📖 **[Full Setup Guide](/docs)** - Complete installation and configuration

---

## Features

- **🔒 Differential Privacy**: Client-side noise injection (ε=1.0) with mathematical guarantees
- **📈 Predictive Modeling**: Prophet forecasting with <16% MAPE accuracy
- **🚨 Smart Alerts**: Automated anomaly detection with Slack notifications
- **🍪 Cookieless Tracking**: No cookies, no persistent identifiers
- **⚡ Real-time Analytics**: Live visitor tracking and event monitoring

## Documentation

📖 **[Complete Setup Guide](/docs)** - Detailed installation, configuration, and troubleshooting

🧠 **[How Differential Privacy Works](/blog/differential-privacy)** - Technical deep dive

## Testing

```javascript
// Browser console commands
pythiaStatus()           // Check privacy settings
pythia('test_event', 1)  // Send test event
flushPythia()           // Manual flush
```

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Netlify Functions + Supabase PostgreSQL
- **Forecasting**: Python FastAPI service on Fly.io with Prophet
- **Privacy**: Client-side differential privacy with Laplace noise

---

*Built for the bolt.new hackathon - Privacy-first analytics with predictive insights*