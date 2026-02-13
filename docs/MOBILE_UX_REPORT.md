# Mobile UX Deep Dive — Kingdom Builder

**Scope:** Mobile-only improvements. No changes to desktop/web behavior.

**Breakpoint:** Use `max-width: 767px` (or Tailwind `max-sm`) for mobile so `sm:` and up remain desktop.

---

## 1. Landing Page

### 1.1 New Game button — make full-width on mobile
- **Where:** `app/page.tsx` ~189–198
- **Current:** Button has `min-w-[200px]` and is in `flex justify-center`, so it stays centered and narrow.
- **Issue:** On mobile, a narrow button is a weaker call-to-action and a smaller tap target.
- **Fix (mobile only):** On viewports below `sm`, make the button full width: e.g. wrap in `w-full sm:w-auto` and use `w-full sm:min-w-[200px]` on the Button so it’s full-width on mobile only.

### 1.2 Recent games “Continue” — full-width on mobile
- **Where:** `app/page.tsx` ~212–238
- **Current:** Cards are already `w-full`; the inner layout is `flex items-center justify-between`. Visually they don’t read as “full-width” because of padding and the “Continue” label on the right.
- **Issue:** You want the card to feel like a single full-width action.
- **Fix (mobile only):** Keep `w-full`. Optionally on mobile: increase vertical padding (e.g. `py-4 sm:py-4` → `py-4` on mobile, or slightly larger), ensure the whole card is the tap target (already is), and consider making the “Continue” label more prominent or full-width so the card reads as one big continue action. No layout change needed for “full screen” except ensuring the container is full width (already is) and possibly `px-0` on mobile for true edge-to-edge if desired.

### 1.3 Civilization carousel — more horizontal aspect on mobile
- **Where:** `app/components/civilization-picker.tsx`
- **Current:** Injected CSS: `.civilization-picker-swiper { height: 380px }`, slide `width: 280px`, and the image container is `min-h-[240px]` with `flex-1`, so slides are tall/square-ish.
- **Issue:** On mobile, a more horizontal card shows more of the scene and feels less “full height” without going fully horizontal (which would make the image too small).
- **Fix (mobile only):**
  - Reduce swiper height on mobile (e.g. 320px or 300px).
  - Give the image container a **horizontal aspect ratio** on mobile only, e.g. `aspect-[4/3]` or `aspect-[3/2]` and remove or lower `min-h-[240px]` on small screens so the image is wider than tall.
  - Keep slide width so the central slide still looks good; the main change is aspect ratio of the preview image, not the card width.

---

## 2. Game Screen — City Image & Aspect Ratio

### 2.1 City image: more horizontal aspect on mobile
- **Where:** `app/components/city-image.tsx`
- **Current:** Container is `absolute inset-0`; image is `object-cover` so it fills the full viewport and is effectively “full height” on portrait phones.
- **Issue:** You want the image to feel more horizontal on mobile (not full height), but not so horizontal that the image becomes tiny.
- **Fix (mobile only):**
  - On mobile, constrain the **image container** to a height that yields a more horizontal “window” (e.g. top 70–75% of the screen, or use a max height so aspect is roughly 4:3 or 16:10 of the viewport width). Options:
    - **Option A:** Container stays full size but image uses `object-contain` on mobile and is vertically centered, with letterbox (e.g. black or gradient) above/below so the visible image has a more horizontal aspect.
    - **Option B:** Container height on mobile is something like `min(80vh, 100vw * 9/16)` so the image area is shorter and wider; image still `object-cover` within that box.
  - Recommend **Option B** so the image stays impactful and the bottom strip is reserved for UI + gradient.

### 2.2 Strong bottom gradient when showing event cards
- **Where:** `app/components/event-drawer.tsx`, `app/components/result-card.tsx`
- **Current:** Both use a diagonal gradient: `linear-gradient(to top right, rgba(0,0,0,0.85) 0%, ... transparent 65%)`. It’s not a focused “bottom” gradient.
- **Issue:** You want a **strong gradient at the bottom** when event cards (and outcome/continue) are shown, so the card area is clearly separated from the game world.
- **Fix (mobile only):**
  - Add a second overlay on mobile: a bottom-focused gradient, e.g. `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.95) 100%)` covering the lower 50–60% of the screen when the event drawer or result card is visible. Keep the existing diagonal gradient for desktop; on mobile either replace or layer this bottom gradient so event/outcome content sits on a clearly darkened band.

---

## 3. Stats and Loading — Conflict and Arrangement

### 3.1 Why they conflict
- **StatsBar:** `app/components/stats-bar.tsx` — `absolute bottom-0 left-0 right-0`, contains:
  - Left: history scrubber (many thin bars) + tooltip
  - Right: StatsPill (year, population, G/F/D/C dots)
- **LoadingOverlay:** `app/components/loading-overlay.tsx` — `absolute bottom-10 left-0`, spinner + “Your city evolves” (or dynamic message).
- Both sit in the **same bottom-left area**; when loading is visible, the spinner and text sit close to the scrubber and stats, so the two UIs compete and feel “off”.

### 3.2 Stats component/arrangement on mobile
- **StatsPill:** Expand on hover — **no hover on touch**, so users only see the collapsed row (year, population, G/F/D/C dots). The dots are very small (`w-1.5 h-1.5`); on mobile they’re hard to read.
- **Scrubber:** 30+ thin bars (`w-[3px]`), pointer/touch. On small screens it’s cramped and scrubber + pill in one row is busy.
- **Fixes (mobile only):**
  1. **Separate loading from stats**
     - When `LoadingOverlay` is visible, hide or greatly simplify the StatsBar on mobile (e.g. hide scrubber and show only a minimal “year” or hide the whole bar), so the only “status” is the loading message + spinner. That removes the conflict.
  2. **Stats layout on mobile**
     - Option A: Stack vertically on mobile — e.g. scrubber on one row, StatsPill on the next, so they’re not squeezed in one line.
     - Option B: Move StatsPill to top-right or top-left on mobile (small pill) so the bottom is only scrubber + loading when loading, and stats are always in a fixed place.
     - Option C: Replace the pill with a single compact line (e.g. “1000 BCE · 1,500” only) and move the resource dots into a tap-to-expand drawer or a second row that appears when the user taps the stats area.
  3. **Scrubber on mobile**
     - Consider slightly thicker bars or more spacing on touch (e.g. `min-width: 4px` or 6px) so it’s easier to tap/drag.
     - Or keep bars thin but ensure the hit area is larger (padding) so it’s still usable.

### 3.3 Loading overlay position on mobile
- If stats are hidden or minimized during loading, the loading block can stay bottom-left. Optionally center it on mobile (bottom-center) so it’s clearly the only status and doesn’t sit next to where the stats bar usually is.

---

## 4. Other Mobile Spots

### 4.1 Home button
- **Where:** `game-page-client.tsx` — `size="xs"`, `top-4 right-4`.
- **Issue:** Small tap target on mobile.
- **Fix (mobile only):** Use a larger size on mobile (e.g. `size="sm"`) and/or add `min-h-[44px] min-w-[44px]` (or padding) so the tap target meets ~44px.

### 4.2 Idle “Continue” button
- **Where:** `game-page-client.tsx` — `absolute bottom-16 left-0 right-0 flex justify-center`, `size="sm"`.
- **Issue:** You said “continue could be full screen” on the landing; on the game screen the same idea applies — on mobile make it full-width and easy to tap.
- **Fix (mobile only):** Full-width button on mobile: e.g. `w-full max-w-[200px] sm:max-w-none` on the wrapper and full width button, or `left-4 right-4` with `w-full` so it’s a clear bar.

### 4.3 Event drawer / result card content
- **Where:** `event-drawer.tsx`, `result-card.tsx` — content is `bottom-10 left-0 max-w-sm px-5 pb-4`.
- **Issue:** On small screens, `bottom-10` may sit over the stats bar; with the new bottom gradient and possibly relocated stats, ensure content is above the safe area and above any bottom UI. Consider `pb-6` or using `env(safe-area-inset-bottom)` on mobile so content isn’t cut off on notched devices.

### 4.4 Viewport / safe area
- **Where:** `app/layout.tsx`
- **Suggestion:** Ensure viewport meta is set (Next.js often adds it). For mobile, consider `height: 100dvh` for the game screen so it doesn’t jump when the mobile browser chrome shows/hides. In `game-page-client.tsx`, the root is `h-screen`; adding a mobile-only `min-h-[100dvh]` or using `dvh` for the game container can improve behavior. No change to desktop.

---

## 5. Implementation Order (mobile-only)

1. **Landing:** New Game + Recent games full-width / full-width feel (and carousel image aspect ratio on mobile).
2. **Game:** City image container height / aspect on mobile + strong bottom gradient for event/result.
3. **Game:** Loading vs stats — hide or simplify stats when loading on mobile; then improve stats layout (stack or relocate) and scrubber touch targets.
4. **Game:** Home and idle Continue — larger tap targets and full-width Continue on mobile.
5. **Polish:** Safe area and, if needed, `100dvh` for the game screen.

All changes can be done with Tailwind responsive classes (`max-sm:`, `sm:`) or a single `@media (max-width: 767px)` block so desktop remains unchanged.
