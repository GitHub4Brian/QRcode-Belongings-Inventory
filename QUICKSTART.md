# Quick Start Guide

Get the Patient Belongings Inventory App running on localhost in minutes.

## Prerequisites

- **Node.js** 18+ and npm (or yarn/pnpm)
- **Anthropic API key** (get one at https://console.anthropic.com/)

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure API access:**

   Create a `.env` file in the project root:
   ```bash
   # Option 1: Direct browser API (development only)
   VITE_ANTHROPIC_API_KEY=your-api-key-here
   
   # Option 2: Use Cloudflare Workers proxy (recommended for production)
   # VITE_API_PROXY_URL=https://your-worker.your-subdomain.workers.dev
   ```

   **Important:** Never commit `.env` files with real API keys!

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
   - The app will be available at `http://localhost:3000`
   - For mobile device testing, use your computer's IP address (e.g., `http://192.168.1.100:3000`)

## Usage

1. **Accept the onboarding modal** - explains data ephemerality
2. **Record items** - Tap the microphone button and describe belongings
3. **Process with AI** - Tap "Process with AI" to structure the transcription
4. **Review & edit** - Items appear as editable cards
5. **Generate QR code** - Export for EHR scanning when ready

## Troubleshooting

### Microphone not working?
- **Chrome/Edge:** Check browser permissions (lock icon in address bar)
- **Safari (iOS):** Must use Safari browser (not installed PWA)
- **HTTPS required:** Web Speech API needs secure context (localhost works without HTTPS)

### API errors?
- Verify your API key is set in `.env`
- Check network connectivity
- Ensure Anthropic API key has sufficient credits

### Port already in use?
Change the port in `vite.config.js`:
```javascript
server: {
  port: 3001, // Change to available port
}
```

## Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory. Deploy to any static hosting service.

## Mobile Testing

To test on your phone:
1. Find your computer's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start dev server: `npm run dev`
3. On your phone, navigate to `http://YOUR_IP:3000`
4. Ensure phone and computer are on the same network

---

For detailed documentation, see [README.md](./README.md)

