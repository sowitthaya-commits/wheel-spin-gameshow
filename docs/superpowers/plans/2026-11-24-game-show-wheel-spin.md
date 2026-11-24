# Real-Time Game Show Wheel Spin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time, synchronized multiplayer "Game Show Wheel Spin" web application with Next.js 14+ App Router, Tailwind CSS, HTML5 Canvas proportional wheel rendering, synthesized Web Audio API sound effects, and a dual-mode realtime synchronization layer (Local Demo via BroadcastChannel and Firebase Realtime Database).

**Architecture:** A 3-view architecture (`/` Stage Display, `/play` Mobile Controller, `/admin` Control Panel) synchronized through a unified `RealtimeAdapter` abstraction layer. Proportional slice physics and deterministically synchronized angle calculations run on HTML5 Canvas using cubic-bezier deceleration, coupled with synthesized Web Audio SFX (peg ticks, fanfare, countdown beeps) and synthesized BGM loops.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide React, Canvas Confetti, Firebase Realtime Database SDK, Web Audio API, Vitest & Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-24-game-show-wheel-spin-design.md`

## Global Constraints

- Framework: Next.js 14+ with App Router and TypeScript.
- Database: Firebase Realtime Database (client SDK) with zero-config Local Demo Mode (`BroadcastChannel` + `localStorage`).
- Zero External Audio Assets: All BGM and SFX must be synthesized purely via Web Audio API.
- Strictly Proportional Slices: Canvas arc angles must precisely equal $(\text{percentage} / \sum \text{activePercentages}) \times 360^\circ$.
- Hold / Wait Logic: When `isHoldManual === true`, timer counts down to `00:00` and halts without spinning until manual press.
- Turn Permission: SPIN button is enabled only for `activePlayerId` and Admin.

## Review Focus

1. **Simultaneous Timer Expiry and Manual Spin:** If a player clicks SPIN at the exact millisecond the countdown timer hits `00:00`, atomic transaction lock prevents duplicate spin executions.
2. **Stock Exhaustion Mid-Game:** When a limited-stock prize hits `0`, it is disabled (`percentage = 0`) and remaining active slices smoothly re-normalize to 360 degrees without crash.
3. **Pointer Angle Alignment:** When targetAngle lands, the winning slice must be centered under the top pointer ($270^\circ$ on standard canvas), accounting for clockwise rotation.
4. **Web Audio Gesture Restriction:** AudioContext must not attempt to play until user interaction (click/touch), showing a clear "Click to Enable Audio" toggle.
5. **Multi-Tab Demo Sync:** Opening `/`, `/play`, and `/admin` in separate browser tabs on localhost must synchronize state instantly via `BroadcastChannel` with sub-50ms latency.

---

### Task 1: Project Scaffolding, Dependencies & Testing Setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.mjs`, `vitest.config.ts`
- Create: `src/app/layout.tsx`, `src/app/globals.css`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: Base Next.js 14+ App Router project structure with Vitest test runner.

- [ ] **Step 1: Initialize Next.js 14+ App Router project with TypeScript and Tailwind CSS**
- [ ] **Step 2: Install project dependencies: `lucide-react`, `canvas-confetti`, `@types/canvas-confetti`, `firebase`**
- [ ] **Step 3: Install development and test dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`**
- [ ] **Step 4: Configure `vitest.config.ts` with jsdom environment and path aliases (`@/*` $\to$ `./src/*`)**
- [ ] **Step 5: Configure Tailwind CSS theme in `tailwind.config.ts` with casino/game-show colors (deep royal navy/purple, gold metallic gradients, neon accents)**
- [ ] **Step 6: Write smoke test in `tests/smoke.test.ts` verifying test runner**
- [ ] **Step 7: Run test to verify it passes: `npx vitest run tests/smoke.test.ts`**
- [ ] **Step 8: Commit: `chore: initialize Next.js project with Tailwind and Vitest`**

---

### Task 2: Core Data Types & Wheel Math / Probability Engine

**Files:**
- Create: `src/types/game.ts`
- Create: `src/lib/wheel-math.ts`
- Test: `tests/wheel-math.test.ts`

**Interfaces:**
- Produces:
  - `SliceItem`, `PlayerItem`, `GameState`, `SpinData`, `GameConfig`, `SpinHistoryLog` types.
  - `calculateSliceAngles(slices: SliceItem[]): SliceAngle[]`
  - `selectWinningSlice(slices: SliceItem[]): SliceItem`
  - `calculateTargetAngle(currentAngle: number, winningSliceId: string, slices: SliceItem[], minRotations?: number): number`
  - `detectPegCrossings(previousAngle: number, currentAngle: number, sliceAngles: SliceAngle[]): boolean`
  - `normalizePercentages(slices: SliceItem[]): SliceItem[]`

- [ ] **Step 1: Write failing tests in `tests/wheel-math.test.ts` for proportional angles, weighted random selection, deterministic target angle, and peg boundary detection**
- [ ] **Step 2: Run test to verify it fails: `npx vitest run tests/wheel-math.test.ts`**
- [ ] **Step 3: Define data models and schemas in `src/types/game.ts`**
- [ ] **Step 4: Implement proportional slice angle calculation and normalization in `src/lib/wheel-math.ts`**
- [ ] **Step 5: Implement deterministic target angle calculation pointing to top needle ($270^\circ$) in `src/lib/wheel-math.ts`**
- [ ] **Step 6: Implement peg boundary crossing detection in `src/lib/wheel-math.ts`**
- [ ] **Step 7: Run test to verify it passes: `npx vitest run tests/wheel-math.test.ts`**
- [ ] **Step 8: Commit: `feat: add core game types and wheel mathematics engine`**

---

### Task 3: Dual-Mode Realtime Synchronization Layer (Local Demo + Firebase)

**Files:**
- Create: `src/lib/realtime/adapter.ts`
- Create: `src/lib/realtime/local-adapter.ts`
- Create: `src/lib/realtime/firebase-adapter.ts`
- Create: `src/lib/realtime/index.ts`
- Create: `src/hooks/useGameSync.ts`
- Test: `tests/realtime-adapter.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameConfig`, `SliceItem`, `PlayerItem`, `SpinHistoryLog` from `src/types/game.ts`.
- Produces:
  - `RealtimeAdapter` interface.
  - `getLocalAdapter()` using `BroadcastChannel` + `localStorage` with atomic spin lock.
  - `getFirebaseAdapter()` using Firebase Realtime Database SDK.
  - `useGameSync()` hook delivering reactive state and update actions.

- [ ] **Step 1: Write failing tests in `tests/realtime-adapter.test.ts` for state subscription, slice updates, and atomic spin locking**
- [ ] **Step 2: Run test to verify it fails: `npx vitest run tests/realtime-adapter.test.ts`**
- [ ] **Step 3: Define `RealtimeAdapter` interface in `src/lib/realtime/adapter.ts`**
- [ ] **Step 4: Implement `LocalBroadcastChannelAdapter` with cross-tab sync and atomic lock in `src/lib/realtime/local-adapter.ts`**
- [ ] **Step 5: Implement `FirebaseRealtimeAdapter` with `runTransaction` in `src/lib/realtime/firebase-adapter.ts`**
- [ ] **Step 6: Implement adapter factory in `src/lib/realtime/index.ts` (auto-detects Firebase config or falls back to Local Demo)**
- [ ] **Step 7: Implement React hook `useGameSync` in `src/hooks/useGameSync.ts`**
- [ ] **Step 8: Run test to verify it passes: `npx vitest run tests/realtime-adapter.test.ts`**
- [ ] **Step 9: Commit: `feat: implement dual-mode realtime sync adapter (Local Demo + Firebase)`**

---

### Task 4: Synthesized Web Audio Engine (Zero External MP3s)

**Files:**
- Create: `src/lib/audio/sound-engine.ts`
- Create: `src/hooks/useSoundEngine.ts`
- Test: `tests/sound-engine.test.ts`

**Interfaces:**
- Produces:
  - `SoundEngine` class: `init()`, `playPegTick(speedFactor: number)`, `playCountdownBeep(isFinal: boolean)`, `playFanfare()`, `playBGM(trackId: string)`, `stopBGM()`, `setMuted(muted: boolean)`, `setVolume(volume: number)`.
  - `useSoundEngine()` hook for UI audio toggling and sound triggering.

- [ ] **Step 1: Write test in `tests/sound-engine.test.ts` testing sound engine initialization, muted state, and method invocations**
- [ ] **Step 2: Run test to verify it fails: `npx vitest run tests/sound-engine.test.ts`**
- [ ] **Step 3: Implement Web Audio API synthesis for peg tick, countdown beep, and fanfare in `src/lib/audio/sound-engine.ts`**
- [ ] **Step 4: Implement 3 selectable synthesized BGM loop patterns (Arcade Gold, Retro Disco, Dramatic Pulse) in `src/lib/audio/sound-engine.ts`**
- [ ] **Step 5: Implement `useSoundEngine` hook in `src/hooks/useSoundEngine.ts` handling user gesture unlocking**
- [ ] **Step 6: Run test to verify it passes: `npx vitest run tests/sound-engine.test.ts`**
- [ ] **Step 7: Commit: `feat: build synthesized Web Audio sound engine for BGM and SFX`**

---

### Task 5: Proportional HTML5 Canvas Wheel Component & Winner Modal

**Files:**
- Create: `src/components/wheel/WheelCanvas.tsx`
- Create: `src/components/wheel/WinnerModal.tsx`
- Test: `tests/wheel-canvas.test.ts`

**Interfaces:**
- Consumes: `SliceItem`, `SpinData` from `src/types/game.ts`, `calculateSliceAngles` from `src/lib/wheel-math.ts`.
- Produces:
  - `<WheelCanvas />` component: renders proportional slices, blinking LED lights, center gold hub with logo, top peg pointer, and requestAnimationFrame ease-out animation.
  - `<WinnerModal />` component: displays winner overlay, prize name, and fires `canvas-confetti`.

- [ ] **Step 1: Write test in `tests/wheel-canvas.test.ts` for slice angle rendering and animation completion trigger**
- [ ] **Step 2: Run test to verify it fails: `npx vitest run tests/wheel-canvas.test.ts`**
- [ ] **Step 3: Implement High-DPI canvas wheel rendering with proportional slices, LED bulb ring, and metallic gold rim in `src/components/wheel/WheelCanvas.tsx`**
- [ ] **Step 4: Implement synchronized cubic-bezier ease-out animation loop connected to `spinData` with boundary peg-tick callbacks**
- [ ] **Step 5: Implement `<WinnerModal />` in `src/components/wheel/WinnerModal.tsx` with celebratory confetti**
- [ ] **Step 6: Run test to verify it passes: `npx vitest run tests/wheel-canvas.test.ts`**
- [ ] **Step 7: Commit: `feat: implement proportional HTML5 canvas wheel and winner modal`**

---

### Task 6: Main Stage Display View (`/`)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/stage/StageHeader.tsx`
- Create: `src/components/stage/TimerDisplay.tsx`
- Create: `src/components/stage/AudioControls.tsx`
- Test: `tests/stage-view.test.ts`

**Interfaces:**
- Consumes: `useGameSync()`, `useSoundEngine()`, `<WheelCanvas />`, `<WinnerModal />`.
- Produces: Full-screen broadcast stage page for projector screens.

- [ ] **Step 1: Write test in `tests/stage-view.test.ts` verifying timer format transitions (>60s MM:SS vs <=60s seconds) and hold badge display**
- [ ] **Step 2: Run test to verify it fails: `npx vitest run tests/stage-view.test.ts`**
- [ ] **Step 3: Implement `<StageHeader />` with game logo and active player marquee banner in `src/components/stage/StageHeader.tsx`**
- [ ] **Step 4: Implement `<TimerDisplay />` with MM:SS / pulsing seconds display and "รอผู้เล่นกดหมุน" hold badge in `src/components/stage/TimerDisplay.tsx`**
- [ ] **Step 5: Implement Stage Master timer logic in `src/app/page.tsx` (auto-spin at 00:00 when `isHoldManual === false`)**
- [ ] **Step 6: Implement floating audio controls in `src/components/stage/AudioControls.tsx`**
- [ ] **Step 7: Run test to verify it passes: `npx vitest run tests/stage-view.test.ts`**
- [ ] **Step 8: Commit: `feat: implement Main Stage Display view with timer and auto-spin master`**

---

### Task 7: Player Mobile Controller View (`/play`)

**Files:**
- Create: `src/app/play/page.tsx`
- Create: `src/components/player/PlayerSelector.tsx`
- Create: `src/components/player/SpinButton.tsx`
- Test: `tests/player-view.test.ts`

**Interfaces:**
- Consumes: `useGameSync()`.
- Produces: Mobile-first interactive controller for players.

- [ ] **Step 1: Write test in `tests/player-view.test.ts` verifying player selection persistence and SPIN button authorization rules**
- [ ] **Step 2: Run test to verify it fails: `npx vitest run tests/player-view.test.ts`**
- [ ] **Step 3: Implement player selector dropdown with `localStorage` persistence and "Change Player" option in `src/components/player/PlayerSelector.tsx`**
- [ ] **Step 4: Implement giant glowing tactile `<SpinButton />` with authorization checks and haptic vibration in `src/components/player/SpinButton.tsx`**
- [ ] **Step 5: Assemble player view in `src/app/play/page.tsx` showing current turn status, mini timer, and result feedback**
- [ ] **Step 6: Run test to verify it passes: `npx vitest run tests/player-view.test.ts`**
- [ ] **Step 7: Commit: `feat: implement mobile player controller view with turn permissions`**

---

### Task 8: Admin Control Panel (`/admin`)

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin/PinGate.tsx`
- Create: `src/components/admin/LiveControlTab.tsx`
- Create: `src/components/admin/PrizeSetupTab.tsx`
- Create: `src/components/admin/PlayerRosterTab.tsx`
- Create: `src/components/admin/StatsTab.tsx`
- Create: `src/components/admin/JoinQrModal.tsx`
- Test: `tests/admin-view.test.ts`

**Interfaces:**
- Consumes: `useGameSync()`, `normalizePercentages()`.
- Produces: Protected comprehensive event management dashboard.

- [ ] **Step 1: Write test in `tests/admin-view.test.ts` verifying PIN authentication, slice normalization, and tab switching**
- [ ] **Step 2: Run test to verify it fails: `npx vitest run tests/admin-view.test.ts`**
- [ ] **Step 3: Implement PIN gate in `src/components/admin/PinGate.tsx` (reads `NEXT_PUBLIC_ADMIN_PASSWORD` or default '1234')**
- [ ] **Step 4: Implement Tab 1 (Live Game Control): Active player picker, timer input, start/pause/reset, "รอ" Hold toggle, force spin, clear winner**
- [ ] **Step 5: Implement Tab 2 (Wheel & Prize Setup): Logo upload/URL, slice editor (label, color, percentage, stock), "Normalize to 100%" button**
- [ ] **Step 6: Implement Tab 3 (Player Roster): Single add, bulk paste textarea, delete, and set active player**
- [ ] **Step 7: Implement Tab 4 (Statistics & Logs): Win counts tally, remaining stock, history log table, Export CSV, and Reset Stats modal**
- [ ] **Step 8: Implement `<JoinQrModal />` generating QR code for `/play`**
- [ ] **Step 9: Run test to verify it passes: `npx vitest run tests/admin-view.test.ts`**
- [ ] **Step 10: Commit: `feat: implement comprehensive Admin Control Panel with 4 tabs and PIN gate`**

---

### Task 9: Multi-View End-to-End Verification & Production Build

**Files:**
- Test: `tests/e2e-sync.test.ts`
- Verify: `npm run build`

**Interfaces:**
- Produces: Verified production-ready web application.

- [ ] **Step 1: Write integration test in `tests/e2e-sync.test.ts` simulating Stage, Player, and Admin coordinating a complete spin round**
- [ ] **Step 2: Run integration test: `npx vitest run tests/e2e-sync.test.ts`**
- [ ] **Step 3: Run full test suite: `npx vitest run`**
- [ ] **Step 4: Run production build: `npm run build`**
- [ ] **Step 5: Commit: `chore: verify end-to-end multi-view sync and production build`**
