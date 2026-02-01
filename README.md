# 🟣 Voxuy Office — Virtual Office (Live Multiplayer)

Escritório virtual em tempo real para equipes Voxuy.

## 🚀 Setup Rápido (3 passos)

### 1. Banco de Dados (Supabase)
Abra o Supabase Dashboard do projeto:
**https://supabase.com/dashboard/project/wcdmwzxwzrncmkoxogho**

Vá em **SQL Editor** e cole TODO o conteúdo do arquivo `supabase-setup.sql`. Execute.

Depois vá em **Authentication > Providers** e confirme que **Email** está habilitado.

> ⚠️ **Importante**: Em Authentication > Settings, desative "Enable email confirmations" para facilitar o onboarding do time (cada pessoa cria conta e já entra direto).

### 2. Instalar e Rodar Local
```bash
npm install
npm run dev
```
Acesse http://localhost:5173

### 3. Deploy (Vercel — grátis)
```bash
npm install -g vercel
vercel
# Siga as instruções, aceite os defaults
# Pronto! Você recebe uma URL pública tipo: https://voxuy-office.vercel.app
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

## 🎨 Identidade Visual

O projeto segue a identidade visual da **Voxuy**:

| Elemento | Cor |
|----------|-----|
| **Azul Primário (Voxuy Blue)** | `#351FFF` |
| **Azul Claro** | `#5a4aff` |
| **Background** | `#0a0a12` |
| **Surface** | `#12121a` |
| **Texto** | `#f0f0f8` |
| **Sucesso** | `#22c55e` |
| **Perigo** | `#DC2626` |

**Fontes:**
- **Inter** — Fonte principal para UI
- **JetBrains Mono** — Fonte monospace para código/labels

## 🔧 Customizações
- **Mapa**: Edite `MAP` em `constants.js` (grid 26x18)
- **Salas**: Edite `ROOMS` em `constants.js`
- **Cores**: Edite `T` (theme) em `constants.js`
- **Canais de chat**: Edite `channels` no `App.jsx`

---

Desenvolvido com 💜 para a equipe Voxuy
