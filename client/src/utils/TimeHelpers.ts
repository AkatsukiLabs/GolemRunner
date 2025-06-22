/**
 * Time utilities for mission management
 * Mirrors the Cairo timestamp utilities from the contract
 */

// Constants matching Cairo implementation
export const SECONDS_PER_DAY = 86400; // 24 * 60 * 60
export const MILLISECONDS_PER_DAY = SECONDS_PER_DAY * 1000;

/**
 * Converts a Unix timestamp (in seconds) to day number
 * Matches the Cairo implementation: timestamp / SECONDS_PER_DAY
 * @param timestamp Unix timestamp in seconds
 * @returns Day number since Unix epoch
 */
export function unixTimestampToDay(timestamp: number): number {
  return Math.floor(timestamp / SECONDS_PER_DAY);
}

/**
 * Gets the current day timestamp (start of day in seconds)
 * This is what we'll use to query missions for "today"
 * @returns Unix timestamp for start of current day in seconds
 */
export function getCurrentDayTimestamp(): number {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor(startOfDay.getTime() / 1000); // Convert to seconds
}

/**
 * Gets the current day number
 * @returns Current day number since Unix epoch
 */
export function getCurrentDay(): number {
  return unixTimestampToDay(getCurrentDayTimestamp());
}

/**
 * Checks if two timestamps are from different days
 * @param timestamp1 First timestamp in milliseconds (JS Date.now())
 * @param timestamp2 Second timestamp in milliseconds (JS Date.now())
 * @returns true if timestamps are from different days
 */
export function isDifferentDay(timestamp1: number, timestamp2: number): boolean {
  const day1 = unixTimestampToDay(Math.floor(timestamp1 / 1000));
  const day2 = unixTimestampToDay(Math.floor(timestamp2 / 1000));
  return day1 !== day2;
}

/**
 * Checks if a mission was created today
 * @param missionCreatedAt Mission's created_at timestamp (from contract, in seconds)
 * @returns true if mission was created today
 */
export function isMissionFromToday(missionCreatedAt: number): boolean {
  const missionDay = unixTimestampToDay(missionCreatedAt);
  const currentDay = getCurrentDay();
  return missionDay === currentDay;
}

/**
 * Checks if the missions cache is stale (from a different day)
 * @param lastFetchTimestamp Last time missions were fetched (JS timestamp in ms)
 * @returns true if cache is stale and needs refresh
 */
export function isMissionCacheStale(lastFetchTimestamp: number | null): boolean {
  if (!lastFetchTimestamp) return true;
  
  return isDifferentDay(lastFetchTimestamp, Date.now());
}

/**
 * Gets a human-readable time until end of day
 * @returns String like "5h 23m" until midnight
 */
export function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = midnight.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Formats a timestamp for debug/logging purposes
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Gets the timestamp for a specific day offset from today
 * @param daysOffset Days to add/subtract from today (negative for past days)
 * @returns Unix timestamp for start of that day in seconds
 */
export function getDayTimestamp(daysOffset: number = 0): number {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysOffset);
  return Math.floor(targetDate.getTime() / 1000);
}

// Debug utility to validate our time calculations
export function debugTimeUtils() {
  const now = Date.now();
  const currentDayTimestamp = getCurrentDayTimestamp();
  const currentDay = getCurrentDay();
  
  console.log('=== Time Utils Debug ===');
  console.log('Current JS time (ms):', now);
  console.log('Current day timestamp (s):', currentDayTimestamp);
  console.log('Current day number:', currentDay);
  console.log('Formatted current day:', formatTimestamp(currentDayTimestamp));
  console.log('Time until midnight:', getTimeUntilMidnight());
  console.log('Yesterday timestamp:', getDayTimestamp(-1));
  console.log('Tomorrow timestamp:', getDayTimestamp(1));
}