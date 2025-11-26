# JobIFY - AI-Powered Job Matching Platform

A full-stack web application that uses AI to match job seekers with suitable job opportunities.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
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

## 📁 Project Structure

```
Job-Matching-Platform/
├── frontend-system/          # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API calls and utilities
│   │   ├── context/          # React context (Auth)
│   │   └── App.jsx           # Main app component
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── backend-system/           # Express backend
│   ├── routes/               # API routes
│   ├── models/               # Mongoose schemas
│   ├── middleware/           # Auth and other middleware
│   ├── utils/                # Email, upload, etc.
│   ├── server.js             # Express server
│   ├── package.json
│   ├── vercel.json           # Vercel configuration
│   └── .env.example
│
├── DEPLOYMENT.md             # Deployment guide
├── DEPLOYMENT_CHECKLIST.md   # Pre-deployment checklist
└── README.md                 # This file
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Step 1: Clone the repository

```bash
git clone https://github.com/ai-ngabo/Job-Matching-Platform.git
cd Job-Matching-Platform
```

### Step 2: Setup Backend

```bash
cd backend-system

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - MongoDB URI
# - JWT secret
# - SMTP settings
# - Cloudinary credentials
# - Google OAuth ID

# Install dependencies
npm install

# Start development server
npm run dev
```

Backend will run on `http://localhost:5000`

### Step 3: Setup Frontend

```bash
cd ../frontend-system

# Copy environment template
cp .env.example .env.local

# Edit .env.local
# - VITE_API_BASE_URL=http://localhost:5000
# - VITE_GOOGLE_CLIENT_ID=your-client-id

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### Step 4: Access the Application

- Open `http://localhost:5173`
- Register as a job seeker or company
- Start exploring!

---

## 🌐 Deployment

### Vercel Deployment

For complete deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Summary:**

1. **Create accounts:**
   - Vercel (https://vercel.com)
   - MongoDB Atlas (https://mongodb.com/cloud/atlas)
   - Cloudinary (https://cloudinary.com)
   - Google Cloud (for OAuth)

2. **Deploy Backend:**
   ```bash
   cd backend-system
   npm i -g vercel
   vercel --prod
   ```
   Set environment variables in Vercel Dashboard

3. **Deploy Frontend:**
   ```bash
   cd frontend-system
   vercel --prod
   ```
   Set environment variables with backend URL

4. **Test:**
   - Verify health check: `https://your-backend.vercel.app/api/health`
   - Test application at frontend URL

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Body: {
  userType: "jobseeker" | "company",
  email: string,
  password: string,
  firstName: string,      // for jobseeker
  lastName: string,       // for jobseeker
  companyName: string,    // for company
  ...
}
Response: { token: string, user: {...} }
```

#### Login
```
POST /api/auth/login
Body: { email: string, password: string }
Response: { token: string, user: {...} }
```

#### Google Login
```
POST /api/auth/google-login
Body: { token: string }
Response: { token: string, user: {...} }
```

### Job Endpoints

#### Get All Jobs
```
GET /api/jobs?limit=50&sortBy=createdAt
Response: { jobs: [...], total: number }
```

#### Post a Job (Company)
```
POST /api/jobs
Headers: { Authorization: "Bearer {token}" }
Body: { title, description, requiredSkills, experienceLevel, educationLevel, ... }
Response: { job: {...} }
```

### Application Endpoints

#### Apply for Job
```
POST /api/applications/job/:jobId
Headers: { Authorization: "Bearer {token}" }
Body: { coverLetter: string }
Response: { application: {...} }
```

#### Get Applications (Company)
```
GET /api/applications/company/received
Headers: { Authorization: "Bearer {token}" }
Response: { applications: [...] }
```

#### Update Application Status
```
PUT /api/applications/:id/status
Headers: { Authorization: "Bearer {token}" }
Body: { status: string, note: string }
Response: { application: {...} }
(Sends email to applicant)
```

### AI Endpoints

#### Get Qualification Score
```
GET /api/ai/qualification-score/:applicationId
Headers: { Authorization: "Bearer {token}" }
Response: {
  qualificationScore: number,
  scoreLevel: "Excellent" | "Good" | "Fair" | "Low"
}
```

#### Get Top Candidates
```
GET /api/ai/shortlist/:jobId?limit=5
Headers: { Authorization: "Bearer {token}" }
Response: { topCandidates: [...] }
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

## 🤖 AI Screening Algorithm

The platform uses a weighted scoring system:

```
Total Score = (Skills Match × 0.4) + (Experience × 0.35) + (Education × 0.15) + (CV Presence × 0.1)

Score Levels:
- 80-100: Excellent
- 60-79: Good
- 40-59: Fair
- 0-39: Low
```

---

## 🐛 Troubleshooting

### Common Issues

**Q: "Cannot connect to backend"**
- Check VITE_API_BASE_URL is set correctly
- Verify backend is running
- Check browser console for errors

**Q: "Email not sending"**
- Verify SMTP credentials
- Check ADMIN_ALERT_EMAIL is valid
- For Gmail: Use App-specific password

**Q: "Images not uploading"**
- Verify Cloudinary API key
- Check CORS settings

**Q: "Google Sign-up not working"**
- Verify VITE_GOOGLE_CLIENT_ID
- Check redirect URIs in Google Cloud Console
- Clear browser cache

---

## 📞 Support

For issues and questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
2. Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) before deploying
3. Review logs on Vercel Dashboard
4. Check error messages in browser console

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Team

- **Architecture & Development**: AI-powered full-stack implementation
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

**Happy job hunting with JobIFY! 🚀**