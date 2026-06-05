// URL generation for WarpFriends posts.
// Pattern (verified against real URLs):
//   - Slug uses the Monday that starts the post's publication week
//   - slugOffset: 0 (Monday) or 1 (Tuesday) - varies by week
//   - postOffset: 0-4 days after slug date
// Examples:
//   Week May 26–Jun 1: slug=june-1-2026, post=2026/06/03/ (monday Jun 1 + 2)
//   Week May 19–25:    slug=may-25-2026, post=2026/05/27/ (monday May 25 + 2)
//   Week May 5–11:     slug=may-11-2026, post=2026/05/13/ (monday May 11 + 2)
//   Week Apr 28–May 4: slug=may-5-2026,  post=2026/05/06/ (monday May 4 + 1 slug, +1 post)

const BASE_URL = "https://warpfriends.wordpress.com";

const MONTH_NAMES = [
  "january","february","march","april","may","june",
  "july","august","september","october","november","december"
];

function pad(n: number): string { return String(n).padStart(2, "0"); }

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function slugFromDate(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]}-${d.getDate()}-${d.getFullYear()}`;
}

function pathFromDate(d: Date): string {
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

/**
 * Returns Monday of the week containing `date` (weeks = Mon-Sun).
 */
export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the Sunday (last day) of the week that starts on `monday`.
 */
export function getSundayOf(monday: Date): Date {
  return addDays(monday, 6);
}

/**
 * Generate all URL candidates for a given week Monday.
 * Returns list of candidate URLs to try in order.
 */
export function generateCandidateUrls(weekMonday: Date): string[] {
  // The post's Monday = day after the week's Sunday
  const weekSunday = addDays(weekMonday, 6);
  const pubMonday = addDays(weekSunday, 1); // Monday of publication week

  const candidates: string[] = [];

  for (const slugOffset of [0, 1]) {
    const slugDate = addDays(pubMonday, slugOffset);
    const slug = `40k-meta-stats-from-${slugFromDate(slugDate)}`;
    for (let postOffset = 0; postOffset <= 4; postOffset++) {
      const postDate = addDays(slugDate, postOffset);
      candidates.push(`${BASE_URL}/${pathFromDate(postDate)}/${slug}/`);
    }
  }

  return candidates;
}

/**
 * Returns an array of `count` week Mondays, starting from the last
 * complete week and going backwards.
 */
export function getRecentWeekMondays(count: number, referenceDate?: Date): Date[] {
  const today = referenceDate ?? new Date();
  const thisMonday = getMondayOf(today);
  // Last complete week Monday = this week's Monday - 7 days
  const lastCompleteMonday = addDays(thisMonday, -7);

  const weeks: Date[] = [];
  for (let i = 0; i < count; i++) {
    weeks.push(addDays(lastCompleteMonday, -7 * i));
  }
  return weeks;
}

export function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const start = `${monthNames[monday.getMonth()]} ${monday.getDate()}`;
  const end = `${monthNames[sunday.getMonth()]} ${sunday.getDate()}`;
  return `${start} – ${end}`;
}
