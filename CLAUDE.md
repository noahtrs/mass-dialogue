# CLAUDE.md — AI Assistant Guide for MassDialogue

## Project Overview

**MassDialogue** is a React-based civic forum platform for city-level discussions about local infrastructure and civic issues. Users can post, upvote, and comment on topics, while AI agents provide automated infrastructure analysis and report generation.

**Tech Stack:**
- **Frontend:** React 19, Create React App (react-scripts 5)
- **Database/Realtime:** Supabase
- **AI/Agents:** OpenAI GPT-3.5-turbo, KaibanJS, LangChain Community
- **Email:** Nodemailer + Google OAuth2 (Gmail)
- **Deployment:** Vercel

---

## Repository Structure

```
mass-dialogue/
├── src/
│   ├── App.js               # Legacy main app (older version)
│   ├── App.jsx              # Active main app — forum UI with tabs
│   ├── App.css              # Global styles
│   ├── routes.js            # KaibanJS AI agent definitions (two agents)
│   ├── ReportGenerate.js    # Report generation UI component
│   ├── ReportGenerate.css
│   ├── reportGenerator.js   # OpenAI-powered forum summary logic
│   ├── supabaseClient.js    # Supabase client initialization
│   ├── config-overrides.js  # Webpack polyfills for Node modules in browser
│   ├── index.js             # React entry point
│   ├── index.css
│   ├── setupTests.js
│   ├── App.test.js          # Smoke test
│   ├── reportWebVitals.js
│   └── components/
│       └── AgentsPage.jsx   # Agent management UI (triggers + displays AI results)
│   └── styles/
│       └── AgentsPage.css
├── email/
│   └── send-email.js        # Standalone Node.js script — generates & emails report
├── public/                  # Static assets (index.html, favicon, manifest)
├── .kaiban/                 # KaibanJS DevTools Vite app (agent visualization)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .env.example             # Required env vars template
├── vercel.json              # Vercel SPA rewrite rules
├── package.json
└── README.md
```

### Key File Roles

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main forum app: posts, comments, upvotes, search, tabs |
| `src/routes.js` | Defines two KaibanJS AI agents for infrastructure analysis |
| `src/reportGenerator.js` | Fetches top posts from Supabase, summarizes with OpenAI |
| `src/components/AgentsPage.jsx` | UI to trigger agents and display their results |
| `src/supabaseClient.js` | Single Supabase client instance (validates env vars) |
| `src/config-overrides.js` | Webpack overrides for crypto/path/os polyfills |
| `email/send-email.js` | CLI script: generate report → send via Gmail OAuth2 |

---

## Development Setup

### Prerequisites
- Node.js v14+
- npm
- Supabase project with required tables
- OpenAI API key
- Google OAuth2 credentials (for email feature)

### Installation

```bash
npm install
cp .env.example .env
# Fill in all values in .env
npm start
```

### Environment Variables

All required variables are defined in `.env.example`. Copy it to `.env` and populate:

```
# Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co/
REACT_APP_SUPABASE_KEY=your-supabase-anon-key

# OpenAI
REACT_APP_OPENAI_API_KEY=your-openai-api-key
OPENAI_API_KEY=your-openai-api-key   # Used by send-email.js (Node env)

# Google OAuth2 (for email feature)
CLIENT_ID=your-google-oauth-client-id
CLIENT_SECRET=your-google-oauth-client-secret
REDIRECT_URI=https://developers.google.com/oauthplayground
REFRESH_TOKEN=your-google-oauth-refresh-token
SENDER_EMAIL=your-email@gmail.com
RECIPIENT_LIST=recipient1@example.com,recipient2@example.com
```

> React app variables must be prefixed with `REACT_APP_` to be accessible in browser code.
> Node scripts (e.g., `email/send-email.js`) use plain variable names without the prefix.

---

## Development Commands

```bash
npm start          # Start dev server (port 3000)
npm run build      # Production build → build/ directory
npm test           # Run tests (watch mode)
npm test -- --coverage  # Tests with coverage report
```

### Email Script (Node.js — runs outside React)

```bash
node email/send-email.js
```

Requires all Google OAuth and OpenAI env vars to be set in the shell environment.

### KaibanJS DevTools (optional visualization)

```bash
cd .kaiban
npm install
npm run dev        # Vite dev server for agent visualization
```

---

## Architecture & Key Conventions

### React Patterns

- **Functional components only** — no class components
- **Hooks:** `useState`, `useEffect` for all state and side effects
- **Real-time:** Supabase channel subscriptions in `useEffect` with cleanup
- **Two App files exist:** `App.js` (legacy) and `App.jsx` (active). Prefer `App.jsx`.

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `AgentsPage`, `CommentSection` |
| Functions | camelCase | `handleSubmitPost`, `fetchPosts` |
| CSS classes | kebab-case | `.post-form`, `.vote-button` |
| Constants | UPPER_SNAKE_CASE | `MAX_POST_LENGTH`, `MAX_COMMENT_LENGTH` |
| Env vars (React) | `REACT_APP_` prefix + UPPER_SNAKE_CASE | `REACT_APP_OPENAI_API_KEY` |

### Input Validation Limits

These constants are defined in `App.jsx` and must be respected:

```js
MAX_POST_LENGTH = 5000     // characters
MAX_COMMENT_LENGTH = 2000  // characters
MAX_SEARCH_LENGTH = 200    // characters
```

### Architecture: Two-Tier API Pattern

**Browser (src/):** Uses only the SUPABASE_ANON_KEY (`REACT_APP_SUPABASE_*`) for real-time subscriptions and read-only operations. **All write operations go through the Express API server.**

**Server (api/):** `api/server.js` runs an Express server that uses `SUPABASE_SERVICE_ROLE_KEY` (never exposed to browser) for all write operations. OpenAI calls are made server-side — the API key is never bundled into the client.

- `api/server.js` — Express API endpoints: `/api/posts`, `/api/posts/:id/vote`, `/api/posts/:id/comments`, `/api/report`
- `api/supabaseService.js` — Server-side DB operations with input validation
- `supabase/migrations/` — SQL migrations for the `post_votes` table (vote tracking)

### Security Requirements

- **Always sanitize user input** before sending to LLMs (see `sanitizeForLLM()` in `api/supabaseService.js`)
- **Never expose OpenAI API key** in browser code — route all OpenAI calls through `api/server.js`
- **Never hardcode** API keys, credentials, or secrets — use environment variables
- **Validate all user inputs** on the server side before processing or storing (see `validatePostText()`, `validateCommentText()` in `api/supabaseService.js`)
- Use `REACT_APP_` prefix for browser-side env vars only

### Supabase Usage

- **Browser client** (`src/supabaseClient.js`): Uses anon key for real-time subscriptions only. All writes must go through the API server.
- **Server client** (`api/supabaseService.js`): Uses service_role key with input validation. All write operations (create post, create comment, update votes) go through Express API endpoints.
- Real-time subscriptions should be set up in `useEffect` and cleaned up on unmount via `supabase.removeChannel()`
- Database tables: `messages` (posts), `comments` (nested under posts), `post_votes` (vote tracking)

### AI Agents (KaibanJS + routes.js)

- Two agents are defined in `src/routes.js`:
  1. **Infrastructure Analyst** — Boston bridges, MBTA, water systems
  2. **AI Technology Analyst** — AI implementations in infrastructure
- Both use `gpt-3.5-turbo` with fixed prompt configurations
- Agent results are displayed in `AgentsPage.jsx` with states: TO-DO, DOING, DONE, FAILED
- Agent workflows use KaibanJS `Team` and `Task` abstractions

### Webpack / Node Polyfills

`src/config-overrides.js` is critical — it provides browser polyfills for Node built-ins used by LangChain/KaibanJS:
- `crypto` → `crypto-browserify`
- `path` → `path-browserify`
- `os` → `os-browserify/browser`

Do not remove or modify this file without understanding the dependency chain.

---

## Testing

Tests use **Jest** + **React Testing Library**.

```bash
npm test
```

Current test coverage is minimal (smoke test only in `App.test.js`). When adding new features:
- Add component tests in `src/` alongside the component
- Follow React Testing Library conventions (`getByRole`, `getByText`, etc.)
- Mock Supabase and OpenAI calls in tests

---

## Deployment

The app deploys to **Vercel** via `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

All `REACT_APP_*` environment variables must be configured in the Vercel project settings.

---

## Git Workflow

- Main branch: `main`
- Feature branches follow the pattern: `claude/<short-description>-<id>`
- PRs are reviewed and merged into `main`
- Commit messages should be descriptive and imperative mood (e.g., "Fix security vulnerability in input handling")

---

## Common Gotchas

1. **Two App files:** `App.js` and `App.jsx` both exist. `App.jsx` is the current version. Edits should go to `App.jsx`.
2. **Polyfills required:** LangChain/KaibanJS need Node polyfills in the browser — handled by `config-overrides.js` via `react-app-rewired`. If you add new Node-dependent packages, update the polyfill config.
3. **Env var prefix:** Browser code requires `REACT_APP_` prefix. `email/send-email.js` runs in Node and uses unprefixed names — both may be needed for the same key.
4. **Supabase real-time cleanup:** Always call `supabase.removeChannel()` in `useEffect` cleanup to prevent memory leaks and duplicate subscriptions.
5. **KaibanJS DevTools** (`.kaiban/`) is a separate Vite project with its own `package.json` — run `npm install` inside it separately.
6. **No CI/CD pipeline** is configured — tests and linting must be run manually before pushing.
