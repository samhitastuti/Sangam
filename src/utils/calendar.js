/**
 * Calendar Integration Utilities for Sangam Opportunities
 * Generates direct Google Calendar add links and RFC 5545 .ics calendar files
 */

export function generateGoogleCalendarUrl(opp) {
  if (!opp) return '#';

  const title = encodeURIComponent(`Volunteer: ${opp.title} (${opp.organization?.name || opp.orgName || 'Sangam'})`);
  const details = encodeURIComponent(
    `${opp.description || ''}\n\nActivity Format: ${opp.activity_format || opp.activityFormat || 'Weekly'}\nSchedule: ${opp.timing_details || opp.timingDetails || opp.schedule || 'Scheduled shifts'}\nCollegiate Squad: Automatically matched on Sangam\nVerified by: ${opp.organization?.ngo_darpan_id || 'NITI Aayog Registered NGO'}`
  );
  const location = encodeURIComponent(`${opp.address || ''}, ${opp.city || ''}`);

  // Create event date strings in YYYYMMDDTHHMMSSZ format
  const startDate = opp.date ? new Date(opp.date) : new Date(Date.now() + 86400000);
  const endDate = new Date(startDate.getTime() + 4 * 3600000); // 4-hour default shift

  const formatCalDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const dates = `${formatCalDate(startDate)}/${formatCalDate(endDate)}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
}

export function downloadIcsFile(opp) {
  if (!opp) return;

  const startDate = opp.date ? new Date(opp.date) : new Date(Date.now() + 86400000);
  const endDate = new Date(startDate.getTime() + 4 * 3600000);

  const formatIcsDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sangam Collegiate Volunteer Network//IN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:sangam-${opp.id}-${Date.now()}@sangam.network`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:Volunteering: ${opp.title}`,
    `DESCRIPTION:${(opp.description || '').replace(/\n/g, '\\n')} - Format: ${opp.activity_format || 'Weekly'}`,
    `LOCATION:${opp.address || ''}, ${opp.city || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sangam-${opp.id || 'drive'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
