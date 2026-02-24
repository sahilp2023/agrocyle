# AgroCycle — Sprint Changelog (24 Feb 2026)

## 🔧 Bug Fixes

### Operator Type Registration Bug
- Fixed: Operators selecting "Truck" during registration were incorrectly saved as "Baler"
- **Root Cause**: `handleSendOTP` sent a default `operatorType: 'baler'` at the phone step before the user selected their type
- **Fix**: `operatorType` is now only persisted after profile completion via PATCH
- Files: `operator/register/page.tsx`, `api/operator/auth/register/route.ts`

### Assignment "Failed to Assign" Bug
- Fixed: Clicking "Confirm Assignment" on Pickup Requests showed "Failed to assign"
- **Root Cause**: Assignment API validated operator IDs against the old `Baler` vehicle collection (which didn't have those IDs)
- **Fix**: Rewrote assignment POST to use `Operator` model. Also fixed front-end reading `data.message` instead of `data.error`
- Files: `api/hub/assignments/route.ts`, `hub/requests/page.tsx`, `models/Assignment.ts`

---

## ✨ New Features

### 1. Operator Type Edit (Operator Portal)
- Operators can now change their type (Baler / Truck / Both) from their profile edit section
- Operator type selector with toggle buttons shown in edit mode
- Files: `operator/profile/page.tsx`, `api/operator/profile/route.ts`

### 2. Fleet Record Column (Hub Portal)
- Added "Record" column with "View" button in Fleet Management table
- Files: `hub/fleet/page.tsx`

### 3. Operator Assignment Flow
- Hub manager assigns operator via Pickup Requests → operator sees job in their portal
- Job card shows: farmer name, phone, village, farm plot, crop type
- Operator can **Accept** or **Reject** jobs from list or detail page
- Files: `operator/jobs/page.tsx`, `operator/jobs/[id]/page.tsx`, `api/operator/jobs/route.ts`

### 4. Job Completion Form (Operator Portal)
- After accepting and starting work, operator fills a completion report:
  - Time Required (minutes)
  - Quantity Bailed (tonnes)
  - Moisture Content (%)
  - Photo of Field (camera capture)
  - Remarks
- Submits and moves job to "In Review" status
- Files: `operator/jobs/[id]/page.tsx`, `api/operator/jobs/route.ts`

### 5. Hub Review Flow (Hub Portal)
- "In Review" tab in Assignments shows operator-submitted data
- Hub manager sees: Qty Bailed, Time Taken, Moisture Content, Bale Count, Est. Qty
- Hub manager reviews data and marks assignment complete
- Files: `hub/assignments/page.tsx`, `api/hub/assignments/route.ts`

### 6. Fleet Record Detail Page (Hub Portal)
- Clicking "View" in Fleet Management opens a detailed record page
- **Vehicle Stats** (dummy data for MVP): Odometer, Speed, Fuel Economy, Running/Idle Time
- **Current Location Map**: Embedded Google Maps showing operator's live GPS position
- **Driver Info**: Name, phone, vehicle details, service dates, total jobs, earnings, rating
- **Work Performance**: Stats grid + monthly bar chart
- **Recent Work History**: Table of past assignments
- Files: `hub/fleet/[id]/page.tsx`, `api/hub/fleet/[id]/route.ts`

### 7. Operator GPS Location Tracking
- Operator dashboard captures GPS on load via `navigator.geolocation`
- Visible location status banner: detecting → shared ✅ / denied (with retry button)
- Location saved as GeoJSON on operator's MongoDB document
- Displayed on hub's fleet record page map
- Files: `operator/dashboard/page.tsx`, `api/operator/profile/route.ts`

---

## 📁 Files Modified

| Area | File | Change |
|------|------|--------|
| **Model** | `models/Assignment.ts` | `balerId` optional, added `timeRequired`, `moistureContent` |
| **API** | `api/hub/assignments/route.ts` | Rewritten — uses Operator model, not Baler |
| **API** | `api/hub/fleet/[id]/route.ts` | **NEW** — operator detail + stats |
| **API** | `api/operator/jobs/route.ts` | Removed Baler dep, added new fields |
| **API** | `api/operator/profile/route.ts` | Accepts `operatorType` + `currentLocation` |
| **Hub** | `hub/fleet/page.tsx` | View button navigates to record page |
| **Hub** | `hub/fleet/[id]/page.tsx` | **NEW** — fleet record detail page |
| **Hub** | `hub/assignments/page.tsx` | Review modal shows completion form data |
| **Hub** | `hub/requests/page.tsx` | Fixed error display |
| **Operator** | `operator/register/page.tsx` | Fixed operatorType bug |
| **Operator** | `operator/profile/page.tsx` | Added type selector in edit |
| **Operator** | `operator/dashboard/page.tsx` | GPS capture + location banner |
| **Operator** | `operator/jobs/page.tsx` | Rewritten — farmer info + accept/reject |
| **Operator** | `operator/jobs/[id]/page.tsx` | **NEW** — full job detail + completion form |

---

## 🔄 Status Flow

```
Hub Assigns Operator → Assignment Created (status: assigned, operatorStatus: pending)
    ↓
Operator Accepts → (in_progress / accepted)
    ↓
Operator Starts Work → (work_started)
    ↓
Operator Fills Form & Submits → (work_complete) → Appears in Hub "In Review" tab
    ↓
Hub Manager Reviews & Approves → (completed / delivered)
```
