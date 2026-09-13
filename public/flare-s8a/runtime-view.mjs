export const CAMERA_MODES=Object.freeze({FOLLOW:'follow',OVERVIEW:'overview'});

export function nextCameraMode(mode){
  return mode===CAMERA_MODES.OVERVIEW?CAMERA_MODES.FOLLOW:CAMERA_MODES.OVERVIEW;
}

export function cameraButtonLabel(mode){
  return mode===CAMERA_MODES.OVERVIEW?'FOLLOW HERO':'OVERVIEW';
}

export function cameraUiState(mode){
  const normalized=mode===CAMERA_MODES.OVERVIEW?CAMERA_MODES.OVERVIEW:CAMERA_MODES.FOLLOW;
  return Object.freeze({mode:normalized,label:cameraButtonLabel(normalized),overview:normalized===CAMERA_MODES.OVERVIEW});
}
