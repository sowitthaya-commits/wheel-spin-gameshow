# Real-Time Game Show Wheel Spin Web Application

เว็บแอปพลิเคชันหมุนวงล้อเกมโชว์แบบเรียลไทม์ (Real-Time Game Show Wheel Spin) ออกแบบสำหรับงานอีเวนต์ งานเลี้ยงสังสรรค์บริษัท และเวทีการแสดง รองรับการซิงค์ข้อมูลระหว่าง **จอหลักเวที**, **มือถือผู้เล่น**, และ **แผงควบคุมแอดมิน** แบบเรียลไทม์

---

## 🌟 ฟีเจอร์เด่น (Key Features)

1. **สถาปัตยกรรม 3 มุมมอง (3-View Architecture):**
   - **`/` — Main Stage Display:** จอแสดงผลเวที/โปรเจกเตอร์ความละเอียดสูง กราฟิกวงล้อสัดส่วนจริง พร้อมไฟ LED กระพริบ, ป้ายชื่อผู้เล่นปัจจุบัน, ตัวนับเวลาถอยหลัง, และหน้าต่างผู้ชนะพร้อม Confetti พลุเฉลิมฉลอง
   - **`/play` — Mobile Player Controller:** จอมือถือสำหรับผู้เล่น บันทึกชื่อผู้เล่นในเครื่อง (`localStorage`) พร้อมปุ่ม **SPIN NOW!** เรืองแสงขนาดใหญ่และการสั่นตอบสนอง (Haptic Vibration) เปิดสิทธิ์ให้กดเฉพาะตาของตนเอง
   - **`/admin` — Admin Control Panel:** แผงควบคุมแอดมิน ป้องกันด้วยรหัส PIN (เริ่มต้น `1234`) มี 4 แท็บควบคุมครบวงจร:
     - *Tab 1: Live Game Control* — สลับผู้เล่น, ตั้งเวลานับถอยหลัง, ควบคุมเวลา, **ปุ่มโหมด "รอ" (Hold for Manual)**, บังคับหมุน (Force Spin)
     - *Tab 2: Wheel & Prize Setup* — ตั้งค่าโลโก้/ชื่อเกม, จัดการช่องรางวัล (สี, ชื่อ, โอกาส %, สต็อก), ปุ่ม **Normalize to 100%**
     - *Tab 3: Player Roster* — เพิ่มผู้เล่นรายคน, วางนำเข้าแบบชุด (Bulk Import), จัดการสิทธิ์
     - *Tab 4: Statistics & Logs* — ตารางสถิติการออกรางวัล, สต็อกคงเหลือ, บันทึกประวัติทุกรอบ, **ส่งออกไฟล์ CSV สำหรับ Excel**, รีเซ็ตสถิติ

2. **วงล้อคำนวณสัดส่วนตามเปอร์เซ็นต์จริง (Proportional Canvas Wheel):**
   - องศาของแต่ละช่องบน HTML5 Canvas คำนวณตามสูตร $\theta = \frac{\%_i}{\sum \%} \times 360^\circ$ อย่างแม่นยำ
   - เมื่อรางวัลใดหมดสต็อก ระบบจะตัดสิทธิ์และปรับขนาดมุมของรางวัลที่เหลือให้อัตโนมัติ

3. **ตรรกะตัวนับเวลาถอยหลัง & ปุ่มโหมด "รอ" (Hold for Manual Spin):**
   - เวลา $> 60$ วินาที: แสดงเป็น `MM:SS` (เช่น `02:30`)
   - เวลา $\le 60$ วินาที: สลับเป็นตัวเลขนับถอยหลังขนาดใหญ่กระพริบตามจังหวะวินาที (`59`, `58`, ... `00`)
   - **หาก `isHoldManual = false`:** เมื่อเวลาถึง `00:00` ระบบจะสั่งหมุนวงล้ออัตโนมัติแทนผู้เล่น
   - **หาก `isHoldManual = true` (กดปุ่มรอ):** ตัวนับเวลาจะนับถอยหลังตามปกติจนถึง `00:00` แล้ว **ค้างรอผู้เล่นกด** พร้อมแสดงป้าย *"รอผู้เล่นกดหมุน / Ready for Manual Spin"* โดยวงล้อ **จะไม่หมุนอัตโนมัติ** จนกว่าจะมีคนกด

4. **ระบบเสียงสังเคราะห์ Web Audio API (Zero External MP3s):**
   - ไม่ต้องดาวน์โหลดไฟล์ MP3 จากภายนอก ทำงานได้แม้ไม่มีอินเทอร์เน็ต
   - เสียงติ๊กกลไก (Peg Tick) สัมพันธ์กับความเร็วเชิงมุมของวงล้อขณะหมุนผ่านหมุดขอบลิ่ม
   - เสียงปี๊บนับถอยหลัง 10 วินาทีสุดท้าย และเสียงแฟนแฟร์เฉลิมฉลอง (Winner Fanfare)
   - เพลง BGM สังเคราะห์ 3 จังหวะ: Arcade Gold (125 BPM), Disco Funk (116 BPM), Dramatic Pulse (130 BPM) พร้อมปุ่มปรับระดับเสียง/ปิดเสียง

5. **ระบบ Real-Time แบบ Dual-Mode:**
   - **Local Demo Sync Mode:** ใช้ `BroadcastChannel` + `localStorage` ซิงค์ระหว่างแท็บต่าง ๆ บนเครื่องเดียวกันได้ทันทีโดยไม่ต้องตั้งค่าใด ๆ
   - **Firebase Realtime Database Mode:** พร้อมรองรับการเชื่อมต่อข้ามอุปกรณ์มือถือจริงผ่าน Firebase เมื่อใส่ Environment Variables หรือเปิดผ่าน Join QR Code

---

## 🚀 วิธีการติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันระบบจำลอง (Local Demo Mode)
```bash
npm run dev
```

เปิดเบราว์เซอร์เพื่อทดสอบ 3 หน้าจอพร้อมกันได้ทันที:
- **จอหลักเวที:** [http://localhost:3000/](http://localhost:3000/)
- **จอมือถือผู้เล่น:** [http://localhost:3000/play](http://localhost:3000/play)
- **แผงควบคุมแอดมิน:** [http://localhost:3000/admin](http://localhost:3000/admin) *(รหัสผ่าน PIN: `1234`)*

### 3. รันชุดทดสอบ (Automated Unit & Integration Tests)
```bash
npm test
```
ทดสอบทั้งหมด 9 ไฟล์ 30 กรณีทดสอบ ผ่าน 100%

### 4. บิลด์สำหรับ Production
```bash
npm run build
```

---

## 🌐 การเชื่อมต่อ Firebase สำหรับงานจริง (Live Multi-Device)

หากต้องการนำไปใช้งานจริงบน Vercel และเชื่อมต่อมือถือหลายเครื่องจากภายนอก:
1. สร้าง Firebase Project ฟรีที่ [Firebase Console](https://console.firebase.google.com/)
2. เปิดใช้งาน **Realtime Database**
3. สร้างไฟล์ `.env.local` หรือตั้งค่า Environment Variables บน Vercel:
```env
NEXT_PUBLIC_ADMIN_PASSWORD=1234
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── src/
│   ├── app/
│   │   ├── page.tsx               # จอหลักเวที (Stage Screen)
│   │   ├── play/page.tsx          # จอมือถือผู้เล่น (Mobile Controller)
│   │   ├── admin/page.tsx         # แผงควบคุมแอดมิน (Admin Console)
│   │   ├── globals.css            # ธีมสี Casino/Game Show และเอฟเฟกต์
│   │   └── layout.tsx             # Root Layout
│   ├── components/
│   │   ├── wheel/
│   │   │   ├── WheelCanvas.tsx    # วงล้อ HTML5 Canvas สัดส่วนจริง + ไฟ LED
│   │   │   └── WinnerModal.tsx    # ป๊อปอัปผู้ชนะพร้อม Confetti
│   │   ├── stage/
│   │   │   ├── StageHeader.tsx    # โลโก้ และป้ายชื่อผู้เล่นรอบนี้
│   │   │   ├── TimerDisplay.tsx   # ตัวนับเวลาถอยหลัง และป้ายโหมดรอ
│   │   │   └── AudioControls.tsx  # แถบควบคุมเสียง Web Audio
│   │   ├── player/
│   │   │   ├── PlayerSelector.tsx # กล่องเลือกชื่อผู้เล่น
│   │   │   └── SpinButton.tsx     # ปุ่มหมุนเรืองแสงขนาดใหญ่
│   │   └── admin/
│   │       ├── PinGate.tsx        # ป้องกันด้วยรหัส PIN
│   │       ├── LiveControlTab.tsx # แท็บควบคุมเกมสด & ปุ่มรอ
│   │       ├── PrizeSetupTab.tsx  # แท็บตั้งค่าวงล้อ & สัดส่วนรางวัล
│   │       ├── PlayerRosterTab.tsx# แท็บรายชื่อผู้เล่น & Bulk Import
│   │       ├── StatsTab.tsx       # แท็บสถิติ & ส่งออก CSV
│   │       └── JoinQrModal.tsx    # โมดอล QR Code สำหรับผู้เล่น
│   ├── hooks/
│   │   ├── useGameSync.ts         # Hook สำหรับซิงค์สถานะเกมแบบเรียลไทม์
│   │   └── useSoundEngine.ts      # Hook สำหรับระบบเสียง Web Audio API
│   ├── lib/
│   │   ├── audio/
│   │   │   └── sound-engine.ts    # ตัวสังเคราะห์เสียง Web Audio (SFX + BGM)
│   │   ├── realtime/
│   │   │   ├── adapter.ts         # RealtimeAdapter Interface
│   │   │   ├── local-adapter.ts   # Local Demo Sync (BroadcastChannel)
│   │   │   ├── firebase-adapter.ts# Firebase Realtime Database Client
│   │   │   └── index.ts           # Adapter Factory
│   │   └── wheel-math.ts          # ฟิสิกส์วงล้อและคณิตศาสตร์มุมสัดส่วน
│   └── types/
│       └── game.ts                # Data Models & Schemas
└── tests/                         # ชุดการทดสอบครอบคลุมทุกระบบ (30 tests)
```
