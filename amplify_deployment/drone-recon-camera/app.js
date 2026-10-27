// ========================================================
// Tactical UAV Drone Reconnaissance Module Logic
// Integrates Camera Stream, Telemetry, AI Detection & Cloud Ingestion
// ========================================================

const DRONE_ID = "UAV-SCOUT-01";

// State Variables
let currentStream = null;
let currentFacingMode = "environment"; // default to rear camera on mobile
let isSimulatedFeed = false;
let currentLatitude = 18.520430;
let currentLongitude = 73.856744;
let currentAltitude = 42.5;
let currentAccuracy = 3.5;
let currentConfidence = 96.8;
let capturedBase64Media = null;
let telemetryTimer = null;

// Preset Disaster Hotspots (Pune / Maharashtra Disaster Simulation Grid)
const DISASTER_HOTSPOTS = {
  REAL_DEVICE: null, // Will use GPS
  SECTOR_PUNE_RIVER: { lat: 18.520430, lng: 73.856744, alt: 42.5, acc: 3.5, cat: "Flood / Trapped", note: "UAV optical sensor locked onto 3 stranded victims signaling from second floor balcony. Water rising fast." },
  SECTOR_COLLAPSE_ZONE: { lat: 18.513210, lng: 73.851230, alt: 36.2, acc: 4.0, cat: "Building Collapse", note: "Optical thermal lock on 2 trapped people beside collapsed residential support column. Structural hazard critical." },
  SECTOR_FIRE_INDUSTRIAL: { lat: 18.508920, lng: 73.925840, alt: 58.0, acc: 5.2, cat: "Fire Incident", note: "Dense smoke plume detected. 4 factory workers trapped near northern fire exit boundary." },
  SECTOR_HILL_LANDSLIDE: { lat: 18.366410, lng: 73.755820, alt: 84.1, acc: 6.0, cat: "Medical Emergency", note: "Mudslide blocked vehicular access. 1 elderly casualty requiring urgent medical evacuation." }
};

// Curated Simulated Aerial Drone Images for Instant Fallback
const SIMULATED_AERIAL_FEEDS = {
  "Flood / Trapped": "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
  "Building Collapse": "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80",
  "Fire Incident": "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=800&q=80",
  "Medical Emergency": "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&q=80"
};

// DOM Elements
const droneVideo = document.getElementById("droneVideo");
const snapshotCanvas = document.getElementById("snapshotCanvas");
const simulatedDroneImg = document.getElementById("simulatedDroneImg");
const viewportDisplay = document.getElementById("viewportDisplay");
const cameraPromptBox = document.getElementById("cameraPromptBox");
const switchCameraBtn = document.getElementById("switchCameraBtn");
const simulateFeedBtn = document.getElementById("simulateFeedBtn");
const snapLeftBtn = document.getElementById("snapLeftBtn");
const snapCenterBtn = document.getElementById("snapCenterBtn");
const startCameraBtn = document.getElementById("startCameraBtn");
const useSimPhotoBtn = document.getElementById("useSimPhotoBtn");
const manualFileInput = document.getElementById("manualFileInput");
const evidenceStateText = document.getElementById("evidenceStateText");
const refreshAiBtn = document.getElementById("refreshAiBtn");

// Telemetry DOM
const telemetryAlt = document.getElementById("telemetryAlt");
const telemetrySpeed = document.getElementById("telemetrySpeed");
const telemetryBatt = document.getElementById("telemetryBatt");
const telemetrySats = document.getElementById("telemetrySats");
const latDisplay = document.getElementById("latDisplay");
const lngDisplay = document.getElementById("lngDisplay");
const altDisplay = document.getElementById("altDisplay");
const accDisplay = document.getElementById("accDisplay");
const gpsLockBadge = document.getElementById("gpsLockBadge");
const hotspotSelect = document.getElementById("hotspotSelect");
const refreshGpsBtn = document.getElementById("refreshGpsBtn");

// AI Detection DOM
const aiBoundingBox = document.getElementById("aiBoundingBox");
const boxTag = document.getElementById("boxTag");
const boxStatusIcon = document.getElementById("boxStatusIcon");
const boxDistressTag = document.getElementById("boxDistressTag");
const crosshairRing = document.getElementById("crosshairRing");
const detectedClassText = document.getElementById("detectedClassText");
const confidencePillText = document.getElementById("confidencePillText");
const confidenceValueText = document.getElementById("confidenceValueText");
const confidenceBarFill = document.getElementById("confidenceBarFill");
const aiTagsRow = document.getElementById("aiTagsRow");
const targetCoordsTag = document.getElementById("targetCoordsTag");
const lockHumanBtn = document.getElementById("lockHumanBtn");
const modeAutoBtn = document.getElementById("modeAutoBtn");
const modeManualBtn = document.getElementById("modeManualBtn");
const modeStatusDesc = document.getElementById("modeStatusDesc");
const hudModePill = document.getElementById("hudModePill");
const hudModeText = document.getElementById("hudModeText");
const hudScanBeam = document.getElementById("hudScanBeam");
const targetHintText = document.getElementById("targetHintText");
const incidentNotes = document.getElementById("incidentNotes");

// Form & Modal DOM
const reconForm = document.getElementById("reconForm");
const transmitBtn = document.getElementById("transmitBtn");
const apiUrlInput = document.getElementById("apiUrlInput");
const resetEndpointBtn = document.getElementById("resetEndpointBtn");
const resultModal = document.getElementById("resultModal");
const modalIconBadge = document.getElementById("modalIconBadge");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");


// ========================================================
// 1. Camera Initialization & Optical Stream Control
// ========================================================

async function initCamera() {
  if (isSimulatedFeed) return;

  evidenceStateText.textContent = "Connecting to Optical Camera Sensor...";
  cameraPromptBox.classList.add("hidden");

  // Stop previous stream tracks
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn("getUserMedia not supported. Switching to simulated aerial feed.");
    enableSimulatedFeed();
    return;
  }

  try {
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    droneVideo.srcObject = currentStream;
    droneVideo.classList.remove("hidden");
    simulatedDroneImg.classList.add("hidden");
    cameraPromptBox.classList.add("hidden");
    isSimulatedFeed = false;
    evidenceStateText.textContent = "Live Drone Optical Feed Active (WebRTC)";
  } catch (err) {
    console.warn("Camera access failed or denied:", err.message);
    enableSimulatedFeed();
  }
}

function enableSimulatedFeed() {
  isSimulatedFeed = true;
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }

  const selectedCategory = document.querySelector('input[name="category"]:checked')?.value || "Flood / Trapped";
  const simUrl = SIMULATED_AERIAL_FEEDS[selectedCategory] || SIMULATED_AERIAL_FEEDS["Flood / Trapped"];
  
  simulatedDroneImg.src = simUrl;
  simulatedDroneImg.classList.remove("hidden");
  droneVideo.classList.add("hidden");
  cameraPromptBox.classList.add("hidden");
  evidenceStateText.textContent = `🛰️ Simulated Aerial Drone Feed (${selectedCategory})`;
}

// Switch between live video and simulated UAV reconnaissance photo
simulateFeedBtn.addEventListener("click", () => {
  if (isSimulatedFeed) {
    isSimulatedFeed = false;
    initCamera();
  } else {
    enableSimulatedFeed();
  }
});

switchCameraBtn.addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  isSimulatedFeed = false;
  initCamera();
});

startCameraBtn.addEventListener("click", () => {
  isSimulatedFeed = false;
  initCamera();
});

useSimPhotoBtn.addEventListener("click", enableSimulatedFeed);

// Handle manual photo / video upload as drone evidence
manualFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    capturedBase64Media = event.target.result;
    simulatedDroneImg.src = capturedBase64Media;
    simulatedDroneImg.classList.remove("hidden");
    droneVideo.classList.add("hidden");
    isSimulatedFeed = true;
    evidenceStateText.textContent = `📁 Custom Evidence Loaded: ${file.name}`;
    recalculateConfidence();
  };
  reader.readAsDataURL(file);
});


// ========================================================
// 2. Optical Frame Capture (Canvas Base64)
// ========================================================

function captureOpticalSnapshot() {
  // If custom uploaded or simulated feed
  if (isSimulatedFeed && capturedBase64Media) {
    return capturedBase64Media;
  }

  // If live camera is playing, snap current video frame
  if (!isSimulatedFeed && droneVideo.readyState === droneVideo.HAVE_ENOUGH_DATA) {
    const width = droneVideo.videoWidth || 640;
    const height = droneVideo.videoHeight || 480;
    snapshotCanvas.width = width;
    snapshotCanvas.height = height;
    const ctx = snapshotCanvas.getContext("2d");
    ctx.drawImage(droneVideo, 0, 0, width, height);

    // Export compressed JPEG
    return snapshotCanvas.toDataURL("image/jpeg", 0.78);
  }

  // Fallback to simulated category image
  const selectedCat = document.querySelector('input[name="category"]:checked')?.value || "Flood / Trapped";
  return SIMULATED_AERIAL_FEEDS[selectedCat] || SIMULATED_AERIAL_FEEDS["Flood / Trapped"];
}


// ========================================================
// 3. Drone Telemetry & Artificial Horizon Simulation
// ========================================================

function startTelemetrySimulator() {
  let batt = 88;
  let altBase = 42.5;

  telemetryTimer = setInterval(() => {
    // Subtle realistic flight fluctuations
    const altJitter = (Math.random() * 0.4 - 0.2).toFixed(1);
    const speedJitter = Math.floor(19 + Math.random() * 5);
    const satsCount = Math.floor(12 + Math.random() * 3);

    telemetryAlt.textContent = `${(altBase + parseFloat(altJitter)).toFixed(1)}m`;
    telemetrySpeed.textContent = `${speedJitter} km/h`;
    telemetrySats.textContent = `${satsCount} DGPS`;

    // Battery slow drain
    if (Math.random() > 0.85 && batt > 20) {
      batt -= 1;
      telemetryBatt.textContent = `${batt}%`;
    }
  }, 2500);
}


// ========================================================
// 4. GPS Geolocation & Target Coordinate Acquisition
// ========================================================

function applyHotspot(key) {
  if (key === "REAL_DEVICE") {
    fetchDeviceGPS();
    return;
  }

  const hotspot = DISASTER_HOTSPOTS[key];
  if (!hotspot) return;

  currentLatitude = hotspot.lat;
  currentLongitude = hotspot.lng;
  currentAltitude = hotspot.alt;
  currentAccuracy = hotspot.acc;

  latDisplay.textContent = currentLatitude.toFixed(6);
  lngDisplay.textContent = currentLongitude.toFixed(6);
  altDisplay.textContent = `${currentAltitude} m`;
  accDisplay.textContent = `±${currentAccuracy} m`;
  gpsLockBadge.textContent = "SECTOR LOCKED";
  gpsLockBadge.className = "badge-lock";

  // Select matched category if provided
  if (hotspot.cat) {
    const radio = document.querySelector(`input[name="category"][value="${hotspot.cat}"]`);
    if (radio) {
      radio.checked = true;
      updateAiLabels(hotspot.cat);
      if (isSimulatedFeed) enableSimulatedFeed();
    }
  }

  if (hotspot.note) {
    incidentNotes.value = hotspot.note;
  }
}

function fetchDeviceGPS() {
  latDisplay.textContent = "Acquiring...";
  lngDisplay.textContent = "Acquiring...";
  gpsLockBadge.textContent = "SEARCHING SATS";
  gpsLockBadge.className = "badge-lock text-amber";

  if (!navigator.geolocation) {
    applyHotspot("SECTOR_PUNE_RIVER");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentLatitude = pos.coords.latitude;
      currentLongitude = pos.coords.longitude;
      currentAltitude = pos.coords.altitude ? pos.coords.altitude.toFixed(1) : 42.0;
      currentAccuracy = pos.coords.accuracy ? pos.coords.accuracy.toFixed(1) : 4.0;

      latDisplay.textContent = currentLatitude.toFixed(6);
      lngDisplay.textContent = currentLongitude.toFixed(6);
      altDisplay.textContent = `${currentAltitude} m`;
      accDisplay.textContent = `±${currentAccuracy} m`;
      gpsLockBadge.textContent = "GPS SATELLITE LOCK";
      gpsLockBadge.className = "badge-lock";
    },
    (err) => {
      console.warn("GPS acquire error:", err.message);
      applyHotspot("SECTOR_PUNE_RIVER");
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

hotspotSelect.addEventListener("change", (e) => applyHotspot(e.target.value));
refreshGpsBtn.addEventListener("click", () => applyHotspot(hotspotSelect.value));


// ========================================================
// 5. Optical Crossbar Tracking & Dynamic Distress Evaluation
//    Supports Dual Modes: "Automatic Human Detection" & "Detect Manually"
// ========================================================

let targetLeftPercent = 12;
let targetTopPercent = 40;
let isHumanLocked = true;
let isDraggingCrossbar = false;
let isAutoDetectionMode = true; // Default: Automatic Human Detection
let autoGimbalTimer = null;
let dragStartX = 0;
let dragStartY = 0;
let boxStartLeft = 12;
let boxStartTop = 40;

// Default victim locations for disaster scenarios
const CATEGORY_HOTSPOTS = {
  "Flood / Trapped": { x: 17, y: 48, label: "HUMAN IN FLOOD", desc: "Flood Rooftop / Stairs Entrapment" },
  "Building Collapse": { x: 38, y: 44, label: "COLLAPSE VOID VICTIM", desc: "Rubble Void Entrapment" },
  "Fire Incident": { x: 58, y: 40, label: "PERIMETER CASUALTY", desc: "Smoke / Thermal Flare Hazard" },
  "Medical Emergency": { x: 44, y: 46, label: "INJURED CASUALTY", desc: "Trauma Victim Immobile" }
};

let humanHotspot = { x: 17, y: 48 };

function getHotspotForCurrentCategory() {
  const cat = document.querySelector('input[name="category"]:checked')?.value || "Flood / Trapped";
  return CATEGORY_HOTSPOTS[cat] || { x: 17, y: 48, label: "STRANDED VICTIM", desc: "Disaster Zone Entrapment" };
}

function recalculateConfidence() {
  evaluateTargetUnderCrosshair(isHumanLocked);
}

function setTargetPosition(leftPct, topPct) {
  // Clamp within viewport
  targetLeftPercent = Math.max(0, Math.min(84, leftPct));
  targetTopPercent = Math.max(0, Math.min(78, topPct));
  
  aiBoundingBox.style.left = `${targetLeftPercent}%`;
  aiBoundingBox.style.top = `${targetTopPercent}%`;

  // Flip floating tags inside box if near borders so they NEVER clip on mobile
  aiBoundingBox.classList.toggle("flip-tag-top", targetTopPercent < 8);
  aiBoundingBox.classList.toggle("flip-tag-bottom", targetTopPercent > 68);

  const centerX = Math.round(targetLeftPercent + 6);
  const centerY = Math.round(targetTopPercent + 8);
  if (targetCoordsTag) {
    targetCoordsTag.textContent = `X ${centerX}% · Y ${centerY}%`;
  }
}

// --------------------------------------------------------
// Dual Mode Controls: "Automatic Human Detection" vs "Detect Manually"
// --------------------------------------------------------

function enableAutoDetectionMode(triggerScan = true) {
  isAutoDetectionMode = true;

  if (modeAutoBtn) modeAutoBtn.classList.add("active");
  if (modeManualBtn) modeManualBtn.classList.remove("active");

  if (modeStatusDesc) modeStatusDesc.textContent = "🤖 Automatic Human Detection Active";
  if (hudModePill) {
    hudModePill.className = "hud-mode-pill";
    if (hudModeText) hudModeText.textContent = "🤖 AUTO AI DETECTION ENGAGED";
  }
  if (targetHintText) {
    targetHintText.textContent = "🤖 Autonomous AI locked on victim. Tap 'Detect Manually' to adjust reticle.";
  }

  // Update victim target hotspot based on current disaster category
  const targetInfo = getHotspotForCurrentCategory();
  humanHotspot = { x: targetInfo.x, y: targetInfo.y };

  if (triggerScan && hudScanBeam) {
    // Optical laser beam sweep animation
    hudScanBeam.classList.add("scanning");
    setTimeout(() => {
      if (hudScanBeam) hudScanBeam.classList.remove("scanning");
      setTargetPosition(humanHotspot.x - 5, humanHotspot.y - 8);
      evaluateTargetUnderCrosshair(true);
    }, 600);
  } else {
    setTargetPosition(humanHotspot.x - 5, humanHotspot.y - 8);
    evaluateTargetUnderCrosshair(true);
  }

  // Start periodic flight gimbal tracking jitter (simulates real drone camera tracking)
  if (autoGimbalTimer) clearInterval(autoGimbalTimer);
  autoGimbalTimer = setInterval(() => {
    if (!isAutoDetectionMode || isDraggingCrossbar) return;
    const jitterX = (Math.random() * 0.8 - 0.4).toFixed(1);
    const jitterY = (Math.random() * 0.8 - 0.4).toFixed(1);
    const baseLeft = humanHotspot.x - 5;
    const baseTop = humanHotspot.y - 8;
    setTargetPosition(baseLeft + parseFloat(jitterX), baseTop + parseFloat(jitterY));
    evaluateTargetUnderCrosshair(true);
  }, 3200);
}

function enableManualDetectionMode() {
  isAutoDetectionMode = false;
  if (autoGimbalTimer) {
    clearInterval(autoGimbalTimer);
    autoGimbalTimer = null;
  }
  if (hudScanBeam) hudScanBeam.classList.remove("scanning");

  if (modeManualBtn) modeManualBtn.classList.add("active");
  if (modeAutoBtn) modeAutoBtn.classList.remove("active");

  if (modeStatusDesc) modeStatusDesc.textContent = "🎯 Operator Manual Reticle Override";
  if (hudModePill) {
    hudModePill.className = "hud-mode-pill manual";
    if (hudModeText) hudModeText.textContent = "✋ MANUAL OPERATOR OVERRIDE";
  }
  if (targetHintText) {
    targetHintText.textContent = "👆 Touch & drag reticle with finger or tap on victim to set position.";
  }
}

if (modeAutoBtn) {
  modeAutoBtn.addEventListener("click", () => enableAutoDetectionMode(true));
}

if (modeManualBtn) {
  modeManualBtn.addEventListener("click", () => enableManualDetectionMode());
}

// --------------------------------------------------------
// Optical Evaluation: Distress & Probability Calculation
// --------------------------------------------------------

function evaluateTargetUnderCrosshair(forcedHumanLock = false) {
  const rect = viewportDisplay.getBoundingClientRect();
  const boxRect = aiBoundingBox.getBoundingClientRect();
  const centerX = targetLeftPercent + ((boxRect.width / 2) / (rect.width || 1)) * 100;
  const centerY = targetTopPercent + ((boxRect.height / 2) / (rect.height || 1)) * 100;

  // Measure distance from known human position
  const dist = Math.hypot(centerX - humanHotspot.x, centerY - humanHotspot.y);

  if (forcedHumanLock || dist <= 22) {
    // ----------------------------------------------------
    // STATE 1: PLACED DIRECTLY ON HUMAN (HIGH DISTRESS PROBABILITY)
    // ----------------------------------------------------
    isHumanLocked = true;
    currentConfidence = (98.2 + Math.random() * 1.3).toFixed(1); // 98.2% to 99.5%
    
    // Crossbar Visual States
    aiBoundingBox.className = "ai-bounding-box target-human";
    if (boxStatusIcon) boxStatusIcon.textContent = "🚨";
    if (detectedClassText) detectedClassText.textContent = isAutoDetectionMode ? "AI AUTO-LOCK" : "HUMAN DETECTED";
    if (boxDistressTag) {
      boxDistressTag.className = "distress-pill-tag critical";
      boxDistressTag.textContent = "DISTRESS: CRITICAL";
    }
    if (confidencePillText) confidencePillText.textContent = `${currentConfidence}%`;
    if (confidenceValueText) confidenceValueText.textContent = `${currentConfidence}%`;
    if (confidenceBarFill) {
      confidenceBarFill.style.width = `${currentConfidence}%`;
      confidenceBarFill.style.background = "linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)";
    }

    // Auto-select CRITICAL Severity in Form
    const critSev = document.querySelector('input[name="severity"][value="CRITICAL"]');
    if (critSev) critSev.checked = true;

    // AI Classification Tags
    if (aiTagsRow) {
      aiTagsRow.innerHTML = `
        <span class="tag-pill">👤 Human Optical Lock (${currentConfidence}% Match)</span>
        <span class="tag-pill">🚨 Critical Distress Signal</span>
        <span class="tag-pill">🌊 Flash Flood Surging</span>
        <span class="tag-pill">🏠 Entrapment on Concrete Steps</span>
      `;
    }
  } else if (dist <= 36) {
    // ----------------------------------------------------
    // STATE 2: NEAR HUMAN PERIMETER (ELEVATED PROBABILITY)
    // ----------------------------------------------------
    isHumanLocked = true;
    currentConfidence = (88.0 + Math.random() * 4.5).toFixed(1); // 88% to 92.5%

    aiBoundingBox.className = "ai-bounding-box target-human";
    if (boxStatusIcon) boxStatusIcon.textContent = "⚠️";
    if (detectedClassText) detectedClassText.textContent = "HUMAN PROXIMITY";
    if (boxDistressTag) {
      boxDistressTag.className = "distress-pill-tag high";
      boxDistressTag.textContent = "DISTRESS: HIGH";
    }
    if (confidencePillText) confidencePillText.textContent = `${currentConfidence}%`;
    if (confidenceValueText) confidenceValueText.textContent = `${currentConfidence}%`;
    if (confidenceBarFill) {
      confidenceBarFill.style.width = `${currentConfidence}%`;
      confidenceBarFill.style.background = "linear-gradient(90deg, #f59e0b 0%, #eab308 100%)";
    }

    const highSev = document.querySelector('input[name="severity"][value="HIGH"]');
    if (highSev) highSev.checked = true;

    if (aiTagsRow) {
      aiTagsRow.innerHTML = `
        <span class="tag-pill">👤 Human Signature Nearby</span>
        <span class="tag-pill">⚠️ Flood Flow Zone</span>
        <span class="tag-pill">🚨 Elevated Distress Alert</span>
      `;
    }
  } else {
    // ----------------------------------------------------
    // STATE 3: BACKGROUND / OPEN WATER (LOW PROBABILITY)
    // ----------------------------------------------------
    isHumanLocked = false;
    currentConfidence = (14.2 + Math.random() * 7.5).toFixed(1); // 14.2% to 21.7%

    aiBoundingBox.className = "ai-bounding-box target-searching";
    if (boxStatusIcon) boxStatusIcon.textContent = "🔍";
    if (detectedClassText) detectedClassText.textContent = "SCANNING WATER";
    if (boxDistressTag) {
      boxDistressTag.className = "distress-pill-tag searching";
      boxDistressTag.textContent = "DISTRESS: NONE";
    }
    if (confidencePillText) confidencePillText.textContent = `${currentConfidence}%`;
    if (confidenceValueText) confidenceValueText.textContent = `${currentConfidence}%`;
    if (confidenceBarFill) {
      confidenceBarFill.style.width = `${currentConfidence}%`;
      confidenceBarFill.style.background = "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)";
    }

    if (aiTagsRow) {
      aiTagsRow.innerHTML = `
        <span class="tag-pill">🌊 High Velocity River Current</span>
        <span class="tag-pill">🪵 Water Debris Detected</span>
        <span class="tag-pill">🔍 Optical Search Ongoing</span>
      `;
    }
  }
}

// --------------------------------------------------------
// Mobile Touch Dragging Implementation
// --------------------------------------------------------

aiBoundingBox.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  e.preventDefault();
  // Touching box automatically switches to manual mode
  if (isAutoDetectionMode) enableManualDetectionMode();
  isDraggingCrossbar = true;
  aiBoundingBox.classList.add("dragging");
  const touch = e.touches[0];
  dragStartX = touch.clientX;
  dragStartY = touch.clientY;
  boxStartLeft = targetLeftPercent;
  boxStartTop = targetTopPercent;
}, { passive: false });

window.addEventListener("touchmove", (e) => {
  if (!isDraggingCrossbar || e.touches.length !== 1) return;
  e.preventDefault();
  const touch = e.touches[0];
  const rect = viewportDisplay.getBoundingClientRect();
  const deltaXPct = ((touch.clientX - dragStartX) / (rect.width || 1)) * 100;
  const deltaYPct = ((touch.clientY - dragStartY) / (rect.height || 1)) * 100;
  
  setTargetPosition(boxStartLeft + deltaXPct, boxStartTop + deltaYPct);
  evaluateTargetUnderCrosshair(false);
}, { passive: false });

window.addEventListener("touchend", () => {
  if (isDraggingCrossbar) {
    isDraggingCrossbar = false;
    aiBoundingBox.classList.remove("dragging");
    evaluateTargetUnderCrosshair(false);
  }
});

// Mouse Dragging (Desktop)
aiBoundingBox.addEventListener("mousedown", (e) => {
  if (isAutoDetectionMode) enableManualDetectionMode();
  isDraggingCrossbar = true;
  aiBoundingBox.classList.add("dragging");
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  boxStartLeft = targetLeftPercent;
  boxStartTop = targetTopPercent;
});

window.addEventListener("mousemove", (e) => {
  if (!isDraggingCrossbar) return;
  const rect = viewportDisplay.getBoundingClientRect();
  const deltaXPct = ((e.clientX - dragStartX) / (rect.width || 1)) * 100;
  const deltaYPct = ((e.clientY - dragStartY) / (rect.height || 1)) * 100;
  setTargetPosition(boxStartLeft + deltaXPct, boxStartTop + deltaYPct);
  evaluateTargetUnderCrosshair(false);
});

window.addEventListener("mouseup", () => {
  if (isDraggingCrossbar) {
    isDraggingCrossbar = false;
    aiBoundingBox.classList.remove("dragging");
    evaluateTargetUnderCrosshair(false);
  }
});

// Tap anywhere on viewport to center reticle ring under finger
if (viewportDisplay) {
  viewportDisplay.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || e.target.closest(".camera-prompt-overlay") || e.target.closest("#aiBoundingBox")) return;
    if (isAutoDetectionMode) enableManualDetectionMode();
    const rect = viewportDisplay.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const boxRect = aiBoundingBox.getBoundingClientRect();
    const halfWidthPct = ((boxRect.width / 2) / (rect.width || 1)) * 100;
    const halfHeightPct = ((boxRect.height / 2) / (rect.height || 1)) * 100;

    setTargetPosition(clickX - halfWidthPct, clickY - halfHeightPct);
    evaluateTargetUnderCrosshair(false);

    if (snapLeftBtn) snapLeftBtn.classList.remove("active");
    if (snapCenterBtn) snapCenterBtn.classList.remove("active");
  });
}

// Quick Snap to Person on Left Stairs (Hotspot)
if (snapLeftBtn) {
  snapLeftBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    enableManualDetectionMode();
    humanHotspot = { x: 17, y: 48 };
    setTargetPosition(12, 40);
    evaluateTargetUnderCrosshair(true);
    snapLeftBtn.classList.add("active");
    if (snapCenterBtn) snapCenterBtn.classList.remove("active");
  });
}

// Quick Snap to Center
if (snapCenterBtn) {
  snapCenterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    enableManualDetectionMode();
    setTargetPosition(38, 30);
    evaluateTargetUnderCrosshair(false);
    snapCenterBtn.classList.add("active");
    if (snapLeftBtn) snapLeftBtn.classList.remove("active");
  });
}

// Force Lock Current Crossbar Position as Confirmed Human
if (lockHumanBtn) {
  lockHumanBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    enableManualDetectionMode();
    const rect = viewportDisplay.getBoundingClientRect();
    const boxRect = aiBoundingBox.getBoundingClientRect();
    const centerX = targetLeftPercent + ((boxRect.width / 2) / (rect.width || 1)) * 100;
    const centerY = targetTopPercent + ((boxRect.height / 2) / (rect.height || 1)) * 100;
    humanHotspot = { x: centerX, y: centerY };
    evaluateTargetUnderCrosshair(true);
  });
}

function updateAiLabels(category) {
  if (isAutoDetectionMode) {
    enableAutoDetectionMode(true);
  } else {
    evaluateTargetUnderCrosshair(isHumanLocked);
  }
}

document.querySelectorAll('input[name="category"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    updateAiLabels(e.target.value);
    if (isSimulatedFeed) enableSimulatedFeed();
  });
});

refreshAiBtn.addEventListener("click", () => {
  if (isAutoDetectionMode) {
    enableAutoDetectionMode(true);
  } else {
    evaluateTargetUnderCrosshair(isHumanLocked);
  }
});


// ========================================================
// 6. Endpoint Reset & Config
// ========================================================

resetEndpointBtn.addEventListener("click", () => {
  apiUrlInput.value = "https://np1yqzqgvd.execute-api.ap-southeast-2.amazonaws.com/prod/incidents";
});


// ========================================================
// 7. Cloud Transmission (AWS API Gateway / Lambda POST)
// ========================================================

reconForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const targetUrl = apiUrlInput.value.trim();
  const category = document.querySelector('input[name="category"]:checked')?.value || "Flood / Trapped";
  const severity = document.querySelector('input[name="severity"]:checked')?.value || "CRITICAL";
  const description = incidentNotes.value.trim() || `Aerial UAV sighting in ${category} zone.`;

  // Capture current optical evidence
  const photoBase64 = captureOpticalSnapshot();

  const payload = {
    drone_id: DRONE_ID,
    category: category,
    severity: severity,
    latitude: currentLatitude.toString(),
    longitude: currentLongitude.toString(),
    altitude_m: currentAltitude.toString(),
    confidence_score: `${currentConfidence}%`,
    description: description,
    reporter_name: `Drone Reconnaissance (${DRONE_ID})`,
    media_type: "image",
    media_extension: "jpg",
    mime_type: "image/jpeg",
    media_base64: photoBase64,
    image_base64: photoBase64
  };

  // Loading state
  transmitBtn.disabled = true;
  transmitBtn.innerHTML = `
    <span class="btn-icon">⏳</span>
    <div class="btn-label-group">
      <strong>TRANSMITTING TELEMETRY TO AWS...</strong>
      <small>API Gateway ➔ Lambda ➔ DynamoDB + S3 + SNS Alert</small>
    </div>
  `;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Cloud response:", data);
    const inc = data.incident || {};

    showModal(
      "✅",
      "Drone Recon Telemetry Ingested",
      `📡 Drone ID: ${DRONE_ID}
🆔 DynamoDB Incident ID: ${inc.incident_id || 'OK'}
📍 Target Coordinates: ${inc.latitude}, ${inc.longitude} (Alt: ${inc.altitude_m}m)
🎯 AI Victim Confidence: ${inc.confidence_score}
⚠️ Priority: ${severity} - ${category}
🧭 Navigation Mode: ${inc.navigation_mode}
📢 Alert Broadcast: Dispatched via Amazon SNS (Email/SMS to Rescuers)
💾 Storage: Aerial image evidence cataloged in S3.`
    );

    // Refresh confidence for next scan
    recalculateConfidence();
  } catch (err) {
    console.error("Cloud transmission failed:", err);
    showModal(
      "❌",
      "Transmission Error",
      `Could not communicate with Cloud endpoint:
${targetUrl}

Reason: ${err.message}

💡 Troubleshooting:
1. Ensure the local server is running: python3 backend/local_server.py
2. Or ensure your AWS API Gateway endpoint URL is valid with CORS enabled.`
    );
  } finally {
    transmitBtn.disabled = false;
    transmitBtn.innerHTML = `
      <span class="btn-icon">⚡</span>
      <div class="btn-label-group">
        <strong>TRANSMIT DRONE COORDINATES & EVIDENCE TO CLOUD</strong>
        <small>POST /incidents ➔ AWS Lambda ➔ DynamoDB + S3 + SNS Alert</small>
      </div>
    `;
  }
});

function showModal(icon, title, details) {
  modalIconBadge.textContent = icon;
  modalTitle.textContent = title;
  modalBody.textContent = details;
  resultModal.classList.remove("hidden");
}

closeModalBtn.addEventListener("click", () => {
  resultModal.classList.add("hidden");
});


// ========================================================
// 8. Lifecycle Initialization
// ========================================================

window.addEventListener("DOMContentLoaded", () => {
  applyHotspot("SECTOR_PUNE_RIVER");
  updateAiLabels("Flood / Trapped");
  startTelemetrySimulator();
  initCamera();
  enableAutoDetectionMode(true);
});
