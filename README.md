# Pythia Analytics

Privacy-first predictive analytics with differential privacy and real-time forecasting.

## Features

- **Differential Privacy**: Client-side noise injection for maximum privacy protection
- **Real-time Analytics**: Live visitor tracking and event monitoring
- **Predictive Modeling**: Forecast trends with Prophet and LLM-powered predictions
- **Cookieless Tracking**: No cookies, no persistent identifiers
- **Beautiful Dashboard**: Intuitive interface with actionable insights

## Quick Start

1. Add the Pythia buffer script to your website
2. Configure your Supabase credentials
3. Start tracking events with `pythia('event_name', count)`

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

*Updated: Trigger redeploy with environment variable changes*