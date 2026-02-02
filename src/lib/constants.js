// ═══════════════════════════════════════════
// VOXUY OFFICE — Shared constants & theme
// ═══════════════════════════════════════════

export const TILE = 48;
export const MAP_COLS = 28;
export const MAP_ROWS = 16;
export const PROXIMITY_RANGE = 3;
export const VIDEO_RANGE = 2;

// Font family for the app (rounded, friendly)
export const FONT = "'Inter', 'SF Pro Rounded', -apple-system, sans-serif";
export const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

export const T = {
  bg: "#0c0c14", surface: "#14141e", surfaceAlt: "#1c1c28",
  border: "#2a2a3a", borderLight: "#3a3a4a", text: "#f4f4fc",
  textMuted: "#a0a0b8", textDim: "#606078", accent: "#6366f1",
  accentDim: "rgba(99,102,241,0.15)", warn: "#f59e0b",
  danger: "#ef4444", info: "#3b82f6", success: "#10b981",
  accentLight: "#818cf8", accentGlow: "rgba(99,102,241,0.3)",
};

export const STATUS = {
  available: { color: "#10b981", label: "Disponível", icon: "●" },
  busy: { color: T.warn, label: "Ocupado", icon: "●" },
  focus: { color: T.danger, label: "Focado", icon: "◆" },
  meeting: { color: T.accent, label: "Em Reunião", icon: "▶" },
  away: { color: T.textDim, label: "Ausente", icon: "○" },
};

export const PALETTES = [
  ["#6366f1", "#818cf8"], ["#ec4899", "#f472b6"], ["#14b8a6", "#2dd4bf"],
  ["#f97316", "#fb923c"], ["#8b5cf6", "#a78bfa"], ["#06b6d4", "#22d3ee"],
  ["#e11d48", "#fb7185"], ["#84cc16", "#a3e635"], ["#d946ef", "#e879f9"],
  ["#0ea5e9", "#38bdf8"], ["#f43f5e", "#fb7185"], ["#10b981", "#34d399"],
];

// Tile types:
// 0=floor 1=wall 2=desk 3=bigplant 4=meeting 5=kitchen 6=sofa 7=whiteboard
// 8=door 9=server 10=bookshelf 11=carpet 12=rug 13=coffee 14=watercooler
// 15=printer 16=smallplant 17=lamp 18=chair 19=tv 20=window

export const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 20, 0, 0, 0, 0, 20, 1, 11, 11, 11, 11, 11, 11, 1, 20, 0, 0, 0, 0, 0, 20, 1, 12, 12, 12, 12, 1],
  [1, 0, 2, 0, 2, 0, 0, 8, 0, 0, 0, 0, 0, 0, 1, 0, 4, 4, 4, 4, 0, 0, 8, 0, 4, 4, 0, 1],
  [1, 0, 0, 0, 0, 0, 16, 1, 0, 2, 0, 2, 0, 16, 1, 0, 4, 4, 4, 4, 0, 7, 1, 0, 4, 4, 0, 1],
  [1, 0, 2, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 20, 0, 0, 0, 0, 20, 1, 11, 11, 2, 0, 2, 11, 1, 20, 0, 0, 0, 0, 0, 20, 1, 12, 6, 6, 12, 1],
  [1, 1, 1, 8, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 1],
  [1, 1, 1, 8, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1],
  [1, 12, 0, 0, 0, 12, 0, 1, 11, 11, 11, 11, 11, 11, 1, 0, 0, 0, 0, 0, 0, 0, 1, 11, 0, 5, 5, 1],
  [1, 12, 6, 6, 6, 12, 0, 8, 0, 0, 15, 0, 0, 0, 8, 0, 2, 0, 2, 0, 0, 16, 1, 11, 0, 13, 14, 1],
  [1, 12, 6, 6, 6, 12, 10, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 1],
  [1, 12, 0, 19, 0, 12, 0, 1, 0, 9, 9, 0, 0, 17, 1, 0, 2, 0, 2, 0, 0, 0, 1, 11, 0, 5, 5, 1],
  [1, 20, 0, 0, 0, 20, 3, 1, 20, 0, 0, 0, 0, 20, 1, 20, 0, 0, 0, 0, 0, 20, 1, 20, 0, 0, 20, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const ROOMS = [
  { id: "dev", label: "Engenharia", icon: "💻", x: 1, y: 1, w: 6, h: 5, color: "#6366f1" },
  { id: "design", label: "Design", icon: "🎨", x: 8, y: 1, w: 6, h: 5, color: "#ec4899" },
  { id: "meeting1", label: "Sala Alpha", icon: "🎯", x: 15, y: 1, w: 7, h: 5, color: "#3b82f6" },
  { id: "meeting2", label: "Sala Beta", icon: "✨", x: 23, y: 1, w: 4, h: 5, color: "#8b5cf6" },
  { id: "hall", label: "Hall Central", icon: "🏢", x: 1, y: 7, w: 26, h: 2, color: T.textMuted },
  { id: "lounge", label: "Lounge", icon: "☕", x: 1, y: 10, w: 6, h: 5, color: "#d946ef" },
  { id: "infra", label: "Infra & TI", icon: "🖥", x: 8, y: 10, w: 6, h: 5, color: "#14b8a6" },
  { id: "open", label: "Open Space", icon: "🚀", x: 15, y: 10, w: 7, h: 5, color: T.accent },
  { id: "kitchen", label: "Copa", icon: "🍳", x: 23, y: 10, w: 4, h: 5, color: T.warn },
];

// Spawn points for new users (in the hall)
export const SPAWN_POINTS = [
  { x: 10, y: 7 }, { x: 11, y: 7 }, { x: 12, y: 7 }, { x: 13, y: 8 }, { x: 14, y: 7 },
  { x: 15, y: 8 }, { x: 16, y: 7 }, { x: 17, y: 7 }, { x: 18, y: 8 }, { x: 19, y: 7 },
];

export function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) }
export function canWalk(x, y) {
  if (x < 0 || y < 0 || x >= MAP_COLS || y >= MAP_ROWS) return false;
  const t = MAP[y]?.[x]; return t === 0 || t === 8 || t === 11 || t === 12;
}
export function getRoom(x, y) { return ROOMS.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) }
export function timeNow() { return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }
