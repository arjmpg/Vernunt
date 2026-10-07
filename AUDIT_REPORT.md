# VERNUNT COMPREHENSIVE PLATFORM AUDIT REPORT
**Platform:** Vernunt (https://app.vernunt.com)  
**Target Domain:** Parents, Children, Daycare, Playmates & Family Healthcare  
**Audit Date:** October 2026  
**Auditor:** Senior Principal Systems & Security Architect  
**Compliance Standards Assessed:** DPDP Act 2023 (India), POCSO Act 2012, IT Act 2000 (Sec 79 & Sec 67B), IT Rules 2021, COPPA (16 CFR Part 312), WCAG 2.1 AA  

---

## 1. EXISTING ARCHITECTURE & SERVICE INVENTORY

| Component | Technology / Service | Location in Codebase | Security & Privacy Status |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite, TypeScript | `/src/App.tsx`, `/src/main.tsx` | Modern SPA with component modularity |
| **Styling Engine** | Tailwind CSS v4, Lucide Icons | `/src/index.css`, `@import "tailwindcss";` | High responsiveness, requires accessibility contrast check |
| **Backend Framework** | Node.js, Express.js | `/server.ts` | High-performance REST API with Vite middlewares |
| **Primary Database** | Firebase Firestore | `/src/utils/firebase.ts`, `firebase-blueprint.json` | Cloud Firestore Enterprise instance |
| **Security Rules** | Firestore Rules v2 | `/firestore.rules` | Hardened ABAC rules required for child data isolation |
| **Authentication** | Firebase Auth (Google OAuth & OTP) | `/src/utils/firebase.ts`, `/server.ts` | Multi-factor, OTP verification gateway |
| **User Roles** | RBAC (`Parent`, `Provider`, `Doctor`, `Vendor`, `Admin`) | `/src/data/userRoles.ts`, `/src/types.ts` | Explicit role separation |
| **File / Media Storage** | Google Cloud / Local Base64 & Object URLs | `/server.ts`, `/src/components/AestheticImageUploader.tsx` | Base64 and secure temporary data |
| **Email System** | Nodemailer / Mock Fallback Gateway | `/server.ts` (`/api/auth/send-email-otp`, `/api/send-ticket-email`) | Transactional OTP and ticket passes |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | `/server.ts`, `/src/utils/fcmMessaging.ts` | Web, Android, iOS token registration |
| **SMS / OTP System** | Simulated Secure SMS API | `/server.ts` (`/api/send-ticket-sms`) | Verified 6-digit cryptographic OTP |
| **Analytics Engine** | Internal Search & Catalog Telemetry | `/src/data/productSearchAnalytics.ts` | Localized, zero third-party telemetry |
| **Cookies & Sessions** | First-party localStorage & HTTP headers | Client storage | Needs formal Consent Banner & Cookie Policy |
| **Third-Party SDKs** | Razorpay (Payments), Firebase SDK | Client & Server | Need strict minimization to prevent child data leak |
| **Maps & Location** | Distance calculators & Geohash approximations | `/src/utils/geoDistance.ts`, `/src/utils/distance.ts` | Needs obfuscation to prevent residential address leak |
| **Payment Gateway** | Razorpay Sandbox/Live | `/server.ts` (`/api/razorpay/*`) | PCI-DSS compliant checkout integration |
| **AI / Voice Agents** | Server-side Gemini API Proxy | `/server.ts` (`/api/copilot`, `/api/ai/*`) | Proxied server-side, no client API keys exposed |
| **Backup System** | Google Drive Backup Gateway & Local ZIP | `/server.ts`, `/src/services/googleDriveBackup.ts` | Encrypted manual and automated backups |

---

## 2. USER JOURNEYS MAPPED & AUDITED

### Public Journeys
1. **Homepage & Navigation:** Public landing page, search bar, role introduction.
2. **Kids Playmate Radar:** Map & list of playmates in Bengaluru / Pan-India. *(Risk: Prior versions risked showing exact coordinates instead of neighbourhood fuzzing)*.
3. **Daycare & Babysitting:** Directory of verified centers, amenities, reviews.
4. **Knowledge Guides:** Articles on parenting, nutrition, milestones.
5. **Community Events & Classes:** Worksheets, sports, family gatherings.
6. **Pediatric Specialists:** Profiles of pediatricians, gynecologists, nutritionists.
7. **Legal & Compliance:** Terms, Privacy, Safety, Grievance pages.

### Authenticated Journeys
1. **Parent Onboarding & Login:** Google Sign-in, phone OTP, account type selection.
2. **Child Profile Creation:** Child name, age, interests, play style. *(Risk: Needs explicit parental authorization checkbox and privacy default)*.
3. **Parent Messaging & Chat:** End-to-end P2P chat and parent interest groups. *(Security: data-nosnippet and noindex applied to group messages)*.
4. **Event Booking & Pass Generation:** Ticket reservation with QR pass.
5. **Account Settings & Data Rights:** *(Gap: Needs "Privacy & Data" tab with Download Data, Delete Child, Delete Account)*.

### Administrator Journeys
1. **User Management & KYC Verification:** Aadhaar verification, DigiLocker review.
2. **Child Safety Incident Management:** Emergency alerts and moderation.
3. **Commerce & Product Feeds:** Vernunt Merchant Hub catalog sync.
4. **Compliance & Trust Dashboard:** Data inventory, privacy requests, asset licenses, claims audit.

---

## 3. AUDIT RISK MATRIX & RECOMMENDATIONS

| Feature | Current Implementation | Identified Risk | Severity | Recommended Fix | Files Affected | DB / API Changes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Child Profile Visibility** | Profile visible in Radar if created | Child info visible to all signed-in users | **CRITICAL** | Default to `PRIVATE`. Add toggle for `PRIVATE`, `CONNECTIONS`, `PUBLIC`. | `/src/types.ts`, `/src/components/EditProfileModal.tsx` | Add `profileVisibility` to `ChildProfile` schema |
| **Location Precision** | Coordinates mapped directly | Potential leakage of exact residential address | **CRITICAL** | Fuzz coordinates by 1.2–2.0 km radius; show neighborhood/locality only; never send exact lat/lng to clients. | `/src/utils/geoDistance.ts`, `/server.ts`, `/src/components/PlaymateRadar.tsx` | API `/api/radar/safe-playmates` with jittered coordinates |
| **User Data Deletion** | Local state removal only | Personal data remains on server / Firestore | **CRITICAL** | Real backend cascade deletion: removes child profile, anonymizes bookings, revokes FCM tokens. | `/server.ts`, `/src/components/ChildSafetyComplianceModal.tsx` | New API: `POST /api/privacy/delete-account`, `POST /api/privacy/delete-child` |
| **Data Download (Portability)** | Mock file export in modal | Incomplete data export violating DPDP Sec 12 | **HIGH** | Comprehensive JSON export of profile, children, bookings, messages, and consent log. | `/server.ts`, `/src/services/privacyService.ts` | New API: `POST /api/privacy/download-my-data` |
| **Firestore Security Rules** | Blanket read on `/users/{userId}` | Unauthenticated read of user profiles | **CRITICAL** | Restrict reads to owner, admin, or public/connections visibility tier. | `/firestore.rules` | Hardened rules with ABAC helper functions |
| **Cookie Consent** | No banner; cookies & localStorage loaded immediately | Non-compliance with privacy regulations | **HIGH** | Implement banner with Accept All, Reject Non-Essential, and Granular Preferences. | New component `CookieConsentBanner.tsx` | Store preferences in `vernunt_cookie_consent` & API |
| **Guardian Consent Audit** | Single signup button | Bundled consent without verifiable proof | **HIGH** | Unbundled checkboxes: (1) 18+ Guardian authority, (2) Terms & Medical, (3) DPDP Privacy. Record consent with timestamp. | `/src/components/LandingLoginGateway.tsx`, `/server.ts` | New table `user_consents` and API `/api/privacy/record-consent` |
| **Content Moderation & Reporting** | Limited reporting modal | Reports not tracked in admin queue | **HIGH** | Dedicated Report & Block workflow with Admin Moderation Queue. | `/src/components/ReportModal.tsx`, `/src/components/AdminDashboard.tsx` | New collection `content_reports` and `/api/safety/report` |
| **Public Claims ("100% Safe", "Verified")** | Static badges without audit log | Unsupported marketing claims | **MEDIUM** | Define exact verification standard, verifier identity, date, document, and expiry date. | `/src/components/LegalPolicyModal.tsx`, Admin Compliance Desk | Add Claims Audit Registry |
| **Accessibility (WCAG 2.1 AA)** | Missing ARIA labels and low contrast in muted text | Inaccessible to keyboard and screen readers | **MEDIUM** | Add aria-labels, focus rings, role dialogs, high contrast colors. | Global components | Frontend ARIA & contrast upgrade |
| **Marketing Email Unsubscribe** | No direct link in simulated mailers | Inability to opt-out of marketing emails | **MEDIUM** | Provide one-click unsubscribe endpoint and preference management center. | `/server.ts`, `/src/components/PrivacyAndDataModal.tsx` | New API `/api/email/unsubscribe` |
| **Asset Licensing** | Fonts & medical icons used without license manifest | Potential copyright liability | **LOW** | Create Admin Asset Licensing Library logging licenses, attribution, and commercial rights. | New `AssetLicenseDesk` in Admin | New entity `asset_licenses` in `firebase-blueprint.json` |

---

## 4. DATA INVENTORY & MINIMIZATION AUDIT

| Field | Entity / Table | Purpose | Mandatory? | Sensitive? | Public? | Retention Period | Deletion / Anonymization Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `ChildProfile` | Unique identifier | Yes | No | Yes | Active account duration | Permanent deletion upon account erasure |
| `parentName` | `ChildProfile` | Guardian display name | Yes | No | Public/Conn | Active account duration | Deleted or anonymized to "Deleted User" |
| `childName` | `ChildProfile` | Child first name / nickname | Yes | Medium | Only if parent allows | Active account duration | Deleted on child deletion |
| `childAge` | `ChildProfile` | Playmate age matching | Yes | Medium | Only if parent allows | Active account duration | Deleted on child deletion |
| `childGender` | `ChildProfile` | Demographic filter | Optional | Low | Only if parent allows | Active account duration | Deleted on child deletion |
| `bio` | `ChildProfile` | Friendly introductory note | Optional | Low | Only if parent allows | Active account duration | Deleted on child deletion |
| `profileVisibility` | `ChildProfile` | Privacy boundary (`PRIVATE`, `CONNECTIONS`, `PUBLIC`) | Yes | No | No | Active account duration | Reset on deletion |
| `approximateArea` | `ChildProfile` | General locality (e.g., "Koramangala 4th Block") | Yes | Low | Fuzzed radius | Active account duration | Erased on deletion |
| `fuzzedLatitude` | `ChildProfile` | Approximate jittered coordinate (+/- 1.5km) | Optional | Medium | Obfuscated | Active account duration | Erased on deletion |
| `aadhaarNumber` | `ChildProfile` | Identity verification | Optional | **CRITICAL** | **NEVER** | Masked / Hash only | Hard-erased after verification check |
| `phoneNumber` | `UserContact` | Emergency P2P connection | Optional | High | Connections only | Active account duration | Erased on account deletion |
| `email` | `UserContact` | Official account notification | Yes | Medium | Private | Legal limit (3 yrs for tax) | Anonymized for transaction history |
| `fcmToken` | `FcmDeviceToken` | Device push notifications | Optional | Low | Private | 90 days of inactivity | Deleted immediately upon logout/deletion |

---

## 5. THIRD-PARTY SDK & SERVICE AUDIT

| Service / SDK | Purpose | Child Data Shared? | Legal / Consent Basis | Retention | Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Firebase Auth** | User authentication | **NO** (Parent email/Google ID only) | Performance of contract | Auth session life | Retain; enforce Google Auth security |
| **Cloud Firestore** | Persistent encrypted database | Encrypted child demographics | Verifiable Parental Consent | Account lifetime | Enforce ABAC security rules |
| **Razorpay** | E-commerce & ticket checkout | **NO** (Order ID & parent email only) | Financial transaction | 7 years (RBI tax compliance) | Retain; itemized fee breakdown |
| **OpenStreetMap / Leaflet** | Playmate radar map display | **NO** (Fuzzed client-side coordinates) | Legitimate interest (Discovery) | Transient tile fetch | Enforce 1.5km coordinate fuzzing |
| **FCM (Firebase Cloud Messaging)** | In-app child playdate notifications | **NO** (Notification payload masked) | Explicit user opt-in | Revocable in preferences | Add granular notification toggles |

---

## 6. IMPLEMENTATION ROADMAP (PHASES 4 TO 32)
1. **Database & Schema Hardening:** Update `firebase-blueprint.json` and `firestore.rules`.
2. **Backend Engine:** Implement privacy endpoints, deletion workflows, location fuzzing, and consent storage in `server.ts`.
3. **Cookie Consent System:** Build `CookieConsentBanner.tsx` and integrate policy controls.
4. **Child Safety & Privacy Modal:** Build `PrivacyAndDataModal.tsx` under Account Settings.
5. **Safety Reporting & Moderation:** Build `SafetyReportModal.tsx` and connect to Admin Moderation Queue.
6. **Admin Compliance & Trust Desk:** Build `AdminComplianceDesk.tsx` with all 16 audit panels.
7. **Accessibility & Claim Transparency:** Implement WCAG 2.1 AA improvements, alt texts, and verified claim definitions.
8. **Final Testing & Verification:** Run build compilation, linting, and security penetration checks.
