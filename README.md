# 3D ULPIN — Rohini Sector 5, New Delhi Hackathon Demo

A React + TypeScript 3D cadastral/GIS demonstration for **Rohini Sector 5, New Delhi**, a simulated demo area based on Rohini Sector 5, New Delhi created for the hackathon. The project extends conventional 2D parcel records into a demonstrative vertical model containing buildings, floor-level units, underground utilities, conflicts, AI-analysis outputs and registry analytics.

## Run locally

Requirements: Node.js 18+ (Node 20/22 recommended).

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Production build

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`.

## Deploy

This is a static Vite application. Run `npm run build`, then publish the contents of `dist/` to any static host (for example Netlify, Vercel static hosting, GitHub Pages, S3/CloudFront or an equivalent web server). Because routing uses `HashRouter`, no server-side route rewrite is required.

## Main routes

- `/` — Landing page
- `/dashboard` — 3D GIS dashboard
- `/property/:id` — Property / parcel / utility details
- `/floor/:id/:floor` — Floor-level 3D view
- `/ai` — AI/ML demonstration pipeline
- `/data` — Survey-data ingestion and simulated processing
- `/generator` — Proposed 3D ULPIN generator and validator
- `/analytics` — Analytics & registry demo

## Real vs simulated

**Real in the browser:** React UI, routing, SVG-based interactive 3D/isometric rendering, camera drag/zoom/orbit controls, deterministic demo dataset, ULPIN proposal encoding/checksum validation, clipboard interaction, client-side file selection/validation states, charts and responsive layouts.

**Simulated/demo:** Rohini Sector 5, New Delhi geography and cadastral records; ownership/registry records; survey coordinates and elevations; drone/LiDAR/CAD/GNSS/DEM datasets; AI/ML confidence scores and detections; conflict records; ingestion processing; registry writes. No real government cadastral dataset or real ML model execution is represented.

## Important judge disclosure

The `3DULPIN-...` identifier used here is a **hackathon-proposed/demo format** designed to demonstrate how a vertical identifier could encode horizontal parcel context plus floor/unit identity and a Luhn-mod-34 check character. It must not be presented as the official Government of India ULPIN specification.


## Dataset disclosure
The application uses a simulated cadastral/GIS dataset geographically framed around Rohini Sector 5, New Delhi (PIN 110085). It is not a government cadastral database and does not reproduce official parcel boundaries, ownership records, registry records, or survey observations. The displayed coordinates and addresses are demo references used to make the hackathon scene realistic. The 3D ULPIN format is a proposed hackathon identifier, not the official Government of India ULPIN specification.
