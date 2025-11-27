export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlever accents
    .trim();
}

/**
 * Filtre une liste de noms de stations avec un query.
 */
export function filterStations(
  allStations: string[],
  query: string,
  limit = 10
): string[] {
  const q = normalize(query);
  if (!q) return [];

  return allStations
    .filter((name) => normalize(name).includes(q))
    .slice(0, limit);
}

/**
 * Vérifie si deux noms de station correspondent (pour valider la réponse).
 */
export function isSameStation(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}
