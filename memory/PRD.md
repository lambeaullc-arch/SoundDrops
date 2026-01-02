# SoundDrops MVP - Product Requirements Document

## Original Problem Statement
Build a music sample marketplace called "SoundDrops" with:
- Three user roles: Admin, Creators (invite-only), Customers
- Public landing page with Featured Packs and Sync-Ready Loops sections
- Free registration or $5/month subscription
- Smart sign-in redirects to role-specific dashboards
- 90/10 revenue split (90% to creators, 10% platform)
- PayPal/Debit Card/Bank Transfer for payouts

## Tech Stack
- **Frontend**: React, TailwindCSS, wavesurfer.js
- **Backend**: FastAPI, MongoDB (motor async driver)
- **Authentication**: Google OAuth via Emergent Auth
- **Payments**: PayPal (payouts), Debit Card (instant cashout), Bank Transfer

## User Roles
1. **Admin** (lambeaullc@gmail.com)
   - Full platform control
   - Upload/edit packs, manage content
   - Invite creators, promote users
   - View all user emails
   - Configure payout method (PayPal, Debit Card, Bank Transfer)
   
2. **Creators** (invite-only)
   - Upload sample packs (audio + ZIP)
   - View earnings dashboard
   - 90% revenue share
   - Choose payout method
   - Request instant cashout (debit card)
   
3. **Customers**
   - Browse and download samples
   - Free tier or subscription

## Core Features

### Implemented ✅
- [x] Multi-role authentication with Google OAuth
- [x] Admin dashboard with all tabs
- [x] Creator dashboard with upload capability
- [x] ZIP file upload support for sample packs
- [x] Featured/Sync-Ready toggles for uploads
- [x] BPM/Key metadata fields
- [x] Content management with edit/delete capabilities
- [x] Creator invitation system
- [x] User promotion to creator
- [x] ObjectId serialization fix for MongoDB
- [x] Role-based routing
- [x] **Cover art upload (required for every pack)**
- [x] **Audio waveform preview with seek functionality**
- [x] **Preview audio upload for ZIP files**
- [x] **Pack detail page at /pack/:packId**
- [x] **Navigation menu on all pages**
- [x] **View Pack button in content management**
- [x] **Fixed dropdown styling (dark background)**
- [x] **PayPal payout support**
- [x] **Debit card instant cashout**
- [x] **Bank transfer payout option**
- [x] **Creator balance & payout history**

### In Progress 🔄
- [ ] Admin redirect after login (needs user verification)

### Upcoming Tasks 📋
- [ ] BPM/Key filtering in search
- [ ] Subscription management

### Future/Backlog 📦
- [ ] App rebranding (new name TBD)
- [ ] Bundle feature for bulk downloads
- [ ] Email notifications

## Key Endpoints

### Authentication
- `POST /api/auth/session` - Exchange session for token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Samples
- `GET /api/samples` - List samples with filters
- `GET /api/samples/{pack_id}` - Get single pack
- `GET /api/samples/{pack_id}/cover` - Get cover image
- `GET /api/samples/{pack_id}/preview` - Get preview audio
- `GET /api/samples/{pack_id}/download` - Download pack

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - All users (email collection)
- `POST /api/admin/packs` - Upload pack (with cover + preview)
- `PUT /api/admin/packs/{pack_id}` - Edit pack
- `DELETE /api/admin/packs/{pack_id}` - Delete pack
- `GET/POST /api/admin/payout-method` - Admin payout settings

### Creator
- `POST /api/creator/packs` - Upload pack
- `GET /api/creator/packs` - List own packs
- `GET /api/creator/earnings` - Earnings summary
- `GET/POST /api/creator/payout-method` - Payout settings
- `GET /api/creator/balance` - Current balance
- `POST /api/creator/request-payout` - Request payout
- `GET /api/creator/payouts` - Payout history

## Database Schema

### users
```json
{
  "user_id": "user_xxx",
  "email": "string",
  "name": "string",
  "role": "admin|creator|user",
  "payout_info": {
    "payout_method": "paypal|debit_card|bank_transfer",
    "paypal_email": "string",
    "card_last_four": "string",
    "bank_account_last_four": "string"
  }
}
```

### sample_packs
```json
{
  "pack_id": "pack_xxx",
  "title": "string",
  "cover_image_path": "string",
  "preview_audio_path": "string",
  "is_featured": "boolean",
  "is_sync_ready": "boolean",
  "bpm": "int",
  "key": "string"
}
```

### payouts
```json
{
  "payout_id": "payout_xxx",
  "creator_id": "string",
  "amount": "float",
  "method": "paypal|debit_card|bank_transfer",
  "status": "pending|processing|completed",
  "is_instant": "boolean"
}
```

## Testing Status
- Backend: All endpoints working
- Frontend: Functional with waveform player
- Deployment: Ready
- Last tested: January 2, 2026

## Known Issues
- Admin redirect after login needs verification

## Files Reference
- `/app/backend/server.py` - Main backend
- `/app/frontend/src/pages/AdminDashboard.js` - Admin UI
- `/app/frontend/src/pages/Creator.js` - Creator UI
- `/app/frontend/src/pages/PackDetail.js` - Pack detail page
- `/app/frontend/src/pages/Home.js` - Homepage with waveform
- `/app/frontend/src/components/audio/MiniWaveformPlayer.js` - Inline waveform
- `/app/frontend/src/components/audio/WaveformPlayer.js` - Full waveform
- `/app/frontend/src/components/layout/Navbar.js` - Navigation
