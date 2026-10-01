// public/js/components/teamBanner.js
// Overlapping circular initials avatars staggered by ~100ms, expandable Team Log

export function renderTeamBanner(team, currentUserId, userCollege) {
  if (!team) return null;

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const members = team.members || [];
  const college = team.college || userCollege || 'your college';
  const otherMembers = members.filter(m => m.id !== currentUserId);
  const othersCount = otherMembers.length;

  const banner = document.createElement('div');
  banner.className = 'team-banner';

  const header = document.createElement('div');
  header.className = 'team-banner-header';

  const titleBox = document.createElement('div');
  titleBox.innerHTML = `
    <div style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; color: var(--color-primary); margin-bottom: 4px; font-weight: 700;">
      CAMPUS AUTO-PAIRED TEAM
    </div>
    <div class="team-banner-title">
      ${othersCount === 0
        ? `You started the ${college} squad!`
        : `You're grouped with ${othersCount} other${othersCount > 1 ? 's' : ''} from ${college}`}
    </div>
  `;
  header.appendChild(titleBox);

  // Avatar Stack
  const stack = document.createElement('div');
  stack.className = 'avatar-stack';

  // Render current user first
  const selfAvatar = document.createElement('div');
  selfAvatar.className = 'member-avatar';
  selfAvatar.title = 'You';
  selfAvatar.textContent = 'YOU';
  selfAvatar.style.backgroundColor = 'var(--color-primary)';
  selfAvatar.style.color = '#FFF';
  stack.appendChild(selfAvatar);

  // Render other members with 100ms stagger
  otherMembers.forEach((member, index) => {
    const initials = (member.name || 'ST')
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const avatar = document.createElement('div');
    avatar.className = 'member-avatar';
    avatar.title = `${member.name} (${member.college || college})`;
    avatar.textContent = initials;

    if (isReducedMotion) {
      stack.appendChild(avatar);
    } else {
      avatar.classList.add('stamp-in');
      setTimeout(() => {
        stack.appendChild(avatar);
      }, (index + 1) * 100);
    }
  });

  header.appendChild(stack);
  banner.appendChild(header);

  // Expandable Team Log <details>
  const details = document.createElement('details');
  details.className = 'team-log-details';
  details.innerHTML = `
    <summary>View Team Roster & Matching Log (${members.length} members)</summary>
    <ul class="team-log-list">
      ${members.map(m => `
        <li style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dashed var(--color-muted);">
          <span><strong>${m.name}</strong> (${m.college || college})</span>
          <span class="joined-via-tag">${m.joined_via || 'auto-match'}</span>
        </li>
      `).join('')}
    </ul>
  `;
  banner.appendChild(details);

  return banner;
}
