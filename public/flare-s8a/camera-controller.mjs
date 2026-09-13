import {CAMERA_MODES,cameraUiState} from './runtime-view.mjs';

export function applyCameraMode(renderer,mode){
  if(!renderer)throw new Error('Renderer is required');
  const state=cameraUiState(mode);
  renderer.overview=state.overview;
  // Force the next draw to recompute the intended composition rather than
  // leaving a stale tracked camera in place. Presentation only.
  renderer.camera=null;
  return state;
}

export function toggleCameraMode(renderer){
  const next=renderer?.overview?CAMERA_MODES.FOLLOW:CAMERA_MODES.OVERVIEW;
  return applyCameraMode(renderer,next);
}
