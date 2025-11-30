
export type LineKind = "METRO" | "RER" | "TRAM" | "TRAIN";

export interface LineImageInfo {
  kind: LineKind;
  label: string; // "7", "A", "T3b"...
  src: string;   // chemin vers l'image dans /public
  alt: string;
}

/**
 * Convertit un libellé de ligne brut ("METRO 7", "RER A", "TRAM 3B", "T3b")
 * en info d'image (/lines/metro_7.svg, etc.).
 */
export function getLineImageInfo(raw: string): LineImageInfo {
  const upper = raw.toUpperCase().trim();

  // METRO X
  if (upper.startsWith("METRO")) {
    const num = upper.replace("METRO", "").trim();
    const id = num.toLowerCase();
    return {
      kind: "METRO",
      label: num,
      src: `/lines/metro_${id}.svg`,
      alt: `Ligne de métro ${num}`,
    };
  }

  // RER X
  if (upper.startsWith("RER")) {
    const letter = upper.replace("RER", "").trim().charAt(0) || "A";
    const id = letter.toLowerCase();
    return {
      kind: "RER",
      label: letter,
      src: `/lines/rer_${id}.svg`,
      alt: `Ligne RER ${letter}`,
    };
  }

    // TRAIN X
  if (upper.startsWith("TRAIN")) {
    const letter = upper.replace("TRAIN", "").trim().charAt(0) || "A";
    const id = letter.toLowerCase();
    return {
      kind: "TRAIN",
      label: letter,
      src: `/lines/train_${id}.svg`,
      alt: `Ligne TRAIN ${letter}`,
    };
  }

  // TRAM X (TRAM 3B, TRAM 7...)
  if (upper.startsWith("TRAM")) {
    const rest = upper.replace("TRAM", "").trim();
    const clean = rest.replace(/^T/i, "");
    const id = `t${clean.toLowerCase()}`;
    return {
      kind: "TRAM",
      label: `T${clean}`,
      src: `/lines/tram_${id}.svg`,
      alt: `Ligne de tram ${clean}`,
    };
  }

  // Cas où l'API envoie directement "T3b"
  if (upper.startsWith("T")) {
    const clean = upper.slice(1); // "3B"
    const id = `t${clean.toLowerCase()}`; // "t3b"
    return {
      kind: "TRAM",
      label: `T${clean}`,
      src: `/lines/tram_${id}.svg`,
      alt: `Ligne de tram ${clean}`,
    };
  }

  // Fallback générique si format inattendu
  const safe = upper.replace(/\s+/g, "_").toLowerCase();
  return {
    kind: "METRO",
    label: upper,
    src: `/lines/${safe}.png`,
    alt: raw,
  };
}
