<div align="center">
  <img src="https://img.shields.io/badge/Windows-11-00adef?style=flat-square&logo=windows11&logoColor=white" alt="Windows 11"/>
  <img src="https://img.shields.io/badge/Node.js-≥18-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/powercfg-✓-success?style=flat-square" alt="powercfg"/>
  <br/><br/>
  <h1>🖥️ BITSERVER CONTROL</h1>
  <p><strong>A tiny web tool to toggle your Windows PC between Normal and Server power mode.</strong></p>
  <p>Keep your machine awake for long-running tasks — or restore default power settings with one click.</p>
  <br/>
  <img src="docs/screenshot.png" alt="BITSERVER CONTROL Screenshot" width="600"/>
</div>

---

## ✨ Features

- **⚡ One-click toggle** — Switch between NORMAL and SERVER mode instantly
- **🎨 Dark glass UI** — Clean, modern interface with smooth transitions
- **🔧 Minimal** — Single Node.js backend, one dependency
- **🛡️ Safe restore** — Original power settings are backed up automatically
- **📡 REST API** — Control programmatically with simple HTTP calls
- **🔊 Audio cue** — Satisfying click on mode change

## 📋 How it works

BITSERVER CONTROL wraps Windows built-in `powercfg` in a local web interface. No cloud, no telemetry, no sign-up.

| Setting | NORMAL Mode | SERVER Mode |
|---------|:-----------:|:-----------:|
| 🖥️ Monitor timeout | 15 min (AC) / 10 min (DC) | Never |
| 💤 Sleep timeout | 30 min | Never |
| 💾 Hibernate | Off | Off |
| 🔒 Lid close (laptops) | Sleep | Do nothing |

## 🚀 Getting Started

### Prerequisites

- **Windows 11**
- **Node.js** ≥ 18 ([download](https://nodejs.org))

### Install & Run

```bash
# Clone the repo
git clone https://github.com/CastFiberaballs/bitserver-control.git
cd bitserver-control

# Install dependencies
npm install

# Launch
npm start
```

Then open **http://localhost:3131** in your browser.

> ⚠️ **Run as Administrator** — Right-click `run.bat` → *Run as administrator*. Elevated privileges are required to change power plan settings.

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/state` | Returns the current mode |
| `POST` | `/server-mode` | Activates Server Mode (no sleep, no display off) |
| `POST` | `/normal-mode` | Restores normal power settings |

```bash
# Fetch current state
curl http://localhost:3131/state

# Switch to Server Mode
curl -X POST http://localhost:3131/server-mode

# Back to Normal Mode
curl -X POST http://localhost:3131/normal-mode
```

### Response format

```json
{
  "mode": "normal",
  "since": "2026-05-23T01:15:00.000Z",
  "originalSettings": { ... }
}
```

## 📁 Project Structure

```
bitserver-control/
├── server.js         # Express server + powercfg logic
├── app.html          # Web interface
├── run.bat           # Windows launcher
├── package.json
├── README.md
├── LICENSE
└── .gitignore
```

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** Plain HTML / CSS / JS (zero frameworks)
- **OS API:** Windows powercfg
- **Dependencies:** 1 (express)

## 📜 License

MIT — free to use, modify, share.

---

<div align="center">
  <sub>Built by <strong>Tobias</strong> · 
  <a href="https://github.com/CastFiberaballs">GitHub</a></sub>
</div>
