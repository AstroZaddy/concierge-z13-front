/**
 * Utility functions for formatting dates and times
 */

/**
 * Format a datetime ISO string to a readable format
 * @param {string} isoString - ISO 8601 datetime string
 * @param {string|null} timezone - Optional timezone (e.g., "America/New_York")
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(isoString, timezone = null) {
  if (!isoString) return "";
  
  try {
    const date = new Date(isoString);
    const options = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };
    
    if (timezone) {
      return new Intl.DateTimeFormat("en-US", { ...options, timeZone: timezone }).format(date);
    }
    return date.toLocaleString("en-US", options);
  } catch (err) {
    // Fallback to basic formatting
    return new Date(isoString).toLocaleString();
  }
}

/**
 * Format a date string (without time)
 * @param {string} dateString - ISO 8601 date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch (err) {
    return dateString;
  }
}

/**
 * Format a calculated timestamp with timezone awareness
 * @param {string} timestampUtc - UTC timestamp
 * @param {string|null} timezone - Optional timezone
 * @returns {string} Formatted timestamp
 */
export function formatCalculatedOn(timestampUtc, timezone = null) {
  if (!timestampUtc) return "";
  
  try {
    const date = new Date(timestampUtc);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return formatter.format(date);
  } catch (err) {
    // Fallback to UTC
    return new Date(timestampUtc).toLocaleString();
  }
}

/**
 * Format birth information for display
 * @param {Object} natalData - Birth data object
 * @returns {Array<{label: string, value: string}>|null} Array of birth info items or null
 */
export function formatBirthInfo(natalData) {
  if (!natalData) return null;
  
  const info = [];
  
  // Name
  if (natalData.name) {
    info.push({ label: "Name", value: natalData.name });
  }
  
  // Date of birth
  if (natalData.birth_datetime_utc) {
    const birthDate = new Date(natalData.birth_datetime_utc);
    const localDate = natalData.birth_timezone 
      ? new Date(birthDate.toLocaleString("en-US", { timeZone: natalData.birth_timezone }))
      : birthDate;
    const dateStr = localDate.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
    info.push({ label: "Date of Birth", value: dateStr });
    
    // Time (if known)
    if (natalData.birth_time_provided) {
      const timeStr = localDate.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit",
        timeZone: natalData.birth_timezone || undefined
      });
      info.push({ label: "Time", value: timeStr });
    }
  }
  
  // Location (if known)
  if (natalData.birth_place_name) {
    info.push({ label: "Location", value: natalData.birth_place_name });
  }
  
  return info.length > 0 ? info : null;
}

