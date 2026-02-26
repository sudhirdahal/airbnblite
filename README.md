# 🏠 AirBnB Lite: A Full-Stack MERN Masterclass

Welcome to **AirBnB Lite**, a comprehensive technical showcase of modern web engineering. This repository chronicles the evolution of a complex application through five distinct phases of maturity—moving from a simple CRUD prototype to a production-ready, high-fidelity SaaS platform.

---

## 🏗️ Phase 1: Architectural Foundation & Security

The initiation phase focused on building a secure, decoupled, and scalable "Headless" API alongside a reactive frontend.

### 1. The Monorepo Strategy
We adopted a unified structure to keep the full-stack logic tightly coupled during development while allowing for independent deployment pipelines (Render for Backend, Vercel for Frontend).

### 2. Schema-Driven Data Integrity
Using Mongoose, we enforced strict data structures to support advanced features like nested map coordinates and relational user features.

**The User Schema (Security-First):**
We integrated `tokenVersion` for advanced session management and a `wishlist` reference array.
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['registered', 'admin'], default: 'registered' },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  tokenVersion: { type: Number, default: 0 } // Key for global logout
});
```

### 3. The Auth Shield (JWT & RBAC)
Authentication was implemented using stateless JSON Web Tokens. We built a custom **Role-Based Access Control (RBAC)** system to protect sensitive admin actions.

**Authentication Middleware:**
```javascript
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Decoded contains { id, role, version }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token invalid' });
  }
};
```

### 4. Advanced Feature: Global Logout (Token Versioning)
Standard JWTs cannot be revoked easily. We solved this by including a `version` claim in the token.
*   **The Check:** During every request, the middleware compares the token's version against the `tokenVersion` in the DB.
*   **The Kill Switch:** When a user resets their password or clicks "Logout All Devices," we increment the DB version.
*   **The Result:** All active tokens are instantly invalidated.

---

## 🚀 Phase 2: Feature Engineering & "Real-World" Bug Squashing

As the feature set grew, we encountered and solved complex state and data synchronization challenges.

### 1. Real-Time Chat (Hydration & Normalization)
We faced two primary issues with Socket.IO:
1.  **ID Inconsistency:** MongoDB uses `_id`, while frontend sometimes used `id`.
2.  **Data Hydration:** Broadcasting a saved message only sent IDs, leaving names blank in the UI.

**The Fix (Backend Hydration):**
```javascript
const handleChatMessage = async (io, socket, msg) => {
  const savedMessage = await saveMessage(msg.senderId, msg.listingId, msg.content);
  // CRITICAL: Hydrate the sender's name before broadcasting
  await savedMessage.populate('sender', 'name'); 
  
  const payload = {
    _id: savedMessage._id,
    sender: { _id: savedMessage.sender._id, name: savedMessage.sender.name },
    content: savedMessage.content
  };
  io.to(msg.listingId).emit('chat message', payload);
};
```

### 2. Wishlist Persistence & Defensive Programming
We fixed a critical crash where the app failed for users with `undefined` wishlist arrays (common in database migrations).

**The Defensive Controller:**
```javascript
exports.toggleWishlist = async (req, res) => {
  const user = await User.findById(req.user.id);
  // DEFENSIVE: Ensure array exists before calling .indexOf()
  if (!user.wishlist) user.wishlist = []; 

  const index = user.wishlist.indexOf(req.params.id);
  if (index === -1) user.wishlist.push(req.params.id);
  else user.wishlist.splice(index, 1);
  
  await user.save();
  res.json(user.wishlist);
};
```

### 3. Payment Logic (Temporal Validation)
Initial validation only checked string format (`MM/YY`). We upgraded this to real-time date math to reject expired cards.

**Expiry Logic:**
```javascript
const [expMonth, expYear] = expiry.split('/').map(Number);
const now = new Date();
const currentYear = Number(now.getFullYear().toString().slice(-2));
const currentMonth = now.getMonth() + 1;

if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
  return res.status(400).json({ message: 'The provided credit card is expired.' });
}
```

---

## 📅 Phase 3: The Evolution of the Booking System

This is the "Logic Engine" of the app. We moved from an open system to a proactive, conflict-aware model.

### Stage 1: The Flaw (Blind Trust)
Originally, the app saved every booking, leading to overlapping stays.

### Stage 2: The Server Shield (Mathematical Conflict Detection)
We implemented a mathematical formula to find overlaps:
`Conflict = (New_Start < Existing_End) AND (New_End > Existing_Start)`

**The Implementation:**
```javascript
const overlappingBooking = await Booking.findOne({
  listingId: listingId,
  status: 'confirmed',
  $and: [
    { checkIn: { $lt: new Date(checkOut) } },
    { checkOut: { $gt: new Date(checkIn) } }
  ]
});
```

### Stage 3: Proactive UI Blocking (The Interactive Calendar)
Instead of erroring at checkout, we integrated `react-calendar` and a `getTakenDates` API.
*   **The Logic:** Every tile in the calendar runs a check against the `takenDates` array.
*   **The Result:** Reserved dates are visually disabled (grayed out) and unclickable.

---

## 💎 Phase 4: High-Fidelity UI/UX Polish

To achieve a "Premium SaaS" feel, we implemented industry-standard visual patterns.

### 1. Skeleton Loaders
We replaced jarring "Loading..." text with pulsing CSS placeholders that mimic the content layout.
```javascript
const SkeletonListing = () => (
  <div className="skeleton-card">
    <div className="skeleton-image pulse" />
    <div className="skeleton-text pulse" />
  </div>
);
```

### 2. Framer Motion Transitions
Every listing card and dashboard tab uses cinematic animations.
```javascript
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.02 }}
>
  <ListingCard />
</motion.div>
```

### 3. Host Revenue Analytics
Admin users gain insights via dynamic charts aggregating booking totals by month.
*   **Tech:** `Chart.js` + `react-chartjs-2`.
*   **Key Metrics:** Total Revenue, Occupancy, and Average Revenue per Stay.

### 4. Interactive Deep Linking
We eliminated "dead" text. 
-   **Clickable Locations:** Triggers an immediate filtered search.
-   **Clickable Authors:** Links to traveler profiles.
-   **Dashboard-Style Hero:** A compact banner replacing the large centered greeting for a tool-like aesthetic.

---

## ☁️ Phase 5: Cloud Migration & Production Readiness

Moving to production (Render & Vercel) required solving the "Ephemeral Storage" problem.

### 1. Cloud Image Storage (AWS S3)
Because cloud servers delete local files on restart, we migrated the storage engine to **Amazon S3**.

**The Multer-S3 Pipeline:**
```javascript
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read', // Controlled via Bucket Policy
    key: (req, file, cb) => {
      cb(null, `listings/${Date.now()}-${file.originalname}`);
    }
  })
});
```

### 2. Vercel SPA Routing
To support direct URL navigation (e.g., refreshing on `/admin`), we added `vercel.json` to handle rewrites.
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 3. Strict Production CORS
We updated `index.js` to strictly allow only the specific Vercel production origin while still permitting local development.

---

## 📦 Getting Started

### 1. Environment Configuration (.env)
You will need a MongoDB Atlas URI, AWS IAM keys, and a Mailtrap account.

### 2. Installation
```bash
# In /backend and /frontend
npm install
npm run dev
```

---
**Built with precision to showcase the full journey of modern web development.** 🚀🌐
