# DesignFlow Studio Backend API Documentation

This document describes all available API endpoints, their request/response formats, and authentication requirements.

---

## Authentication APIs

### Register
- **POST** `/api/auth/register`
- **Description:** Register a new user.
- **Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": { "id": "...", "name": "...", "email": "...", "role": "..." }
}
```

### Login
- **POST** `/api/auth/login`
- **Description:** Login with email and password.
- **Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": { "id": "...", "name": "...", "email": "...", "role": "..." }
}
```

### Generate OTP
- **POST** `/api/auth/generate-otp`
- **Description:** Generate OTP for phone authentication.
- **Request Body:**
```json
{ "phoneNumber": "+911234567890" }
```
- **Response:**
```json
{ "success": true, "message": "OTP sent successfully", "data": { "verificationCode": "123456", "phoneNumber": "+911234567890" } }
```

### Verify OTP
- **POST** `/api/auth/verify-otp`
- **Description:** Verify OTP and login/register user.
- **Request Body:**
```json
{ "phoneNumber": "+911234567890", "otp": "123456" }
```
- **Response:**
```json
{ "success": true, "message": "OTP verified successfully", "data": { "token": "jwt_token", "user": { ... } } }
```

### Get Current User
- **GET** `/api/auth/me`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": { ...user fields... } }
```

### Update Profile
- **PUT** `/api/auth/profile`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ "name": "string", "email": "string" }
```
- **Response:**
```json
{ "success": true, "message": "Profile updated successfully", "data": { ...user fields... } }
```

### Update User Role
- **PUT** `/api/auth/users/:userId/role`
- **Auth:** Bearer JWT (admin only)
- **Request Body:**
```json
{ "role": "admin" | "designer" | "sales" }
```
- **Response:**
```json
{ "success": true, "message": "User role updated successfully", "data": { ...user fields... } }
```

### Google OAuth Login
- **GET** `/api/auth/google`
- **Description:** Initiate Google OAuth authentication flow.
- **Auth:** None (Public endpoint)
- **Response:** Redirects to Google OAuth consent screen
- **Note:** User will be redirected to Google's authentication page

### Google OAuth Callback
- **GET** `/api/auth/google/callback`
- **Description:** Handle Google OAuth callback and authenticate user.
- **Auth:** None (Handled by Google OAuth)
- **Response:** Redirects to frontend with JWT token
- **Redirect URL Format:**
```
FRONTEND_URL/auth/callback?token=JWT_TOKEN&user=ENCODED_USER_DATA
```
- **User Data Format:**
```json
{
  "id": "user_id",
  "name": "user_name", 
  "email": "user_email",
  "role": "user_role"
}
```
- **Error Redirect Format:**
```
FRONTEND_URL/auth/error?message=ERROR_MESSAGE
```

### Google OAuth Setup Requirements

**Environment Variables:**
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
```

**Google Cloud Console Setup:**
1. Create a project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

**Frontend Integration:**
```javascript
// Redirect user to Google OAuth
window.location.href = '/api/auth/google';

// Handle callback in your frontend
// The backend will redirect to: FRONTEND_URL/auth/callback?token=JWT_TOKEN&user=USER_DATA
```

---

## Dashboard APIs

### Get Dashboard Overview
- **GET** `/api/dashboard/overview`
- **Auth:** Bearer JWT
- **Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "activeProjects": 4,
      "totalClients": 12,
      "totalLeads": 25
    },
    "recentProjects": [...],
    "todaysTasks": [...]
  }
}
```

**Test with curl:**
```bash
# Get JWT token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Use the token to access dashboard
curl -X GET http://localhost:3000/api/dashboard/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Dashboard KPIs
- **GET** `/api/dashboard/kpis`
- **Auth:** Bearer JWT
- **Response:**
```json
{
  "success": true,
  "data": {
    "activeProjects": {
      "count": 4,
      "change": "4.0"
    },
    "clientConversion": {
      "rate": "42.0",
      "change": "6.0"
    }
  }
}
```

**Test with curl:**
```bash
curl -X GET http://localhost:3000/api/dashboard/kpis \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Project Insights
- **GET** `/api/dashboard/project-insights?timeframe=week`
- **Auth:** Bearer JWT
- **Query Params:** `timeframe` (week|month|year)
- **Response:**
```json
{
  "success": true,
  "data": {
    "workloadDistribution": [
      {
        "date": "2024-01-15",
        "day": "Mon",
        "projects": 2,
        "tasks": 8
      }
    ],
    "monthlyRevenue": 2400,
    "timeframe": "week"
  }
}
```

**Test with curl:**
```bash
# Test with week timeframe
curl -X GET "http://localhost:3000/api/dashboard/project-insights?timeframe=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Test with month timeframe
curl -X GET "http://localhost:3000/api/dashboard/project-insights?timeframe=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Recent Projects
- **GET** `/api/dashboard/recent-projects?limit=5`
- **Auth:** Bearer JWT
- **Query Params:** `limit` (number)
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "project_id",
      "name": "Web Development Project",
      "client": "Client Name",
      "status": "in_progress",
      "progress": 75,
      "rate": "$10/hr",
      "tags": ["Remote"],
      "description": "Frontend, backend & API integration"
    }
  ]
}
```

**Test with curl:**
```bash
# Get recent projects with default limit (5)
curl -X GET http://localhost:3000/api/dashboard/recent-projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Get recent projects with custom limit
curl -X GET "http://localhost:3000/api/dashboard/recent-projects?limit=3" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Today's Tasks
- **GET** `/api/dashboard/todays-tasks`
- **Auth:** Bearer JWT
- **Response:**
```json
{
  "success": true,
  "data": {
    "todaysTasks": [
      {
        "id": "task_id",
        "title": "Review Proposal X",
        "dueDate": "2024-01-15T10:00:00Z",
        "status": "In Progress",
        "project": "Project Name"
      }
    ],
    "tomorrowsTasks": [...]
  }
}
```

**Test with curl:**
```bash
curl -X GET http://localhost:3000/api/dashboard/todays-tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Active Clients
- **GET** `/api/dashboard/active-clients`
- **Auth:** Bearer JWT
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "client_id",
      "name": "ATech Labs",
      "status": "Ongoing",
      "project": "UX/UI revamp",
      "avatar": null
    }
  ]
}
```

**Test with curl:**
```bash
curl -X GET http://localhost:3000/api/dashboard/active-clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Active Projects with Progress
- **GET** `/api/dashboard/active-projects`
- **Auth:** Bearer JWT
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "project_id",
      "name": "Sharma Residence",
      "client": "Sharma Family",
      "type": "Apartment",
      "progress": 75,
      "nextTask": "Final Inspection",
      "teamMembers": ["User1", "User2", "User3"]
    }
  ]
}
```

**Test with curl:**
```bash
curl -X GET http://localhost:3000/api/dashboard/active-projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Leads Funnel
- **GET** `/api/dashboard/leads-funnel`
- **Auth:** Bearer JWT
- **Response:**
```json
{
  "success": true,
  "data": {
    "inquiry": 12,
    "proposalSent": 8,
    "negotiation": 5,
    "won": 3
  }
}
```

**Test with curl:**
```bash
curl -X GET http://localhost:3000/api/dashboard/leads-funnel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Recent Leads
- **GET** `/api/dashboard/recent-leads?limit=5`
- **Auth:** Bearer JWT
- **Query Params:** `limit` (number)
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lead_id",
      "name": "Aditya Kumar",
      "projectType": "2BHK Apartment",
      "status": "new",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Test with curl:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/recent-leads?limit=3" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Pending Approvals
- **GET** `/api/dashboard/pending-approvals`
- **Auth:** Bearer JWT
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "estimate_id",
      "type": "estimate",
      "number": "EST-2023-045",
      "client": "Aditya Kumar",
      "project": "2BHK Apartment",
      "status": "Awaiting",
      "sentDate": "2024-01-13T10:00:00Z"
    }
  ]
}
```

**Test with curl:**
```bash
curl -X GET http://localhost:3000/api/dashboard/pending-approvals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Recent Messages
- **GET** `/api/dashboard/recent-messages`
- **Auth:** Bearer JWT
- **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_id",
      "sender": "Aditya Kumar",
      "timestamp": "2024-01-15T10:23:00Z",
      "content": "Thank you for the estimate. I have a few questions...",
      "type": "whatsapp"
    }
  ]
}
```

**Test with curl:**
```bash
curl -X GET http://localhost:3000/api/dashboard/recent-messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Revenue Snapshot
- **GET** `/api/dashboard/revenue-snapshot?period=month`
- **Auth:** Bearer JWT
- **Query Params:** `period` (week|month|year)
- **Response:**
```json
{
  "success": true,
  "data": {
    "estimatesRaised": {
      "amount": 2850000,
      "change": 12
    },
    "projectsClosed": {
      "amount": 1820000,
      "change": 8
    },
    "paymentsReceived": {
      "amount": 1570000,
      "change": -3
    },
    "weeklyRevenue": [
      {
        "week": "Week 1",
        "revenue": 450000
      }
    ],
    "period": "month"
  }
}
```

**Test with curl:**
```bash
curl -X GET "http://localhost:3000/api/dashboard/revenue-snapshot?period=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Quick Actions

#### Create Quick Lead
- **POST** `/api/dashboard/quick-actions/new-lead`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{
  "name": "Aditya Kumar",
  "phone": "+911234567890",
  "email": "aditya@example.com",
  "projectTag": "2BHK Apartment",
  "source": "website"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": { ...lead fields... }
}
```

#### Create Quick Proposal
- **POST** `/api/dashboard/quick-actions/new-proposal`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{
  "projectId": "project_id",
  "title": "Interior Design Proposal",
  "description": "Complete interior design solution"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "data": { ...proposal fields... }
}
```

#### Create Quick Estimate
- **POST** `/api/dashboard/quick-actions/new-estimate`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{
  "leadId": "lead_id",
  "name": "Interior Design Estimate",
  "projectDetails": {
    "sqft": 1200,
    "layoutType": "2BHK",
    "materialLevel": "Standard"
  }
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Estimate created successfully",
  "data": { ...estimate fields... }
}
```

**Test Quick Actions with curl:**
```bash
# Create quick lead
curl -X POST http://localhost:3000/api/dashboard/quick-actions/new-lead \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aditya Kumar",
    "phone": "+911234567890",
    "email": "aditya@example.com",
    "projectTag": "2BHK Apartment"
  }'

# Create quick proposal
curl -X POST http://localhost:3000/api/dashboard/quick-actions/new-proposal \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project_id",
    "title": "Interior Design Proposal",
    "description": "Complete interior design solution"
  }'
```

---

## Client Portal APIs

### Generate Access Token
- **POST** `/api/client-portal/generate-token`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "clientId": "string", "method": "email" | "whatsapp" }
```
- **Response:**
```json
{ "success": true, "message": "Access token sent via email" }
```

### Verify Token
- **POST** `/api/client-portal/verify-token`
- **Request Body:**
```json
{ "token": "string" }
```
- **Response:**
```json
{ "success": true, "data": { "clientId": "...", "accessToken": "..." } }
```

### Get Dashboard
- **GET** `/api/client-portal/:clientId/dashboard`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": { ...client portal data... } }
```

### Add Comment
- **POST** `/api/client-portal/:clientId/comments`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ "content": "string", "section": "string", "sectionId": "string" }
```
- **Response:**
```json
{ "success": true, "data": { ...comment... } }
```

### Update Document Status
- **PUT** `/api/client-portal/:clientId/documents/:documentId/status`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ "status": "pending" | "approved" | "rejected" }
```
- **Response:**
```json
{ "success": true, "data": { ...document... } }
```

### Update Preferences
- **PUT** `/api/client-portal/:clientId/preferences`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ "notificationMethod": "email" | "whatsapp" | "both", "whatsappNumber": "string" }
```
- **Response:**
```json
{ "success": true, "data": { ...preferences... } }
```

### Get Project Updates
- **GET** `/api/client-portal/projects/:projectId/updates`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": [ ...updates... ] }
```

### Test WhatsApp Message
- **POST** `/api/client-portal/test-whatsapp`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "phoneNumber": "+911234567890", "message": "string" }
```
- **Response:**
```json
{ "success": true, "message": "WhatsApp message sent" }
```

---

## CRM APIs

### Create Lead
- **POST** `/api/crm/`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "name": "string", "phone": "string", "email": "string", "source": "string", "projectTag": "string", ... }
```
- **Response:**
```json
{ "success": true, "data": { ...lead fields... } }
```

### Get Leads
- **GET** `/api/crm/`
- **Auth:** Bearer JWT
- **Query Params:** `stage`, `projectTag`, `source`, `assignedTo`, `startDate`, `endDate`, `search`, `page`, `limit`
- **Response:**
```json
{ "success": true, "count": 1, "total": 1, "totalPages": 1, "currentPage": 1, "data": [ ...leads... ] }
```

### Update Lead Stage
- **PATCH** `/api/crm/:leadId/stage`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "stage": "new" | "contacted" | "visited" | "quoted" | "closed" }
```
- **Response:**
```json
{ "success": true, "data": { ...lead fields... } }
```

### Add Note to Lead
- **POST** `/api/crm/:leadId/notes`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "content": "string" }
```
- **Response:**
```json
{ "success": true, "data": { ...note fields... } }
```

### Update Lead
- **PUT** `/api/crm/:leadId`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ ...lead fields to update... }
```
- **Response:**
```json
{ "success": true, "data": { ...lead fields... } }
```

### Delete Lead
- **DELETE** `/api/crm/:leadId`
- **Auth:** Bearer JWT (admin)
- **Response:**
```json
{ "success": true, "message": "Lead deleted" }
```

### Get Leads Kanban View
- **GET** `/api/crm/kanban`
- **Auth:** Bearer JWT
- **Query Params:** `source`, `tag`, `assignedTo`
- **Response:**
```json
{
  "success": true,
  "data": {
    "new": [...leads],
    "contacted": [...leads],
    "qualified": [...leads],
    "proposal": [...leads],
    "negotiation": [...leads],
    "closed": [...leads]
  }
}
```

**Test with curl:**
```bash
curl -X GET "http://localhost:3000/api/crm/kanban?source=website" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Leads List View
- **GET** `/api/crm/list`
- **Auth:** Bearer JWT
- **Query Params:** `source`, `stage`, `assignedTo`, `dateFrom`, `dateTo`, `search`, `page`, `limit`, `sortBy`, `sortOrder`
- **Response:**
```json
{
  "success": true,
  "data": {
    "leads": [...leads],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "total": 50,
      "limit": 10
    }
  }
}
```

**Test with curl:**
```bash
curl -X GET "http://localhost:3000/api/crm/list?page=1&limit=10&stage=qualified" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Lead Detail
- **GET** `/api/crm/:leadId/detail`
- **Auth:** Bearer JWT
- **Response:**
```json
{
  "success": true,
  "data": {
    "lead": { ...lead details },
    "estimates": [...estimates],
    "proposals": [...proposals],
    "moodboards": [...moodboards],
    "timeline": [...interactions]
  }
}
```

**Test with curl:**
```bash
curl -X GET http://localhost:3000/api/crm/LEAD_ID/detail \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Add Interaction
- **POST** `/api/crm/:leadId/interactions`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{
  "type": "phone_call",
  "content": "Discussed project requirements",
  "scheduledFor": "2024-01-15T10:00:00Z"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Interaction added successfully",
  "data": { ...lead }
}
```

### Bulk Assign Leads
- **POST** `/api/crm/bulk-assign`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{
  "leadIds": ["lead_id_1", "lead_id_2"],
  "assignedTo": "user_id"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "2 leads assigned successfully",
  "data": { "modifiedCount": 2 }
}
```

### Bulk Move Stage
- **POST** `/api/crm/bulk-move-stage`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{
  "leadIds": ["lead_id_1", "lead_id_2"],
  "stage": "qualified"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "2 leads moved to qualified stage",
  "data": { "modifiedCount": 2 }
}
```

### Bulk Tag Leads
- **POST** `/api/crm/bulk-tag`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{
  "leadIds": ["lead_id_1", "lead_id_2"],
  "tags": ["high-priority", "follow-up"],
  "action": "add"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "2 leads tagged successfully",
  "data": { "modifiedCount": 2 }
}
```

### Bulk WhatsApp Follow-up
- **POST** `/api/crm/bulk-whatsapp`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{
  "leadIds": ["lead_id_1", "lead_id_2"],
  "message": "Hi! Just following up on your project inquiry."
}
```
- **Response:**
```json
{
  "success": true,
  "message": "WhatsApp follow-up scheduled for 2 leads",
  "data": { 
    "leadsCount": 2,
    "message": "WhatsApp integration pending"
  }
}
```

### Export Leads
- **GET** `/api/crm/export`
- **Auth:** Bearer JWT
- **Query Params:** `source`, `stage`, `dateFrom`, `dateTo`
- **Response:** CSV file download

**Test with curl:**
```bash
curl -X GET "http://localhost:3000/api/crm/export?stage=qualified" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o leads-export.csv
```

### Import Leads
- **POST** `/api/crm/import`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{
  "leads": [
    {
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com",
      "source": "website",
      "projectTag": "2BHK Apartment"
    }
  ]
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Import completed. 1 leads imported successfully.",
  "data": {
    "imported": 1,
    "errors": 0,
    "errorDetails": []
  }
}
```

### Get Lead Statistics
- **GET** `/api/crm/stats`
- **Auth:** Bearer JWT
- **Query Params:** `period` (week|month|year)
- **Response:**
```json
{
  "success": true,
  "data": {
    "stageStats": [
      { "_id": "new", "count": 5 },
      { "_id": "qualified", "count": 3 }
    ],
    "sourceStats": [
      { "_id": "website", "count": 8 },
      { "_id": "referral", "count": 2 }
    ],
    "conversionRate": 25.5,
    "totalLeads": 10,
    "convertedLeads": 2,
    "period": "month"
  }
}
```

**Test with curl:**
```bash
curl -X GET "http://localhost:3000/api/crm/stats?period=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Client APIs

### Create Client
- **POST** `/api/clients/`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ "name": "string", "email": "string", ... }
```
- **Response:**
```json
{ "success": true, "data": { ...client fields... } }
```

### Get Clients
- **GET** `/api/clients/`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": [ ...clients... ] }
```

### Get Client by ID
- **GET** `/api/clients/:id`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": { ...client fields... } }
```

### Update Client
- **PUT** `/api/clients/:id`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ ...client fields to update... }
```
- **Response:**
```json
{ "success": true, "data": { ...client fields... } }
```

### Delete Client
- **DELETE** `/api/clients/:id`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "message": "Client deleted" }
```

### Add Note to Client
- **POST** `/api/clients/:id/notes`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ "content": "string" }
```
- **Response:**
```json
{ "success": true, "data": { ...note fields... } }
```

---

## Project APIs

### Create Project
- **POST** `/api/projects/`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "name": "string", "client": "string", "lead": "string", ... }
```
- **Response:**
```json
{ "success": true, "data": { ...project fields... } }
```

### Get Project
- **GET** `/api/projects/:id`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": { ...project fields... } }
```

### Add Zone
- **POST** `/api/projects/:id/zones`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "name": "string", ... }
```
- **Response:**
```json
{ "success": true, "data": { ...zone fields... } }
```

### Add Task
- **POST** `/api/projects/:id/tasks`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "title": "string", ... }
```
- **Response:**
```json
{ "success": true, "data": { ...task fields... } }
```

### Update Task Status
- **PUT** `/api/projects/:id/tasks/status`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "taskId": "string", "status": "string" }
```
- **Response:**
```json
{ "success": true, "data": { ...task fields... } }
```

### Add Log
- **POST** `/api/projects/:id/logs`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "notes": "string", ... }
```
- **Response:**
```json
{ "success": true, "data": { ...log fields... } }
```

### Generate Weekly Report
- **GET** `/api/projects/:id/weekly-report`
- **Auth:** Bearer JWT (admin/sales)
- **Response:**
```json
{ "success": true, "data": { "message": "Weekly report generated successfully", "pdfUrl": "..." } }
```

### Get Recent Updates
- **GET** `/api/projects/:id/recent-updates`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": [ ...updates... ] }
```

---

## Moodboard APIs

### Create Moodboard
- **POST** `/api/moodboards/`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ "client": "string", "name": "string", ... }
```
- **Response:**
```json
{ "success": true, "data": { ...moodboard fields... } }
```

### Upload Image
- **POST** `/api/moodboards/upload`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ "moodboardId": "string", "sectionName": "string", "imageUrl": "string", "caption": "string" }
```
- **Response:**
```json
{ "success": true, "data": { ...moodboard fields... } }
```

### Add Note
- **POST** `/api/moodboards/note`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ "moodboardId": "string", "sectionName": "string", "content": "string" }
```
- **Response:**
```json
{ "success": true, "data": { ...moodboard fields... } }
```

### Get Preloaded Packs
- **GET** `/api/moodboards/preloaded`
- **Response:**
```json
{ "success": true, "data": [ ...packs... ] }
```

### Generate AI Suggestion
- **POST** `/api/moodboards/ai-suggestion`
- **Auth:** Bearer JWT
- **Request Body:**
```json
{ ...project details... }
```
- **Response:**
```json
{ "success": true, "data": { ...ai suggestion... } }
```

### Export to PDF
- **GET** `/api/moodboards/:moodboardId/export`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": { "pdfUrl": "..." } }
```

### Generate Sharable Link
- **GET** `/api/moodboards/:moodboardId/share`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": { "sharedLink": "..." } }
```

---

## Estimate APIs

### Create Estimate
- **POST** `/api/estimates/leads/:leadId`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ ...estimate fields... }
```
- **Response:**
```json
{ "success": true, "data": { ...estimate fields... } }
```

### Get Estimates for Lead
- **GET** `/api/estimates/leads/:leadId`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "count": 1, "data": [ ...estimates... ] }
```

### Get Single Estimate
- **GET** `/api/estimates/:estimateId`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": { ...estimate fields... } }
```

### Update Estimate
- **PUT** `/api/estimates/:estimateId`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ ...estimate fields to update... }
```
- **Response:**
```json
{ "success": true, "data": { ...estimate fields... } }
```

### Save as Template
- **POST** `/api/estimates/:estimateId/template`
- **Auth:** Bearer JWT (admin/sales)
- **Request Body:**
```json
{ "templateName": "string" }
```
- **Response:**
```json
{ "success": true, "data": { ...template fields... } }
```

### Generate PDF
- **GET** `/api/estimates/:estimateId/pdf`
- **Auth:** Bearer JWT
- **Response:**
```json
{ "success": true, "data": { "pdfUrl": "..." } }
```

--- 