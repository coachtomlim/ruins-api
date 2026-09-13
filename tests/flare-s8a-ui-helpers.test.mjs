import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMERA_MODES,nextCameraMode,cameraButtonLabel,cameraUiState} from '../public/flare-s8a/runtime-view.mjs';
import {CUSTOMIZE_PANELS,normalizeCustomizePanel,customizePanelState} from '../public/flare-s8a/customize-panels.mjs';

test('camera helper toggles overview and follow with correct button label',()=>{
  assert.equal(nextCameraMode(CAMERA_MODES.FOLLOW),CAMERA_MODES.OVERVIEW);
  assert.equal(cameraButtonLabel(CAMERA_MODES.FOLLOW),'OVERVIEW');
  assert.equal(cameraButtonLabel(CAMERA_MODES.OVERVIEW),'FOLLOW HERO');
  assert.deepEqual(cameraUiState(CAMERA_MODES.OVERVIEW),{mode:'overview',label:'FOLLOW HERO',overview:true});
});

test('customization exposes exactly one active panel at a time',()=>{
  const s=customizePanelState(CUSTOMIZE_PANELS.TRAPS);
  assert.equal(s.active,'traps');
  assert.equal(s.tabs.filter(x=>x.active).length,1);
  assert.deepEqual(s.tabs.map(x=>x.id),['monsters','traps','supports']);
});

test('customization invalid panel fails safely to monsters',()=>{
  assert.equal(normalizeCustomizePanel('everything'),'monsters');
});
