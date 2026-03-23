# 🚀 SyncSpace

**SyncSpace** is a high-performance, real-time project management application designed for seamless team collaboration. Built with the MERN stack and powered by WebSockets, it allows teams to manage tasks, chat instantly, and stay updated with live notifications.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933)
![Socket.io](https://img.shields.io/badge/Real--time-Socket.io-010101)

---

## ✨ Features

- **📊 Dynamic Kanban Boards:** Drag-and-drop tasks across lists with instant synchronization across all users.
- **💬 Real-time Team Chat:** Integrated sidebar for global and board-specific discussions.
- **🔔 Live Notifications:** Get instantly alerted when tasks are completed, moved, or updated.
- **🔐 Secure Authentication:** JWT-based login and registration with protected API routes.
- **🛡️ Role-Based Access:** Manage your team with Owner, Admin, Editor, and Viewer permissions.
- **🎨 Modern UI:** Sleek, responsive interface built with **Tailwind CSS** and **Lucide Icons**.

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- Socket.io-client
- @hello-pangea/dnd (Drag & Drop)
- Axios & Lucide React

**Backend:**
- Node.js & Express
- MongoDB (Mongoose)
- Socket.io (WebSockets)
- JSON Web Tokens (JWT)
- Bcrypt.js

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone [https://github.com/Arjun-Patel1/SyncSpace.git](https://github.com/Arjun-Patel1/SyncSpace.git)
cd SyncSpace
```
2. Setup Backend
```Bash
cd backend
npm install
```
Create a .env file in the backend folder:
```Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
```
Run the server: 
```
npm run dev
```

3. Setup Frontend
```Bash
cd ../frontend
npm install
```
Create a .env file in the frontend folder:

Code snippet
VITE_API_URL=http://localhost:5000/api
Run the app: npm run dev

🌐 Deployment
SyncSpace is currently deployed and live:

Frontend: https://sync-space-gold.vercel.app

Backend API: https://syncspace-u4bm.onrender.com/api

🤝 Contributing
Contributions, issues, and feature requests are welcome!
Feel free to check the issues page.

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📄 License
Distributed under the MIT License. See LICENSE for more information.

Built with ❤️ by Arjun Patel


---

### Pro-Tip:
Since you just pushed your code, you can upload this file to your root directory by running:

1. Create a new file named `README.md` in the main `SyncSpace` folder.

2. Paste the code above.

3. Run:
```bash
git add README.md
git commit -m "Docs: Added professional README"
git push origin main
```