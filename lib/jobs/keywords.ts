/**
 * Synonym groups for job titles.
 * If a user types any word from a group, all words in that group become search terms.
 */
const SYNONYM_GROUPS: string[][] = [
  // Role types
  ["developer", "engineer", "programmer", "dev", "razvijalec"],
  ["designer", "oblikovalec"],
  ["manager", "vodja", "lead", "head"],
  ["analyst", "analitik"],
  ["architect", "arhitekt"],
  ["administrator", "admin"],
  ["consultant", "svetovalec"],
  ["tester", "qa"],
  ["intern", "trainee", "pripravnik"],

  // Seniority
  ["senior", "sr", "experienced"],
  ["junior", "jr", "entry"],
  ["mid", "middle", "intermediate"],

  // Tech synonyms
  ["frontend", "front-end", "front end", "ui"],
  ["backend", "back-end", "back end", "server-side"],
  ["fullstack", "full-stack", "full stack"],
  ["devops", "sre", "infrastructure", "platform"],
  ["mobile", "ios", "android"],
  ["web", "spletni"],
  ["data", "podatkovni"],
  ["cloud", "oblak"],
  ["security", "varnost", "cybersecurity", "infosec"],
  ["machine learning", "ml", "ai", "artificial intelligence"],
  ["wordpress", "wp"],
  ["php", "laravel", "symfony"],
  ["javascript", "js", "typescript", "ts"],
  ["python", "django", "flask"],
  ["java", "spring", "kotlin"],
  ["react", "next.js", "nextjs"],
  ["angular", "vue", "svelte"],
  [".net", "dotnet", "c#", "csharp"],
  ["ruby", "rails", "ruby on rails"],
  ["go", "golang"],
  ["rust"],
  ["node", "nodejs", "node.js"],
];

/**
 * Tech-specific keywords worth searching as standalone terms.
 * These often appear in job descriptions but not titles (e.g. a "Junior Programer"
 * listing that mentions Laravel in the body). Generic role words like "developer"
 * are excluded — they're too broad for standalone API searches.
 */
export const TECH_KEYWORDS = new Set([
  "frontend", "front-end", "backend", "back-end", "fullstack", "full-stack",
  "devops", "sre", "mobile", "ios", "android",
  "wordpress", "wp",
  "php", "laravel", "symfony",
  "javascript", "typescript",
  "python", "django", "flask",
  "java", "spring", "kotlin",
  "react", "next.js", "nextjs",
  "angular", "vue", "svelte",
  ".net", "dotnet", "c#",
  "ruby", "rails",
  "go", "golang",
  "rust",
  "node", "nodejs", "node.js",
  "machine learning", "ai",
]);

/**
 * Given a user's desired role string, expand it into multiple search terms
 * and a set of matching keywords for filtering results.
 *
 * Example: "wordpress engineer" →
 *   searchTerms: ["wordpress engineer", "wordpress developer", "wp developer", "wp engineer"]
 *   matchKeywords: ["wordpress", "wp", "engineer", "developer", "programmer", "dev", "razvijalec"]
 */
export function expandKeywords(desiredRole: string): {
  searchTerms: string[];
  matchKeywords: string[];
} {
  const words = desiredRole.toLowerCase().split(/\s+/);
  const allMatchKeywords = new Set<string>();
  const expandedGroups: string[][] = [];

  for (const word of words) {
    if (word.length <= 2) {
      allMatchKeywords.add(word);
      expandedGroups.push([word]);
      continue;
    }

    // Find synonym group for this word
    const group = SYNONYM_GROUPS.find((g) =>
      g.some((syn) => syn === word || syn.includes(word) || word.includes(syn))
    );

    if (group) {
      for (const syn of group) {
        allMatchKeywords.add(syn);
      }
      expandedGroups.push(group);
    } else {
      allMatchKeywords.add(word);
      expandedGroups.push([word]);
    }
  }

  // Generate search term combinations (limit to avoid explosion)
  const searchTerms = new Set<string>();
  searchTerms.add(desiredRole.toLowerCase());

  // If we have exactly 2 word groups, cross-combine them (max 20 combos)
  if (expandedGroups.length === 2) {
    for (const a of expandedGroups[0].slice(0, 5)) {
      for (const b of expandedGroups[1].slice(0, 4)) {
        searchTerms.add(`${a} ${b}`);
      }
    }
  } else if (expandedGroups.length === 1) {
    // Single word — just use synonyms as search terms
    for (const syn of expandedGroups[0].slice(0, 5)) {
      searchTerms.add(syn);
    }
  } else {
    // 3+ words — use original + swap each word for top synonyms
    for (let i = 0; i < expandedGroups.length; i++) {
      for (const syn of expandedGroups[i].slice(0, 3)) {
        const combo = [...words];
        combo[i] = syn;
        searchTerms.add(combo.join(" "));
      }
    }
  }

  // Also add individual tech keywords as standalone search terms.
  // APIs like MojeDelo search descriptions, so "laravel" alone will find
  // jobs titled "Junior Programer" that mention Laravel in the body.
  for (const kw of allMatchKeywords) {
    if (TECH_KEYWORDS.has(kw)) {
      searchTerms.add(kw);
    }
  }

  return {
    searchTerms: [...searchTerms].slice(0, 10), // Cap at 10 search queries
    matchKeywords: [...allMatchKeywords].filter((k) => k.length > 2),
  };
}
