# Smart Disaster Management & Aerial Drone Reconnaissance Cloud Platform
**Cloud Computing Project-Based Learning (PBL)**

### Team Members
- **Prince Gupta** (Roll No: 1032232904)
- **Nirmaan Pawar** (Roll No: 1032232352)

---

## 1. Project Overview

A centralized, **serverless AWS cloud platform** integrated with an **Autonomous Aerial Drone Reconnaissance Camera Unit** designed to survey disaster disaster zones, identify trapped victims using computer vision confidence scoring, lock precise satellite GPS coordinates, and stream real-time intelligence to a Rescue Command Operations Center.

### The Problem It Solves
During catastrophic natural disasters (floods, structural collapses, industrial fires):
1. **Blocked Ground Access:** Submerged roads and rubble obstruct ground scouts. Traditional 911/emergency phone calls provide panicked, inaccurate location descriptions.
2. **Lack of Visual Hazard Context:** Rescuers arrive blindly without knowing whether victims are trapped on rooftops, surrounded by water, or near fire hazards.
3. **Fragmented Communication:** Disjointed logs and delayed dispatches cause critical response lag.

### The Cloud & Drone Solution
- **Aerial Drone Reconnaissance Module (`drone-recon-camera/`):** Simulates an onboard UAV optical payload with tactical aviation HUD, high-precision GPS geolocation lock, live WebRTC camera optical streaming, and real-time AI Person Detection with confidence scoring (e.g. `96.8%`).
- **Serverless Ingestion Engine (AWS API Gateway + Lambda):** Event-driven serverless compute ingests telemetry, calculates geospatial distance, determines disaster routing corridors, and triggers alerts with zero idle cost.
- **AI Computer Vision (Amazon Rekognition):** Evaluates visual evidence for human distress indicators, submerged waterlines, and structural rubble.
- **Multimedia & State Persistence (Amazon S3 & DynamoDB):** High-resolution drone aerial captures are cataloged in S3; incident coordinates and status lifecycles are indexed in DynamoDB.
- **Disaster-Adaptive Navigation Routing:**
  - **Floods:** Ground roads are submerged; the system calculates a direct **Amphibious Boat / Aerial Corridor** with boat transit estimates.
  - **Earthquake / Collapse / Fire:** Calculates intact street networks and provides turn-by-turn driving navigation.
- **Instant Emergency Alerts (Amazon SNS):** Immediate multi-channel push alerts (Email / SMS) broadcast victim coordinates, confidence score, and navigation advice to rescue personnel.
- **Rescue Command Operations Center (`rescue-dashboard/`):** Dark-mode tactical geospatial map (Leaflet.js) displaying victim pins, active UAV drone units, distance calculations, photo evidence lightboxes, and one-click dispatch action buttons (`NEEDS_RESCUE` ➔ `DISPATCHED` ➔ `RESOLVED`).

---

## 2. PPT Slide Architecture Mapping: Firebase ➔ AWS Cloud

| PPT Slide Component (Firebase) | Our AWS Cloud Implementation | Free Tier Benefit |
| :--- | :--- | :--- |
| **Simulated Drone / Sensors** | **Drone Camera Reconnaissance Module** (`drone-recon-camera/`) with WebRTC, GPS lock & AI Confidence HUD | Free (Client) |
| **Firebase Cloud Functions** | **AWS Lambda (Python 3.11)** event-driven serverless compute | 1,000,000 free requests/mo |
| **Cloud Firestore** | **Amazon DynamoDB** NoSQL database for victim records & telemetry | 25 GB free storage forever |
| **Firebase Cloud Storage** | **Amazon S3** bucket storing high-resolution aerial disaster photos | 5 GB free storage |
| **Firebase Hosting** | **Amazon S3 Static Website Hosting / AWS Amplify** hosting the public dashboard | Free Tier eligible |
| **Firebase Cloud Messaging (FCM)** | **Amazon SNS (Simple Notification Service)** SMS and Email alerts | 1,000 free emails & SMS/mo |
| **AI / Confidence Scoring** | **Amazon Rekognition** & AI Confidence engine (e.g. `96.8%`) | 5,000 free images/mo |

---

## 3. Quick Start (Instant Local Demo in 30 Seconds)

You can run and test the complete system locally right on your computer without needing any internet connection or cloud account setup!

### Step 1: Start the Local Mock Cloud Server
Open your terminal in this project folder and run:
```bash
python3 backend/local_server.py
```
*Output: `🚀 Mock AWS Cloud API Server running at http://localhost:5001`*

### Step 2: Open the Rescue Command Center
Open in your browser:
```
rescue-dashboard/index.html
```
You will see the dark-mode Command Operations Center with an interactive Leaflet map showing initial disaster incidents.

### Step 3: Open the Drone Camera Module
Open in your browser (or on a mobile device):
```
drone-recon-camera/index.html
```
1. Allow camera access (or click **"🛰️ Sim Feed"** to use realistic aerial drone footage).
2. Observe the tactical HUD, altitude/speed telemetry, and **AI Person Detection Confidence Score (96.8%)**.
3. Choose a disaster hotspot sector (e.g., *Sector 4: Mutha River Submerged Area* or *Sector 7: Building Collapse*).
4. Click **"TRANSMIT DRONE COORDINATES & EVIDENCE TO CLOUD"**.

### Step 4: Watch the Live Sync
Within seconds:
- The Drone Module displays a confirmation modal with the DynamoDB Incident ID.
- The Terminal logs a simulated **Amazon SNS** emergency broadcast.
- The Rescue Dashboard automatically adds a marker on the map, updates the incident counter, and lists the victim card with the drone photo and confidence score!
- Click **"🧭 Boat Corridor"** or **"🚑 Dispatch Team"** on the dashboard to test status updates.

---

## 4. How to Test on a Real Mobile Phone over Wi-Fi

To show the live demo on your smartphone acting as the physical drone camera in front of your professor:
1. Ensure your laptop and phone are connected to the same Wi-Fi network (or phone hotspot).
2. Find your laptop's local IP address:
   - On macOS: Run `ipconfig getifaddr en0` (or `en1`).
   - Example output: `192.168.1.15`.
3. In `drone-recon-camera/index.html`, set the API Gateway URL to:
   ```
   http://192.168.1.15:5001/incidents
   ```
4. Serve the static files from the project root:
   ```bash
   python3 -m http.server 8000
   ```
5. On your mobile phone browser, open:
   ```
   http://192.168.1.15:8000/drone-recon-camera/
   ```
6. Aim your phone camera, lock GPS coordinates, and transmit—your laptop's Command Center will update live!

---

## 5. Deploying to Live AWS Free Tier

When ready to host on public AWS:
1. Follow the step-by-step instructions in [AWS Infrastructure Setup Guide](aws-infrastructure/aws_setup_guide.md).
2. Paste the resulting API Gateway Invoke URL into the Drone Camera and Rescue Dashboard apps.
3. Deploy the website onto **Amazon S3 Static Website Hosting** or **AWS Amplify** for a permanent public link.

---

## 6. PPT Presentation Breakdown (Prince & Nirmaan)

- **Slide 1 (Title):** Nirmaan introduces the team, project title, and the core concept of autonomous drone reconnaissance for disaster relief.
- **Slide 2 (Problem Statement):** Prince explains why ground rescue data is fragmented, delayed, and uncoordinated without aerial reconnaissance.
- **Slide 3 (Proposed Solution):** Nirmaan presents the end-to-end workflow: Drone Optical Scan ➔ AI Person Detection & Confidence ➔ Cloud API Ingestion ➔ S3/DynamoDB Persistence ➔ Rescue Dashboard ➔ Emergency SNS Broadcast.
- **Slide 4 (AWS Cloud Services):** Prince details the specific AWS services used (API Gateway, Lambda, DynamoDB, S3, Rekognition, SNS).
- **Slide 5 (Working Demonstration):** Both demonstrate the live drone camera acquisition, simulated or webcam optical feed, coordinate transmission, and rescue dashboard sync.
- **Slide 6 (Security & Scalability):** Nirmaan & Prince conclude with AWS IAM governance, DynamoDB horizontal auto-scaling, and future YOLO/Jetson hardware integration.
