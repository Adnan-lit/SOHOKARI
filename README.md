🌐 Sohokari Frontend

A modern service marketplace mobile app built with React Native and Expo.
Sohokari connects customers with service providers for fast booking, real-time chat, and location-based service discovery.

📊 Project Status






⚙️ Tech Stack












🚀 Features
👤 Customer
Find nearby service providers
Search by category and location
Book services instantly
Real-time chat with providers
Track bookings and invoices
Write reviews
🧑‍🔧 Provider
Create service profile
Accept or reject bookings
Manage availability
Chat with customers
Track earnings and performance
🌍 System Features
Role-based navigation (Customer / Provider / Admin)
Real-time messaging system
Push notifications
AI-powered suggestions
Location-based discovery
Secure authentication
📁 Project Structure
Sohokari_Frontend/
│
├── App.tsx
├── assets/
├── src/
│   ├── api/            # API layer (Axios client + endpoints)
│   ├── components/     # Reusable UI components
│   ├── navigation/     # App navigation system
│   ├── screens/        # All app screens
│   ├── store/          # Zustand global state
│   ├── theme/          # Colors & styling system
│   └── constants/      # App configuration
🔐 Environment Setup

Create a .env file:

API_URL=https://your-backend-url.com/api/v1
WS_URL=wss://your-websocket-url
📦 Installation
git clone https://github.com/Adnan-lit/SOHOKARI.git
cd SOHOKARI/Sohokari_Frontend
npm install
▶️ Run App
npx expo start

Run on:

Android 📱
iOS 🍏
Web 🌐
🔄 App Flow
Login / Register
      ↓
Role Detection
      ↓
Customer / Provider Dashboard
      ↓
Browse Services
      ↓
Book Service
      ↓
Real-time Chat
      ↓
Complete & Review
🧠 Core Modules
Authentication (JWT + refresh token)
Booking system (full lifecycle management)
Real-time chat (WebSocket + fallback REST)
Provider marketplace system
AI-based recommendations
Notification system
📡 Architecture
Axios client handles all API calls
React Query manages server state
Zustand manages authentication state
WebSocket handles real-time communication
Expo handles cross-platform deployment
🧪 Notes
SecureStore used for token storage
Web fallback enabled for chat polling
Role-based navigation ensures separation of flows
Modular API structure for scalability
👨‍💻 Developer

Built by Adnan
