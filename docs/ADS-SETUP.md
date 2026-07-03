# Ads & Donations Setup — Owner Steps

What Austin needs to do to activate the monetization surfaces (PRODUCT.md §6.5).
The code side is env-gated and ready: the ad slot renders only when
`NEXT_PUBLIC_AD_PROVIDER` is set. **Last updated:** 2026-07-03

## Reality check (verified 2026-07-03)

| Network | Acceptance bar | Revenue | Fit |
|---|---|---|---|
| **EthicalAds** | **50k+ pageviews/month** required; developer-audience sites | ~$2.50 CPM | Best brand fit (privacy-first, no cookie banner needed) — but gated on traffic we don't have yet |
| **Carbon Ads** | Apply/invite; also expects established dev traffic | similar | Same story — a "later" option |
| **Google AdSense** | No traffic minimum; content-quality review | low at our volume | Only immediate option; heavier scripts + GDPR cookie-consent banner — worst brand fit |
| **Buy Me a Coffee** | None | donations | Zero barrier — do this now |

Napkin math: even at EthicalAds' 50k/month floor, ads yield ≈ $125/month.
Pre-launch traffic ≈ 0 → ads revenue ≈ $0 regardless of network. The sane
sequence is: donations now, ads when traffic justifies them.

## Recommended sequence

### ✅ Done (2026-07-03): Buy Me a Coffee
Page live at buymeacoffee.com/exercise.api; `NEXT_PUBLIC_COFFEE_URL` set in
Vercel (Production + Preview); ☕ links render in header + footer. Profile
photo: https://exercise-api.com/brand/avatar-1024.png.

### At launch + traffic: EthicalAds (preferred)
1. Watch traffic in Vercel Analytics (checklist item — not yet installed).
2. When the site clears ~50k pageviews/month, apply at
   ethicalads.io/publishers/ (category: developer tools / API).
3. On approval you get a **publisher ID** and a test-ads phase.
4. Send me the publisher ID → I set `NEXT_PUBLIC_AD_PROVIDER=ethicalads` +
   `NEXT_PUBLIC_AD_PUBLISHER_ID`, implement their client
   (`ethicalads.min.js` + `data-ea-publisher` div) in the existing AdSlot
   position, and submit the placement for their review.
5. Payments: $50 payout threshold; PayPal / GitHub Sponsors / OpenCollective /
   Stripe bank transfer.

### Optional interim: AdSense (only if you want ads pre-traffic)
1. Sign up at adsense.google.com with exercise-api.com; verify site ownership
   (I can add the meta tag / ads.txt when you have the code).
2. Pass their content review (usually days; needs the docs site live to look
   substantial).
3. Send me the client ID → same env-var pattern, plus I add a minimal
   cookie-consent banner (their EEA requirement) — noting this dents the
   "clean dev tool" aesthetic; my recommendation is to skip AdSense and go
   donations-only until EthicalAds is reachable.

## What's already done (code side)
- Ad slot in the pricing section renders **nothing** unless
  `NEXT_PUBLIC_AD_PROVIDER` is set (shipped 2026-07-03).
- Design has placements for the coffee link (header/footer/pricing) behind a
  `showCoffee` flag — wiring is a small change once the URL exists.
- Never in API responses or docs content, per PRODUCT.md.
