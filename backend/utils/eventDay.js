// Works out which event day + session "now" falls into, and whether a
// check-in counts as ON_TIME or LATE for that session.
//
// Each event day has TWO check-in sessions (morning + evening), so a
// participant can accumulate up to 2 attendance records/day x 5 days = 10 total.
//
// .env keys used:
//   EVENT_START_DATE        e.g. 2026-09-21   (Day 1's calendar date)
//   EVENT_DAYS               e.g. 5
//   SESSION_SPLIT_TIME       e.g. 13:00  (before this clock time = "morning" session, at/after = "evening")
//   MORNING_ON_TIME_UNTIL    e.g. 09:00  (morning check-in at/before this -> ON_TIME, else LATE)
//   EVENING_ON_TIME_UNTIL    e.g. 14:00  (evening check-in at/before this -> ON_TIME, else LATE)

function toDateOnlyString(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
}

function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseHHMM(value, fallback) {
  if (!value) return fallback;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
  return h * 60 + m;
}

function getEventDayForDate(now = new Date()) {
  const startStr = process.env.EVENT_START_DATE;
  const totalDays = Number(process.env.EVENT_DAYS || 5);
  const todayStr = toDateOnlyString(now);

  if (!startStr) {
    // No event window configured - just treat every day as "Day 1".
    return { day: 1, date: todayStr, withinEventWindow: true };
  }

  const start = new Date(`${startStr}T00:00:00Z`);
  const today = new Date(`${todayStr}T00:00:00Z`);
  const dayNumber = Math.round((today.getTime() - start.getTime()) / 86400000) + 1;

  return {
    day: dayNumber,
    date: todayStr,
    withinEventWindow: dayNumber >= 1 && dayNumber <= totalDays,
  };
}

function getCurrentSession(now = new Date()) {
  const splitMins = parseHHMM(process.env.SESSION_SPLIT_TIME, 13 * 60); // default 1:00 PM
  return minutesSinceMidnight(now) < splitMins ? "morning" : "evening";
}

function classifyCheckInTime(session, now = new Date()) {
  const onTimeUntil =
    session === "morning"
      ? parseHHMM(process.env.MORNING_ON_TIME_UNTIL, 9 * 60)
      : parseHHMM(process.env.EVENING_ON_TIME_UNTIL, 14 * 60);

  const mins = minutesSinceMidnight(now);
  return mins <= onTimeUntil ? "ON_TIME" : "LATE";
}

module.exports = { getEventDayForDate, getCurrentSession, classifyCheckInTime, toDateOnlyString };
