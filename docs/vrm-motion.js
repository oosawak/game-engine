const STORAGE_KEY = "game-engine.vrm-editor.v1";
const BODY_MANIFEST_SOURCES = ["./vrm-motion-dataset.json"];
const POSE_MANIFEST_SOURCES = ["./vrm-motion-dataset.json"];
const DEFAULT_TAGS = ["", "idle", "loop", "locomotion", "movement", "gesture", "emote", "default", "safe", "once", "reaction", "combat", "pose"];

const DEFAULT_BODY_MOTIONS = [];

const DEFAULT_POSE_DATA = [];

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
let bodyMotions = cloneBodyList(DEFAULT_BODY_MOTIONS);
let poseData = clonePoseList(DEFAULT_POSE_DATA);
let motions = mergeMotionData(bodyMotions, poseData);
let tags = [...DEFAULT_TAGS];
let baseBodyMotions = cloneBodyList(DEFAULT_BODY_MOTIONS);
let basePoseData = clonePoseList(DEFAULT_POSE_DATA);
const PRESET_POSES = {
  guide: { label: "Guide Normal", templateId: "dataset_guide_normal_001" },
  walk: { label: "Walk Normal", templateId: "dataset_walk_normal_001" },
  run: { label: "Run Active", templateId: "dataset_run_active_001" },
  dash: { label: "Dash Active", templateId: "dataset_dash_active_001" },
  bow: { label: "Bow Normal", templateId: "dataset_bow_normal_001" },
  bye: { label: "Bye Normal", templateId: "dataset_bye_normal_001" },
  dance: { label: "Dance Musical", templateId: "dataset_dance_musical_001" },
};

function cloneBodyList(list) {
  return list.map((motion) => ({
    ...motion,
    tags: [...(motion.tags ?? [])],
  }));
}

function cloneMotion(motion) {
  if (!motion) {
    return null;
  }

  return {
    ...motion,
    tags: [...(motion.tags ?? [])],
    boneRotations: cloneBoneRotations(motion.boneRotations),
    expressionAdjustments: cloneExpressionAdjustments(motion.expressionAdjustments),
    fingerAdjustments: cloneFingerAdjustments(motion.fingerAdjustments),
  };
}

function clonePoseList(list) {
  return list.map((pose) => ({
    id: pose.id,
    boneRotations: cloneBoneRotations(pose.boneRotations),
    expressionAdjustments: cloneExpressionAdjustments(pose.expressionAdjustments),
    fingerAdjustments: cloneFingerAdjustments(pose.fingerAdjustments),
  }));
}

function mergeMotionData(bodies, poses) {
  const poseById = new Map(poses.map((pose) => [pose.id, pose]));
  return bodies.map((body) => {
    const pose = poseById.get(body.id);
    return {
      ...cloneMotion(body),
      boneRotations: cloneBoneRotations(pose?.boneRotations ?? body.boneRotations),
      expressionAdjustments: cloneExpressionAdjustments(pose?.expressionAdjustments ?? body.expressionAdjustments),
      fingerAdjustments: cloneFingerAdjustments(pose?.fingerAdjustments ?? body.fingerAdjustments),
    };
  });
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

function normalize(value) {
  return value.trim().toLowerCase();
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
  const scriptName = typeof raw.scriptName === "string" && raw.scriptName.trim() ? raw.scriptName.trim() : id;
  const displayName = typeof raw.displayName === "string" && raw.displayName.trim() ? raw.displayName.trim() : alias || id;
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

function extractBodyEntries(rawData) {
  if (!rawData || typeof rawData !== "object") {
    return [];
  }

  if (Array.isArray(rawData.bodies)) {
    return rawData.bodies;
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
        content: typeof asset.content === "string" ? asset.content : "",
        style: typeof asset.style === "string" ? asset.style : "",
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

function extractPoseEntries(rawData) {
  if (!rawData || typeof rawData !== "object") {
    return [];
  }

  if (Array.isArray(rawData.poses)) {
    return rawData.poses;
  }

  if (Array.isArray(rawData.motions)) {
    return rawData.motions.map((motion) => ({
      id: motion.id,
      boneRotations: motion.boneRotations,
      expressionAdjustments: motion.expressionAdjustments,
      fingerAdjustments: motion.fingerAdjustments,
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

function normalizePoseEntry(raw, index) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `pose_${index + 1}`;
  return {
    id,
    boneRotations: normalizeBoneRotations(raw.boneRotations),
    expressionAdjustments: normalizeExpressionAdjustments(raw.expressionAdjustments),
    fingerAdjustments: normalizeFingerAdjustments(raw.fingerAdjustments),
  };
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
  const loadedBodies = extractBodyEntries(rawData).map(normalizeMotion).filter(Boolean);
  const loadedPoses = extractPoseEntries(rawData).map(normalizePoseEntry).filter(Boolean);
  bodyMotions = loadedBodies.length ? loadedBodies : cloneBodyList(DEFAULT_BODY_MOTIONS);
  poseData = loadedPoses.length ? loadedPoses : clonePoseList(DEFAULT_POSE_DATA);
  motions = mergeMotionData(bodyMotions, poseData);
  baseBodyMotions = cloneBodyList(bodyMotions);
  basePoseData = clonePoseList(poseData);
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

function getBaseMotion(id) {
  return baseMotions.find((motion) => motion.id === id) ?? null;
}

function applyMotionSnapshot(target, snapshot) {
  if (!target || !snapshot) {
    return;
  }

  target.alias = snapshot.alias;
  target.scriptName = snapshot.scriptName;
  target.displayName = snapshot.displayName;
  target.content = snapshot.content;
  target.style = snapshot.style;
  target.source = snapshot.source;
  target.tags = [...snapshot.tags];
  target.priority = snapshot.priority;
  target.loop = snapshot.loop;
  target.duration = snapshot.duration;
  target.boneRotations = cloneBoneRotations(snapshot.boneRotations);
  target.expressionAdjustments = cloneExpressionAdjustments(snapshot.expressionAdjustments);
  target.fingerAdjustments = cloneFingerAdjustments(snapshot.fingerAdjustments);
}

function resetSelectedMotion() {
  const motion = getSelectedMotion();
  const snapshot = motion ? getBaseMotion(motion.id) : null;
  if (!motion || !snapshot) {
    return;
  }

  applyMotionSnapshot(motion, snapshot);
  state.playing = snapshot.displayName;
  render();
}

function applyPresetPose(presetId) {
  const motion = getSelectedMotion();
  const preset = PRESET_POSES[presetId];
  if (!motion || !preset) {
    return;
  }

  const snapshot = getBaseMotion(preset.templateId)
    ?? motions.find((entry) => entry.id === preset.templateId)
    ?? null;

  if (!snapshot) {
    return;
  }

  applyMotionSnapshot(motion, snapshot);
  state.selectedId = motion.id;
  state.playing = preset.label;
  render();
}

function serializeBoneRotations(rotations) {
  return JSON.stringify(cloneBoneRotations(rotations), null, 2);
}

function serializeExpressionAdjustments(adjustments) {
  return JSON.stringify(cloneExpressionAdjustments(adjustments), null, 2);
}

function serializeFingerAdjustments(adjustments) {
  return JSON.stringify(cloneFingerAdjustments(adjustments), null, 2);
}

function loadBoneRotationsFromTextarea() {
  const motion = getSelectedMotion();
  if (!motion || !refs.detailBoneRotations) {
    return;
  }

  try {
    motion.boneRotations = normalizeBoneRotations(refs.detailBoneRotations.value);
    state.error = "";
    render();
  } catch (error) {
    state.error = "Bone rotations JSON could not be parsed.";
    render();
  }
}

function resetBoneRotations() {
  const motion = getSelectedMotion();
  const snapshot = motion ? getBaseMotion(motion.id) : null;
  if (!motion || !snapshot) {
    return;
  }

  motion.boneRotations = cloneBoneRotations(snapshot.boneRotations);
  render();
}

function loadExpressionsFromTextarea() {
  const motion = getSelectedMotion();
  if (!motion || !refs.detailExpressions) {
    return;
  }

  try {
    motion.expressionAdjustments = normalizeExpressionAdjustments(refs.detailExpressions.value);
    state.error = "";
    render();
  } catch (error) {
    state.error = "Expression JSON could not be parsed.";
    render();
  }
}

function resetExpressions() {
  const motion = getSelectedMotion();
  const snapshot = motion ? getBaseMotion(motion.id) : null;
  if (!motion || !snapshot) {
    return;
  }

  motion.expressionAdjustments = cloneExpressionAdjustments(snapshot.expressionAdjustments);
  render();
}

function loadFingerAdjustmentsFromTextarea() {
  const motion = getSelectedMotion();
  if (!motion || !refs.detailFingerAdjustments) {
    return;
  }

  try {
    motion.fingerAdjustments = normalizeFingerAdjustments(refs.detailFingerAdjustments.value);
    state.error = "";
    render();
  } catch (error) {
    state.error = "Finger JSON could not be parsed.";
    render();
  }
}

function resetFingerAdjustments() {
  const motion = getSelectedMotion();
  const snapshot = motion ? getBaseMotion(motion.id) : null;
  if (!motion || !snapshot) {
    return;
  }

  motion.fingerAdjustments = cloneFingerAdjustments(snapshot.fingerAdjustments);
  render();
}

function matchesMotion(motion) {
  const query = normalize(state.search);
  if (state.tag && !motion.tags.includes(state.tag)) {
    return false;
  }
  if (!query) {
    return true;
  }
  return [motion.id, motion.alias, motion.scriptName, motion.displayName, motion.content, motion.style, motion.source, motion.tags.join(" ")]
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
      <div class="motion-subtitle">${motion.alias || "No alias"}${motion.content || motion.style ? ` · ${[motion.content, motion.style].filter(Boolean).join(" / ")}` : ""} · ${motion.scriptName}</div>
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
  refs.presetPose.value = Object.entries(PRESET_POSES).find(([, preset]) => preset.templateId === motion.id)?.[0] ?? "guide";
  refs.detailId.textContent = motion.id;
  refs.detailScriptName.value = motion.scriptName;
  refs.detailAlias.value = motion.alias;
  refs.detailDisplayName.value = motion.displayName;
  refs.detailTags.value = motion.tags.join(", ");
  refs.detailSource.value = motion.source;
  refs.detailPriority.value = String(motion.priority);
  refs.detailLoop.value = String(motion.loop);
  refs.detailDuration.textContent = motion.duration;
  if (refs.detailBoneRotations) {
    refs.detailBoneRotations.value = serializeBoneRotations(motion.boneRotations);
  }
  if (refs.detailExpressions) {
    refs.detailExpressions.value = serializeExpressionAdjustments(motion.expressionAdjustments);
  }
  if (refs.detailFingerAdjustments) {
    refs.detailFingerAdjustments.value = serializeFingerAdjustments(motion.fingerAdjustments);
  }
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
    bodies: cloneBodyList(bodyMotions),
    poses: clonePoseList(poseData),
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
  const loadedBodies = Array.isArray(snapshot?.bodies)
    ? snapshot.bodies.map(normalizeMotion).filter(Boolean)
    : Array.isArray(snapshot?.motions)
      ? snapshot.motions.map(normalizeMotion).filter(Boolean)
      : [];
  const loadedPoses = Array.isArray(snapshot?.poses)
    ? snapshot.poses.map(normalizePoseEntry).filter(Boolean)
    : [];
  const ui = snapshot?.ui ?? {};

  applyMotionData({
    bodies: loadedBodies.length ? loadedBodies : DEFAULT_BODY_MOTIONS,
    poses: loadedPoses.length ? loadedPoses : DEFAULT_POSE_DATA,
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
  const bodyData = await loadFirstAvailableManifest(BODY_MANIFEST_SOURCES);
  const poseDataSource = await loadFirstAvailableManifest(POSE_MANIFEST_SOURCES);

  if (bodyData || poseDataSource) {
    applyMotionData({
      bodies: bodyData?.bodies ?? bodyData?.motions ?? bodyData?.assets,
      poses: poseDataSource?.poses ?? poseDataSource?.motions,
      tags: bodyData?.tags ?? poseDataSource?.tags,
    });
    state.error = "";
  } else {
    applyMotionData(null);
    state.error = "Motion manifest could not be loaded. Using fallback data.";
  }

  const targetId = findMotionFromQuery();
  if (targetId && motions.some((motion) => motion.id === targetId)) {
    state.selectedId = targetId;
  }
  if (!state.selectedId && motions[0]) {
    state.selectedId = motions[0].id;
  }

  state.loading = false;
  render();
}

async function loadFirstAvailableManifest(sources) {
  for (const source of sources) {
    try {
      const response = await fetch(new URL(source, import.meta.url));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      // Try the next source.
    }
  }

  return null;
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
  refs.applyBoneRotations = document.getElementById("applyBoneRotations");
  refs.resetBoneRotations = document.getElementById("resetBoneRotations");
  refs.detailExpressions = document.getElementById("detailExpressions");
  refs.detailFingerAdjustments = document.getElementById("detailFingerAdjustments");
  refs.applyExpressions = document.getElementById("applyExpressions");
  refs.resetExpressions = document.getElementById("resetExpressions");
  refs.applyFingerAdjustments = document.getElementById("applyFingerAdjustments");
  refs.resetFingerAdjustments = document.getElementById("resetFingerAdjustments");
  refs.detailSource = document.getElementById("detailSource");
  refs.detailPriority = document.getElementById("detailPriority");
  refs.detailLoop = document.getElementById("detailLoop");
  refs.detailDuration = document.getElementById("detailDuration");
  refs.detailTagRow = document.getElementById("detailTagRow");
  refs.detailBoneRotations = document.getElementById("detailBoneRotations");
  refs.codeSnippet = document.getElementById("codeSnippet");
  refs.footerSummary = document.getElementById("footerSummary");
  refs.saveStatus = document.getElementById("saveStatus");
  refs.resetButton = document.getElementById("resetButton");
  refs.backButton = document.getElementById("backButton");
  refs.saveButton = document.getElementById("saveButton");
  refs.loadButton = document.getElementById("loadButton");
  refs.presetPose = document.getElementById("presetPose");

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

  render();

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

  refs.resetButton.addEventListener("click", () => {
    resetSelectedMotion();
  });

  refs.presetPose.addEventListener("change", () => {
    applyPresetPose(refs.presetPose.value);
  });

  refs.applyBoneRotations.addEventListener("click", () => {
    loadBoneRotationsFromTextarea();
  });

  refs.resetBoneRotations.addEventListener("click", () => {
    resetBoneRotations();
  });

  refs.applyExpressions.addEventListener("click", () => {
    loadExpressionsFromTextarea();
  });

  refs.resetExpressions.addEventListener("click", () => {
    resetExpressions();
  });

  refs.applyFingerAdjustments.addEventListener("click", () => {
    loadFingerAdjustmentsFromTextarea();
  });

  refs.resetFingerAdjustments.addEventListener("click", () => {
    resetFingerAdjustments();
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
  refs.detailBoneRotations.addEventListener("input", () => {
    state.saveStatus = "Unsaved";
  });
  refs.detailExpressions.addEventListener("input", () => {
    state.saveStatus = "Unsaved";
  });
  refs.detailFingerAdjustments.addEventListener("input", () => {
    state.saveStatus = "Unsaved";
  });

  render();
}

window.addEventListener("DOMContentLoaded", init);
