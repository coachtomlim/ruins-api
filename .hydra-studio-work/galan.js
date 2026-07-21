(() => {
  const SOURCE_OFFSET = 1;
  const END_SOURCE_TIME = 10;
  const STORAGE_KEY = 'fh-galan-faint-placement-pass3-v1';
  const lockedP3 = { x: 0.8799, y: 0.6557, h: 0.1930 };
  const bakedSizeFrames = [
    { time: 1.000, h: 0.1930 },
    { time: 3.100, h: 0.1600 },
    { time: 4.218, h: 0.1564 },
    { time: 5.100, h: 0.1273 },
    { time: 5.911, h: 0.1179 },
    { time: 6.600, h: 0.1250 },
    { time: 10.000, h: 0.1250 }
  ];
  const defaultKeyframes = [
    { time: 1.000, x: 0.8799, y: 0.6557, h: 0.1930, locked: true, label: 'Pass 1 locked size' },
    { time: 3.100, x: 0.8799, y: 0.6557, h: 0.1600, locked: true, label: 'Pass 2 locked size' },
    { time: 4.218, x: 0.8799, y: 0.6557, h: 0.1564, locked: true, label: 'Pass 2 proportional adjustment' },
    { time: 5.100, x: 0.8799, y: 0.6557, h: 0.1273, locked: true, label: 'Pass 2 proportional adjustment' },
    { time: 5.911, x: 0.8799, y: 0.6557, h: 0.1179, locked: true, label: 'Pass 2 proportional adjustment' },
    { time: 6.600, x: 0.8799, y: 0.6557, h: 0.1250, locked: true, label: 'Pass 2 proportional adjustment' },
    { time: 10.000, x: 0.8799, y: 0.6557, h: 0.1250, locked: true, label: 'Pass 2 end hold' }
  ];
  const $ = id => document.getElementById(id);
  const video = $('galan');
  const anchor = $('anchor');
  const controls = { x: $('x'), y: $('y'), h: $('h') };
  const numbers = { x: $('xOut'), y: $('yOut'), h: $('hOut') };
  let keyframes = loadKeyframes();
  let selectedTime = 1;
  let draft = { ...lockedP3 };
  let draftDirty = false;

  function loadKeyframes() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length) return saved.sort((a, b) => a.time - b.time);
    } catch (_) {}
    return structuredClone(defaultKeyframes);
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keyframes));
    renderContract();
  }

  function placementAt(sourceTime) {
    const sorted = keyframes.slice().sort((a, b) => a.time - b.time);
    if (sourceTime <= sorted[0].time) return pickPlacement(sorted[0]);
    if (sourceTime >= sorted.at(-1).time) return pickPlacement(sorted.at(-1));
    const rightIndex = sorted.findIndex(frame => frame.time >= sourceTime);
    const left = sorted[rightIndex - 1];
    const right = sorted[rightIndex];
    const progress = (sourceTime - left.time) / Math.max(0.0001, right.time - left.time);
    const mix = smoothstep(progress);
    return {
      x: lerp(left.x, right.x, mix),
      y: lerp(left.y, right.y, mix),
      h: lerp(left.h, right.h, mix)
    };
  }

  function pickPlacement(frame) { return { x: frame.x, y: frame.y, h: frame.h }; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { return t * t * (3 - 2 * t); }
  function sourceTime() { return Math.min(END_SOURCE_TIME, video.currentTime + SOURCE_OFFSET); }

  function bakedSizeAt(time) {
    if (time <= bakedSizeFrames[0].time) return bakedSizeFrames[0].h;
    if (time >= bakedSizeFrames.at(-1).time) return bakedSizeFrames.at(-1).h;
    const rightIndex = bakedSizeFrames.findIndex(frame => frame.time >= time);
    const left = bakedSizeFrames[rightIndex - 1];
    const right = bakedSizeFrames[rightIndex];
    const progress = (time - left.time) / Math.max(0.0001, right.time - left.time);
    return lerp(left.h, right.h, smoothstep(progress));
  }

  function applyPlacement(placement) {
    const bakedSize = bakedSizeAt(sourceTime());
    const canvasHeight = placement.h * lockedP3.h / bakedSize;
    video.style.left = `${placement.x * 100}%`;
    video.style.top = `${placement.y * 100}%`;
    video.style.height = `${canvasHeight * 100}%`;
    video.style.maxWidth = `${Math.min(1.8, canvasHeight * 3.2) * 100}%`;
    anchor.style.left = video.style.left;
    anchor.style.top = video.style.top;
  }

  function setControls(placement) {
    draft = { ...placement };
    Object.keys(controls).forEach(key => {
      controls[key].value = placement[key];
      numbers[key].value = Number(placement[key]).toFixed(4);
    });
  }

  function readControl(key, value) {
    const limits = key === 'h' ? [0.04, 0.6] : [0, 1.3];
    return Math.max(limits[0], Math.min(limits[1], Number(value)));
  }

  function onPlacementInput(key, value) {
    video.pause();
    draft[key] = readControl(key, value);
    controls[key].value = draft[key];
    numbers[key].value = draft[key].toFixed(4);
    draftDirty = true;
    applyPlacement(draft);
    $('editorStatus').textContent = `Unsaved adjustment at source ${sourceTime().toFixed(3)} s. Set a keyframe to retain it.`;
  }

  Object.keys(controls).forEach(key => {
    controls[key].addEventListener('input', event => onPlacementInput(key, event.target.value));
    numbers[key].addEventListener('input', event => onPlacementInput(key, event.target.value));
  });

  function selectFrame(time, seek = true) {
    selectedTime = time;
    const frame = keyframes.find(item => Math.abs(item.time - time) < 0.0005);
    if (!frame) return;
    if (seek) video.currentTime = Math.max(0, frame.time - SOURCE_OFFSET);
    setControls(pickPlacement(frame));
    applyPlacement(frame);
    draftDirty = false;
    renderKeyframes();
    $('toggleLock').textContent = frame.locked ? 'Unlock selected' : 'Lock selected';
    $('deleteKeyframe').disabled = frame.locked;
  }

  function renderKeyframes() {
    const host = $('keyframes');
    host.replaceChildren();
    keyframes.forEach(frame => {
      const button = document.createElement('button');
      button.className = `keyframe${Math.abs(frame.time - selectedTime) < 0.0005 ? ' selected' : ''}`;
      button.innerHTML = `<strong>${frame.time.toFixed(3)} s</strong><small>${frame.label || 'Manual correction'} · x ${frame.x.toFixed(4)} · y ${frame.y.toFixed(4)} · size ${frame.h.toFixed(4)}</small><span class="lock">${frame.locked ? 'LOCKED' : 'EDIT'}</span>`;
      button.onclick = () => selectFrame(frame.time);
      host.appendChild(button);
    });
  }

  function saveKeyframe() {
    const time = Number(sourceTime().toFixed(3));
    const existing = keyframes.find(frame => Math.abs(frame.time - time) < 0.0005);
    if (existing?.locked) {
      $('editorStatus').textContent = `Source ${time.toFixed(3)} s is locked. Unlock that keyframe before replacing it.`;
      return;
    }
    if ((!existing || !existing.locked) && $('snapChange').checked && time > keyframes[0].time + 0.011) {
      const beforeTime = Number((time - 0.010).toFixed(3));
      if (!keyframes.some(frame => Math.abs(frame.time - beforeTime) < 0.0005)) {
        keyframes.push({ time: beforeTime, ...placementAt(beforeTime), locked: true, label: 'Hold before manual change' });
      }
    }
    if (existing) Object.assign(existing, draft, { label: existing.label || 'Manual correction' });
    else keyframes.push({ time, ...draft, locked: false, label: 'Manual correction' });
    keyframes.sort((a, b) => a.time - b.time);
    selectedTime = time;
    draftDirty = false;
    persist();
    renderKeyframes();
    $('editorStatus').textContent = `Saved correction at source ${time.toFixed(3)} s. Lock it when approved.`;
  }

  $('saveKeyframe').onclick = saveKeyframe;
  $('resetDraft').onclick = () => {
    draftDirty = false;
    const placement = placementAt(sourceTime());
    setControls(placement);
    applyPlacement(placement);
    $('editorStatus').textContent = 'Controls reset to the saved correction curve.';
  };
  $('toggleLock').onclick = () => {
    const frame = keyframes.find(item => Math.abs(item.time - selectedTime) < 0.0005);
    if (!frame) return;
    frame.locked = !frame.locked;
    persist();
    selectFrame(frame.time, false);
    $('editorStatus').textContent = `${frame.time.toFixed(3)} s is now ${frame.locked ? 'locked' : 'editable'}.`;
  };
  $('deleteKeyframe').onclick = () => {
    const frame = keyframes.find(item => Math.abs(item.time - selectedTime) < 0.0005);
    if (!frame || frame.locked) return;
    keyframes = keyframes.filter(item => item !== frame);
    selectedTime = keyframes[0].time;
    persist();
    selectFrame(selectedTime);
  };

  $('play').onclick = () => { video.currentTime = 0; draftDirty = false; video.play(); };
  $('pause').onclick = () => video.pause();
  $('jumpZoom').onclick = () => { video.pause(); video.currentTime = 2.1; draftDirty = false; refreshFromTimeline(); renderKeyframes(); };
  $('scrub').oninput = event => { video.pause(); video.currentTime = Number(event.target.value); draftDirty = false; refreshFromTimeline(); };
  video.addEventListener('ended', () => { video.pause(); });

  function refreshFromTimeline() {
    const placement = placementAt(sourceTime());
    applyPlacement(placement);
    if (!draftDirty) setControls(placement);
  }

  function renderContract() {
    $('contract').textContent = JSON.stringify({
      schemaVersion: 1,
      project: 'F&H Fable - Adventure Ruins Charlie',
      actor: 'P3/Galan',
      animation: 'faint',
      sourceRangeSeconds: [1, 10],
      runtimeAsset: 'assets/galan-faint-alpha-pass3.webm',
      bakedCorrectionSource: 'galan-faint-pass2.locked.json',
      fps: 24,
      alpha: true,
      anchor: 'foot-center',
      layer: 25,
      interpolation: 'cubic-smoothstep',
      sizeControlsRepresent: 'effective-on-screen-height',
      keyframes
    }, null, 2);
  }

  $('copy').onclick = async () => {
    await navigator.clipboard.writeText($('contract').textContent);
    $('editorStatus').textContent = 'Correction JSON copied.';
  };

  function tick() {
    const duration = Number.isFinite(video.duration) ? video.duration : 9;
    $('scrub').max = duration;
    $('scrub').value = video.currentTime;
    $('playbackTime').textContent = `Playback ${video.currentTime.toFixed(2)} / ${duration.toFixed(2)} s`;
    $('sourceTime').textContent = `Source ${sourceTime().toFixed(2)} / ${END_SOURCE_TIME.toFixed(2)} s`;
    if (!video.paused) refreshFromTimeline();
    requestAnimationFrame(tick);
  }

  applyPlacement(lockedP3);
  setControls(lockedP3);
  selectFrame(1, false);
  renderContract();
  requestAnimationFrame(tick);
})();
