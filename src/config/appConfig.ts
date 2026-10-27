/**
 * BRAND IDENTITY & CENTRAL CONFIGURATION
 * Single source of truth for Muslim Quran branding and theme tokens.
 */
export const APP_CONFIG = {
  appName: "Muslim Quran",
  primaryColor: "#064E3B",
  tagline: "Your Daily Connection with the Quran",

  theme: {
    deepEmerald: "#064E3B",
    forestGreen: "#022C22",
    emerald: "#047857",
    metallicGold: "#D4AF37",
    softGold: "#F5D782",
    ivory: "#FFF8E7",
    warmWhite: "#F8FAF7",
    charcoal: "#1F2937"
  },

  apiBaseUrl: "https://equran.id/api/v2"
};

export const QARI_LIST = [
  { id: '05', name: 'Misyari Rasyid Al-Afasi' },
  { id: '01', name: 'Abdullah Al-Juhany' },
  { id: '02', name: 'Abdul Muhsin Al-Qasim' },
  { id: '03', name: 'Abdurrahman as-Sudais' },
  { id: '04', name: 'Ibrahim Al-Dossari' },
  { id: '06', name: 'Yasser Al-Dosari' },
] as const;

export type QariId = typeof QARI_LIST[number]['id'];
