export interface SearchDoc {
  kind: 'brand' | 'device' | 'ai' | 'streaming' | 'beginners' | 'safety' | 'troubleshooting' | 'article' | 'hub';
  kindLabel: string;
  title: string;
  subtitle: string;
  url: string;
  category: string;
  keywords: string;
  body: string;
  meta: string;
}

export interface SearchMatch {
  doc: SearchDoc;
  score: number;
  expandedTerms: string[];
}

export interface SynonymConfig {
  groups: string[][];
}

let cachedDocs: SearchDoc[] | null = null;
let cachedSynonyms: SynonymConfig | null = null;

export async function loadSearchAssets(): Promise<{ docs: SearchDoc[]; synonyms: SynonymConfig }> {
  if (cachedDocs && cachedSynonyms) {
    return { docs: cachedDocs, synonyms: cachedSynonyms };
  }
  const [docsRes, synRes] = await Promise.all([
    fetch('/search-index.json'),
    fetch('/search-synonyms.json'),
  ]);
  cachedDocs = (await docsRes.json()) as SearchDoc[];
  cachedSynonyms = (await synRes.json()) as SynonymConfig;
  return { docs: cachedDocs, synonyms: cachedSynonyms };
}

export function normalizeQuery(q: string): string {
  return String(q || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

export function expandQueryTerms(query: string, synonyms: SynonymConfig): string[][] {
  const tokens = normalizeQuery(query)
    .split(/[\s,，、/|]+/)
    .filter(Boolean);

  return tokens.map((token) => {
    const variants = new Set<string>([token]);
    for (const group of synonyms.groups || []) {
      const lowerGroup = group.map((g) => g.toLowerCase());
      if (lowerGroup.some((g) => g === token || (token.length >= 2 && (g.includes(token) || token.includes(g))))) {
        for (const item of lowerGroup) {
          variants.add(item);
        }
      }
    }
    // Partial Chinese character bigrams for longer Chinese queries (e.g. "苹果手机怎么设置")
    if (/[\u4e00-\u9fa5]{4,}/.test(token)) {
      for (let i = 0; i <= token.length - 2; i++) {
        const gram = token.slice(i, i + 2);
        if (!['怎么', '什么', '哪些', '可以', '如何', '教程', '问题'].includes(gram)) {
          variants.add(gram);
        }
      }
    }
    return [...variants];
  });
}

export function searchDocuments(
  docs: SearchDoc[],
  synonyms: SynonymConfig,
  query: string,
  categoryFilter = 'all'
): SearchMatch[] {
  const norm = normalizeQuery(query);
  if (!norm) return [];

  const tokenGroups = expandQueryTerms(norm, synonyms);
  const allTerms = [...new Set(tokenGroups.flat())];
  const results: SearchMatch[] = [];

  for (const doc of docs) {
    if (categoryFilter !== 'all' && doc.kind !== categoryFilter) continue;

    const titleLow = doc.title.toLowerCase();
    const subLow = (doc.subtitle || '').toLowerCase();
    const kwLow = (doc.keywords || '').toLowerCase();
    const bodyLow = (doc.body || '').toLowerCase();
    const catLow = (doc.category || '').toLowerCase();

    let totalScore = 0;
    let groupsMatched = 0;

    for (const group of tokenGroups) {
      let groupBest = 0;
      for (const term of group) {
        const isPrimary = term === group[0];
        const weight = isPrimary ? 1 : 0.72;

        if (titleLow === term) groupBest = Math.max(groupBest, 160 * weight);
        else if (titleLow.includes(term)) groupBest = Math.max(groupBest, 95 * weight);

        if (doc.kind === 'brand' && (titleLow.includes(term) || kwLow.includes(term))) {
          groupBest = Math.max(groupBest, 110 * weight);
        }

        if (kwLow.includes(term)) groupBest = Math.max(groupBest, 58 * weight);
        if (catLow.includes(term)) groupBest = Math.max(groupBest, 42 * weight);
        if (subLow.includes(term)) groupBest = Math.max(groupBest, 34 * weight);
        if (bodyLow.includes(term)) groupBest = Math.max(groupBest, 18 * weight);

        // Mild typo tolerance for English terms >= 4 chars
        if (groupBest === 0 && /^[a-z0-9]{4,}$/.test(term)) {
          const words = `${titleLow} ${kwLow}`.split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
          for (const w of words) {
            if (editDistance(term, w) === 1) {
              groupBest = Math.max(groupBest, 40);
              break;
            }
          }
        }
      }
      if (groupBest > 0) {
        groupsMatched++;
        totalScore += groupBest;
      }
    }

    // Require either all primary tokens (or >=1 when multi-gram) to match meaningfully
    if (groupsMatched === 0) continue;
    if (tokenGroups.length > 1 && groupsMatched === tokenGroups.length) {
      totalScore += 45;
    }

    // Direct full-phrase bonus
    if (titleLow.includes(norm)) totalScore += 120;
    else if (kwLow.includes(norm)) totalScore += 60;

    results.push({ doc, score: totalScore, expandedTerms: allTerms });
  }

  return results.sort((a, b) => b.score - a.score);
}

export function highlightText(text: string, terms: string[]): string {
  const esc = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  if (!terms.length) return esc;

  const sorted = [...new Set(terms.filter((t) => t.length >= 2))].sort((a, b) => b.length - a.length).slice(0, 8);
  if (sorted.length === 0) return esc;

  const pattern = new RegExp(`(${sorted.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return esc.replace(pattern, '<mark class="bg-blue-100 text-blue-900 rounded px-0.5 font-semibold">$1</mark>');
}
