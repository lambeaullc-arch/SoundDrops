# SoundDrops MVP - Product Requirements Document

## Original Problem Statement
Build a music sample marketplace called "SoundDrops" with:
- Three user roles: Admin, Creators (invite-only), Customers
- Public landing page with Featured Packs and Sync-Ready Loops sections
- Free registration or $5/month subscription
- Smart sign-in redirects to role-specific dashboards
- 90/10 revenue split (90% to creators, 10% platform)
- Stripe integration for payments and payouts

## Tech Stack
- **Frontend**: React, TailwindCSS, wavesurfer.js
- **Backend**: FastAPI, MongoDB (motor async driver)
- **Authentication**: Google OAuth via Emergent Auth
- **Payments**: Stripe (test mode - sk_test_emergent)

## User Roles
1. **Admin** (lambeaullc@gmail.com)
   - Full platform control
   - Upload/edit packs, manage content
   - Invite creators, promote users
   - View all user emails
   
2. **Creators** (invite-only)
   - Upload sample packs (audio + ZIP)
   - View earnings dashboard
   - 90% revenue share
   
3. **Customers**
   - Browse and download samples
   - Free tier or subscription

## Core Features

### Implemented ✅
- [x] Multi-role authentication with Google OAuth
- [x] Admin dashboard with all tabs (Overview, Creator Mgmt, Content, Emails, Payments, Upload)
- [x] Creator dashboard with upload capability
- [x] ZIP file upload support for sample packs
- [x] Featured/Sync-Ready toggles for uploads
- [x] BPM/Key metadata fields
- [x] Content management with edit/delete capabilities
- [x] Creator invitation system
- [x] User promotion to creator
- [x] ObjectId serialization fix for MongoDB
- [x] Role-based routing (admin -> /admin-dashboard, creator -> /creator)
- [x] **Cover art upload (required for every pack)**
- [x] **Audio preview from homepage with play/pause**
- [x] **Preview audio upload for ZIP files**
- [x] **Pack detail page at /pack/:packId**
- [x] **Navigation menu on admin dashboard**
- [x] **View Pack button in content management**
- [x] **Optimized database queries for production**

### In Progress 🔄
- [ ] Admin redirect after login (needs user verification)

### Upcoming Tasks 📋
- [ ] BPM/Key filtering in search
- [ ] Stripe checkout integration (test keys ready)
- [ ] Subscription management

### Future/Backlog 📦
- [ ] App rebranding (new name TBD)
- [ ] Bundle feature for bulk downloads
- [ ] Creator payout via Stripe Connect
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
- `POST /api/admin/invite-creator` - Invite creator
- `POST /api/admin/users/{user_id}/promote` - Promote to creator

### Creator
- `POST /api/creator/packs` - Upload pack (with cover + preview)
- `GET /api/creator/packs` - List own packs
- `GET /api/creator/earnings` - Earnings summary

## Database Schema

### users
```json
{
  "user_id": "user_xxx",
  "email": "string",
  "name": "string",
  "role": "admin|creator|user",
  "creator_approved": "boolean",
  "created_at": "datetime"
}
```

### sample_packs
```json
{
  "pack_id": "pack_xxx",
  "title": "string",
  "description": "string",
  "category": "Drums|Bass|Synths|FX|Vocals|Loops",
  "price": "float",
  "is_free": "boolean",
  "is_featured": "boolean",
  "is_sync_ready": "boolean",
  "sync_type": "Sports|Film|Cinematic|Broadcast",
  "bpm": "int",
  "key": "string",
  "file_type": "audio|zip",
  "cover_image_path": "string",
  "preview_audio_path": "string",
  "creator_id": "string",
  "created_at": "datetime"
}
```

## Environment Variables

### Backend (/app/backend/.env)
- MONGO_URL
- DB_NAME
- STRIPE_API_KEY
- ADMIN_EMAIL (lambeaullc@gmail.com)

### Frontend (/app/frontend/.env)
- REACT_APP_BACKEND_URL

## Testing Status
- Backend: All endpoints working
- Frontend: Functional
- Deployment: Ready (environment files configured)
- Last tested: January 1, 2026

## Known Issues
- Stripe payments are MOCKED (test mode)
- Admin redirect after login needs user verification

## Files Reference
- `/app/backend/server.py` - Main backend
- `/app/frontend/src/pages/AdminDashboard.js` - Admin UI
- `/app/frontend/src/pages/Creator.js` - Creator UI
- `/app/frontend/src/pages/PackDetail.js` - Pack detail page
- `/app/frontend/src/pages/Home.js` - Homepage with audio preview
- `/app/frontend/src/utils/api.js` - API functions
