# Auto-Pilot BOQ: Professional Structural Takeoff

A high-fidelity React application designed for rapid structural steel estimation and civil engineering takeoffs. Use the plan-first workspace to draw beams, columns, and slabs, then instantly generate a professional BOQ with accurate material weights and cost distributions.

## 🚀 Navigation Control
- **Plan Takeoff**: High-fidelity "Chain Drawing" engine with professional snapping, **Reference Trace Overlay**, and right-click cancel.
- **BOQ Summary**: Real-time material aggregation, **Detailed Itemized Takeoff**, and Factor F markup calculation.
- **Procurement Engine**: Automated conversion from material weight to **Commercial Bar Pieces** (10m/12m units).
- **Zoned Reinforcement**: Professional L/4 beam reinforcement zoning for automated standard takeoffs.
- **Project File Management**: Save and open projects locally with `.boq` files.
- **Project Report**: High-level data visualization of cost and resources.

## 📂 Project Documentation (Mission Control)
Access the core documentation files here:

- 🏗️ **[Architecture](docs/architecture.md)**: Deep dive into the SVG engine and state logic.
- 🗺️ **[Roadmap](docs/roadmap.md)**: Feature priorities and future development phases.
- 📜 **[Development Guidelines](docs/guidelines.md)**: Coding standards and UI/UX philosophy.
- 📍 **[Current Status](docs/status.md)**: Latest accomplishments and active missions.

---

## 🛠️ Tech Stack
- **Framework**: React (Vite)
- **Canvas Engine**: SVG + CTM transformation
- **State Layer**: Zustand & React-Hook-Form
- **Validation**: Zod
- **Style**: Tailwind CSS
- **Animations**: Framer Motion

## 🚦 Getting Started
1. `npm install`
2. `npm run dev`
3. Open `http://localhost:5173`
