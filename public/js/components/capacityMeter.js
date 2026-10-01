// public/js/components/capacityMeter.js
// Segmented ticks, sequentially filled, respects prefers-reduced-motion

export function renderCapacityMeter(appliedCount, capacity, maxTicks = 20) {
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = Math.min(appliedCount, capacity);
  const total = capacity;
  
  // Scale down ticks if capacity is large
  const displayTicks = Math.min(total, maxTicks);
  const filledTicks = Math.round((count / total) * displayTicks);

  const container = document.createElement('div');
  container.className = 'capacity-meter';

  const header = document.createElement('div');
  header.className = 'capacity-meter-header';
  header.innerHTML = `
    <span>VOLUNTEER COHORT</span>
    <span class="mono"><strong>${count}</strong> / ${total} spots filled</span>
  `;
  container.appendChild(header);

  const track = document.createElement('div');
  track.className = 'ticks-track';

  for (let i = 0; i < displayTicks; i++) {
    const tick = document.createElement('div');
    tick.className = 'tick';
    
    if (i < filledTicks) {
      if (isReducedMotion) {
        tick.classList.add('filled');
      } else {
        tick.classList.add('animate-fill');
        tick.style.animationDelay = `${i * 35}ms`;
        setTimeout(() => {
          tick.classList.add('filled');
        }, i * 35 + 200);
      }
    }
    track.appendChild(tick);
  }

  container.appendChild(track);
  return container;
}
