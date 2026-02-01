# 🟢 Stone HQ — Virtual Office (Live Multiplayer)

Escritório virtual em tempo real para o time Stone.

## 🚀 Setup Rápido (3 passos)

### 1. Banco de Dados (Supabase)
Abra o Supabase Dashboard do projeto:
**https://supabase.com/dashboard/project/wcdmwzxwzrncmkoxogho**

Vá em **SQL Editor** e cole TODO o conteúdo do arquivo `supabase-setup.sql`. Execute.

Depois vá em **Authentication > Providers** e confirme que **Email** está habilitado.

> ⚠️ **Importante**: Em Authentication > Settings, desative "Enable email confirmations" para facilitar o onboarding do time (cada pessoa cria conta e já entra direto).

### 2. Instalar e Rodar Local
```bash
cd stone-hq-live
npm install
npm run dev
```
Acesse http://localhost:5173

### 3. Deploy (Vercel — grátis)
```bash
npm install -g vercel
vercel
# Siga as instruções, aceite os defaults
# Pronto! Você recebe uma URL pública tipo: https://stone-hq-abc123.vercel.app
```

Ou via GitHub:
1. Crie um repo no GitHub
2. Push este projeto
3. Conecte no vercel.com > New Project > Import
4. Deploy automático

## 🏗 Arquitetura

```
Frontend (React + Vite)
    ↕ Supabase Realtime (Presence + Broadcast)
    ↕ Supabase PostgreSQL (mensagens, perfis)
    ↕ Supabase Auth (email + senha)
```

**Presence** → sincroniza posição, status, avatar em tempo real
**Broadcast** → chat e reações instantâneas
**Database** → persistência de mensagens e perfis

## 🎮 Controles
- **WASD / Setas** — Mover pelo mapa
- **E** — Interagir com pessoa próxima
- **R** — Abrir reações
- **Click no mapa** — Teleportar
- **Click no avatar (header)** — Editar avatar/foto

## 📁 Estrutura
```
src/
├── main.jsx              # Entry point
├── App.jsx               # App principal (mapa, sidebar, modals)
├── lib/
│   ├── supabase.js       # Client Supabase
│   ├── constants.js      # Tema, mapa, helpers
│   └── useRealtime.js    # Hook multiplayer
└── components/
    ├── AuthScreen.jsx     # Login/signup
    └── OfficeTile.jsx     # Tile renderer
```

## 🔧 Customizações
- **Mapa**: Edite `MAP` em `constants.js` (grid 26x18)
- **Salas**: Edite `ROOMS` em `constants.js`
- **Cores**: Edite `T` (theme) em `constants.js`
- **Canais de chat**: Edite `channels` no `App.jsx`
