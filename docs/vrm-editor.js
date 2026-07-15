const MOTIONS = [
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

const TAGS = ["", "idle", "loop", "locomotion", "gesture", "emote", "default", "safe", "once", "reaction"];

const state = {
  selectedId: MOTIONS[0].id,
  search: "",
  tag: "",
  playing: "Idle / Wait",
};

const refs = {};

function cloneMotion(motion) {
  return {
    ...motion,
    tags: [...motion.tags],
  };
}

function getSelectedMotion() {
  return MOTIONS.find((motion) => motion.id === state.selectedId) ?? MOTIONS[0];
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function matchesMotion(motion) {
  const query = normalize(state.search);
  const tag = state.tag;

  if (tag && !motion.tags.includes(tag)) {
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

  TAGS.forEach((tag) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `mini-button${state.tag === tag ? " active" : ""}`;
    button.textContent = tag ? `#${tag}` : "All";
    button.addEventListener("click", () => {
      state.tag = tag;
      render();
    });
    refs.tagFilters.appendChild(button);
  });
}

function renderMotionList() {
  const filtered = MOTIONS.filter(matchesMotion);
  refs.motionCount.textContent = `${filtered.length} items`;
  refs.motionList.innerHTML = "";

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
      state.playing = motion.displayName;
      render();
    });
    refs.motionList.appendChild(card);
  }
}

function renderDetails() {
  const motion = getSelectedMotion();
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
  refs.footerSummary.textContent = `${motion.displayName} / ${motion.id}`;
}

function bindDetailInput(input, updater) {
  input.addEventListener("input", () => {
    const motion = getSelectedMotion();
    updater(motion, input.value);
    render();
  });
}

function render() {
  renderTagFilters();
  renderMotionList();
  renderDetails();
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
  refs.seekLabel = document.getElementById("seekLabel");
  refs.tabButtons = [...document.querySelectorAll(".tab")];

  refs.motionSearch.addEventListener("input", () => {
    state.search = refs.motionSearch.value;
    render();
  });

  refs.playButton.addEventListener("click", () => {
    state.playing = getSelectedMotion().displayName;
    render();
  });

  refs.stopButton.addEventListener("click", () => {
    state.playing = "Stopped";
    render();
  });

  refs.loopButton.addEventListener("click", () => {
    const motion = getSelectedMotion();
    motion.loop = !motion.loop;
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
}

window.addEventListener("DOMContentLoaded", init);
