// File search utilities with fuzzy matching

import type { FileMatch, SearchOptions } from '../types/search.js';

// Normalisation simple (lowercase + trim)
export function normalize(str: string): string {
  return str.toLowerCase().trim();
}

// Contains match (simple et rapide)
export function containsMatch(query: string, candidates: string[]): FileMatch[] {
  const q = normalize(query);
  return candidates
    .filter(c => normalize(c).includes(q))
    .map(path => ({
      path,
      score: 1.0,
      matchType: 'contains' as const
    }));
}

// Levenshtein distance (pour fuzzy matching)
function levenshtein(a: string, b: string): number {
  const matrix = [];

  // Initialize first column
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Fuzzy match avec scoring
export function fuzzyMatch(query: string, candidates: string[]): FileMatch[] {
  const q = normalize(query);

  return candidates
    .map(path => {
      const normalized = normalize(path);
      const distance = levenshtein(q, normalized);
      const maxLen = Math.max(q.length, normalized.length);
      const score = 1 - (distance / maxLen);

      return {
        path,
        score,
        matchType: 'fuzzy' as const
      };
    })
    .filter(m => m.score >= 0.6)  // Seuil minimum
    .sort((a, b) => b.score - a.score);
}

// Fonction principale de recherche
export function search(options: SearchOptions, allFiles: string[]): FileMatch[] {
  const { query, maxResults = 10, fuzzy = false } = options;

  // 1. Exact match first
  const exact = allFiles.filter(f => f === query);
  if (exact.length > 0) {
    return exact.map(path => ({
      path,
      score: 1.0,
      matchType: 'exact' as const
    }));
  }

  // 2. Contains match
  const contains = containsMatch(query, allFiles);
  if (contains.length > 0 && !fuzzy) {
    return contains.slice(0, maxResults);
  }

  // 3. Fuzzy match if enabled
  if (fuzzy) {
    const fuzzyResults = fuzzyMatch(query, allFiles);
    return [...contains, ...fuzzyResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  return contains.slice(0, maxResults);
}
