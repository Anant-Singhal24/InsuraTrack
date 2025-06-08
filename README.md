# InsuraTrack

A comprehensive role-based insurance policy management system built with the MERN stack.

## Features

### Agent Features

- Secure registration and authentication
- Customer management (add, edit, delete)
- Policy creation and management
- Policy renewal with complete history tracking
- Month-wise filtering of policies and renewals
- Dashboard with analytics and insights
- Messaging system to communicate with customers

### Customer Features

- Secure login with credentials provided by agents
- Self-service password management
- View and track all assigned policies
- Policy renewal request capabilities
- Direct messaging with assigned agent for inquiries

### System Features

- Role-based authentication and authorization (Agent, Customer)
- Responsive UI with Tailwind CSS
- Dark/Light theme toggle
- Secure data storage and transmission
- Real-time notifications
- Audit trails for all critical actions

## Tech Stack

### Frontend

- React (with Vite)
- Tailwind CSS
- React Router
- Axios
- Context API for state management

### Backend

- Node.js
- Express.js
- MongoDB (with Mongoose ODM)
- JWT Authentication
- Bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository
2. Install server dependencies:
   ```
   cd server
   npm install
   ```
3. Install client dependencies:
   ```
   cd client
   npm install
   ```

### Running the Application

1. Start backend server:
   ```
   cd server
   npm run dev
   ```
2. Start frontend development server:
   ```
   cd client
   npm run dev
   ```

## User Roles and Workflows

### Agent Workflow

- Register and create agent account
- Add new customers to the system
- Create and assign policies to customers
- Manage policy details and coverage
- Process policy renewals
- View comprehensive renewal history
- Filter data by month for reporting
- Respond to customer inquiries

### Customer Workflow

- Login using credentials provided by agent
- Change password for security
- View assigned policies and their details
- Track policy status and renewal dates
- Send messages to assigned agent for support
- Request policy changes or updates
