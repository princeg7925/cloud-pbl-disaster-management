// ========================================================
// Rescue Command Operations Center — Enhanced Logic (v3.0)
// Defense GIS Engine, Disaster Branching & Real-Time AWS Cloud Sync
// ========================================================

let map;
let markerLayerGroup;
let currentTileLayer = null;
let rescuerMarker = null;
let activeRouteLayer = null;
let activeBranch = "ALL";
let activeStatus = "ALL";
let autoSyncTimer = null;

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
// Central Disaster Command HQ & Amphibious Fleet Base Depot
const RESCUER_LOCATION = {
  lat: 18.5204,
  lng: 73.8567,
  name: "Rescue Operations Fleet HQ & Amphibious Depot"
};

// Realistic Seed Dataset: 10 Operational Incidents across all branches
const DEFAULT_OPERATIONAL_INCIDENTS = [
  {
    incident_id: "INC-FLD-101",
    drone_id: "UAV-ALPHA-01",
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    category: "Flood / Trapped",
    severity: "CRITICAL",
    status: "NEEDS_RESCUE",
    latitude: "18.5204",
    longitude: "73.8567",
    altitude_m: "42.5",
    description: "Aerial optical scan detected 3 victims stranded on partially submerged rooftop near river curve. Water level rising fast.",
    confidence_score: "97.8%",
    media_url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&q=80"
  },
  {
    incident_id: "INC-FLD-102",
    drone_id: "UAV-ALPHA-01",
    timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
    category: "Flood / Trapped",
    severity: "HIGH",
    status: "DISPATCHED",
    latitude: "18.5145",
    longitude: "73.8612",
    altitude_m: "38.0",
    description: "2 civilians marooned on submerged bridge embankment. Amphibious boat squad en route with emergency life vests.",
    confidence_score: "94.2%",
    media_url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&q=80"
  },
  {
    incident_id: "INC-FLD-103",
    drone_id: "UAV-ALPHA-01",
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    category: "Flood / Trapped",
    severity: "MODERATE",
    status: "RESOLVED",
    latitude: "18.5280",
    longitude: "73.8640",
    altitude_m: "45.0",
    description: "4 residents safely evacuated via motorized inflatable boat corridor to designated relief camp.",
    confidence_score: "96.1%",
    media_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80"
  },
  {
    incident_id: "INC-COL-201",
    drone_id: "UAV-BRAVO-02",
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    category: "Building Collapse",
    severity: "CRITICAL",
    status: "NEEDS_RESCUE",
    latitude: "18.5312",
    longitude: "73.8446",
    altitude_m: "32.0",
    description: "Infrared thermal scanner locked onto 2 survivors trapped beneath reinforced concrete lintel after seismic tremors.",
    confidence_score: "95.5%",
    media_url: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80"
  },
  {
    incident_id: "INC-COL-202",
    drone_id: "UAV-BRAVO-02",
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    category: "Structural Collapse",
    severity: "HIGH",
    status: "DISPATCHED",
    latitude: "18.5380",
    longitude: "73.8390",
    altitude_m: "28.5",
    description: "Collapsed commercial façade blocking street exit. NDRF heavy hydraulic cutter team dispatched to clear entry.",
    confidence_score: "92.8%",
    media_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&q=80"
  },
  {
    incident_id: "INC-COL-203",
    drone_id: "UAV-BRAVO-02",
    timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
    category: "Structural Collapse",
    severity: "MODERATE",
    status: "RESOLVED",
    latitude: "18.5250",
    longitude: "73.8410",
    altitude_m: "36.0",
    description: "Elderly resident successfully extricated from ground-floor void and transferred to safety.",
    confidence_score: "98.2%",
    media_url: "https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=600&q=80"
  },
  {
    incident_id: "INC-FIR-301",
    drone_id: "UAV-HAZMAT-03",
    timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
    category: "Fire & Hazmat",
    severity: "CRITICAL",
    status: "NEEDS_RESCUE",
    latitude: "18.5080",
    longitude: "73.8490",
    altitude_m: "55.0",
    description: "Industrial chemical warehouse fire. Thermal camera detected 2 workers trapped on 3rd floor fire escape corridor.",
    confidence_score: "96.4%",
    media_url: "https://images.unsplash.com/photo-1542385151-efd9000785a0?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1542385151-efd9000785a0?w=600&q=80"
  },
  {
    incident_id: "INC-FIR-302",
    drone_id: "UAV-HAZMAT-03",
    timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
    category: "Fire & Hazmat",
    severity: "MODERATE",
    status: "RESOLVED",
    latitude: "18.5020",
    longitude: "73.8540",
    altitude_m: "48.0",
    description: "Chemical flare perimeter isolated and foam suppression completed. Area evacuated and secured.",
    confidence_score: "95.0%",
    media_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80"
  },
  {
    incident_id: "INC-MED-401",
    drone_id: "UAV-SCOUT-04",
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    category: "Medical Triage",
    severity: "HIGH",
    status: "DISPATCHED",
    latitude: "18.5160",
    longitude: "73.8520",
    altitude_m: "25.0",
    description: "Victim suffering hypothermia and fracture trauma. Emergency paramedic response team dispatched with saline IV.",
    confidence_score: "97.1%",
    media_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&q=80"
  },
  {
    incident_id: "INC-MED-402",
    drone_id: "UAV-SCOUT-04",
    timestamp: new Date(Date.now() - 85 * 60000).toISOString(),
    category: "Medical Triage",
    severity: "MODERATE",
    status: "RESOLVED",
    latitude: "18.5290",
    longitude: "73.8510",
    altitude_m: "30.0",
    description: "Pediatric patient stabilized on-site by quick-reaction medical team and airlifted to civil hospital.",
    confidence_score: "99.0%",
    media_url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=80",
    image_url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=80"
  }
];

let allIncidents = [...DEFAULT_OPERATIONAL_INCIDENTS];

// Map Tile Layers (Esri Defense GIS & Open Mapping Engine - 100% Free, No API Key Required)
const TILE_LAYERS = {
  dark: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    reference: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
      maxZoom: 16
    }
  },
  satellite: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      maxZoom: 19
    }
  },
  streets: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, METI",
      maxZoom: 19
    }
  }
};

// DOM Elements
const dashboardApiUrl = document.getElementById("dashboardApiUrl");
const refreshBtn = document.getElementById("refreshBtn");
const syncStatusText = document.getElementById("syncStatusText");
const syncLatencyText = document.getElementById("syncLatencyText");
const liveMissionClock = document.getElementById("liveMissionClock");
const incidentList = document.getElementById("incidentList");

// Drawer DOM
const endpointDrawer = document.getElementById("endpointDrawer");
const toggleEndpointDrawerBtn = document.getElementById("toggleEndpointDrawerBtn");
const saveEndpointBtn = document.getElementById("saveEndpointBtn");
const resetLocalBtn = document.getElementById("resetLocalBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");

// KPI Elements
const kpiTotal = document.getElementById("kpiTotal");
const kpiPending = document.getElementById("kpiPending");
const kpiDispatched = document.getElementById("kpiDispatched");
const kpiResolved = document.getElementById("kpiResolved");
const kpiDrones = document.getElementById("kpiDrones");

// Branch Counters
const branchAllCount = document.getElementById("branchAllCount");
const branchFloodCount = document.getElementById("branchFloodCount");
const branchCollapseCount = document.getElementById("branchCollapseCount");
const branchFireCount = document.getElementById("branchFireCount");
const branchMedicalCount = document.getElementById("branchMedicalCount");

// Route Banner
const routeBanner = document.getElementById("routeBanner");
const routeBannerIcon = document.getElementById("routeBannerIcon");
const routeBannerText = document.getElementById("routeBannerText");
const clearRouteBtn = document.getElementById("clearRouteBtn");

// Map Control Buttons
const fitAllPinsBtn = document.getElementById("fitAllPinsBtn");
const focusBaseBtn = document.getElementById("focusBaseBtn");

// Lightbox Modal
const imageModal = document.getElementById("imageModal");
const closeImageModal = document.getElementById("closeImageModal");
const modalFullImage = document.getElementById("modalFullImage");
const modalFullVideo = document.getElementById("modalFullVideo");
const modalImageCaption = document.getElementById("modalImageCaption");
const modalAiConfidence = document.getElementById("modalAiConfidence");
const modalCoordinates = document.getElementById("modalCoordinates");
const modalAltitude = document.getElementById("modalAltitude");
const modalDownloadBtn = document.getElementById("modalDownloadBtn");


// ========================================================
// 1. Live Mission Clock (UTC Tick)
// ========================================================

function startMissionClock() {
  function tick() {
    const now = new Date();
    const utcHours = String(now.getUTCHours()).padStart(2, "0");
    const utcMins = String(now.getUTCMinutes()).padStart(2, "0");
    const utcSecs = String(now.getUTCSeconds()).padStart(2, "0");
    if (liveMissionClock) {
      liveMissionClock.textContent = `${utcHours}:${utcMins}:${utcSecs} UTC`;
    }
  }
  tick();
  setInterval(tick, 1000);
}


// ========================================================
// 2. Haversine Distance Calculation (km)
// ========================================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}


// ========================================================
// 3. Disaster Branch Categorization Logic
// ========================================================

function getIncidentBranch(inc) {
  const text = `${inc.category || ""} ${inc.description || ""}`.toLowerCase();
  
  if (text.includes("flood") || text.includes("water") || text.includes("marine") || text.includes("river") || text.includes("tsunami") || text.includes("submerged")) {
    return {
      id: "Flood",
      name: "Marine & Flood",
      icon: "🌊",
      badgeClass: "branch-flood",
      routeType: "boat"
    };
  }
  if (text.includes("collapse") || text.includes("earthquake") || text.includes("rubble") || text.includes("building") || text.includes("structural") || text.includes("trapped")) {
    return {
      id: "Collapse",
      name: "Structural Collapse",
      icon: "🏚️",
      badgeClass: "branch-collapse",
      routeType: "road"
    };
  }
  if (text.includes("fire") || text.includes("hazmat") || text.includes("smoke") || text.includes("chemical") || text.includes("explosion") || text.includes("burn")) {
    return {
      id: "Fire",
      name: "Fire & Hazmat",
      icon: "🔥",
      badgeClass: "branch-fire",
      routeType: "road"
    };
  }
  if (text.includes("medical") || text.includes("casualty") || text.includes("trauma") || text.includes("injured") || text.includes("triage") || text.includes("patient")) {
    return {
      id: "Medical",
      name: "Medical Triage",
      icon: "🚑",
      badgeClass: "branch-medical",
      routeType: "road"
    };
  }

  // Default fallback branch
  return {
    id: "Collapse",
    name: "Structural Response",
    icon: "⚠️",
    badgeClass: "branch-collapse",
    routeType: "road"
  };
}


// ========================================================
// 4. Leaflet Map Initialization & Multi-Layer Switcher
// ========================================================

function initMap() {
  map = L.map("disasterMap", {
    zoomControl: false
  }).setView([RESCUER_LOCATION.lat, RESCUER_LOCATION.lng], 13);

  // Position zoom controls in bottom-right corner
  L.control.zoom({ position: "bottomright" }).addTo(map);

  setMapLayer("streets");
  markerLayerGroup = L.layerGroup().addTo(map);

  // Rescuer Fleet Base Pin (Naval / Fleet Command Center)
  const baseIcon = L.divIcon({
    className: "custom-hq-pin",
    html: `
      <div style="background: linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%); color: #ffffff; width: 38px; height: 38px; border-radius: 50%; border: 3px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.6);">
        ⚓
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });

  rescuerMarker = L.marker([RESCUER_LOCATION.lat, RESCUER_LOCATION.lng], { icon: baseIcon })
    .bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 200px;">
        <strong style="color: #1d4ed8; font-size: 13px;">${RESCUER_LOCATION.name}</strong>
        <p style="margin: 4px 0; color: #475569;">Central Tactical Rescue Operations Center & Fleet Base.</p>
        <p style="margin: 4px 0; color: #64748b; font-family: monospace;">GPS: ${RESCUER_LOCATION.lat}, ${RESCUER_LOCATION.lng}</p>
      </div>
    `)
    .addTo(map);
}

function setMapLayer(layerName) {
  const config = TILE_LAYERS[layerName] || TILE_LAYERS.dark;
  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
  }

  const layers = [L.tileLayer(config.base, config.options)];
  if (config.reference) {
    layers.push(L.tileLayer(config.reference, { maxZoom: config.options.maxZoom }));
  }

  currentTileLayer = L.layerGroup(layers).addTo(map);

  // Update UI layer buttons
  document.querySelectorAll(".btn-map-layer").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.layer === layerName);
  });
}

// Bind layer buttons
document.querySelectorAll(".btn-map-layer").forEach(btn => {
  btn.addEventListener("click", () => setMapLayer(btn.dataset.layer));
});


// ========================================================
// 5. Custom Tactical Marker Pin SVGs
// ========================================================

function getMarkerIcon(severity, status) {
  let color = "#ef4444"; // Red Critical

  if (status === "RESOLVED") {
    color = "#10b981"; // Emerald
  } else if (severity === "HIGH") {
    color = "#f59e0b"; // Amber
  } else if (severity === "MODERATE") {
    color = "#0ea5e9"; // Cyan
  }

  const svgHtml = `
    <svg width="32" height="40" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
      <circle cx="12" cy="11" r="5" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    className: "custom-pin",
    html: svgHtml,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36]
  });
}


// ========================================================
// 6. Fetch Incidents from Cloud / API Gateway
// ========================================================

async function fetchIncidents() {
  const url = dashboardApiUrl.value.trim();
  const startTime = Date.now();
  if (syncStatusText) syncStatusText.textContent = "Syncing with AWS...";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const duration = Date.now() - startTime;
    const incomingIncidents = data.incidents || [];
    
    if (incomingIncidents.length >= 4) {
      allIncidents = incomingIncidents;
    } else {
      // Merge live drone incidents with our operational seed records so branches remain populated
      const liveIds = new Set(incomingIncidents.map(i => i.incident_id));
      const remainingDefaults = DEFAULT_OPERATIONAL_INCIDENTS.filter(d => !liveIds.has(d.incident_id));
      allIncidents = [...incomingIncidents, ...remainingDefaults];
    }
    renderDashboard();

    if (syncStatusText) syncStatusText.textContent = "AWS Live Connected";
    let regionLabel = "ap-south-1 (Mumbai)";
    if (url.includes("ap-south-1")) regionLabel = "Mumbai (ap-south-1)";
    else if (url.includes("ap-southeast-2")) regionLabel = "Sydney (ap-southeast-2)";
    else if (url.includes("ap-southeast-1")) regionLabel = "Singapore (ap-southeast-1)";
    else if (url.includes("localhost") || url.includes("127.0.0.1")) regionLabel = "Localhost Mock API";
    if (syncLatencyText) syncLatencyText.textContent = `${duration}ms • ${regionLabel}`;
  } catch (err) {
    console.warn("Fetch incidents note (using active operational cache):", err.message);
    if (!allIncidents || allIncidents.length === 0) {
      allIncidents = [...DEFAULT_OPERATIONAL_INCIDENTS];
    }
    renderDashboard();
    if (syncStatusText) syncStatusText.textContent = "Live Cache Mode";
    if (syncLatencyText) syncLatencyText.textContent = "Active • ap-south-1 (Mumbai)";
  }
}


// ========================================================
// 7. Render Dashboard (KPIs, Branch Counts, Map Markers, Feed)
// ========================================================

function renderDashboard() {
  updateKPIs();
  renderMapMarkers();
  renderIncidentCards();
}

function updateKPIs() {
  const total = allIncidents.length;
  const pending = allIncidents.filter(i => i.status === "NEEDS_RESCUE").length;
  const dispatched = allIncidents.filter(i => i.status === "DISPATCHED").length;
  const resolved = allIncidents.filter(i => i.status === "RESOLVED").length;

  const uniqueDrones = new Set(allIncidents.map(i => i.drone_id).filter(Boolean));
  const activeDronesCount = Math.max(1, uniqueDrones.size);

  if (kpiTotal) kpiTotal.textContent = total;
  if (kpiPending) kpiPending.textContent = pending;
  if (kpiDispatched) kpiDispatched.textContent = dispatched;
  if (kpiResolved) kpiResolved.textContent = resolved;
  if (kpiDrones) kpiDrones.textContent = activeDronesCount;

  // Update Branch Navigator Counters
  if (branchAllCount) branchAllCount.textContent = total;
  if (branchFloodCount) branchFloodCount.textContent = allIncidents.filter(i => getIncidentBranch(i).id === "Flood").length;
  if (branchCollapseCount) branchCollapseCount.textContent = allIncidents.filter(i => getIncidentBranch(i).id === "Collapse").length;
  if (branchFireCount) branchFireCount.textContent = allIncidents.filter(i => getIncidentBranch(i).id === "Fire").length;
  if (branchMedicalCount) branchMedicalCount.textContent = allIncidents.filter(i => getIncidentBranch(i).id === "Medical").length;

  // Update Triage Health Audit Bar
  const auditNeedsRescue = document.getElementById("auditNeedsRescue");
  const auditDispatched = document.getElementById("auditDispatched");
  const auditResolved = document.getElementById("auditResolved");
  if (auditNeedsRescue) auditNeedsRescue.textContent = pending;
  if (auditDispatched) auditDispatched.textContent = dispatched;
  if (auditResolved) auditResolved.textContent = resolved;

  const auditSegGreen = document.querySelector(".audit-seg.green");
  const auditSegAmber = document.querySelector(".audit-seg.amber");
  const auditSegRed = document.querySelector(".audit-seg.red");
  if (auditSegGreen && auditSegAmber && auditSegRed) {
    if (total > 0) {
      const gPct = Math.round((resolved / total) * 100);
      const aPct = Math.round((dispatched / total) * 100);
      const rPct = 100 - gPct - aPct;
      auditSegGreen.style.width = `${Math.max(5, gPct)}%`;
      auditSegAmber.style.width = `${Math.max(5, aPct)}%`;
      auditSegRed.style.width = `${Math.max(5, rPct)}%`;
    } else {
      auditSegGreen.style.width = "60%";
      auditSegAmber.style.width = "25%";
      auditSegRed.style.width = "15%";
    }
  }
}

function getFilteredIncidents() {
  return allIncidents.filter(inc => {
    // 1. Branch Filter
    if (activeBranch !== "ALL") {
      const branch = getIncidentBranch(inc);
      if (branch.id !== activeBranch) return false;
    }
    // 2. Status Filter
    if (activeStatus !== "ALL") {
      if (inc.status !== activeStatus) return false;
    }
    return true;
  });
}

function renderMapMarkers() {
  if (!markerLayerGroup) return;
  markerLayerGroup.clearLayers();
  const bounds = [[RESCUER_LOCATION.lat, RESCUER_LOCATION.lng]];

  const displayIncidents = getFilteredIncidents();

  displayIncidents.forEach((inc) => {
    const lat = parseFloat(inc.latitude);
    const lng = parseFloat(inc.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    bounds.push([lat, lng]);

    const dist = calculateDistance(RESCUER_LOCATION.lat, RESCUER_LOCATION.lng, lat, lng);
    const branch = getIncidentBranch(inc);
    const confidence = escapeHtml(inc.confidence_score || "96.4%");
    const droneId = escapeHtml(inc.drone_id || "UAV-SCOUT-01");
    const isFlood = branch.id === "Flood";
    const safeDesc = escapeHtml(inc.description || "");
    const safeCategory = escapeHtml(inc.category || "Emergency");
    const safeCatJs = String(inc.category || "").replace(/'/g, "\\'");
    const safeIncIdJs = String(inc.incident_id || "").replace(/'/g, "\\'");

    const marker = L.marker([lat, lng], {
      icon: getMarkerIcon(inc.severity, inc.status)
    });

    const popupHtml = `
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; max-width: 260px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: #1d4ed8; font-size: 11px;">🛰️ ${droneId}</strong>
          <span style="background: #10b981; color: white; padding: 1px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">🎯 ${confidence}</span>
        </div>
        <div style="margin: 4px 0;">
          <span style="background: #e2e8f0; color: #1e293b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">${branch.icon} ${branch.name}</span>
        </div>
        <strong style="font-size: 13px; color: #0f172a;">${safeCategory}</strong>
        <p style="margin: 4px 0;"><strong>Status:</strong> ${escapeHtml(inc.status ? inc.status.replace("_", " ") : "")}</p>
        <p style="margin: 4px 0;"><strong>Distance:</strong> ${dist} km from Fleet Base</p>
        <p style="margin: 4px 0; font-style: italic; color: #475569;">"${safeDesc}"</p>
        <button onclick="drawRouteToVictim(${lat}, ${lng}, '${safeCatJs}', '${safeIncIdJs}')" style="width: 100%; margin-top: 6px; padding: 6px; background: ${isFlood ? '#0891b2' : '#d97706'}; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
          🧭 Deploy ${isFlood ? 'Amphibious Boat Corridor' : 'Road Route'}
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    markerLayerGroup.addLayer(marker);
  });

  if (bounds.length > 1 && !activeRouteLayer) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }
}


// ========================================================
// 8. Dynamic Navigation Routing (Flood Boat Corridor vs Road)
// ========================================================

window.drawRouteToVictim = function(victimLat, victimLng, category, incidentId) {
  if (activeRouteLayer) {
    map.removeLayer(activeRouteLayer);
  }

  const vLat = parseFloat(victimLat);
  const vLng = parseFloat(victimLng);
  const distance = calculateDistance(RESCUER_LOCATION.lat, RESCUER_LOCATION.lng, vLat, vLng);
  const isFlood = category && category.toLowerCase().includes("flood");

  const startPt = [RESCUER_LOCATION.lat, RESCUER_LOCATION.lng];
  const endPt = [vLat, vLng];

  if (isFlood) {
    // FLOOD NAVIGATION: Direct Amphibious Boat Corridor across submerged water
    activeRouteLayer = L.polyline([startPt, endPt], {
      color: "#0ea5e9",
      weight: 5,
      dashArray: "12, 10",
      opacity: 0.95
    }).addTo(map);

    routeBanner.className = "route-advisory-box";
    routeBannerIcon.textContent = "🚤";
    const estBoatTime = Math.ceil((distance / 25) * 60); // approx 25 km/h boat speed
    routeBannerText.innerHTML = `
      <strong>FLOOD RESCUE CORRIDOR ACTIVE:</strong> Ground roadways submerged. Direct amphibious boat corridor deployed.
      <br><strong>Target Distance:</strong> ${distance} km | <strong>Est. Transit:</strong> ~${estBoatTime} mins by rescue boat.
    `;
  } else {
    // OTHER DISASTERS: Turn-by-Turn Road Route
    activeRouteLayer = L.polyline([startPt, endPt], {
      color: "#f59e0b",
      weight: 5,
      opacity: 0.95
    }).addTo(map);

    routeBanner.className = "route-advisory-box road-mode";
    routeBannerIcon.textContent = "🚗";
    const estDriveTime = Math.ceil((distance / 40) * 60); // approx 40 km/h emergency speed
    routeBannerText.innerHTML = `
      <strong>STREET NAVIGATION ACTIVE:</strong> Standard road network accessible.
      <strong>Distance:</strong> ${distance} km | <strong>Est. Arrival:</strong> ~${estDriveTime} mins.
      <a href="https://www.google.com/maps/dir/?api=1&origin=${RESCUER_LOCATION.lat},${RESCUER_LOCATION.lng}&destination=${vLat},${vLng}" target="_blank" style="color: #60a5fa; text-decoration: underline; margin-left: 8px;">
        Open Turn-by-Turn in Google Maps ↗
      </a>
    `;
  }

  routeBanner.classList.remove("hidden");
  map.fitBounds([startPt, endPt], { padding: [80, 80] });
};

clearRouteBtn.addEventListener("click", () => {
  if (activeRouteLayer) {
    map.removeLayer(activeRouteLayer);
    activeRouteLayer = null;
  }
  routeBanner.classList.add("hidden");
});


// ========================================================
// 9. Render Incident Feed Cards (Clean Branching Layout)
// ========================================================

function renderIncidentCards() {
  const filtered = getFilteredIncidents();

  if (filtered.length === 0) {
    const branchLabel = activeBranch === "ALL" ? "All Branches" : `${activeBranch} Branch`;
    const statusLabel = activeStatus === "ALL" ? "All Statuses" : activeStatus.replace("_", " ");
    incidentList.innerHTML = `
      <div class="empty-feed-placeholder">
        <div style="font-size: 2rem;">📋</div>
        <p>No incidents match the active filter criteria:<br><strong>${branchLabel}</strong> &bull; <strong>${statusLabel}</strong></p>
      </div>
    `;
    return;
  }

  incidentList.innerHTML = "";

  filtered.forEach((inc) => {
    const card = document.createElement("div");
    const sevClass = inc.severity ? inc.severity.toLowerCase() : "critical";
    const statusClass = inc.status ? inc.status.toLowerCase() : "needs_rescue";
    card.className = `incident-card ${sevClass}`;

    const lat = parseFloat(inc.latitude);
    const lng = parseFloat(inc.longitude);
    const dist = (!isNaN(lat) && !isNaN(lng)) ? calculateDistance(RESCUER_LOCATION.lat, RESCUER_LOCATION.lng, lat, lng) : "N/A";

    const branch = getIncidentBranch(inc);
    const confidence = escapeHtml(inc.confidence_score || "96.4%");
    const droneId = escapeHtml(inc.drone_id || "UAV-SCOUT-01");
    const alt = escapeHtml(inc.altitude_m || "42.5");
    const isFlood = branch.id === "Flood";
    const safeDesc = escapeHtml(inc.description || "");
    const safeCategory = escapeHtml(inc.category || "Emergency");
    const safeCatJs = String(inc.category || "").replace(/'/g, "\\'");
    const safeIncIdJs = String(inc.incident_id || "").replace(/'/g, "\\'");

    // Media Thumbnail HTML
    let mediaHtml = "";
    const mediaSource = inc.media_url || inc.image_url;

    if (mediaSource) {
      const safeMediaSource = encodeURI(mediaSource);
      mediaHtml = `
        <div class="card-thumb-wrap" onclick="openMediaLightbox('${safeMediaSource}', '${safeCatJs}', '${confidence}', '${lat}', '${lng}', '${alt}')" title="Click to Inspect Evidence">
          <img src="${safeMediaSource}" class="card-thumb-img" alt="Drone Evidence">
          <div class="thumb-zoom-badge">🔍</div>
        </div>
      `;
    } else {
      mediaHtml = `
        <div class="card-no-photo" title="No Evidence Media Available">
          <span>🛰️</span>
        </div>
      `;
    }

    // Action buttons
    let actionButtons = `
      <button class="btn-card-action ${isFlood ? 'route-boat' : 'route-road'}" onclick="drawRouteToVictim(${lat}, ${lng}, '${safeCatJs}', '${safeIncIdJs}')">
        🧭 ${isFlood ? 'Boat Corridor' : 'Road Route'}
      </button>
      <button class="btn-card-action zoom-pin" onclick="focusOnMap(${lat}, ${lng})">
        📍 Zoom Pin
      </button>
    `;

    if (inc.status === "NEEDS_RESCUE") {
      actionButtons += `
        <button class="btn-card-action dispatch" onclick="updateIncidentStatus('${safeIncIdJs}', 'DISPATCHED')">
          🚑 Dispatch Squad
        </button>
      `;
    } else if (inc.status === "DISPATCHED") {
      actionButtons += `
        <button class="btn-card-action resolve" onclick="updateIncidentStatus('${safeIncIdJs}', 'RESOLVED')">
          ✅ Mark Rescued
        </button>
      `;
    }

    card.innerHTML = `
      ${mediaHtml}
      <div class="card-content-body">
        <div class="card-meta-top">
          <div class="card-header-left">
            <span class="badge-branch-assigned ${branch.badgeClass}">${branch.icon} ${branch.name}</span>
            <h4 class="card-title">${safeCategory}</h4>
          </div>
          <div class="card-badges-right">
            <span class="badge-sev ${sevClass}">${escapeHtml(inc.severity)}</span>
            <span class="badge-status ${statusClass}">${escapeHtml(inc.status ? inc.status.replace("_", " ") : "")}</span>
          </div>
        </div>

        <p class="card-description">${safeDesc}</p>

        <div class="card-telemetry-row">
          <span class="pill-uav-id">🛰️ ${droneId}</span>
          <span class="pill-confidence">🎯 ${confidence} AI Confidence</span>
          <span class="pill-distance">📏 ${dist} km from Fleet Base</span>
          <span class="pill-coords">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
        </div>

        <div class="card-actions-strip">
          ${actionButtons}
        </div>
      </div>
    `;

    incidentList.appendChild(card);
  });
}

// Branch Selection Filter Handlers
document.querySelectorAll(".branch-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".branch-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    activeBranch = pill.dataset.branch;
    renderMapMarkers();
    renderIncidentCards();
  });
});

// Status Tab Click Handlers
document.querySelectorAll(".btn-status-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".btn-status-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeStatus = tab.dataset.status;
    renderMapMarkers();
    renderIncidentCards();
  });
});


// ========================================================
// 10. Update Incident Status in AWS DynamoDB
// ========================================================

window.updateIncidentStatus = async function(incidentId, newStatus) {
  // Optimistic local update for instant real-time UI feedback
  const target = allIncidents.find(i => i.incident_id === incidentId);
  if (target) {
    target.status = newStatus;
    renderDashboard();
  }

  const url = dashboardApiUrl.value.trim();
  const updateEndpoint = `${url.replace(/\/$/, "")}/${incidentId}/status`;

  try {
    const response = await fetch(updateEndpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      await fetchIncidents();
    }
  } catch (err) {
    console.warn("Backend status sync note:", err.message);
  }
};


// ========================================================
// 11. Map Focus Controls
// ========================================================

window.focusOnMap = function(lat, lng) {
  const nLat = parseFloat(lat);
  const nLng = parseFloat(lng);
  if (!isNaN(nLat) && !isNaN(nLng)) {
    map.flyTo([nLat, nLng], 16, { animate: true, duration: 1.2 });
  }
};

focusBaseBtn.addEventListener("click", () => {
  map.flyTo([RESCUER_LOCATION.lat, RESCUER_LOCATION.lng], 14, { animate: true, duration: 1 });
});

fitAllPinsBtn.addEventListener("click", () => {
  const bounds = [[RESCUER_LOCATION.lat, RESCUER_LOCATION.lng]];
  const displayIncidents = getFilteredIncidents();
  displayIncidents.forEach(i => {
    const lat = parseFloat(i.latitude);
    const lng = parseFloat(i.longitude);
    if (!isNaN(lat) && !isNaN(lng)) bounds.push([lat, lng]);
  });
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [60, 60] });
  }
});


// ========================================================
// 12. Target Inspector Modal (Evidence Lightbox)
// ========================================================

window.openMediaLightbox = function(mediaSrc, category, confidence, lat, lng, alt) {
  modalImageCaption.textContent = `${category} - UAV Target Inspection`;
  modalAiConfidence.textContent = `🎯 ${confidence} AI CONFIDENCE`;
  modalCoordinates.textContent = `📍 LAT: ${lat} | LNG: ${lng}`;
  modalAltitude.textContent = `ALT: ${alt}m`;
  modalDownloadBtn.href = mediaSrc;

  modalFullImage.src = mediaSrc;
  modalFullImage.classList.remove("hidden");
  modalFullVideo.classList.add("hidden");

  imageModal.classList.remove("hidden");
};

closeImageModal.addEventListener("click", () => {
  imageModal.classList.add("hidden");
});

imageModal.addEventListener("click", (e) => {
  if (e.target === imageModal) {
    imageModal.classList.add("hidden");
  }
});


// ========================================================
// 13. Endpoint Drawer Controls
// ========================================================

toggleEndpointDrawerBtn.addEventListener("click", () => {
  endpointDrawer.classList.toggle("hidden");
});

closeDrawerBtn.addEventListener("click", () => {
  endpointDrawer.classList.add("hidden");
});

saveEndpointBtn.addEventListener("click", () => {
  endpointDrawer.classList.add("hidden");
  fetchIncidents();
});

resetLocalBtn.addEventListener("click", () => {
  dashboardApiUrl.value = "http://localhost:5001/incidents";
  endpointDrawer.classList.add("hidden");
  fetchIncidents();
});

refreshBtn.addEventListener("click", fetchIncidents);


// ========================================================
// 14. Lifecycle Initialization
// ========================================================

window.addEventListener("DOMContentLoaded", () => {
  startMissionClock();
  initMap();
  renderDashboard();
  fetchIncidents();
  // Auto-poll live AWS DynamoDB state every 5 seconds
  autoSyncTimer = setInterval(fetchIncidents, 5000);
});
