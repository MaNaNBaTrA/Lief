# Lief 🕒

> **Smart Attendance Management System with Geolocation-Based Check-ins**

Lief is a modern, full-stack attendance management solution that streamlines employee time tracking through intelligent geolocation verification and comprehensive management tools.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/lief)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

<div align="center">
  <img src="./public/Images/Lief.svg" alt="Lief Logo" width="200" height="200">
  
  **Making attendance management simple and smart**
</div>

---

## ✨ Features

### 👷 **Co-worker Features**
- **Smart Check-in**: Location-based attendance with 2km radius verification
- **Secure Check-out**: End-of-day clock-out functionality
- **Personal Dashboard**: View attendance history and statistics
- **Profile Management**: Update personal information and avatar

### 👨‍💼 **Manager Features**
- **Office Location Setup**: Configure and update workplace coordinates
- **Team Overview**: Monitor all employees' attendance records
- **Advanced Analytics**: Visual insights through interactive charts
- **Employee Management**: Comprehensive data table with filtering options
- **Attendance Reports**: Export and analyze team productivity

### 🔐 **Security & Authentication**
- Multi-factor authentication via Supabase
- Role-based access control (RBAC)
- Secure session management
- Protected API endpoints

---

## 🛠️ Technology Stack

### **Frontend**
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[DaisyUI](https://daisyui.com/)** - Component library
- **[Material-UI](https://mui.com/)** - Advanced table components

### **Backend & Database**
- **[Supabase](https://supabase.com/)** - Authentication & real-time features
- **[Neon PostgreSQL](https://neon.tech/)** - Serverless database
- **[Prisma](https://www.prisma.io/)** - Type-safe ORM
- **[GraphQL](https://graphql.org/)** - API query language

### **Visualization & Media**
- **[Chart.js](https://www.chartjs.org/)** - Interactive data visualization
- **[Lottie](https://lottiefiles.com/)** - Animation library
- **[Cloudinary](https://cloudinary.com/)** - Image management

---

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database (or Neon account)
- **Supabase** project setup
- **Cloudinary** account (for image uploads)

---

## 🚀 Quick Start

### 1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/lief.git
cd lief
```

### 2. **Install Dependencies**
```bash
npm install
# or
yarn install
```

### 3. **Environment Configuration**
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAIL=admin@company.com

# Database
DATABASE_URL=your_postgresql_connection_string

# Cloudinary (Optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 4. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

### 5. **Start Development Server**
```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📁 Project Structure

```
lief/
├── .next/                     # Next.js build output
├── node_modules/              # Dependencies
├── prisma/
│   ├── migrations/
│   │   ├── 20250813001139_init/
│   │   │   └── migration.sql
│   │   └── migration_lock.toml
│   └── schema.prisma          # Database schema
├── public/
│   ├── Images/
│   │   ├── Illustration.png
│   │   ├── Lief.svg          # Application logo
│   │   └── Profile-Placeholder.png
│   ├── Loader.json           # Lottie animation
│   ├── Logo.svg
│   └── Work.json             # Lottie animation
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/
│   │   │   └── graphql/
│   │   │       └── route.ts  # GraphQL API endpoint
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── page.tsx  # Auth callback handler
│   │   ├── manager/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx  # Manager dashboard
│   │   │   └── location/
│   │   │       └── page.tsx  # Office location setup
│   │   ├── profile/
│   │   │   ├── [id]/
│   │   │   │   ├── edit/
│   │   │   │   │   └── page.tsx # Edit profile
│   │   │   │   └── page.tsx # View profile
│   │   │   └── page.tsx     # Profile listing
│   │   ├── signin/
│   │   │   ├── client.tsx   # Client-side signin
│   │   │   └── page.tsx     # Signin page
│   │   ├── signup/
│   │   │   ├── client.tsx   # Client-side signup
│   │   │   └── page.tsx     # Signup page
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # Reusable components
│   │   ├── Detail.tsx       # Detail view component
│   │   ├── DynamicProfile.tsx # Profile component
│   │   ├── EditProfile.tsx  # Profile editor
│   │   ├── LottieLoader.tsx # Loading animations
│   │   ├── Navbar.tsx       # Navigation bar
│   │   └── PageContent.tsx  # Page wrapper
│   ├── context/             # React Context
│   │   ├── authContext.tsx  # Authentication context
│   │   └── ToastContext.tsx # Notification context
│   ├── generated/           # Auto-generated files
│   │   └── prisma/          # Prisma client
│   ├── helpers/
│   │   └── authGuard.tsx    # Route protection
│   ├── lib/
│   │   └── supabase/        # Supabase configuration
│   │       ├── client.ts    # Client-side config
│   │       ├── middleware.ts # Auth middleware
│   │       └── server.ts    # Server-side config
│   ├── ui/                  # UI components
│   │   ├── Analytics.tsx    # Analytics dashboard
│   │   ├── Attendance.tsx   # Attendance tracker
│   │   ├── Card.tsx         # Card component
│   │   ├── Chart.tsx        # Chart component
│   │   ├── LineChart.tsx    # Line chart
│   │   └── Work.tsx         # Work tracker
│   └── middleware.ts        # Next.js middleware
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── env.txt                 # Environment template
├── next-env.d.ts          # Next.js types
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies
├── package-lock.json      # Lock file
├── postcss.config.mjs     # PostCSS config
├── PROJECT_STRUCTURE.txt  # Project structure
├── README.md              # This file
└── tsconfig.json          # TypeScript config
```

---

## 🔧 Configuration

### **Supabase Setup**
1. Create a new Supabase project
2. Enable email authentication
3. Configure RLS (Row Level Security) policies
4. Copy project URL and API keys to `.env.local`

### **Database Schema**
The application uses the following main entities:
- `User` - Employee information and authentication
- `Attendance` - Check-in/check-out records
- `Location` - Office location coordinates

### **Role-Based Access**
- **Admin/Manager**: Full access to all features
- **Co-worker**: Limited to personal attendance functions

---

## 🚦 Usage Guide

### **For Co-workers**
1. **Sign Up/Sign In** with company email
2. **Complete Profile** setup with personal information
3. **Check-in** when arriving at office (within 2km radius)
4. **Check-out** at end of workday
5. **View History** of attendance records

### **For Managers**
1. **Access Manager Dashboard** (admin email required)
2. **Set Office Location** using map interface
3. **Monitor Team Attendance** through data tables
4. **Generate Reports** and view analytics
5. **Manage Employee Profiles** and permissions

---

## 📊 API Endpoints

### **GraphQL Schema**
```graphql
type User {
  id: String!
  email: String!
  firstName: String
  lastName: String
  number: String
  address: String
  role: String
  gender: String
  latitude: Float
  longitude: Float
  reportingTime: String
  totalWorkingHours: String
  createdAt: String
  updatedAt: String
  imageUrl: String
  attendances: [Attendance!]!
}

type Attendance {
  userId: String!
  checkInTime: String
  checkOutTime: String
  checkInNote: String
  checkOutNote: String
  overtime: String
  negativeWorkingHours: String
  totalHoursWorked: String
  date: String!
  isHoliday: Boolean!
  createdAt: String!
  updatedAt: String!
  user: User!
}

type OfficeLocation {
  id: String!
  name: String!
  latitude: Float!
  longitude: Float!
  createdAt: String!
  updatedAt: String!
}

# Key Queries
type Query {
  userByEmail(email: String!): User
  getUserById(id: String!): User
  getAllUsers: [User!]!
  getAttendance(userId: String!, date: String!): Attendance
  getAttendancesByUser(userId: String!): [Attendance!]!
  getAttendancesByDate(date: String!): [Attendance!]!
  getOfficeLocation(id: String!): OfficeLocation
  getAllOfficeLocations: [OfficeLocation!]!
  getOfficeLocationByName(name: String!): OfficeLocation
}

# Key Mutations
type Mutation {
  # User Management
  createUser(data: CreateUserInput!): User!
  updateUser(id: String!, data: UpdateUserInput!): User!
  updateUserLocation(id: String!, latitude: Float!, longitude: Float!): User!
  
  # Attendance Management
  createAttendance(data: CreateAttendanceInput!): Attendance!
  updateAttendance(userId: String!, date: String!, data: UpdateAttendanceInput!): Attendance!
  deleteAttendance(userId: String!, date: String!): Boolean!
  
  # Office Location Management
  createOfficeLocation(data: CreateOfficeLocationInput!): OfficeLocation!
  updateOfficeLocation(id: String!, data: UpdateOfficeLocationInput!): OfficeLocation!
  deleteOfficeLocation(id: String!): Boolean!
}
```

### **Key Features**
- **Timezone Support**: Asia/Kolkata timezone by default
- **Automatic Calculations**: Overtime and negative working hours
- **Location Tracking**: User and office location management
- **Time Formatting**: Automatic conversion between time formats (hours ↔ "Xh Ym Zs")
- **Duplicate Prevention**: Prevents multiple attendance records per user per date

### **GraphQL Endpoint**
- `POST /api/graphql` - Main GraphQL endpoint
- `GET /api/graphql` - GraphQL playground (introspection enabled)

---

## 🚀 Deployment

### **Vercel (Recommended)**
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Manual Deployment**
```bash
# Build the application
npm run build

# Start production server
npm start
```

### **Environment Variables for Production**
Ensure these are set in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

---

<div align="center">
  <strong>Built with ❤️ by Manan</strong>
  <br>
  <em>Making attendance management simple and smart</em>
</div>
