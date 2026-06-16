# Backend API Test Results
**Date**: 2026-06-16 01:20:02
**Server**: http://localhost:8080/api/v1

## Summary
- ✅ Passed: 13
- ❌ Failed: 4
- ⚠️ Warnings: 1

## Results
| Status | Test | Expected | Actual |
|--------|------|----------|--------|
| ❌ | Login - Valid creds | 200 | 400 |
| ✅ | Login - Bad password | 400 | 400 |
| ✅ | Login - Bad email | 400 | 400 |
| ✅ | Login - Empty body | 400 | 400 |
| ✅ | Provider search | 200 | 200 |
| ✅ | Provider search w/cat | 200 | 200 |
| ❌ | Provider nearby | 200 | 403 |
| ✅ | Bookings w/o token | 403 | 403 |
| ✅ | Chat w/o token | 403 | 403 |
| ✅ | Notifications w/o auth | 403 | 403 |
| ✅ | Payments w/o auth | 403 | 403 |
| ✅ | User profile w/o auth | 403 | 403 |
| ✅ | Invalid endpoint | 403 | 403 |
| ✅ | XSS in login email | 400 | 400 |
| ✅ | Post-burst request | 200 | 200 |
| ❌ | Swagger UI | 302 | 403 |
| ❌ | OpenAPI spec | 200 | 403 |
