# 🔑 API Keys Guide - TrustLens2

## Overview

TrustLens uses **external AI detection APIs** to analyze content. These APIs require **API keys** (secret tokens) to authenticate.

---

## 🔍 Where Do API Keys Come From?

### Understanding the Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     HOW IT WORKS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User uploads file                                           │
│     │                                                           │
│     ▼                                                           │
│  2. TrustLens sends file to AI detection API                    │
│     │                                                           │
│     ▼                                                           │
│  3. API analyzes file (uses their AI models)                    │
│     │                                                           │
│     ▼                                                           │
│  4. API returns results (scores, signals)                       │
│     │                                                           │
│     ▼                                                           │
│  5. TrustLens displays results to user                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The API Keys Are From:

| Provider | What They Do | Where to Get Key |
|----------|--------------|------------------|
| **Hive AI** | Deepfake detection, AI image detection | https://thehive.ai |
| **Sightengine** | Content moderation, face analysis | https://sightengine.com |
| **Auth0** (optional) | User authentication | https://auth0.com |

---

## 🎯 API Providers Explained

### 1. Hive AI (Recommended for Deepfakes)

**What it does:**
- Detects AI-generated images (Midjourney, DALL-E, Stable Diffusion)
- Detects deepfake videos
- Analyzes audio for voice synthesis

**How to get API key:**

1. Go to https://thehive.ai
2. Click "Sign Up" or "Get Started"
3. Create account with email
4. Go to Dashboard → API Keys
5. Click "Create API Key"
6. Copy the key

**Free Tier:**
- 1,000 requests/month
- Basic detection models
- Good for testing

**Pricing:**
- Starter: $49/month - 10,000 requests
- Growth: $199/month - 50,000 requests
- Enterprise: Custom

---

### 2. Sightengine (Best for Content Moderation)

**What it does:**
- Detects AI-generated content
- NSFW content detection
- Face manipulation detection
- Text in images (OCR)

**How to get API key:**

1. Go to https://sightengine.com
2. Click "Start Free"
3. Create account
4. Go to Dashboard → API Credentials
5. You'll get:
   - API User (number)
   - API Secret (string)
6. Copy both values

**Free Tier:**
- 2,000 requests/month
- All detection models
- Great for testing

**Pricing:**
- Starter: $29/month - 5,000 requests
- Pro: $99/month - 25,000 requests
- Enterprise: Custom

---

## 🛠️ How to Configure API Keys

### Step 1: Create .env file

```bash
# In your project root, create .env file
touch .env
```

### Step 2: Add your API keys

```env
# =============================================
# DATABASE (Required)
# =============================================
DATABASE_URL=postgresql://user:pass@localhost:5432/trustlens
# OR for SQLite (no setup needed):
# DATABASE_URL=file:./trustlens.db

# =============================================
# AUTHENTICATION (Required)
# =============================================
# Generate with: openssl rand -base64 32
AUTH_SECRET=your_random_secret_here_make_it_long_and_random

# =============================================
# DETECTION MODE
# =============================================
# "mock" = Use demo data (no API calls, free)
# "production" = Use real APIs (requires API keys)
DETECTION_MODE=mock

# =============================================
# HIVE AI API (Optional - for production)
# =============================================
HIVE_API_KEY=your_hive_api_key_here
HIVE_API_BASE_URL=https://api.thehive.ai/api/v2/task/sync
HIVE_TIMEOUT_MS=60000
HIVE_MAX_RETRIES=2

# =============================================
# SIGHTENGINE API (Optional - for production)
# =============================================
SIGHTENGINE_API_USER=your_sightengine_user_number
SIGHTENGINE_API_SECRET=your_sightengine_secret_here
SIGHTENGINE_ENDPOINT=https://api.sightengine.com/1.0
SIGHTENGINE_TIMEOUT_MS=30000
SIGHTENGINE_MAX_RETRIES=1

# =============================================
# USAGE LIMITS
# =============================================
GUEST_ANALYSIS_LIMIT=5
USER_ANALYSIS_LIMIT=50

# =============================================
# STORAGE (Optional)
# =============================================
# STORAGE_PROVIDER=local
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
# AWS_S3_BUCKET=trustlens-uploads
```

---

## 🧪 Mock Mode vs Production Mode

### Mock Mode (Default - No API Keys Needed!)

```env
DETECTION_MODE=mock
```

**What happens:**
- ✅ No API calls made
- ✅ Uses simulated detection results
- ✅ Free, no limits
- ✅ Good for testing/development
- ❌ Results are random/demo only

### Production Mode (Real API Keys Required)

```env
DETECTION_MODE=production
HIVE_API_KEY=your_key
# AND/OR
SIGHTENGINE_API_USER=your_user
SIGHTENGINE_API_SECRET=your_secret
```

**What happens:**
- ✅ Real AI detection
- ✅ Accurate results
- ✅ Professional analysis
- ❌ Costs money after free tier
- ❌ Requires API keys

---

## 💰 Cost Breakdown

### For Testing (Free)

Use **Mock Mode**:
- No API keys needed
- No costs
- Demo results

### For Personal Use (~$30-50/month)

Option 1: **Hive AI Starter** ($49/month)
- 10,000 requests
- Good detection quality

Option 2: **Sightengine Pro** ($29/month)
- 5,000 requests
- Multiple detection models

### For Business (~$200-500/month)

- Hive AI Growth: $199/month
- Sightengine Pro: $99/month
- Both combined: ~$300/month

---

## 🔒 Security Best Practices

### DO:
✅ Keep API keys in `.env` file (never in code)
✅ Add `.env` to `.gitignore`
✅ Use different keys for development/production
✅ Rotate keys regularly
✅ Monitor API usage

### DON'T:
❌ Share API keys publicly
❌ Commit `.env` to Git
❌ Use production keys in development
❌ Hardcode keys in source code

---

## 🚀 Quick Start (Without API Keys)

If you just want to **test the app** without API keys:

1. Don't set any API keys
2. Set `DETECTION_MODE=mock`
3. The app will use demo data
4. All features work, just with simulated results

### Start with Mock Mode:

```bash
# Clone the repo
git clone <repo-url>
cd trustlens2

# Install dependencies
npm install

# Create .env with just these:
echo "DETECTION_MODE=mock" > .env
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env

# Start the app
npm run dev
```

---

## 📊 API Response Format

### Hive AI Response Example:

```json
{
  "status": "success",
  "output": [
    {
      "classes": {
        "ai-generated": 0.92,
        "not-ai-generated": 0.08
      },
      "label": "ai-generated"
    }
  ]
}
```

### Sightengine Response Example:

```json
{
  "status": "success",
  "type": {
    "ai_generated": 0.85,
    "ai_manipulated": 0.12
  },
  "faces": [
    {
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 200
    }
  ]
}
```

---

## ❓ FAQ

### Q: Can I use the app without API keys?
**A:** Yes! Set `DETECTION_MODE=mock` and the app works with demo data.

### Q: Are API keys free?
**A:** Most providers offer free tiers (1000-2000 requests/month). Paid plans start at $29-49/month.

### Q: Which API should I start with?
**A:** For testing: Mock mode. For production: Start with Sightengine (cheaper) or Hive AI (better deepfake detection).

### Q: Can I use multiple APIs?
**A:** Yes! TrustLens supports multiple providers. Results are combined for better accuracy.

### Q: How do I know if my API key works?
**A:** Set `DETECTION_MODE=production` and try analyzing an image. Check the console for errors.

---

## 🆘 Troubleshooting

### Error: "API key invalid"
- Check the key is copied correctly
- No extra spaces or quotes
- Key hasn't expired

### Error: "Rate limit exceeded"
- You've used all free requests
- Wait for next month or upgrade plan

### Error: "Connection timeout"
- Check internet connection
- API might be down (check status page)
- Increase timeout in .env

### Error: "No provider results"
- At least one API key must be valid
- Check `DETECTION_MODE` setting
- Verify API credentials

---

## 📞 Support Links

- **Hive AI**: https://thehive.ai/support
- **Sightengine**: https://sightengine.com/contact
- **TrustLens Issues**: Create GitHub issue

---

## 🎯 Summary

| Mode | API Keys Needed | Cost | Best For |
|------|----------------|------|----------|
| Mock | ❌ No | Free | Testing, Development |
| Production | ✅ Yes | $29-199/month | Real Analysis |

**Start with Mock Mode, upgrade to Production when ready!**
