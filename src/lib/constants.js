// ═══════════════════════════════════════════
// VOXUY OFFICE — Core Constants & Config
// ═══════════════════════════════════════════

export const TILE = 40              // Tile size in pixels
export const MAP_COLS = 32
export const MAP_ROWS = 20
export const PROXIMITY_RANGE = 3
export const VIDEO_RANGE = 5

// Theme - Clean, Professional Look
export const T = {
  bg: '#f5f7fa',             // Light gray background
  surface: '#ffffff',        // White surfaces
  border: '#e2e8f0',         // Light border
  borderLight: '#edf2f7',    // Even lighter border
  text: '#1a202c',           // Dark text
  textMuted: '#4a5568',      // Muted text
  textDim: '#a0aec0',        // Dimmed text
  accent: '#4f46e5',         // Indigo accent
  accentLight: '#6366f1',    // Lighter accent
  accentDim: '#eef2ff',      // Very light accent bg
  accentGlow: 'rgba(79,70,229,0.25)',
  danger: '#ef4444',
  warn: '#f59e0b',
  success: '#10b981',
  font: "'Inter', -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', monospace",
}

export const STATUS = {
  available: { label: 'Disponível', color: '#10b981', icon: '●' },
  busy: { label: 'Ocupado', color: '#ef4444', icon: '◆' },
  away: { label: 'Ausente', color: '#f59e0b', icon: '○' },
  dnd: { label: 'Não perturbe', color: '#8b5cf6', icon: '◇' },
}

export const PALETTES = [
  ['#6366f1', '#818cf8'], ['#ec4899', '#f472b6'], ['#14b8a6', '#2dd4bf'],
  ['#f97316', '#fb923c'], ['#8b5cf6', '#a78bfa'], ['#06b6d4', '#22d3ee'],
  ['#84cc16', '#a3e635'], ['#f43f5e', '#fb7185'],
]

// Office Map Legend:
// 0 = floor, 1 = wall, 2 = desk, 3 = plant, 4 = meeting table
// 5 = kitchen, 6 = sofa, 7 = whiteboard, 8 = door, 9 = server
// 10 = bookshelf, 11 = carpet blue, 12 = carpet purple, 13 = coffee
// 14 = water, 15 = printer, 16 = small plant, 17 = lamp, 18 = chair
// 19 = TV/monitor, 20 = window, 21 = label pos

export const MAP = [
  // Row 0 - Top wall
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  // Row 1 - Windows on top
  [1, 20, 20, 20, 20, 20, 20, 1, 20, 20, 20, 20, 20, 20, 1, 1, 20, 20, 20, 20, 20, 20, 1, 20, 20, 20, 20, 20, 20, 20, 20, 1],
  // Row 2 - Engineering room left, Meeting room center-left, Lounge center-right, CEO right
  [1, 11, 2, 18, 2, 18, 11, 1, 11, 4, 4, 4, 4, 11, 8, 1, 12, 6, 0, 0, 6, 12, 1, 11, 0, 2, 18, 0, 16, 11, 0, 1],
  [1, 11, 18, 2, 18, 2, 11, 1, 11, 4, 4, 4, 4, 11, 0, 1, 12, 6, 0, 0, 6, 12, 1, 11, 0, 18, 2, 0, 0, 11, 7, 1],
  [1, 11, 2, 18, 2, 18, 11, 1, 11, 18, 18, 18, 18, 11, 0, 1, 12, 0, 13, 14, 0, 12, 1, 11, 0, 0, 0, 0, 0, 11, 0, 1],
  [1, 11, 0, 0, 0, 0, 11, 1, 11, 0, 0, 0, 7, 11, 0, 1, 12, 0, 0, 0, 0, 12, 1, 11, 0, 0, 3, 0, 0, 11, 0, 1],
  [1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1],
  // Row 7 - Hallway  
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 1],
  [1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1],
  // Row 10 - Design room left, Open Space center, Server room right
  [1, 12, 0, 0, 0, 0, 12, 1, 11, 2, 18, 0, 2, 18, 0, 0, 0, 2, 18, 0, 2, 18, 11, 1, 11, 9, 0, 9, 11, 0, 0, 1],
  [1, 12, 2, 18, 0, 16, 12, 1, 11, 18, 2, 0, 18, 2, 0, 3, 0, 18, 2, 0, 18, 2, 11, 1, 11, 9, 0, 9, 11, 15, 0, 1],
  [1, 12, 18, 2, 0, 0, 12, 1, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 11, 0, 0, 0, 11, 0, 0, 1],
  [1, 12, 0, 0, 7, 0, 12, 1, 11, 2, 18, 0, 2, 18, 0, 0, 0, 2, 18, 0, 2, 18, 11, 1, 11, 9, 0, 9, 11, 0, 0, 1],
  [1, 1, 1, 8, 1, 1, 1, 1, 11, 18, 2, 0, 18, 2, 0, 3, 0, 18, 2, 0, 18, 2, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  // Row 15 - Kitchen left, Open Space continues, Storage right
  [1, 12, 5, 5, 0, 0, 12, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 12, 10, 10, 10, 12, 0, 0, 1],
  [1, 12, 13, 14, 0, 0, 12, 1, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 12, 10, 10, 10, 12, 0, 0, 1],
  [1, 12, 0, 0, 0, 6, 12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 12, 0, 0, 0, 12, 0, 0, 1],
  // Row 18-19 - Bottom wall with windows
  [1, 20, 20, 20, 20, 20, 20, 1, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 1, 20, 20, 20, 20, 20, 20, 20, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

// Room definitions with clear labels
export const ROOMS = [
  { id: 'engineering', label: '💻 Desenvolvimento', x1: 1, y1: 1, x2: 6, y2: 5, color: '#6366f1' },
  { id: 'meeting-alpha', label: '🎯 Produto', x1: 8, y1: 1, x2: 13, y2: 5, color: '#14b8a6' },
  { id: 'lounge', label: '🌴 Dubai', x1: 16, y1: 1, x2: 21, y2: 5, color: '#f97316' },
  { id: 'cx', label: '🎧 CX', x1: 24, y1: 1, x2: 30, y2: 5, color: '#8b5cf6' },
  { id: 'enterprise', label: '⚖️ Enterprise/LegalSense', x1: 1, y1: 10, x2: 6, y2: 13, color: '#ec4899' },
  { id: 'open-space', label: '🎤 Auditório', x1: 8, y1: 10, x2: 22, y2: 16, color: '#06b6d4' },
  { id: 'focus', label: '🎯 Foco', x1: 24, y1: 10, x2: 28, y2: 13, color: '#64748b' },
  { id: 'kitchen', label: '🍳 Cozinha', x1: 1, y1: 15, x2: 6, y2: 17, color: '#eab308' },
  { id: 'storage', label: '🐱 Sala do Kiko', x1: 24, y1: 15, x2: 28, y2: 17, color: '#78716c' },
  { id: 'hallway', label: '🚪 Hall', x1: 1, y1: 7, x2: 30, y2: 8, color: '#94a3b8' },
]

export const SPAWN_POINTS = [
  { x: 15, y: 7 }, { x: 16, y: 7 }, { x: 17, y: 7 }, // Corredor central
  { x: 15, y: 8 }, { x: 16, y: 8 }, { x: 17, y: 8 },
]

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
export const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
export const canWalk = (x, y) => {
  if (x < 0 || y < 0 || x >= MAP_COLS || y >= MAP_ROWS) return false
  const t = MAP[y]?.[x]
  // Can walk on: floor(0), door(8), carpet blue(11), carpet purple(12), chair(18), server(9), printer(15), small plant(16)
  // Also walkable: desk(2), meeting table(4), kitchen counter(5), sofa(6)
  return t === 0 || t === 2 || t === 4 || t === 5 || t === 6 || t === 8 || t === 9 || t === 11 || t === 12 || t === 15 || t === 16 || t === 18
}
export const getRoom = (x, y) => ROOMS.find(r => x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2) || null
export const timeNow = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
