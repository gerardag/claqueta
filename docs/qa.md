# Guia de proves manuals (QA)

Guia per verificar que totes les funcionalitats de Claqueta funcionen correctament.

## Prerequisits

- L'aplicació arrencada (`npm run dev` o `docker compose up`)
- Clau TMDB configurada a `.env`
- Navegador obert a `http://localhost:3210`

---

## 1. Registre i autenticació

### 1.1 Registre de dos usuaris

1. Ves a `/registre`.
2. Crea l'usuari **A** amb correu `a@test.cat`, nom "Usuari A", contrasenya `password123`.
3. Verifica que et redirigeix a `/` i que la sessió està activa (nom visible al menú).
4. Tanca la sessió.
5. Crea l'usuari **B** amb correu `b@test.cat`, nom "Usuari B", contrasenya `password456`.
6. Verifica redirecció i sessió activa.

**Resultat esperat:** Dos comptes independents creats. No es permet registre amb el mateix correu.

### 1.2 Login i logout

1. Tanca sessió de l'usuari B.
2. Inicia sessió amb l'usuari A.
3. Verifica que el nom mostrat és "Usuari A".
4. Tanca sessió. Verifica redirecció a `/login`.

### 1.3 Credencials incorrectes

1. Intenta fer login amb un correu inexistent → missatge d'error "Credencials incorrectes".
2. Intenta fer login amb contrasenya errònia → mateix missatge.

---

## 2. Gestió de sèries

### 2.1 Cercar i afegir una sèrie

1. Amb l'usuari A, ves a `/search`.
2. Cerca "Breaking Bad".
3. Verifica que apareixen resultats amb pòster, nom i any.
4. Prem "Segueix" a Breaking Bad.
5. Verifica el toast "Sèrie afegida".
6. Ves a `/series`. Verifica que Breaking Bad apareix a la secció "Watchlist" (perquè no s'ha vist cap episodi).

### 2.2 Marcar episodis com a vistos

1. Des de `/series`, clica a Breaking Bad per anar al detall.
2. Desplega la Temporada 1.
3. Marca el primer episodi com a vist.
4. Verifica el toast "Episodi marcat com a vist".
5. Torna a `/series`. Verifica que Breaking Bad ha passat de "Watchlist" a "Estàs mirant".
6. Verifica que la barra de progrés reflecteix 1 episodi vist.

### 2.3 Marcar una temporada sencera

1. Torna al detall de Breaking Bad.
2. Prem "Marca tota la temporada" a la Temporada 1.
3. Verifica que tots els episodis de la T1 queden marcats.

### 2.4 Completar una sèrie

1. Marca totes les temporades de Breaking Bad com a vistes.
2. Ves a `/series`.
3. Verifica que Breaking Bad apareix a la pestanya "Completades".

### 2.5 Deixar de mirar

1. Afegeix una altra sèrie (p. ex. "The Office").
2. Marca uns quants episodis.
3. A la targeta de la sèrie, prem "Deixa de mirar".
4. Verifica que la sèrie passa a la pestanya "Abandonades".

### 2.6 Eliminar una sèrie

1. A la pestanya "Abandonades", prem "Elimina" a la sèrie abandonada.
2. Verifica el toast "Sèrie eliminada".
3. Verifica que la sèrie desapareix completament del llistat.

---

## 3. Secció "Fa temps que no les mires"

Per simular inactivitat sense esperar 45 dies:

```sql
-- Obre la BBDD amb sqlite3 o drizzle studio
-- Troba l'ID de l'usuari i d'una user_show activa
UPDATE user_shows
SET last_activity_at = strftime('%s', '2024-01-01') * 1000
WHERE user_id = 1 AND show_id = <SHOW_ID>;
```

1. Recarrega `/series`.
2. Verifica que la sèrie manipulada apareix a la secció "Fa temps que no les mires 💤".
3. Prem "Reprèn" → verifica que torna a "Estàs mirant" i que `last_activity_at` s'actualitza.

---

## 4. Calendari

1. Amb l'usuari A, ves a `/calendar`.
2. Verifica que es mostra el mes actual amb graella de dies.
3. Si hi ha episodis d'alguna sèrie seguida aquest mes, verifica que apareixen al dia corresponent.
4. Navega al mes anterior/següent amb les fletxes.
5. Verifica la secció "Properament" amb episodis futurs.
6. Marca un episodi com a vist des del calendari → verifica el toast.

---

## 5. Importació de TVTime

### 5.1 Importar un ZIP

1. Ves a `/import`.
2. Puja un ZIP d'exportació de TVTime (o CSVs solts: `followed_tv_show.csv`, `seen_episode.csv`).
3. Verifica que apareix la barra de progrés.
4. Espera que acabi. Verifica el resum: sèries importades, episodis marcats, sèries omeses.
5. Ves a `/series`. Verifica que les sèries importades apareixen al llistat.
6. Verifica que les sèries amb tots els episodis emesos vistos s'han marcat com a COMPLETED.

### 5.2 Sèries omeses

1. Si hi ha sèries omeses, verifica que es mostra el detall (nom + motiu).
2. Prem "Descarrega detall" si està disponible.

---

## 6. Aïllament entre usuaris

1. Amb l'usuari A, afegeix una sèrie i marca episodis.
2. Tanca sessió. Inicia sessió amb l'usuari B.
3. Ves a `/series`. Verifica que el llistat de l'usuari B és independent (no veu les sèries de A).
4. Afegeix la mateixa sèrie amb l'usuari B.
5. Verifica que el progrés de B és independent (0 episodis vistos).

---

## 7. Interfície en català

1. Navega per totes les pàgines i verifica que tots els textos són en català:
   - Login / Registre
   - Sèries (títols de secció, botons, toasts)
   - Cerca (placeholder, missatges)
   - Calendari (noms de mesos, dies de la setmana)
   - Importació (instruccions, missatges de progrés)
   - Configuració
   - Biblioteca
2. Verifica que cap text queda hardcodejat en anglès.

---

## 8. Protecció d'APIs sense sessió (401)

Obre un terminal i executa:

```bash
# Cerca TMDB (requereix sessió)
curl -s http://localhost:3210/api/tmdb/search?query=test | grep -q '"Unauthorized"' && echo "OK" || echo "FALLA"

# Afegir sèrie (requereix sessió)
curl -s -X POST http://localhost:3210/api/shows/track \
  -H "Content-Type: application/json" \
  -d '{"tmdbId":1396,"state":"WATCHING"}' | grep -q '"Unauthorized"' && echo "OK" || echo "FALLA"

# Importació (requereix sessió)
curl -s -X POST http://localhost:3210/api/import | grep -q '"Unauthorized"' && echo "OK" || echo "FALLA"
```

**Resultat esperat:** Totes les peticions sense sessió retornen `401 Unauthorized`.

---

## 9. Biblioteca

1. Ves a `/library`.
2. Verifica que es mostren totes les sèries de l'usuari, independentment de l'estat.
3. Usa el filtre de cerca per trobar una sèrie concreta.
4. Verifica que l'estat (Mirant, Seguint, Completada, Abandonada) es mostra correctament.

---

## Checklist final

- [ ] Registre de 2 usuaris funciona
- [ ] Login/logout correcte
- [ ] Credencials incorrectes mostren error
- [ ] Cerca de sèries funciona
- [ ] Afegir sèrie funciona
- [ ] Marcar episodis funciona
- [ ] Completar sèrie funciona
- [ ] Deixar de mirar funciona
- [ ] Eliminar sèrie funciona
- [ ] Secció "Fa temps que no les mires" funciona
- [ ] Calendari mostra episodis correctament
- [ ] Importació de TVTime funciona
- [ ] COMPLETED automàtic post-import funciona
- [ ] Aïllament entre usuaris
- [ ] Tota la UI en català
- [ ] APIs retornen 401 sense sessió
- [ ] Biblioteca funciona
