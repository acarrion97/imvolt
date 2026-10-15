// theme/brand.ts
// Paleta oficial IMVOLT — Manual de Marca v1, §04 COLOR.
//
//   70% blanco o carbón · 20% grises neutros · 10% verde como énfasis.
// El verde NO se usa para texto pequeño sobre blanco si compromete el
// contraste: las acciones primarias usan verde profundo (#075335) y el verde
// vivo (#00D94B) queda reservado a acentos, estados e isotipo.

export const brand = {
  // Colores institucionales (no modificar)
  carbón: "#101719", // Carbón tecnológico — texto y fondos profundos
  verdeImvolt: "#00D94B", // Verde IMVOLT — acento principal
  verdeLuminoso: "#04EB40", // Punto inicial del gradiente
  verdeProfundo: "#075335", // Punto final del gradiente
  blanco: "#FFFFFF",
  niebla: "#F2F7F4", // Superficies secundarias

  // Derivados funcionales (grises neutros y estados)
  grisTextoSecundario: "#3D4A4C",
  grisTextoTerciario: "#6B7A7C",
  grisBorde: "#DCE6E0",
  grisBordeSuave: "#EAF1EC",
  rojo: "#DC2626",
  rojoClaro: "#F87171",
  ambar: "#A87C1A",
  ambarClaro: "#E8C25C",

  // Light theme
  light: {
    bg: "#F2F7F4",
    bgSecondary: "#F2F7F4",
    bgContainer: "#FFFFFF",
    bgElevated: "#FFFFFF",
    text: "#101719",
    textSecondary: "#3D4A4C",
    textTertiary: "#6B7A7C",
    border: "#DCE6E0",
    borderSecondary: "#EAF1EC",
    primary: "#075335",
    primaryHover: "#0A6A43",
    primaryBg: "#E7F6EC",
    success: "#075335",
    successHover: "#0A6A43",
    successBg: "#E7F6EC",
    warning: "#A87C1A",
    warningHover: "#8A6516",
    warningBg: "#FBF3DE",
    error: "#DC2626",
    errorHover: "#B91C1C",
    errorBg: "#FDECEC",
    link: "#075335",
    linkHover: "#0A6A43",
    accent: "#00D94B",
    siderBg: "#101719",
    siderItemSelectedBg: "rgba(0, 217, 75, 0.14)",
    headerBg: "#FFFFFF",
    bodyBg: "#F2F7F4",
    tableHeaderBg: "#F2F7F4",
    tableRowHoverBg: "#F2F7F4",
  },

  // Dark theme
  dark: {
    bg: "#101719",
    bgSecondary: "#101719",
    bgContainer: "#182224",
    bgElevated: "#1F2B2D",
    text: "#F2F7F4",
    textSecondary: "#C3D0CE",
    textTertiary: "#8A9A98",
    border: "#263538",
    borderSecondary: "#1E2A2C",
    primary: "#00D94B",
    primaryHover: "#04EB40",
    primaryBg: "#123023",
    success: "#00D94B",
    successHover: "#04EB40",
    successBg: "#123023",
    warning: "#E8C25C",
    warningHover: "#F0D48A",
    warningBg: "#2A2416",
    error: "#F87171",
    errorHover: "#FCA5A5",
    errorBg: "#2C1A1A",
    link: "#00D94B",
    linkHover: "#04EB40",
    accent: "#00D94B",
    siderBg: "#0B1113",
    siderItemSelectedBg: "rgba(0, 217, 75, 0.16)",
    headerBg: "#182224",
    bodyBg: "#101719",
    tableHeaderBg: "#182224",
    tableRowHoverBg: "#1F2B2D",
  },
} as const;

export type BrandTheme = typeof brand.light;

/** Gradiente institucional del isotipo (verde luminoso → verde profundo). */
export const IMVOLT_GRADIENT = `linear-gradient(135deg, ${brand.verdeLuminoso} 0%, ${brand.verdeProfundo} 100%)`;
