const STORAGE_KEY = "game-engine.vrm-editor.v1";
const DEFAULT_TAGS = ["", "idle", "loop", "locomotion", "gesture", "emote", "default", "safe", "once", "reaction", "combat", "pose"];

const DEFAULT_MOTIONS = [
  { id: "vrm_idle_default", alias: "待機", scriptName: "vrm_idle_default", displayName: "Idle / Wait", source: "motions/idle.vrma", tags: ["idle", "loop", "default", "safe"], priority: 10, loop: true, duration: "00:12" },
  { id: "motion_walk_normal", alias: "歩き", scriptName: "motion_walk_normal", displayName: "Walk", source: "motions/walk.glb", tags: ["loop", "locomotion", "movement"], priority: 30, loop: true, duration: "00:08" },
  { id: "motion_run_fast", alias: "走り", scriptName: "motion_run_fast", displayName: "Run", source: "motions/run.glb", tags: ["loop", "locomotion", "movement"], priority: 35, loop: true, duration: "00:06" },
  { id: "motion_bow_polite", alias: "おじぎ", scriptName: "motion_bow_polite", displayName: "Bow", source: "motions/bow.vrma", tags: ["gesture", "once", "pose"], priority: 50, loop: false, duration: "00:03" },
  { id: "motion_wave_right", alias: "挨拶", scriptName: "motion_wave_right", displayName: "Wave", source: "motions/wave.vrma", tags: ["emote", "once", "reaction"], priority: 45, loop: false, duration: "00:04" },
  { id: "motion_attack_light", alias: "攻撃", scriptName: "motion_attack_light", displayName: "Attack", source: "motions/attack.glb", tags: ["combat", "once", "reaction"], priority: 70, loop: false, duration: "00:05" },
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

function cloneMotionList(list) {
  return list.map((motion) => ({ ...motion, tags: [...(motion.tags ?? [])] }));
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function normalizeMotion(raw, index) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `motion_${index + 1}`;
  const alias = typeof raw.alias === "string" ? raw.alias : "";
  const scriptName = typeof raw.scriptName === "string" && raw.scriptName.trim() ? raw.scriptName.trim() : id;
  const displayName = typeof raw.displayName === "string" && raw.displayName.trim() ? raw.displayName.trim() : alias || id;
  const source = typeof raw.source === "string" && raw.source.trim() ? raw.source.trim() : "unknown";
  const tagsValue = Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === "string" && tag.trim()) : [];
  const priority = Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 0;
  const loop = Boolean(raw.loop);
  const duration = typeof raw.duration === "string" && raw.duration.trim() ? raw.duration.trim() : "00:00";

  return { id, alias, scriptName, displayName, source, tags: [...tagsValue], priority, loop, duration };
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

function applyMotionData(rawData) {
  const loadedMotions = Array.isArray(rawData?.motions) ? rawData.motions.map(normalizeMotion).filter(Boolean) : [];
  motions = loadedMotions.length ? loadedMotions : cloneMotionList(DEFAULT_MOTIONS);
  tags = uniqueTags(motions, Array.isArray(rawData?.tags) ? rawData.tags : DEFAULT_TAGS);

  if (!motions.some((motion) => motion.id === state.selectedId)) {
    state.selectedId = motions[0]?.id ?? "";
  }
  if (!state.playing || state.playing === "Loading...") {
    state.playing = motions[0]?.displayName ?? "Stopped";
  }
}

function getSelectedMotion() {
  return motions.find((motion) => motion.id === state.selectedId) ?? motions[0] ?? null;
}

function matchesMotion(motion) {
  const query = normalize(state.search);
  if (state.tag && !motion.tags.includes(state.tag)) {
    return false;
  }
  if (!query) {
    return true;
  }
  return [motion.id, motion.alias, motion.scriptName, motion.displayName, motion.source, motion.tags.join(" ")]
    .join(" ")
    .toLowerCase()
    .includes(query);
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

function renderList() {
  const filtered = motions.filter(matchesMotion);
  refs.motionList.innerHTML = "";
  refs.motionCount.textContent = state.loading ? "Loading..." : `${filtered.length} / ${motions.length} items`;

  if (state.loading) {
    const loading = document.createElement("div");
    loading.className = "motion-card";
    loading.innerHTML = `<div class="motion-subtitle">Loading motion manifest...</div>`;
    refs.motionList.appendChild(loading);
    return;
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
    card.innerHTML = `
      <div class="motion-title"><span>${motion.displayName}</span><span>${motion.id}</span></div>
      <div class="motion-subtitle">${motion.alias || "No alias"} · ${motion.scriptName}</div>
      <div class="tag-row">${motion.tags.map((tag) => `<span class="mini-chip">${tag}</span>`).join("")}</div>
    `;
    card.addEventListener("click", () => {
      state.selectedId = motion.id;
      render();
    });
    refs.motionList.appendChild(card);
  }
}

function renderDetails() {
  const motion = getSelectedMotion();
  if (!motion) {
    return;
  }

  refs.overlayId.textContent = motion.id;
  refs.overlayScriptName.textContent = motion.scriptName;
  refs.playingLabel.textContent = `Playing: ${state.playing}`;
  refs.detailId.textContent = motion.id;
  refs.detailScriptName.value = motion.scriptName;
  refs.detailAlias.value = motion.alias;
  refs.detailDisplayName.value = motion.displayName;
  refs.detailTags.value = motion.tags.join(", ");
  refs.detailSource.value = motion.source;
  refs.detailPriority.value = String(motion.priority);
  refs.detailLoop.value = String(motion.loop);
  refs.detailDuration.textContent = motion.duration;
  refs.detailTagRow.innerHTML = motion.tags.map((tag) => `<span class="mini-chip">${tag}</span>`).join("");
  refs.footerSummary.textContent = `${motion.displayName} / ${motion.scriptName}`;
  refs.codeSnippet.textContent = [
    `const motion = motionCatalog.get("${motion.scriptName}");`,
    `player.play(motion);`,
    `// alias: ${motion.alias || "(none)"}`,
  ].join("\n");
  refs.saveStatus.textContent = state.saveStatus;
  refs.backButton.href = `./vrm-editor.html?motion=${encodeURIComponent(motion.id)}`;
}

function render() {
  renderTagFilters();
  renderList();
  renderDetails();
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
  const loadedMotions = Array.isArray(snapshot?.motions) ? snapshot.motions.map(normalizeMotion).filter(Boolean) : [];
  const ui = snapshot?.ui ?? {};

  applyMotionData({
    motions: loadedMotions.length ? loadedMotions : DEFAULT_MOTIONS,
    tags: snapshot?.tags,
  });

  state.selectedId = typeof ui.selectedId === "string" ? ui.selectedId : state.selectedId;
  state.search = typeof ui.search === "string" ? ui.search : state.search;
  state.tag = typeof ui.tag === "string" ? ui.tag : state.tag;
  state.playing = typeof ui.playing === "string" ? ui.playing : state.playing;
}

function restoreSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.saveStatus = "No local save";
      return false;
    }

    hydrateState(JSON.parse(raw));
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

async function loadManifest() {
  try {
    const response = await fetch(new URL("./vrm-editor-data.json", import.meta.url));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    applyMotionData(data);
  } catch (error) {
    applyMotionData(null);
    state.error = "Motion manifest could not be loaded. Using fallback data.";
  }
}

function bindInput(input, updater) {
  input.addEventListener("input", () => {
    const motion = getSelectedMotion();
    if (!motion) {
      return;
    }
    updater(motion, input.value);
    render();
  });
}

async function init() {
  refs.motionList = document.getElementById("motionList");
  refs.motionCount = document.getElementById("motionCount");
  refs.tagFilters = document.getElementById("tagFilters");
  refs.motionSearch = document.getElementById("motionSearch");
  refs.playingLabel = document.getElementById("playingLabel");
  refs.overlayId = document.getElementById("overlayId");
  refs.overlayScriptName = document.getElementById("overlayScriptName");
  refs.detailId = document.getElementById("detailId");
  refs.detailScriptName = document.getElementById("detailScriptName");
  refs.detailAlias = document.getElementById("detailAlias");
  refs.detailDisplayName = document.getElementById("detailDisplayName");
  refs.detailTags = document.getElementById("detailTags");
  refs.detailSource = document.getElementById("detailSource");
  refs.detailPriority = document.getElementById("detailPriority");
  refs.detailLoop = document.getElementById("detailLoop");
  refs.detailDuration = document.getElementById("detailDuration");
  refs.detailTagRow = document.getElementById("detailTagRow");
  refs.codeSnippet = document.getElementById("codeSnippet");
  refs.footerSummary = document.getElementById("footerSummary");
  refs.saveStatus = document.getElementById("saveStatus");
  refs.backButton = document.getElementById("backButton");
  refs.saveButton = document.getElementById("saveButton");
  refs.loadButton = document.getElementById("loadButton");

  await loadManifest();

  if (!restoreSavedState()) {
    const targetId = findMotionFromQuery();
    if (targetId && motions.some((motion) => motion.id === targetId)) {
      state.selectedId = targetId;
    }
    if (!state.selectedId) {
      state.selectedId = motions[0]?.id ?? "";
    }
    state.loading = false;
  } else {
    const targetId = findMotionFromQuery();
    if (targetId && motions.some((motion) => motion.id === targetId)) {
      state.selectedId = targetId;
    }
    state.loading = false;
  }

  refs.motionSearch.addEventListener("input", () => {
    state.search = refs.motionSearch.value;
    render();
  });

  refs.saveButton.addEventListener("click", () => {
    persistState("Saved locally");
  });

  refs.loadButton.addEventListener("click", () => {
    restoreSavedState();
    render();
  });

  bindInput(refs.detailScriptName, (motion, value) => { motion.scriptName = value || motion.id; });
  bindInput(refs.detailAlias, (motion, value) => { motion.alias = value; });
  bindInput(refs.detailDisplayName, (motion, value) => { motion.displayName = value; });
  bindInput(refs.detailTags, (motion, value) => { motion.tags = value.split(",").map((tag) => tag.trim()).filter(Boolean); });
  bindInput(refs.detailSource, (motion, value) => { motion.source = value; });
  bindInput(refs.detailPriority, (motion, value) => {
    const next = Number(value);
    if (!Number.isNaN(next)) {
      motion.priority = next;
    }
  });
  bindInput(refs.detailLoop, (motion, value) => {
    motion.loop = value === "true" || value === "1" || value === "yes";
  });

  render();
}

window.addEventListener("DOMContentLoaded", init);
