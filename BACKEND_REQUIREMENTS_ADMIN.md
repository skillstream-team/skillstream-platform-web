# Backend API Requirements - Admin Platform

This document specifies the exact backend API endpoints needed for the admin platform.

---

## 🔴 CRITICAL - Must Implement Before Production

### 1. Bulk Operations

#### Bulk Update Users
```
POST /api/admin/users/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "userIds": ["user_id_1", "user_id_2", ...],
  "role": "STUDENT" | "TEACHER" | "ADMIN" (optional),
  "isActive": true | false (optional),
  "isVerified": true | false (optional)
}

Response:
{
  "success": true,
  "message": "Bulk update completed",
  "updated": 10,
  "failed": 0,
  "errors": []
}
```

#### Bulk Update Courses
```
POST /api/admin/courses/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "courseIds": ["course_id_1", "course_id_2", ...],
  "status": "APPROVED" | "REJECTED" | "PENDING",
  "rejectionReason": "string" (optional, required if status is REJECTED)
}

Response:
{
  "success": true,
  "message": "Bulk moderation completed",
  "updated": 5,
  "failed": 0,
  "errors": []
}
```

---

## 🟡 MEDIUM PRIORITY - Important Features

### 2. Email Templates Management

#### Get All Email Templates
```
GET /api/admin/email-templates
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "templates": [
    {
      "id": "string",
      "name": "string",
      "subject": "string",
      "body": "string",
      "variables": ["{{userName}}", "{{courseName}}", ...],
      "type": "WELCOME" | "COURSE_ENROLLMENT" | "PAYMENT_RECEIPT" | ...,
      "isActive": true,
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

#### Get Single Email Template
```
GET /api/admin/email-templates/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "subject": "string",
    "body": "string",
    "variables": ["string"],
    "type": "string",
    "isActive": true,
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

#### Update Email Template
```
PUT /api/admin/email-templates/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "name": "string",
  "subject": "string",
  "body": "string",
  "isActive": true
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Test Email Template
```
POST /api/admin/email-templates/:id/test
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "testEmail": "admin@example.com",
  "variables": {
    "userName": "Test User",
    "courseName": "Test Course"
  }
}

Response:
{
  "success": true,
  "message": "Test email sent successfully"
}
```

---

### 3. Quizzes Management

#### Get All Quizzes (Admin View)
```
GET /api/admin/quizzes?page=1&limit=20&search=&courseId=&status=
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "quizzes": [
    {
      "id": "string",
      "title": "string",
      "courseId": "string",
      "courseName": "string",
      "lessonId": "string",
      "lessonName": "string",
      "questions": 10,
      "totalAttempts": 50,
      "averageScore": 75.5,
      "isActive": true,
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Get Single Quiz
```
GET /api/admin/quizzes/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "courseId": "string",
    "lessonId": "string",
    "questions": [...],
    "settings": {...},
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

#### Update Quiz
```
PUT /api/admin/quizzes/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "title": "string",
  "description": "string",
  "isActive": true,
  "settings": {...}
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Delete Quiz
```
DELETE /api/admin/quizzes/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Quiz deleted successfully"
}
```

---

### 4. Forums Management

#### Get All Forum Posts (Admin View)
```
GET /api/admin/forums?page=1&limit=20&search=&status=&courseId=
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "posts": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "author": {
        "id": "string",
        "name": "string",
        "email": "string"
      },
      "courseId": "string",
      "courseName": "string",
      "replies": 5,
      "views": 100,
      "isPinned": false,
      "isLocked": false,
      "status": "ACTIVE" | "HIDDEN" | "DELETED",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {...}
}
```

#### Get Single Forum Post
```
GET /api/admin/forums/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "content": "string",
    "author": {...},
    "replies": [...],
    "createdAt": "ISO8601"
  }
}
```

#### Moderate Forum Post
```
PUT /api/admin/forums/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "status": "ACTIVE" | "HIDDEN" | "DELETED",
  "isPinned": true | false,
  "isLocked": true | false,
  "moderationReason": "string" (optional)
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Delete Forum Post
```
DELETE /api/admin/forums/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Forum post deleted successfully"
}
```

---

### 5. QA Management

#### Get All Q&A (Admin View)
```
GET /api/admin/qa?page=1&limit=20&search=&status=&courseId=
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "questions": [
    {
      "id": "string",
      "question": "string",
      "student": {
        "id": "string",
        "name": "string"
      },
      "courseId": "string",
      "courseName": "string",
      "lessonId": "string",
      "answers": 3,
      "isResolved": false,
      "status": "ACTIVE" | "HIDDEN" | "DELETED",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {...}
}
```

#### Get Single Q&A
```
GET /api/admin/qa/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "id": "string",
    "question": "string",
    "student": {...},
    "answers": [...],
    "createdAt": "ISO8601"
  }
}
```

#### Moderate Q&A
```
PUT /api/admin/qa/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "status": "ACTIVE" | "HIDDEN" | "DELETED",
  "moderationReason": "string" (optional)
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Delete Q&A
```
DELETE /api/admin/qa/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Q&A deleted successfully"
}
```

---

### 6. Referrals Management

#### Get Referral Program Settings
```
GET /api/admin/referrals
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "isEnabled": true,
    "referrerReward": {
      "type": "PERCENTAGE" | "FIXED",
      "value": 10
    },
    "refereeReward": {
      "type": "PERCENTAGE" | "FIXED",
      "value": 5
    },
    "minPayout": 50,
    "terms": "string"
  }
}
```

#### Update Referral Settings
```
PUT /api/admin/referrals
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "isEnabled": true,
  "referrerReward": {
    "type": "PERCENTAGE" | "FIXED",
    "value": 10
  },
  "refereeReward": {
    "type": "PERCENTAGE" | "FIXED",
    "value": 5
  },
  "minPayout": 50,
  "terms": "string"
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Get Referral Statistics
```
GET /api/admin/referrals/stats?startDate=&endDate=
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "totalReferrals": 100,
    "activeReferrers": 50,
    "totalRewardsPaid": 5000,
    "pendingRewards": 1000,
    "topReferrers": [
      {
        "userId": "string",
        "name": "string",
        "referrals": 20,
        "earnings": 500
      }
    ]
  }
}
```

---

### 7. Bundles Management

#### Get All Bundles
```
GET /api/admin/bundles?page=1&limit=20&search=
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "bundles": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "courses": ["course_id_1", "course_id_2"],
      "price": 99.99,
      "discount": 20,
      "isActive": true,
      "sales": 50,
      "revenue": 4999.50,
      "createdAt": "ISO8601"
    }
  ],
  "pagination": {...}
}
```

#### Get Single Bundle
```
GET /api/admin/bundles/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "courses": [...],
    "price": 99.99,
    "discount": 20,
    "isActive": true,
    "createdAt": "ISO8601"
  }
}
```

#### Create Bundle
```
POST /api/admin/bundles
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "name": "string",
  "description": "string",
  "courseIds": ["course_id_1", "course_id_2"],
  "price": 99.99,
  "discount": 20,
  "isActive": true
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Update Bundle
```
PUT /api/admin/bundles/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "name": "string",
  "description": "string",
  "courseIds": ["string"],
  "price": 99.99,
  "discount": 20,
  "isActive": true
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Delete Bundle
```
DELETE /api/admin/bundles/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Bundle deleted successfully"
}
```

---

### 8. Certificate Templates

#### Get All Certificate Templates
```
GET /api/admin/certificate-templates
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "templates": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "template": "HTML string",
      "variables": ["{{studentName}}", "{{courseName}}", "{{date}}"],
      "isDefault": false,
      "createdAt": "ISO8601"
    }
  ]
}
```

#### Get Single Template
```
GET /api/admin/certificate-templates/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Create Template
```
POST /api/admin/certificate-templates
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "name": "string",
  "description": "string",
  "template": "HTML string",
  "variables": ["string"]
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Update Template
```
PUT /api/admin/certificate-templates/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "name": "string",
  "description": "string",
  "template": "HTML string",
  "variables": ["string"]
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Delete Template
```
DELETE /api/admin/certificate-templates/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Template deleted successfully"
}
```

---

## 🟢 LOW PRIORITY - Nice to Have

### 9. Whiteboards Management

#### Get All Whiteboards
```
GET /api/admin/whiteboards?page=1&limit=20&search=
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "whiteboards": [
    {
      "id": "string",
      "name": "string",
      "owner": {
        "id": "string",
        "name": "string"
      },
      "courseId": "string",
      "lessonId": "string",
      "size": 1024000,
      "createdAt": "ISO8601",
      "lastAccessed": "ISO8601"
    }
  ],
  "pagination": {...}
}
```

#### Delete Whiteboard
```
DELETE /api/admin/whiteboards/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Whiteboard deleted successfully"
}
```

---

### 10. Banners Management

#### Get All Banners
```
GET /api/admin/banners
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "banners": [
    {
      "id": "string",
      "title": "string",
      "image": "URL",
      "link": "URL",
      "position": "TOP" | "SIDEBAR" | "BOTTOM",
      "isActive": true,
      "startDate": "ISO8601",
      "endDate": "ISO8601",
      "targetAudience": "ALL" | "STUDENTS" | "TEACHERS",
      "clicks": 100,
      "impressions": 1000,
      "createdAt": "ISO8601"
    }
  ]
}
```

#### Create Banner
```
POST /api/admin/banners
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Form Data:
- title: string
- image: File
- link: URL
- position: "TOP" | "SIDEBAR" | "BOTTOM"
- isActive: boolean
- startDate: ISO8601
- endDate: ISO8601
- targetAudience: "ALL" | "STUDENTS" | "TEACHERS"

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Update Banner
```
PUT /api/admin/banners/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "title": "string",
  "link": "URL",
  "position": "TOP" | "SIDEBAR" | "BOTTOM",
  "isActive": true,
  "startDate": "ISO8601",
  "endDate": "ISO8601",
  "targetAudience": "ALL" | "STUDENTS" | "TEACHERS"
}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Delete Banner
```
DELETE /api/admin/banners/:id
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "message": "Banner deleted successfully"
}
```

---

## Common Response Patterns

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully" (optional)
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [...] (optional)
}
```

### Pagination Response
```json
{
  "success": true,
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Authentication

All endpoints require:
- **Authorization Header:** `Bearer <admin_token>`
- **Role Check:** User must have `ADMIN` role
- **Response:** `401 Unauthorized` if not authenticated
- **Response:** `403 Forbidden` if not admin

---

## Notes

1. All dates should be in ISO8601 format
2. All prices should be in the smallest currency unit (cents) or as decimals
3. Pagination defaults: `page=1`, `limit=20`
4. Search should be case-insensitive
5. All IDs should be UUIDs or MongoDB ObjectIds
6. Soft deletes preferred over hard deletes where possible
7. Audit logging should track all admin actions

---

**Priority Legend:**
- 🔴 **CRITICAL** - Blocking production
- 🟡 **MEDIUM** - Important features
- 🟢 **LOW** - Nice to have

