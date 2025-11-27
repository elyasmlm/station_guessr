const STORAGE_KEY = "metroGuessUserId";

function generateUserId(): string {
  return `user_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") {
    return generateUserId();
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const newId = generateUserId();
  window.localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}
