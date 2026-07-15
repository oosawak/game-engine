const DEFAULT_MOTIONS = [
  {
    id: "vrm_idle_default",
    alias: "待機",
    displayName: "Idle / Wait",
    source: "motions/idle.bvh",
    tags: ["idle", "loop", "default", "safe"],
    priority: 10,
    loop: true,
    duration: "00:12",
  },
  {
    id: "motion_walk_normal",
    alias: "歩き",
    displayName: "Walk",
    source: "motions/walk.bvh",
    tags: ["loop", "locomotion", "movement"],
    priority: 30,
    loop: true,
    duration: "00:08",
  },
  {
    id: "motion_bow_polite",
    alias: "おじぎ",
    displayName: "Bow",
    source: "motions/bow.bvh",
    tags: ["gesture", "once", "pose"],
    priority: 50,
    loop: false,
    duration: "00:03",
  },
  {
    id: "motion_wave_right",
    alias: "挨拶",
    displayName: "Wave",
    source: "motions/wave.bvh",
    tags: ["emote", "once", "reaction"],
    priority: 45,
    loop: false,
    duration: "00:04",
  },
];

const DEFAULT_TAGS = [
  "",
  "idle",
  "loop",
  "locomotion",
  "gesture",
  "emote",
  "default",
  "safe",
  "once",
  "reaction",
];

const state = {
  selectedId: "",
  search: "",
  tag: "",
  playing: "Loading...",
  loading: true,
  error: "",
  saveStatus: "Unsaved",
};

const refs = {};
let motions = cloneMotionList(DEFAULT_MOTIONS);
let tags = [...DEFAULT_TAGS];
const STORAGE_KEY = "game-engine.vrm-editor.v1";

function cloneMotionList(list) {
  return list.map((motion) => ({
    ...motion,
    tags: [...(motion.tags ?? [])],
  }));
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function uniqueTags(list, providedTags = []) {
  const set = new Set([""]);

  for (const tag of providedTags) {
    if (typeof tag === "string") {
      set.add(tag.trim());
    }
  }

  for (const motion of list) {
    for (const tag of motion.tags ?? []) {
      if (typeof tag === "string" && tag.trim()) {
        set.add(tag.trim());
      }
    }
  }

  return [...set];
}

function normalizeMotion(raw, index) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `motion_${index + 1}`;
  const alias = typeof raw.alias === "string" ? raw.alias : "";
  const scriptName = typeof raw.scriptName === "string" && raw.scriptName.trim()
    ? raw.scriptName.trim()
    : id;
  const displayName = typeof raw.displayName === "string" && raw.displayName.trim()
    ? raw.displayName.trim()
    : alias || id;
  const source = typeof raw.source === "string" && raw.source.trim() ? raw.source.trim() : "unknown";
  const tagsValue = Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === "string" && tag.trim()) : [];
  const priority = Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 0;
  const loop = Boolean(raw.loop);
  const duration = typeof raw.duration === "string" && raw.duration.trim() ? raw.duration.trim() : "00:00";

  return {
    id,
    alias,
    scriptName,
    displayName,
    source,
    tags: [...tagsValue],
    priority,
    loop,
    duration,
  };
}

function applyMotionData(rawData) {
  const loadedMotions = Array.isArray(rawData?.motions)
    ? rawData.motions.map(normalizeMotion).filter(Boolean)
    : [];

  motions = loadedMotions.length ? loadedMotions : cloneMotionList(DEFAULT_MOTIONS);
  tags = uniqueTags(motions, Array.isArray(rawData?.tags) ? rawData.tags : DEFAULT_TAGS);

  if (!motions.some((motion) => motion.id === state.selectedId)) {
    state.selectedId = motions[0]?.id ?? "";
  }

  if (!state.playing || state.playing === "Loading...") {
    state.playing = motions[0]?.displayName ?? "Stopped";
  }
}

function serializeState() {
  return {
    motions: cloneMotionList(motions),
    ui: {
      selectedId: state.selectedId,
      search: state.search,
      tag: state.tag,
      playing: state.playing,
    },
  };
}

function persistState(label = "Saved locally") {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
    state.saveStatus = label;
  } catch (error) {
    state.saveStatus = "Save failed";
    state.error = "Failed to write local save data.";
  }
  render();
}

function hydrateState(snapshot) {
  const loadedMotions = Array.isArray(snapshot?.motions)
    ? snapshot.motions.map(normalizeMotion).filter(Boolean)
    : [];
  const ui = snapshot?.ui ?? {};

  applyMotionData({
    motions: loadedMotions.length ? loadedMotions : DEFAULT_MOTIONS,
    tags: snapshot?.tags,
  });

  state.selectedId = typeof ui.selectedId === "string" ? ui.selectedId : state.selectedId;
  state.search = typeof ui.search === "string" ? ui.search : state.search;
  state.tag = typeof ui.tag === "string" ? ui.tag : state.tag;
  state.playing = typeof ui.playing === "string" ? ui.playing : state.playing;

  if (!motions.some((motion) => motion.id === state.selectedId)) {
    state.selectedId = motions[0]?.id ?? "";
  }
}

function restoreSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      state.saveStatus = "No local save";
      return false;
    }

    const snapshot = JSON.parse(raw);
    hydrateState(snapshot);
    state.saveStatus = "Loaded from local save";
    state.error = "";
    return true;
  } catch (error) {
    state.saveStatus = "Load failed";
    state.error = "Failed to read local save data.";
    return false;
  }
}

function findMotionFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("motion") ?? "";
}

function getSelectedMotion() {
  return motions.find((motion) => motion.id === state.selectedId) ?? motions[0] ?? null;
}

function matchesMotion(motion) {
  const query = normalize(state.search);
  const activeTag = state.tag;

  if (activeTag && !motion.tags.includes(activeTag)) {
    return false;
  }

  if (!query) {
    return true;
  }

  const searchable = [motion.id, motion.alias, motion.displayName, motion.source, motion.tags.join(" ")].join(" ").toLowerCase();
  return searchable.includes(query);
}

function renderTagFilters() {
  refs.tagFilters.innerHTML = "";

  for (const tag of tags) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mini-button${state.tag === tag ? " active" : ""}`;
    button.textContent = tag ? `#${tag}` : "All";
    button.addEventListener("click", () => {
      state.tag = tag;
      render();
    });
    refs.tagFilters.appendChild(button);
  }
}

function renderMotionList() {
  const filtered = motions.filter(matchesMotion);
  refs.motionList.innerHTML = "";

  if (state.loading) {
    refs.motionCount.textContent = "Loading...";
    const loading = document.createElement("div");
    loading.className = "motion-card";
    loading.innerHTML = `<div class="motion-subtitle">Loading motion manifest...</div>`;
    refs.motionList.appendChild(loading);
    return;
  }

  refs.motionCount.textContent = `${filtered.length} / ${motions.length} items`;

  if (state.error) {
    const errorCard = document.createElement("div");
    errorCard.className = "motion-card";
    errorCard.innerHTML = `<div class="motion-subtitle">${state.error}</div>`;
    refs.motionList.appendChild(errorCard);
  }

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "motion-card";
    empty.innerHTML = `<div class="motion-subtitle">該当するモーションがありません。</div>`;
    refs.motionList.appendChild(empty);
    return;
  }

  for (const motion of filtered) {
    const card = document.createElement("article");
    card.className = `motion-card${motion.id === state.selectedId ? " active" : ""}`;
    card.tabIndex = 0;
    card.innerHTML = `
      <div class="motion-title"><span>${motion.displayName}</span><span>${motion.id}</span></div>
      <div class="motion-subtitle">${motion.alias || "No alias"} · ${motion.source}</div>
      <div class="tag-row">
        ${motion.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    `;
    card.addEventListener("click", () => {
      state.selectedId = motion.id;
      render();
    });
    card.addEventListener("dblclick", () => {
      window.location.href = `./vrm-motion.html?motion=${encodeURIComponent(motion.id)}`;
    });
    refs.motionList.appendChild(card);
  }
}

function renderDetails() {
  const motion = getSelectedMotion();

  if (!motion) {
    refs.detailId.textContent = "-";
    refs.detailAlias.value = "";
    refs.detailDisplayName.value = "";
    refs.detailSource.value = "";
    refs.detailTags.value = "";
    refs.detailPriority.value = "0";
    refs.detailLoop.value = "false";
    refs.overlayId.textContent = "-";
    refs.overlayAlias.textContent = "(none)";
    refs.playingLabel.textContent = "Playing: Stopped";
    refs.timelineProgress.style.width = "0%";
    refs.footerSummary.textContent = "No motion data";
    refs.saveStatus.textContent = state.saveStatus;
    return;
  }

  refs.detailId.textContent = motion.id;
  refs.detailAlias.value = motion.alias;
  refs.detailDisplayName.value = motion.displayName;
  refs.detailSource.value = motion.source;
  refs.detailTags.value = motion.tags.join(", ");
  refs.detailPriority.value = String(motion.priority);
  refs.detailLoop.value = String(motion.loop);
  refs.overlayId.textContent = motion.id;
  refs.overlayAlias.textContent = motion.alias || "(none)";
  refs.playingLabel.textContent = `Playing: ${state.playing}`;
  refs.timelineProgress.style.width = motion.loop ? "38%" : "64%";
  refs.footerSummary.textContent = state.error
    ? `${motion.displayName} / ${motion.id} · fallback data`
    : `${motion.displayName} / ${motion.id}`;
  refs.saveStatus.textContent = state.saveStatus;
}

function bindDetailInput(input, updater) {
  input.addEventListener("input", () => {
    const motion = getSelectedMotion();
    if (!motion) {
      return;
    }
    updater(motion, input.value);
    render();
  });
}

function render() {
  renderTagFilters();
  renderMotionList();
  renderDetails();
}

async function loadMotionManifest() {
  try {
    const response = await fetch(new URL("./vrm-editor-data.json", import.meta.url));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    applyMotionData(data);
    state.error = "";
  } catch (error) {
    applyMotionData(null);
    state.error = "Motion manifest could not be loaded. Using fallback data.";
  } finally {
    state.loading = false;

    const targetId = findMotionFromQuery();
    if (targetId && motions.some((motion) => motion.id === targetId)) {
      state.selectedId = targetId;
    }

    if (!state.selectedId && motions[0]) {
      state.selectedId = motions[0].id;
    }

    render();
  }
}

function init() {
  refs.motionList = document.getElementById("motionList");
  refs.motionCount = document.getElementById("motionCount");
  refs.tagFilters = document.getElementById("tagFilters");
  refs.motionSearch = document.getElementById("motionSearch");
  refs.playingLabel = document.getElementById("playingLabel");
  refs.overlayId = document.getElementById("overlayId");
  refs.overlayAlias = document.getElementById("overlayAlias");
  refs.timelineProgress = document.getElementById("timelineProgress");
  refs.footerSummary = document.getElementById("footerSummary");
  refs.detailId = document.getElementById("detailId");
  refs.detailAlias = document.getElementById("detailAlias");
  refs.detailDisplayName = document.getElementById("detailDisplayName");
  refs.detailSource = document.getElementById("detailSource");
  refs.detailTags = document.getElementById("detailTags");
  refs.detailPriority = document.getElementById("detailPriority");
  refs.detailLoop = document.getElementById("detailLoop");
  refs.playButton = document.getElementById("playButton");
  refs.stopButton = document.getElementById("stopButton");
  refs.loopButton = document.getElementById("loopButton");
  refs.saveButton = document.getElementById("saveButton");
  refs.loadButton = document.getElementById("loadButton");
  refs.seekLabel = document.getElementById("seekLabel");
  refs.saveStatus = document.getElementById("saveStatus");
  refs.tabButtons = [...document.querySelectorAll(".tab")];

  refs.motionSearch.addEventListener("input", () => {
    state.search = refs.motionSearch.value;
    render();
  });

  refs.playButton.addEventListener("click", () => {
    const motion = getSelectedMotion();
    if (!motion) {
      return;
    }
    state.playing = motion.displayName;
    render();
  });

  refs.stopButton.addEventListener("click", () => {
    state.playing = "Stopped";
    render();
  });

  refs.loopButton.addEventListener("click", () => {
    const motion = getSelectedMotion();
    if (!motion) {
      return;
    }
    motion.loop = !motion.loop;
    render();
  });

  refs.saveButton.addEventListener("click", () => {
    persistState("Saved locally");
  });

  refs.loadButton.addEventListener("click", () => {
    const restored = restoreSavedState();

    if (!restored) {
      render();
      return;
    }

    render();
  });

  refs.seekLabel.addEventListener("input", () => {
    const value = Number(refs.seekLabel.value);
    refs.timelineProgress.style.width = `${Math.max(8, Math.min(100, value))}%`;
  });

  bindDetailInput(refs.detailAlias, (motion, value) => {
    motion.alias = value;
  });
  bindDetailInput(refs.detailDisplayName, (motion, value) => {
    motion.displayName = value;
  });
  bindDetailInput(refs.detailSource, (motion, value) => {
    motion.source = value;
  });
  bindDetailInput(refs.detailTags, (motion, value) => {
    motion.tags = value.split(",").map((tag) => tag.trim()).filter(Boolean);
  });
  bindDetailInput(refs.detailPriority, (motion, value) => {
    const next = Number(value);
    if (!Number.isNaN(next)) {
      motion.priority = next;
    }
  });
  bindDetailInput(refs.detailLoop, (motion, value) => {
    motion.loop = value === "true" || value === "1" || value === "yes";
  });

  render();
  if (!restoreSavedState()) {
    loadMotionManifest();
  } else {
    state.loading = false;
    const targetId = findMotionFromQuery();
    if (targetId && motions.some((motion) => motion.id === targetId)) {
      state.selectedId = targetId;
    }
    render();
  }
}

window.addEventListener("DOMContentLoaded", init);
