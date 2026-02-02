/**
 * Extracts author and permlink from a Hive social URL
 * Example: https://hive.blog/hive-106130/@sagarkothari/p1eb1jvg
 * Returns: { author: 'sagarkothari', permlink: 'p1eb1jvg' }
 */
export function parseSocialUrl(socialUrl: string): { author: string; permlink: string } | null {
  if (!socialUrl) return null;

  try {
    // Match pattern like @author/permlink in the URL
    const match = socialUrl.match(/@([^/]+)\/([^/?]+)/);
    if (match && match.length >= 3) {
      return {
        author: match[1],
        permlink: match[2],
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing social URL:', error);
    return null;
  }
}

