# Quick Test Checklist - SkillStream

## 🔴 ADMIN Quick Test (15 min)

### Core Functionality
- [ ] Login → `/admin` dashboard loads
- [ ] User Management: View, Create, Edit, Delete user
- [ ] Course Moderation: View, Approve, Reject course
- [ ] Categories: Create, Edit, Delete category
- [ ] Analytics: View dashboard metrics
- [ ] Settings: Update and save settings
- [ ] Logout works

### Critical Paths
1. **User Management Flow**: Login → Users → Create User → Verify → Delete
2. **Course Moderation Flow**: Login → Courses → View → Approve → Verify
3. **Settings Flow**: Login → Settings → Update → Save → Verify

---

## 🟡 TEACHER Quick Test (15 min)

### Core Functionality
- [ ] Login → Dashboard loads
- [ ] Courses: View, Create, Edit course
- [ ] Course Builder: Add lesson, Reorder, Save
- [ ] Students: View enrolled students
- [ ] Earnings: View earnings dashboard
- [ ] Messages: Send/receive message
- [ ] Schedule Lesson: Create lesson session
- [ ] Logout works

### Critical Paths
1. **Course Creation Flow**: Login → Courses → Create → Builder → Add Lesson → Publish
2. **Student Management Flow**: Login → Students → View → Message student
3. **Earnings Flow**: Login → Earnings → View history → Verify calculations

---

## 🟢 STUDENT Quick Test (15 min)

### Core Functionality
- [ ] Register new account
- [ ] Login → Dashboard loads
- [ ] Browse Courses: Search, Filter, View details
- [ ] Enroll in course
- [ ] Course Player: Navigate lessons, Complete lesson
- [ ] My Courses: View progress
- [ ] Messages: Start conversation, Send message
- [ ] Certificates: View earned certificates
- [ ] Logout works

### Critical Paths
1. **Enrollment Flow**: Login → Browse → Select Course → Enroll → Start Learning
2. **Learning Flow**: My Courses → Select Course → Play Lesson → Complete → Next
3. **Messaging Flow**: Messages → New Conversation → Send Message → Verify

---

## 🚨 Critical Bugs to Check

### Authentication
- [ ] Cannot access admin routes as student/teacher
- [ ] Cannot access teacher routes as student
- [ ] Logged out users redirected to login
- [ ] Token expiration handled correctly

### Data Integrity
- [ ] Create operations persist data
- [ ] Edit operations update correctly
- [ ] Delete operations remove data
- [ ] No data leaks between users

### UI/UX
- [ ] Forms validate input
- [ ] Error messages display correctly
- [ ] Loading states show during API calls
- [ ] Success messages appear after actions
- [ ] Navigation works on all pages

### Performance
- [ ] Pages load in < 3 seconds
- [ ] No console errors
- [ ] Images load correctly
- [ ] No memory leaks (check with DevTools)

---

## 🧪 Quick Automated Test Setup

```bash
# 1. Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test

# 2. Run unit tests
npm test

# 3. Run E2E tests
npx playwright test
```

---

## 📝 Test Account Setup

Create these test accounts in your backend:

```
Admin:
- Email: admin@test.com
- Password: password123
- Role: ADMIN

Teacher:
- Email: teacher@test.com
- Password: password123
- Role: TEACHER

Student:
- Email: student@test.com
- Password: password123
- Role: STUDENT
```

---

## 🔍 Browser Testing Priority

1. **Chrome** (Primary) - Test all features
2. **Firefox** - Test critical paths
3. **Safari** - Test critical paths
4. **Mobile** - Test responsive design

---

## ⚡ Quick Smoke Test (5 min)

Run this before every deployment:

- [ ] Admin can login
- [ ] Teacher can login
- [ ] Student can login
- [ ] Admin can view users
- [ ] Teacher can view courses
- [ ] Student can browse courses
- [ ] Messages work for all roles
- [ ] No console errors on dashboard

---

## 🐛 Common Issues to Test

- [ ] **401 Unauthorized**: Check token refresh
- [ ] **404 Not Found**: Check route protection
- [ ] **500 Server Error**: Check error handling
- [ ] **Slow API**: Check loading states
- [ ] **Network Offline**: Check error messages

---

## 📊 Test Coverage Goals

- **Critical Paths**: 100% coverage
- **Admin Features**: 80% coverage
- **Teacher Features**: 80% coverage
- **Student Features**: 80% coverage
- **Shared Components**: 70% coverage

---

## 🎯 Testing Priorities

### P0 (Must Test Before Release)
- Authentication & Authorization
- Course Enrollment
- Payment Processing (if applicable)
- User Management (Admin)
- Course Creation (Teacher)

### P1 (Should Test Before Release)
- Messaging System
- Course Player
- Analytics Dashboards
- Settings Pages

### P2 (Nice to Have)
- Advanced Filters
- Bulk Operations
- Export Features
- Advanced Analytics

