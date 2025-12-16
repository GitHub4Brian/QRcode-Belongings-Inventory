import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

// Calculate byte size of text
const getByteSize = (text) => new TextEncoder().encode(text).length;

// Categories for inventory items
const CATEGORIES = [
  { value: 'clothing', label: 'Clothing', icon: '👔' },
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'documents', label: 'Documents', icon: '📄' },
  { value: 'jewelry', label: 'Jewelry', icon: '💍' },
  { value: 'accessories', label: 'Accessories', icon: '👜' },
  { value: 'medical', label: 'Medical', icon: '💊' },
  { value: 'other', label: 'Other', icon: '📦' }
];

// Onboarding Modal Component
const OnboardingModal = ({ onAccept }) => {
  const [understood, setUnderstood] = useState(false);
  
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        maxWidth: '400px', width: '100%', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ textAlign: 'center', marginBottom: '16px', fontFamily: 'DM Sans, sans-serif' }}>
          Important: No Data Storage
        </h2>
        <div style={{ marginBottom: '20px', fontFamily: 'DM Sans, sans-serif' }}>
          <p>This tool is designed for <strong>PHI safety</strong>. Please understand:</p>
          <ul style={{ marginTop: '12px', paddingLeft: '24px' }}>
            <li style={{ padding: '6px 0' }}>All information exists <strong>only in this browser tab</strong></li>
            <li style={{ padding: '6px 0' }}>Closing or refreshing will <strong>permanently erase</strong> all data</li>
            <li style={{ padding: '6px 0' }}>Generate and scan the QR code <strong>before closing</strong></li>
            <li style={{ padding: '6px 0' }}>No patient information is stored on any server</li>
          </ul>
        </div>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
        }}>
          <input 
            type="checkbox" 
            checked={understood} 
            onChange={(e) => setUnderstood(e.target.checked)}
            style={{ width: '20px', height: '20px', accentColor: '#0d9488' }}
          />
          <span>I understand this data is temporary</span>
        </label>
        <button 
          disabled={!understood}
          onClick={onAccept}
          style={{
            width: '100%', padding: '14px 24px', fontSize: '1rem', fontWeight: '600',
            fontFamily: 'DM Sans, sans-serif', border: 'none', borderRadius: '12px',
            background: understood ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : '#e2e8f0',
            color: understood ? 'white' : '#94a3b8', cursor: understood ? 'pointer' : 'not-allowed'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Recording Button Component
const RecordButton = ({ isRecording, onClick, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '80px', height: '80px', borderRadius: '50%', border: 'none',
      background: isRecording 
        ? 'linear-gradient(145deg, #fecaca, #fca5a5)' 
        : 'linear-gradient(145deg, #f0f4f7, #e2e8f0)',
      boxShadow: isRecording 
        ? '6px 6px 12px rgba(239, 68, 68, 0.3), -6px -6px 12px #ffffff'
        : '6px 6px 12px #d1d5db, -6px -6px 12px #ffffff',
      cursor: 'pointer', position: 'relative', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}
  >
    <div style={{
      width: isRecording ? '32px' : '56px',
      height: isRecording ? '32px' : '56px',
      borderRadius: isRecording ? '8px' : '50%',
      background: isRecording ? '#ef4444' : '#0d9488',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s'
    }}>
      {isRecording ? (
        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '4px' }} />
      ) : (
        <svg viewBox="0 0 24 24" fill="white" style={{ width: '28px', height: '28px' }}>
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      )}
    </div>
  </button>
);

// Inventory Item Card Component
const InventoryItem = ({ item, index, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(item);
  const categoryInfo = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[6];

  if (isEditing) {
    return (
      <div style={{
        background: '#f0f4f7', borderRadius: '12px', padding: '14px',
        border: '2px solid #0d9488', boxShadow: '0 0 0 3px rgba(13, 148, 136, 0.1)'
      }}>
        <input
          type="text" value={editData.title}
          onChange={(e) => setEditData({...editData, title: e.target.value})}
          placeholder="Item title"
          style={{
            width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
            borderRadius: '8px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem',
            marginBottom: '8px', fontWeight: '600'
          }}
        />
        <select
          value={editData.category}
          onChange={(e) => setEditData({...editData, category: e.target.value})}
          style={{
            width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
            borderRadius: '8px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem',
            marginBottom: '8px', background: 'white'
          }}
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
          ))}
        </select>
        <textarea
          value={editData.description}
          onChange={(e) => setEditData({...editData, description: e.target.value})}
          placeholder="Description" rows={2}
          style={{
            width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
            borderRadius: '8px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem',
            marginBottom: '8px', resize: 'none'
          }}
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={() => { setEditData(item); setIsEditing(false); }}
            style={{
              padding: '8px 16px', fontSize: '0.875rem', border: '1px solid #e2e8f0',
              borderRadius: '8px', background: 'white', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
            }}>Cancel</button>
          <button onClick={() => { onUpdate(index, editData); setIsEditing(false); }}
            style={{
              padding: '8px 16px', fontSize: '0.875rem', border: 'none',
              borderRadius: '8px', background: '#0d9488', color: 'white',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: '600'
            }}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#f0f4f7', borderRadius: '12px', padding: '14px',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '1.25rem' }}>{categoryInfo.icon}</span>
        <span style={{ fontWeight: '600', flex: 1, fontFamily: 'DM Sans, sans-serif' }}>{item.title}</span>
        <span style={{
          fontSize: '0.75rem', color: '#64748b', background: 'white',
          padding: '2px 8px', borderRadius: '9999px'
        }}>#{index + 1}</span>
      </div>
      <p style={{
        fontSize: '0.875rem', color: '#64748b', marginBottom: '10px',
        lineHeight: '1.4', fontFamily: 'DM Sans, sans-serif'
      }}>{item.description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.75rem', color: '#0d9488', fontWeight: '500',
          background: 'rgba(13, 148, 136, 0.1)', padding: '4px 10px',
          borderRadius: '9999px', fontFamily: 'DM Sans, sans-serif'
        }}>{categoryInfo.label}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setIsEditing(true)} style={{
            width: '40px', height: '40px', border: 'none', background: 'transparent',
            borderRadius: '8px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#64748b'
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => onDelete(index)} style={{
            width: '40px', height: '40px', border: 'none', background: 'transparent',
            borderRadius: '8px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#ef4444'
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Size Indicator Component
const SizeIndicator = ({ currentBytes, maxBytes = 2000 }) => {
  const percentage = Math.min((currentBytes / maxBytes) * 100, 100);
  const status = percentage > 100 ? 'danger' : percentage > 75 ? 'warning' : 'safe';
  const colors = { safe: '#22c55e', warning: '#f59e0b', danger: '#ef4444' };
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        height: '8px', background: '#f0f4f7', borderRadius: '9999px', overflow: 'hidden', marginBottom: '6px'
      }}>
        <div style={{
          height: '100%', background: colors[status], borderRadius: '9999px',
          width: `${Math.min(percentage, 100)}%`, transition: 'width 0.3s'
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem',
        color: '#64748b', fontFamily: 'DM Sans, sans-serif'
      }}>
        <span>{currentBytes.toLocaleString()} / {maxBytes.toLocaleString()} bytes</span>
        <span style={{ fontWeight: '500', color: colors[status] }}>
          {status === 'danger' && '⚠️ Too large for QR'}
          {status === 'warning' && '⚡ Approaching limit'}
          {status === 'safe' && '✓ Ready'}
        </span>
      </div>
    </div>
  );
};

// Main App Component
export default function PatientBelongingsApp() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [error, setError] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [manualInput, setManualInput] = useState('');
  
  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setSpeechSupported(false);
  }, []);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript + ' ';
        else interim += transcript;
      }
      if (final) setTranscription(prev => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      // Handle different error types with user-friendly messages
      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access denied. Please enable microphone permissions in your browser settings.');
          break;
        case 'no-speech':
          // No speech detected - not really an error, just silence
          break;
        case 'aborted':
          // User stopped recording - this is expected, not an error
          break;
        case 'network':
          setError('Network error. Please check your internet connection and try again.');
          break;
        case 'audio-capture':
          setError('Microphone not available. Please check that your microphone is connected.');
          break;
        default:
          // Only show error for unexpected issues
          console.warn('Speech recognition issue:', event.error);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        setTimeout(() => { try { recognition.start(); } catch (e) {} }, 100);
      } else {
        setIsRecording(false);
      }
    };

    return recognition;
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      shouldRestartRef.current = false;
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setError(null);
      if (!recognitionRef.current) recognitionRef.current = initRecognition();
      if (recognitionRef.current) {
        try {
          shouldRestartRef.current = true;
          await recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          setError('Failed to start recording. Please try again.');
        }
      }
    }
  };

  const processTranscription = async () => {
    const textToProcess = transcription || manualInput;
    if (!textToProcess.trim()) {
      setError('Please record or enter some text first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Get API key from environment or prompt user
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const apiProxyUrl = import.meta.env.VITE_API_PROXY_URL;
    
    if (!apiKey && !apiProxyUrl) {
      setError('API key not configured. Please set VITE_ANTHROPIC_API_KEY or VITE_API_PROXY_URL in .env file.');
      setIsProcessing(false);
      return;
    }

    try {
      const apiUrl = apiProxyUrl || "https://api.anthropic.com/v1/messages";
      const headers = {
        "Content-Type": "application/json",
      };

      // Add API key header if using direct API (not proxy)
      if (!apiProxyUrl && apiKey) {
        headers["x-api-key"] = apiKey;
        headers["anthropic-version"] = "2023-06-01";
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are processing a voice transcription of hospital patient belongings for inventory tracking. Extract each distinct item and return ONLY valid JSON (no markdown, no explanation).

IMPORTANT - Use appearance-based descriptions, NOT material value terms:
- Instead of "gold" → use "yellow metal" or "yellow-colored"
- Instead of "silver" → use "grey metallic" or "silver-colored"  
- Instead of "diamond" → use "clear gem" or "clear stone"
- Instead of "platinum" → use "white metal"
- Instead of "pearl" → use "white bead" or "iridescent bead"
- Never assume authenticity of materials - describe only what is visually apparent

Return format:
{"items":[{"title":"Brief item name","category":"one of: clothing, electronics, documents, jewelry, accessories, medical, other","description":"Detailed description including color, brand, condition, contents - use appearance-based terms for materials"}]}

Transcription to process:
"${textToProcess}"

Remember: Return ONLY the JSON object, nothing else.`
          }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || 'API error');

      const content = data.content[0].text;
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      if (parsed.items && Array.isArray(parsed.items)) {
        setItems(prev => [...prev, ...parsed.items]);
        setTranscription('');
        setManualInput('');
        setInterimTranscript('');
      }
    } catch (e) {
      setError('Failed to process. Try again or add items manually.');
      console.error('Processing error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInventoryText = () => {
    const timestamp = new Date().toLocaleString();
    let text = `PATIENT BELONGINGS INVENTORY\nGenerated: ${timestamp}\n${'─'.repeat(30)}\n\n`;
    items.forEach((item, i) => {
      const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[6];
      text += `${i + 1}. ${item.title}\n   Category: ${cat.label}\n   ${item.description}\n\n`;
    });
    text += `${'─'.repeat(30)}\nTotal Items: ${items.length}`;
    return text;
  };

  const inventoryText = generateInventoryText();
  const currentBytes = getByteSize(inventoryText);
  const canGenerateQR = items.length > 0 && currentBytes <= 2000;

  // Generate QR code when modal opens - using proper qrcode library with Error Correction Level M
  useEffect(() => {
    if (showQR && inventoryText) {
      QRCode.toDataURL(inventoryText, {
        errorCorrectionLevel: 'M', // 15% error resistance as per PRD
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => {
          console.error('QR Code generation error:', err);
          setError('Failed to generate QR code');
        });
    }
  }, [showQR, inventoryText]);

  if (showOnboarding) return <OnboardingModal onAccept={() => setShowOnboarding(false)} />;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto', background: '#f0f4f7',
      fontFamily: 'DM Sans, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        color: 'white', padding: '16px 20px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
          Belongings Inventory
        </h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.15)', padding: '6px 12px',
          borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '500'
        }}>
          <span>🔒</span>
          <span>Session Only</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Recording Section */}
        <section style={{
          background: 'white', borderRadius: '16px', padding: '20px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '8px' }}>Record Items</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '16px' }}>
            Describe patient belongings aloud or type below
          </p>
          
          <div style={{
            background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '12px',
            padding: '16px', minHeight: '80px', marginBottom: '12px', fontSize: '0.9375rem'
          }}>
            {transcription && <span style={{ color: '#1e293b' }}>{transcription}</span>}
            {interimTranscript && <span style={{ color: '#64748b', fontStyle: 'italic' }}>{interimTranscript}</span>}
            {!transcription && !interimTranscript && (
              <span style={{ color: '#64748b' }}>
                {isRecording ? 'Listening...' : 'Tap the microphone to start recording'}
              </span>
            )}
          </div>

          {!speechSupported && (
            <div style={{
              background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '12px',
              padding: '12px', marginBottom: '12px', fontSize: '0.875rem'
            }}>
              Voice input not supported in this browser. Please type below:
            </div>
          )}
          
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Or type items here: 'black leather wallet with credit cards, iPhone 13 with cracked screen...'"
            rows={3}
            style={{
              width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem', resize: 'none', marginBottom: '16px'
            }}
          />

          {speechSupported && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0 20px' }}>
              <RecordButton isRecording={isRecording} onClick={toggleRecording} disabled={isProcessing} />
              <span style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '12px' }}>
                {isRecording ? 'Tap to stop' : 'Tap to record'}
              </span>
            </div>
          )}

          <button 
            onClick={processTranscription}
            disabled={isProcessing || (!transcription.trim() && !manualInput.trim())}
            style={{
              width: '100%', padding: '14px 24px', fontSize: '1rem', fontWeight: '600',
              fontFamily: 'DM Sans, sans-serif', border: 'none', borderRadius: '12px',
              background: (isProcessing || (!transcription.trim() && !manualInput.trim())) 
                ? '#e2e8f0' : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: (isProcessing || (!transcription.trim() && !manualInput.trim())) ? '#94a3b8' : 'white',
              cursor: (isProcessing || (!transcription.trim() && !manualInput.trim())) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            {isProcessing ? (
              <>
                <div style={{
                  width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Processing...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                Process with AI
              </>
            )}
          </button>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px',
              borderRadius: '12px', fontSize: '0.875rem', marginTop: '12px',
              background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca'
            }}>
              <span>⚠️</span> {error}
            </div>
          )}
        </section>

        {/* Inventory List Section */}
        <section style={{
          background: 'white', borderRadius: '16px', padding: '20px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Inventory ({items.length} items)</h2>
            <button onClick={() => setItems(prev => [...prev, { title: 'New Item', category: 'other', description: 'Enter description' }])}
              style={{
                padding: '8px 16px', fontSize: '0.875rem', border: '1px solid #e2e8f0',
                borderRadius: '8px', background: 'white', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif'
              }}>+ Add Item</button>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.5 }}>📋</div>
              <p style={{ fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>No items yet</p>
              <span style={{ fontSize: '0.875rem' }}>Record or type belongings above, then process with AI</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item, index) => (
                <InventoryItem
                  key={index} item={item} index={index}
                  onUpdate={(i, data) => setItems(prev => prev.map((item, idx) => idx === i ? data : item))}
                  onDelete={(i) => setItems(prev => prev.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
          )}
        </section>

        {/* QR Export Section */}
        {items.length > 0 && (
          <section style={{
            background: 'white', borderRadius: '16px', padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px' }}>Export to EHR</h2>
            
            <SizeIndicator currentBytes={currentBytes} maxBytes={2000} />
            
            {!canGenerateQR && currentBytes > 2000 && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px',
                borderRadius: '12px', fontSize: '0.875rem', marginTop: '12px',
                background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a'
              }}>
                <span>⚠️</span> Inventory too large for QR code. Remove items or shorten descriptions.
              </div>
            )}

            <button 
              onClick={() => setShowQR(true)}
              disabled={!canGenerateQR}
              style={{
                width: '100%', padding: '16px 32px', fontSize: '1.0625rem', fontWeight: '600',
                fontFamily: 'DM Sans, sans-serif', border: 'none', borderRadius: '12px',
                background: canGenerateQR ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : '#e2e8f0',
                color: canGenerateQR ? 'white' : '#94a3b8',
                cursor: canGenerateQR ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px'
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v3h-2v-1h-1v-2zm-3 3h2v3h-2v-3zm5 0h1v3h-3v-1h2v-2z"/>
              </svg>
              Generate QR Code
            </button>
          </section>
        )}
      </main>

      {/* QR Code Modal */}
      {showQR && (
        <div onClick={() => setShowQR(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '20px', zIndex: 1000
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white', borderRadius: '16px', padding: '24px',
            maxWidth: '400px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '8px', fontFamily: 'DM Sans, sans-serif' }}>Scan with EHR Scanner</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '20px', fontFamily: 'DM Sans, sans-serif' }}>
              Position the QR code for your Cerner or Epic scanner
            </p>
            
            <div style={{
              background: 'white', padding: '16px', borderRadius: '12px',
              display: 'inline-block', marginBottom: '20px', border: '1px solid #e2e8f0'
            }}>
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Inventory QR Code"
                  style={{ display: 'block', width: '280px', height: '280px' }}
                />
              ) : (
                <div style={{ 
                  width: '280px', height: '280px', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center',
                  color: '#64748b', fontSize: '0.875rem'
                }}>
                  Generating QR code...
                </div>
              )}
            </div>
            
            <div style={{
              textAlign: 'left', background: '#f0f4f7', borderRadius: '12px',
              padding: '12px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                color: '#64748b', marginBottom: '8px', fontFamily: 'DM Sans, sans-serif'
              }}>Preview:</h3>
              <pre style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#1e293b'
              }}>{inventoryText}</pre>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(inventoryText).then(() => {
                    const btn = document.getElementById('copyBtn');
                    btn.textContent = '✓ Copied!';
                    setTimeout(() => { btn.textContent = '📋 Copy Text'; }, 2000);
                  });
                }} 
                id="copyBtn"
                style={{
                  flex: 1, padding: '14px 24px', fontSize: '1rem', fontWeight: '600',
                  fontFamily: 'DM Sans, sans-serif', border: 'none',
                  borderRadius: '12px', background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  color: 'white', cursor: 'pointer'
                }}>📋 Copy Text</button>
              <button onClick={() => setShowQR(false)} style={{
                flex: 1, padding: '14px 24px', fontSize: '1rem', fontWeight: '500',
                fontFamily: 'DM Sans, sans-serif', border: '1px solid #e2e8f0',
                borderRadius: '12px', background: 'white', cursor: 'pointer'
              }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '16px 20px', fontSize: '0.75rem',
        color: '#64748b', borderTop: '1px solid #e2e8f0', background: 'white'
      }}>
        Data exists only in this session • No information is stored
      </footer>
      
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

