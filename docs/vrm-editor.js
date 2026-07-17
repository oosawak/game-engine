import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from "@pixiv/three-vrm-animation";

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
  isPaused: false,
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
  previewSplitWidth: 360,
  loadedVrmName: "",
  loadedVrmUrl: "",
  loadedVrmToken: 0,
  datasetId: "dataset2",
  datasetLabel: "Dataset 2",
  boneMap: {
    hips: "",
    spine: "",
    chest: "",
    neck: "",
    head: "",
    leftShoulder: "",
    rightShoulder: "",
    leftArm: "",
    rightArm: "",
    leftForeArm: "",
    rightForeArm: "",
    leftHand: "",
    rightHand: "",
    leftUpLeg: "",
    rightUpLeg: "",
    leftLeg: "",
    rightLeg: "",
    leftFoot: "",
    rightFoot: "",
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
let vrmPreviewVrm = null;
let vrmPreviewBoneOptions = [];
let vrmPreviewBoneMarker = null;
let vrmPreviewBoneMarkerLabel = null;
let vrmPreviewFrame = 0;
let vrmPreviewLastTime = 0;
let vrmPreviewLoader = null;
let vrmaMotionLoader = null;
let vrmPreviewBoneIndex = new Map();
let vrmPreviewRestPose = new Map();
let vrmaMotionRuntimeCache = new Map();
let bonePreviewCanvas = null;
let bonePreviewScene = null;
let bonePreviewCamera = null;
let bonePreviewRenderer = null;
let bonePreviewRoot = null;
let bonePreviewLine = null;
let bonePreviewDots = [];
let bonePreviewNodeToDot = new Map();
let previewDragState = null;
let previewSplitDragState = null;
const STORAGE_KEY = "game-engine.vrm-editor.v3";
const DATASET_REGISTRY_KEY = "game-engine.vrm-editor.datasets.v1";
const DATASET_SAVE_PREFIX = "game-engine.vrm-editor.dataset.v1.";
const STORAGE_SCHEMA_VERSION = 3;
const LEGACY_STORAGE_KEYS = ["game-engine.vrm-editor.v1", "game-engine.vrm-editor.v2"];
const DATASET_SOURCES = [
  { id: "dataset2", label: "Dataset 2", source: "./datasets/dataset2.json" },
  { id: "dataset3", label: "Dataset 3", source: "./datasets/dataset3.json" },
  { id: "dataset4", label: "Dataset 4", source: "./datasets/dataset4.json" },
  { id: "dataset5", label: "Dataset 5", source: "./datasets/dataset5.json" },
];
const STANDARD_VRM_SOURCE = "./assets/vrm/standard/standard.vrm";
const STANDARD_VRM_LABEL = "Standard VRM";
const MOTION_PREVIEW_SAMPLE_TIME = 0.0;
const REQUIRED_BONE_SLOTS = ["leftShoulder", "rightShoulder", "leftFoot", "rightFoot"];
const BONE_ALIAS_SLOTS = {
  hips: ["hips", "pelvis", "root", "body"],
  spine: ["spine", "spine1", "spine2", "upperspine", "torso"],
  chest: ["chest", "upperchest", "upper_body"],
  neck: ["neck"],
  head: ["head", "face"],
  leftShoulder: ["leftshoulder", "shoulderl", "claviclel", "leftclavicle", "lshoulder", "jbiplshoulder"],
  rightShoulder: ["rightshoulder", "shoulderr", "clavicler", "rightclavicle", "rshoulder", "jbiprshoulder"],
  leftArm: ["leftarm", "left_arm", "arm_l", "l_arm", "shoulderl", "upperarm_l", "leftupperarm"],
  rightArm: ["rightarm", "right_arm", "arm_r", "r_arm", "shoulderr", "upperarm_r", "rightupperarm"],
  leftForeArm: ["leftforearm", "left_forearm", "forearm_l", "l_forearm", "lowerarm_l"],
  rightForeArm: ["rightforearm", "right_forearm", "forearm_r", "r_forearm", "lowerarm_r"],
  leftLeg: ["leftleg", "left_leg", "leg_l", "l_leg", "thighl", "upperleg_l", "leftthigh"],
  rightLeg: ["rightleg", "right_leg", "leg_r", "r_leg", "thighr", "upperleg_r", "rightthigh"],
  leftUpLeg: ["leftupleg", "left_up_leg", "upleg_l", "upperleg_l", "leftthigh"],
  rightUpLeg: ["rightupleg", "right_up_leg", "upleg_r", "upperleg_r", "rightthigh"],
  leftHand: ["lefthand", "left_hand", "hand_l", "l_hand", "leftwrist", "wrist_l"],
  rightHand: ["righthand", "right_hand", "hand_r", "r_hand", "rightwrist", "wrist_r"],
  leftFoot: ["leftfoot", "left_foot", "foot_l", "footl", "l_foot", "leftankle", "ankle_l", "lefttoe", "lefttoebase", "jbiplfoot", "jbipltobase"],
  rightFoot: ["rightfoot", "right_foot", "foot_r", "footr", "r_foot", "rightankle", "ankle_r", "righttoe", "righttoebase", "jbiprfoot", "jbiprtobase"],
};
function getDatasetSourceEntry(datasetId) {
  return DATASET_SOURCES.find((entry) => entry.id === datasetId) ?? DATASET_SOURCES[0];
}

function getDatasetSaveKey(datasetId) {
  return `${DATASET_SAVE_PREFIX}${datasetId}`;
}

function readJsonStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadDatasetRegistry() {
  const snapshot = readJsonStorage(DATASET_REGISTRY_KEY);
  if (!snapshot || typeof snapshot !== "object") {
    return DATASET_SOURCES[0]?.id ?? "";
  }
  const datasetId = typeof snapshot.datasetId === "string" && snapshot.datasetId.trim()
    ? snapshot.datasetId.trim()
    : "";
  if (!datasetId) {
    return DATASET_SOURCES[0]?.id ?? "";
  }
  return DATASET_SOURCES.some((entry) => entry.id === datasetId)
    ? datasetId
    : DATASET_SOURCES[0]?.id ?? "";
}

function saveDatasetRegistry(datasetId) {
  try {
    writeJsonStorage(DATASET_REGISTRY_KEY, {
      datasetId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Ignore registry write failures.
  }
}

function cloneDatasetManifest(rawData) {
  if (!rawData || typeof rawData !== "object") {
    return null;
  }

  const cloned = {
    ...rawData,
  };

  if (Array.isArray(rawData.motions)) {
    cloned.motions = cloneMotionList(rawData.motions.map((motion) => normalizeMotion(motion, 0)).filter(Boolean));
  }

  if (Array.isArray(rawData.tags)) {
    cloned.tags = rawData.tags.filter((tag) => typeof tag === "string");
  }

  return cloned;
}

function resetDatasetView(datasetLabel = state.datasetLabel) {
  motions = [];
  tags = [...DEFAULT_TAGS];
  state.selectedId = "";
  state.playbackMotionId = "";
  state.playbackTime = 0;
  state.playbackProgress = 0;
  state.playing = "Loading...";
  state.loading = true;
  state.error = "";
  state.datasetLabel = datasetLabel;
}

function mergeDatasetManifest(baseData, overrideData) {
  if (!baseData || typeof baseData !== "object") {
    return cloneDatasetManifest(overrideData);
  }

  if (!overrideData || typeof overrideData !== "object") {
    return cloneDatasetManifest(baseData);
  }

  const merged = cloneDatasetManifest(baseData) ?? {};

  for (const [key, value] of Object.entries(overrideData)) {
    if (key === "motions" && Array.isArray(value)) {
      merged.motions = value;
      continue;
    }

    if (key === "tags" && Array.isArray(value)) {
      merged.tags = value;
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      merged[key] = {
        ...(merged[key] && typeof merged[key] === "object" && !Array.isArray(merged[key]) ? merged[key] : {}),
        ...value,
      };
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

async function loadDatasetSource(source) {
  const url = new URL(source, import.meta.url);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data && typeof data.extends === "string" && data.extends.trim()) {
    const parent = await loadDatasetSource(data.extends);
    const next = { ...data };
    delete next.extends;
    return mergeDatasetManifest(parent, next);
  }

  return cloneDatasetManifest(data);
}

async function loadDatasetManifest(datasetId, options = {}) {
  const preferSavedState = Boolean(options.preferSavedState);
  const entry = getDatasetSourceEntry(datasetId);
  resetDatasetView(entry.label);
  render();
  const sourceData = await loadDatasetSource(entry.source);
  const savedData = preferSavedState ? readDatasetSnapshot(entry.id) : null;
  const merged = savedData ? mergeDatasetManifest(sourceData, savedData) : sourceData;

  state.datasetId = entry.id;
  state.datasetLabel = typeof merged?.label === "string" && merged.label.trim()
    ? merged.label.trim()
    : entry.label;
  saveDatasetRegistry(entry.id);
  applyMotionData(merged);
  state.loading = false;

  const targetId = findMotionFromQuery();
  if (targetId && motions.some((motion) => motion.id === targetId)) {
    state.selectedId = targetId;
  }
  if (!state.selectedId && motions[0]) {
    state.selectedId = motions[0].id;
  }
  if (!state.playbackMotionId || !motions.some((motion) => motion.id === state.playbackMotionId)) {
    state.playbackMotionId = state.selectedId;
  }
  state.error = "";
  render();
}

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

function isVrmDatasetMotion(motion) {
  return Boolean(motion?.source && isVrmaSource(motion.source));
}

function datasetHasVrmMotions() {
  return motions.some((motion) => isVrmDatasetMotion(motion));
}

function findBoneNodesByTerms(terms) {
  const normalizedTerms = terms.map(normalizeBoneKey).filter(Boolean);
  return vrmPreviewBoneOptions
    .filter((entry) => {
      const label = normalizeBoneKey(entry.label);
      const type = normalizeBoneKey(entry.type);
      return normalizedTerms.some((term) => label.includes(term) || type.includes(term));
    })
    .map((entry) => entry.node)
    .filter(Boolean);
}

function collectFingerNodes(handSide) {
  const side = normalizeBoneKey(handSide).includes("left") ? "left" : "right";
  const jBipSide = side === "left" ? "jbipl" : "jbipr";
  const prefixTerms = side === "left"
    ? ["left", "l", "lhand", "lwrist"]
    : ["right", "r", "rhand", "rwrist"];
  const fingerGroups = [
    ["thumb", "thumb1", "thumbproximal", "thumbmetacarpal", "thumbdistal"],
    ["index", "index1", "indexproxima", "indexproximal", "indexmetacarpal", "indexdistal"],
    ["middle", "middle1", "middleproximal", "middlemetacarpal", "middledistal"],
    ["ring", "ring1", "ringproximal", "ringmetacarpal", "ringdistal"],
    ["little", "little1", "pinky", "littleproximal", "littlemetacarpal", "littledistal"],
  ];

  const nodes = [];
  for (const fingerTerms of fingerGroups) {
    const terms = [
      ...prefixTerms.flatMap((prefix) => fingerTerms.map((finger) => `${prefix}${finger}`)),
      ...fingerTerms.map((finger) => `${jBipSide}${finger}`),
      ...fingerTerms.map((finger) => `${side}${finger}`),
      ...fingerTerms.map((finger) => `${side}_${finger}`),
      ...fingerTerms.map((finger) => `${side} ${finger}`),
    ];
    for (const node of findBoneNodesByTerms(terms)) {
      if (!nodes.includes(node)) {
        nodes.push(node);
      }
    }
  }

  return nodes;
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
  return motions.find((motion) => motion.id === (state.playbackMotionId || state.selectedId))
    ?? getSelectedMotion()
    ?? null;
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

function getDefaultMotion() {
  return motions[0] ?? null;
}

function formatSeconds(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) {
    return "0.00s";
  }
  return `${seconds.toFixed(2)}s`;
}

function startMotionPlayback(motion = getSelectedMotion() ?? getDefaultMotion()) {
  if (!motion) {
    return;
  }

  state.isPlaying = true;
  state.isPaused = false;
  state.playbackMotionId = motion.id;
  state.playbackTime = 0;
  state.playbackProgress = 0;
  state.playing = motion.displayName;
  render();
  renderPreviewFrame();
}

function showMotionPose(motion = getSelectedMotion() ?? getDefaultMotion()) {
  if (!motion) {
    return;
  }

  const duration = parseDurationSeconds(motion.duration);
  state.selectedId = motion.id;
  state.playbackMotionId = motion.id;
  state.isPlaying = false;
  state.isPaused = false;
  state.playbackTime = Math.min(duration, MOTION_PREVIEW_SAMPLE_TIME);
  state.playbackProgress = duration > 0 ? Math.min(1, state.playbackTime / duration) : 0;
  state.playing = motion.displayName;
  void ensureVrmaMotionRuntime(motion);
  render();
  renderPreviewFrame();
}

function getSeekStatusText(motion = getCurrentMotion()) {
  if (!motion) {
    return "Seek: 0% / Stop: 0.00s";
  }

  const duration = parseDurationSeconds(motion.duration);
  const seekPercent = Math.max(0, Math.min(100, Math.round((state.playbackProgress || 0) * 100)));
  const currentTime = Math.max(0, Math.min(duration, state.playbackTime || 0));
  const stopTime = state.isPlaying || state.isPaused
    ? currentTime
    : Math.min(duration, MOTION_PREVIEW_SAMPLE_TIME);

  return `Seek: ${seekPercent}% / Time: ${formatSeconds(currentTime)} / Stop: ${formatSeconds(stopTime)}`;
}

function updateSeekStatus(motion = getCurrentMotion()) {
  if (refs.seekStatus) {
    refs.seekStatus.textContent = getSeekStatusText(motion);
  }
}

function pauseMotionPlayback() {
  if (!state.playbackMotionId) {
    return;
  }

  state.isPlaying = false;
  state.isPaused = true;
  const motion = getCurrentMotion();
  state.playing = motion ? `Paused: ${motion.displayName}` : "Paused";
  render();
  renderPreviewFrame();
}

function resumeMotionPlayback() {
  if (!state.playbackMotionId) {
    const motion = getPlaybackTargetMotion();
    if (!motion) {
      return;
    }
    startMotionPlayback(motion);
    return;
  }

  state.isPlaying = true;
  state.isPaused = false;
  const motion = getCurrentMotion();
  if (motion) {
    state.playing = motion.displayName;
  }
  render();
  renderPreviewFrame();
}

function stopMotionPlayback() {
  const motion = getCurrentMotion() ?? getSelectedMotion() ?? getDefaultMotion();
  if (motion) {
    const duration = parseDurationSeconds(motion.duration);
    state.playbackMotionId = motion.id;
    state.playbackTime = Math.min(duration, MOTION_PREVIEW_SAMPLE_TIME);
    state.playbackProgress = duration > 0 ? Math.min(1, state.playbackTime / duration) : 0;
    state.playing = `Stopped: ${motion.displayName}`;
  } else {
    state.playbackTime = 0;
    state.playbackProgress = 0;
    state.playing = "Stopped";
  }
  state.isPlaying = false;
  state.isPaused = false;
  render();
  renderPreviewFrame();
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

  if (state.selectedId && !motions.some((motion) => motion.id === state.selectedId)) {
    state.selectedId = "";
  }

  if (!state.playbackMotionId || !motions.some((motion) => motion.id === state.playbackMotionId)) {
    state.playbackMotionId = state.selectedId || motions[0]?.id || "";
  }

  if (!state.playing || state.playing === "Loading...") {
    state.playing = motions[0]?.displayName ?? "Stopped";
  }
}

function readDatasetSnapshot(datasetId) {
  const datasetKey = getDatasetSaveKey(datasetId);
  const storedDataset = readJsonStorage(datasetKey);
  if (storedDataset) {
    return storedDataset;
  }

  const hasDatasetRegistry = Boolean(readJsonStorage(DATASET_REGISTRY_KEY));
  if (!hasDatasetRegistry && datasetId === DATASET_SOURCES[0]?.id) {
    const legacySnapshot = readJsonStorage(STORAGE_KEY);
    if (legacySnapshot) {
      return legacySnapshot;
    }
  }

  return null;
}

function serializeState() {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    datasetId: state.datasetId,
    datasetLabel: state.datasetLabel,
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

function buildDatasetExportName() {
  return `${state.datasetId || "dataset"}.json`;
}

function exportCurrentDataset() {
  const snapshot = serializeState();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildDatasetExportName();
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  state.saveStatus = "Dataset exported";
  render();
}

function normalizeImportedDataset(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (Number(payload.schemaVersion) === STORAGE_SCHEMA_VERSION) {
    return payload;
  }

  const extractedMotions = extractMotionEntries(payload).map(normalizeMotion).filter(Boolean);
  const ui = payload.ui && typeof payload.ui === "object" ? payload.ui : {};

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    datasetId: state.datasetId,
    datasetLabel: state.datasetLabel,
    motions: extractedMotions,
    tags: Array.isArray(payload.tags) ? payload.tags : undefined,
    ui: {
      selectedId: typeof ui.selectedId === "string" ? ui.selectedId : state.selectedId,
      search: typeof ui.search === "string" ? ui.search : state.search,
      tag: typeof ui.tag === "string" ? ui.tag : state.tag,
      playing: typeof ui.playing === "string" ? ui.playing : state.playing,
      sceneCameraPreset: typeof ui.sceneCameraPreset === "string" ? ui.sceneCameraPreset : state.sceneCameraPreset,
    },
  };
}

async function importDatasetFile(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  const snapshot = normalizeImportedDataset(payload);

  if (!snapshot) {
    throw new Error("Invalid dataset JSON.");
  }

  state.datasetLabel = typeof snapshot.datasetLabel === "string" && snapshot.datasetLabel.trim()
    ? snapshot.datasetLabel.trim()
    : state.datasetLabel;
  writeJsonStorage(getDatasetSaveKey(state.datasetId), snapshot);
  writeJsonStorage(STORAGE_KEY, snapshot);
  saveDatasetRegistry(state.datasetId);
  state.saveStatus = "Dataset imported";
  await loadDatasetManifest(state.datasetId);
}

function persistState(label = "Saved locally") {
  try {
    const snapshot = serializeState();
    writeJsonStorage(getDatasetSaveKey(state.datasetId), snapshot);
    writeJsonStorage(STORAGE_KEY, snapshot);
    saveDatasetRegistry(state.datasetId);
    state.saveStatus = label;
  } catch (error) {
    state.saveStatus = "Save failed";
    state.error = "Failed to write local save data.";
  }
  render();
}

function clearSavedState() {
  try {
    localStorage.removeItem(getDatasetSaveKey(state.datasetId));
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
  const datasetId = typeof snapshot?.datasetId === "string" && snapshot.datasetId.trim()
    ? snapshot.datasetId.trim()
    : state.datasetId;

  applyMotionData({
    motions: loadedMotions.length ? loadedMotions : DEFAULT_MOTIONS,
    tags: snapshot?.tags,
  });

  state.datasetId = datasetId;
  state.datasetLabel = typeof snapshot?.datasetLabel === "string" && snapshot.datasetLabel.trim()
    ? snapshot.datasetLabel.trim()
    : getDatasetSourceEntry(datasetId).label;

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
  return hydrateState(readDatasetSnapshot(state.datasetId));
}

function findMotionFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("motion") ?? "";
}

function getSelectedMotion() {
  return motions.find((motion) => motion.id === state.selectedId) ?? null;
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

function renderDatasetSelector() {
  if (!refs.datasetSelect) {
    return;
  }

  if (!refs.datasetSelect.options.length) {
    for (const entry of DATASET_SOURCES) {
      const option = document.createElement("option");
      option.value = entry.id;
      option.textContent = entry.label;
      refs.datasetSelect.appendChild(option);
    }
  }

  refs.datasetSelect.value = state.datasetId;
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

  refs.motionCount.textContent = `${filtered.length} / ${motions.length} items · ${state.datasetLabel}`;

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
    const sourceKind = isVrmDatasetMotion(motion) ? "VRMA" : "Motion";
    card.innerHTML = `
      <div class="motion-title"><span>${motion.displayName}</span><span>${motion.id}</span></div>
      <div class="motion-subtitle">${motion.alias || "No alias"}${motion.content || motion.style ? ` · ${[motion.content, motion.style].filter(Boolean).join(" / ")}` : ""} · ${sourceKind} · ${motion.source}</div>
      <div class="tag-row">
        ${motion.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
      </div>
    `;
    card.addEventListener("click", () => {
      showMotionPose(motion);
    });
    card.addEventListener("dblclick", () => {
      state.selectedId = motion.id;
      syncPlaybackToSelection(true);
      startMotionPlayback(motion);
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
    : state.isPaused
      ? `Paused: ${playbackMotion?.displayName ?? state.playing}`
      : `Playing: ${state.playing}`;
  if (refs.playButton) {
    refs.playButton.classList.toggle("active", state.isPlaying);
    refs.playButton.textContent = state.isPaused ? "Resume" : (state.isPlaying ? "Playing" : "Play");
  }
  if (refs.pauseButton) {
    refs.pauseButton.classList.toggle("active", state.isPaused);
    refs.pauseButton.disabled = !playbackMotion || state.isPaused === false && !state.isPlaying;
  }
  if (refs.stopButton) {
    refs.stopButton.classList.toggle("active", !state.isPlaying);
  }
  if (refs.loopButton) {
    refs.loopButton.classList.toggle("active", Boolean(getCurrentMotion()?.loop));
  }
  refs.sceneViewNote.textContent = `Scene View: ${state.sceneCameraPreset} / rotate ${state.previewRotationY}° / ${state.previewAutoRotate ? "auto rotate on" : "auto rotate off"} / drag to pan / wheel to zoom`;
  const seekValue = Math.max(0, Math.min(100, Math.round((state.playbackProgress || 0) * 100)));
  if (refs.seekLabel && Number(refs.seekLabel.value) !== seekValue) {
    refs.seekLabel.value = String(seekValue);
  }
  refs.timelineProgress.style.width = `${Math.max(8, Math.min(100, seekValue))}%`;
  updateSeekStatus(motion);
  refs.loadedVrmLabel.textContent = state.loadedVrmName ? `Loaded: ${state.loadedVrmName}` : "No VRM loaded.";
  if (refs.vrmaRuntimeSummary) {
    refs.vrmaRuntimeSummary.textContent = getVrmaRuntimeSummary(motion);
  }
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
    persistState("Saved locally");
  });
}

function render() {
  renderDatasetSelector();
  renderSceneCameraButtons();
  renderTagFilters();
  renderMotionList();
  renderDetails();
  applyPreviewSplitWidth(state.previewSplitWidth);
  updateBonePreviewVisibility();
}

function applyPreviewSplitWidth(width = state.previewSplitWidth) {
  const nextWidth = Math.max(220, Math.min(480, Math.round(Number(width) || 360)));
  state.previewSplitWidth = nextWidth;
  document.documentElement.style.setProperty("--preview-split-width", `${nextWidth}px`);
}

function initializePreviewSplitWidth() {
  const rect = refs.previewSplit?.getBoundingClientRect();
  if (!rect || !Number.isFinite(rect.width) || rect.width <= 0) {
    applyPreviewSplitWidth(state.previewSplitWidth);
    return;
  }

  const usableWidth = Math.max(440, rect.width - 10);
  const preferredWidth = Math.round(usableWidth * 0.4);
  state.previewSplitWidth = Math.max(220, Math.min(480, preferredWidth));
  applyPreviewSplitWidth(state.previewSplitWidth);
}

function updateBonePreviewVisibility() {
  const panel = refs.bonePreviewPanel;
  const toggle = refs.bonePreviewToggleButton;
  const split = refs.previewSplit;
  const divider = refs.previewDivider;

  if (!panel || !toggle) {
    return;
  }

  panel.classList.toggle("is-hidden", !state.showBonePreview);
  split?.classList.toggle("is-collapsed", !state.showBonePreview);
  divider?.classList.toggle("is-hidden", !state.showBonePreview);
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
  if (motion && isVrmaSource(motion.source)) {
    const runtime = vrmaMotionRuntimeCache.get(motion.source);
    if (runtime?.ready && vrmPreviewVrm) {
      applyVrmaMotionPose(runtime, motion, progress);
    } else {
      void ensureVrmaMotionRuntime(motion);
    }
  } else {
    applyMotionPose(motion, progress, state.playbackTime);
  }
  vrmPreviewVrm?.update?.(state.isPlaying ? deltaSeconds : 0);
  updateSeekStatus(motion);
  if (refs.vrmaRuntimeSummary) {
    refs.vrmaRuntimeSummary.textContent = getVrmaRuntimeSummary(motion);
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
  placeholderSphere.visible = false;
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
  vrmPreviewVrm = null;
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

function applyVrmaMotionPose(runtime, motion, progress) {
  if (!runtime?.ready || !runtime.clip || !runtime.mixer || !motion) {
    return false;
  }

  for (const entry of vrmPreviewRestPose.values()) {
    if (!entry?.node) {
      continue;
    }
    entry.node.rotation.x = entry.rotation.x;
    entry.node.rotation.y = entry.rotation.y;
    entry.node.rotation.z = entry.rotation.z;
  }

  const duration = runtime.clip.duration || parseDurationSeconds(motion.duration);
  const sampledTime = Math.max(state.playbackTime, MOTION_PREVIEW_SAMPLE_TIME);
  const time = motion.loop ? (sampledTime % duration) : Math.min(sampledTime, duration);
  if (runtime.action) {
    runtime.action.enabled = true;
    runtime.action.paused = false;
    runtime.action.timeScale = 1;
    runtime.action.time = time;
    runtime.action.play();
  }
  runtime.mixer.setTime(time);
  runtime.mixer.update(1 / 60);
  if (runtime.action && !state.isPlaying) {
    runtime.action.paused = true;
  }
  return true;
}

function collectModelParts(root) {
  const lookup = {
    hips: null,
    spine: null,
    chest: null,
    neck: null,
    head: null,
    leftShoulder: null,
    rightShoulder: null,
    leftArm: null,
    rightArm: null,
    leftForeArm: null,
    rightForeArm: null,
    leftUpLeg: null,
    rightUpLeg: null,
    leftLeg: null,
    rightLeg: null,
    leftHand: null,
    rightHand: null,
    leftFoot: null,
    rightFoot: null,
    leftFingerNodes: [],
    rightFingerNodes: [],
  };

  const matches = (name, terms) => terms.some((term) => name.includes(term));

  root.traverse?.((child) => {
    const name = String(child.name || child.type || "").toLowerCase();
    if (!lookup.head && matches(name, ["head", "face"])) {
      lookup.head = child;
    } else if (!lookup.neck && matches(name, ["neck"])) {
      lookup.neck = child;
    } else if (!lookup.chest && matches(name, ["chest", "upperchest", "upper_body"])) {
      lookup.chest = child;
    } else if (!lookup.spine && matches(name, ["spine", "spine1", "spine2", "torso", "upperbody"])) {
      lookup.spine = child;
    } else if (!lookup.hips && matches(name, ["hips", "pelvis", "root", "body"])) {
      lookup.hips = child;
    } else if (!lookup.leftShoulder && matches(name, ["leftshoulder", "shoulderl", "claviclel", "jbiplshoulder"])) {
      lookup.leftShoulder = child;
    } else if (!lookup.rightShoulder && matches(name, ["rightshoulder", "shoulderr", "clavicler", "jbiprshoulder"])) {
      lookup.rightShoulder = child;
    } else if (!lookup.leftArm && matches(name, ["leftarm", "left_arm", "arm_l", "l_arm", "shoulderl", "upperarm_l"])) {
      lookup.leftArm = child;
    } else if (!lookup.rightArm && matches(name, ["rightarm", "right_arm", "arm_r", "r_arm", "shoulderr", "upperarm_r"])) {
      lookup.rightArm = child;
    } else if (!lookup.leftForeArm && matches(name, ["leftforearm", "left_forearm", "forearm_l", "l_forearm", "lowerarm_l"])) {
      lookup.leftForeArm = child;
    } else if (!lookup.rightForeArm && matches(name, ["rightforearm", "right_forearm", "forearm_r", "r_forearm", "lowerarm_r"])) {
      lookup.rightForeArm = child;
    } else if (!lookup.leftUpLeg && matches(name, ["leftupleg", "left_up_leg", "upleg_l", "upperleg_l", "leftthigh"])) {
      lookup.leftUpLeg = child;
    } else if (!lookup.rightUpLeg && matches(name, ["rightupleg", "right_up_leg", "upleg_r", "upperleg_r", "rightthigh"])) {
      lookup.rightUpLeg = child;
    } else if (!lookup.leftLeg && matches(name, ["leftleg", "left_leg", "leg_l", "l_leg", "shin_l", "lowerleg_l", "calf_l"])) {
      lookup.leftLeg = child;
    } else if (!lookup.rightLeg && matches(name, ["rightleg", "right_leg", "leg_r", "r_leg", "shin_r", "lowerleg_r", "calf_r"])) {
      lookup.rightLeg = child;
    } else if (!lookup.leftHand && matches(name, ["lefthand", "left_hand", "hand_l", "l_hand", "leftwrist", "wrist_l"])) {
      lookup.leftHand = child;
    } else if (!lookup.rightHand && matches(name, ["righthand", "right_hand", "hand_r", "r_hand", "rightwrist", "wrist_r"])) {
      lookup.rightHand = child;
    } else if (!lookup.leftFoot && matches(name, ["leftfoot", "left_foot", "foot_l", "l_foot", "leftankle", "ankle_l", "jbiplfoot"])) {
      lookup.leftFoot = child;
    } else if (!lookup.rightFoot && matches(name, ["rightfoot", "right_foot", "foot_r", "r_foot", "rightankle", "ankle_r", "jbiprfoot"])) {
      lookup.rightFoot = child;
    }
  });

  lookup.leftFingerNodes = findBoneNodesByTerms([
    "leftthumb", "left_index", "leftmiddle", "leftring", "leftlittle",
    "thumb_l", "index_l", "middle_l", "ring_l", "little_l", "pinky_l",
    "leftthumb1", "leftindex1", "leftmiddle1", "leftring1", "leftlittle1",
  ]);
  lookup.rightFingerNodes = findBoneNodesByTerms([
    "rightthumb", "right_index", "rightmiddle", "rightring", "rightlittle",
    "thumb_r", "index_r", "middle_r", "ring_r", "little_r", "pinky_r",
    "rightthumb1", "rightindex1", "rightmiddle1", "rightring1", "rightlittle1",
  ]);

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

function isVrmaSource(source) {
  return typeof source === "string" && /\.vrma(\?.*)?$/i.test(source);
}

function getVrmPreviewLoader() {
  if (!vrmPreviewLoader) {
    vrmPreviewLoader = new GLTFLoader();
    vrmPreviewLoader.register((parser) => new VRMLoaderPlugin(parser));
  }
  return vrmPreviewLoader;
}

function getVrmaMotionLoader() {
  if (!vrmaMotionLoader) {
    vrmaMotionLoader = new GLTFLoader();
    vrmaMotionLoader.register((parser) => new VRMAnimationLoaderPlugin(parser));
  }
  return vrmaMotionLoader;
}

const VRMA_BONE_SLOT_MAP = {
  hips: "hips",
  spine: "spine",
  chest: "chest",
  upperChest: "chest",
  neck: "neck",
  head: "head",
  leftShoulder: "leftShoulder",
  rightShoulder: "rightShoulder",
  leftUpperArm: "leftArm",
  rightUpperArm: "rightArm",
  leftLowerArm: "leftForeArm",
  rightLowerArm: "rightForeArm",
  leftHand: "leftHand",
  rightHand: "rightHand",
  leftUpperLeg: "leftUpLeg",
  rightUpperLeg: "rightUpLeg",
  leftLowerLeg: "leftLeg",
  rightLowerLeg: "rightLeg",
  leftFoot: "leftFoot",
  rightFoot: "rightFoot",
  leftToes: "leftFoot",
  rightToes: "rightFoot",
};

const VRM_HUMANOID_SLOT_MAP = {
  hips: "hips",
  spine: "spine",
  chest: "chest",
  upperChest: "chest",
  neck: "neck",
  head: "head",
  leftShoulder: "leftShoulder",
  rightShoulder: "rightShoulder",
  leftUpperArm: "leftArm",
  rightUpperArm: "rightArm",
  leftLowerArm: "leftForeArm",
  rightLowerArm: "rightForeArm",
  leftHand: "leftHand",
  rightHand: "rightHand",
  leftUpperLeg: "leftUpLeg",
  rightUpperLeg: "rightUpLeg",
  leftLowerLeg: "leftLeg",
  rightLowerLeg: "rightLeg",
  leftFoot: "leftFoot",
  rightFoot: "rightFoot",
  leftToes: "leftFoot",
  rightToes: "rightFoot",
};

function getVrmaNodeNameMap(gltf) {
  const json = gltf?.parser?.json ?? {};
  const extension = json.extensions?.VRMC_vrm_animation
    ?? gltf?.userData?.gltfExtensions?.VRMC_vrm_animation
    ?? null;
  const humanBones = extension?.humanoid?.humanBones ?? {};
  const nodes = Array.isArray(json.nodes) ? json.nodes : [];
  const nodeNameMap = new Map();

  for (const [humanBoneName, descriptor] of Object.entries(humanBones)) {
    const nodeIndex = Number(descriptor?.node);
    const sourceNode = Number.isInteger(nodeIndex) ? nodes[nodeIndex] : null;
    const sourceNodeName = typeof sourceNode?.name === "string" ? sourceNode.name.trim() : "";
    if (!sourceNodeName) {
      continue;
    }

    const targetNode = resolveVrmaTargetNode(sourceNodeName, humanBoneName);
    if (!targetNode) {
      continue;
    }

    const targetName = typeof targetNode.name === "string" && targetNode.name.trim()
      ? targetNode.name.trim()
      : sourceNodeName;
    nodeNameMap.set(sourceNodeName, targetName);
  }

  return nodeNameMap;
}

function getVrmHumanoidBoneKeyMap(gltf) {
  const json = gltf?.parser?.json ?? {};
  const extension = json.extensions?.VRMC_vrm
    ?? gltf?.userData?.gltfExtensions?.VRMC_vrm
    ?? null;
  const humanBones = extension?.humanoid?.humanBones ?? {};
  const nodes = Array.isArray(json.nodes) ? json.nodes : [];
  const boneKeyMap = new Map();

  for (const [humanBoneName, descriptor] of Object.entries(humanBones)) {
    const boneKey = VRM_HUMANOID_SLOT_MAP[humanBoneName];
    if (!boneKey) {
      continue;
    }

    const nodeIndex = Number(descriptor?.node);
    const sourceNode = Number.isInteger(nodeIndex) ? nodes[nodeIndex] : null;
    const sourceNodeName = typeof sourceNode?.name === "string" ? sourceNode.name.trim() : "";
    if (!sourceNodeName) {
      continue;
    }

    const resolvedKey = guessBoneMap(vrmPreviewBoneOptions, [sourceNodeName, humanBoneName, boneKey]);
    if (resolvedKey) {
      boneKeyMap.set(boneKey, resolvedKey);
    }
  }

  return boneKeyMap;
}

function resolveVrmaTargetNode(sourceNodeName, humanBoneName) {
  const exactMatch = resolveMotionBoneNode(sourceNodeName);
  if (isBoneLikeNode(exactMatch)) {
    return exactMatch;
  }

  const fingerMatch = resolveVrmaFingerTargetNode(sourceNodeName, humanBoneName);
  if (fingerMatch) {
    return fingerMatch;
  }

  const toeMatch = resolveVrmaToeTargetNode(sourceNodeName, humanBoneName);
  if (toeMatch) {
    return toeMatch;
  }

  const slot = VRMA_BONE_SLOT_MAP[humanBoneName] ?? "";
  if (slot) {
    const slotMatch = resolveMotionSlotNode(slot);
    if (isBoneLikeNode(slotMatch)) {
      return slotMatch;
    }
  }

  return findBoneOptionByTerms([sourceNodeName, humanBoneName], { strict: true });
}

function resolveVrmaFingerTargetNode(sourceNodeName, humanBoneName) {
  const normalized = normalizeBoneKey(sourceNodeName || humanBoneName || "");
  const match = normalized.match(/^(left|right)(thumb|index|middle|ring|little)(metacarpal|proximal|intermediate|distal)$/);
  if (!match) {
    return null;
  }

  const side = match[1] === "left" ? "Left" : "Right";
  const finger = match[2].charAt(0).toUpperCase() + match[2].slice(1);
  const segment = match[3];
  const segmentIndex = match[2] === "thumb"
    ? (segment === "metacarpal" ? 1 : segment === "proximal" ? 2 : 3)
    : (segment === "proximal" || segment === "metacarpal" ? 1 : segment === "intermediate" ? 2 : 3);
  const candidateName = `${side}Hand${finger}${segmentIndex}`;
  const candidate = resolveMotionBoneNode(candidateName);
  if (isBoneLikeNode(candidate)) {
    return candidate;
  }
  return findBoneOptionByTerms([candidateName, normalized], { strict: true });
}

function resolveVrmaToeTargetNode(sourceNodeName, humanBoneName) {
  const normalized = normalizeBoneKey(sourceNodeName || humanBoneName || "");
  if (!normalized.includes("toe")) {
    return null;
  }

  const side = normalized.startsWith("left") ? "left" : normalized.startsWith("right") ? "right" : "";
  if (!side) {
    return null;
  }

  const candidates = [
    `${side}toeBase`,
    `${side}toe`,
    `${side}foot`,
  ];

  for (const candidateName of candidates) {
    const node = resolveMotionBoneNode(candidateName);
    if (isBoneLikeNode(node)) {
      return node;
    }
  }

  return null;
}

function getVrmaRuntimeSummary(motion) {
  if (!motion || !isVrmaSource(motion.source)) {
    return "No VRMA motion selected.";
  }

  const runtime = vrmaMotionRuntimeCache.get(motion.source);
  if (!runtime) {
    return "VRMA runtime not initialized yet.";
  }
  if (runtime.loading) {
    return "VRMA runtime loading...";
  }
  if (runtime.error) {
    return `VRMA runtime error: ${runtime.error}`;
  }
  if (!runtime.ready) {
    return "VRMA runtime not ready.";
  }

  const trackCount = Array.isArray(runtime.clip?.tracks) ? runtime.clip.tracks.length : 0;
  return `VRMA runtime ready · tracks: ${trackCount}`;
}

function buildNodeNameSet(root) {
  const names = new Set();

  root?.traverse?.((child) => {
    const name = String(child.name || "").trim();
    if (name) {
      names.add(name);
      names.add(normalizeBoneKey(name));
    }
    const type = String(child.type || "").trim();
    if (type) {
      names.add(type);
      names.add(normalizeBoneKey(type));
    }
  });

  return names;
}

function remapAnimationClip(clip, nodeNameMap, targetNameSet = new Set()) {
  if (!clip) {
    return {
      clip: null,
      sourceTrackCount: 0,
      mappedTrackCount: 0,
      missingTrackNames: [],
    };
  }

  const sourceTrackCount = Array.isArray(clip.tracks) ? clip.tracks.length : 0;
  const missingTrackNames = [];
  const tracks = clip.tracks.map((track) => {
    const originalName = String(track.name || "");
    const lastDot = originalName.lastIndexOf(".");
    if (lastDot === -1) {
      return track.clone();
    }

    const nodeName = originalName.slice(0, lastDot);
    const propertyPath = originalName.slice(lastDot + 1);
    const mappedName = nodeNameMap.get(nodeName);
    const candidateName = mappedName || nodeName;
    const candidateKey = normalizeBoneKey(candidateName);
    if (targetNameSet.size && !targetNameSet.has(candidateName) && !targetNameSet.has(candidateKey)) {
      missingTrackNames.push(originalName);
      return null;
    }
    const clonedTrack = track.clone();
    if (mappedName) {
      clonedTrack.name = `${mappedName}.${propertyPath}`;
    }
    return clonedTrack;
  }).filter(Boolean);

  return {
    clip: new THREE.AnimationClip(clip.name || "vrma", clip.duration, tracks),
    sourceTrackCount,
    mappedTrackCount: tracks.length,
    missingTrackNames,
  };
}

async function ensureVrmaMotionRuntime(motion) {
  if (!motion?.source || !isVrmaSource(motion.source)) {
    return null;
  }

  if (!vrmPreviewVrm?.scene) {
    return null;
  }

  const cached = vrmaMotionRuntimeCache.get(motion.source);
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
  };
  vrmaMotionRuntimeCache.set(motion.source, entry);

  try {
    const loader = getVrmaMotionLoader();
    const gltf = await loader.loadAsync(motion.source);
    const vrmAnimation = gltf?.userData?.vrmAnimations?.[0] ?? gltf?.vrmAnimations?.[0] ?? null;
    if (!vrmAnimation) {
      throw new Error("VRMA animation data not found.");
    }

    const clip = createVRMAnimationClip(vrmAnimation, vrmPreviewVrm);
    if (!clip) {
      throw new Error("VRMA animation clip creation failed.");
    }

    const mixer = new THREE.AnimationMixer(vrmPreviewVrm.scene);
    const action = mixer.clipAction(clip);
    action.loop = motion.loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.clampWhenFinished = !motion.loop;
    action.reset();
    action.enabled = true;
    action.paused = false;
    action.timeScale = 1;
    action.play();

    entry.group = vrmPreviewVrm.scene;
    entry.root = vrmPreviewVrm.scene;
    entry.clip = clip;
    entry.mixer = mixer;
    entry.action = action;
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

function findBoneOptionByTerms(terms, options = {}) {
  const strict = Boolean(options.strict);
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

  if (strict) {
    return null;
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

function isBoneLikeNode(node) {
  if (!node) {
    return false;
  }

  return node.isBone || isBoneLikeType(node.type) || isBoneLikeType(node.name);
}

function applyBoneMapToParts() {
  if (!vrmPreviewModelRoot && !vrmPreviewRig) {
    return;
  }

  const fallback = vrmPreviewRig?.userData.parts ?? {};
  const mapped = {
    hips: resolveBoneMapNode(state.boneMap.hips, ""),
    spine: resolveBoneMapNode(state.boneMap.spine, ""),
    chest: resolveBoneMapNode(state.boneMap.chest, ""),
    neck: resolveBoneMapNode(state.boneMap.neck, ""),
    head: resolveBoneMapNode(state.boneMap.head, ""),
    leftShoulder: resolveBoneMapNode(state.boneMap.leftShoulder, ""),
    rightShoulder: resolveBoneMapNode(state.boneMap.rightShoulder, ""),
    leftArm: resolveBoneMapNode(state.boneMap.leftArm, ""),
    rightArm: resolveBoneMapNode(state.boneMap.rightArm, ""),
    leftForeArm: resolveBoneMapNode(state.boneMap.leftForeArm, ""),
    rightForeArm: resolveBoneMapNode(state.boneMap.rightForeArm, ""),
    leftUpLeg: resolveBoneMapNode(state.boneMap.leftUpLeg, ""),
    rightUpLeg: resolveBoneMapNode(state.boneMap.rightUpLeg, ""),
    leftLeg: resolveBoneMapNode(state.boneMap.leftLeg, ""),
    rightLeg: resolveBoneMapNode(state.boneMap.rightLeg, ""),
    leftHand: resolveBoneMapNode(state.boneMap.leftHand, ""),
    rightHand: resolveBoneMapNode(state.boneMap.rightHand, ""),
    leftFoot: resolveBoneMapNode(state.boneMap.leftFoot, ""),
    rightFoot: resolveBoneMapNode(state.boneMap.rightFoot, ""),
  };

  vrmPreviewModelParts = {
    hips: mapped.hips ?? fallback.hips ?? null,
    spine: mapped.spine ?? fallback.spine ?? null,
    chest: mapped.chest ?? fallback.chest ?? null,
    neck: mapped.neck ?? fallback.neck ?? null,
    head: mapped.head ?? fallback.head ?? null,
    leftShoulder: mapped.leftShoulder ?? fallback.leftShoulder ?? null,
    rightShoulder: mapped.rightShoulder ?? fallback.rightShoulder ?? null,
    leftArm: mapped.leftArm ?? fallback.leftArm ?? null,
    rightArm: mapped.rightArm ?? fallback.rightArm ?? null,
    leftForeArm: mapped.leftForeArm ?? fallback.leftForeArm ?? null,
    rightForeArm: mapped.rightForeArm ?? fallback.rightForeArm ?? null,
    leftUpLeg: mapped.leftUpLeg ?? fallback.leftUpLeg ?? null,
    rightUpLeg: mapped.rightUpLeg ?? fallback.rightUpLeg ?? null,
    leftLeg: mapped.leftLeg ?? fallback.leftLeg ?? null,
    rightLeg: mapped.rightLeg ?? fallback.rightLeg ?? null,
    leftHand: mapped.leftHand ?? fallback.leftHand ?? null,
    rightHand: mapped.rightHand ?? fallback.rightHand ?? null,
    leftFoot: mapped.leftFoot ?? fallback.leftFoot ?? null,
    rightFoot: mapped.rightFoot ?? fallback.rightFoot ?? null,
  };
}

function populateBoneControls() {
  const selectRefs = {
    hips: refs.boneMapHips,
    spine: refs.boneMapSpine,
    chest: refs.boneMapChest,
    neck: refs.boneMapNeck,
    head: refs.boneMapHead,
    leftShoulder: refs.boneMapLeftShoulder,
    rightShoulder: refs.boneMapRightShoulder,
    leftArm: refs.boneMapLeftArm,
    rightArm: refs.boneMapRightArm,
    leftForeArm: refs.boneMapLeftForeArm,
    rightForeArm: refs.boneMapRightForeArm,
    leftUpLeg: refs.boneMapLeftUpLeg,
    rightUpLeg: refs.boneMapRightUpLeg,
    leftLeg: refs.boneMapLeftLeg,
    rightLeg: refs.boneMapRightLeg,
    leftHand: refs.boneMapLeftHand,
    rightHand: refs.boneMapRightHand,
    leftFoot: refs.boneMapLeftFoot,
    rightFoot: refs.boneMapRightFoot,
  };

  const emptyOption = '<option value="">(auto)</option>';
  const optionHtml = vrmPreviewBoneOptions
    .map((entry) => `<option value="${entry.key}">${entry.label} (${entry.type})</option>`)
    .join("");

  for (const [slot, select] of Object.entries(selectRefs)) {
    if (!select) {
      continue;
    }
    select.classList.toggle("is-required-slot", REQUIRED_BONE_SLOTS.includes(slot));
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
      const required = REQUIRED_BONE_SLOTS.includes(slot) ? "required" : "optional";
      return `${slot} [${required}]: ${resolved ? `${resolved.label} (${resolved.type})` : "auto / unresolved"}`;
    });
    const requiredLines = REQUIRED_BONE_SLOTS.map((slot) => {
      const key = state.boneMap[slot] || "";
      const resolved = key ? vrmPreviewBoneOptions.find((entry) => entry.key === key) : null;
      return `${slot}: ${resolved ? `${resolved.label}` : "unresolved"}`;
    });
    if (refs.boneResolveCount) {
      refs.boneResolveCount.textContent = String(Object.values(state.boneMap).filter(Boolean).length);
    }
    if (refs.boneResolveSummary) {
      refs.boneResolveSummary.textContent = `Required: ${requiredLines.join(" · ")} | All: ${resolvedLines.join(" · ")}`;
    }
  }
}

async function loadVrmPreview(source, label) {
  if (!source || !vrmPreviewRoot) {
    return;
  }

  const token = ++state.loadedVrmToken;
  const previousUrl = state.loadedVrmUrl;
  vrmaMotionRuntimeCache.clear();
  vrmPreviewVrm = null;
  state.loadedVrmName = label || source;
  state.loadedVrmUrl = source;
  refs.loadedVrmLabel.textContent = `Loading: ${state.loadedVrmName}`;
  render();

  const loader = getVrmPreviewLoader();

  try {
    const gltf = await loader.loadAsync(source);
    if (token !== state.loadedVrmToken) {
      return;
    }

    clearPreviewModel();
    vrmPreviewVrm = gltf?.userData?.vrm ?? null;
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
    state.previewZoom = 1;
    state.bonePreviewZoom = 1;
    vrmPreviewBoneOptions = collectBoneOptions(modelRoot);
    buildPreviewBoneIndex();
    capturePreviewRestPose();
    const vrmHumanoidBoneKeyMap = getVrmHumanoidBoneKeyMap(gltf);
    state.boneMap = {
      hips: vrmHumanoidBoneKeyMap.get("hips") || guessBoneMap(vrmPreviewBoneOptions, ["hips", "pelvis", "root", "body"]) || state.boneMap.hips,
      spine: vrmHumanoidBoneKeyMap.get("spine") || guessBoneMap(vrmPreviewBoneOptions, ["spine", "spine1", "torso"]) || state.boneMap.spine,
      chest: vrmHumanoidBoneKeyMap.get("chest") || guessBoneMap(vrmPreviewBoneOptions, ["chest", "spine", "upper"]) || state.boneMap.chest,
      neck: vrmHumanoidBoneKeyMap.get("neck") || guessBoneMap(vrmPreviewBoneOptions, ["neck"]) || state.boneMap.neck,
      head: vrmHumanoidBoneKeyMap.get("head") || guessBoneMap(vrmPreviewBoneOptions, ["head", "face"]) || state.boneMap.head,
      leftShoulder: vrmHumanoidBoneKeyMap.get("leftShoulder") || guessBoneMap(vrmPreviewBoneOptions, ["leftshoulder", "claviclel", "jbiplshoulder"]) || state.boneMap.leftShoulder,
      rightShoulder: vrmHumanoidBoneKeyMap.get("rightShoulder") || guessBoneMap(vrmPreviewBoneOptions, ["rightshoulder", "clavicler", "jbiprshoulder"]) || state.boneMap.rightShoulder,
      leftArm: vrmHumanoidBoneKeyMap.get("leftArm") || guessBoneMap(vrmPreviewBoneOptions, ["leftarm", "arm_l", "l_arm", "upperarm_l"]) || state.boneMap.leftArm,
      rightArm: vrmHumanoidBoneKeyMap.get("rightArm") || guessBoneMap(vrmPreviewBoneOptions, ["rightarm", "arm_r", "r_arm", "upperarm_r"]) || state.boneMap.rightArm,
      leftForeArm: vrmHumanoidBoneKeyMap.get("leftForeArm") || guessBoneMap(vrmPreviewBoneOptions, ["leftforearm", "forearm_l", "lowerarm_l"]) || state.boneMap.leftForeArm,
      rightForeArm: vrmHumanoidBoneKeyMap.get("rightForeArm") || guessBoneMap(vrmPreviewBoneOptions, ["rightforearm", "forearm_r", "lowerarm_r"]) || state.boneMap.rightForeArm,
      leftUpLeg: vrmHumanoidBoneKeyMap.get("leftUpLeg") || guessBoneMap(vrmPreviewBoneOptions, ["leftupleg", "upperleg_l", "leftthigh"]) || state.boneMap.leftUpLeg,
      rightUpLeg: vrmHumanoidBoneKeyMap.get("rightUpLeg") || guessBoneMap(vrmPreviewBoneOptions, ["rightupleg", "upperleg_r", "rightthigh"]) || state.boneMap.rightUpLeg,
      leftLeg: vrmHumanoidBoneKeyMap.get("leftLeg") || guessBoneMap(vrmPreviewBoneOptions, ["leftleg", "leg_l", "l_leg", "lowerleg_l", "shin_l", "calf_l"]) || state.boneMap.leftLeg,
      rightLeg: vrmHumanoidBoneKeyMap.get("rightLeg") || guessBoneMap(vrmPreviewBoneOptions, ["rightleg", "leg_r", "r_leg", "lowerleg_r", "shin_r", "calf_r"]) || state.boneMap.rightLeg,
      leftHand: vrmHumanoidBoneKeyMap.get("leftHand") || guessBoneMap(vrmPreviewBoneOptions, ["lefthand", "hand_l", "wrist_l"]) || state.boneMap.leftHand,
      rightHand: vrmHumanoidBoneKeyMap.get("rightHand") || guessBoneMap(vrmPreviewBoneOptions, ["righthand", "hand_r", "wrist_r"]) || state.boneMap.rightHand,
      leftFoot: vrmHumanoidBoneKeyMap.get("leftFoot") || guessBoneMap(vrmPreviewBoneOptions, ["leftfoot", "footl", "ankle_l", "lefttoe", "jbiplfoot"]) || state.boneMap.leftFoot,
      rightFoot: vrmHumanoidBoneKeyMap.get("rightFoot") || guessBoneMap(vrmPreviewBoneOptions, ["rightfoot", "footr", "ankle_r", "righttoe", "jbiprfoot"]) || state.boneMap.rightFoot,
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
  state.loading = true;
  render();

  try {
    await loadDatasetManifest(state.datasetId, { preferSavedState: false });
    state.error = "";
  } catch (error) {
    applyMotionData(null);
    state.error = "Motion dataset could not be loaded. Using fallback data.";
    state.loading = false;
    state.saveStatus = "Load failed";
    render();
  }
}

async function init() {
  refs.motionList = document.getElementById("motionList");
  refs.motionCount = document.getElementById("motionCount");
  refs.tagFilters = document.getElementById("tagFilters");
  refs.datasetSelect = document.getElementById("datasetSelect");
  refs.motionSearch = document.getElementById("motionSearch");
  refs.playingLabel = document.getElementById("playingLabel");
  refs.sceneViewNote = document.getElementById("sceneViewNote");
  refs.overlayId = document.getElementById("overlayId");
  refs.overlayAlias = document.getElementById("overlayAlias");
  refs.timelineProgress = document.getElementById("timelineProgress");
  refs.seekStatus = document.getElementById("seekStatus");
  refs.footerSummary = document.getElementById("footerSummary");
  refs.detailId = document.getElementById("detailId");
  refs.detailAlias = document.getElementById("detailAlias");
  refs.detailDisplayName = document.getElementById("detailDisplayName");
  refs.detailSource = document.getElementById("detailSource");
  refs.detailTags = document.getElementById("detailTags");
  refs.detailPriority = document.getElementById("detailPriority");
  refs.detailLoop = document.getElementById("detailLoop");
  refs.vrmaRuntimeSummary = document.getElementById("vrmaRuntimeSummary");
  refs.boneMapHips = document.getElementById("boneMapHips");
  refs.boneMapSpine = document.getElementById("boneMapSpine");
  refs.boneMapChest = document.getElementById("boneMapChest");
  refs.boneMapNeck = document.getElementById("boneMapNeck");
  refs.boneMapHead = document.getElementById("boneMapHead");
  refs.boneMapLeftShoulder = document.getElementById("boneMapLeftShoulder");
  refs.boneMapRightShoulder = document.getElementById("boneMapRightShoulder");
  refs.boneMapLeftArm = document.getElementById("boneMapLeftArm");
  refs.boneMapRightArm = document.getElementById("boneMapRightArm");
  refs.boneMapLeftForeArm = document.getElementById("boneMapLeftForeArm");
  refs.boneMapRightForeArm = document.getElementById("boneMapRightForeArm");
  refs.boneMapLeftUpLeg = document.getElementById("boneMapLeftUpLeg");
  refs.boneMapRightUpLeg = document.getElementById("boneMapRightUpLeg");
  refs.boneMapLeftLeg = document.getElementById("boneMapLeftLeg");
  refs.boneMapRightLeg = document.getElementById("boneMapRightLeg");
  refs.boneMapLeftHand = document.getElementById("boneMapLeftHand");
  refs.boneMapRightHand = document.getElementById("boneMapRightHand");
  refs.boneMapLeftFoot = document.getElementById("boneMapLeftFoot");
  refs.boneMapRightFoot = document.getElementById("boneMapRightFoot");
  refs.boneNameList = document.getElementById("boneNameList");
  refs.boneNameCount = document.getElementById("boneNameCount");
  refs.boneResolveCount = document.getElementById("boneResolveCount");
  refs.boneResolveSummary = document.getElementById("boneResolveSummary");
  refs.bonePreviewPanel = document.getElementById("bonePreviewPanel");
  refs.bonePreviewCanvas = document.getElementById("bonePreviewCanvas");
  refs.bonePreviewNote = document.getElementById("bonePreviewNote");
  refs.playButton = document.getElementById("playButton");
  refs.pauseButton = document.getElementById("pauseButton");
  refs.stopButton = document.getElementById("stopButton");
  refs.loopButton = document.getElementById("loopButton");
  refs.bonePreviewToggleButton = document.getElementById("bonePreviewToggleButton");
  refs.saveButton = document.getElementById("saveButton");
  refs.loadButton = document.getElementById("loadButton");
  refs.clearLocalSaveButton = document.getElementById("clearLocalSaveButton");
  refs.exportDatasetButton = document.getElementById("exportDatasetButton");
  refs.importDatasetButton = document.getElementById("importDatasetButton");
  refs.clearMotionSelectionButton = document.getElementById("clearMotionSelectionButton");
  refs.datasetFileInput = document.getElementById("datasetFileInput");
  refs.loadVrmButton = document.getElementById("loadVrmButton");
  refs.previewAutoRotateButton = document.getElementById("previewAutoRotateButton");
  refs.vrmFileInput = document.getElementById("vrmFileInput");
  refs.seekLabel = document.getElementById("seekLabel");
  refs.saveStatus = document.getElementById("saveStatus");
  refs.loadedVrmLabel = document.getElementById("loadedVrmLabel");
  refs.previewSplit = document.getElementById("previewSplit");
  refs.previewDivider = document.getElementById("previewDivider");
  refs.previewStage = document.getElementById("previewStage");
  refs.vrmPreviewCanvas = document.getElementById("vrmPreviewCanvas");
  refs.tabButtons = [...document.querySelectorAll(".tab")];
  refs.sceneCameraButtons = [...document.querySelectorAll("[data-scene-camera]")];
  refs.previewRotateButtons = [...document.querySelectorAll("[data-preview-rotate]")];

  const registryDatasetId = loadDatasetRegistry();
  if (registryDatasetId) {
    state.datasetId = registryDatasetId;
    state.datasetLabel = getDatasetSourceEntry(registryDatasetId).label;
  }

  setupVrmPreview();
  bonePreviewCanvas = refs.bonePreviewCanvas;
  setupBonePreview();
  initializePreviewSplitWidth();
  state.loadedVrmName = STANDARD_VRM_LABEL;
  state.loadedVrmUrl = STANDARD_VRM_SOURCE;
  refs.loadedVrmLabel.textContent = `Loading: ${STANDARD_VRM_LABEL}`;

  refs.motionSearch.addEventListener("input", () => {
    state.search = refs.motionSearch.value;
    render();
  });

  refs.playButton.addEventListener("click", () => {
    const motion = getSelectedMotion() ?? getDefaultMotion();
    if (!motion) {
      return;
    }
    if (state.isPaused && state.playbackMotionId === motion.id) {
      resumeMotionPlayback();
      return;
    }
    syncPlaybackToSelection(true);
    startMotionPlayback(motion);
  });

  refs.pauseButton?.addEventListener("click", () => {
    pauseMotionPlayback();
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

  refs.clearMotionSelectionButton?.addEventListener("click", () => {
    state.selectedId = "";
    state.playbackMotionId = "";
    state.isPlaying = false;
    state.playing = "Stopped";
    state.playbackTime = 0;
    state.playbackProgress = 0;
    render();
    renderPreviewFrame();
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
      void loadDatasetManifest(state.datasetId, { preferSavedState: false });
      return;
    }
    render();
  });

  refs.clearLocalSaveButton.addEventListener("click", () => {
    clearSavedState();
    void loadDatasetManifest(state.datasetId);
  });

  refs.exportDatasetButton.addEventListener("click", () => {
    exportCurrentDataset();
  });

  refs.importDatasetButton.addEventListener("click", () => {
    refs.datasetFileInput?.click();
  });

  refs.datasetFileInput.addEventListener("change", async () => {
    const file = refs.datasetFileInput.files?.[0];
    refs.datasetFileInput.value = "";
    if (!file) {
      return;
    }

    try {
      await importDatasetFile(file);
    } catch (error) {
      state.error = "Dataset import failed.";
      state.saveStatus = "Import failed";
      render();
    }
  });

  refs.datasetSelect?.addEventListener("change", async () => {
    const nextDatasetId = refs.datasetSelect.value;
    if (!nextDatasetId || nextDatasetId === state.datasetId) {
      return;
    }

    persistState("Saved locally");
    state.loading = true;
    render();
    try {
      await loadDatasetManifest(nextDatasetId, { preferSavedState: false });
    } catch (error) {
      state.loading = false;
      state.error = `Failed to load ${nextDatasetId}.`;
      render();
    }
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

  refs.previewDivider?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !refs.previewSplit) {
      return;
    }
    event.preventDefault();
    refs.previewDivider.setPointerCapture(event.pointerId);
    const rect = refs.previewSplit.getBoundingClientRect();
    previewSplitDragState = {
      startX: event.clientX,
      startWidth: state.previewSplitWidth || 360,
      left: rect.left,
      width: rect.width,
    };
    refs.previewDivider.classList.add("is-dragging");
  });

  refs.previewDivider?.addEventListener("pointermove", (event) => {
    if (!previewSplitDragState || !refs.previewSplit) {
      return;
    }
    const rect = refs.previewSplit.getBoundingClientRect();
    const deltaX = event.clientX - previewSplitDragState.startX;
    const usableWidth = Math.max(440, rect.width - 10);
    const nextWidth = Math.max(220, Math.min(480, previewSplitDragState.startWidth + deltaX));
    const maxWidth = Math.max(220, usableWidth - 220);
    state.previewSplitWidth = Math.max(220, Math.min(nextWidth, maxWidth));
    applyPreviewSplitWidth(state.previewSplitWidth);
    renderPreviewFrame();
    renderBonePreviewFrame();
  });

  const endPreviewSplitDrag = (event) => {
    if (refs.previewDivider?.hasPointerCapture?.(event.pointerId)) {
      refs.previewDivider.releasePointerCapture(event.pointerId);
    }
    previewSplitDragState = null;
    refs.previewDivider?.classList.remove("is-dragging");
  };

  refs.previewDivider?.addEventListener("pointerup", endPreviewSplitDrag);
  refs.previewDivider?.addEventListener("pointercancel", endPreviewSplitDrag);

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
    applyPreviewSplitWidth(state.previewSplitWidth);
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
    if (motion) {
      state.playbackMotionId = motion.id;
      state.isPlaying = false;
      state.isPaused = true;
      state.playing = `Paused: ${motion.displayName}`;
    }
    refs.timelineProgress.style.width = `${Math.max(8, Math.min(100, value))}%`;
    updateSeekStatus(motion);
    renderPreviewFrame();
  });

  refs.seekLabel.addEventListener("pointerdown", () => {
    const motion = getCurrentMotion();
    if (!motion) {
      return;
    }

    state.playbackTime = 0;
    state.playbackProgress = 0;
    state.playbackMotionId = motion.id;
    state.isPlaying = false;
    state.isPaused = false;
    state.playing = motion.displayName;
    updateSeekStatus(motion);
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
  await loadMotionManifest();

  void loadVrmPreview(STANDARD_VRM_SOURCE, STANDARD_VRM_LABEL);
}

window.addEventListener("DOMContentLoaded", init);
