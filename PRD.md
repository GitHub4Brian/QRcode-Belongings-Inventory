# Patient Belongings Audio Inventory App: Technical Specification Research

**A mobile-first web application converting voice recordings into structured patient belongings inventories with QR export for EHR integration—built without persistent storage for PHI safety.**

This specification addresses the core challenge facing Emergency Department staff: quickly documenting patient belongings using voice input, automatically structuring that data via AI, and generating scannable QR codes compatible with Cerner and Epic EHR systems. The architecture eliminates PHI storage risks by maintaining data only in browser memory.

## Browser-native speech recognition delivers 85% coverage with critical iOS caveats

The Web Speech API provides native voice-to-text capability across **iOS Safari (14.5+)** and **Android Chrome**, covering approximately 85% of global mobile browser usage. However, implementation requires careful handling of platform-specific behaviors that significantly impact the user experience.

**Core API configuration for inventory capture:**
```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;     // Single-phrase mode (iOS-safe)
recognition.interimResults = true;  // Real-time transcription display
recognition.lang = 'en-US';
```

### iOS Safari presents the most significant implementation challenges

Safari on iOS exhibits behaviors that require specific workarounds. The `continuous` mode produces a forever-increasing single text result rather than discrete phrases—making it essentially useless for inventory item capture. The workaround uses single-phrase mode with automatic restart after each recognized item.

**Critical iOS limitations:**
- Speech Recognition **does not work in installed PWAs** (home screen apps)—only in Safari browser itself
- Safari takes 2-3 seconds after permission grant before capturing voice
- The `isFinal` property may always return `false`, causing never-ending recognition
- All iOS browsers (Chrome, Firefox, Edge) use WebKit and inherit Safari's behavior

**iOS-compatible restart pattern:**
```javascript
recognition.onend = () => {
  if (shouldContinueListening) {
    setTimeout(() => recognition.start(), 100); // Auto-restart for next item
  }
};
```

### Microphone permissions require strategic UX timing

Permission requests should occur only when users initiate a voice feature—never on page load. A **permission primer** pattern displays an explanatory modal before the browser's permission prompt appears, explaining why microphone access is needed and what to expect.

Once permissions are denied, browsers will not re-prompt. Users must manually change settings through their device's site settings. The application should detect denied permissions via `navigator.permissions.query()` and display platform-specific instructions (iOS Settings → Safari → Microphone; Android address bar → Site Settings).

**Real-time transcription** should display interim results in gray/italic styling while final results appear in black/bold. This provides immediate feedback that the system is actively listening, critical in noisy ED environments where staff may question whether their voice is being captured.

### Fallback to manual text input is mandatory

Approximately 15% of users will encounter unsupported browsers or denied permissions. A text input fallback should always be visible, allowing items to be typed manually. Feature detection determines which interface to present:
```javascript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  showManualInputInterface();
}
```

### Network connectivity is required for speech recognition

Web Speech API sends audio to Google (Android) or Apple (iOS) servers for processing. The application will not function offline, and a clear error message should appear when network connectivity fails. For HIPAA-conscious deployments, note that audio is transmitted to third-party servers—though the audio itself is ephemeral and not patient-identifying, this should be documented in compliance reviews.

---

## QR code generation must stay under 2,000 bytes for reliable EHR scanning

QR codes containing the actual inventory text (not URLs) face strict capacity limits. While the theoretical maximum for QR codes is approximately 2,953 bytes at the lowest error correction level, **practical reliability requires staying under 2,000 bytes** with Error Correction Level M (15% error resistance).

### Library recommendation: node-qrcode

The `qrcode` npm package (often called node-qrcode) provides the best balance of reliability, bundle size (~30KB), and features for this use case:

| Library | Size | Key Advantage | Maintenance |
|---------|------|---------------|-------------|
| **qrcode** | ~30KB | Auto-optimizes encoding, promises | Active |
| qrcodejs | ~15KB | Zero dependencies | Low |
| qr-code-styling | ~50KB | Custom styling/logos | Medium |

**Auto-optimization** in qrcode is particularly valuable—it automatically selects the most efficient encoding mode (numeric, alphanumeric, byte) segment-by-segment, producing smaller QR codes for the same data.

### Size validation must provide real-time feedback

Users need immediate visibility into whether their inventory will fit in a QR code:
```javascript
function getInventorySize(text) {
  const bytes = new TextEncoder().encode(text).length;
  return {
    bytes,
    percentUsed: (bytes / 2000 * 100).toFixed(1),
    status: bytes > 2000 ? 'danger' : bytes > 1500 ? 'warning' : 'safe'
  };
}
```

Display a progress indicator showing capacity usage, with warnings at 75% and blocking at 100%. If the inventory exceeds capacity, the application should offer options: truncate descriptions, remove items, or split into multiple QR codes.

### Error correction level M balances capacity with reliability

| Level | Error Resistance | UTF-8 Capacity |
|-------|------------------|----------------|
| L | ~7% | 2,953 bytes |
| **M** | ~15% | **2,331 bytes** |
| Q | ~25% | 1,663 bytes |
| H | ~30% | 1,273 bytes |

Level M is recommended—it provides sufficient error correction for hospital environments (slight screen damage, moderate scanning angles) while maximizing data capacity. Level H would reduce capacity too significantly for practical inventory lists.

---

## EHR scanners operate as keyboard wedge devices

Both Cerner and Epic integrate with standard healthcare-grade 2D barcode scanners from Zebra and Honeywell. These scanners operate in **HID (Human Interface Device) keyboard wedge mode**—the scanner appears to the computer as a keyboard, and scanned data is "typed" at the cursor position in whichever field has focus.

### Scanning behavior implications for text formatting

When a QR code is scanned, the scanner rapidly "types" the encoded text character by character. This has critical implications for how inventory data should be formatted:

**Line break handling is platform-dependent.** Carriage Return characters (CR, `\r`) typically trigger the Enter key—which may submit a form or advance to the next field rather than creating a new line. Line Feed characters (`\n`) may be interpreted as newlines or ignored entirely depending on scanner configuration.

**Recommended text format for maximum compatibility:**
```
PATIENT BELONGINGS
-------------------
1. Leather Wallet (black, contains credit cards, ~$40 cash)
2. iPhone 13 (cracked screen)
3. Wedding Band (gold)
4. Timex Watch (silver)
5. North Face Jacket (blue)
6. Reading Glasses (in case)
-------------------
Items: 6 | Date: [timestamp]
```

This format uses simple line breaks and avoids special characters that might confuse scanners. An alternative for form-field compatibility uses pipe separators: `Wallet | iPhone | Ring | Watch | Jacket | Glasses`

### Cerner and Epic integration patterns

**Cerner (Oracle Health)** uses barcode-driven workflows through CareAware DeviceLink for vitals and medication scanning. Scanned text populates whatever field has cursor focus. The PowerChart application accepts pasted text in comment and note fields.

**Epic** uses the Rover mobile application for barcode workflows, integrating with CortexDecoder SDK for camera-based scanning. Epic's text fields accept pasted content with preserved formatting. SmartPhrases ("dot phrases") provide quick text insertion that complements scanned inventory data.

Both systems expect plain text—no special formatting codes or markup. Testing with actual scanner hardware and target EHR fields is essential before deployment.

---

## Mobile-first UI requires 56px touch targets for gloved hospital hands

Hospital Emergency Department staff often work with gloves, in bright lighting, and need one-handed operation while managing patient care. These constraints drive specific UI requirements that generic mobile design patterns don't address.

### Framework recommendation: Pico CSS (11KB) or vanilla CSS

For a lightweight, single-purpose application, **Pico CSS** offers the best balance of features and bundle size:
- **11KB gzipped**—minimal impact on load time
- **Semantic HTML styling**—styles apply directly to `<button>`, `<input>`, `<form>` without CSS classes
- **Built-in dark/light mode** adapting to user preferences
- **130+ CSS variables** for customization
- **No JavaScript required** for core styling

For maximum control with even smaller footprint, **Milligram (2KB)** or pure vanilla CSS with modern features (CSS Grid, Flexbox, custom properties) eliminates all framework overhead.

### Recording interface patterns for ED use

The **tap-to-start/stop toggle** pattern works best for inventory capture—staff need hands-free recording while examining items. A large **80×80px circular record button** positioned at the bottom center of the screen ensures easy thumb reach on any phone held in one hand.

**Essential visual feedback during recording:**
- Pulsing red dot indicator (universal recording symbol)
- Timer display showing recording duration
- Audio level bars confirming microphone is capturing sound
- Button state change from microphone icon to square stop icon

### Hospital environment accessibility requirements

| Requirement | Specification | Rationale |
|-------------|---------------|-----------|
| Touch targets | **56px minimum** | Gloved fingers, rushed interactions |
| Contrast ratio | **4.5:1 minimum** (aim for 7:1) | Bright OR/ED lighting |
| Font size | **16px minimum** base | Quick readability |
| Color usage | Color + icon + text | Never rely on color alone |

**One-handed operation** places all primary actions in the bottom third of the screen—the natural thumb zone. Navigation and secondary actions can be placed higher, but the record button, submit button, and QR display must all be reachable with the thumb of the holding hand.

---

## Session-only architecture eliminates PHI storage through JavaScript memory isolation

The defining architectural decision—storing all data only in JavaScript runtime memory—provides the strongest possible PHI protection by making data persistence physically impossible.

### What "no persistent storage" means technically

**Allowed:** JavaScript variables, React/Vue state, in-memory objects
**Prohibited:** localStorage, sessionStorage, IndexedDB, cookies, Service Workers with caching

```javascript
// All application state lives here—and only here
const appState = {
  inventory: [],           // Cleared on page close
  transcription: '',       // Never written to disk
  qrCodeData: null        // Exists only in memory
};
```

When the browser tab closes, all data is irreversibly destroyed. There is no recovery mechanism—**this is the point.** Page refresh also clears data, which should be documented to users.

### User communication about data ephemerality

**Onboarding modal (required on first use):**
```
⚠️ IMPORTANT: This tool does not save data

• All entered information exists only in this browser tab
• Closing or refreshing will permanently erase all data  
• Generate the QR code and scan it before closing
• No patient information is stored on any server

[ ] I understand this data is temporary
[Continue]
```

A persistent **status indicator** should appear in the header: "🔒 Session only • Data not saved"

**beforeunload warning** prompts users before accidental closure—though this is unreliable on mobile Safari, which may terminate pages without warning:
```javascript
window.addEventListener('beforeunload', (e) => {
  if (inventoryHasItems) {
    e.preventDefault();
    e.returnValue = ''; // Shows browser's generic warning
  }
});
```

### Security headers for PHI-adjacent applications

Even without storing PHI directly, healthcare-context applications require defensive security configuration:

```http
Cache-Control: no-store, no-cache, must-revalidate
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

**HTTPS is mandatory**—both for security and because Web Speech API requires a secure context.

Form inputs should include `autocomplete="off"` to prevent browsers from caching entered data in autofill suggestions.

---

## AI API integration converts rambling transcriptions to structured inventory lists

The core AI task—transforming unstructured voice transcription into categorized inventory items—is a straightforward text-transformation suitable for smaller, faster models.

### Claude Haiku 4.5 offers optimal speed/cost/quality for this task

| Model | Input/1M tokens | Output/1M tokens | Speed | Recommendation |
|-------|-----------------|------------------|-------|----------------|
| Claude Haiku 3 | $0.25 | $1.25 | Fastest | Budget option |
| **Claude Haiku 4.5** | $1.00 | $5.00 | Very fast | **Recommended** |
| GPT-4o-mini | $0.15 | $0.60 | Fast | Cheapest |

For a typical inventory transcription (~200 input tokens, ~300 output tokens), **cost per request is approximately $0.0017** with Claude Haiku 4.5—roughly $50/month at 1,000 requests per day.

### Claude now supports direct browser API calls

A significant discovery: Anthropic added CORS support for browser-direct API calls using a special header:
```javascript
fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": userApiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true", // Enables CORS
    "content-type": "application/json"
  },
  // ...
});
```

This enables a **"bring your own API key"** pattern where hospital IT provides staff with a department API key, eliminating the need for a backend proxy entirely.

### Structured outputs guarantee valid JSON

Claude's structured outputs feature (beta as of November 2025) guarantees response JSON matches a defined schema—eliminating parsing errors:
```javascript
{
  output_format: {
    type: "json_schema",
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              category: { 
                type: "string", 
                enum: ["clothing", "electronics", "documents", "jewelry", "accessories", "medical", "other"]
              },
              description: { type: "string" },
              quantity: { type: "integer" }
            },
            required: ["title", "category", "description"]
          }
        }
      }
    }
  }
}
```

### Prompt engineering for inventory extraction

**System prompt:**
```
You are processing voice transcriptions of hospital patient belongings for inventory tracking. Extract each distinct item with:
- title: Brief item name (e.g., "Leather Wallet")  
- category: One of [clothing, electronics, documents, jewelry, accessories, medical, other]
- description: Detailed description including color, brand, condition, contents
- quantity: Number of items (default 1)
```

**Example transformation:**

*Input transcription:*
> "Um so the patient came in with, let me see, a black leather wallet with some credit cards and about forty dollars cash, they had their iPhone 13 with a cracked screen..."

*Output:*
```json
{
  "items": [
    {
      "title": "Leather Wallet",
      "category": "accessories",
      "description": "Black leather wallet containing credit cards and approximately $40 cash",
      "quantity": 1
    },
    {
      "title": "iPhone 13",
      "category": "electronics",
      "description": "Apple iPhone 13 with cracked screen",
      "quantity": 1
    }
  ]
}
```

### API key security without a backend

For production deployments where exposing user API keys is unacceptable, a **minimal Cloudflare Workers proxy** provides key security with zero infrastructure cost:

```javascript
// Cloudflare Worker (~20 lines)
export default {
  async fetch(request, env) {
    const body = await request.json();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY, // Secret stored in Worker
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

Cloudflare Workers' free tier includes **100,000 requests per day**—sufficient for most hospital deployments.

---

## Architecture recommendation for future extensibility

The specification notes that value estimation via web search is a planned future enhancement. The architecture should accommodate this with minimal refactoring:

**Current state:**
```
[Voice Input] → [Transcription] → [AI Structuring] → [QR Generation]
```

**Future state with value estimation:**
```
[Voice Input] → [Transcription] → [AI Structuring] → [Value Lookup] → [QR Generation]
                                                           ↓
                                                   [Web Search API]
```

The item structure already includes fields that can accommodate estimated values:
```javascript
{
  title: "iPhone 13",
  category: "electronics",
  description: "Apple iPhone 13 with cracked screen",
  estimatedValue: null,        // Future: populate via web search
  valueSource: null,           // Future: "eBay average" or "Amazon listing"
  valueConfidence: null        // Future: "high" | "medium" | "low"
}
```

Keeping the architecture modular—with AI processing as a discrete step—allows value estimation to be inserted as an additional processing stage without restructuring the core workflow.

---

## Implementation priority recommendations

**Phase 1 (MVP):**
1. Voice capture with Web Speech API + manual fallback
2. Basic AI structuring with Claude Haiku
3. QR code generation with size validation
4. Plain text export format for EHR scanning

**Phase 2 (Production hardening):**
1. iOS-specific workarounds and extensive mobile testing
2. Cloudflare Workers proxy for API key security
3. Structured outputs for guaranteed JSON
4. Comprehensive error handling and retry logic

**Phase 3 (Enhancement):**
1. Value estimation via web search APIs
2. Category-specific prompts for better extraction
3. Multi-QR support for large inventories
4. Print-friendly inventory sheet generation

This architecture delivers a functional, secure, healthcare-appropriate application with a clear path to enhanced capabilities as requirements evolve.