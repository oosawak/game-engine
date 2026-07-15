const state = {
  running: false,
  frame: 0,
  phase: 0,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  mode: "3D",
};

const refs = {};
let frameHandle = null;

function formatVector(vector) {
  return `${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${vector.z.toFixed(1)}`;
}

function render() {
  refs.runtimeState.textContent = state.running ? "Running" : "Stopped";
  refs.frameInfo.textContent = `Frame ${state.frame}`;
  refs.positionValue.textContent = formatVector(state.position);
  refs.rotationValue.textContent = formatVector(state.rotation);
  refs.modeLabel.textContent = state.mode;
  refs.selectedObject.textContent = "Cube";
  refs.cube.style.transform = `rotateX(${state.rotation.x}deg) rotateY(${state.rotation.y}deg) rotateZ(${state.rotation.z}deg) translate3d(${state.position.x}px, ${-state.position.y}px, ${state.position.z}px)`;
}

function tick() {
  if (!state.running) {
    return;
  }

  state.frame += 1;
  state.phase += 0.06;
  state.position.x = Math.sin(state.phase) * 36;
  state.position.y = Math.cos(state.phase * 0.7) * 12;
  state.position.z = Math.sin(state.phase * 0.45) * 18;
  state.rotation.y = (state.rotation.y + 1.5) % 360;
  state.rotation.x = Math.sin(state.phase * 0.5) * 18;
  state.rotation.z = Math.cos(state.phase * 0.4) * 10;

  render();
  frameHandle = requestAnimationFrame(tick);
}

function start() {
  if (state.running) {
    return;
  }

  state.running = true;
  render();
  frameHandle = requestAnimationFrame(tick);
}

function stop() {
  state.running = false;
  if (frameHandle !== null) {
    cancelAnimationFrame(frameHandle);
    frameHandle = null;
  }
  render();
}

function reset() {
  stop();
  state.frame = 0;
  state.phase = 0;
  state.position = { x: 0, y: 0, z: 0 };
  state.rotation = { x: 0, y: 0, z: 0 };
  render();
}

function init() {
  refs.runtimeState = document.getElementById("runtimeState");
  refs.frameInfo = document.getElementById("frameInfo");
  refs.summaryText = document.getElementById("summaryText");
  refs.selectedObject = document.getElementById("selectedObject");
  refs.modeLabel = document.getElementById("modeLabel");
  refs.positionValue = document.getElementById("positionValue");
  refs.rotationValue = document.getElementById("rotationValue");
  refs.cameraValue = document.getElementById("cameraValue");
  refs.cube = document.getElementById("cube");
  refs.playButton = document.getElementById("playButton");
  refs.stopButton = document.getElementById("stopButton");
  refs.resetButton = document.getElementById("resetButton");

  refs.playButton.addEventListener("click", start);
  refs.stopButton.addEventListener("click", stop);
  refs.resetButton.addEventListener("click", reset);

  refs.summaryText.textContent = "MainScene / Cube / Camera follow / Directional Light";
  refs.cameraValue.textContent = "MainCamera -> Cube";
  render();
}

window.addEventListener("DOMContentLoaded", init);
