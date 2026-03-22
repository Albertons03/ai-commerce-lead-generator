# Usage Service - Magyarázat

## Mi ez?

A `usage-service.ts` nyomon követi, hogy egy szervezet mennyi chat-et, tokent és leadet használt egy adott hónapban.

## Miért kell ez?

1. **Billing limit**: Ha Stripe integrációt adunk hozzá, tudni kell, hogy egy szervezet elérte-e a plan limitjét
2. **Analitika**: Dashboard-on megjeleníthetjük a havi használatot
3. **Fair use**: Megakadályozza, hogy valaki végtelen chateket indítson

## Hogyan működik?

### UPSERT logika
```
Ha nincs sor az org + hónapra → INSERT
Ha már van           → UPDATE (számlálók +=)
```
Ez **atomi** - nem lehet versenyhelyzet (race condition), mert az SQL-ben egy lépésben történik.

### Hónap formátum
Mindig `YYYY-MM` formátum, pl. `"2026-03"`. Miért nem dátum?
Mert havi aggregáció kell, és a string összehasonlítás egyszerűbb + gyorsabb.

### Fire-and-forget
A chat route-ban így hívjuk:
```ts
trackChatUsage(org_id, tokens).catch(() => {});
```
A `.catch(() => {})` azt jelenti: ha elromlik a tracking, **nem** omlik össze a chat API. A felhasználó megkapja a választ, a tracking hiba csak logban látszik.

### Admin kliens (service_role)
Az `increment_usage_metrics` SQL függvény `SECURITY DEFINER`-rel fut, és az RLS-t megkerüli. Ez szükséges, mert a szerver oldali kód bármelyik szervezet rekordjába írhat, nem csak a sajátjába.

## Fájlok

| Fájl | Szerepe |
|------|---------|
| `lib/billing/usage-service.ts` | TypeScript helpers |
| `supabase/migrations/20250322000000_create_usage_metrics.sql` | Tábla + SQL függvény |

## Integráció pontok

- `/api/chat/route.ts` → `trackChatUsage()` minden sikeres válasz után
- `/api/chat/route.ts` → `trackLeadUsage()` minden rögzített lead után
- (Jövőben) `/api/chat/route.ts` elején → `getCurrentMonthUsage()` limit ellenőrzés
