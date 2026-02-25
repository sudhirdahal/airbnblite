# 🏠 AirBnB Lite - Full-Stack Application

Welcome to AirBnB Lite, a comprehensive full-stack web application designed for educational purposes, mimicking core functionalities of popular vacation rental platforms. This project demonstrates a modern MERN (MongoDB, Express, React, Node.js) stack architecture, focusing on secure user management, dynamic content, and robust administrative tools.

## ✨ Features

### User Experience (UX)
-   **Dynamic Homepage with Advanced Search & Filters:** Browse listings with interactive filters.
-   **Interactive Locations:** Click any property location to instantly search for similar stays in that area.
-   **Real Map View:** Toggle between a grid view and an interactive Leaflet/OpenStreetMap.
-   **Detailed Listing Pages:** View property descriptions, amenities, host information, and real user reviews.
-   **Interactive Photo Gallery:** High-quality image navigation with fallback support.
-   **Real-time Chat:** Engage in live chat. Features unread counters and audio alerts.
-   **Booking System with Modern Calendar:** Proactively blocks reserved dates directly in the UI.
-   **Persistent Wishlist:** Users can "favorite" listings, saved permanently to their account.
-   **User Profile & Achievements:** View traveler stats and earn interactive badges.

### Authentication & Security
-   **Secure Registration/Login:** JWT-based session management and `bcrypt` hashing.
-   **Global Logout (Token Versioning):** Invalidate all active sessions across all devices upon password reset.

### Admin & Management
-   **High-Fidelity Dashboard:** Manage properties via modernized tables with high-res thumbnails and deep linking.
-   **Host Revenue Analytics:** View monthly earning trends via dynamic `Chart.js` visualizations.

## 🚀 Pro-Grade Evolution Summary

| Feature | Evolutionary Step | Value Add |
| :--- | :--- | :--- |
| **Booking** | From Basic Entry to Proactive Calendar Blocking | Prevents conflicts & improves UX |
| **UI State** | From "Loading" Text to Skeleton Pulse Loaders | Improves perceived speed & performance |
| **Feedback** | From Browser Alerts to Themed Toast Notifications | Modern, non-blocking user communication |
| **Hosting** | From Listing CRUD to Data-Driven Analytics | Professional tools for Host management |
| **Interface** | From HTML Text to Animated Dashboard-Style Hero | Premium, space-efficient branding |
| **Interactivity**| From Informative Text to Clickable Action Cards | High-fidelity "SaaS" feel |
| **Search** | From Manual Forms to One-Click Location Tags | Accelerated discovery & UX |
| **Gamification** | From Basic Info to Interactive Achievement Badges | Improves user retention & profile depth |
| **Storage** | From Local uploads/ to Permanent AWS S3 | Prepares app for cloud deployment |

## 📦 Deployment Guide

This application is ready for production deployment using **Vercel** (Frontend) and **AWS** (Backend).

### 1. Backend Deployment (AWS / App Runner / Render)
The backend requires the following environment variables in production:
-   `PORT`: The port the server runs on (usually 5001).
-   `MONGO_URI`: Your MongoDB Atlas production connection string.
-   `JWT_SECRET`: A long, unique random string.
-   `FRONTEND_URL`: Your live Vercel URL (e.g., `https://airnb-lite.vercel.app`).
-   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`: For S3 storage.
-   `EMAIL_HOST`, `EMAIL_USER`, etc.: Mailtrap or production SMTP credentials.

### 2. Frontend Deployment (Vercel)
The frontend requires these variables in the Vercel Dashboard:
-   `VITE_API_URL`: Your live backend API URL (e.g., `https://api.yourdomain.com/api`).
-   `VITE_SOCKET_URL`: Your live backend root URL (e.g., `https://api.yourdomain.com`).

---
**Happy coding and exploring AirBnB Lite!** 🚀🏠
