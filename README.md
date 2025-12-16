# Patient Belongings Audio Inventory App

A mobile-first web application that converts voice recordings into structured patient belongings inventories with QR code export for EHR integration. Built with **zero persistent storage** for maximum PHI safety—all data exists only in browser memory.

## 🎯 Overview

This application solves a critical challenge for Emergency Department staff: quickly documenting patient belongings using voice input, automatically structuring that data via AI, and generating scannable QR codes compatible with Cerner and Epic EHR systems.

### Key Features

- 🎤 **Voice-to-Text Capture** - Native browser speech recognition (85% mobile coverage)
- 🤖 **AI-Powered Structuring** - Converts rambling transcriptions into categorized inventory items
- 📱 **Mobile-First Design** - Optimized for gloved hands and one-handed operation
- 🔒 **Session-Only Storage** - Zero persistent storage—data exists only in browser memory
- 📊 **QR Code Export** - Generate scannable QR codes for EHR integration (Cerner/Epic compatible)
- ✏️ **Manual Input Fallback** - Text input option for unsupported browsers or denied permissions

## 🏗️ Architecture

### Session-Only Data Storage

**The defining feature:** All data exists only in JavaScript runtime memory. When the browser tab closes, all data is permanently destroyed—this is intentional for PHI protection.

**Allowed:**
- JavaScript variables and React state
- In-memory objects

**Prohibited:**
- localStorage, sessionStorage, IndexedDB
- Cookies
- Service Workers with caching
- Any server-side storage

### Technology Stack

- **Frontend Framework:** React (JSX)
- **Speech Recognition:** Web Speech API (native browser support)
- **AI Processing:** Claude Haiku 4.5 via Anthropic API
- **QR Generation:** Custom client-side QR code generator
- **Styling:** Inline styles (mobile-optimized)

## 🚀 Getting Started

### Prerequisites

- Modern web browser with Web Speech API support:
  - **iOS Safari 14.5+** (note: does NOT work in installed PWAs)
  - **Android Chrome** (latest)
  - Desktop browsers (Chrome, Edge, Safari)
- **HTTPS connection** (required for Web Speech API)
- **Network connectivity** (speech recognition requires internet)
- **Anthropic API key** (for AI processing)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Belongings-Inventory
```

2. Install dependencies (if using a build system):
```bash
npm install
```

3. Configure API access:
   - For development: Add your Anthropic API key directly in the code (see API Integration section)
   - For production: Use a Cloudflare Workers proxy (recommended)

4. Serve the application:
   - Use any static file server (e.g., `python -m http.server`, `npx serve`)
   - Ensure HTTPS is enabled (required for Web Speech API)

### Browser Compatibility

| Platform | Browser | Status | Notes |
|----------|---------|--------|-------|
| iOS 14.5+ | Safari | ✅ Supported | Does NOT work in installed PWAs |
| iOS | Chrome/Firefox/Edge | ⚠️ Limited | Uses WebKit, inherits Safari limitations |
| Android | Chrome | ✅ Supported | Full support |
| Desktop | Chrome/Edge | ✅ Supported | Full support |
| Desktop | Safari | ✅ Supported | Full support |
| Desktop | Firefox | ⚠️ Limited | May require polyfills |

**Coverage:** ~85% of global mobile browser usage

## 📖 Usage

### Basic Workflow

1. **Open the application** in a supported browser
2. **Accept the onboarding modal** (explains data ephemerality)
3. **Record items** by tapping the microphone button and describing belongings aloud
   - Example: *"Black leather wallet with credit cards and about forty dollars cash, iPhone 13 with cracked screen, gold wedding band..."*
4. **Process with AI** - Tap "Process with AI" to convert transcription into structured items
5. **Review and edit** - Items appear as cards that can be edited or deleted
6. **Generate QR code** - Once inventory is complete, generate QR code for EHR scanning
7. **Scan into EHR** - Use Cerner or Epic scanner to import inventory data

### Manual Input

If voice input isn't available:
- Type items directly in the text area
- Use natural language: *"wallet, phone, ring, watch, jacket"*
- Process with AI to structure the input

### QR Code Size Limits

- **Maximum size:** 2,000 bytes (recommended)
- **Error correction:** Level M (15% error resistance)
- **Real-time feedback:** Progress indicator shows capacity usage
- **Warnings:** At 75% capacity, blocking at 100%

If inventory exceeds capacity:
- Remove items
- Shorten descriptions
- Split into multiple QR codes (future enhancement)

## 🔧 Configuration

### API Integration

#### Option 1: Direct Browser API (Development)

The app supports direct browser calls to Anthropic API using CORS:

```javascript
fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": userApiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
    "content-type": "application/json"
  },
  // ...
});
```

**Note:** This exposes the API key in the browser. Use only for development or with department-shared keys.

#### Option 2: Cloudflare Workers Proxy (Production)

For production deployments, use a minimal Cloudflare Workers proxy:

```javascript
// cloudflare-worker.js
export default {
  async fetch(request, env) {
    const body = await request.json();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });
    return new Response(response.body, {
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
};
```

**Free tier:** 100,000 requests/day (sufficient for most hospital deployments)

### Security Headers

For production deployment, configure these HTTP headers:

```http
Cache-Control: no-store, no-cache, must-revalidate
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

## 🏥 EHR Integration

### Supported Systems

- **Cerner (Oracle Health)** - Scanned text populates focused fields in PowerChart
- **Epic** - Compatible with Rover mobile app and text fields

### QR Code Format

The generated QR code contains plain text in this format:

```
PATIENT BELONGINGS INVENTORY
Generated: [timestamp]
──────────────────────────────

1. Leather Wallet
   Category: Accessories
   Black leather wallet containing credit cards and approximately $40 cash

2. iPhone 13
   Category: Electronics
   Apple iPhone 13 with cracked screen

──────────────────────────────
Total Items: 2
```

### Scanner Compatibility

- **Scanner type:** 2D barcode scanners (Zebra, Honeywell)
- **Mode:** HID keyboard wedge (scanner types data at cursor position)
- **Format:** Plain text with line breaks
- **Testing:** Essential to test with actual scanner hardware before deployment

## ⚠️ Important Limitations

### iOS Safari Specific

- **PWA limitation:** Speech recognition does NOT work in installed PWAs (home screen apps)
- **Permission delay:** 2-3 second delay after permission grant before capturing voice
- **Continuous mode:** Not supported—uses single-phrase mode with auto-restart
- **isFinal property:** May always return `false`, requiring workarounds

### General Limitations

- **Network required:** Speech recognition sends audio to third-party servers (Google/Apple)
- **No offline support:** Application requires internet connectivity
- **Data loss:** Page refresh or tab close permanently erases all data
- **No recovery:** There is no data recovery mechanism (by design)

## 🔒 Security & Privacy

### PHI Protection

- **Zero persistent storage** - Data cannot be recovered after session ends
- **No server storage** - All processing happens client-side or via API (no data retention)
- **HTTPS required** - Secure context mandatory for Web Speech API
- **Browser memory only** - Data exists only in JavaScript runtime

### Compliance Considerations

- **HIPAA:** Application designed for PHI-adjacent use (belongings inventory, not medical records)
- **Audio transmission:** Voice audio sent to Google (Android) or Apple (iOS) servers
- **API usage:** Anthropic API processes transcriptions (check data processing agreements)
- **Documentation:** Document audio transmission and API usage in compliance reviews

### User Communication

The application includes:
- **Onboarding modal** explaining data ephemerality
- **Persistent status indicator** showing "Session Only • Data not saved"
- **beforeunload warning** (unreliable on mobile Safari)

## 🎨 Design Principles

### Mobile-First Requirements

- **Touch targets:** 56px minimum (for gloved hands)
- **Contrast ratio:** 4.5:1 minimum (aim for 7:1 for bright ED lighting)
- **Font size:** 16px minimum base size
- **Color usage:** Never rely on color alone (use icons + text)
- **One-handed operation:** Primary actions in bottom third of screen

### UI Components

- **Record button:** 80×80px circular button, bottom center
- **Visual feedback:** Pulsing red dot, timer, audio level bars during recording
- **Real-time transcription:** Gray/italic for interim, black/bold for final results

## 🛠️ Development

### Project Structure

```
Belongings-Inventory/
├── PatientBelongingsInventory-preview.jsx  # Main React component
├── PRD.md                                    # Technical specification
└── README.md                                 # This file
```

### Key Components

- `OnboardingModal` - First-use data ephemerality warning
- `RecordButton` - Voice recording toggle button
- `InventoryItem` - Editable inventory item card
- `SizeIndicator` - QR code capacity progress bar
- `QRCode` - Client-side QR code generator

### AI Prompt Engineering

The system prompt instructs Claude to:
- Extract distinct items from transcriptions
- Categorize items (clothing, electronics, documents, jewelry, accessories, medical, other)
- Use appearance-based descriptions (avoid material value assumptions)
- Return structured JSON format

### Future Enhancements

**Phase 2 (Production Hardening):**
- iOS-specific workarounds and extensive mobile testing
- Cloudflare Workers proxy for API key security
- Structured outputs for guaranteed JSON
- Comprehensive error handling and retry logic

**Phase 3 (Enhancement):**
- Value estimation via web search APIs
- Category-specific prompts for better extraction
- Multi-QR support for large inventories
- Print-friendly inventory sheet generation

## 📊 Cost Estimates

### AI API Costs (Claude Haiku 4.5)

- **Per request:** ~$0.0017 (200 input tokens, 300 output tokens)
- **Monthly estimate:** ~$50/month at 1,000 requests/day
- **Alternative:** Claude Haiku 3 ($0.25/$1.25 per 1M tokens) or GPT-4o-mini ($0.15/$0.60)

### Infrastructure

- **Hosting:** Static file hosting (Cloudflare Pages, Netlify, etc.) - Free tier sufficient
- **API Proxy:** Cloudflare Workers - Free tier (100K requests/day)
- **Total monthly cost:** ~$50-100 for API usage (no infrastructure costs)

## 🤝 Contributing

This is a healthcare-focused application. Contributions should prioritize:
1. **Security** - Maintain zero-storage architecture
2. **Accessibility** - Support gloved hands and bright lighting
3. **Reliability** - Extensive mobile testing, especially iOS Safari
4. **Documentation** - Clear explanations of PHI handling

## 📝 License

MIT

## 🙏 Acknowledgments

Built for Emergency Department staff who need fast, secure, and reliable patient belongings documentation.

---

**⚠️ Important:** This application does not save data. Always generate and scan the QR code before closing the browser tab.

