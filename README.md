
<div align="center">

# 🎓 Campus Payment System

### *A Modular API for Secure Digital Fee Transactions in Educational Institutions*

<br>

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-API-0D9488?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)

<br>

[![Status](https://img.shields.io/badge/Status-Production_Ready-10b981?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-ff69b4?style=for-the-badge)](#)

</div>

# 📌 Overview

The **Campus Payment System** is a comprehensive web-based platform designed to digitize fee collection processes in educational institutions. It provides **role-based dashboards** for students and administrators, integrates the **Razorpay payment gateway**, and generates **automated PDF receipts**.

---

# ✨ Features

## 👨‍🎓 Student Dashboard

| Feature | Description |
|---------|-------------|
| 📊 Real-time Statistics | View total paid, pending fees, due amount, and receipt count |
| 💳 Online Payments | Pay fees securely via Razorpay (Cards, UPI, Net Banking) |
| 📄 Digital Receipts | Download PDF receipts automatically generated after payment |
| 📜 Payment History | Complete transaction history with status tracking |
| 🔔 Due Date Alerts | Visual indicators for upcoming and overdue payments |

---

## 👨‍💼 Admin Dashboard

| Feature | Description |
|---------|-------------|
| 📈 Analytics Dashboard | Real-time statistics on students, collections, and pending fees |
| 👥 Student Management | Search, filter, and view all registered students |
| 📝 Fee Assignment | Assign fees to individual students with description and due date |
| ☑️ Bulk Assignment | Select All Students feature for mass fee assignment |
| 💰 Payment Monitoring | Track payment status across all students |
| 📊 Financial Reports | Generate reports on collections and pending fees |

---

## 🔒 Security Features

- ✅ JWT-based authentication with 7-day expiration
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ CORS protection with whitelisted origins
- ✅ Input validation on client and server sides
- ✅ No sensitive card data stored (Razorpay handles PCI compliance)

---

# 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                       │
│            Student Browser | Admin Browser                 │
│                     (HTML/CSS/JS)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                        │
│                Node.js / Express.js Server                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │  Auth    │ │ Student  │ │  Admin   │ │ Payment  │       │
│ │ Module   │ │ Module   │ │ Module   │ │ Module   │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                    JWT Middleware                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                         DATA TIER                          │
│                      MongoDB Atlas                         │
│ ┌────────┐ ┌────────┐ ┌────────────┐ ┌────────────┐       │
│ │ Users  │ │ Fees   │ │Transactions│ │ Receipts   │       │
│ └────────┘ └────────┘ └────────────┘ └────────────┘       │
└─────────────────────────────────────────────────────────────┘
````

---

# 🛠️ Technology Stack

| Layer           | Technology                      | Version   |
| --------------- | ------------------------------- | --------- |
| Frontend        | HTML5, CSS3, Vanilla JavaScript | -         |
| Backend         | Node.js, Express.js             | 22.x, 4.x |
| Database        | MongoDB, Mongoose ODM           | 7.x, 7.5  |
| Authentication  | JWT, bcryptjs                   | 9.0, 2.4  |
| Payment Gateway | Razorpay API                    | 2.9       |
| PDF Generation  | PDFKit                          | 0.14      |

---

# 📂 Project Structure

```text
campus-payment-system/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── success.html
│   ├── failure.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── student/
│   │   │   └── dashboard.js
│   │   └── admin/
│   │       └── dashboard.js
│   ├── student/
│   │   └── dashboard.html
│   └── admin/
│       ├── dashboard.html
│       └── payment-status.html
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── models/
│   │   ├── User.js
│   │   ├── Fee.js
│   │   ├── Transaction.js
│   │   └── Receipt.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── adminController.js
│   │   └── paymentController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── adminRoutes.js
│   │   └── paymentRoutes.js
│   └── middleware/
│       ├── auth.js
│       └── admin.js
│
└── README.md
```

---

# 🚀 Installation & Setup

## Prerequisites

* Node.js v22.x or higher
* MongoDB Atlas account
* Razorpay test account

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/campus-payment-system.git
cd campus-payment-system
```

---

## Step 2: Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:

```env
PORT=5000
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/campus_payments
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://127.0.0.1:5500
```

Start the backend server:

```bash
npm run dev
```

---

## Step 3: Frontend Setup

Open `frontend/index.html` using Live Server in VS Code.

Or use any HTTP server to serve frontend files.

---

## Step 4: Create Admin User

```bash
node create-admin.js
```

---

# 💳 Test Payment Details

| Payment Method | Test Details        |
| -------------- | ------------------- |
| Credit Card    | 4111 1111 1111 1111 |
| Expiry         | Any future date     |
| CVV            | Any 3 digits        |
| UPI ID         | success@razorpay    |
| Net Banking    | Any bank            |

---

# 📡 API Endpoints

| Method | Endpoint                       | Description           | Auth        |
| ------ | ------------------------------ | --------------------- | ----------- |
| POST   | `/api/auth/register`           | Student registration  | Public      |
| POST   | `/api/auth/login`              | User login            | Public      |
| GET    | `/api/student/fees`            | Get student fees      | JWT         |
| GET    | `/api/student/payments`        | Get payment history   | JWT         |
| GET    | `/api/student/receipts`        | Get receipts          | JWT         |
| GET    | `/api/admin/students`          | Get all students      | JWT + Admin |
| POST   | `/api/admin/fees/assign`       | Assign fees           | JWT + Admin |
| POST   | `/api/payments/create-order`   | Create Razorpay order | JWT         |
| POST   | `/api/payments/verify-payment` | Verify payment        | JWT         |

---

# 🔄 Payment Flow

```text
1. Student clicks "Pay Now"
2. Backend creates Razorpay order
3. Razorpay checkout popup opens
4. Student enters payment details
5. Payment processed by Razorpay
6. Backend verifies payment signature
7. Transaction saved to database
8. PDF receipt generated automatically
9. Student redirected to success page
```

---

# 🔐 Security Highlights

* ✅ Passwords hashed with bcrypt
* ✅ JWT authentication
* ✅ CORS protection
* ✅ Input validation
* ✅ PCI DSS compliant via Razorpay

---

# 📈 Performance Metrics

| Operation          | Response Time |
| ------------------ | ------------- |
| User Login         | ~100 ms       |
| Dashboard Load     | ~250 ms       |
| Fee Assignment     | ~200 ms       |
| Bulk Assignment    | ~3.5 sec      |
| Payment Processing | ~2.5 sec      |

---

# 🎯 Future Enhancements

| Priority | Feature                                |
| -------- | -------------------------------------- |
| High     | Email notifications, payment reminders |
| Medium   | Mobile app, multiple payment gateways  |
| Low      | Dark mode, multilingual support        |

---

# 👥 Contributors

| Name            | Role              |
| --------------- | ----------------- |
| Ishan Verma     | Student Developer |
| Bhavya Gupta    | Student Developer |
| Love Kumar      | Student Developer |
| Amit Badoni     | Student Developer |
| Dr. Rini Saxena | Faculty Guide     |


<div align="center">

Made with ❤️ for educational institutions

© 2026 Campus Payment System

</div>

