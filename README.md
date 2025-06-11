# 🌟 InsuraTrack - Your Ultimate Insurance Policy Management System

Welcome to **InsuraTrack**, a cutting-edge, role-based insurance policy management system built with the powerful **MERN stack** (MongoDB, Express.js, React, Node.js).

Designed for seamless interaction between agents and customers, InsuraTrack offers a robust, secure, and user-friendly platform to manage insurance policies with ease.



---

## ✨ Features

### 🧑‍💼 Agent Features

- 🔐 **Secure Registration & Authentication** – Register and log in securely.
- 👥 **Customer Management** – Add, update, or delete customer profiles.
- 📄 **Policy Management** – Create, assign, and modify customer policies.
- ♻️ **Renewal Tracking** – Track upcoming and past renewals.
- 📊 **Month-Wise Filtering** – Filter policies and renewals for insights.
- 📈 **Interactive Dashboard** – Visual analytics for agents.
- 💬 **Messaging System** – Chat with customers in-app.

### 👤 Customer Features

- 🔐 **Secure Login** – Sign in with provided credentials.
- 🔑 **Password Management** – Change password anytime.
- 📋 **Policy Tracking** – View assigned insurance policies.
- ♻️ **Renewal Requests** – Request renewals instantly.
- 💬 **Agent Messaging** – Communicate with your assigned agent.

### ⚙️ System Features

- 🛡️ **Role-Based Access** – Separate flows for Agents & Customers.
- 📱 **Responsive UI** – Tailwind CSS-based adaptive design.
- 🌙 **Dark/Light Mode Toggle** – Switch for your preference.
- 🔐 **Secure Data Handling** – Encrypted communication & storage.
- 🔔 **Real-Time Notifications** – Alerts for important actions.
- 📜 **Audit Trails** – Track critical operations for transparency.

---

## 🛠️ Tech Stack

### 🖥️ Frontend

- **React (with Vite)** – Lightning-fast UI
- **Tailwind CSS** – Utility-first responsive styling
- **React Router** – Smooth routing
- **Axios** – API communication
- **Context API** – State management

### 🔧 Backend

- **Node.js** – Runtime environment
- **Express.js** – Backend framework
- **MongoDB + Mongoose** – Scalable database with ORM
- **JWT Authentication** – Secure login
- **Bcrypt** – Secure password hashing

---

## 🚀 Getting Started

Follow these steps to set up and run **InsuraTrack** locally on your machine.

### 📋 Prerequisites

- ✅ [Node.js (v16+)](https://nodejs.org/)
- ✅ [MongoDB](https://www.mongodb.com/try/download/community)
- ✅ A MongoDB database (local or cloud like MongoDB Atlas)
- ✅ Email service account (e.g., Gmail) for sending notifications

---

## 🧩 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/insuratrack.git
cd insuratrack
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server/` directory:

```env
MONGO_URI=your_mongodb_connection_string
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
JWT_SECRET=your_jwt_secret_key
```

🛡️ Replace values accordingly with your credentials and secure secrets.

---

## ▶️ Running the Application

### Start Backend Server

```bash
cd server
npm run dev
```

> Server runs at: `http://localhost:5000`

### Start Frontend Server

```bash
cd ../client
npm run dev
```

> Frontend runs at: `http://localhost:3001`

---

## 🧑‍💼 User Roles & Workflows

### 🔹 Agent Workflow

- Register & login securely  
- Manage customer records  
- Create, assign, and update policies  
- Track renewals & respond to requests  
- Filter data by month for insights  
- Message customers from dashboard  

### 🔸 Customer Workflow

- Login with agent-provided credentials  
- Update password securely  
- Track assigned policies  
- Submit renewal requests  
- Chat with agents via messaging system  

---

## 📂 Project Structure

```bash
insuratrack/
├── client/                # Frontend (React)
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                # Backend (Node.js/Express)
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   └── server.js
├── .gitignore
└── README.md
```

---

## 🤝 Contributing

We welcome your contributions to make InsuraTrack better!

1. Fork the repository  
2. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make changes and commit:

```bash
git commit -m "Add your feature"
```

4. Push and open a PR:

```bash
git push origin feature/your-feature-name
```

---

## 📜 License

Licensed under the MIT License. See the LICENSE file for more info.

---

🌟 **InsuraTrack – Simplifying insurance management, one policy at a time!** 🌟