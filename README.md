# FashionBuy - AI-Powered Cyber Atelier & Smart Glasses AR

FashionBuy is a high-end, luxury 3D digital fashion studio designed for the future of interactive e-commerce, seamlessly integrating advanced AI styling tools, real-time product discovery, generative fashion design, a frictionless simulated PayPal Sandbox payment ecosystem, and cutting-edge Augmented Reality (AR) tailoring visualizations.

## 🚀 Key Features

*   **Luxury 3D Studio & Collection Showcase:** A fully immersive WebGL/Three.js responsive environment featuring high-contrast obsidian and royal violet lighting profiles, displaying interactive collection cards using CSS3DRenderer for native browser rendering.
*   **AI Stylist & Live E-Commerce Discovery (Channel3 & Gemini):** Integrated with **Channel3's Product Search API** and **Google Gemini 1.5 Flash** inside the Private AI Stylist chat. Users can describe any outfit or occasion in natural language to receive personalized styling advice alongside live brand pricing, product links, and luxury mini-cards fetched directly from real-world fashion catalogs.
*   **Generative Design Ideas (Pollinations AI):** Powered by **Pollinations AI**, the Design Ideas module allows users to type any custom garment concept and instantly generate high-resolution, studio-lit luxury fashion renders directly onto the 3D showcase board without latency.
*   **AI Virtual Fitting Room & Try-On Analysis:** Integrated with multi-modal vision models and **Replicate (IDM-VTON)** to let users upload custom photos and project clothing textures onto their images with real-time fit compatibility scoring.
*   **Expanded Parametric Sewing Pattern Engine:** Utilizes **FreeSewing**-inspired parametric logic across a wide library of garment models (Blazers, Hoodies, Blouses, Evening Gowns, Trench Coats, etc.) with Front/Back view toggles. It converts five anatomical body measurements (shoulder, chest, waist, hips, and sleeve) into custom SVG cutting grids projected onto the 3D cutting mat.
*   **Smart Glasses AR Distance Zoom Lock:** Implements a localized WebXR immersive-ar simulation loop. Utilizing a calibration reference marker, the overlay system dynamically measures camera surface distance—automatically scaling the cutting pattern UP as the user leans closer and DOWN as they move back, locking centimeters directly to physical fabric.
*   **Frictionless PayPal Integration:** Features a streamlined, interactive simulated PayPal Checkout and Pay Later workflow. Successful authorization instantly dresses the 3D studio avatars, renders customized confirmation logs, and auto-projects the AR cutting layouts.

## 🛠️ Architecture & Tech Stack

*   **Front-End:** HTML5, CSS3, JavaScript (ES6), Three.js (WebGL, OrbitControls, FBXLoader, GLTFLoader, CSS3DRenderer).
*   **Back-End & Cloud Hosting:** Node.js, Express.js (`server.cjs`), hosted live on **Render**.
*   **AI & E-Commerce Engines:** 
    *   **Channel3 API** (Real-time fashion product search & catalog integration)
    *   **Pollinations AI** (Zero-latency generative garment visualization)
    *   **Google AI Studio / Gemini 1.5 Flash** (Multimodal styling & fit analysis)
    *   **Replicate AI Cloud / IDM-VTON** (Virtual try-on synthesis)
*   **AR & Pattern Engine:** Parametric SVG Geometry Engine (FreeSewing methodology) + Custom WebXR distance tracking.

## ⚙️ Environment Configuration

To configure the live cloud production environment on **Render**, add the following environment variables under your project dashboard settings:
*   `GEMINI_API_KEY`: Your dedicated Google AI Studio developer token.
*   `REPLICATE_API_TOKEN`: Your authenticated Replicate account API key.
*   `CHANNEL3_API_KEY`: Your Channel3 developer API key for live e-commerce product search.
