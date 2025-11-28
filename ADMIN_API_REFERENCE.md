# Admin API Reference

## Base URL
```
https://job-matching-platform-zvzw.onrender.com/api
```

## Authentication
All admin endpoints require:
- **Bearer Token** in `Authorization` header
- **Admin user** (userType: 'admin')

Header:
```
Authorization: Bearer <token>
```

## Admin Endpoints

### 1. Get Admin Statistics
- **Endpoint**: `GET /admin/stats`
- **Response**: Dashboard statistics (users, companies, jobs, applications, approval rates)
- **Example**:
```javascript
GET /api/admin/stats
Response: {
  stats: {
    totalUsers: 150,
    totalJobSeekers: 120,
    totalCompanies: 30,
    approvedCompanies: 25,
    pendingCompanies: 3,
    rejectedCompanies: 2,
    totalJobs: 85,
    activeJobs: 75,
    totalApplications: 350,
    approvalRate: 83,
    rejectionRate: 7
  }
}
```

### 2. Get All Users
- **Endpoint**: `GET /admin/users?limit=100&search=<query>`
- **Parameters**:
  - `limit`: Number of users to fetch (default: 100)
  - `search`: Search by email, firstName, or lastName
- **Response**: Array of users with profiles
- **Example**:
```javascript
GET /api/admin/users?limit=100
Response: {
  users: [
    {
      _id: "...",
      email: "user@example.com",
      userType: "jobseeker",
      profile: {...},
      approvalStatus: "approved",
      isActive: true,
      createdAt: "2024-01-15T...",
      updatedAt: "2024-01-15T..."
    }
  ],
  total: 85
}
```

### 3. Get All Companies
- **Endpoint**: `GET /admin/companies?limit=100&status=<status>`
- **Parameters**:
  - `limit`: Number of companies to fetch (default: 100)
  - `status`: Filter by approval status (approved, pending, rejected)
- **Response**: Array of companies with job statistics
- **Example**:
```javascript
GET /api/admin/companies?limit=100
Response: {
  companies: [
    {
      _id: "...",
      email: "company@example.com",
      company: {
        name: "Tech Corp",
        industry: "Technology",
        website: "https://techcorp.com",
        location: "Kigali",
        size: "50-200",
        description: "..."
      },
      approvalStatus: "approved",
      stats: {
        totalJobs: 5
      },
      createdAt: "2024-01-15T...",
      updatedAt: "2024-01-15T..."
    }
  ],
  total: 30
}
```

### 4. Get Company Details
- **Endpoint**: `GET /admin/companies/:id`
- **Parameters**:
  - `id`: Company user ID
- **Response**: Detailed company information including jobs and applications
- **Example**:
```javascript
GET /api/admin/companies/60d5ec49c1234567890abcde
Response: {
  company: {
    _id: "...",
    email: "company@example.com",
    company: {
      name: "Tech Corp",
      industry: "Technology",
      website: "https://techcorp.com",
      location: "Kigali",
      size: "50-200",
      description: "..."
    },
    approvalStatus: "approved",
    stats: {
      totalJobs: 5,
      totalApplications: 45,
      recentJobs: [...]
    },
    createdAt: "2024-01-15T...",
    updatedAt: "2024-01-15T..."
  }
}
```

### 5. Get All Jobs
- **Endpoint**: `GET /admin/jobs?limit=50&status=<status>`
- **Parameters**:
  - `limit`: Number of jobs to fetch (default: 50)
  - `status`: Filter by job status (active, closed, draft)
- **Response**: Array of jobs with application counts
- **Example**:
```javascript
GET /api/admin/jobs?limit=50
Response: {
  jobs: [
    {
      _id: "...",
      title: "Senior Developer",
      company: {...},
      salary: 50000,
      status: "active",
      applicationCount: 12,
      createdAt: "2024-01-15T...",
      updatedAt: "2024-01-15T..."
    }
  ],
  total: 85
}
```

### 6. Get All Applications
- **Endpoint**: `GET /admin/applications?limit=100&status=<status>`
- **Parameters**:
  - `limit`: Number of applications to fetch (default: 100)
  - `status`: Filter by application status (pending, accepted, rejected)
- **Response**: Array of applications with applicant and job details
- **Example**:
```javascript
GET /api/admin/applications?limit=100
Response: {
  applications: [
    {
      _id: "...",
      applicant: {
        _id: "...",
        profile: {firstName: "John", lastName: "Doe"},
        email: "john@example.com"
      },
      job: {
        _id: "...",
        title: "Developer",
        company: "Tech Corp"
      },
      status: "pending",
      createdAt: "2024-01-15T...",
      updatedAt: "2024-01-15T..."
    }
  ],
  total: 350
}
```

### 7. Approve Company
- **Endpoint**: `PUT /admin/companies/:id/approve`
- **Parameters**:
  - `id`: Company user ID
- **Response**: Approval confirmation
- **Example**:
```javascript
PUT /api/admin/companies/60d5ec49c1234567890abcde/approve
Response: {
  message: "Company approved successfully",
  company: {
    _id: "...",
    email: "company@example.com",
    companyName: "Tech Corp",
    approvalStatus: "approved"
  }
}
```

### 8. Reject Company
- **Endpoint**: `PUT /admin/companies/:id/reject`
- **Parameters**:
  - `id`: Company user ID
  - `rejectionReason`: Reason for rejection (in body)
- **Response**: Rejection confirmation
- **Example**:
```javascript
PUT /api/admin/companies/60d5ec49c1234567890abcde/reject
Body: {
  rejectionReason: "Incomplete company information"
}
Response: {
  message: "Company rejected successfully",
  company: {
    _id: "...",
    email: "company@example.com",
    companyName: "Tech Corp",
    approvalStatus: "rejected"
  }
}
```

### 9. Delete User
- **Endpoint**: `DELETE /admin/users/:id`
- **Parameters**:
  - `id`: User ID
- **Response**: Deletion confirmation
- **Important**: Cannot delete self account
- **Example**:
```javascript
DELETE /api/admin/users/60d5ec49c1234567890abcde
Response: {
  message: "User deleted successfully",
  deletedUserId: "60d5ec49c1234567890abcde"
}
```

### 10. Debug Route
- **Endpoint**: `GET /admin/debug`
- **Response**: List of available admin routes
- **Example**:
```javascript
GET /api/admin/debug
Response: {
  message: "Admin routes are working",
  timestamp: "2024-01-15T10:30:00.000Z",
  routes: [
    "/stats",
    "/users",
    "/companies",
    "/companies/:id",
    "/jobs",
    "/applications",
    "/companies/:id/approve",
    "/companies/:id/reject",
    "/users/:id"
  ]
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Admin access required"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Company not found"
}
```

### 500 Server Error
```json
{
  "message": "Error fetching admin statistics",
  "error": "Error details..."
}
```

## Frontend Integration

All requests are made through `/src/services/api.js` with automatic:
- Bearer token injection
- Base URL prefixing (`/api`)
- Error handling and logging

### Usage Example
```javascript
import api from '../services/api';

// Fetch statistics
const { data } = await api.get('/admin/stats');

// Approve company
await api.put(`/admin/companies/${companyId}/approve`);

// Get company details
const { data } = await api.get(`/admin/companies/${companyId}`);
```

## Key Features Implemented

✅ Get dashboard statistics
✅ List all users with search
✅ List all companies with filtering
✅ Get detailed company information
✅ View company jobs and applications count
✅ Approve pending companies
✅ Reject companies with reason
✅ Delete users
✅ List all jobs with application counts
✅ List all applications with applicant details
