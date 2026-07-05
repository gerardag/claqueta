CONTEXTO DEL PROYECTO "CLAQUETA"
- App self-hosted de seguimiento de series nutrida por la API de TMDB.
- Stack: Next.js 16 (App Router, TypeScript, src/), Tailwind CSS v4, SQLite + Drizzle ORM,
  Auth.js v5 (Credentials), next-intl (locale por defecto y único inicial: "ca").
- TODA la UI en catalán. Ningún texto hardcodeado en componentes: siempre via next-intl
  (messages/ca.json). El código (variables, comentarios de código) en inglés.
- La API key de TMDB vive SOLO en el servidor (env TMDB_API_KEY). El cliente nunca llama
  a TMDB directamente: siempre a través de /api/tmdb/* (proxy con caché y rate limit).
- BBDD en DATA_DIR (por defecto ./data/claqueta.db), pensada para bind mount en Docker.
- Estados de serie por usuario: WATCHING, FOLLOWING, COMPLETED, STOPPED.
- Commits en Conventional Commits (feat:, fix:, chore:, docs:...).
- No introduzcas dependencias nuevas sin justificarlas. Mantén el código simple y legible.
- Si algo del encargo es ambiguo, elige la opción más simple y déjalo anotado en el PR/commit.
