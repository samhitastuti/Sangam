import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { optionalAuth, requireAuth } from '../middleware/requireAuth.js';
import { getDb } from '../db.js';

const router = express.Router();

// Simple in-memory response cache to mitigate rate limits and quota bursts
const aiResponseCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function getCached(key) {
  const item = aiResponseCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    aiResponseCache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  if (aiResponseCache.size > 200) {
    const firstKey = aiResponseCache.keys().next().value;
    aiResponseCache.delete(firstKey);
  }
  aiResponseCache.set(key, { data, timestamp: Date.now() });
}

function getAiClient() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

/**
 * POST /api/ai/chat
 * Multi-turn, context-aware chatbot with Google Maps Grounding
 * Remembers conversation history for multi-step booking, troubleshooting & directions
 */
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { messages, userLocation, college, currentOpportunity } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Messages array is required' }
      });
    }

    const db = await getDb();
    const userCity = userLocation?.city || 'Chennai';
    const userCollege = college || req.user?.college || 'SRM Kattankulathur (KTR)';

    // Cache check to protect rate limits and quotas
    const lastUserQuery = (messages[messages.length - 1]?.content || '').trim().toLowerCase();
    const cacheKey = `chat:${userCity}:${lastUserQuery}`;
    const cachedResponse = getCached(cacheKey);
    if (cachedResponse) {
      return res.json({ success: true, data: cachedResponse });
    }

    // Retrieve active opportunities in current city / region as context
    const nearbyOpps = db.prepare(`
      SELECT o.id, o.title, o.category, o.city, o.address, o.date, o.duration, o.hours, o.activity_format, o.timing_details,
             u.organization_name, u.verification_status, u.ngo_darpan_id
      FROM opportunities o
      JOIN users u ON o.org_id = u.id
      WHERE LOWER(o.city) = LOWER(?) OR LOWER(o.city) = LOWER(?)
      LIMIT 8
    `).all(userCity, 'Chennai');

    const client = getAiClient();

    // Fallback response if Gemini API key is unavailable
    if (!client) {
      const lastUserMsg = messages[messages.length - 1]?.content || '';
      return res.json({
        success: true,
        data: {
          reply: `Hello! I am your Sangam Collegiate Guide. I see you are inquiring about volunteering opportunities from **${userCollege}** in **${userCity}**.\n\nWe have active campus squads across multiple categories: Animal Shelter Care (weekly at Blue Cross), Marine & Coastal Cleanups, Election & Voter Literacy Campaigns, and STEM School Mentorship.\n\nTo apply, select any drive in the Opportunities tab, choose your college squad, and confirm your participation!`,
          groundingChunks: [],
          suggestedActions: [
            'Find drives near me',
            'How do campus squads work?',
            'Show college leaderboard',
            'How do I get certified?'
          ]
        }
      });
    }

    // Format conversational contents for Gemini SDK
    // CRITICAL: Gemini requires the first message in contents to have role: 'user',
    // and turns must strictly alternate or be combined.
    const rawMessages = messages.filter(m => (m.content || m.text || '').trim());
    
    // Find the first user message index to eliminate leading model welcome greetings
    const firstUserIndex = rawMessages.findIndex(m => m.role === 'user');
    const validTurnMessages = firstUserIndex !== -1 ? rawMessages.slice(firstUserIndex) : rawMessages;
    
    // Group and collapse consecutive turns with the same role
    const contents = [];
    for (const msg of validTurnMessages.slice(-12)) {
      const role = (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user';
      const text = (msg.content || msg.text || '').trim();
      if (!text) continue;

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        // Append text to existing turn
        contents[contents.length - 1].parts[0].text += `\n${text}`;
      } else {
        contents.push({
          role,
          parts: [{ text }]
        });
      }
    }

    // Ensure contents starts with 'user'
    if (contents.length === 0 || contents[0].role !== 'user') {
      const fallbackUserText = messages[messages.length - 1]?.content || 'Show active volunteering drives near me';
      contents.unshift({
        role: 'user',
        parts: [{ text: fallbackUserText }]
      });
    }

    // System instruction with Sangam knowledge base
    const oppContextStr = nearbyOpps.map(o => 
      `- [ID: ${o.id}] "${o.title}" (${o.category}, ${o.city}) at ${o.address}. Format: ${o.activity_format} (${o.timing_details || o.duration}). Hosted by ${o.organization_name} [${o.verification_status === 'verified' ? 'Verified NGO Darpan: ' + o.ngo_darpan_id : 'Statutory'}].`
    ).join('\n');

    const systemInstruction = `You are Sangam Assistant & Transit Navigator, the dedicated conversational AI support agent for Sangam — India's premier collegiate volunteer and internship network.
Affiliated student college: ${userCollege}.
Current user location: ${userLocation?.label || userCity} (Lat: ${userLocation?.lat || '12.82'}, Lng: ${userLocation?.lng || '80.04'}).
Active City: ${userCity}.

CORE COMPETENCIES:
1. Context-Aware Support & Memory: Maintain conversation context across turns. Help students find drives, join collegiate squads, understand requirements, log completed hours, and download verified certificates.
2. Real-Time Google Maps & Transit Intelligence: You have real-time Google Maps data access. Detail exact venues, distances from ${userCollege}, public transit directions (suburban rail, bus, metro), and auto-rickshaw travel tips.
3. Activity Formats:
   - Weekly with Timings (Animal welfare shelters, weekend tutoring, community kitchen pantry shifts)
   - One-Day Drives (Coastal beach cleanups, afforestation tree planting, free vision clinics)
   - Campaigns & Sprints (Multi-week voter registration drives, digital literacy sprints)
4. College Squad Competition & Leaderboard: Promote friendly rivalry! Teams earn points and hours when squads from ${userCollege} complete drives. Top squads receive Gold, Silver, and Bronze cups on the Collegiate Leaderboard.
5. Verification: Mention NITI Aayog NGO-Darpan ID verification and 80G tax status.

CURRENT ACTIVE DRIVES IN SANGAM DATABASE:
${oppContextStr}

Format your reply clearly in structured Markdown with bold titles, concise bullet points, and helpful next steps.`;

    let reply = '';
    const groundingChunks = [];

    // Attempt 1: gemini-2.5-flash with Google Maps Grounding
    try {
      const mapsConfig = {
        systemInstruction,
        maxOutputTokens: 800,
        tools: [{ googleMaps: {} }]
      };

      if (userLocation?.lat && userLocation?.lng) {
        mapsConfig.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: Number(userLocation.lat),
              longitude: Number(userLocation.lng)
            }
          }
        };
      }

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: mapsConfig
      });

      reply = response.text || '';
      
      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      rawChunks.forEach(chunk => {
        if (chunk.maps) {
          groundingChunks.push({
            type: 'maps',
            title: chunk.maps.title || 'Location on Google Maps',
            uri: chunk.maps.uri || '',
            address: chunk.maps.address || '',
            placeAnswerSources: chunk.maps.placeAnswerSources || null
          });
        } else if (chunk.web) {
          groundingChunks.push({
            type: 'web',
            title: chunk.web.title || 'Reference Link',
            uri: chunk.web.uri || ''
          });
        }
      });
    } catch (mapsErr) {
      console.warn('Gemini Maps grounding call notice, trying standard generation:', mapsErr.message);

      // Attempt 2: gemini-2.5-flash without tools (fast, resilient, low-credit usage)
      try {
        const response2 = await client.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction,
            maxOutputTokens: 800
          }
        });
        reply = response2.text || '';
      } catch (liteErr) {
        console.warn('Gemini flash standard call notice:', liteErr.message);
      }
    }

    // Dynamic, intelligent Sangam Database synthesis if Gemini was completely unreachable
    if (!reply) {
      const lastQuery = (messages[messages.length - 1]?.content || '').toLowerCase();
      
      if (lastQuery.includes('direction') || lastQuery.includes('route') || lastQuery.includes('how to reach') || lastQuery.includes('where is')) {
        const opp = nearbyOpps[0] || { title: 'Volunteering Venue', address: 'Central Hub', city: userCity };
        reply = `### 📍 Route & Transit Information to ${opp.title}\n\n` +
          `- **Destination**: ${opp.address}, ${opp.city}\n` +
          `- **From**: ${userCollege} (${userLocation?.label || userCity})\n` +
          `- **Recommended Transit**: Suburban railway or direct bus service with campus squad carpooling.\n\n` +
          `You can view turn-by-turn navigation directly on [Google Maps Directions](https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(opp.address + ', ' + opp.city)}).\n\n` +
          `*Tip: Coordinate with your SRM squad mates in the squad chat to travel together!*`;
      } else if (lastQuery.includes('leaderboard') || lastQuery.includes('squad') || lastQuery.includes('cup') || lastQuery.includes('rank')) {
        reply = `### 🏆 Collegiate Squad Leaderboard for ${userCollege}\n\n` +
          `Students from **${userCollege}** are actively competing for the Inter-College Impact Cup!\n\n` +
          `- **Top Squads**: The Coastal Warriors (Marine Conservation), STEM Mentors Hub, and Green Haven Team.\n` +
          `- **How Points Work**: Every completed hour logged by squad members earns verified credentials and boosts your college ranking.\n\n` +
          `Head over to the [Collegiate Leaderboard](/leaderboard) to see full team standings and badge awards!`;
      } else if (lastQuery.includes('certificate') || lastQuery.includes('hour') || lastQuery.includes('darpan')) {
        reply = `### 📜 Verified Certificates & NITI Aayog Validation\n\n` +
          `- **Authenticity**: Every volunteer certificate issued on Sangam contains an immutable verification hash, NITI Aayog NGO-Darpan ID, and 80G registration stamp.\n` +
          `- **Fulfillment**: Once you attend your drive and the NGO lead confirms your squad attendance, your certificate is automatically generated and downloadable from your [My Squads Dashboard](/dashboard).\n` +
          `- **Academic Recognition**: Recognized for university NSS/social internship credits.`;
      } else {
        const oppItems = nearbyOpps.slice(0, 3).map(o => 
          `• **[${o.title}](/opportunities/${o.id})** (${o.category})\n  *Venue:* ${o.address} · *Format:* ${o.activity_format}\n  *Organization:* ${o.organization_name}`
        ).join('\n\n');

        reply = `### 🌿 Active Volunteering Drives in ${userCity} for ${userCollege}\n\n` +
          `Here are active drives available for you and your campus squad right now:\n\n` +
          `${oppItems}\n\n` +
          `**How to join:** Click any opportunity above to view schedule details, review the matched ${userCollege} squad, and confirm your spot!`;
      }
    }

    // Contextual suggested action chips
    const suggestedActions = [
      `📍 Drives near ${userCity}`,
      `🏆 Top squads from ${userCollege.split(' ')[0]}`,
      `🗺️ Directions from campus`,
      `📜 Certificate verification guide`
    ];

    const payload = {
      reply,
      groundingChunks,
      suggestedActions
    };
    setCached(cacheKey, payload);

    res.json({
      success: true,
      data: payload
    });
  } catch (err) {
    console.error('Gemini chat error:', err);
    res.json({
      success: true,
      data: {
        reply: `I encountered a momentary connection notice with live maps, but I can still assist you! You can browse active volunteering drives in your city, join your college squad, and check directions to any registered NGO venue.`,
        groundingChunks: [],
        suggestedActions: [
          'Browse opportunities',
          'View Leaderboard',
          'Contact Support'
        ]
      }
    });
  }
});

/**
 * POST /api/ai/directions
 * Pulls route, transit instructions, travel time, and Google Maps direct navigation link
 */
router.post('/directions', async (req, res) => {
  try {
    const { origin, destination, originName, destinationName, mode = 'transit' } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: { message: 'Origin and destination coordinates are required' }
      });
    }

    const oLat = Number(origin.lat);
    const oLng = Number(origin.lng);
    const dLat = Number(destination.lat);
    const dLng = Number(destination.lng);

    // Calculate Haversine distance in km
    const R = 6371;
    const dLatRad = ((dLat - oLat) * Math.PI) / 180;
    const dLngRad = ((dLng - oLng) * Math.PI) / 180;
    const a =
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos((oLat * Math.PI) / 180) *
        Math.cos((dLat * Math.PI) / 180) *
        Math.sin(dLngRad / 2) *
        Math.sin(dLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c * 10) / 10;

    // Approximate travel times
    const drivingMinutes = Math.max(5, Math.round((distanceKm / 30) * 60 + 5));
    const transitMinutes = Math.max(10, Math.round((distanceKm / 22) * 60 + 12));
    const walkingMinutes = Math.max(5, Math.round((distanceKm / 4.5) * 60));

    // Construct official Google Maps Directions Navigation URL
    const originParam = `${oLat},${oLng}`;
    const destParam = `${dLat},${dLng}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destParam)}&travelmode=${mode}`;

    // Transit recommendations based on distance
    let transitTip = 'Take suburban rail or city bus service.';
    if (distanceKm < 2.0) {
      transitTip = 'Close by: Short walk or 5-min auto-rickshaw ride.';
    } else if (distanceKm < 15.0) {
      transitTip = 'Recommended: City bus or metro/suburban rail station nearby.';
    } else {
      transitTip = 'Fastest: Suburban transit train or express bus line with campus carpool.';
    }

    res.json({
      success: true,
      data: {
        distanceKm,
        formattedDistance: `${distanceKm} km`,
        durationEstimate: {
          driving: `${drivingMinutes} mins`,
          transit: `${transitMinutes} mins`,
          walking: `${walkingMinutes} mins`
        },
        transitTip,
        originName: originName || 'Current Location',
        destinationName: destinationName || 'Volunteer Venue',
        googleMapsUrl: mapsUrl
      }
    });
  } catch (err) {
    console.error('Directions error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to calculate directions' }
    });
  }
});

// POST /api/ai/match-squad (existing matchmaking)
router.post('/match-squad', optionalAuth, async (req, res) => {
  try {
    const { skills, college, interests, opportunityId } = req.body;
    const db = await getDb();

    const cacheKey = `match:${opportunityId || 'general'}:${college || 'srm'}:${Array.isArray(skills) ? skills.join(',') : skills}`;
    const cachedMatch = getCached(cacheKey);
    if (cachedMatch) {
      return res.json(cachedMatch);
    }

    let opp = null;
    if (opportunityId) {
      opp = db.prepare('SELECT * FROM opportunities WHERE id = ?').get(opportunityId);
    }

    const client = getAiClient();
    if (!client) {
      const skillsArray = Array.isArray(skills) ? skills : (skills ? [skills] : ['Community Action']);
      return res.json({
        matchScore: 92,
        squadRole: 'Collegiate Squad Lead & Field Coordinator',
        reasoning: `Your background in ${skillsArray.slice(0, 2).join(' & ')} aligns with collegiate outreach initiatives from ${college || 'your campus'}. Working alongside your college peers will maximize local community impact.`,
        recommendedActions: [
          'Coordinate pre-drive briefing with your college squad members',
          'Prepare module checklist for the host organization',
          'Document volunteer hours for official Sangam verification'
        ]
      });
    }

    const prompt = `You are the collegiate volunteer matchmaking AI for Sangam, a platform connecting college students into campus squads for grassroots volunteering and internships.
Analyze this student and opportunity:
Student College: ${college || 'Collegiate Squad'}
Student Skills: ${Array.isArray(skills) ? skills.join(', ') : skills || 'General volunteering'}
Interests: ${interests || 'Community service, leadership'}
Target Opportunity Title: ${opp?.title || 'Community Impact Campaign'}
Target Opportunity Description: ${opp?.description || 'Grassroots collegiate social action initiative'}

Provide a structured JSON output with:
1. "matchScore" (integer 70-98)
2. "squadRole" (concise title, e.g., "Field Communications Lead")
3. "reasoning" (2 concise sentences on why this collegiate squad is ideal)
4. "recommendedActions" (array of 3 short bullet points)

Return ONLY valid raw JSON with keys: matchScore, squadRole, reasoning, recommendedActions. Do not wrap in markdown code blocks.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt
    });

    let text = response.text || '';
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    try {
      const parsed = JSON.parse(text);
      setCached(cacheKey, parsed);
      res.json(parsed);
    } catch {
      const fallbackParsed = {
        matchScore: 89,
        squadRole: 'Collegiate Squad Coordinator',
        reasoning: text.slice(0, 240) || 'Strong alignment with community drive focus and collegiate squad goals.',
        recommendedActions: ['Connect with peer volunteers', 'Review drive safety guidelines', 'Track community impact']
      };
      setCached(cacheKey, fallbackParsed);
      res.json(fallbackParsed);
    }
  } catch (err) {
    console.error('AI match error:', err);
    res.json({
      matchScore: 85,
      squadRole: 'Field Volunteer',
      reasoning: 'Matches your current skills and collegiate campus focus.',
      recommendedActions: ['Join your college squad', 'Coordinate with the host organization']
    });
  }
});

// POST /api/ai/generate-opportunity
router.post('/generate-opportunity', requireAuth, async (req, res) => {
  try {
    const { title, cause, city, targetStudents } = req.body;
    const client = getAiClient();

    if (!client) {
      return res.json({
        description: `Join our team in ${city || 'Chennai'} for a focused campaign addressing ${cause || 'community development'}. Student volunteers will collaborate in collegiate squads to drive grassroots impact and measurable social change.`,
        suggestedSkills: ['Community Mobilization', 'Event Planning', 'Teaching', 'Social Media'],
        suggestedHours: 20
      });
    }

    const prompt = `You are an expert organizer for Sangam, a student volunteer and internship platform in India with automatic college-based team grouping.
Draft an inspiring, professional opportunity briefing:
Cause / Focus: ${cause || 'Community Development'}
Campaign Title Concept: ${title || 'Youth Volunteer Initiative'}
City / Location: ${city || 'Chennai'}
Target Students: ${targetStudents || 'Engineering, Arts & Science college students'}

Return ONLY a valid JSON object (no markdown quotes, no triple backticks):
{
  "title": "Inspiring, crisp title",
  "description": "Engaging 2-paragraph description explaining the challenge, role of collegiate squads, and community outcome",
  "suggestedSkills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
  "suggestedHours": 16
}`;

    const response = await client.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt
    });

    let text = response.text || '';
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch {
      res.json({
        description: text.slice(0, 400),
        suggestedSkills: ['Community Outreach', 'Logistics', 'Public Speaking'],
        suggestedHours: 20
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
