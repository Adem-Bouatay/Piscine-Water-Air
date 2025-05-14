# 💧 3D Glass Pool Viewer with Node-RED Control

This project renders a realistic **glass pool** using [three.js](https://threejs.org/). It supports **real-time control** of water properties like level, color, opacity, and movement via **Node-RED** using WebSockets.

---

## 📦 Requirements

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Node-RED](https://nodered.org/) installed globally or locally
- npm

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/glass-pool-visualizer.git
cd glass-pool-visualizer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Import the Node-RED Flow

1. Start Node-RED:

   ```bash
   node-red
   ```

2. Open your browser and go to:  
   [http://localhost:1880](http://localhost:1880)

3. In the top-right menu, click **Import**.

4. Copy and paste the contents of the `NodeRed.json` file (located in this repo), or import it as a file.

5. Click **Deploy** to activate the flow.

### 4. Run the 3D Viewer

```bash
npm run dev
```

Then open your browser to:

```
http://localhost:3000
```

> Make sure Node-RED is running at the same time so WebSocket communication works properly.

and open the dashboard at:

```
http://127.0.0.1:1880/ui/
```

---

## ⚙️ Features

- 🧊 Transparent glass pool rendered with real-time reflections and refraction
- 🌊 Animated water surface using shader-based rendering
- 🔁 Real-time control from Node-RED:
  - **Water Level**
  - **Water Color**
  - **Water Opacity**
  - **Water Movement (Distortion)**

---

## 🧠 Tech Stack

- `three.js` — WebGL-based 3D rendering
- `Node-RED` — Flow-based control for IoT and simulations
- `Vite` — Fast dev server and bundler
- `WebSocket` — Real-time updates between Node-RED and the 3D scene

---

## 🗂️ Project Structure

```
glass-pool-visualizer/
├── index.html
├── main.js         # Three.js logic
├── NodeRed.json        # Node-RED flow for real-time control
├── package.json
└── README.md
```

---

## 📸 Screenshots


---

## 🧪 Example Control Flow

- Node-RED sends messages via WebSocket (`ws://localhost:1880/ws/pool`)
- Messages update water attributes in real-time in the 3D scene
- Format:

```json
{
  "waterLevel": 1.5,
  "waterColor": "#00ffff",
  "waterOpacity": 0.8,
  "waterMovement": 2.0
}
```
