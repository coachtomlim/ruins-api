(() => {
  const clips = {
    entrance: { src: 'assets/hydra-entrance.webm', note: 'Reversed 10s → 0s. Placement uses the original 0-second frame.', fps: 24 },
    attack: { src: 'assets/hydra-attack.webm', note: 'Full attack animation · 240 frames · 10.00 seconds · 24 fps.', fps: 24 },
    dead: { src: 'assets/hydra-dead.webm', note: 'Full death animation · 240 frames · 24 fps.', fps: 24 }
  };
  const hydraLocked = {
    entrance: { x: .5092, y: 1.3826, h: 1.115 },
    attack: { x: .4837, y: 1.1913, h: 1.307 },
    dead: { x: .5055, y: 1.334, h: 1.201 }
  };
  const characterDefaults = {
    p1: { x: .1165, y: .7381, h: .335 },
    p2: { x: .4954, y: .6722, h: .26 },
    p3: { x: .8799, y: .6557, h: .193 }
  };
  const storageKey = 'hydra-room10-placement-v5';
  const state = {
    hydra: structuredClone(hydraLocked),
    characters: structuredClone(characterDefaults)
  };
  let activeClip = 'entrance';
  let activeCharacter = 'p1';
  let dragging = false;
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const video = $('hydra');
  const reference = $('hydraReference');
  const hydraControls = { x: $('x'), y: $('y'), h: $('h') };
  const characterControls = { x: $('charX'), y: $('charY'), h: $('charH') };
  const characterNumbers = { x: $('charXOut'), y: $('charYOut'), h: $('charHOut') };

  function positionActor(element, placement, maxWidth) {
    element.style.left = `${placement.x * 100}%`;
    element.style.top = `${placement.y * 100}%`;
    element.style.height = `${placement.h * 100}%`;
    element.style.maxWidth = `${maxWidth * 100}%`;
  }

  function update() {
    const hydraPlacement = state.hydra[activeClip];
    [video, reference].forEach(actor => positionActor(actor, hydraPlacement, Math.min(2.4, hydraPlacement.h * 1.8)));
    $('anchor').style.left = video.style.left;
    $('anchor').style.top = video.style.top;
    Object.entries(state.characters).forEach(([key, placement]) => positionActor(document.querySelector(`.${key}`), placement, Math.min(.9, placement.h * 1.35)));
    Object.keys(state.characters).forEach(key => document.querySelector(`.${key}`).classList.toggle('selected-character', key === activeCharacter));
    Object.entries(hydraControls).forEach(([key, control]) => {
      control.value = hydraPlacement[key];
      $(`${key}Out`).value = Number(hydraPlacement[key]).toFixed(4);
    });
    const characterPlacement = state.characters[activeCharacter];
    Object.entries(characterControls).forEach(([key, control]) => {
      control.value = characterPlacement[key];
      $(`char${key.toUpperCase()}Out`).value = Number(characterPlacement[key]).toFixed(4);
    });
    localStorage.setItem(storageKey, JSON.stringify(state));
    renderContract();
  }

  function renderContract() {
    $('contract').textContent = JSON.stringify({
      schemaVersion: 2,
      roomId: 'room.10',
      layerOrder: { characters: 20, hydra: 25 },
      characters: state.characters,
      hydra: {
        anchor: 'foot-center',
        positionsByAnimation: state.hydra,
        animations: {
          entrance: { src: clips.entrance.src, fps: 24, reverse: true, placementReference: 'original-source-frame-0' },
          attack: { src: clips.attack.src, fps: 24, rangeSeconds: [0, 10] },
          dead: { src: clips.dead.src, fps: 24 }
        }
      }
    }, null, 2);
  }


  function selectClip(name) {
    activeClip = name;
    const clip = clips[name];
    video.pause();
    video.src = `${clip.src}?v=13`;
    video.load();
    reference.hidden = name !== 'entrance';
    video.hidden = name === 'entrance';
    $('clipNote').textContent = clip.note;
    document.querySelectorAll('[data-clip]').forEach(button => button.classList.toggle('active', button.dataset.clip === name));
    update();
  }
  document.querySelectorAll('[data-clip]').forEach(button => button.addEventListener('click', () => selectClip(button.dataset.clip)));
  document.querySelectorAll('[data-character]').forEach(button => button.addEventListener('click', () => {
    activeCharacter = button.dataset.character;
    document.querySelectorAll('[data-character]').forEach(item => item.classList.toggle('active', item.dataset.character === activeCharacter));
    update();
  }));

  $('play').onclick = () => { reference.hidden = true; video.hidden = false; video.currentTime = 0; video.play(); };
  $('pause').onclick = () => video.pause();
  $('scrub').oninput = event => { video.currentTime = +event.target.value * video.duration; };
  function sync() {
    if (Number.isFinite(video.duration)) {
      const duration = video.duration;
      const time = video.currentTime;
      $('scrub').value = duration ? time / duration : 0;
      $('time').value = `${time.toFixed(2)} / ${duration.toFixed(2)} s`;
    }
    requestAnimationFrame(sync);
  }
  requestAnimationFrame(sync);
  $('copy').onclick = async () => {
    await navigator.clipboard.writeText($('contract').textContent);
    $('copied').textContent = 'All three Hydra and character placements copied.';
  };
  update();
  selectClip('entrance');
})();
