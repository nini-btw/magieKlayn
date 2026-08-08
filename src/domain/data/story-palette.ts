/**
 * Static brand content for the /about page's story section.
 * @module domain/data/story-palette
 *
 * This is a deliberate hardcoded snapshot, not a live data source — the
 * About page reads it directly with zero network round-trip so the color
 * strip renders instantly on load. The 14-mist catalog is a fixed brand
 * number ("Fourteen mists, fourteen moods" is baked into the marketing
 * copy), so it doesn't need to track the live product table in real time.
 *
 * If the catalog's signature colors or lineup ever change, update this
 * file by hand to match.
 */

export interface StoryPaletteItem {
  colorHex: string;
  name: string;
}

/** One entry per active mist, in the same order as the shop — colorHex
 * values extracted from the live product data. */
export const STORY_PALETTE: StoryPaletteItem[] = [
  { name: "Rose Land", colorHex: "#f5027e" },
  { name: "Carat", colorHex: "#1e267b" },
  { name: "Libre Choix", colorHex: "#239858" },
  { name: "Miss Black", colorHex: "#1B1B1B" },
  { name: "Miss Dame", colorHex: "#F7F1E7" },
  { name: "Vague d'Amour", colorHex: "#2FB6A8" },
  { name: "Very Women", colorHex: "#7A3E9E" },
  { name: "Cool Lady", colorHex: "#A98AE0" },
  { name: "Lady Show", colorHex: "#F4CE55" },
  { name: "My Belle", colorHex: "#EFAE7D" },
  { name: "Femme Interdite", colorHex: "#7A1F2B" },
  { name: "Femme Desirée", colorHex: "#D0223A" },
  { name: "Belle de Nuit", colorHex: "#f3cee5" },
  { name: "Lovely Day", colorHex: "#C43A63" },
];

export interface InspiredByEntry {
  mist: string;
  inspiration: string;
}

/** Each Magie Klayn mist paired with the original fragrance it's
 * inspired by — supplied directly by the brand, proper nouns are not
 * translated across locales. */
export const INSPIRED_BY: InspiredByEntry[] = [
  { mist: "Vague d'Amour", inspiration: "Wild Flower" },
  { mist: "Cool Lady", inspiration: "Backstage Angel" },
  { mist: "My Belle", inspiration: "Coconut Passion" },
  { mist: "Miss Dame", inspiration: "Strawberry" },
  { mist: "Femme Desirée", inspiration: "Paradise" },
  { mist: "Carat", inspiration: "Bare Vanilla Noir" },
  { mist: "Libre Choix", inspiration: "Xerjoff Erba Pura" },
  { mist: "Miss Black", inspiration: "Parfum de Marly Delina" },
  { mist: "Lovely Day", inspiration: "Dior Lucky" },
  { mist: "Belle de Nuit", inspiration: "Pune Seduction" },
  { mist: "Femme Interdite", inspiration: "Gucci Flora" },
  { mist: "Rose Land", inspiration: "After Party Angel" },
  { mist: "Very Women", inspiration: "Tom Ford Vanille Sex" },
  { mist: "Lady Show", inspiration: "Jean Paul Gaultier Scandal" },
];
