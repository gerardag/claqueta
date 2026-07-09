# Claqueta 🎬

App self-hosted de seguiment de sèries de televisió. Afegeix les sèries que mires, marca episodis com a vistos, consulta el calendari d'emissions i importa l'historial des de TVTime.

## Què fa

- **Seguiment de sèries**: cerca sèries (via TMDB), afegeix-les i marca episodis com a vistos.
- **Calendari d'emissions**: veure quan s'emeten els pròxims episodis de les sèries que segueixes.
- **Estat intel·ligent**: les sèries es classifiquen automàticament en seccions: "Estàs mirant", "Watchlist", "En seguiment", "Fa temps que no les mires", "Completades" i "Abandonades".
- **Importació de TVTime**: puja el ZIP d'exportació de TVTime i importa tot l'historial d'un sol cop.
- **Multiusuari**: cada compte té el seu propi llistat i progrés, completament aïllat.
- **Interfície en català**: tota la UI en català per defecte.

## Requisits

- [Docker](https://docs.docker.com/get-docker/) i Docker Compose (recomanat)
- O bé: Node.js 22+ per a desenvolupament local
- Clau API (v3) de [TMDB](https://www.themoviedb.org/settings/api)

## Desplegament amb Docker Compose

### 1. Configura les variables d'entorn

Crea un fitxer `.env` a l'arrel del projecte:

```env
TMDB_API_KEY=la_teva_clau_tmdb
AUTH_SECRET=un_secret_aleatori       # openssl rand -base64 32
# ALLOW_REGISTRATION=false           # Descomenta per tancar el registre
```

### 2. Arrenca amb la imatge publicada

```bash
docker compose -f docker-compose.prod.yml up -d
```

L'app estarà disponible a `http://localhost:3210`.

Per clavar una versió concreta:

```bash
VERSION=v1.2.0 docker compose -f docker-compose.prod.yml up -d
```

### 3. Construir localment (opcional)

```bash
docker compose up -d --build
```

## Variables d'entorn

| Variable              | Obligatòria | Descripció                                              | Valor per defecte       |
|-----------------------|:-----------:|---------------------------------------------------------|-------------------------|
| `TMDB_API_KEY`        | Sí          | Clau API (v3) de TMDB                                  | —                       |
| `AUTH_SECRET`         | Sí          | Secret per signar les sessions JWT d'Auth.js            | —                       |
| `DATA_DIR`            | No          | Directori on es crea la base de dades SQLite            | `./data`                |
| `ALLOW_REGISTRATION`  | No          | Posar a `false` per desactivar el registre de nous comptes | `true`              |
| `STALE_DAYS`          | No          | Dies d'inactivitat perquè una sèrie es consideri oblidada | `45`                 |
| `TMDB_RATE_LIMIT`     | No          | Peticions/minut al proxy de TMDB                        | `40`                    |

## On viuen les dades

Totes les dades es guarden en un únic fitxer SQLite dins de `DATA_DIR` (per defecte `./data/claqueta.db`). El `docker-compose.yml` munta `./data` com a volum, de manera que les dades persisteixen entre reinicis.

### Còpia de seguretat

```bash
# Mentre l'app funciona — SQLite suporta còpies en calent
cp ./data/claqueta.db ./data/claqueta.db.bak

# O amb sqlite3 (més segur)
sqlite3 ./data/claqueta.db ".backup './data/claqueta-backup.db'"
```

Per restaurar, atura l'app i substitueix `claqueta.db` pel backup.

## Importació de TVTime

1. A TVTime, ves a **Ajustos → Compte → Descarregar les meves dades**.
2. Rebràs un ZIP per correu amb els CSVs de les teves sèries i episodis.
3. A Claqueta, ves a **Importació** i puja el ZIP (o els CSVs solts).
4. L'import processa les sèries, resol els IDs de TVDB a TMDB, i marca els episodis com a vistos.
5. Les sèries amb tots els episodis emesos marcats es classifiquen automàticament com a **Completades**.

## Desenvolupament local

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Executa els tests amb vitest
npm run db:studio    # Obre Drizzle Studio per inspeccionar la BBDD
```

## Commits i releases

El projecte usa [Conventional Commits](https://www.conventionalcommits.org/). Activa el hook de validació:

```bash
git config core.hooksPath .githooks
```

A cada push a `main`, el workflow de GitHub Actions:

1. Executa els tests.
2. Calcula la versió automàticament a partir dels commits.
3. Crea un tag i una release a GitHub.
4. Construeix i puja la imatge Docker a `ghcr.io`.

## Llicència

Projecte privat. Tots els drets reservats.
