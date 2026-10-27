"""
Local Mock Cloud Server for Smart Disaster Management Platform
Runs with ZERO external dependencies (Pure Python Standard Library).
Mocks AWS API Gateway + Lambda + DynamoDB + S3 + SNS + Rekognition for instant offline testing and classroom demonstration.
"""

import http.server
import socketserver
import json
import uuid
import os
import base64
import mimetypes
import random
from datetime import datetime

PORT = 5001
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "local_db.json")
UPLOADS_DIR = os.path.join(BASE_DIR, "local_uploads")

os.makedirs(UPLOADS_DIR, exist_ok=True)


def load_incidents():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    
    # Initial realistic seed records simulating prior drone reconnaissance
    initial_data = [
        {
            "incident_id": "uav-seed-001",
            "drone_id": "UAV-ALPHA-01",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "category": "Flood / Trapped",
            "severity": "CRITICAL",
            "status": "NEEDS_RESCUE",
            "latitude": "18.5204",
            "longitude": "73.8567",
            "altitude_m": "42.5",
            "description": "Aerial scan detected 3 people stranded on partially submerged rooftop near river curve. Water level rising fast.",
            "reporter_name": "Drone Reconnaissance Alpha",
            "reporter_phone": "+91 98220 12345",
            "confidence_score": "96.4%",
            "ai_labels": ["Human / Person Detected", "Distress Signal", "High Water Level", "Submerged Structure"],
            "navigation_mode": "BOAT_AERIAL_VECTOR",
            "navigation_advisory": "⚠️ FLOOD PROTOCOL ACTIVE: Ground roadways submerged. Direct amphibious boat corridor or aerial evacuation required.",
            "image_url": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&q=80"
        },
        {
            "incident_id": "uav-seed-002",
            "drone_id": "UAV-BRAVO-02",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "category": "Building Collapse",
            "severity": "HIGH",
            "status": "DISPATCHED",
            "latitude": "18.5312",
            "longitude": "73.8446",
            "altitude_m": "35.0",
            "description": "Optical sensor locked onto 2 victims signaling near collapsed structural wall. Responders en route.",
            "reporter_name": "Drone Reconnaissance Bravo",
            "reporter_phone": "+91 99701 54321",
            "confidence_score": "93.8%",
            "ai_labels": ["Human / Person Detected", "Structural Rubble", "Entrapment Zone"],
            "navigation_mode": "ROAD_NETWORK_ROUTING",
            "navigation_advisory": "🚗 ROAD NAVIGATION ACTIVE: Street network intact. Standard emergency vehicle dispatch routed.",
            "image_url": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80"
        }
    ]
    save_incidents(initial_data)
    return initial_data


def save_incidents(incidents):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(incidents, f, indent=2)


class DisasterMockHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for browser access from any port / origin
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # 1. Serve uploaded drone evidence files
        if self.path.startswith("/uploads/"):
            filename = os.path.basename(self.path)
            filepath = os.path.join(UPLOADS_DIR, filename)
            if os.path.exists(filepath):
                self.send_response(200)
                guessed_mime, _ = mimetypes.guess_type(filepath)
                if not guessed_mime:
                    ext = filename.split(".")[-1].lower()
                    if ext in ("mp4", "mov", "webm"):
                        guessed_mime = f"video/{ext}"
                    else:
                        guessed_mime = f"image/{ext if ext != 'jpg' else 'jpeg'}"
                self.send_header("Content-Type", guessed_mime)
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                with open(filepath, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_response(404)
                self.end_headers()
                return

        # 2. API Endpoint: GET /incidents
        if self.path == "/incidents" or self.path == "/":
            incidents = load_incidents()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {
                "count": len(incidents),
                "incidents": incidents,
                "environment": "Local Mock (AWS Lambda/DynamoDB/Rekognition Emulation)",
                "command_center_location": {"lat": 18.5204, "lng": 73.8567}
            }
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        super().do_GET()

    def do_POST(self):
        # API Endpoint: POST /incidents (Ingestion from Drone Camera Module)
        if self.path == "/incidents" or self.path == "/":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))

            incident_id = f"inc-{uuid.uuid4().hex[:8]}"
            timestamp = datetime.utcnow().isoformat() + "Z"

            drone_id = data.get("drone_id", "UAV-SCOUT-01")
            media_type = data.get("media_type", "image")
            media_ext = data.get("media_extension") or "jpg"
            mime_type = data.get("mime_type", "image/jpeg")
            media_base64 = data.get("media_base64") or data.get("image_base64")
            media_url = None

            # Persist captured drone photo/video evidence (simulating Amazon S3)
            if media_base64:
                if str(media_base64).startswith(("http://", "https://")):
                    media_url = media_base64
                else:
                    try:
                        if media_base64.startswith("data:"):
                            prefix_header = media_base64.split(";")[0]
                            mime_type = prefix_header.replace("data:", "")
                            if "png" in mime_type:
                                media_ext = "png"
                            elif "webp" in mime_type:
                                media_ext = "webp"
                            elif "video" in mime_type:
                                media_ext = "mp4"
                            else:
                                media_ext = "jpg"

                        if "," in media_base64:
                            media_base64 = media_base64.split(",")[1]

                        media_bytes = base64.b64decode(media_base64)
                        media_filename = f"{incident_id}.{media_ext}"
                        media_path = os.path.join(UPLOADS_DIR, media_filename)
                        with open(media_path, "wb") as f:
                            f.write(media_bytes)
                        media_url = f"http://localhost:{PORT}/uploads/{media_filename}"
                    except Exception as e:
                        print(f"Error saving drone evidence: {e}")

            category = data.get("category", "Flood / Trapped")
            severity = data.get("severity", "CRITICAL")
            lat = float(data.get("latitude", 18.5204))
            lng = float(data.get("longitude", 73.8567))
            alt = data.get("altitude_m", "45.0")

            # AI Victim Confidence Score calculation (simulating Amazon Rekognition)
            confidence_val = data.get("confidence_score")
            if not confidence_val:
                confidence_score = f"{round(random.uniform(92.5, 98.9), 1)}%"
            else:
                confidence_score = str(confidence_val)
                if not confidence_score.endswith("%"):
                    confidence_score += "%"

            ai_labels = ["Human / Person Detected", "Distress Signal"]
            if "Flood" in category:
                ai_labels.extend(["High Water Level", "Submerged Structure", "Stranded Victim"])
            elif "Collapse" in category:
                ai_labels.extend(["Structural Rubble", "Entrapment Zone", "Hazardous Debris"])
            elif "Fire" in category:
                ai_labels.extend(["Thermal Anomaly", "Smoke Plume", "Combustion Zone"])

            # Navigation Routing Mode
            is_flood = "Flood" in category
            if is_flood:
                nav_mode = "BOAT_AERIAL_VECTOR"
                nav_advisory = "⚠️ FLOOD PROTOCOL ACTIVE: Ground roadways submerged. Direct amphibious boat corridor deployed."
            else:
                nav_mode = "ROAD_NETWORK_ROUTING"
                nav_advisory = "🚗 ROAD NAVIGATION ACTIVE: Ground street network intact. Turn-by-turn emergency routing active."

            new_incident = {
                "incident_id": incident_id,
                "drone_id": drone_id,
                "timestamp": timestamp,
                "category": category,
                "severity": severity,
                "status": "NEEDS_RESCUE",
                "latitude": str(lat),
                "longitude": str(lng),
                "altitude_m": str(alt),
                "description": data.get("description", f"Aerial drone detection by {drone_id} in {category} zone."),
                "reporter_name": data.get("reporter_name", f"Drone Recon ({drone_id})"),
                "reporter_phone": data.get("reporter_phone", "N/A"),
                "media_type": media_type,
                "media_url": media_url,
                "image_url": media_url,
                "confidence_score": confidence_score,
                "ai_labels": ai_labels,
                "navigation_mode": nav_mode,
                "navigation_advisory": nav_advisory
            }

            # Save to local database (simulating Amazon DynamoDB)
            incidents = load_incidents()
            incidents.insert(0, new_incident)
            save_incidents(incidents)

            # Simulated Amazon SNS Emergency Dispatch Broadcast
            print("\n" + "="*60)
            print("🚨 [MOCK AWS SNS EMERGENCY BROADCAST DISPATCHED]")
            print(f"📡 Drone Source: {drone_id} | Incident ID: {incident_id}")
            print(f"📍 GPS Coordinates: {new_incident['latitude']}, {new_incident['longitude']} (Alt: {new_incident['altitude_m']}m)")
            print(f"🎯 AI Person Detection Confidence: {confidence_score}")
            print(f"⚠️ Category / Severity: {new_incident['category']} [{new_incident['severity']}]")
            print(f"🧭 Navigation Advisory: {nav_advisory}")
            if media_url:
                print(f"📷 Aerial S3 Evidence: {media_url}")
            print("="*60 + "\n")

            self.send_response(201)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "message": "Drone telemetry & evidence logged to cloud successfully",
                "incident": new_incident
            }).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def do_PATCH(self):
        # API Endpoint: PATCH /incidents/{id}/status (Update status from Dashboard)
        if "/status" in self.path:
            parts = self.path.strip("/").split("/")
            incident_id = parts[1]

            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode("utf-8"))
            new_status = data.get("status")

            incidents = load_incidents()
            updated_item = None
            for inc in incidents:
                if inc["incident_id"] == incident_id:
                    inc["status"] = new_status
                    inc["updated_at"] = datetime.utcnow().isoformat() + "Z"
                    updated_item = inc
                    break

            if updated_item:
                save_incidents(incidents)
                print(f"🔄 [DYNAMODB STATUS UPDATE] Incident {incident_id} ➔ {new_status}")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "message": "Status updated successfully in DynamoDB",
                    "incident": updated_item
                }).encode("utf-8"))
                return
            else:
                self.send_response(404)
                self.end_headers()
                return


if __name__ == "__main__":
    load_incidents()
    print("=" * 65)
    print(f"🚀 Mock AWS Cloud API Server running at http://localhost:{PORT}")
    print("   Simulating: API Gateway + Lambda + DynamoDB + S3 + SNS")
    print(f"📡 Endpoints available:")
    print(f"   • GET   http://localhost:{PORT}/incidents")
    print(f"   • POST  http://localhost:{PORT}/incidents")
    print(f"   • PATCH http://localhost:{PORT}/incidents/<id>/status")
    print("=" * 65)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), DisasterMockHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
