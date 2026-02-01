// ═══════════════════════════════════════════
// STONE HQ — Shared constants & theme
// ═══════════════════════════════════════════

export const TILE = 48;
export const MAP_COLS = 26;
export const MAP_ROWS = 18;
export const PROXIMITY_RANGE = 3;
export const VIDEO_RANGE = 2;

export const T = {
  bg: "#111114", surface: "#1a1a1f", surfaceAlt: "#22222a",
  border: "#2a2a32", borderLight: "#353540", text: "#e8e6f0",
  textMuted: "#8a8898", textDim: "#55546a", accent: "#00e39e",
  accentDim: "rgba(0,227,158,0.10)", warn: "#ffb224",
  danger: "#ff4d6a", info: "#3b9eff",
};

export const STATUS = {
  available: { color: T.accent, label: "Disponível", icon: "●" },
  busy: { color: T.warn, label: "Ocupado", icon: "●" },
  focus: { color: T.danger, label: "Focado", icon: "◆" },
  meeting: { color: T.info, label: "Em Reunião", icon: "▶" },
  away: { color: T.textDim, label: "Ausente", icon: "○" },
};

export const PALETTES = [
  ["#6366f1","#818cf8"],["#ec4899","#f472b6"],["#14b8a6","#2dd4bf"],
  ["#f97316","#fb923c"],["#8b5cf6","#a78bfa"],["#06b6d4","#22d3ee"],
  ["#e11d48","#fb7185"],["#84cc16","#a3e635"],["#d946ef","#e879f9"],
  ["#0ea5e9","#38bdf8"],["#f43f5e","#fb7185"],["#10b981","#34d399"],
];

// 0=floor 1=wall 2=desk 3=bigplant 4=meeting 5=kitchen 6=sofa 7=whiteboard
// 8=door 9=server 10=bookshelf 11=carpet 12=rug 13=coffee 14=watercooler
// 15=printer 16=smallplant 17=lamp
export const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,11,11,11,11,11,0,1,0,0,0,0,0,0,0,0,1,0,0,12,12,12,12,0,0,1],
  [1,11,2,0,2,11,0,1,0,16,0,0,0,0,16,0,1,0,0,4,4,4,12,0,0,1],
  [1,11,0,0,0,11,0,1,0,0,0,0,0,0,0,0,8,0,0,4,4,4,12,7,0,1],
  [1,11,2,0,2,11,0,8,0,0,0,0,0,0,0,0,1,0,0,12,12,12,12,0,0,1],
  [1,11,11,11,11,11,3,1,0,0,17,0,0,3,0,0,1,0,0,0,0,0,0,0,16,1],
  [1,1,1,8,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,8,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,17,0,0,0,0,0,0,0,15,0,0,0,0,0,0,0,0,17,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,8,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,8,1,1,1,1,1,1],
  [1,12,12,12,12,0,0,1,0,0,0,0,0,0,0,0,1,0,0,11,11,11,11,11,0,1],
  [1,12,6,6,12,0,0,1,0,0,16,0,0,0,16,0,1,0,0,11,5,5,13,11,0,1],
  [1,12,6,6,12,0,10,8,0,0,0,0,3,0,0,0,8,0,0,11,5,14,0,11,0,1],
  [1,12,12,12,12,3,0,1,0,0,0,0,0,0,0,0,1,0,0,11,0,0,9,11,0,1],
  [1,0,0,0,0,0,0,1,0,17,0,0,0,0,17,0,1,0,0,11,11,11,11,11,16,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const ROOMS = [
  {id:"dev",label:"Engenharia",icon:"⌨",x:1,y:1,w:6,h:5,color:"#6366f1"},
  {id:"open",label:"Open Space",icon:"◈",x:8,y:1,w:8,h:5,color:T.accent},
  {id:"meeting",label:"War Room",icon:"◉",x:17,y:1,w:8,h:5,color:T.info},
  {id:"hall",label:"Hall Central",icon:"⬡",x:1,y:7,w:24,h:4,color:T.textMuted},
  {id:"lounge",label:"Lounge",icon:"☾",x:1,y:12,w:6,h:5,color:"#d946ef"},
  {id:"corridor2",label:"Corredor Sul",icon:"→",x:8,y:12,w:8,h:5,color:T.textDim},
  {id:"kitchen",label:"Copa & Infra",icon:"◎",x:17,y:12,w:8,h:5,color:T.warn},
];

// Spawn points for new users
export const SPAWN_POINTS = [
  {x:12,y:8},{x:13,y:8},{x:11,y:9},{x:14,y:9},{x:10,y:8},
  {x:15,y:8},{x:12,y:9},{x:13,y:9},{x:11,y:7},{x:14,y:7},
];

export function dist(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
export function canWalk(x,y){
  if(x<0||y<0||x>=MAP_COLS||y>=MAP_ROWS)return false;
  const t=MAP[y]?.[x]; return t===0||t===8||t===11||t===12;
}
export function getRoom(x,y){return ROOMS.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)}
export function timeNow(){return new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}
