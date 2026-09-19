import {describe, expect, it} from 'vitest';
import {BinaryDataStore} from '../src/binary-store.js';

describe('BinaryDataStore', () => {
  it('copies input and returns independent snapshots', async () => {
    const store = new BinaryDataStore();
    const input = new Uint8Array([1, 2, 3]);
    const first = await store.register('data', input, {mediaType: 'image/png'});
    input[0] = 99;
    const snapshot = store.snapshot('data');
    expect(snapshot).toEqual(new Uint8Array([1, 2, 3]));
    snapshot[1] = 88;
    expect(store.snapshot('data')).toEqual(new Uint8Array([1, 2, 3]));
    expect(first).toMatchObject({mediaType: 'image/png', byteLength: 3, revision: 'binary-1'});
  });

  it('replaces atomically and keeps earlier snapshots unchanged', async () => {
    const store = new BinaryDataStore();
    await store.register('data', new Uint8Array([1]));
    const openSnapshot = store.snapshot('data');
    const replacement = await store.register('data', new Uint8Array([2]));
    expect(replacement.revision).toBe('binary-2');
    expect(openSnapshot).toEqual(new Uint8Array([1]));
    expect(store.snapshot('data')).toEqual(new Uint8Array([2]));
  });

  it('rejects size overflow and abort without changing an existing binding', async () => {
    const store = new BinaryDataStore(2);
    await store.register('data', new Uint8Array([1, 2]));
    await expect(store.register('data', new Uint8Array([3, 4, 5]))).rejects.toMatchObject({
      code: 'NAMED_DATA_BODY_TOO_LARGE'
    });
    const controller = new AbortController();
    controller.abort();
    await expect(store.register('data', new Uint8Array([9]), {signal: controller.signal})).rejects.toMatchObject({
      code: 'NAMED_DATA_ABORTED'
    });
    expect(store.snapshot('data')).toEqual(new Uint8Array([1, 2]));
  });

  it('accepts ArrayBuffer input and validates names and MIME types', async () => {
    const store = new BinaryDataStore();
    await store.register('buffer', new Uint8Array([4, 5]).buffer);
    expect(store.metadata('buffer').mediaType).toBe('application/octet-stream');
    await expect(store.register('', new Uint8Array())).rejects.toMatchObject({code: 'NAMED_DATA_INVALID_REF'});
    await expect(store.register('x', new Uint8Array(), {mediaType: 'invalid'})).rejects.toMatchObject({
      code: 'NAMED_DATA_INVALID_REF'
    });
  });
});
