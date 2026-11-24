# Design Document: Real-Time Game Show Wheel Spin Web Application

**Date:** 2026-11-24  
**Status:** In Review  
**Topic:** Real-Time Synchronized Game Show Wheel Spin for Live Events & Parties  

---

## 1. Intent and Why

In live corporate events, annual parties, and stage game shows, interactive lucky draws are high-energy focal points. Traditional physical wheels are bulky and fixed, while simple web spinners often run locally on a single laptop without audience interactivity.

This project delivers a **broadcast-grade, synchronized multiplayer Game Show Wheel Spin platform** running on Next.js 14+ and Firebase Realtime Database. It bridges the stage projector screen, player mobile phones, and the MC/event administrator's console with sub-100ms real-time synchronization, crisp proportional HTML5 canvas graphics, dynamic Web Audio API sound synthesis, and robust game-flow control (including manual hold/wait logic).

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Real-Time Cross-Device Synchronization:** Immediate state sync across Main Stage (`/`), Player Mobile (`/play`), and Admin Dashboard (`/admin`) for wheel rotation, countdown timers, player turns, and winner modals.
- **Strictly Proportional Wheel Slices:** Visual slice angles on the canvas must precisely match their assigned percentage weights:
  $$\text{Slice Angle (deg)} = \left(\frac{\text{Slice Percentage}}{\sum \text{All Active Percentages}}\right) \times 360^\circ$$
- **Deterministic Server/Host-Authoritative Spin:** Winner is determined upon spin trigger via weighted random distribution; the deterministic `targetAngle` is synchronized so all screens decelerate and land on the exact same slice at the exact same millisecond.
- **Game-Show Aesthetics & Canvas Graphics:** Casino/game-show look with royal navy/purple background, gold metallic rim, animated blinking LED light bulbs, and canvas-confetti upon winning.
- **Synthesized Audio Engine (Zero Assets):** Web Audio API-powered BGM loops, dynamic peg-ticking synchronized to wheel angular velocity crossing slice boundaries, countdown beeps, and fanfare chords.
- **Flexible Timer & "Hold / Wait" (ปุ่มรอ) Logic:** Countdown to MM:SS / pulsing seconds, with auto-spin at 00:00 or hold indefinitely at 00:00 when Admin enables manual hold mode.
- **Dual-Mode Operation:** Seamless support for Local Demo Mode (via `BroadcastChannel` + `localStorage` across tabs) for immediate zero-config testing, and Firebase Realtime Database for live cross-device production.

### Non-Goals
- Native mobile apps (iOS/Android native binaries); a responsive web app (PWA ready) satisfies mobile browser needs.
- Complex user authentication with OAuth/Google Sign-In; lightweight Admin PIN/password + player name roster is ideal for fast event operation.
- External audio asset hosting (MP3/WAV CDNs); all audio is synthesized directly via Web Audio API.

### Anti-Goals
- Non-proportional visual slices where slices appear equal in size despite differing odds.
- Independent client-side physics where different devices land on different prizes.
- Sudden audio blaring without user-interaction initialization (Web Audio requires explicit gesture unlock with clear UI indicator).

---

## 3. Constraints
- **Vercel Free Tier Compatibility:** No long-lived custom Node.js server processes or WebSockets on Vercel; all cloud sync must go through Firebase Realtime Database client SDK.
- **Sub-100ms Synchronized Animation:** Wheel physics must run on requestAnimationFrame with a normalized easing function $f(t)$ calculated against the synchronized start timestamp.
- **Offline / Local Demo First:** Must be 100% testable out-of-the-box locally across multiple browser tabs without requiring immediate Firebase credentials.

---

## 4. Approaches Considered & Trade-Offs

### Approach 1: Unified Realtime Adapter (BroadcastChannel + Firebase SDK) [SELECTED]
- **Mechanism:** Provide a unified `RealtimeService` interface. When Firebase credentials are configured in `.env.local` or Admin UI, connect to Firebase Realtime Database. Otherwise, automatically fallback to a `BroadcastChannel` + `localStorage` adapter.
- **Trade-offs:** 
  - *Pros:* Zero friction to run locally; instantly testable on multi-tab/multi-window setup; 100% compatible with Vercel deployment without server costs.
  - *Cons:* In demo mode, tabs must share the same browser origin.
- **Decision:** Selected by user. Best developer and user experience.

### Approach 2: Firebase Local Emulator Suite
- **Mechanism:** Run local Java-based Firebase CLI emulator.
- **Trade-offs:** Requires Java Runtime (JRE), global `firebase-tools`, extra terminal processes. Heavy setup. Rejected.

### Approach 3: Custom Node.js WebSocket Server
- **Mechanism:** Next.js custom server with `ws`/`socket.io`.
- **Trade-offs:** Incompatible with Vercel serverless deployment. Rejected.

---

## 5. Architectural & Technical Specification

### 5.1 Tech Stack
- **Framework:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Icons & Visuals:** `lucide-react`, `canvas-confetti`
- **Real-Time Layer:** `firebase/database` client SDK + Native `BroadcastChannel` fallback
- **Graphics:** HTML5 2D Canvas (`<canvas>`)
- **Sound:** Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`, `BiquadFilterNode`)

### 5.2 Realtime Data Schema
```typescript
export interface SliceItem {
  id: string;
  label: string;
  color: string;
  percentage: number;
  stock: number;
  wonCount: number;
}

export interface PlayerItem {
  id: string;
  name: string;
}

export type GameStatus = 'IDLE' | 'COUNTDOWN' | 'SPINNING' | 'RESULT';

export interface SpinData {
  spinId: string;
  targetAngle: number;       // Final rotation angle in degrees
  durationMs: number;        // e.g. 6000ms
  startAngle: number;        // Starting rotation angle
  startTimestamp: number;    // Date.now() when spin triggered
  winningSliceId: string;
  winningLabel: string;
  playerName: string;
  triggeredBy: 'MANUAL' | 'AUTO';
}

export interface GameState {
  status: GameStatus;
  activePlayerId: string;
  isHoldManual: boolean;
  timerEndTimestamp: number;
  remainingSecWhenPaused: number;
  spinData: SpinData | null;
}

export interface GameConfig {
  gameTitle: string;
  logoUrl?: string;          // Base64 or image URL
  bgmTrack: string;
  timerDurationSec: number;
  adminPassword?: string;
}

export interface SpinHistoryLog {
  id: string;
  round: number;
  timestamp: number;
  playerName: string;
  prizeLabel: string;
  triggerType: 'MANUAL' | 'AUTO';
}
```

### 5.3 Proportional Wheel Canvas & Physics Engine
1. **Slice Arc Angles & Stock Depletion Handling:**
   $$\theta_i = \left(\frac{\text{percentage}_i}{\sum_{j \in \text{Active}} \text{percentage}_j}\right) \times 360^\circ$$
   - **Active Slices:** Slices with `stock > 0` (or `stock === -1` for unlimited) and `percentage > 0`.
   - **Stock Depletion (Builder's Call):** When a prize's `wonCount >= stock`, the slice is automatically marked disabled (`percentage = 0`), and the wheel smoothly re-calculates active proportional angles among the remaining active slices. If all prizes are won, the wheel enters a completed state.
   - Slices are rendered clockwise starting from standard offset $0^\circ$.
2. **Pointer & Angle Determination:**
   - Pointer is positioned at the top ($270^\circ$ or $12\text{ o'clock}$).
   - Current normalized angle is $\text{currentAngle} \pmod{360}$.
   - To make winning slice $W$ land under the top pointer:
     - Target slice span: $[\alpha_{\text{start}}, \alpha_{\text{end}}]$.
     - Landing offset within slice: chosen with a safe margin (e.g. $15\%$ to $85\%$ inside the slice to avoid peg edges).
     - $\text{targetAngle} = 360^\circ \times N_{\text{rotations}} + \text{offsetToAlignWithTopPointer}$.
3. **Deceleration Curve:**
   - Ease-out cubic: $f(t) = 1 - (1 - t)^3$ where $t = \min(1, \frac{\text{elapsed}}{\text{durationMs}})$.
   - $\text{angle}(t) = \text{startAngle} + (\text{targetAngle} - \text{startAngle}) \times f(t)$.
4. **Visual Polish:**
   - Gold metallic outer rim with radial gradient and shadow.
   - Ring of 24–36 LED bulbs that alternate blinking states every 200ms.
   - Center metallic hub displaying custom logo or game title icon.

### 5.3.1 Spin Authority, Concurrency & Conflict Resolution (Builder's Call)
- **Atomic State Transitions:** In Firebase Realtime Database, initiating a spin executes an atomic transaction (`runTransaction`) on `/gameState`.
  - Condition: `currentStatus === 'COUNTDOWN' || currentStatus === 'IDLE'`.
  - Effect: Immediately transitions `status = 'SPINNING'` and sets `spinData`.
  - Any concurrent attempt (e.g., player clicks exactly when timer hits 00:00 or Admin force spins) sees the status is already `SPINNING` and cleanly yields.
- **Timer Auto-Spin Master:** The Main Stage (`/`) screen acts as the primary timer clock. When timer reaches `00:00` (and `isHoldManual === false`), the Main Stage triggers the atomic spin transaction. If Main Stage is closed, Admin (`/admin`) serves as failover.
- **Local Demo Concurrency:** The `BroadcastChannel` adapter replicates this atomic check in-memory to prevent double-spin during multi-tab testing.

### 5.3.2 Firebase Configuration & Multi-Device Distribution (Builder's Call)
- **Primary Method:** Standard Next.js environment variables (`NEXT_PUBLIC_FIREBASE_*`) configured in `.env.local` or Vercel Project Settings.
- **Runtime Convenience & QR Code:** In `/admin`, if Firebase credentials are entered in the UI, Admin generates a **Join QR Code** for players (`/play?fb=...`) that automatically configures mobile devices upon scanning, enabling zero-rebuild live event setups.

### 5.4 Web Audio Engine (Zero External MP3s)
- **AudioContext Management:** Clean resume on first user interaction with audio unlock status badge.
- **BGM Synthesizer:**
  - 3 selectable upbeat synth themes (e.g., *Theme A: Retro Arcade 120BPM*, *Theme B: Disco Funk 115BPM*, *Theme C: Suspense Pulse*).
  - Built with polyphonic oscillators, arpeggiated bass, filtered chord pads, and rhythmic snare/hi-hat white-noise bursts.
- **SFX Components:**
  - **Dynamic Peg-Tick:** Detects when pointer angle crosses slice boundaries. Generates a 20ms resonant click/tap. Angular velocity alters the pitch and volume for realistic physical peg interaction.
  - **Tension Countdown Beep:** 880Hz short pip during the final 10 seconds.
  - **Winner Fanfare:** Multi-note triumphant brass/synth chord progression ($C_4 \to E_4 \to G_4 \to C_5$) with celebratory resonance.

### 5.5 Countdown Timer & "Hold / Wait" Logic
1. Admin starts countdown $\to$ sets `timerEndTimestamp = Date.now() + durationSec * 1000`, `status = 'COUNTDOWN'`.
2. All clients calculate remaining time: $\max(0, \lfloor(\text{timerEndTimestamp} - \text{Date.now()}) / 1000\rfloor)$.
   - If $> 60\text{s}$: format as `MM:SS`.
   - If $\le 60\text{s}$: format as pulsing seconds (`59` down to `00`).
3. **Trigger Decisions:**
   - **Early Manual Spin:** If Active Player or Admin clicks SPIN before timer expires, immediately transition to `SPINNING`.
   - **Timer hits `00:00` with `isHoldManual === false`:** System host/client auto-triggers spin for `activePlayerId`.
   - **Timer hits `00:00` with `isHoldManual === true`:** Timer stops at `00:00`. Status badge updates to *"รอผู้เล่นกดหมุน / Ready for Manual Spin"*. Wheel does **not** spin automatically; waits indefinitely for player or admin manual click.

### 5.6 Turn-Based Player Permission
- Admin maintains player roster (add, bulk import, delete).
- Admin designates `activePlayerId`.
- `/play` checks `localStorage.getItem('selected_player_id') === activePlayerId`.
  - If MATCH and `status === 'IDLE' | 'COUNTDOWN'` (or holding at 00:00): Big vibrant **SPIN NOW!** button is enabled with haptic vibration support.
  - Otherwise: Screen displays waiting status with active player's name.

### 5.7 Route Architecture (3 Views)
1. **`/` (Main Display):**
   - Stage screen layout designed for 16:9 / 4K projectors.
   - Game logo, active player marquee banner, countdown timer / hold badge, full-size proportional wheel with blinking lights, winner fanfare overlay with confetti, floating audio controls.
2. **`/play` (Player Mobile Controller):**
   - Mobile-optimized viewport (`h-dvh`), simple name selector (or change player button), turn indicator, countdown monitor, tactile SPIN button.
3. **`/admin` (Admin Control Panel):**
   - Password/PIN protected gate.
   - Tab 1: Live Game Control (Active Player selection, Timer control, "รอ" Hold toggle, Force Spin, Clear Winner).
   - Tab 2: Wheel & Prize Setup (Logo upload/URL, Slices editor, Normalize to 100% button, Stock limits).
   - Tab 3: Player Roster (Add, Bulk import textarea, Delete, Select active).
   - Tab 4: Statistics & Logs (Prize hit counts, Stock remaining, History log table, Export CSV, Reset Stats).

---

## 6. What's Left to the Builder
- Precise Tailwind styling details, color schemes, and responsive layout spacing.
- Specific oscillator frequencies and envelope times for the synthesized BGM patterns.
- Detailed CSV formatting for history export.
