// public/js/components/statsStrip.js
// "42 postings open · 118 students active · 6 hometowns represented"

export function renderStatsStrip(opportunities = []) {
  const openCount = opportunities.filter(o => o.status === 'open').length;
  const totalVolunteers = opportunities.reduce((acc, curr) => acc + (curr.applied_count || 0), 0);
  const cities = new Set(opportunities.map(o => o.city).filter(Boolean));

  const strip = document.createElement('div');
  strip.className = 'stats-strip';
  strip.innerHTML = `
    <div class="stats-item"><strong>${openCount}</strong> postings open</div>
    <div class="stats-divider">·</div>
    <div class="stats-item"><strong>${totalVolunteers}</strong> students active</div>
    <div class="stats-divider">·</div>
    <div class="stats-item"><strong>${cities.size}</strong> hometowns represented</div>
  `;
  return strip;
}
