// Utilitaires de tri des lignes par numéro croissant (L1, L2, … L9, L10, …).
// Un tri alphabétique donnerait L1, L10, L2… ; on extrait donc l'entier.
export const lineNum = (s?: string | null): number => {
  const m = (s || "").match(/\d+/);
  return m ? parseInt(m[0], 10) : 1_000_000;
};

export const byLine = <T extends { lineNumber?: string | null }>(a: T, b: T): number =>
  lineNum(a.lineNumber) - lineNum(b.lineNumber);

// Prix spécial applicable pour `n` personnes, d'après une liste de paliers
// (le palier retenu est le plus grand dont minSeats <= n). null si aucun.
export const tierPrice = (tiers: { minSeats: number; price: number }[] | undefined | null, n: number): number | null => {
  const applicable = (tiers || []).filter((t) => t.minSeats <= n).sort((a, b) => b.minSeats - a.minSeats)[0];
  return applicable ? applicable.price : null;
};
