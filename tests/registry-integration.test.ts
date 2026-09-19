import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  getNamedDataRegistry,
  type NamedDataReference
} from '@kubohiroya/turbowarp-named-data/composition';
import {BinaryDataExtension} from '../src/extension.js';

const listeners = new Map<string, Set<() => void>>();
const runtime = {
  on(event: string, listener: () => void) {
    const entries = listeners.get(event) ?? new Set<() => void>();
    entries.add(listener);
    listeners.set(event, entries);
  }
};

beforeEach(() => {
  listeners.clear();
  vi.stubGlobal('Scratch', {
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'},
    Cast: {toString: String, toNumber: Number, toBoolean: Boolean},
    translate: (message: string | {default: string}) =>
      typeof message === 'string' ? message : message.default,
    vm: {runtime}
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('canonical named-data registry integration', () => {
  it('registers a persistent raw provider and only clears session state on stop', async () => {
    const extension = new BinaryDataExtension(true, undefined, runtime);
    await extension.registerBytes('payload', new Uint8Array([1, 2, 3]), {
      mediaType: 'application/octet-stream'
    });
    const registry = getNamedDataRegistry(runtime);
    const reference: NamedDataReference = {
      namespace: 'binary',
      name: 'payload',
      kind: 'binary',
      scope: 'project'
    };
    const project = {};

    expect(registry?.canResolve(reference, 'raw')).toBe(true);
    const opened = await registry?.openBody(reference, 'raw', {project});
    expect(opened?.body).toEqual(new Uint8Array([1, 2, 3]));
    expect(opened).toMatchObject({
      nativeRepresentation: 'raw',
      representation: 'raw',
      mediaType: 'application/octet-stream',
      byteLength: 3,
      replayable: true
    });
    await opened?.release('complete');

    for (const listener of listeners.get('PROJECT_STOP_ALL') ?? []) listener();
    expect(registry?.canResolve(reference, 'raw')).toBe(true);
    await expect(registry?.stat(reference, 'raw', {project})).rejects.toMatchObject({
      code: 'NAMED_DATA_NOT_FOUND'
    });

    await extension.registerBytes('payload', new Uint8Array([4]));
    await expect(registry?.stat(reference, 'raw', {project})).resolves.toMatchObject({byteLength: 1});
    await extension.dispose();
    expect(registry?.canResolve(reference, 'raw')).toBe(false);
  });
});
