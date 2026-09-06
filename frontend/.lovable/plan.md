# Gold Trading & AI Portfolio Platform — Build Plan

A premium RTL Persian dark FinTech dashboard. Real user accounts via Lovable Cloud; all market prices, AI signals, and ledger rows come from a realistic mock/simulation layer that can later be swapped for a real feed.

## Foundation

- Enable Lovable Cloud (database + auth).
- Global RTL: `dir="rtl"` + `lang="fa"` on the html shell.
- Vazirmatn loaded via a `<link>` in the root route; tabular numerals for all price displays.
- Dark-only design tokens in `src/styles.css`: deep blue-black surfaces (`#0D0D1A` / `#0F0F23`), gold accent, green/red PnL semantics, glass surface tokens, gold-border card variants.

## Authentication (real accounts, no public signup)

- `profiles` table (display name, username, avatar, risk params: stop-loss %, take-profit %) linked to auth users, auto-created by trigger, RLS scoped to the owner.
- Separate `user_roles` table + `has_role()` security-definer function for admin actions.
- `/auth` — glassmorphism card, gold border, gold coin mark, title «پلتفرم ترید لایو و هوش مصنوعی طلا», username **select** (populated from allowed accounts) + password + large primary CTA «ورود به داشبورد معاملاتی».
- Self-registration disabled in UI; accounts are provisioned by an admin. I'll create one seed account and share how to add more.
- Everything else lives under a protected `_authenticated` layout.

## App Shell

- Right-hand sidebar: nav (داشبورد، دفتر کل، آلارم‌ها، تحلیل تکنیکال، ارزیابی AI، تنظیمات), profile snippet, logout with proper cache teardown.
- Sticky top Market Status Banner: online/offline daemon dot, market open/closed, last tick timestamp, tinted border per state.
- Collapsible sidebar; panels stack on tablet.

## Mock Market Engine

A client simulation hook that ticks every few seconds: mazaneh/gram gold price, XAU ounce, USD rate, derived bubble %, SMA20, MACD, K-Means support/resistance levels, and AI probability distribution. All numbers flash green/red on change. Single source that every panel subscribes to, so swapping in a real feed later touches one module.

## Dashboard

1. **5 KPI cards** — total asset value (with gold-backing weight subtext), open gold position (long gold / short red, break-even price), realized profit (+ Gold Alpha in grams), unrealized PnL, return index %. Glass cards, gold right-border, tooltips on jargon.
2. **AI Signal & Advice Engine** — sentiment-colored bordered card, raw signal headline, personalized advice text that cross-references the user's actual fiat/gold balance, three probability bars (buy/hold/sell), nested dark box with 3 support (green) and 3 resistance (red) levels.
3. **Intraday Tactical Radar** — compact technical strip: status text, distance to 20-SMA, MACD momentum, gold/USD ratio, left border tinted by sentiment.
4. **Asset Rotation Oracle (طلا ⟷ دلار)** — large directive card comparing coin bubble vs ounce vs dollar, bold rotation verdict with directional coloring.

## Advanced Ledger (دفتر کل پیشرفته)

- `counterparties` and `ledger_entries` tables, RLS owner-scoped, seeded with demo rows.
- Counterparty selector + 4-column summary (ROI, open gold, realized PnL, unrealized PnL, turnover) + risk box with stop-loss / take-profit targets.
- Actions: reset & carry over balance, wipe to zero (danger, confirm dialog), quick-add special row.
- Editable grid with the 12 RTL columns from the spec: inline editing, thousand-separator formatting, disabled auto-computed balance columns, checkboxes for فردایی / تسویه, add & delete rows, master save.
- Smart fill: entering gold in/out + mazaneh auto-computes the fiat debtor/creditor field.

## Other Tabs (functional scaffolds)

- **آلارم‌های قیمتی** — upper/lower bound form, active alerts list with delete, persisted to Cloud.
- **تحلیل تکنیکال** — Recharts candlestick + volume on simulated OHLC, timeframe switcher.
- **ارزیابی هوش مصنوعی** — backtest accuracy table, confusion matrix, feature-importance bar chart on mock data.
- **تنظیمات پروفایل** — change password, reset ledger, edit stop-loss/take-profit risk params.

## Polish

Skeleton loaders on every heavy panel, tick flash animation on numbers, tooltips throughout (e.g. Gold Alpha), graceful tablet stacking, per-route Persian head metadata.

## Technical Notes

TanStack Start routes under `src/routes/_authenticated/`; Cloud reads/writes via `createServerFn` with `requireSupabaseAuth`; TanStack Query for caching; shadcn primitives restyled to the dark gold system rather than default styling; roles never stored on the profile row.
