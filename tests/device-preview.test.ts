import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deviceDimensions, fitDevice } from '../lib/device-preview';

test('device previews fit both canvas dimensions without enlarging or cropping', () => {
  for (const available of [{width:320,height:500},{width:1280,height:680},{width:1920,height:1000}]) {
    for (const view of ['desktop','ipad','phone'] as const) {
      for (const rotated of [false,true]) {
        const size = deviceDimensions(view,rotated,available);
        const scale = fitDevice(size,available);
        assert.ok(scale > 0 && scale <= 1);
        assert.ok(size.width * scale <= available.width + 0.001);
        assert.ok(size.height * scale <= available.height + 0.001);
      }
    }
  }
});

test('rotation swaps dimensions while Desktop follows the available viewport', () => {
  const available = {width:1200,height:700};
  assert.deepEqual(deviceDimensions('desktop',false,available),available);
  assert.deepEqual(deviceDimensions('ipad',true,available),{width:1180,height:820});
  assert.deepEqual(deviceDimensions('phone',false,available),{width:390,height:844});
});
