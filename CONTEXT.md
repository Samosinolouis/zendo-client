# Zendo — Codebase Context

> Last updated after Session 5 (UX polish: Navbar button sizing, logo redesign, OAuth provider placeholders, ChatBot integration, PHP currency)

---

## 1. Project Overview

**Zendo** is a web-based Online Appointment Booking System — a general-purpose platform where any business can list services and customers can discover, book, and pay for appointments.

**Status:** Frontend-only mock. No real backend. All data is in-memory with mock helpers.  
**Auth:** React Context wrapping a Keycloak placeholder (not wired to a real Keycloak server).  
**Payments:** Stripe placeholder (no SDK wired).
Z
---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Animations | framer-motion v11 (installed, available) |
| Icons | lucide-react |
| Utilities | clsx, cn() |
| Auth | React Context (mock) — Keycloak-shaped |

---

## 3. Directory Structure

```
src/
├── app/
│   ├── layout.tsx              Root layout (AuthProvider + Navbar + Footer)
│   ├── page.tsx                Landing page (hero, stats, features, businesses, services, CTA)
│   ├── globals.css             Global styles, blue design tokens, animation utilities
│   ├── explore/page.tsx        Browse & filter businesses + services
│   ├── business/[id]/page.tsx  Business detail, services list
│   ├── service/[id]/page.tsx   Multi-step booking flow (details→review→payment→confirmed)
│   ├── appointments/page.tsx   User's upcoming + past appointments with status
│   ├── notifications/page.tsx  In-app notifications, mark-read
│   ├── profile/page.tsx        User profile, payments table, invoices, billing address
│   ├── login/page.tsx          Login page — split-panel, demo quick-login, email form
│   ├── register/page.tsx       Register page — role select (Customer / Business Owner) then form
│   └── owner/
│       ├── layout.tsx          Owner sidebar layout with role guard
│       ├── dashboard/page.tsx  Stat cards, revenue chart, recent feedback
│       ├── businesses/page.tsx List/create businesses
│       ├── services/page.tsx   List services with fields/options expanded
│       ├── appointments/page.tsx Full appointment table
│       ├── payouts/page.tsx    Payout statements with service billing breakdown
│       └── feedbacks/page.tsx  Aggregated star ratings + feedback list
├── components/
│   ├── ChatBot.tsx             Floating chatbot with OpenRouter integration (bottom-right)
│   └── layout/
│       ├── Navbar.tsx          Sticky blue navbar, scroll-glass effect, auth state, demo switcher
│       └── Footer.tsx          Dark footer with gradient top border, blue branded
├── providers/
│   └── AuthProvider.tsx        Auth context — user state, login, logout, switchUser, register, loginWithCredentials
├── lib/
│   ├── mock-data.ts            All mock data arrays + lookup helper functions
│   ├── mock-graphql.ts         GraphQL query/mutation string constants (no runtime client)
│   ├── auth.ts                 Keycloak placeholder static helpers
│   └── utils.ts                cn(), formatCurrency(), formatDate(), formatDateTime(), getStatusColor()
└── types/
    └── index.ts                All 16 TypeScript interfaces
```

---

## 4. Routes (16 total)

| Route | Type | Description |
|---|---|---|
| `/` | Static | Landing page |
| `/explore` | Static | Discover businesses & services |
| `/business/[id]` | Dynamic | Business detail page |
| `/service/[id]` | Dynamic | Multi-step booking flow |
| `/appointments` | Static | User's appointments |
| `/notifications` | Static | In-app notifications |
| `/profile` | Static | User profile + payments |
| `/login` | Static | Login (email or demo quick-login) |
| `/register` | Static | Register (Customer or Business Owner) |
| `/owner/dashboard` | Static | Owner analytics dashboard |
| `/owner/businesses` | Static | Manage businesses |
| `/owner/services` | Static | Manage services |
| `/owner/appointments` | Static | All appointments table |
| `/owner/payouts` | Static | Payout history |
| `/owner/feedbacks` | Static | Customer feedback |
| `/_not-found` | Static | 404 page |

---

## 5. TypeScript Interfaces (`src/types/index.ts`)

```typescript
User             { id, firstName, lastName, email, username, profilePictureUrl?, role: "user"|"owner" }
Business         { id, userId, name, description, bannerUrl? }
Service          { id, businessId, name, description, bannerUrl? }
ServicePage      { id, serviceId, payload }
ServiceAppointment { id, serviceId, userId, scheduledAt, status, notes?, totalAmount? }
ServiceAppointmentField { id, serviceId, label, type, required }
ServiceAppointmentFieldOption { id, fieldId, label }
Payment          { id, appointmentId, amount, status, stripePaymentId?, createdAt }
PaymentLink      { id, serviceId, amount, url, expiresAt? }
SalesInvoice     { id, appointmentId, issuedAt, dueAt, items, totalAmount }
Notification     { id, userId, type, message, read, createdAt }
PayoutStatement  { id, businessId, periodStart, periodEnd, totalAmount, status }
ServiceBilling   { id, payoutStatementId, serviceId, totalBookings, totalRevenue }
ServiceFeedback  { id, serviceId, userId, rating, comment?, createdAt }
ServiceTag       { id, serviceId, tag }
BillingAddress   { id, userId, line1, line2?, city, state, zip, country }
FieldType        "text" | "select" | "boolean" | "date" | "number" | "textarea"
```

---

## 6. Mock Data (`src/lib/mock-data.ts`)

### Users
| ID | Name | Role |
|---|---|---|
| u1 | Jane Doe | user |
| u2 | Carlos Rivera | owner (b1) |
| u3 | Aisha Khan | owner (b2, b3) |
| u4 | Tom Wilson | user |

### Businesses
| ID | Name | Owner |
|---|---|---|
| b1 | Carlos' Barber Studio | u2 |
| b2 | Aisha Wellness Clinic | u3 |
| b3 | Serenity Yoga Studio | u3 |

### Services (6 total, 2 per business)
- s1/s2: Barber services  
- s3/s4: Wellness services  
- s5/s6: Yoga services

### Key Lookup Functions
```typescript
getBusinessById(id)
getServicesByBusinessId(businessId)
getFieldsByServiceId(serviceId)
getOptionsByFieldId(fieldId)
getAppointmentsByUserId(userId)
getPayoutsByBusinessId(businessId)
getFeedbacksByServiceId(serviceId)
getBusinessesByUserId(userId)
```

---

## 7. Auth Flow (`src/providers/AuthProvider.tsx`)

### State
- `user: User | null` — starts as `null` (logged out)
- `isLoggedIn: boolean`
- `isOwner: boolean`
- `businesses: Business[]` — derived from logged-in user

### Methods
```typescript
login(userId?)           // Quick login, optional userId (demo)
logout()                 // Clear user state
switchUser(userId)       // Swap demo user instantly (Navbar demo switcher)
loginWithCredentials(email, password)  // Async mock — matches by email, any password works
register(data: RegisterData)           // Async mock — creates new User, checks email uniqueness
```

### RegisterData Shape
```typescript
{
  firstName, lastName, email, username, password,
  role: "user" | "owner",
  businessName?,       // required if role === "owner"
  businessDescription? // optional
}
```

### Keycloak Placeholder (`src/lib/auth.ts`)
Static helpers not connected to context: `keycloakLogin()`, `keycloakLogout()`, `getAccessToken()`, `isAuthenticated()`, `getCurrentUser()`, `isBusinessOwner()`.

---

## 8. Design System (`src/app/globals.css`)

> **Tailwind v4 note:** Use `bg-linear-to-{dir}` instead of `bg-gradient-to-{dir}` (canonical v4 class names). The old `bg-gradient-to-*` aliases still work but trigger lint warnings.

### CSS Variables (Blue Palette)
```css
--background: #f8faff
--foreground: #0f172a
--blue-50 through --blue-950
--primary: #2563eb   (blue-600)
--surface: rgba(255,255,255,0.8)
--border: rgba(148,163,184,0.3)
```

### Keyframe Animations
| Class | Description |
|---|---|
| `animate-float` | Gentle up/down float (6s loop) |
| `animate-pulse-glow` | Blue glow pulsing (3s loop) |
| `animate-gradient` | Gradient hue shift (8s loop) |
| `animate-blob` | Organic morphing blob (7s loop) |
| `animate-slide-up` | Entrance slide-up (0.6s, backwards fill) |
| `animate-fade-in` | Opacity fade in (0.5s) |
| `animate-scale-in` | Scale + fade in (0.3s) |
| `animate-shimmer` | Loading skeleton shimmer (1.5s loop) |

### Utility Classes
```css
.glass           /* white/80 backdrop-blur card */
.glass-dark      /* dark backdrop-blur card */
.gradient-text   /* indigo-to-purple text gradient */
.gradient-text-blue /* blue-to-cyan text gradient */
.card-hover      /* translateY + shadow on hover */
.bg-hero         /* dark navy-to-blue diagonal gradient */
.bg-blue-mesh    /* radial gradient mesh background */
```

---

## 9. Navbar (`src/components/layout/Navbar.tsx`)

- Sticky, glass effect on scroll (`bg-white/90 backdrop-blur-md`)
- Logo: blue gradient `from-blue-500 to-blue-700`
- Nav links: `text-blue-600 bg-blue-50` when active; `whitespace-nowrap` to prevent wrapping
- **Alignment fix**: right action area has `shrink-0` to prevent being pushed off-screen; nav section has `min-w-0 overflow-hidden`
- **Logged out**: "Sign in" (ghost) + "Get started" (solid blue) buttons → `/login` and `/register`
- **Logged in**: avatar dropdown with profile, dashboard, settings, sign out
- **Dev Demo button**: small `FlaskConical` button → dropdown to switch between mock users instantly
- Mobile: hamburger menu with all links + auth state + demo switcher

---

## 10. Pages: Auth

### `/login`
- Split-panel: left = `bg-hero` animated gradient with blobs + stats, right = clean form
- Demo accounts section: one-click login for 3 mock users (with avatar, name, role)
- Email + password form → `loginWithCredentials()` → redirect to `/`
- Link to `/register`

### `/register`
- Split-panel (same left branding)
- **Step 1 "Role"**: Two large interactable cards — Customer (blue) or Business Owner (violet)
- **Step 2 "Details"**: Form fields (first name, last name, username, email, password)
  - If owner: additional "Business Name" (required) + "Description" (optional) fields
- Calls `register()` → redirect to `/` on success

---

## 11. Pages: Customer

> **Session 4 redesign**: All 4 customer pages now share the same design language as the landing page — animated `bg-hero` parallax header with blobs, CSS stagger animations (`animationDelay`), wave SVG bottom cutout, glass cards, and animated empty states.

### `/explore`
- **Hero**: parallax `bg-hero` with 3 animated blobs, centered search bar (glass/shadow), stats row
- **Category pills**: scrollable, animated `scale-105` when active  
- **Featured businesses**: 3-column banner cards with hover `scale-110` image effect  
- **Service grid**: `animate-scale-in` stagger per card, banner overlay with rating badge  
- **Empty state**: floating search icon with animated `animate-float`

### `/business/[id]`
- Business header (name, description, banner)
- Services list with booking CTA

### `/service/[id]`
- Multi-step booking:  
  1. **Details** — read service info, fill appointment fields  
  2. **Review** — confirm selections  
  3. **Payment** — Stripe placeholder  
  4. **Confirmed** — success state with booking summary

### `/appointments`
- **Hero**: `bg-hero` with blobs, personalized greeting showing upcoming count, "Book New Service" CTA  
- **Stats row**: 4 colored cards (Total/Confirmed/Pending/Cancelled) with gradient background glow  
- **Upcoming cards**: left-colored accent bar (green=confirmed, amber=pending), mini calendar icon with month/day, amount + arrow CTA  
- **Past cards**: reduced opacity, simpler layout  
- **Not logged in**: full-screen hero with animated bell + sign-in CTA  
- **Empty state**: animated `animate-float` calendar icon with blue CTA button

### `/notifications`
- **Hero**: animated bell with pulsing unread count badge (red, `animate-pulse`), "Mark all read" button  
- **Split sections**: "Unread" (highlighted, colored border, pulse dot) and "Earlier" (dimmed) shown separately  
- **Colors per type**: unique `bg`, `border`, `dot`, `icon` color per notification type  
- **Stagger animations**: `animate-slide-up` for unread, `animate-fade-in` for read  
- **Not logged in**: full-screen hero with animated bell

### `/profile`
- **Cover**: animated `h-52 bg-hero` with blobs + floating sparkle icons  
- **Avatar**: `w-24 h-24` rounded-2xl with blue gradient bg, `border-4 border-white`, pulsing green online dot  
- **Stats row**: 3 colored stat cards (Appointments, Total Spent, Reviews)  
- **Cards**: Personal Info (blue accent), Billing Address (green accent), Payments (emerald accent), Invoices (violet accent) — each with gradient left-to-transparent header background  
- **Not logged in**: full-screen hero with animated user icon

---

## 12. Pages: Owner Dashboard

All routes under `/owner/` are protected by a role guard in `owner/layout.tsx` — redirects non-owners to `/`.

### `/owner/dashboard`
- Revenue summary (total, this month)
- Appointment status breakdown (pie-style counts)
- Recent feedback entries

### `/owner/businesses`
- Cards for each business
- "Create New Business" modal form

### `/owner/services`
- Accordion: each business → services → fields/options

### `/owner/appointments`
- Full table with search, status filter, date sort

### `/owner/payouts`
- Payout statement cards with expandable service billing rows

### `/owner/feedbacks`
- Per-service average rating + feedback comment list

---

## 13. GraphQL Placeholder (`src/lib/mock-graphql.ts`)

Organized as `QUERIES` and `MUTATIONS` objects containing GQL string constants. No live client. Used as documentation of the intended API shape for future backend integration.

Key operations defined:
- `GET_BUSINESSES`, `GET_BUSINESS`, `GET_SERVICES`, `GET_SERVICE`
- `GET_APPOINTMENTS`, `CREATE_APPOINTMENT`, `UPDATE_APPOINTMENT_STATUS`
- `GET_NOTIFICATIONS`, `MARK_NOTIFICATION_READ`
- `GET_PROFILE`, `UPDATE_PROFILE`
- `GET_PAYOUTS`, `GET_FEEDBACKS`
- `SUBMIT_PAYMENT`

---

## 14. Utilities (`src/lib/utils.ts`)

```typescript
cn(...classes)                     // clsx wrapper for conditional Tailwind classes
formatCurrency(amount, currency?)  // "₱1,234.56" (default PHP)
formatDate(dateString)             // "Jan 15, 2025"
formatDateTime(dateString)         // "Jan 15, 2025 at 2:30 PM"
getStatusColor(status)             // Returns Tailwind badge class string for appointment/payment status
```

---

## 15. Extending for Real Backend

1. **Auth**: Replace `AuthProvider.tsx` mock methods with real Keycloak SDK calls using the stubs in `src/lib/auth.ts`. The context interface stays the same.
2. **Data fetching**: Replace mock lookup functions in `mock-data.ts` with `fetch()`/GraphQL calls using the queries from `mock-graphql.ts`.
3. **Payments**: Implement `src/app/service/[id]/page.tsx` payment step with real Stripe Elements SDK.
4. **File uploads**: Business/service banners currently use Unsplash URLs — replace with presigned S3 upload.

---

## 16. OAuth Provider Placeholders

**Status:** Stub UI only. No actual OAuth implementation.

### Implementation Details
- **Location**: `/login/page.tsx` and `/register/page.tsx`
- **Providers**: Google (Chrome icon), Facebook, X/Twitter (Twitter icon)
- **UI**: Three icon buttons in a row below the auth form, styled as outlined buttons with hover state
- **Handler functions**:
  - `handleOAuthLogin(provider)` on `/login` 
  - `handleOAuthSignup(provider)` on `/register`
  - Both currently log to console: `console.log('Attempting to login with ${provider}')`
- **Future Integration**: These functions can be connected to OpenID Connect flows or custom OAuth endpoints

### Button Styling
```tsx
// Grid of 3 equal-width buttons
<button className="w-full flex items-center justify-center py-2.5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all">
  <ChromeIcon className="w-5 h-5" />
</button>
```

---

## 17. ChatBot Feature (`src/components/ChatBot.tsx`)

**Status:** Fully integrated, ready for API key configuration.

### Architecture
- **Component**: `src/components/ChatBot.tsx` (new, client-side "use client")
- **Location in DOM**: Root `layout.tsx` inside `<AuthProvider>` wrapper, rendered after `<Footer />`
- **Position**: Fixed bottom-right corner (`bottom-6 right-6 z-50`)

### UI/UX
- **Collapsed state**: Blue floating action button with `MessageCircle` icon
- **Expanded state**: 384px wide × 448px tall chat window with:
  - Header: "Zendo Assistant" + online status indicator
  - Message history: User messages right-aligned (blue), bot messages left-aligned (gray), with typing indicator animation
  - Input: Text field with Send button, disabled during loading
  - Auto-scroll to latest message

### OpenRouter Integration
- **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
- **Model**: `nvidia/nemotron-3-nano-30b-a3b:free`
- **Auth**: Reads API key from `process.env.NEXT_PUBLIC_OPENROUTER_API_KEY`
- **System Prompt**: "You are a helpful assistant for Zendo, an online appointment booking platform. You help users with booking appointments, finding services, managing their schedule, and general questions about the platform. Be concise, friendly, and helpful. Keep responses to 2-3 sentences."

### Configuration
To enable the chatbot:
1. Create account at [openrouter.ai](https://openrouter.ai)
2. Get API key from settings
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_OPENROUTER_API_KEY=sk_open_...
   ```
4. Restart dev server (`npm run dev`)

### Features
- Maintains conversation history across messages
- Automatic text scrolling to latest message
- Loading state with animated dots
- Error handling with user-friendly messages
- Responsive design (works on mobile with bottom-right positioning)

### Future Enhancements
- Add suggestion pills for common queries ("Book an appointment", "Find services", etc.)
- Persistent conversation history (localStorage or backend)
- Integration with user context (show personalized recommendations)
- Multi-language support

---

## 18. Currency System (Session 5 Update)

**Change**: All currency formatting now uses **PHP (Philippine Peso)** instead of USD.

**Implementation**: Single source of truth in `src/lib/utils.ts`:
```typescript
export function formatCurrency(amount: number, currency = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency
  }).format(amount);
}
```

**Scope**: All components using `formatCurrency()` now display amounts in PHP with ₱ symbol:
- Service prices on `/explore`, `/business/[id]`, `/service/[id]`
- Appointment costs on `/appointments`
- Payout statements on `/owner/payouts`
- Invoice amounts on `/profile`
- Dashboard revenue on `/owner/dashboard`

**Locale**: Switched from `en-US` to `en-PH` for proper regional formatting.

---

## 19. Navbar Updates (Session 5)

### Button Height Optimization
- **Desktop "Sign in" button**: Changed `py-2` → `py-1.5` to reduce vertical padding
- **Desktop "Get started" button**: Changed `py-2` → `py-1.5` 
- **Mobile buttons**: Changed `py-2.5` → `py-1.5` for consistency
- **Issue fixed**: Buttons no longer extend beyond viewport height

### Logo Redesign
- **Previous**: Plain text "Zendo" with gray color
- **Current**: 
  - Blue gradient icon box with "Z" badge
  - Brand text "ZENDO" in uppercase with blue gradient (`bg-linear-to-r from-blue-600 to-blue-700`)
  - Improved visual hierarchy and aesthetic appeal
  - Better alignment with app's blue design language

---

## 20. Extending for Real Backend

1. **Auth**: Replace `AuthProvider.tsx` mock methods with real Keycloak SDK calls using the stubs in `src/lib/auth.ts`. The context interface stays the same.
2. **Data fetching**: Replace mock lookup functions in `mock-data.ts` with `fetch()`/GraphQL calls using the queries from `mock-graphql.ts`.
3. **Payments**: Implement `src/app/service/[id]/page.tsx` payment step with real Stripe Elements SDK.
4. **File uploads**: Business/service banners currently use Unsplash URLs — replace with presigned S3 upload.
5. **ChatBot API Key**: Add `.env.local` with OpenRouter API key for chatbot to function.

---

## 21. Known Limitations (Mock)

- Any password works in login (email-only matching)
- Registered users are stored in memory — lost on page refresh
- `mockUsers` array is mutated on register (not persisted)
- No real-time updates — refresh to see latest notifications
- Owner role guard relies on `user.role === "owner"` in context only
- OAuth buttons are UI stubs only — no actual OAuth flow implemented
- ChatBot requires OpenRouter API key to function (returns error messages if not configured)

