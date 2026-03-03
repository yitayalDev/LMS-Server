# LMS UOG - Enterprise Backend Infrastructure (Server)

The robust API engine powering the LMS UOG platform. Built with **Node.js**, **Express**, and **MongoDB**, this server handles complex business logic, secure transactions, and real-time state synchronization.

## ⚙️ Core Modules
- **Authentication & Security**: Passport.js integration with JWT, BCrypt password hashing, and granular RBAC (Role-Based Access Control) middleware.
- **Course Management Engine**: Handles multi-module course structures, file uploads, and algorithmic progress tracking.
- **Messaging Service**: Real-time WebSocket integration via Socket.io for instant communication.
- **Financial Integration**: Secure Stripe API integration for course purchases and automated payout logic.
- **Gamification Engine**: Logic for automated badge awarding and point calculation based on user activity.
- **Audit System**: Comprehensive logging for critical system actions for security compliance.

## 🛠️ Tech Stack
- **Runtime**: Node.js (TypeScript)
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.io
- **Security**: JWT + bcryptjs + Passport.js
- **Media**: Multer for local/cloud storage handling

## 🚀 Deployment & Environment

The server is optimized for deployment on **Render** or **AWS**.

### Prerequisites
- Node.js v18+
- MongoDB Instance (Atlas or Local)

### Setup
1. **Clone & Install:**
   ```bash
   git clone https://github.com/yitayalDev/LMS-Server.git
   cd LMS-Server
   npm install
   ```

2. **Configuration:**
   Set up your `.env` file:
   ```env
   PORT=10000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret
   CLIENT_URL=http://localhost:3000
   ```

3. **Seed Demo Data:**
   ```bash
   npm run seed:demo
   ```

4. **Start Server:**
   ```bash
   npm run dev
   ```

## 🧪 API Documentation
Primary endpoints:
- `GET /api/health` - System health check
- `POST /api/auth/login` - User authentication
- `GET /api/courses` - Course discovery engine

---
Architected by [Yitayal](https://github.com/yitayalDev)
