/**
 * Sangam Smart Recommender Engine
 * Multi-factor ranking: Skill Fit (40%), Cause Alignment (25%), Proximity (25%), Squad Momentum (10%)
 */

import { calculateHaversineDistanceKm } from './distance.js';

/**
 * Standard cause synonyms and skills taxonomy mapping
 */
const SKILL_SYNONYMS = {
  python: ['coding', 'programming', 'software', 'technology', 'stem'],
  robotics: ['stem', 'engineering', 'arduino', 'technology', 'electronics'],
  teaching: ['tutoring', 'education', 'mentorship', 'communication', 'public speaking'],
  communication: ['public speaking', 'community mobilization', 'public outreach', 'advocacy'],
  logistics: ['event management', 'operations', 'surveying', 'organization'],
  'animal care': ['veterinary', 'shelter support', 'feeding drives', 'empathy & care'],
  'environmental action': ['sustainability', 'tree planting', 'cleanliness', 'conservation']
};

/**
 * Normalizes an array of skills or string into clean lowercase tokens
 */
function normalizeSkills(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) {
    return skills.map((s) => String(s).toLowerCase().trim()).filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills.split(',').map((s) => s.toLowerCase().trim()).filter(Boolean);
  }
  return [];
}

/**
 * Computes Jaccard / Overlap similarity between user skills and opportunity requirements
 */
function computeSkillOverlap(userSkills, oppSkills) {
  const uSkills = normalizeSkills(userSkills);
  const oSkills = normalizeSkills(oppSkills);

  if (oSkills.length === 0) return 0.75; // General volunteer drive requiring no specialized skills
  if (uSkills.length === 0) return 0.65; // User has not listed skills yet

  let matchCount = 0;
  oSkills.forEach((req) => {
    // Direct match
    if (uSkills.some((us) => us.includes(req) || req.includes(us))) {
      matchCount += 1;
      return;
    }
    // Synonym match
    for (const [key, synonyms] of Object.entries(SKILL_SYNONYMS)) {
      if ((req.includes(key) || synonyms.includes(req)) && uSkills.some((us) => us.includes(key) || synonyms.includes(us))) {
        matchCount += 0.8;
        return;
      }
    }
  });

  return Math.min(1, matchCount / oSkills.length);
}

/**
 * Computes cause / category match score (0 to 1)
 */
function computeCategoryMatch(userCauses, oppCategory) {
  if (!oppCategory) return 0.7;
  const causes = normalizeSkills(userCauses);
  if (causes.length === 0) return 0.7;

  const cat = oppCategory.toLowerCase();
  if (causes.some((c) => cat.includes(c) || c.includes(cat))) {
    return 1.0;
  }
  return 0.5;
}

/**
 * Computes exponential decay distance score (0 to 1)
 * 0-5km => 1.0, 15km => 0.85, 30km => 0.65, 75km => 0.40, >200km => 0.15
 */
function computeDistanceScore(distanceKm) {
  if (distanceKm == null || isNaN(distanceKm)) return 0.6;
  if (distanceKm <= 5) return 1.0;
  if (distanceKm <= 15) return 0.9;
  if (distanceKm <= 35) return 0.75;
  if (distanceKm <= 80) return 0.5;
  if (distanceKm <= 200) return 0.3;
  return 0.15;
}

/**
 * Computes overall match score (0 to 100) and rationale for an opportunity
 */
export function computeOpportunityRecommendation(opp, user, userLocation) {
  if (!opp) return { score: 70, reasons: [] };

  const oppLat = opp.latitude != null ? Number(opp.latitude) : null;
  const oppLng = opp.longitude != null ? Number(opp.longitude) : null;

  let distanceKm = null;
  if (userLocation?.lat != null && userLocation?.lng != null && oppLat != null && oppLng != null) {
    distanceKm = calculateHaversineDistanceKm(userLocation.lat, userLocation.lng, oppLat, oppLng);
  }

  // 1. Skill Score (40%)
  const userSkills = user?.skills || ['Teaching', 'Logistics', 'Community Mobilization', 'Communication'];
  const skillRatio = computeSkillOverlap(userSkills, opp.skills_needed || opp.skillsNeeded);
  const skillScore = skillRatio * 40;

  // 2. Cause Alignment Score (25%)
  const userCauses = user?.causes || ['Education', 'Environment', 'Community Action'];
  const causeRatio = computeCategoryMatch(userCauses, opp.category);
  const causeScore = causeRatio * 25;

  // 3. Proximity Score (25%)
  const distRatio = computeDistanceScore(distanceKm);
  const distScore = distRatio * 25;

  // 4. Campus Squad Bonus (10%)
  let squadBonus = 5;
  if (user?.college && (opp.hasSrmSquad || opp.id?.includes('srm') || opp.city?.toLowerCase() === userLocation?.city?.toLowerCase())) {
    squadBonus = 10;
  }

  const rawScore = Math.round(skillScore + causeScore + distScore + squadBonus);
  const totalScore = Math.min(99, Math.max(55, rawScore));

  // Determine top highlight reasons
  const reasons = [];
  if (skillRatio >= 0.7) {
    reasons.push('High skill fit');
  }
  if (distanceKm != null && distanceKm <= 10) {
    reasons.push(`${distanceKm.toFixed(1)} km close to you`);
  } else if (opp.city?.toLowerCase() === (userLocation?.city || '').toLowerCase()) {
    reasons.push(`In your city (${opp.city})`);
  }
  if (causeRatio >= 0.9) {
    reasons.push(`Matches ${opp.category}`);
  }
  if (squadBonus >= 8) {
    reasons.push('Active campus squad');
  }

  return {
    score: totalScore,
    skillRatio,
    distanceKm,
    reasons: reasons.slice(0, 3),
    badge: totalScore >= 90 ? 'Top Pick' : totalScore >= 80 ? 'Strong Match' : 'Good Fit'
  };
}

/**
 * Augments list of opportunities with recommendation scores and sorts by best match
 */
export function rankOpportunitiesByRecommendation(opportunities, user, userLocation) {
  if (!Array.isArray(opportunities)) return [];

  const ranked = opportunities.map((opp) => {
    const rec = computeOpportunityRecommendation(opp, user, userLocation);
    return {
      ...opp,
      matchScore: rec.score,
      matchBadge: rec.badge,
      matchReasons: rec.reasons,
      distanceKm: rec.distanceKm != null ? rec.distanceKm : opp.distanceKm
    };
  });

  return ranked.sort((a, b) => b.matchScore - a.matchScore);
}
