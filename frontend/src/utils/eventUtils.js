/**
 * Centralized utility for calculating event dates, times, and dynamic statuses.
 * This fixes the issue where `new Date(event.date)` defaults to midnight UTC
 * and causes same-day events to be immediately marked as past.
 */

/**
 * Returns a full Date object combining the event's date and time.
 * @param {Object} event - The event object from the backend
 * @returns {Date}
 */
export const getEventStartDateTime = (event) => {
  if (!event || !event.date || !event.time) return new Date();
  
  const startDateTime = new Date(event.date);
  const [hours, minutes] = event.time.split(':');
  
  // Ensure we are setting local hours correctly based on the parsed date
  startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return startDateTime;
};

/**
 * Returns a full Date object representing the end of the event.
 * @param {Object} event - The event object from the backend
 * @returns {Date}
 */
export const getEventEndDateTime = (event) => {
  const startDateTime = getEventStartDateTime(event);
  const durationHours = event.durationHours || 2;
  return new Date(startDateTime.getTime() + (durationHours * 60 * 60 * 1000));
};

/**
 * Derives the dynamic status of the event strictly for UI rendering.
 * @param {Object} event 
 * @returns {'UPCOMING' | 'ONGOING' | 'COMPLETED'}
 */
export const getEventStatus = (event) => {
  if (!event) return 'COMPLETED';

  // If backend firmly sealed it as completed
  if (event.status === 'completed') return 'COMPLETED';

  const now = new Date();
  const start = getEventStartDateTime(event);
  const end = getEventEndDateTime(event);

  if (now < start) return 'UPCOMING';
  if (now >= start && now <= end) return 'ONGOING';
  return 'COMPLETED'; // If now > end, it's past, even if cron hasn't caught it yet
};

/**
 * Returns true if the event has completely finished.
 * @param {Object} event 
 * @returns {boolean}
 */
export const isEventPast = (event) => {
  return getEventStatus(event) === 'COMPLETED';
};

/**
 * Returns true if registration is still open for the event.
 * @param {Object} event 
 * @returns {boolean}
 */
export const isRegistrationOpen = (event) => {
  const now = new Date();
  
  if (event.status === 'completed') return false;
  
  let deadline;
  if (event.registrationDeadline) {
    deadline = new Date(event.registrationDeadline);
  } else {
    deadline = getEventStartDateTime(event);
  }
  
  return now <= deadline;
};

/**
 * Formats a 24-hour time string (HH:MM) to a 12-hour format (hh:mm A).
 * @param {string} timeString - e.g. "17:00" or "05:00"
 * @returns {string} - e.g. "05:00 PM" or "05:00 AM"
 */
export const formatTime12h = (timeString) => {
  if (!timeString) return '';
  const parts = timeString.split(':');
  if (parts.length !== 2) return timeString;
  const d = new Date();
  d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};
