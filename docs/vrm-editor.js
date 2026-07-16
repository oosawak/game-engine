import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { BVHLoader } from "three/addons/loaders/BVHLoader.js";

const DEFAULT_MOTIONS = [];

const DEFAULT_TAGS = [
  "",
  "idle",
  "loop",
  "locomotion",
  "movement",
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
  isPlaying: false,
  playbackMotionId: "",
  playbackTime: 0,
  playbackProgress: 0,
  loading: true,
  error: "",
  saveStatus: "Unsaved",
  sceneCameraPreset: "front",
  previewRotationY: 0,
  previewAutoRotate: false,
  showBonePreview: true,
  previewZoom: 1,
  previewOffsetX: 0,
  previewOffsetY: 0,
  previewDragging: false,
  bonePreviewZoom: 1,
  loadedVrmName: "",
  loadedVrmUrl: "",
  loadedVrmToken: 0,
  boneMap: {
    hips: "",
    chest: "",
    head: "",
    leftArm: "",
    rightArm: "",
    leftLeg: "",
    rightLeg: "",
  },
  selectedBoneKey: "",
};

const refs = {};
let motions = cloneMotionList(DEFAULT_MOTIONS);
let tags = [...DEFAULT_TAGS];
let vrmPreview = null;
let vrmPreviewScene = null;
let vrmPreviewCamera = null;
let vrmPreviewRenderer = null;
let vrmPreviewRoot = null;
let vrmPreviewAvatarRoot = null;
let vrmPreviewContentRoot = null;
let vrmPreviewModelRoot = null;
let vrmPreviewRig = null;
let vrmPreviewModelParts = null;
let vrmPreviewBoneOptions = [];
let vrmPreviewBoneMarker = null;
let vrmPreviewBoneMarkerLabel = null;
let vrmPreviewFrame = 0;
let vrmPreviewLastTime = 0;
let vrmPreviewLoader = null;
let vrmPreviewBoneIndex = new Map();
let vrmPreviewRestPose = new Map();
let motionRuntimeLoader = null;
let motionRuntimeCache = new Map();
let bonePreviewCanvas = null;
let bonePreviewScene = null;
let bonePreviewCamera = null;
let bonePreviewRenderer = null;
let bonePreviewRoot = null;
let bonePreviewLine = null;
let bonePreviewDots = [];
let bonePreviewNodeToDot = new Map();
let previewDragState = null;
const STORAGE_KEY = "game-engine.vrm-editor.v3";
const STORAGE_SCHEMA_VERSION = 3;
const LEGACY_STORAGE_KEYS = ["game-engine.vrm-editor.v1", "game-engine.vrm-editor.v2"];
const MANIFEST_SOURCES = ["./vrm-motion-dataset.json"];
const STANDARD_VRM_SOURCE = "./assets/vrm/standard/standard.vrm";
const STANDARD_VRM_LABEL = "Standard VRM";
const BONE_ALIAS_SLOTS = {
  hips: ["hips", "pelvis", "root", "body"],
  chest: ["chest", "spine", "upperchest", "upper_body"],
  head: ["head", "neck", "face"],
  leftArm: ["leftarm", "left_arm", "arm_l", "l_arm", "shoulderl", "upperarm_l", "leftupperarm"],
  rightArm: ["rightarm", "right_arm", "arm_r", "r_arm", "shoulderr", "upperarm_r", "rightupperarm"],
  leftLeg: ["leftleg", "left_leg", "leg_l", "l_leg", "thighl", "upperleg_l", "leftthigh"],
  rightLeg: ["rightleg", "right_leg", "leg_r", "r_leg", "thighr", "upperleg_r", "rightthigh"],
  leftHand: ["lefthand", "left_hand", "hand_l", "l_hand", "leftwrist", "wrist_l"],
  rightHand: ["righthand", "right_hand", "hand_r", "r_hand", "rightwrist", "wrist_r"],
};
const BVH_AXIS_CORRECTION = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0, "XYZ"));

function cloneMotionList(list) {
  return list.map((motion) => ({
    ...motion,
    tags: [...(motion.tags ?? [])],
    boneRotations: cloneBoneRotations(motion.boneRotations),
    expressionAdjustments: cloneExpressionAdjustments(motion.expressionAdjustments),
    fingerAdjustments: cloneFingerAdjustments(motion.fingerAdjustments),
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
  const alias = Array.isArray(raw.alias)
    ? raw.alias.find((entry) => typeof entry === "string" && entry.trim()) ?? ""
    : typeof raw.alias === "string"
      ? raw.alias
      : "";
  const scriptName = typeof raw.scriptName === "string" && raw.scriptName.trim()
    ? raw.scriptName.trim()
    : id;
  const displayName = typeof raw.displayName === "string" && raw.displayName.trim()
    ? raw.displayName.trim()
    : alias || id;
  const content = typeof raw.content === "string" && raw.content.trim() ? raw.content.trim() : "";
  const style = typeof raw.style === "string" && raw.style.trim() ? raw.style.trim() : "";
  const source = typeof raw.source === "string" && raw.source.trim() ? raw.source.trim() : "unknown";
  const tagsValue = Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === "string" && tag.trim()) : [];
  const priority = Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 0;
  const loop = Boolean(raw.loop);
  const duration = typeof raw.duration === "string" && raw.duration.trim() ? raw.duration.trim() : "00:00";
  const boneRotations = normalizeBoneRotations(raw.boneRotations);
  const expressionAdjustments = normalizeExpressionAdjustments(raw.expressionAdjustments);
  const fingerAdjustments = normalizeFingerAdjustments(raw.fingerAdjustments);

  return {
    id,
    alias,
    scriptName,
    displayName,
    content,
    style,
    source,
    tags: [...tagsValue],
    priority,
    loop,
    duration,
    boneRotations,
    expressionAdjustments,
    fingerAdjustments,
  };
}

function extractMotionEntries(rawData) {
  if (!rawData || typeof rawData !== "object") {
    return [];
  }

  if (Array.isArray(rawData.motions)) {
    return rawData.motions;
  }

  if (Array.isArray(rawData.assets)) {
    return rawData.assets
      .filter((asset) => asset && typeof asset === "object" && asset.kind === "vrm-motion")
      .map((asset) => ({
        id: asset.id,
        alias: asset.alias,
        scriptName: asset.scriptName,
        displayName: typeof asset.meta?.displayName === "string" && asset.meta.displayName.trim()
          ? asset.meta.displayName.trim()
          : asset.scriptName ?? asset.id,
        source: asset.source,
        tags: asset.tags,
        priority: asset.meta?.priority,
        loop: asset.meta?.loop,
        duration: typeof asset.meta?.duration === "number"
          ? formatDuration(asset.meta.duration)
          : asset.meta?.duration,
      }));
  }

  return [];
}

function formatDuration(duration) {
  const seconds = Number(duration);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function cloneBoneRotations(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      bone: typeof entry.bone === "string" ? entry.bone : "",
      rotation: normalizeRotationArray(entry.rotation),
    }))
    .filter((entry) => entry.bone.trim().length > 0);
}

function normalizeRotationArray(value) {
  const values = Array.isArray(value) ? value.slice(0, 3) : [];
  while (values.length < 3) {
    values.push(0);
  }
  return values.map((entry) => {
    const number = Number(entry);
    return Number.isFinite(number) ? number : 0;
  });
}

function cloneExpressionAdjustments(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      name: typeof entry.name === "string" ? entry.name : "",
      weight: normalizeWeight(entry.weight),
    }))
    .filter((entry) => entry.name.trim().length > 0);
}

function cloneFingerAdjustments(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      hand: typeof entry.hand === "string" ? entry.hand : "",
      pose: typeof entry.pose === "string" ? entry.pose : "",
      weight: normalizeWeight(entry.weight),
    }))
    .filter((entry) => entry.hand.trim().length > 0 || entry.pose.trim().length > 0);
}

function normalizeWeight(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return Math.max(0, Math.min(1, number));
}

function normalizeBoneRotations(value) {
  if (typeof value === "string") {
    try {
      return cloneBoneRotations(JSON.parse(value));
    } catch (error) {
      return [];
    }
  }

  return cloneBoneRotations(value);
}

function normalizeExpressionAdjustments(value) {
  if (typeof value === "string") {
    try {
      return cloneExpressionAdjustments(JSON.parse(value));
    } catch (error) {
      return [];
    }
  }

  return cloneExpressionAdjustments(value);
}

function normalizeFingerAdjustments(value) {
  if (typeof value === "string") {
    try {
      return cloneFingerAdjustments(JSON.parse(value));
    } catch (error) {
      return [];
    }
  }

  return cloneFingerAdjustments(value);
}

function parseDurationSeconds(duration) {
  if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
    return duration;
  }

  if (typeof duration !== "string") {
    return 4;
  }

  const parts = duration.split(":").map((part) => Number(part));
  if (parts.length === 2 && parts.every((part) => Number.isFinite(part))) {
    return Math.max(1, parts[0] * 60 + parts[1]);
  }

  const numeric = Number(duration);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 4;
}

function getCurrentMotion() {
  return motions.find((motion) => motion.id === (state.playbackMotionId || state.selectedId)) ?? getSelectedMotion();
}

function syncPlaybackToSelection(resetTime = false) {
  const selected = getSelectedMotion();
  if (!selected) {
    return;
  }

  state.playbackMotionId = selected.id;
  if (resetTime) {
    state.playbackTime = 0;
    state.playbackProgress = 0;
  }
}

function startMotionPlayback(motion = getSelectedMotion()) {
  if (!motion) {
    return;
  }

  const sameMotion = state.playbackMotionId === motion.id;
  state.isPlaying = true;
  state.playbackMotionId = motion.id;
  if (!sameMotion) {
    state.playbackTime = 0;
    state.playbackProgress = 0;
  }
  state.playing = motion.displayName;
  render();
}

function stopMotionPlayback() {
  state.isPlaying = false;
  state.playing = "Stopped";
  state.playbackTime = 0;
  state.playbackProgress = 0;
  render();
}

function updatePlaybackProgress(motion, deltaSeconds) {
  if (!motion) {
    return 0;
  }

  const duration = parseDurationSeconds(motion.duration);
  if (state.isPlaying) {
    state.playbackTime += deltaSeconds;
    if (motion.loop) {
      state.playbackTime %= duration;
    } else if (state.playbackTime >= duration) {
      state.playbackTime = duration;
      state.isPlaying = false;
      state.playing = `${motion.displayName} finished`;
    }
  }

  const progress = duration > 0 ? Math.min(1, state.playbackTime / duration) : 0;
  state.playbackProgress = progress;
  return progress;
}

function applyMotionData(rawData) {
  const loadedMotions = extractMotionEntries(rawData).map(normalizeMotion).filter(Boolean);

  motions = loadedMotions.length ? loadedMotions : cloneMotionList(DEFAULT_MOTIONS);
  tags = uniqueTags(motions, Array.isArray(rawData?.tags) ? rawData.tags : DEFAULT_TAGS);

  if (!motions.some((motion) => motion.id === state.selectedId)) {
    state.selectedId = motions[0]?.id ?? "";
  }

  if (!state.playbackMotionId || !motions.some((motion) => motion.id === state.playbackMotionId)) {
    state.playbackMotionId = state.selectedId;
  }

  if (!state.playing || state.playing === "Loading...") {
    state.playing = motions[0]?.displayName ?? "Stopped";
  }
}

function serializeState() {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    motions: cloneMotionList(motions),
    ui: {
      selectedId: state.selectedId,
      search: state.search,
      tag: state.tag,
      playing: state.playing,
      sceneCameraPreset: state.sceneCameraPreset,
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

function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    state.saveStatus = "Local save cleared";
    state.error = "";
  } catch (error) {
    state.saveStatus = "Clear failed";
    state.error = "Failed to clear local save data.";
  }
  render();
}

function hydrateState(snapshot) {
  if (Number(snapshot?.schemaVersion) !== STORAGE_SCHEMA_VERSION) {
    return false;
  }

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
  state.sceneCameraPreset = typeof ui.sceneCameraPreset === "string" ? ui.sceneCameraPreset : state.sceneCameraPreset;

  if (!motions.some((motion) => motion.id === state.selectedId)) {
    state.selectedId = motions[0]?.id ?? "";
  }

  if (!state.playbackMotionId || !motions.some((motion) => motion.id === state.playbackMotionId)) {
    state.playbackMotionId = state.selectedId;
  }

  return true;
}

function restoreSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      state.saveStatus = "No local save";
      return false;
    }

    const snapshot = JSON.parse(raw);
    if (!hydrateState(snapshot)) {
      state.saveStatus = "No compatible local save";
      state.error = "";
      return false;
    }
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

  const searchable = [
    motion.id,
    motion.alias,
    motion.displayName,
    motion.content,
    motion.style,
    motion.source,
    motion.tags.join(" "),
  ].join(" ").toLowerCase();
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
      <div class="motion-subtitle">${motion.alias || "No alias"}${motion.content || motion.style ? ` · ${[motion.content, motion.style].filter(Boolean).join(" / ")}` : ""} · ${motion.source}</div>
      <div class="tag-row">
        ${motion.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    `;
    card.addEventListener("click", () => {
      state.selectedId = motion.id;
      if (state.isPlaying) {
        syncPlaybackToSelection(true);
      }
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
  const playbackMotion = getCurrentMotion();

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
    refs.loadedVrmLabel.textContent = state.loadedVrmName ? `Loaded: ${state.loadedVrmName}` : "No VRM loaded.";
    refs.footerSummary.textContent = "No motion data";
    refs.saveStatus.textContent = state.saveStatus;
    populateBoneControls();
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
  refs.playingLabel.textContent = state.isPlaying
    ? `Playing: ${playbackMotion?.displayName ?? state.playing}`
    : `Playing: ${state.playing}`;
  refs.sceneViewNote.textContent = `Scene View: ${state.sceneCameraPreset} / rotate ${state.previewRotationY}° / ${state.previewAutoRotate ? "auto rotate on" : "auto rotate off"} / drag to pan / wheel to zoom`;
  const seekValue = Math.max(0, Math.min(100, Math.round((state.playbackProgress || 0) * 100)));
  if (refs.seekLabel && Number(refs.seekLabel.value) !== seekValue) {
    refs.seekLabel.value = String(seekValue);
  }
  refs.timelineProgress.style.width = `${Math.max(8, Math.min(100, seekValue))}%`;
  refs.loadedVrmLabel.textContent = state.loadedVrmName ? `Loaded: ${state.loadedVrmName}` : "No VRM loaded.";
  refs.footerSummary.textContent = state.error
    ? `${motion.displayName} / ${motion.id} · fallback data`
    : `${motion.displayName} / ${motion.id}`;
  refs.saveStatus.textContent = state.saveStatus;
  populateBoneControls();
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
  renderSceneCameraButtons();
  renderTagFilters();
  renderMotionList();
  renderDetails();
  updateBonePreviewVisibility();
}

function updateBonePreviewVisibility() {
  const panel = refs.bonePreviewPanel;
  const toggle = refs.bonePreviewToggleButton;
  const split = refs.previewSplit;

  if (!panel || !toggle) {
    return;
  }

  panel.classList.toggle("is-hidden", !state.showBonePreview);
  split?.classList.toggle("is-collapsed", !state.showBonePreview);
  toggle.classList.toggle("active", state.showBonePreview);
  toggle.textContent = state.showBonePreview ? "Bone Preview On" : "Bone Preview Off";
}

function renderSceneCameraButtons() {
  if (!refs.sceneCameraButtons) {
    return;
  }

  for (const button of refs.sceneCameraButtons) {
    button.classList.toggle("active", button.dataset.sceneCamera === state.sceneCameraPreset);
  }
}

function disposePreviewObject(object3D) {
  if (!object3D) {
    return;
  }

  object3D.traverse?.((child) => {
    if (child.geometry) {
      child.geometry.dispose?.();
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material) {
        continue;
      }
      for (const key of ["map", "alphaMap", "aoMap", "bumpMap", "emissiveMap", "metalnessMap", "normalMap", "roughnessMap"]) {
        const texture = material[key];
        texture?.dispose?.();
      }
      material.dispose?.();
    }
  });
}

function updatePreviewCamera() {
  if (!vrmPreviewCamera) {
    return;
  }

  const preset = state.sceneCameraPreset;
  const zoom = THREE.MathUtils.clamp(state.previewZoom || 1, 0.55, 2.1);
  if (preset === "side") {
    vrmPreviewCamera.position.set(3.0 * zoom, 1.35 * zoom, 0.2 * zoom);
  } else if (preset === "orbit") {
    vrmPreviewCamera.position.set(2.8 * zoom, 1.6 * zoom, 2.8 * zoom);
  } else {
    vrmPreviewCamera.position.set(0, 1.5 * zoom, 4.2 * zoom);
  }
  vrmPreviewCamera.lookAt(0, 1.0, 0);
  vrmPreviewCamera.updateProjectionMatrix();
}

function updatePreviewContentOffset() {
  if (!vrmPreviewContentRoot) {
    return;
  }

  vrmPreviewContentRoot.position.set(state.previewOffsetX || 0, state.previewOffsetY || 0, 0);
}

function applyPreviewDragDelta(deltaX, deltaY) {
  const zoom = THREE.MathUtils.clamp(state.previewZoom || 1, 0.55, 2.1);
  state.previewOffsetX += (deltaX / 240) * (1 / zoom);
  state.previewOffsetY -= (deltaY / 240) * (1 / zoom);
  renderPreviewFrame();
}

function updatePreviewOrientation() {
  if (!vrmPreviewAvatarRoot) {
    return;
  }

  vrmPreviewAvatarRoot.rotation.y = THREE.MathUtils.degToRad(state.previewRotationY);
}

function resizePreviewRenderer() {
  if (!vrmPreviewRenderer || !refs.vrmPreviewCanvas) {
    return;
  }

  const parent = refs.vrmPreviewCanvas.parentElement;
  if (!parent) {
    return;
  }

  const width = Math.max(1, Math.floor(parent.clientWidth));
  const height = Math.max(1, Math.floor(parent.clientHeight));
  if (width < 2 || height < 2) {
    return;
  }

  vrmPreviewRenderer.setSize(width, height, false);
  vrmPreviewCamera.aspect = width / height;
  vrmPreviewCamera.updateProjectionMatrix();
}

function renderPreviewFrame() {
  if (!vrmPreviewRenderer || !vrmPreviewScene || !vrmPreviewCamera) {
    return;
  }

  const now = performance.now();
  const deltaSeconds = vrmPreviewLastTime > 0 ? Math.max(0, (now - vrmPreviewLastTime) / 1000) : 0;
  vrmPreviewLastTime = now;

  resizePreviewRenderer();
  updatePreviewCamera();
  updatePreviewContentOffset();
  const motion = getCurrentMotion();
  const progress = updatePlaybackProgress(motion, deltaSeconds);
  if (motion && isBvhSource(motion.source)) {
    const runtime = motionRuntimeCache.get(motion.source);
    if (runtime?.ready) {
      applyBvhMotionPose(runtime, motion);
    } else {
      void ensureMotionRuntime(motion);
      applyMotionPose(motion, progress, state.playbackTime);
    }
  } else {
    applyMotionPose(motion, progress, state.playbackTime);
  }
  updatePreviewContentVisibility();
  if (state.previewAutoRotate && vrmPreviewRoot && !state.isPlaying) {
    vrmPreviewRoot.rotation.y += state.sceneCameraPreset === "orbit" ? 0.003 : 0.001;
  }
  updatePreviewOrientation();
  vrmPreviewRenderer.render(vrmPreviewScene, vrmPreviewCamera);
}

function updatePreviewContentVisibility() {
  if (!vrmPreviewContentRoot) {
    return;
  }

  const hasLoadedModel = Boolean(vrmPreviewModelRoot?.children.length);
  if (hasLoadedModel) {
    if (vrmPreviewRig?.parent === vrmPreviewContentRoot) {
      vrmPreviewContentRoot.remove(vrmPreviewRig);
    }
    return;
  }

  ensurePreviewRig();
}

function startPreviewLoop() {
  if (vrmPreviewFrame) {
    return;
  }

  const tick = () => {
    vrmPreviewFrame = window.requestAnimationFrame(tick);
    renderPreviewFrame();
    renderBonePreviewFrame();
  };

  vrmPreviewFrame = window.requestAnimationFrame(tick);
}

function setupBonePreview() {
  if (!bonePreviewCanvas || bonePreviewRenderer) {
    return;
  }

  bonePreviewScene = new THREE.Scene();
  bonePreviewScene.background = new THREE.Color(0x0b111a);
  bonePreviewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  bonePreviewCamera.position.set(0, 0.4, 4.5);

  bonePreviewRenderer = new THREE.WebGLRenderer({
    canvas: bonePreviewCanvas,
    antialias: true,
    alpha: true,
  });
  bonePreviewRenderer.setPixelRatio(window.devicePixelRatio || 1);
  bonePreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;

  const ambient = new THREE.AmbientLight(0xffffff, 1.7);
  const key = new THREE.DirectionalLight(0x7cf0b7, 2.0);
  key.position.set(2, 3, 4);
  const fill = new THREE.DirectionalLight(0x6cc1ff, 0.9);
  fill.position.set(-2, 1, 2);
  bonePreviewScene.add(ambient, key, fill);

  bonePreviewRoot = new THREE.Group();
  bonePreviewScene.add(bonePreviewRoot);

  const grid = new THREE.GridHelper(4, 8, 0x2f3b50, 0x1c2433);
  grid.position.y = -1.0;
  bonePreviewScene.add(grid);

  bonePreviewLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({
      color: 0x7cf0b7,
      transparent: true,
      opacity: 0.95,
    }),
  );
  bonePreviewRoot.add(bonePreviewLine);

}

function resizeBonePreviewRenderer() {
  if (!bonePreviewRenderer || !bonePreviewCanvas) {
    return;
  }

  const parent = bonePreviewCanvas.parentElement;
  if (!parent) {
    return;
  }

  const width = Math.max(1, Math.floor(parent.clientWidth));
  const height = Math.max(1, Math.floor(parent.clientHeight));
  if (width < 2 || height < 2) {
    return;
  }

  bonePreviewRenderer.setSize(width, height, false);
  bonePreviewCamera.aspect = width / height;
  bonePreviewCamera.updateProjectionMatrix();
}

function renderBonePreviewFrame() {
  if (!bonePreviewRenderer || !bonePreviewScene || !bonePreviewCamera) {
    return;
  }

  resizeBonePreviewRenderer();

  if (!vrmPreviewBoneOptions.length) {
    if (refs.bonePreviewNote) {
      refs.bonePreviewNote.textContent = "No bone data.";
    }
    bonePreviewLine.visible = false;
    for (const dot of bonePreviewDots) {
      dot.visible = false;
    }
    bonePreviewRenderer.render(bonePreviewScene, bonePreviewCamera);
    return;
  }

  const nodes = vrmPreviewBoneOptions.map((entry) => entry.node).filter(Boolean);
  const points = nodes.map((node) => {
    const position = new THREE.Vector3();
    node.getWorldPosition(position);
    return position;
  });

  const center = new THREE.Vector3();
  for (const point of points) {
    center.add(point);
  }
  center.multiplyScalar(1 / points.length);

  const normalized = points.map((point) => point.clone().sub(center));
  let maxDistance = 0.0001;
  for (const point of normalized) {
    maxDistance = Math.max(maxDistance, point.length());
  }
  const scale = 1.65 / maxDistance;
  const zoom = THREE.MathUtils.clamp(state.bonePreviewZoom || 1, 0.45, 2.4);

  const nodeToPoint = new Map();
  for (let index = 0; index < nodes.length; index += 1) {
    nodeToPoint.set(nodes[index].uuid, normalized[index]);
  }

  const positions = [];
  const selectedNode = state.selectedBoneKey
    ? vrmPreviewBoneOptions.find((entry) => entry.key === state.selectedBoneKey)?.node ?? null
    : null;
  const selectedChain = new Set();
  let chainCursor = selectedNode;
  while (chainCursor) {
    selectedChain.add(chainCursor.uuid);
    if (chainCursor === vrmPreviewModelRoot || chainCursor === vrmPreviewContentRoot) {
      break;
    }
    chainCursor = chainCursor.parent ?? null;
  }

  const rootPoint = new THREE.Vector3();
  vrmPreviewModelRoot?.getWorldPosition(rootPoint);

  for (const entry of vrmPreviewBoneOptions) {
    const node = entry.node;
    const parent = node?.parent ?? null;
    if (!node || !nodeToPoint.has(node.uuid)) {
      continue;
    }

    const start = parent && nodeToPoint.has(parent.uuid)
      ? nodeToPoint.get(parent.uuid)
      : rootPoint;
    const end = nodeToPoint.get(node.uuid);
    positions.push(start.x * scale * zoom, start.y * scale * zoom, start.z * scale * zoom);
    positions.push(end.x * scale * zoom, end.y * scale * zoom, end.z * scale * zoom);
  }

  if (bonePreviewLine.geometry) {
    bonePreviewLine.geometry.dispose?.();
  }
  bonePreviewLine.geometry = new THREE.BufferGeometry();
  bonePreviewLine.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  bonePreviewLine.visible = positions.length >= 6;

  while (bonePreviewDots.length < nodes.length) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffca6c }),
    );
    bonePreviewDots.push(dot);
    bonePreviewRoot.add(dot);
  }

  for (let index = 0; index < bonePreviewDots.length; index += 1) {
    const dot = bonePreviewDots[index];
    if (index < nodes.length) {
      const node = nodes[index];
      const point = nodeToPoint.get(node.uuid);
      dot.visible = true;
      dot.position.set(point.x * scale * zoom, point.y * scale * zoom, point.z * scale * zoom);
      if (selectedNode && node.uuid === selectedNode.uuid) {
        dot.material.color.set(0x7cf0b7);
        dot.scale.setScalar(1.4);
      } else if (selectedChain.has(node.uuid)) {
        dot.material.color.set(0x6cc1ff);
        dot.scale.setScalar(1.15);
      } else {
        dot.material.color.set(0xffca6c);
        dot.scale.setScalar(1.0);
      }
    } else {
      dot.visible = false;
    }
  }

  bonePreviewCamera.position.set(0, 0.3, 4.5 / zoom);
  bonePreviewCamera.lookAt(0, 0, 0);

  if (refs.bonePreviewNote) {
    refs.bonePreviewNote.textContent = `${nodes.length} bones in hierarchy · wheel to zoom`;
  }

  bonePreviewRenderer.render(bonePreviewScene, bonePreviewCamera);
}

function setupVrmPreview() {
  if (!refs.vrmPreviewCanvas || vrmPreviewRenderer) {
    return;
  }

  vrmPreview = refs.vrmPreviewCanvas;
  vrmPreviewScene = new THREE.Scene();
  vrmPreviewScene.background = new THREE.Color(0x111722);
  vrmPreviewCamera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  vrmPreviewRenderer = new THREE.WebGLRenderer({
    canvas: vrmPreview,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
  });
  vrmPreviewRenderer.setPixelRatio(window.devicePixelRatio || 1);
  vrmPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;

  const ambient = new THREE.AmbientLight(0xffffff, 1.8);
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 5, 4);
  const fill = new THREE.DirectionalLight(0x93c5ff, 1.1);
  fill.position.set(-2, 1, 3);

  vrmPreviewRoot = new THREE.Group();
  vrmPreviewScene.add(ambient, key, fill, vrmPreviewRoot);

  vrmPreviewAvatarRoot = new THREE.Group();
  vrmPreviewAvatarRoot.name = "PreviewAvatarRoot";
  vrmPreviewRoot.add(vrmPreviewAvatarRoot);

  vrmPreviewContentRoot = new THREE.Group();
  vrmPreviewContentRoot.name = "PreviewContentRoot";
  vrmPreviewAvatarRoot.add(vrmPreviewContentRoot);

  vrmPreviewModelRoot = new THREE.Group();
  vrmPreviewModelRoot.name = "PreviewModelRoot";
  vrmPreviewContentRoot.add(vrmPreviewModelRoot);

  vrmPreviewBoneMarker = new THREE.Group();
  vrmPreviewBoneMarker.name = "PreviewBoneMarker";
  vrmPreviewBoneMarker.visible = false;
  vrmPreviewBoneMarker.renderOrder = 1000;
  vrmPreviewRoot.add(vrmPreviewBoneMarker);

  const markerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x7cf0b7,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    }),
  );
  markerSphere.renderOrder = 1001;
  vrmPreviewBoneMarker.add(markerSphere);

  ensurePreviewRig();

  updatePreviewCamera();
  startPreviewLoop();
}

function ensurePreviewRig() {
  if (!vrmPreviewContentRoot) {
    return;
  }

  if (vrmPreviewRig) {
    if (vrmPreviewRig.parent !== vrmPreviewContentRoot) {
      vrmPreviewContentRoot.add(vrmPreviewRig);
    }
    return;
  }

  vrmPreviewRig = new THREE.Group();
  vrmPreviewRig.position.set(0, 1.1, 0);
  vrmPreviewContentRoot.add(vrmPreviewRig);

  const placeholderDot = new THREE.Group();
  placeholderDot.name = "PreviewPlaceholderDot";
  vrmPreviewRig.add(placeholderDot);

  const placeholderSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x7cf0b7,
      depthTest: false,
      transparent: true,
      opacity: 0.96,
    }),
  );
  placeholderSphere.renderOrder = 1001;
  placeholderDot.add(placeholderSphere);

  vrmPreviewRig.userData.parts = {
    head: placeholderSphere,
  };

  updatePreviewContentVisibility();
}

function clearPreviewModel() {
  if (!vrmPreviewModelRoot) {
    return;
  }

  while (vrmPreviewModelRoot.children.length > 0) {
    const child = vrmPreviewModelRoot.children[0];
    vrmPreviewModelRoot.remove(child);
    disposePreviewObject(child);
  }
  vrmPreviewModelParts = null;
  vrmPreviewBoneOptions = [];
  vrmPreviewBoneIndex = new Map();
  vrmPreviewRestPose = new Map();
  updatePreviewContentVisibility();
}

function fitPreviewModel(root) {
  if (!root) {
    return;
  }

  root.position.set(0, 0, 0);
  root.scale.setScalar(1);

  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxSide = Math.max(size.x, size.y, size.z, 0.0001);
  const scale = 1.0 / maxSide;
  root.scale.setScalar(scale);
  root.position.x = -center.x * scale;
  root.position.z = -center.z * scale;
  root.position.y = -box.min.y * scale + 0.02;
}

function applyMotionPose(motion, progress, elapsedSeconds) {
  if (!motion) {
    return;
  }

  const phase = progress * Math.PI * 2;
  const cycle = motion.loop
    ? 0.5 - 0.5 * Math.cos(phase)
    : Math.sin(Math.PI * progress);
  const blend = THREE.MathUtils.clamp(cycle, 0, 1);
  const motionBones = Array.isArray(motion.boneRotations) ? motion.boneRotations : [];
  const expressionAdjustments = Array.isArray(motion.expressionAdjustments) ? motion.expressionAdjustments : [];
  const fingerAdjustments = Array.isArray(motion.fingerAdjustments) ? motion.fingerAdjustments : [];

  for (const entry of vrmPreviewRestPose.values()) {
    if (!entry?.node) {
      continue;
    }
    entry.node.rotation.x = entry.rotation.x;
    entry.node.rotation.y = entry.rotation.y;
    entry.node.rotation.z = entry.rotation.z;
  }

  for (const rotation of motionBones) {
    const node = resolveMotionBoneNode(rotation.bone);
    if (!node) {
      continue;
    }

    const rest = vrmPreviewRestPose.get(node.uuid)?.rotation ?? {
      x: node.rotation.x,
      y: node.rotation.y,
      z: node.rotation.z,
    };
    const target = normalizeRotationArray(rotation.rotation).map((value) => THREE.MathUtils.degToRad(value) * blend);

    node.rotation.x = rest.x + (target[0] ?? 0);
    node.rotation.y = rest.y + (target[1] ?? 0);
    node.rotation.z = rest.z + (target[2] ?? 0);
  }

  const headNode = resolveMotionSlotNode("head");
  const chestNode = resolveMotionSlotNode("chest");
  const leftArmNode = resolveMotionSlotNode("leftArm");
  const rightArmNode = resolveMotionSlotNode("rightArm");

  for (const entry of expressionAdjustments) {
    const name = normalizeBoneKey(entry.name);
    const weight = normalizeWeight(entry.weight) * blend;
    if (!weight) {
      continue;
    }

    if (name.includes("happy")) {
      if (headNode) {
        headNode.rotation.x -= 0.03 * weight;
        headNode.rotation.y += 0.05 * weight;
      }
      if (chestNode) {
        chestNode.rotation.x -= 0.04 * weight;
      }
    } else if (name.includes("angry")) {
      if (headNode) {
        headNode.rotation.x += 0.05 * weight;
        headNode.rotation.y -= 0.04 * weight;
      }
      if (chestNode) {
        chestNode.rotation.x += 0.08 * weight;
      }
    } else if (name.includes("respect") || name.includes("bow")) {
      if (chestNode) {
        chestNode.rotation.x += 0.05 * weight;
      }
    } else if (name.includes("focused")) {
      if (headNode) {
        headNode.rotation.y += 0.02 * weight;
      }
    }
  }

  for (const entry of fingerAdjustments) {
    const hand = normalizeBoneKey(entry.hand);
    const pose = normalizeBoneKey(entry.pose);
    const weight = normalizeWeight(entry.weight) * blend;
    if (!weight) {
      continue;
    }

    const handNode = hand.includes("left") ? resolveMotionSlotNode("leftHand") : resolveMotionSlotNode("rightHand");
    const armNode = hand.includes("left") ? leftArmNode : rightArmNode;
    if (handNode) {
      handNode.rotation.x += pose.includes("closed") || pose.includes("grip") ? -0.28 * weight : 0.1 * weight;
      handNode.rotation.y += pose.includes("wave") ? 0.25 * weight : 0;
      handNode.rotation.z += hand.includes("left") ? -0.08 * weight : 0.08 * weight;
    }
    if (armNode) {
      armNode.rotation.z += pose.includes("wave")
        ? (hand.includes("left") ? 0.18 : -0.18) * weight
        : 0;
    }
  }

  const selectedBone = state.selectedBoneKey
    ? vrmPreviewBoneOptions.find((entry) => entry.key === state.selectedBoneKey)?.node ?? null
    : null;
  if (selectedBone && vrmPreviewBoneMarker) {
    const worldPosition = new THREE.Vector3();
    selectedBone.getWorldPosition(worldPosition);
    vrmPreviewBoneMarker.visible = true;
    vrmPreviewBoneMarker.position.copy(worldPosition);
  } else if (vrmPreviewBoneMarker) {
    vrmPreviewBoneMarker.visible = false;
  }
}

function applyBvhMotionPose(runtime, motion) {
  if (!runtime?.ready || !runtime.root || !motion) {
    return false;
  }

  const duration = runtime.clip?.duration || parseDurationSeconds(motion.duration);
  const time = duration > 0 ? state.playbackTime % duration : state.playbackTime;

  if (runtime.mixer && typeof runtime.mixer.setTime === "function") {
    runtime.mixer.setTime(time);
  } else if (runtime.action) {
    runtime.action.time = time;
    runtime.mixer?.update?.(0);
  }

  const bvhTargets = {
    hips: findSourceBone(runtime, "hips") ?? findSourceBone(runtime, "root"),
    chest: findSourceBone(runtime, "chest") ?? findSourceBone(runtime, "spine"),
    head: findSourceBone(runtime, "head") ?? findSourceBone(runtime, "neck"),
    leftArm: findSourceBone(runtime, "leftArm") ?? findSourceBone(runtime, "leftShoulder"),
    rightArm: findSourceBone(runtime, "rightArm") ?? findSourceBone(runtime, "rightShoulder"),
    leftLeg: findSourceBone(runtime, "leftLeg") ?? findSourceBone(runtime, "leftUpLeg"),
    rightLeg: findSourceBone(runtime, "rightLeg") ?? findSourceBone(runtime, "rightUpLeg"),
    leftHand: findSourceBone(runtime, "leftHand") ?? findSourceBone(runtime, "leftForeArm"),
    rightHand: findSourceBone(runtime, "rightHand") ?? findSourceBone(runtime, "rightForeArm"),
  };

  const targetNodes = {
    hips: resolveMotionSlotNode("hips") ?? vrmPreviewModelParts?.hips ?? null,
    chest: resolveMotionSlotNode("chest") ?? vrmPreviewModelParts?.chest ?? null,
    head: resolveMotionSlotNode("head") ?? vrmPreviewModelParts?.head ?? null,
    leftArm: resolveMotionSlotNode("leftArm") ?? vrmPreviewModelParts?.leftArm ?? null,
    rightArm: resolveMotionSlotNode("rightArm") ?? vrmPreviewModelParts?.rightArm ?? null,
    leftLeg: resolveMotionSlotNode("leftLeg") ?? vrmPreviewModelParts?.leftLeg ?? null,
    rightLeg: resolveMotionSlotNode("rightLeg") ?? vrmPreviewModelParts?.rightLeg ?? null,
  };

  for (const [slot, sourceNode] of Object.entries(bvhTargets)) {
    const targetNode = targetNodes[slot];
    if (!sourceNode || !targetNode) {
      continue;
    }
    applySourceRelativeRotation(targetNode, sourceNode, runtime.restPose, 1);
  }

  const leftHand = findSourceBone(runtime, "leftHand") ?? findSourceBone(runtime, "leftForeArm");
  const rightHand = findSourceBone(runtime, "rightHand") ?? findSourceBone(runtime, "rightForeArm");
  if (leftHand && vrmPreviewModelParts?.leftHand) {
    applySourceRelativeRotation(vrmPreviewModelParts.leftHand, leftHand, runtime.restPose, 1);
  }
  if (rightHand && vrmPreviewModelParts?.rightHand) {
    applySourceRelativeRotation(vrmPreviewModelParts.rightHand, rightHand, runtime.restPose, 1);
  }

  return true;
}

function collectModelParts(root) {
  const lookup = {
    hips: null,
    chest: null,
    head: null,
    leftArm: null,
    rightArm: null,
    leftLeg: null,
    rightLeg: null,
    leftHand: null,
    rightHand: null,
  };

  const matches = (name, terms) => terms.some((term) => name.includes(term));

  root.traverse?.((child) => {
    const name = String(child.name || child.type || "").toLowerCase();
    if (!lookup.head && matches(name, ["head", "neck", "face"])) {
      lookup.head = child;
    } else if (!lookup.chest && matches(name, ["chest", "spine", "upperchest", "upper_body"])) {
      lookup.chest = child;
    } else if (!lookup.hips && matches(name, ["hips", "pelvis", "root", "body"])) {
      lookup.hips = child;
    } else if (!lookup.leftArm && matches(name, ["leftarm", "left_arm", "arm_l", "l_arm", "shoulderl", "upperarm_l"])) {
      lookup.leftArm = child;
    } else if (!lookup.rightArm && matches(name, ["rightarm", "right_arm", "arm_r", "r_arm", "shoulderr", "upperarm_r"])) {
      lookup.rightArm = child;
    } else if (!lookup.leftLeg && matches(name, ["leftleg", "left_leg", "leg_l", "l_leg", "thighl", "upperleg_l"])) {
      lookup.leftLeg = child;
    } else if (!lookup.rightLeg && matches(name, ["rightleg", "right_leg", "leg_r", "r_leg", "thighr", "upperleg_r"])) {
      lookup.rightLeg = child;
    } else if (!lookup.leftHand && matches(name, ["lefthand", "left_hand", "hand_l", "l_hand", "leftwrist", "wrist_l"])) {
      lookup.leftHand = child;
    } else if (!lookup.rightHand && matches(name, ["righthand", "right_hand", "hand_r", "r_hand", "rightwrist", "wrist_r"])) {
      lookup.rightHand = child;
    }
  });

  return lookup;
}

function collectBoneOptions(root) {
  const options = [];
  const seen = new Set();

  root.traverse?.((child) => {
    const name = String(child.name || "").trim();
    const type = String(child.type || "").trim();
    const label = name || type || `Object3D ${options.length + 1}`;
    const key = child.uuid || `${options.length}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    const normalizedType = type || "Object3D";
    const priority = normalizedType.toLowerCase().includes("bone")
      ? 3
      : normalizedType.toLowerCase().includes("group") || normalizedType.toLowerCase().includes("armature")
        ? 2
        : 1;
    options.push({ key, label, type: normalizedType, node: child, priority });
  });

  return options;
}

function normalizeBoneKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function isBvhSource(source) {
  return typeof source === "string" && /\.bvh(\?.*)?$/i.test(source);
}

function buildSourceBoneIndex(root) {
  const index = new Map();

  root.traverse?.((child) => {
    const key = normalizeBoneKey(child.name || child.type || "");
    if (key && !index.has(key)) {
      index.set(key, child);
    }
  });

  return index;
}

function findSourceBone(runtime, slot) {
  if (!runtime?.boneIndex) {
    return null;
  }

  const aliases = BONE_ALIAS_SLOTS[slot] ?? [];
  for (const alias of aliases) {
    const key = normalizeBoneKey(alias);
    if (key && runtime.boneIndex.has(key)) {
      return runtime.boneIndex.get(key) ?? null;
    }
  }

  return null;
}

function applyRestRelativeRotation(targetNode, sourceNode, blend = 1) {
  if (!targetNode || !sourceNode) {
    return;
  }

  const rest = vrmPreviewRestPose.get(targetNode.uuid)?.rotation ?? {
    x: targetNode.rotation.x,
    y: targetNode.rotation.y,
    z: targetNode.rotation.z,
  };

  targetNode.rotation.x = rest.x + sourceNode.rotation.x * blend;
  targetNode.rotation.y = rest.y + sourceNode.rotation.y * blend;
  targetNode.rotation.z = rest.z + sourceNode.rotation.z * blend;
}

function snapshotNodeRotation(node) {
  if (!node) {
    return null;
  }

  return {
    x: node.rotation.x,
    y: node.rotation.y,
    z: node.rotation.z,
  };
}

function snapshotNodeQuaternion(node) {
  if (!node) {
    return null;
  }

  return node.quaternion.clone();
}

function captureSourceRestPose(root) {
  const restPose = new Map();

  root.traverse?.((child) => {
    if (!child) {
      return;
    }
    restPose.set(child.uuid, {
      rotation: snapshotNodeRotation(child),
      quaternion: snapshotNodeQuaternion(child),
    });
  });

  return restPose;
}

function applySourceRelativeRotation(targetNode, sourceNode, sourceRestPose, blend = 1) {
  if (!targetNode || !sourceNode) {
    return;
  }

  const targetRest = vrmPreviewRestPose.get(targetNode.uuid)?.quaternion ?? snapshotNodeQuaternion(targetNode);
  const sourceRest = sourceRestPose?.get(sourceNode.uuid)?.quaternion ?? snapshotNodeQuaternion(sourceNode);
  const sourceCurrent = snapshotNodeQuaternion(sourceNode);

  const sourceDelta = sourceRest.clone().invert().multiply(sourceCurrent);
  const correctedDelta = BVH_AXIS_CORRECTION.clone().multiply(sourceDelta).multiply(BVH_AXIS_CORRECTION.clone().invert());
  const blendedDelta = new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(), correctedDelta, blend);
  const targetCurrent = targetRest.clone().multiply(blendedDelta);

  targetNode.quaternion.copy(targetCurrent);
  targetNode.rotation.setFromQuaternion(targetCurrent, targetNode.rotation.order);
}

async function ensureMotionRuntime(motion) {
  if (!motion?.source || !isBvhSource(motion.source)) {
    return null;
  }

  const cached = motionRuntimeCache.get(motion.source);
  if (cached) {
    if (cached.loading) {
      return cached;
    }
    if (cached.ready || cached.error) {
      return cached;
    }
  }

  const entry = {
    source: motion.source,
    loading: true,
    ready: false,
    error: "",
    group: null,
    root: null,
    clip: null,
    mixer: null,
    action: null,
    boneIndex: new Map(),
    restPose: new Map(),
  };
  motionRuntimeCache.set(motion.source, entry);

  try {
    const response = await fetch(motion.source);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    const loader = motionRuntimeLoader ?? (motionRuntimeLoader = new BVHLoader());
    const parsed = loader.parse(text);
    const rootBone = parsed?.skeleton?.bones?.[0] ?? null;
    if (!rootBone) {
      throw new Error("BVH root bone not found.");
    }

    const group = new THREE.Group();
    group.visible = false;
    group.add(rootBone);
    vrmPreviewRoot?.add(group);

    const mixer = new THREE.AnimationMixer(rootBone);
    const action = mixer.clipAction(parsed.clip);
    entry.restPose = captureSourceRestPose(rootBone);
    action.play();

    entry.group = group;
    entry.root = rootBone;
    entry.clip = parsed.clip;
    entry.mixer = mixer;
    entry.action = action;
    entry.boneIndex = buildSourceBoneIndex(rootBone);
    entry.ready = true;
    entry.loading = false;
  } catch (error) {
    entry.error = error instanceof Error ? error.message : String(error);
    entry.loading = false;
  }

  return entry;
}

function capturePreviewRestPose() {
  vrmPreviewRestPose = new Map();

  for (const entry of vrmPreviewBoneOptions) {
    if (!entry?.node) {
      continue;
    }
    vrmPreviewRestPose.set(entry.key, {
      node: entry.node,
      rotation: {
        x: entry.node.rotation.x,
        y: entry.node.rotation.y,
        z: entry.node.rotation.z,
      },
      quaternion: entry.node.quaternion.clone(),
    });
  }
}

function buildPreviewBoneIndex() {
  vrmPreviewBoneIndex = new Map();

  for (const entry of vrmPreviewBoneOptions) {
    if (!entry?.node) {
      continue;
    }

    const keys = new Set([
      entry.key,
      entry.label,
      entry.type,
      entry.node.name,
      entry.node.type,
    ].map(normalizeBoneKey).filter(Boolean));

    for (const key of keys) {
      const current = vrmPreviewBoneIndex.get(key);
      if (!current || (current.userData?.bonePriority ?? 0) < (entry.priority ?? 0)) {
        entry.node.userData = entry.node.userData || {};
        entry.node.userData.bonePriority = entry.priority ?? 0;
        vrmPreviewBoneIndex.set(key, entry.node);
      }
    }
  }
}

function findBoneOptionByTerms(terms) {
  const normalizedTerms = terms.map(normalizeBoneKey).filter(Boolean);
  const candidates = vrmPreviewBoneOptions.filter((entry) => {
    const label = normalizeBoneKey(entry.label);
    return normalizedTerms.some((term) => label.includes(term));
  });

  const preferBone = candidates
    .filter((entry) => isBoneLikeType(entry.type))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  if (preferBone?.node) {
    return preferBone.node;
  }

  const fallback = candidates
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
  return fallback?.node ?? null;
}

function resolveMotionBoneNode(boneName) {
  const normalized = normalizeBoneKey(boneName);
  if (!normalized) {
    return null;
  }

  if (vrmPreviewBoneIndex.has(normalized)) {
    return vrmPreviewBoneIndex.get(normalized) ?? null;
  }

  for (const [slot, aliases] of Object.entries(BONE_ALIAS_SLOTS)) {
    const slotAliases = aliases.map(normalizeBoneKey);
    if (slotAliases.includes(normalized)) {
      const mappedKey = normalizeBoneKey(state.boneMap?.[slot] || "");
      if (mappedKey && vrmPreviewBoneIndex.has(mappedKey)) {
        return vrmPreviewBoneIndex.get(mappedKey) ?? null;
      }
      const fallbackNode = findBoneOptionByTerms(aliases);
      if (fallbackNode) {
        return fallbackNode;
      }
    }
  }

  return (
    findBoneOptionByTerms([boneName])
    ?? vrmPreviewBoneOptions.find((entry) => normalizeBoneKey(entry.label).includes(normalized))?.node
    ?? null
  );
}

function resolveMotionSlotNode(slot) {
  const aliases = BONE_ALIAS_SLOTS[slot] ?? [];
  const mappedKey = normalizeBoneKey(state.boneMap?.[slot] || "");
  if (mappedKey && vrmPreviewBoneIndex.has(mappedKey)) {
    return vrmPreviewBoneIndex.get(mappedKey) ?? null;
  }
  return findBoneOptionByTerms(aliases);
}

function guessBoneMap(options, terms) {
  const normalizedTerms = terms.map(normalizeBoneKey).filter(Boolean);
  const candidates = [...options].filter((entry) => {
    const label = normalizeBoneKey(entry.label || "");
    return normalizedTerms.some((term) => label.includes(term));
  });

  const preferBone = candidates
    .filter((entry) => isBoneLikeType(entry.type))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
  if (preferBone) {
    return preferBone.key ?? "";
  }

  const fallback = candidates
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
  return fallback?.key ?? "";
}

function getBoneByKey(key) {
  return vrmPreviewBoneOptions.find((entry) => entry.key === key)?.node ?? null;
}

function resolveBoneMapNode(key, fallbackKey) {
  const selected = getBoneByKey(key);
  if (selected) {
    return selected;
  }
  return getBoneByKey(fallbackKey);
}

function isBoneLikeType(type) {
  const normalized = normalizeBoneKey(type);
  return normalized.includes("bone") || normalized.includes("armature") || normalized.includes("group");
}

function applyBoneMapToParts() {
  if (!vrmPreviewModelRoot && !vrmPreviewRig) {
    return;
  }

  const fallback = vrmPreviewRig?.userData.parts ?? {};
  const mapped = {
    hips: resolveBoneMapNode(state.boneMap.hips, ""),
    chest: resolveBoneMapNode(state.boneMap.chest, ""),
    head: resolveBoneMapNode(state.boneMap.head, ""),
    leftArm: resolveBoneMapNode(state.boneMap.leftArm, ""),
    rightArm: resolveBoneMapNode(state.boneMap.rightArm, ""),
    leftLeg: resolveBoneMapNode(state.boneMap.leftLeg, ""),
    rightLeg: resolveBoneMapNode(state.boneMap.rightLeg, ""),
  };

  vrmPreviewModelParts = {
    hips: mapped.hips ?? fallback.hips ?? null,
    chest: mapped.chest ?? fallback.chest ?? null,
    head: mapped.head ?? fallback.head ?? null,
    leftArm: mapped.leftArm ?? fallback.leftArm ?? null,
    rightArm: mapped.rightArm ?? fallback.rightArm ?? null,
    leftLeg: mapped.leftLeg ?? fallback.leftLeg ?? null,
    rightLeg: mapped.rightLeg ?? fallback.rightLeg ?? null,
  };
}

function populateBoneControls() {
  const selectRefs = {
    hips: refs.boneMapHips,
    chest: refs.boneMapChest,
    head: refs.boneMapHead,
    leftArm: refs.boneMapLeftArm,
    rightArm: refs.boneMapRightArm,
    leftLeg: refs.boneMapLeftLeg,
    rightLeg: refs.boneMapRightLeg,
  };

  const emptyOption = '<option value="">(auto)</option>';
  const optionHtml = vrmPreviewBoneOptions
    .map((entry) => `<option value="${entry.key}">${entry.label} (${entry.type})</option>`)
    .join("");

  for (const [slot, select] of Object.entries(selectRefs)) {
    if (!select) {
      continue;
    }
    select.innerHTML = emptyOption + optionHtml;
    select.value = state.boneMap[slot] || "";
    select.onchange = () => {
      state.boneMap[slot] = select.value;
      state.selectedBoneKey = select.value;
      applyBoneMapToParts();
      render();
      renderPreviewFrame();
      renderBonePreviewFrame();
    };
  }

  if (refs.boneNameList) {
    refs.boneNameList.innerHTML = "";
    for (const entry of vrmPreviewBoneOptions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `bone-item${state.selectedBoneKey === entry.key ? " active" : ""}`;
      button.innerHTML = `<span>${entry.label}</span><small>${entry.type}</small>`;
      button.addEventListener("click", () => {
        state.selectedBoneKey = entry.key;
        render();
        renderPreviewFrame();
      });
      refs.boneNameList.appendChild(button);
    }
  }

  if (refs.boneNameCount) {
    refs.boneNameCount.textContent = `${vrmPreviewBoneOptions.length} nodes`;
  }

  if (refs.boneResolveCount || refs.boneResolveSummary) {
    const resolvedLines = Object.entries(state.boneMap).map(([slot, key]) => {
      const resolved = key ? vrmPreviewBoneOptions.find((entry) => entry.key === key) : null;
      return `${slot}: ${resolved ? `${resolved.label} (${resolved.type})` : "auto / unresolved"}`;
    });
    if (refs.boneResolveCount) {
      refs.boneResolveCount.textContent = String(Object.values(state.boneMap).filter(Boolean).length);
    }
    if (refs.boneResolveSummary) {
      refs.boneResolveSummary.textContent = resolvedLines.join(" · ");
    }
  }
}

async function loadVrmPreview(source, label) {
  if (!source || !vrmPreviewRoot) {
    return;
  }

  const token = ++state.loadedVrmToken;
  const previousUrl = state.loadedVrmUrl;
  state.loadedVrmName = label || source;
  state.loadedVrmUrl = source;
  refs.loadedVrmLabel.textContent = `Loading: ${state.loadedVrmName}`;
  render();

  const loader = vrmPreviewLoader ?? (vrmPreviewLoader = new GLTFLoader());

  try {
    const gltf = await loader.loadAsync(source);
    if (token !== state.loadedVrmToken) {
      return;
    }

    clearPreviewModel();
    const modelRoot = gltf.scene ?? gltf.scenes?.[0] ?? null;
    if (!modelRoot) {
      throw new Error("No scene found in VRM asset.");
    }

    modelRoot.traverse?.((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });

    vrmPreviewModelRoot.add(modelRoot);
    fitPreviewModel(modelRoot);
    state.previewOffsetX = 0;
    state.previewOffsetY = 0;
    state.bonePreviewZoom = 1;
    vrmPreviewBoneOptions = collectBoneOptions(modelRoot);
    buildPreviewBoneIndex();
    capturePreviewRestPose();
    state.boneMap = {
      hips: guessBoneMap(vrmPreviewBoneOptions, ["hips", "pelvis", "root", "body"]) || state.boneMap.hips,
      chest: guessBoneMap(vrmPreviewBoneOptions, ["chest", "spine", "upper"]) || state.boneMap.chest,
      head: guessBoneMap(vrmPreviewBoneOptions, ["head", "neck", "face"]) || state.boneMap.head,
      leftArm: guessBoneMap(vrmPreviewBoneOptions, ["leftarm", "arm_l", "l_arm", "shoulderl", "upperarm_l"]) || state.boneMap.leftArm,
      rightArm: guessBoneMap(vrmPreviewBoneOptions, ["rightarm", "arm_r", "r_arm", "shoulderr", "upperarm_r"]) || state.boneMap.rightArm,
      leftLeg: guessBoneMap(vrmPreviewBoneOptions, ["leftleg", "leg_l", "l_leg", "thighl", "upperleg_l"]) || state.boneMap.leftLeg,
      rightLeg: guessBoneMap(vrmPreviewBoneOptions, ["rightleg", "leg_r", "r_leg", "thighr", "upperleg_r"]) || state.boneMap.rightLeg,
    };
    vrmPreviewModelParts = collectModelParts(modelRoot);
    applyBoneMapToParts();
    fitPreviewModel(modelRoot);
    populateBoneControls();
    updatePreviewContentVisibility();
    state.error = "";
    refs.loadedVrmLabel.textContent = `Loaded: ${state.loadedVrmName}`;
    if (previousUrl?.startsWith("blob:") && previousUrl !== source) {
      URL.revokeObjectURL(previousUrl);
    }
    renderPreviewFrame();
    render();
  } catch (error) {
    if (token !== state.loadedVrmToken) {
      return;
    }

    state.error = "VRM load failed.";
    refs.loadedVrmLabel.textContent = "Failed to load VRM.";
    ensurePreviewRig();
    vrmPreviewBoneOptions = [];
    vrmPreviewBoneIndex = new Map();
    vrmPreviewRestPose = new Map();
    populateBoneControls();
    updatePreviewContentVisibility();
    render();
    if (previousUrl?.startsWith("blob:") && previousUrl !== source) {
      URL.revokeObjectURL(previousUrl);
    }
  }
}

async function loadMotionManifest() {
  for (const source of MANIFEST_SOURCES) {
    try {
      const response = await fetch(new URL(source, import.meta.url));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      applyMotionData(data);
      state.error = "";
      state.loading = false;
      const targetId = findMotionFromQuery();
      if (targetId && motions.some((motion) => motion.id === targetId)) {
        state.selectedId = targetId;
      }
      if (!state.selectedId && motions[0]) {
        state.selectedId = motions[0].id;
      }
      render();
      return;
    } catch (error) {
      // Try the next source.
    }
  }

  applyMotionData(null);
  state.error = "Motion manifest could not be loaded. Using fallback data.";
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

function init() {
  refs.motionList = document.getElementById("motionList");
  refs.motionCount = document.getElementById("motionCount");
  refs.tagFilters = document.getElementById("tagFilters");
  refs.motionSearch = document.getElementById("motionSearch");
  refs.playingLabel = document.getElementById("playingLabel");
  refs.sceneViewNote = document.getElementById("sceneViewNote");
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
  refs.boneMapHips = document.getElementById("boneMapHips");
  refs.boneMapChest = document.getElementById("boneMapChest");
  refs.boneMapHead = document.getElementById("boneMapHead");
  refs.boneMapLeftArm = document.getElementById("boneMapLeftArm");
  refs.boneMapRightArm = document.getElementById("boneMapRightArm");
  refs.boneMapLeftLeg = document.getElementById("boneMapLeftLeg");
  refs.boneMapRightLeg = document.getElementById("boneMapRightLeg");
  refs.boneNameList = document.getElementById("boneNameList");
  refs.boneNameCount = document.getElementById("boneNameCount");
  refs.boneResolveCount = document.getElementById("boneResolveCount");
  refs.boneResolveSummary = document.getElementById("boneResolveSummary");
  refs.bonePreviewPanel = document.getElementById("bonePreviewPanel");
  refs.bonePreviewCanvas = document.getElementById("bonePreviewCanvas");
  refs.bonePreviewNote = document.getElementById("bonePreviewNote");
  refs.playButton = document.getElementById("playButton");
  refs.stopButton = document.getElementById("stopButton");
  refs.loopButton = document.getElementById("loopButton");
  refs.bonePreviewToggleButton = document.getElementById("bonePreviewToggleButton");
  refs.saveButton = document.getElementById("saveButton");
  refs.loadButton = document.getElementById("loadButton");
  refs.clearLocalSaveButton = document.getElementById("clearLocalSaveButton");
  refs.loadVrmButton = document.getElementById("loadVrmButton");
  refs.previewAutoRotateButton = document.getElementById("previewAutoRotateButton");
  refs.vrmFileInput = document.getElementById("vrmFileInput");
  refs.seekLabel = document.getElementById("seekLabel");
  refs.saveStatus = document.getElementById("saveStatus");
  refs.loadedVrmLabel = document.getElementById("loadedVrmLabel");
  refs.previewSplit = document.getElementById("previewSplit");
  refs.previewStage = document.getElementById("previewStage");
  refs.vrmPreviewCanvas = document.getElementById("vrmPreviewCanvas");
  refs.tabButtons = [...document.querySelectorAll(".tab")];
  refs.sceneCameraButtons = [...document.querySelectorAll("[data-scene-camera]")];
  refs.previewRotateButtons = [...document.querySelectorAll("[data-preview-rotate]")];

  setupVrmPreview();
  bonePreviewCanvas = refs.bonePreviewCanvas;
  setupBonePreview();
  state.loadedVrmName = STANDARD_VRM_LABEL;
  state.loadedVrmUrl = STANDARD_VRM_SOURCE;
  refs.loadedVrmLabel.textContent = `Loading: ${STANDARD_VRM_LABEL}`;

  refs.motionSearch.addEventListener("input", () => {
    state.search = refs.motionSearch.value;
    render();
  });

  refs.playButton.addEventListener("click", () => {
    const motion = getSelectedMotion();
    if (!motion) {
      return;
    }
    syncPlaybackToSelection(true);
    startMotionPlayback(motion);
  });

  refs.stopButton.addEventListener("click", () => {
    stopMotionPlayback();
  });

  refs.loopButton.addEventListener("click", () => {
    const motion = getSelectedMotion();
    if (!motion) {
      return;
    }
    motion.loop = !motion.loop;
    if (state.isPlaying && state.playbackMotionId === motion.id && !motion.loop) {
      state.playbackTime = Math.min(state.playbackTime, parseDurationSeconds(motion.duration));
    }
    render();
  });

  for (const button of refs.sceneCameraButtons) {
    button.addEventListener("click", () => {
      state.sceneCameraPreset = button.dataset.sceneCamera || "front";
      render();
    });
  }

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

  refs.clearLocalSaveButton.addEventListener("click", () => {
    clearSavedState();
  });

  refs.loadVrmButton.addEventListener("click", () => {
    refs.vrmFileInput?.click();
  });

  refs.previewAutoRotateButton.addEventListener("click", () => {
    state.previewAutoRotate = !state.previewAutoRotate;
    render();
    renderPreviewFrame();
  });

  refs.bonePreviewToggleButton.addEventListener("click", () => {
    state.showBonePreview = !state.showBonePreview;
    updateBonePreviewVisibility();
    renderBonePreviewFrame();
  });

  refs.vrmPreviewCanvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const direction = Math.sign(event.deltaY);
      const factor = direction > 0 ? 1.08 : 0.93;
      state.previewZoom = THREE.MathUtils.clamp((state.previewZoom || 1) * factor, 0.55, 2.1);
      renderPreviewFrame();
    },
    { passive: false },
  );

  refs.bonePreviewCanvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const direction = Math.sign(event.deltaY);
      const factor = direction > 0 ? 0.92 : 1.08;
      state.bonePreviewZoom = THREE.MathUtils.clamp((state.bonePreviewZoom || 1) * factor, 0.45, 2.4);
      renderBonePreviewFrame();
    },
    { passive: false },
  );

  refs.vrmPreviewCanvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    refs.vrmPreviewCanvas.setPointerCapture(event.pointerId);
    previewDragState = { x: event.clientX, y: event.clientY };
    state.previewDragging = true;
    refs.previewStage?.classList.add("is-dragging");
  });

  refs.vrmPreviewCanvas.addEventListener("pointermove", (event) => {
    if (!state.previewDragging || !previewDragState) {
      return;
    }
    const deltaX = event.clientX - previewDragState.x;
    const deltaY = event.clientY - previewDragState.y;
    previewDragState = { x: event.clientX, y: event.clientY };
    applyPreviewDragDelta(deltaX, deltaY);
  });

  const endPreviewDrag = (event) => {
    if (refs.vrmPreviewCanvas.hasPointerCapture?.(event.pointerId)) {
      refs.vrmPreviewCanvas.releasePointerCapture(event.pointerId);
    }
    previewDragState = null;
    state.previewDragging = false;
    refs.previewStage?.classList.remove("is-dragging");
  };

  refs.vrmPreviewCanvas.addEventListener("pointerup", endPreviewDrag);
  refs.vrmPreviewCanvas.addEventListener("pointercancel", endPreviewDrag);

  for (const button of refs.previewRotateButtons) {
    button.addEventListener("click", () => {
      state.previewRotationY = Number(button.dataset.previewRotate || "0");
      state.previewAutoRotate = false;
      render();
      renderPreviewFrame();
    });
  }

  refs.vrmFileInput.addEventListener("change", () => {
    const file = refs.vrmFileInput.files?.[0];
    if (!file) {
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    state.loadedVrmName = file.name;
    refs.vrmFileInput.value = "";
    state.playing = "Loaded VRM";
    void loadVrmPreview(blobUrl, file.name);
    render();
  });

  window.addEventListener("resize", () => {
    renderPreviewFrame();
    renderBonePreviewFrame();
  });

  window.addEventListener("beforeunload", () => {
    if (state.loadedVrmUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(state.loadedVrmUrl);
    }
  });

  refs.seekLabel.addEventListener("input", () => {
    const value = Number(refs.seekLabel.value);
    const motion = getCurrentMotion();
    const duration = motion ? parseDurationSeconds(motion.duration) : 1;
    state.playbackTime = (duration * value) / 100;
    state.playbackProgress = value / 100;
    refs.timelineProgress.style.width = `${Math.max(8, Math.min(100, value))}%`;
    if (state.isPlaying && motion) {
      state.playing = motion.displayName;
    }
    renderPreviewFrame();
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

  void loadVrmPreview(STANDARD_VRM_SOURCE, STANDARD_VRM_LABEL);
}

window.addEventListener("DOMContentLoaded", init);
