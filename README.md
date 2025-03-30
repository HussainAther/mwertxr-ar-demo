# MWERT-XR AR Demo

A multiplayer WebXR-based Augmented Reality demo inspired by MWERT (Multi-player Web Experiments in Real Time). This project allows multiple users to interact with shared virtual objects in AR through their browser.

## 🚀 Features
- Real-time multiplayer using Socket.io
- AR in-browser via A-Frame + WebXR
- Object interaction synced across devices
- Room-based session handling

## 📦 Folder Structure
```
/mwertxr-ar-demo
  ├── server/
  │   ├── app.js              # Express + Socket.io server
  ├── public/
  │   ├── index.html          # AR scene and entry point
  │   ├── game.client.js      # Client-side socket + interaction logic
  │   ├── style.css           # Basic layout
  │   └── assets/             # 3D models (e.g., whale.gltf)
  ├── package.json
  └── README.md
```

## 🛠️ Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- A device/browser with WebXR support (Chrome on Android, Oculus Browser, etc.)

### Install
```bash
npm install
```

### Run
```bash
npm start
```

### Test in AR
Open the following URLs in two tabs or devices:
```
http://localhost:8000?id=1000
http://localhost:8000?id=1001
```

Tap/click the whale in one session—it will animate in the other.

## 🧪 Concept
Based on the MWERT framework created for behavioral experiments, this project brings those ideas into spatial computing. Ideal for experimenting with communication, shared tasks, or spatial reasoning in AR.

## 📚 Credits
- Built with [A-Frame](https://aframe.io/) for WebXR
- Real-time powered by [Socket.io](https://socket.io/)
- Inspired by Robert Hawkins’ MWERT framework

## 🪪 License
MIT

