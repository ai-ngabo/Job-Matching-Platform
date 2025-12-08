# JobIFY - AI-Powered Job Matching Platform

A full-stack web application that uses AI to match job seekers with suitable job opportunities.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## ✨ Features

### For Job Seekers
- ✅ Create and manage profiles with skills and experience
- ✅ Browse job listings with AI-powered recommendations
- ✅ Apply for jobs with AI qualification screening
- ✅ Track application status with real-time updates
- ✅ Receive email notifications on status changes
- ✅ Upload and manage CV documents
- ✅ Save favorite jobs
- ✅ Google Sign-up support

### For Companies
- ✅ Post and manage job listings
- ✅ Review applications with AI quality scoring
- ✅ Shortlist top candidates automatically
- ✅ Schedule interviews
- ✅ Send status updates to candidates
- ✅ Verify company profile

### AI Features
- 🤖 **AI CV Screening**: Automatically scores applications based on:
  - Skills matching (40%)
  - Experience validation (35%)
  - Education compatibility (15%)
  - CV document presence (10%)
- 🤖 **Automatic Scoring**: 0-100% qualification score
- 🤖 **Smart Recommendations**: Job listings matched to seeker profiles

### Admin Features
- 📊 Dashboard with application statistics
- ✅ Approve/reject company registrations
- 📈 Monitor platform activity

---

## 🛠 Technology Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **CSS3** - Styling with responsive design

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Cloudinary** - Image storage
- **Helmet** - Security headers

### Infrastructure
- **Vercel** - Hosting (Frontend + Backend)
- **MongoDB Atlas** - Cloud database
- **Cloudinary** - Cloud storage
- **SMTP** - Email delivery

---

---

## ⚡ Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
- **npm** - Comes with Node.js
- **Git** - Download from [git-scm.com](https://git-scm.com)
- **A code editor** - VS Code recommended from [code.visualstudio.com](https://code.visualstudio.com)

### Verify Installation

```bash
node --version  # Should be v18+
npm --version   # Should be 8+
git --version
```

---

## 🚀 Quick Start (5 minutes)

If you want to get the project running quickly with sample data:

```bash
# 1. Clone and navigate
git clone https://github.com/ai-ngabo/Job-Matching-Platform.git
cd Job-Matching-Platform

# 2. Setup backend (uses provided .env)
cd backend-system
npm install
npm run dev

# 3. In a new terminal, setup frontend
cd frontend-system
npm install
npm run dev

# 4. Open browser
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000/api
```

**Note:** Quick start uses demo credentials provided in `.env.example`. For production, follow the complete setup below.

---

## 📁 Project Structure

```
Job-Matching-Platform/
├── frontend-system/          # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── admin/        # Admin dashboard components
│   │   │   ├── auth/         # Login/Register components
│   │   │   ├── jobs/         # Job listing components
│   │   │   ├── profile/      # Profile components
│   │   │   └── shared/       # Shared components (Navigation, Chatbot)
│   │   ├── pages/            # Page components
│   │   │   ├── auth/         # Auth pages (Login, Register, etc)
│   │   │   ├── dashboard/    # Dashboard pages (Admin, Company, JobSeeker)
│   │   │   ├── jobs/         # Job pages
│   │   │   ├── profile/      # Profile pages
│   │   │   └── applications/ # Application pages
│   │   ├── services/         # API calls and utilities
│   │   │   ├── api.js        # Axios configuration
│   │   │   ├── authService.js# Auth API calls
│   │   │   ├── chatbotService.js
│   │   │   └── aiService.js
│   │   ├── context/          # React context (Auth)
│   │   ├── config/           # Configuration
│   │   ├── utils/            # Utilities
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── public/               # Static files
│   ├── package.json
│   ├── vite.config.js
│   ├── .env                  # Environment variables (for local dev)
│   └── .env.production       # Production environment
│
├── backend-system/           # Express backend
│   ├── routes/               # API routes
│   │   ├── admin.js          # Admin endpoints
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── applications.js   # Application endpoints
│   │   ├── jobs.js           # Job endpoints
│   │   ├── users.js          # User endpoints
│   │   ├── ai.js             # AI endpoints
│   │   ├── chatbot.js        # Chatbot endpoints
│   │   ├── upload.js         # File upload endpoints
│   │   └── test-email.js     # Email testing
│   ├── models/               # MongoDB schemas
│   │   ├── User.js
│   │   ├── Job.js
│   │   └── Application.js
│   ├── middleware/           # Auth and other middleware
│   │   ├── auth.js           # JWT verification
│   │   └── adminAuth.js      # Admin authorization
│   ├── utils/                # Utility functions
│   │   ├── emailService.js   # Email sending
│   │   ├── cloudinary.js     # Image upload
│   │   └── deepseekService.js# AI service
│   ├── scripts/              # Scripts
│   │   └── createAdmin.js    # Create admin user
│   ├── server.js             # Express server entry
│   ├── package.json
│   ├── vercel.json           # Vercel configuration
│   └── .env.example          # Example environment variables
│
└── README.md                 # This file
```

---

## 🎯 Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/ai-ngabo/Job-Matching-Platform.git

# Navigate to project directory
cd Job-Matching-Platform
```

### Step 2: Setup Backend Server

#### 2a. Navigate to backend directory

```bash
cd backend-system
```

#### 2b. Install dependencies

```bash
npm install
```

This will install all required packages:
- Express.js - Web framework
- Mongoose - MongoDB driver
- JWT - Authentication
- Bcryptjs - Password hashing
- Nodemailer - Email service
- Cloudinary - File uploads
- And more (see `package.json`)

#### 2c. Configure environment variables

Create a `.env` file in `backend-system/` directory:

```bash
# On Windows (PowerShell)
New-Item .env

# On Mac/Linux
touch .env
```

Copy the contents from `.env.example`:

```bash
cp .env.example .env
```

**Edit `.env` with your credentials** (see detailed instructions below in "Environment Variables" section):

```dotenv
# Database - MongoDB Atlas URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=jobify

# JWT - Secret key for token signing
JWT_SECRET=your-super-secure-random-key-here-change-this

# Cloudinary - For image uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Service - Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=JobIFY <your-email@gmail.com>

# Admin Notifications
ADMIN_ALERT_EMAIL=admin@example.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server Configuration
PORT=5000
NODE_ENV=development
PASSWORD_TOKEN_EXPIRY_MIN=30
```

#### 2d. Start the backend server

```bash
npm run dev
```

**Expected output:**
```
Server running on http://localhost:5000
Connected to MongoDB
Ready to accept requests
```

### Step 3: Setup Frontend Application

#### 3a. Open a new terminal and navigate to frontend

```bash
# Keep the backend terminal open
# Open a NEW terminal/PowerShell window

cd frontend-system
```

#### 3b. Install dependencies

```bash
npm install
```

This will install React, Vite, Axios, React Router, and other dependencies.

#### 3c. Configure environment variables

Create a `.env` file in `frontend-system/` directory:

```bash
# On Windows (PowerShell)
New-Item .env

# On Mac/Linux
touch .env
```

Add the following configuration:

```dotenv
# API Configuration - Backend URL
VITE_API_BASE_URL=http://localhost:5000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# React App API URL (for compatibility)
REACT_APP_API_URL=http://localhost:5000
```

#### 3d. Start the frontend development server

```bash
npm run dev
```

**Expected output:**
```
VITE v X.X.X ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Step 4: Access the Application

1. **Open your browser** and navigate to:
   ```
   http://localhost:5173
   ```

2. **You should see** the JobIFY landing page

3. **Create a test account:**
   - Click "Register" or "Sign Up"
   - Choose user type: "Job Seeker" or "Company"
   - Fill in the registration form
   - Create an account

4. **Test different user types:**
   - **Job Seeker**: Browse jobs, apply for positions, view applications
   - **Company**: Post jobs, review applications, manage postings
   - **Admin**: Access admin panel at `/admin` (requires admin account)

### Step 5: Verify Everything Works

**Check backend is running:**
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"Backend is working!"}
```

**Check frontend loads:**
- Open `http://localhost:5173`
- Should see the homepage without errors
- Check browser console (F12) for any errors

**Test authentication:**
1. Register a new account
2. Login with credentials
3. Should redirect to dashboard
4. Check browser DevTools → Application → Cookies for JWT token

---

## 🔧 Environment Variables

### Backend Environment Variables (`.env`)

Create a `.env` file in `backend-system/` with the following variables:

#### Database Configuration

```dotenv
# MongoDB Connection String
# Get from MongoDB Atlas: https://cloud.mongodb.com
# Format: mongodb+srv://username:password@cluster.mongodb.net/?appName=jobify
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?appName=jobify
```

**Steps to get MongoDB URI:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster
3. Create a database user
4. Click "Connect" → "Connect your application"
5. Copy the connection string and replace `<password>` with your database user password

#### Authentication Configuration

```dotenv
# JWT Secret Key - Use a random string, at least 32 characters
# Generate one: https://www.random.org/strings/?num=1&len=32&digits=on&loweralpha=on&mixedcase=on&special=on&uniqueness=on
JWT_SECRET=your-super-secure-random-key-at-least-32-characters

# Google OAuth Client ID
# Get from Google Cloud Console: https://console.cloud.google.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Password Reset Token Expiry (in minutes)
PASSWORD_TOKEN_EXPIRY_MIN=30
```

#### Email Service Configuration (Gmail SMTP)

```dotenv
# Gmail SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# From email address for outgoing emails
SMTP_FROM=JobIFY <your-email@gmail.com>

# Admin email for alerts and notifications
ADMIN_ALERT_EMAIL=admin@example.com
```

**Steps to setup Gmail SMTP:**
1. Go to [Google Account Settings](https://myaccount.google.com)
2. Enable 2-Factor Authentication
3. Go to "App passwords" section
4. Create an app password for "Mail" on "Windows Computer"
5. Copy the 16-character password and use it as `SMTP_PASS`

#### Cloudinary Configuration (Image Uploads)

```dotenv
# Cloudinary API Credentials
# Get from Cloudinary Dashboard: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Steps to setup Cloudinary:**
1. Create account at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard → Settings → API Keys
3. Copy the Cloud Name, API Key, and API Secret

#### Frontend & Server Configuration

```dotenv
# Frontend URL (for email links and redirects)
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=5000

# Environment Type
NODE_ENV=development
```

### Frontend Environment Variables (`.env`)

Create a `.env` file in `frontend-system/` with the following:

```dotenv
# Backend API URL - Must match backend PORT
VITE_API_BASE_URL=http://localhost:5000

# Google OAuth Client ID (same as backend)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# React App API URL (for compatibility)
REACT_APP_API_URL=http://localhost:5000
```

### Environment Variables for Production

When deploying to Vercel/Render, add the same variables in the platform's dashboard:

**For Backend (Render/Vercel):**
- Set all backend `.env` variables in the deployment platform's Environment Variables section
- Ensure `FRONTEND_URL` points to your production frontend URL
- Use production MongoDB URI

**For Frontend (Vercel):**
- Set `VITE_API_BASE_URL` to production backend URL
- Set `VITE_GOOGLE_CLIENT_ID` (same for dev/prod)

---

## 🌐 Deployment



### Vercel Deployment

For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Summary:**

1. **Create accounts:**
   - [Vercel](https://vercel.com) - for hosting
   - [MongoDB Atlas](https://mongodb.com/cloud/atlas) - for database
   - [Cloudinary](https://cloudinary.com) - for image storage
   - [Google Cloud](https://console.cloud.google.com) - for OAuth

2. **Deploy Backend:**
   ```bash
   cd backend-system
   npm i -g vercel
   vercel --prod
   ```
   During deployment:
   - Connect your GitHub account
   - Select the repository
   - Set environment variables in Vercel dashboard (all from `.env`)
   - Deployment completes automatically

3. **Deploy Frontend:**
   ```bash
   cd ../frontend-system
   vercel --prod
   ```
   During deployment:
   - Set environment variables:
     - `VITE_API_BASE_URL`: Your deployed backend URL
     - `VITE_GOOGLE_CLIENT_ID`: Same as backend
   - Deployment completes automatically

4. **Verify Deployment:**
   ```bash
   # Check backend health
   curl https://your-backend.vercel.app/api/health
   
   # Should return:
   # {"status":"Backend is working!"}
   ```

5. **Test Application:**
   - Open frontend URL in browser
   - Register a test account
   - Test all features (jobs, applications, etc)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed step-by-step instructions including:
- Environment variable setup
- Troubleshooting deployment issues
- Production configuration
- Monitoring and logs



---

## 📚 API Documentation

**Base URL:** `http://localhost:5000/api` (development) or `https://your-backend.com/api` (production)

**Authentication:** All protected endpoints require JWT token in header:
```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "userType": "jobseeker",  // or "company"
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",        // for jobseeker
  "lastName": "Doe",          // for jobseeker
  "companyName": "Tech Corp"  // for company
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "123456",
    "email": "user@example.com",
    "userType": "jobseeker"
  }
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "_id": "123456", "email": "user@example.com" }
}
```

#### 3. Google OAuth Login
```http
POST /api/auth/google-login
Content-Type: application/json

{
  "token": "google_id_token_from_frontend"
}
```

**Response (200 OK):**
```json
{
  "token": "our_jwt_token",
  "user": { "_id": "123456", "email": "user@gmail.com" }
}
```

### Job Endpoints

#### 1. Get All Jobs
```http
GET /api/jobs?limit=50&page=1&sortBy=createdAt
```

**Response (200 OK):**
```json
{
  "jobs": [
    {
      "_id": "job123",
      "title": "Software Engineer",
      "companyName": "Tech Corp",
      "location": "Remote",
      "salary": "$80,000 - $120,000"
    }
  ],
  "total": 150
}
```

#### 2. Get Single Job
```http
GET /api/jobs/:jobId
```

**Response (200 OK):**
```json
{
  "job": {
    "_id": "job123",
    "title": "Software Engineer",
    "description": "We are looking for...",
    "requiredSkills": ["JavaScript", "React"],
    "experienceLevel": "mid-level",
    "educationLevel": "Bachelor's"
  }
}
```

#### 3. Post a Job (Company Only)
```http
POST /api/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Developer",
  "description": "Job description...",
  "requiredSkills": ["JavaScript", "React", "Node.js"],
  "experienceLevel": "senior",
  "educationLevel": "Bachelor's",
  "location": "Remote",
  "jobType": "Full-time",
  "salary": "$100,000 - $150,000"
}
```

**Response (201 Created):**
```json
{
  "job": {
    "_id": "newJobId",
    "title": "Senior Developer",
    "status": "active"
  }
}
```

### Application Endpoints

#### 1. Apply for Job
```http
POST /api/applications/job/:jobId
Authorization: Bearer <token>
Content-Type: application/json

{
  "coverLetter": "I am interested in this position..."
}
```

**Response (201 Created):**
```json
{
  "application": {
    "_id": "app123",
    "jobId": "job123",
    "status": "submitted",
    "appliedAt": "2025-11-28T10:00:00Z"
  }
}
```

#### 2. Get My Applications (Job Seeker)
```http
GET /api/applications/my-applications
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "applications": [
    {
      "_id": "app123",
      "jobTitle": "Software Engineer",
      "companyName": "Tech Corp",
      "status": "reviewing",
      "appliedAt": "2025-11-28T10:00:00Z"
    }
  ]
}
```

#### 3. Get Applications for Company
```http
GET /api/applications/company/received
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "applications": [
    {
      "_id": "app123",
      "applicantName": "John Doe",
      "jobTitle": "Software Engineer",
      "status": "submitted",
      "appliedAt": "2025-11-28T10:00:00Z",
      "qualificationScore": 85
    }
  ]
}
```

#### 4. Update Application Status
```http
PUT /api/applications/:applicationId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shortlisted",
  "note": "Proceeding to interview round"
}
```

**Response (200 OK):**
```json
{
  "application": {
    "_id": "app123",
    "status": "shortlisted"
  }
}
```

### Dashboard Statistics Endpoints

#### 1. Job Seeker Stats
```http
GET /api/applications/stats
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "stats": {
    "totalApplications": 12,
    "profileViews": 45,
    "statusCounts": {
      "submitted": 5,
      "reviewing": 3,
      "accepted": 2,
      "rejected": 1
    }
  }
}
```

#### 2. Company Stats
```http
GET /api/jobs/company/my-jobs
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "jobs": [
    {
      "_id": "job123",
      "title": "Software Engineer",
      "views": 150,
      "applicationCount": 25,
      "status": "active"
    }
  ]
}
```

### Admin Endpoints (Admin Only)

#### 1. Admin Dashboard Stats
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "stats": {
    "totalUsers": 1500,
    "totalCompanies": 250,
    "totalJobs": 3000,
    "totalApplications": 15000
  }
}
```

#### 2. Get All Users
```http
GET /api/admin/users?limit=50
Authorization: Bearer <admin_token>
```

#### 3. Approve/Reject Company
```http
PUT /api/admin/companies/:companyId/approve
Authorization: Bearer <admin_token>
```

### Health Check

#### Check Backend Status
```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "Backend is working!"
}
```

---

## 📝 Running Test Requests

Use tools like Postman or curl to test APIs:

**Example with curl:**
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "jobseeker",
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Get Jobs (with token)
curl -X GET http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ Password hashing with bcryptjs
- ✅ CORS protection
- ✅ Helmet.js for security headers
- ✅ Input validation with express-validator
- ✅ Environment variables for secrets
- ✅ Secure password reset via email tokens
- ✅ Role-based access control (RBAC)

---

## 📧 Email Notifications

Users receive emails for:
- User registration confirmation
- Password reset requests
- Application status changes (submitted, reviewing, shortlisted, interview, accepted, rejected)
- Admin alerts for new registrations

---

## 🐛 Troubleshooting

### Development Issues

#### "Cannot GET /" or Page Not Loading

**Problem:** Frontend shows blank page or 404 error

**Solutions:**
1. Check if both servers are running:
   ```bash
   # Backend running?
   curl http://localhost:5000/api/health
   
   # Frontend running?
   curl http://localhost:5173
   ```

2. Check terminal output for errors
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try hard refresh (Ctrl+Shift+R)
5. Check browser DevTools console (F12) for errors

#### "Cannot connect to backend" Error

**Problem:** Frontend shows error connecting to API

**Solutions:**
1. Verify `VITE_API_BASE_URL` in `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:5000
   ```

2. Check backend is running:
   ```bash
   npm run dev  # in backend-system/
   ```

3. Check for CORS issues in browser console
4. Verify backend server output shows "listening on port 5000"

#### "Connection refused" or Backend Won't Start

**Problem:** Backend server won't start or crashes

**Solutions:**
1. Check port 5000 is available:
   ```bash
   # On Windows
   netstat -ano | findstr :5000
   ```

2. Install dependencies:
   ```bash
   npm install
   npm i bcryptjs mongoose dotenv
   ```

3. Check `.env` file exists and has required variables:
   ```bash
   MONGODB_URI=your-database-url
   JWT_SECRET=your-secret
   ```

4. Check MongoDB connection:
   ```bash
   # Test MongoDB URI
   # Go to MongoDB Atlas → Connect → Test Connection
   ```

#### "Email not sending" Errors

**Problem:** Email functionality not working

**Solutions:**
1. Verify Gmail app password (not regular password):
   - Check `SMTP_PASS` is 16 characters
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)

2. Check SMTP settings:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   ```

3. Allow "Less secure apps" (if needed):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "Less secure app access"

4. Test email sending:
   ```bash
   # Navigate to backend-system/
   curl -X POST http://localhost:5000/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your@email.com"}'
   ```

#### "Images not uploading" or Cloudinary Errors

**Problem:** File uploads fail or images don't appear

**Solutions:**
1. Check Cloudinary credentials:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

2. Get correct credentials from:
   - [Cloudinary Dashboard](https://cloudinary.com/console)
   - Settings → API Keys

3. Verify upload endpoint is configured:
   - Check `backend-system/routes/upload.js`
   - Should use Cloudinary storage

#### "Google Sign-up not working"

**Problem:** Google OAuth returns error

**Solutions:**
1. Verify Google Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   ```

2. Check redirect URIs in Google Cloud Console:
   - For local dev: `http://localhost:5173`
   - For production: your frontend URL

3. Steps to fix:
   1. Go to [Google Cloud Console](https://console.cloud.google.com)
   2. Select your project
   3. Go to "Credentials"
   4. Edit OAuth 2.0 Client ID
   5. Add/update Authorized redirect URIs:
      - `http://localhost:5173` (dev)
      - `http://localhost:5173/auth/callback` (dev callback)
      - `https://your-domain.com` (production)
   6. Save changes

4. Clear browser cache and try again

#### "Login not working" or 401 Unauthorized

**Problem:** Cannot login, always redirected to login page

**Solutions:**
1. Check MongoDB connection:
   - Verify `MONGODB_URI` is correct
   - Test connection in MongoDB Atlas

2. Verify bcrypt is installed:
   ```bash
   npm list bcryptjs
   ```

3. Check JWT secret exists:
   ```
   JWT_SECRET=your-secret-key
   ```

4. Clear browser cookies and try again

5. Check browser console for error messages

#### Node Modules Issues

**Problem:** "Cannot find module" errors

**Solutions:**
1. Reinstall dependencies:
   ```bash
   rm -r node_modules
   npm install
   ```

2. Clear npm cache:
   ```bash
   npm cache clean --force
   ```

3. Update npm:
   ```bash
   npm install -g npm@latest
   ```

### Production Issues

#### "Backend returns 502 Bad Gateway"

**Problem:** Deployed backend shows error

**Solutions:**
1. Check Render/Vercel logs:
   - Render: Dashboard → Logs
   - Vercel: Dashboard → Deployments → Logs

2. Common causes:
   - Missing environment variables
   - Database connection failed
   - Syntax error in code

3. Verify all `.env` variables are set in deployment dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLOUDINARY_*`
   - `SMTP_*`
   - `GOOGLE_CLIENT_ID`
   - `FRONTEND_URL` (for production)

4. Check production MongoDB URI format

#### "Frontend shows CORS errors"

**Problem:** Cross-Origin Request Blocked

**Solutions:**
1. Check backend CORS configuration
2. Verify `VITE_API_BASE_URL` points to correct backend
3. Restart frontend after environment changes

#### "Database connection times out"

**Problem:** MongoDB connection fails

**Solutions:**
1. Verify MongoDB URI includes database name
2. Check IP whitelist in MongoDB Atlas:
   - Go to Network Access
   - Allow access from 0.0.0.0/0 (for testing)
   - Or add specific IP addresses

3. Test connection string locally before deploying

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Backend server starts: `npm run dev`
- [ ] Frontend server starts: `npm run dev`
- [ ] Can access http://localhost:5173
- [ ] Can access http://localhost:5000/api/health
- [ ] Can register a new account
- [ ] Can login with credentials
- [ ] Dashboard loads without errors
- [ ] Can browse jobs
- [ ] Can apply for jobs
- [ ] Email notifications work (optional)
- [ ] Images upload to Cloudinary (optional)

---

## 👥 Team

- **Architecture & Development**: full-stack implementation
- **Frontend**: React, Vite, Responsive UI
- **Backend**: Node.js, Express, MongoDB
- **AI**: Qualification scoring and matching algorithm
- **DevOps**: Vercel deployment and monitoring

---

## 🎯 Future Enhancements

- [ ] Video interview integration
- [ ] Advanced analytics dashboard
- [ ] Skill assessment tests
- [ ] Job recommendations via ML
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSocket)
- [ ] Chatbot improvements
- [ ] Multi-language support

---

**Happy job matching with JobIFY! 🚀**
