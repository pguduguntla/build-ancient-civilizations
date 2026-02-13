# Ancient City Builder - UX Flow Document

## Overview
A turn-based city evolution game where players make choices that shape an ancient civilization. AI generates both the narrative events and visual transformations of the city over time.

---

## Core Experience

Players start with a small settlement and make decisions that cause the city to grow, transform, or decline. Each choice triggers an AI-generated consequence that visually updates the city image and affects future events.

**Key principle:** The city image is the hero. Everything else supports showing off how your choices changed the world.

---

## Main Game Screen Layout

### Visual Hierarchy (Top to Bottom)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                                                         │
│                                                         │
│            [FULL-BLEED CITY IMAGE]                     │
│              (takes up ~70% of screen)                 │
│                                                         │
│                                                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Year 250 BCE        Pop: 8,400    Gold ●●●○○   │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**When an event happens, a drawer slides up from the bottom:**

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│        [CITY IMAGE - slightly dimmed/blurred]          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    EVENT DRAWER                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │                                                     ││
│ │  MERCHANT CARAVAN ARRIVES                          ││
│ │                                                     ││
│ │  A merchant caravan from the eastern kingdoms      ││
│ │  has arrived, offering to establish a permanent    ││
│ │  trade route. They ask for land to build a        ││
│ │  trading post near your marketplace.               ││
│ │                                                     ││
│ │  ┌────────────┐ ┌────────────┐ ┌────────────┐    ││
│ │  │  Welcome   │ │  Demand    │ │   Turn     │    ││
│ │  │   Them     │ │  Higher    │ │   Them     │    ││
│ │  │            │ │   Taxes    │ │   Away     │    ││
│ │  └────────────┘ └────────────┘ └────────────┘    ││
│ │                                                     ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Elements Breakdown

**1. City Image**
- Fills most of the screen
- Shows the current state of your civilization
- Changes over time based on player choices
- Can be clicked to inspect buildings (optional feature)

**2. Stats Bar (persistent, subtle)**
- Lives at bottom of image or top of screen
- Shows: Year, Population, Key resources (Gold, Food, Defense, Culture)
- Updates after each turn
- Should be readable but not distracting

**3. Event Drawer**
- Slides up from bottom when a new turn begins
- Semi-transparent background so city is still visible
- Contains event description and choice buttons
- Slides away after choice is made

---

## User Flow: Complete Turn Cycle

### Step 1: Idle State
```
[Full city image visible]
[Stats visible at bottom]
[No drawer - peaceful moment to appreciate your city]
```

After 2-3 seconds (or user clicks "Next Turn" button), proceed to Step 2.

### Step 2: Event Appears
```
Animation: Drawer slides up smoothly from bottom (0.3-0.5s)
City image slightly dims/blurs to focus attention on event
Event text fades in
Choice buttons appear
```

**Event structure:**
- **Title:** Short, punchy (e.g., "Neighboring Kingdom Threatens War")
- **Description:** 2-3 sentences explaining what's happening
- **Choices:** 2-4 buttons with clear, short labels

### Step 3: Player Makes Choice
```
User clicks one of the choice buttons
Button highlights/pulses briefly
All choice buttons fade out
```

### Step 4: Processing
```
Drawer slides down (leaving screen)
City image un-dims
"Thinking" indicator appears briefly
  Options:
  - "Time passes..."
  - "Your city evolves..."
  - "[X] years later..."
  - Or just a subtle spinner
```

Duration: 3-5 seconds (while AI generates new image)

### Step 5: City Transforms
```
OLD city image crossfades to NEW city image (1-2s transition)
  OR
Camera does subtle zoom/pan during transition to make it feel cinematic

Stats update with animation:
  - Numbers count up/down
  - Resource bars fill/drain
  - Year advances
```

### Step 6: Reveal Changes (Optional Enhancement)
```
Brief highlights/glows appear on NEW elements:
  - New building that appeared? Subtle glow
  - Destroyed building? Smoke/ruins effect
  - Expanded area? Shimmer effect

After 2-3 seconds, highlights fade
```

### Step 7: Return to Idle State
```
City is now in new state
Player has moment to observe changes
Cycle repeats from Step 1
```

---

## Starting Experience

### 1. Welcome Screen
```
[Hero image - beautiful ancient city at sunset]

"Build Your Ancient Civilization"

[Start New Game]
[Continue] (if save exists)
[About]
```

### 2. Civilization Selection
```
Choose your civilization:

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  ROMAN   │  │  INDUS   │  │  MAYAN   │  │ EGYPTIAN │
│          │  │  VALLEY  │  │          │  │          │
│ [Image]  │  │ [Image]  │  │ [Image]  │  │ [Image]  │
│          │  │          │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘

Each has unique:
- Architecture style
- Starting conditions  
- Cultural events
```

### 3. Starting Conditions
```
Choose your terrain:

○ Coastal Settlement (easier trade, naval threats)
○ River Valley (fertile land, flood risk)
○ Mountain Fortress (defensible, limited farming)
○ Desert Oasis (scarce resources, unique opportunities)

[Begin Your Journey]
```

### 4. Opening Moment
```
[Screen fades to black]

"Year 1000 BCE"
"Your small settlement begins its journey..."

[City image fades in - small, humble village]

[First event drawer slides up immediately]

"Your people look to you for guidance.
 What should be our first priority?"

[Build Farms] [Build Walls] [Build Temple]
```

---

## Choice Button Design

### Visual Treatment
```
┌─────────────────────┐
│   WELCOME THEM      │  ← Short, clear action
│                     │
│   +Trade +Wealth    │  ← Preview of effects (optional)
│   -Defense          │
└─────────────────────┘
```

**States:**
- Default: Subtle border, semi-transparent background
- Hover: Brightens, border glows
- Click: Brief pulse/flash
- Disabled: Grayed out (if choice unavailable due to resources)

### Choice Categories (visual coding optional)

**Economic choices:** Gold/yellow accent
**Military choices:** Red accent  
**Cultural choices:** Purple accent
**Religious choices:** White/silver accent

This helps players quickly understand choice types.

---

## Stats Display Options

### Option 1: Minimal (Recommended for V1)
```
Year 250 BCE  |  ◆ 8,400 people  |  ◉ Prosperous
```

### Option 2: Icon-Based
```
⏳ 250 BCE    👥 8.4k    💰●●●○○    🌾●●●●○    🛡●●○○○
```

### Option 3: Detailed Panel (Toggle)
```
┌────────────────────────────────────┐
│ YEAR 250 BCE        POP: 8,400    │
├────────────────────────────────────┤
│ Wealth    ████████░░ 80%          │
│ Food      ██████░░░░ 60%          │
│ Defense   ████░░░░░░ 40%          │
│ Culture   ███████░░░ 70%          │
└────────────────────────────────────┘
```

**Recommendation:** Start with Option 1, add detail as needed.

---

## Secondary Screens

### History Log
```
Accessed via: Icon button in top-right corner

┌─────────────────────────────────────┐
│  📜 YOUR CIVILIZATION'S STORY       │
├─────────────────────────────────────┤
│                                     │
│  Year 1000 BCE                     │
│  ├─ Founded settlement              │
│  └─ Built first farms               │
│                                     │
│  Year 995 BCE                      │
│  ├─ Welcomed merchant caravan       │
│  └─ Trade route established         │
│                                     │
│  Year 990 BCE                      │
│  ├─ Barbarian raid                  │
│  └─ Successfully defended city      │
│                                     │
│  [Each entry clickable to see       │
│   city image from that moment]      │
└─────────────────────────────────────┘
```

### City Inspector (Optional Feature)
```
When user clicks on the main city image:

Hotspots appear highlighting notable buildings
Click a hotspot:

┌─────────────────────────────────────┐
│  TEMPLE OF THE SUN                 │
├─────────────────────────────────────┤
│  Built: Year 150 BCE               │
│  Function: Religious center         │
│                                     │
│  "After the great harvest, you     │
│   chose to honor the gods. This    │
│   temple became the heart of       │
│   your civilization's faith."      │
│                                     │
│  [Close]                           │
└─────────────────────────────────────┘
```

Connects current city state back to player's past choices.

### Gallery / Save System
```
┌─────────────────────────────────────┐
│  🎨 YOUR CIVILIZATIONS              │
├─────────────────────────────────────┤
│                                     │
│  ┌────────┐  ┌────────┐            │
│  │[Image] │  │[Image] │            │
│  │        │  │        │            │
│  │ Roman  │  │ Mayan  │            │
│  │ 450 BCE│  │ 800 BCE│            │
│  └────────┘  └────────┘            │
│                                     │
│  [Each is a saved game you can     │
│   continue or just revisit]         │
└─────────────────────────────────────┘
```

---

## Animation & Transition Timing

### Event Drawer
- **Slide in:** 0.3-0.5 seconds (smooth ease-out)
- **Slide out:** 0.3 seconds (after choice made)

### City Image Transition
- **Crossfade duration:** 1-2 seconds
- **Alternative:** Zoom out slightly during crossfade, zoom back in (more cinematic)

### Stats Updates
- **Number changes:** Count up/down over 0.5 seconds
- **Bar fills:** Animate over 0.5 seconds

### Highlight Effects
- **New building glow:** Fade in over 0.5s, hold for 2s, fade out over 0.5s
- **Should be subtle, not distracting**

---

## Color & Style Guide

Based on your hero image aesthetic:

**Background:** Deep warm browns, blacks
**Text:** Cream/off-white, high contrast
**Accents:** Gold for interactive elements
**Event drawer:** Dark semi-transparent background (80% opacity)
**Buttons:** Subtle borders, warm glow on hover

**Typography:**
- Event titles: Larger, bold serif font (feels ancient/timeless)
- Body text: Clean, readable sans-serif
- Stats: Monospace or condensed font

**Keep it feeling:** Ancient, warm, timeless - NOT modern/techy

---

## Mobile Considerations

This design works naturally on mobile:

**Portrait layout:**
```
┌─────────────┐
│   [Image]   │  ← 60% of screen
│             │
│             │
├─────────────┤
│   [Stats]   │  ← 5% of screen
├─────────────┤
│             │
│  [Drawer]   │  ← Slides up to 35%
│             │
└─────────────┘
```

**Interactions:**
- Swipe up to see event (alternative to auto-trigger)
- Tap choice buttons
- Swipe down to dismiss info panels
- Pinch to zoom on city image (optional)

---

## Error States & Edge Cases

### Long Generation Time
```
If image takes >5 seconds to generate:

Show in drawer:
  "Your city is transforming..."
  [Subtle animated progress indicator]
  
After 10 seconds:
  "This is taking longer than expected..."
  "Your changes are still being applied..."
```

### Generation Failure
```
If image generation fails:

Show previous city image (no change)
Event drawer:
  "Time has passed, but your city remains steady..."
  [Continue] button
  
Log error for debugging
Don't break the game flow
```

### End State
```
After 20-30 turns (or city collapse/victory):

Final screen:
  [Your final city image]
  
  "Your civilization has reached its destiny"
  
  Stats summary:
  - Peak population: 45,000
  - Years survived: 500
  - Major achievements: [list]
  
  [Play Again]  [View History]  [Share]
```

---

## Sound Design Notes (Optional)

**Ambient:**
- Subtle environmental sounds (birds, wind, distant voices)
- Changes based on city size (small = quiet, large = busier)

**UI Sounds:**
- Drawer slide: Soft whoosh
- Choice click: Satisfying thunk
- City change: Subtle chime or transition sound
- New building appears: Brief construction sound

**Keep it:** Minimal, atmospheric, not annoying

---

## Accessibility Considerations

**Visual:**
- High contrast text
- Option to increase text size
- Color-blind friendly stat indicators (use shapes + colors)

**Navigation:**
- Keyboard shortcuts (Space = next turn, 1/2/3 = choice buttons)
- Clear focus states
- Screen reader support for event text

**Pacing:**
- Option to speed up/slow down transitions
- Skip animation button for repeat players

---

## MVP Feature Checklist

**Must Have (Week 1):**
- [ ] City image display
- [ ] Event drawer slide animation
- [ ] 3 choice buttons
- [ ] Basic stats display (year, population)
- [ ] Image crossfade transition
- [ ] 5-10 hardcoded events to test flow

**Should Have (Week 2):**
- [ ] AI-generated events (not hardcoded)
- [ ] Stats actually update based on choices
- [ ] History log
- [ ] Multiple starting civilizations
- [ ] Smooth animations throughout

**Nice to Have (Week 3+):**
- [ ] City inspector (click buildings)
- [ ] Gallery/save system
- [ ] Sound effects
- [ ] Mobile optimization
- [ ] Share/export final city

---

## Success Metrics

**UX is working if:**
1. Players understand the core loop within first 2 turns
2. City changes are visible and satisfying
3. Choices feel impactful
4. Players want to replay with different choices
5. Players share their final cities

**Red flags:**
- Players confused about what choices do
- City changes too subtle to notice
- Waiting feels boring (transitions too slow)
- Events feel repetitive
- Players quit before turn 5

---

## Design Philosophy

**Core principles:**

1. **Image First:** The AI-generated city is the star. Everything else supports it.

2. **Smooth Flow:** No jarring transitions. Every state change should feel natural.

3. **Clear Causality:** Players should see how their choice affected the city.

4. **Minimal Chrome:** Less UI, more world. Let the city breathe.

5. **Respectful Pacing:** Give players moments to appreciate changes before rushing to next event.

6. **Fail Gracefully:** If AI messes up, don't break the experience. Keep the game moving.

---

## Future Expansion Ideas

**For later versions:**

- **Multiplayer:** Compare your city with others who started with same conditions
- **Challenges:** "Survive 100 years without going to war"
- **Time-lapse replay:** Watch your entire civilization's evolution in 30 seconds
- **Different eras:** Bronze Age → Classical → Medieval modes
- **Modding:** Let players create custom events/civilizations
- **Achievement system:** "Built 5 temples," "Survived 3 invasions," etc.

---

## Conclusion

This UX creates a contemplative, beautiful experience where players feel like they're shaping history. The bottom drawer keeps focus on the city image while providing clear decision points. Smooth animations and thoughtful pacing make each turn feel significant.

The design is simple enough to build quickly but deep enough to be engaging. Start with the core loop, add polish incrementally.