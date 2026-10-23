# Budget Gamer API

The app talks to its data through a [tRPC](https://trpc.io) router, plus two HTTP endpoints for the
scheduled scrapers. Pages read from the database directly when they render, so the HTTP API is
mainly for link submissions and for other clients that want the same data.

- [Conventions](#conventions)
- [Data types](#data-types)
- [Procedures](#procedures)
- [Cron endpoints](#cron-endpoints)
- [Server action](#server-action)

## Conventions

### Base URL

All procedures live under `/api/trpc/<router>.<procedure>`, e.g.
`https://budget-gamer.vercel.app/api/trpc/freeGames.getAvailableGames`.

### Transformer

Requests and responses are encoded with [superjson](https://github.com/flightcontrolhq/superjson),
so dates survive the round trip. Wrap inputs in `{ "json": ... }`; responses put the value under
`result.data.json`, with type hints (for example, which fields are dates) under `result.data.meta`.

### Queries

Queries take a `GET` request. Pass inputs (none of the current queries take any) as a URL-encoded
`input` parameter.

```bash
curl https://budget-gamer.vercel.app/api/trpc/freeGames.getAvailableGames
```

```json
{
  "result": {
    "data": {
      "json": [{ "id": 1, "name": "Some Game", "end_date": "2026-10-22T15:00:00.000Z", "...": "..." }],
      "meta": { "values": { "0.end_date": ["Date"], "...": ["Date"] } }
    }
  }
}
```

### Mutations

Mutations take a `POST` request with a JSON body.

```bash
curl -X POST https://budget-gamer.vercel.app/api/trpc/freeGames.validateGameLink \
  -H "content-type: application/json" \
  -d '{"json":{"link":"https://store.steampowered.com/app/1234/"}}'
```

### Errors

Errors use tRPC's error shape. The HTTP status matches `data.httpStatus`, and `message` is safe to
show to users for `BAD_REQUEST`, `CONFLICT` and `NOT_FOUND`. `zodError` is set when the input
failed validation.

```json
{
  "error": {
    "json": {
      "message": "That game is already listed.",
      "code": -32009,
      "data": { "code": "CONFLICT", "httpStatus": 409, "path": "freeGames.validateGameLink", "zodError": null }
    }
  }
}
```

### Access levels

| Level        | Who can call it                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| **Public**   | Anyone, over HTTP or from server components.                                                                  |
| **Internal** | Only server code that creates its caller with `__internal: true` (the cron route). HTTP calls get `403 FORBIDDEN`. |

## Data types

All three tables share `id` (number), `createdAt` (date) and `updatedAt` (date or `null`). Each
store URL or article link appears only once.

### FreeGame

A game that is free to keep for a limited time.

| Field            | Type             | Notes                                                                 |
| ---------------- | ---------------- | --------------------------------------------------------------------- |
| `name`           | string           |                                                                       |
| `cover`          | string           | Landscape image URL                                                   |
| `cover_portrait` | string           | Portrait image URL, may be empty                                      |
| `description`    | string           |                                                                       |
| `developer`      | string           |                                                                       |
| `publisher`      | string \| null   |                                                                       |
| `start_date`     | date             | When the offer started                                                |
| `end_date`       | date             | When the offer ends                                                   |
| `free`           | boolean          |                                                                       |
| `platform_ids`   | string[]         | `windows`, `mac_os`, `linux`, `ps4`, `ps5`, ...                       |
| `provider_id`    | string           | `steam`, `epic_games`, `gog`, `humble_bundle`, `playstation`, `xbox`, `nintendo_eshop` |
| `provider_url`   | string           | Store page                                                            |
| `release_date`   | date \| null     |                                                                       |

### SubscriptionGame

A game included with a subscription this month. It has the same fields as `FreeGame`, except
`free`. `provider_id` is `amazon_games`, `humble_bundle`, `playstation`, `xbox_game_pass`,
`xbox_free_play_days` or `nintendo_switch_online`. A store URL appears once per service, so the
same Xbox game can be in Game Pass and Free Play Days at the same time.

Xbox and Nintendo listings use the European stores (Ireland, prices in EUR).

### Article

A giveaway post or page.

| Field         | Type   | Notes                                                    |
| ------------- | ------ | -------------------------------------------------------- |
| `title`       | string |                                                          |
| `description` | string |                                                          |
| `cover`       | string | Preview image URL or a local default under `/images/articles/` |
| `link`        | string | The giveaway page                                        |
| `domain`      | string | e.g. `reddit.com`                                        |
| `start_date`  | date   |                                                          |
| `end_date`    | date   | Articles are listed for 7 days                           |

## Procedures

### `freeGames`

| Procedure           | Type     | Access   | Input                       | Returns                                  |
| ------------------- | -------- | -------- | --------------------------- | ---------------------------------------- |
| `getAvailableGames` | query    | Public   | none                        | `FreeGame[]` active now, soonest-ending first |
| `validateGameLink`  | mutation | Public   | `{ link: string }` (URL, ≤ 2048 chars) | `{ success: true, provider }`   |
| `createFreeGame`    | mutation | Internal | All `FreeGame` fields except ids and timestamps | nothing        |

`validateGameLink` only adds a game after checking its store page:

- **Steam**: `store.steampowered.com/app/<id>`. The game must be 100% off; the offer end date is read from the store page.
- **GOG**: `gog.com/game/<slug>` or `gog.com/<lang>/game/<slug>`. The game must be in a GOG giveaway or 100% off.
- **Humble Bundle**: `humblebundle.com/store/<slug>`. The current price must be 0.
- **PlayStation Store**: `store.playstation.com/<locale>/product/<id>`. The price must be 0.
- **Xbox**: `xbox.com/<locale>/games/store/<slug>/<product id>`. The full game (not a trial) must cost €0 while its normal price is above €0, checked in Microsoft's catalog for Ireland.
- **Nintendo eShop (Europe)**: a game page on `nintendo.com/<locale>/...-<id>.html` (lookups use the `en-gb` site). The sale price must be €0 while the regular price is above €0, checked with Nintendo's price API for Ireland. Free-to-start games and demos don't count.
- **Epic Games**: rejected with `BAD_REQUEST`, because the weekly cron adds Epic freebies automatically.

Possible errors:

- `BAD_REQUEST`: unsupported link, or the game isn't free.
- `NOT_FOUND`: the Steam app doesn't exist.
- `CONFLICT`: the game is already listed and its offer hasn't ended.

Checking a store page can take up to a minute, because it launches a headless browser.

### `subscriptionGames`

| Procedure                | Type     | Access   | Input                                                    | Returns                      |
| ------------------------ | -------- | -------- | -------------------------------------------------------- | ---------------------------- |
| `getSubscriptionGames`   | query    | Public   | none                                                     | `SubscriptionGame[]` active now |
| `createSubscriptionGame` | mutation | Internal | All `SubscriptionGame` fields except ids and timestamps  | nothing                      |

### `articles`

| Procedure                  | Type     | Access   | Input                                   | Returns                              |
| -------------------------- | -------- | -------- | --------------------------------------- | ------------------------------------ |
| `getAvailableArticles`     | query    | Public   | none                                    | `Article[]` active now, soonest-ending first |
| `validateAndCreateArticle` | mutation | Public   | `{ link: string }` (http(s) URL, ≤ 2048 chars) | `{ success: true, article }`   |
| `createArticleInternal`    | mutation | Internal | All `Article` fields except ids and timestamps | `{ success: true }`           |

`validateAndCreateArticle` accepts links on Twitter/X, Reddit, Humble Bundle, Gleam and Facebook
(including their subdomains). It fetches the page preview to fill in the title, description and
cover. It refuses addresses that resolve to private or loopback IPs.

Possible errors:

- `BAD_REQUEST`: the site isn't supported, or the link is invalid.
- `CONFLICT`: the article is already listed.

### `scheduled`

All internal mutations. The [cron endpoints](#cron-endpoints) call them; each returns a summary
such as `{ total, added, updated, failed, errors }`.

| Procedure              | Source                                                       | Writes to           |
| ---------------------- | ------------------------------------------------------------ | ------------------- |
| `getRedditArticles`    | r/GiftofGames, r/FreeGameFindings, r/steam_giveaway (last day) | `articles`        |
| `getAmazonPrimeGames`  | gaming.amazon.com                                            | `subscriptionGames` |
| `getEpicFreeGames`     | Epic Games free games promotions API                         | `freeGames`         |
| `getHumbleChoiceGames` | humblebundle.com/membership (replaces last month's list)     | `subscriptionGames` |
| `getPSPlusGames`       | playstation.com PS Plus monthly games                        | `subscriptionGames` |
| `getXboxGamePassGames` | Game Pass "Recently added" list, listed while Microsoft shows it | `subscriptionGames` |
| `getXboxFreePlayDays`  | Latest Xbox Wire Free Play Days post, listed until the weekend ends | `subscriptionGames` |
| `getXboxGiveaways`     | Store links in recent Xbox Wire posts that are free to keep  | `freeGames`         |
| `getNintendoGameTrials`| Nintendo of Europe's current Switch Online Game Trials       | `subscriptionGames` |

## Cron endpoints

```
GET /api/cron/daily       # Reddit articles, Humble Choice, PS Plus, Game Pass, Free Play Days,
                          # Xbox giveaways, Nintendo Game Trials
GET /api/cron/thursday    # Amazon Prime Gaming, Epic Games, Free Play Days
Authorization: Bearer <CRON_SECRET>
```

Vercel calls these on the schedule in [`vercel.json`](../vercel.json) and adds the header itself.
To trigger one by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://budget-gamer.vercel.app/api/cron/thursday
```

| Status | Meaning                                                                    |
| ------ | -------------------------------------------------------------------------- |
| `200`  | Every job succeeded                                                        |
| `401`  | Missing or wrong secret                                                    |
| `404`  | Unknown schedule                                                           |
| `500`  | At least one job failed; the others still ran and their results are kept |

The response body contains each job's outcome:

```json
{
  "schedule": "thursday",
  "successful": 1,
  "failed": 1,
  "results": {
    "amazonPrime": { "ok": false, "error": "Failed to process Amazon Prime games: ..." },
    "epicGames": { "ok": true, "result": { "total": 2, "added": 1, "updated": 1, "failed": 0, "errors": [] } }
  }
}
```

After every run, the endpoint revalidates `/`, `/timed` and `/articles`, so new data shows up
right away.

## Server action

The "Add a free game" and "Add an article link" panels call the `submitLink(link, type)` server
action in [`src/app/_actions/submit-link.ts`](../src/app/_actions/submit-link.ts). It wraps
`freeGames.validateGameLink` and `articles.validateAndCreateArticle`, and returns
`{ ok: boolean, message: string }` with a user-facing message. On success it revalidates the
affected page.
