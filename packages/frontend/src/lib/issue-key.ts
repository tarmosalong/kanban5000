/**
 * Generate a project key from the project slug
 * Examples:
 * - "backend-api" -> "BACK"
 * - "web-app" -> "WEB"
 * - "uus-projekt" -> "UUS"
 */
export function getProjectKey(slug: string): string {
  // Remove hyphens and take first word, uppercase it, limit to 4 chars
  const words = slug.split('-');
  const firstWord = words[0].toUpperCase();
  return firstWord.slice(0, 4);
}

/**
 * Format an issue number with project key
 * Example: formatIssueKey("BACK", 123) -> "BACK-123"
 */
export function formatIssueKey(projectKey: string, issueNumber: number): string {
  return `${projectKey}-${issueNumber}`;
}

