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