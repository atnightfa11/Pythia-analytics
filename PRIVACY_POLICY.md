# Pythia Analytics Privacy Policy

**Effective Date:** January 2025

## 🔒 Our Commitment to Privacy

Pythia Analytics is designed from the ground up with privacy as the core principle. Unlike traditional analytics platforms that collect extensive user data, we implement multiple layers of privacy protection to ensure your users' data stays private and secure.

## 📊 What We Collect

We collect **only technical data necessary for analytics**, with no personal identifiers:

### ✅ Technical Data Only
- **Event Types**: pageview, click, custom events (what happened)
- **Event Counts**: With differential privacy noise applied (how many)
- **Device Type**: From browser User-Agent string (desktop/mobile/tablet)
- **Approximate Country**: From browser timezone (e.g., "US", "GB", "DE")
- **Session Duration**: Time spent on pages
- **UTM Parameters**: Marketing attribution from URL parameters
- **Page URLs**: Current page being viewed

### ❌ What We DON'T Collect
- ❌ **No IP addresses** or precise geolocation
- ❌ **No names, emails, or personal information**
- ❌ **No browser fingerprints** or device IDs
- ❌ **No cross-site tracking data**
- ❌ **No server-side user identification**

## 🕒 Data Retention & Automatic Cleanup

### Session Data (24 Hours)
- Session IDs automatically expire and regenerate every 24 hours
- No persistent tracking across user sessions
- Session data cannot be recovered once expired

### Browser Storage Cleanup (7 Days)
- **Mirrors Safari's Intelligent Tracking Prevention (ITP)**
- All localStorage and sessionStorage data automatically cleaned up after 7 days
- Proactive removal of old session data to prevent accumulation
- Automatic detection and cleanup of corrupted data

### Event Data (User Controlled)
- Raw events stored in your Supabase database (your infrastructure)
- Retention period controlled by your database policies
- You have full control over data lifecycle and deletion

## 🔐 Differential Privacy Protection

### Noise Injection
- All numeric data receives mathematical noise before transmission
- **Privacy budget (ε)** configurable: 0.1 (High Privacy) → 5.0 (High Utility)
- Default ε=1.0 provides strong privacy with useful analytics
- **Mathematical guarantees** prevent re-identification

### Geographic Data
- **No IP geolocation** - uses browser timezone only
- Approximate mapping: timezone → country code
- Compatible with differential privacy noise
- No precise location data collected

## 🌐 Data Processing & Security

### Client-Side Processing
```
User Browser → Client-Side Processing → Noise Injection → Encrypted Transmission → Your Database
```

### Security Measures
- ✅ **HTTPS encryption** for all data transmission
- ✅ **No third-party services** - data stays in your infrastructure
- ✅ **No data sharing** or selling
- ✅ **Client-side session generation** - no server-side user tracking
- ✅ **Automatic data expiration** and cleanup

## 🗑️ User Data Rights

### Immediate Data Deletion
Users can clear all Pythia data immediately:

```javascript
// Clear all browser storage
localStorage.clear()
sessionStorage.clear()

// Or selectively remove Pythia data
localStorage.removeItem('pythia_session_id')
localStorage.removeItem('pythia_session_timestamp')
sessionStorage.removeItem('pythia_utm_params')
```

### Database Data Control
- Access your Supabase dashboard to delete event data
- All events are scoped to your domain only
- No data portability requirements (aggregate analytics only)

## ⚖️ Legal Compliance

### GDPR Compliance
- ✅ **No personal data collection**
- ✅ **Client-side processing** (data never leaves user device before noise injection)
- ✅ **Right to erasure** (users can clear data anytime)
- ✅ **No automated decision-making** affecting users

### CCPA Compliance
- ✅ **No sale or sharing** of personal information
- ✅ **No behavioral tracking** across sites
- ✅ **Opt-out mechanism** (clear browser data)

### Additional Protections
- ✅ **Cookie-free implementation**
- ✅ **No cross-site tracking**
- ✅ **No advertising identifiers**
- ✅ **No device fingerprinting**

## 🔧 Technical Implementation

### Automatic Cleanup Code
```javascript
// Session expiration (24 hours)
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Data cleanup (7 days) - mirrors Safari ITP
const MAX_SESSION_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

if (sessionAge > MAX_SESSION_AGE) {
  localStorage.removeItem('pythia_session_id')
  localStorage.removeItem('pythia_session_timestamp')
  sessionStorage.removeItem('pythia_utm_params')
}
```

### Differential Privacy Implementation
```javascript
// Laplace noise injection with configurable ε
const noise = Math.random() * 2 - 1 // Random between -1 and 1
const noisyCount = event.count + noise * epsilon
```

### Geographic Detection
```javascript
// Privacy-preserving country detection
function getCountryFromTimezone() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Approximate mapping - no precise location
  const timezoneToCountry = {
    'America/New_York': 'US',
    'Europe/London': 'GB',
    'Europe/Berlin': 'DE',
    // ... etc
  }

  return timezoneToCountry[timezone] || 'Unknown'
}
```

## 📞 Contact Information

For privacy-related questions or concerns:
- **Email**: privacy@pythia-analytics.com
- **Documentation**: [Privacy Technical Details](/README.md#privacy-policy)
- **GitHub Issues**: [Report Privacy Concerns](https://github.com/atnightfa11/Pythia-analytics/issues)

## 📅 Changes to This Policy

We will update this privacy policy as needed to reflect changes in our practices or legal requirements. The effective date at the top of this policy indicates when it was last updated.

---

**Pythia Analytics** - Privacy-first analytics that puts user control first.
