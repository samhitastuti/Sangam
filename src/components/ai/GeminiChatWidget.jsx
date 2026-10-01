import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  MapPin,
  Navigation,
  Compass,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Maximize2,
  Minimize2,
  Clock,
  Car,
  Bus,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

/**
 * Clean inline markdown renderer for chat messages
 * Formats bold text, links, headings, and bullet points
 */
function MarkdownRenderer({ content, isUser }) {
  if (!content) return null;

  // Split by double newlines for paragraphs
  const blocks = content.split(/\n\n+/);

  return (
    <div className={`space-y-2.5 ${isUser ? 'text-white' : 'text-slate-800'}`}>
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n');

        // Check if block is a heading
        if (lines.length === 1 && lines[0].startsWith('#')) {
          const headingText = lines[0].replace(/^#+\s*/, '');
          return (
            <h4
              key={bIdx}
              className={`font-bold text-sm tracking-tight pt-1 ${
                isUser ? 'text-white' : 'text-slate-900 flex items-center gap-1.5'
              }`}
            >
              <span>{headingText}</span>
            </h4>
          );
        }

        // Check if block is a list
        const isList = lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• '));
        if (isList) {
          return (
            <ul key={bIdx} className="space-y-1.5 pl-1">
              {lines.map((item, lIdx) => {
                const cleaned = item.trim().replace(/^[-*•]\s*/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isUser ? 'bg-white' : 'bg-[#FF5A1F]'}`} />
                    <span className="flex-1 leading-relaxed">
                      {formatInlineMarkdown(cleaned, isUser)}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Regular paragraph
        return (
          <p key={bIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {formatInlineMarkdown(line, isUser)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function formatInlineMarkdown(text, isUser) {
  // Parse links [text](url) and bold **bold**
  const parts = [];
  let remaining = text;
  let keyCounter = 0;

  // Pattern matches **bold** or [label](url)
  const regex = /(\*\*.*?\*\*|\[.*?\]\(.*?\))/;

  while (remaining) {
    const match = remaining.match(regex);
    if (!match) {
      parts.push(<span key={keyCounter++}>{remaining}</span>);
      break;
    }

    const matchIndex = match.index;
    if (matchIndex > 0) {
      parts.push(<span key={keyCounter++}>{remaining.slice(0, matchIndex)}</span>);
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const boldContent = matchedStr.slice(2, -2);
      parts.push(
        <strong
          key={keyCounter++}
          className={`font-bold ${isUser ? 'text-white' : 'text-slate-900'}`}
        >
          {boldContent}
        </strong>
      );
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const linkMatch = matchedStr.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        parts.push(
          <a
            key={keyCounter++}
            href={url}
            target={url.startsWith('http') ? '_blank' : undefined}
            rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`font-semibold underline underline-offset-2 ${
              isUser ? 'text-amber-200 hover:text-white' : 'text-[#0C3B2E] hover:text-[#FF5A1F]'
            }`}
          >
            {label}
          </a>
        );
      }
    }

    remaining = remaining.slice(matchIndex + matchedStr.length);
  }

  return parts;
}

export default function GeminiChatWidget() {
  const { userLocation } = useLocation();
  const { currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [directionsData, setDirectionsData] = useState(null);
  const [fetchingDirections, setFetchingDirections] = useState(false);

  // Initial welcome message
  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      role: 'model',
      content: `Hi ${currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}! 👋 I am your **Sangam AI Guide & Transit Navigator**, connected with real-time **Google Maps data**.\n\nI can help you explore verified community opportunities, provide turn-by-turn routes from **${currentUser?.college || 'your campus'}**, or guide you through collegiate squads, logging hours, and verified NSS certificates!`,
      groundingChunks: [],
      suggestedActions: [
        `📍 Drives near ${userLocation.city || 'me'}`,
        `🚗 Directions to Blue Cross Sanctuary`,
        `🏆 SRM Squad Leaderboard`,
        `📜 How certificates are verified`
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const quickPrompts = [
    `📍 Drives in ${userLocation.city || 'Chennai'}`,
    `🚗 Directions to Blue Cross Sanctuary`,
    `🏆 Top squads from ${currentUser?.college || 'SRM KTR'}`,
    `📜 How do I get verified certificates?`,
    `👥 How does automatic squad grouping work?`
  ];

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setLoading(true);

    try {
      // Filter out the welcome message so API call starts cleanly with a user turn
      const payloadMessages = newMessages
        .filter((m) => m.id !== 'msg_welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages.length > 0 ? payloadMessages : [{ role: 'user', content: text }],
          userLocation: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            city: userLocation.city,
            label: userLocation.label
          },
          college: currentUser?.college || 'SRM Kattankulathur (KTR)'
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setMessages((prev) => [
          ...prev,
          {
            id: `model_${Date.now()}`,
            role: 'model',
            content: json.data.reply,
            groundingChunks: json.data.groundingChunks || [],
            suggestedActions: json.data.suggestedActions || [],
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        throw new Error(json.error?.message || 'Server response error');
      }
    } catch (err) {
      console.warn('AI chat request notice:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `model_${Date.now()}`,
          role: 'model',
          content: `I am here to guide you! You can browse active volunteering opportunities in **${userLocation.city}**, join your college squad, or check the collegiate leaderboard. Let me know which cause you are most interested in!`,
          groundingChunks: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchDirections = async (destTitle, destLat = null, destLng = null) => {
    setFetchingDirections(true);
    try {
      const destCoords = (destLat && destLng) 
        ? { lat: destLat, lng: destLng }
        : { lat: 12.9980, lng: 80.2150 }; // default venue coords

      const res = await fetch('/api/ai/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: userLocation.lat, lng: userLocation.lng },
          destination: destCoords,
          originName: userLocation.label || `${userLocation.city} Campus Hub`,
          destinationName: destTitle || 'Volunteer Drive Venue',
          mode: 'transit'
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setDirectionsData(json.data);
      }
    } catch (err) {
      console.warn('Failed to calculate directions:', err);
    } finally {
      setFetchingDirections(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg_welcome',
        role: 'model',
        content: `Chat history refreshed! How can I assist you with volunteer drives or Google Maps routes today?`,
        groundingChunks: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setDirectionsData(null);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Proactive hint bubble */}
          <div className="hidden sm:flex items-center gap-2 bg-white text-slate-800 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F]" />
            <span>Need directions or squad recommendations?</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Gemini Chatbot and Google Maps Navigator"
            className="w-14 h-14 rounded-full bg-[#0C3B2E] hover:bg-[#07251D] text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center cursor-pointer border-2 border-white relative group"
          >
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5A1F] rounded-full border-2 border-white animate-pulse" />
          </button>
        </div>
      )}

      {/* Interactive Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[440px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-[#0C3B2E] text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-[#0C3B2E]/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FF5A1F] flex items-center justify-center text-white shadow-sm shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight font-sans">Sangam AI Guide</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Maps Live
                  </span>
                </div>
                <p className="text-[11px] text-stone-200 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#FF5A1F]" />
                  <span>{userLocation.label || userLocation.city}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-stone-200">
              <button
                onClick={clearChat}
                title="Restart conversation"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Collapse' : 'Expand'}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 text-[13px] sm:text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#0C3B2E] text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <MarkdownRenderer content={m.content} isUser={m.role === 'user'} />

                  {/* Render Google Maps Grounding Chunks if present */}
                  {m.groundingChunks && m.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5A1F]" />
                        <span>Google Maps Grounded Locations:</span>
                      </div>
                      <div className="space-y-1.5">
                        {m.groundingChunks.map((chunk, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-[#0C3B2E] truncate">
                                {chunk.title}
                              </div>
                              {chunk.address && (
                                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {chunk.address}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleFetchDirections(chunk.title)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0C3B2E] text-[11px] font-bold rounded border border-slate-300 flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                <Navigation className="w-3 h-3 text-[#FF5A1F]" />
                                <span>Directions</span>
                              </button>
                              {chunk.uri && (
                                <a
                                  href={chunk.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-slate-500 hover:text-[#0C3B2E] cursor-pointer"
                                  title="View on Google Maps"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested action chips on assistant messages */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap gap-1.5">
                      {m.suggestedActions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleSendMessage(act)}
                          disabled={loading}
                          className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-1.5 text-right font-medium ${
                      m.role === 'user' ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Live Transit & Route Card if requested */}
            {directionsData && (
              <div className="bg-white border-2 border-[#0C3B2E]/30 rounded-xl p-3.5 shadow-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#0C3B2E]">
                    <Compass className="w-4 h-4 text-[#FF5A1F]" />
                    <span>Real-Time Route & Directions</span>
                  </div>
                  <button
                    onClick={() => setDirectionsData(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-slate-600">
                  From <strong className="text-slate-900">{directionsData.originName}</strong> to{' '}
                  <strong className="text-slate-900">{directionsData.destinationName}</strong>
                </div>

                {/* Duration breakdown pills */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-200 font-semibold flex flex-col items-center">
                    <Bus className="w-3.5 h-3.5 text-emerald-700 mb-0.5" />
                    <span className="text-[11px]">Transit</span>
                    <strong className="text-xs">{directionsData.durationEstimate.transit}</strong>
                  </div>
                  <div className="bg-blue-50 text-blue-900 p-2 rounded-lg border border-blue-200 font-semibold flex flex-col items-center">
                    <Car className="w-3.5 h-3.5 text-blue-700 mb-0.5" />
                    <span className="text-[11px]">Driving</span>
                    <strong className="text-xs">{directionsData.durationEstimate.driving}</strong>
                  </div>
                  <div className="bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-200 font-semibold flex flex-col items-center">
                    <Footprints className="w-3.5 h-3.5 text-amber-700 mb-0.5" />
                    <span className="text-[11px]">Distance</span>
                    <strong className="text-xs">{directionsData.formattedDistance}</strong>
                  </div>
                </div>

                <p className="text-xs text-[#0C3B2E] bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/60">
                  💡 <strong>Transit Advice:</strong> {directionsData.transitTip}
                </p>

                <a
                  href={directionsData.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-[#FF5A1F] hover:bg-[#E04810] text-white font-bold text-xs rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Start Live Google Maps Navigation</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl w-fit shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F] animate-spin" />
                <span>Checking Sangam database & Google Maps live data...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-full px-3 py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about places, routes, directions, squads, certificates..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-300 focus:border-[#0C3B2E] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="bg-[#0C3B2E] hover:bg-[#07251D] disabled:opacity-50 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
