import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {isBinaryDataMvpEnabled} from '../src/config.js';
import {BinaryDataExtension} from '../src/extension.js';

let stopProject: (() => void) | undefined;

beforeEach(() => {
  stopProject = undefined;
  vi.stubGlobal('Scratch', {
    BlockType: {COMMAND: 'command', REPORTER: 'reporter', BOOLEAN: 'boolean'},
    ArgumentType: {STRING: 'string'},
    Cast: {toString: String, toNumber: Number, toBoolean: Boolean},
    translate: (message: string | {default: string}) =>
      typeof message === 'string' ? message : message.default,
    vm: {
      runtime: {
        on: (event: string, listener: () => void) => {
          if (event === 'PROJECT_STOP_ALL') stopProject = listener;
        }
      }
    }
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('BinaryDataExtension', () => {
  it('keeps the MVP disabled by default', () => {
    expect(isBinaryDataMvpEnabled({})).toBe(false);
    expect(isBinaryDataMvpEnabled({BINARY_DATA_MVP: 'true'})).toBe(true);
    const extension = new BinaryDataExtension(false);
    expect((extension.getInfo().blocks as unknown[])).toEqual([]);
    expect(extension.getNamedDataProvider()).toBeUndefined();
  });

  it('publishes binary blocks and metadata when enabled', async () => {
    const extension = new BinaryDataExtension(true);
    const info = extension.getInfo() as {name: string; blocks: Array<{opcode: string}>; docsURI: string};
    expect(info.name).toBe('Binary Data');
    expect(info.docsURI).toBe('https://kubohiroya.github.io/turbowarp-binary-data/');
    expect(info.blocks.map((block) => block.opcode)).toEqual([
      'createUtf8',
      'hasBinary',
      'deleteBinary',
      'mimeType',
      'byteLength',
      'sha256'
    ]);

    await extension.createUtf8({TEXT: 'hé', NAME: 'message', MIME: 'text/plain; charset=utf-8'});
    expect(extension.hasBinary({NAME: 'message'})).toBe(true);
    expect(extension.mimeType({NAME: 'message'})).toBe('text/plain; charset=utf-8');
    expect(extension.byteLength({NAME: 'message'})).toBe(3);
    expect(extension.sha256({NAME: 'message'})).toMatch(/^sha256-[0-9a-f]{64}$/u);
    extension.deleteBinary({NAME: 'message'});
    expect(extension.hasBinary({NAME: 'message'})).toBe(false);
  });

  it('clears project-scoped bindings when the project stops', async () => {
    const extension = new BinaryDataExtension(true);
    await extension.registerBytes('temporary', new Uint8Array([1]));
    expect(extension.hasBinary({NAME: 'temporary'})).toBe(true);
    stopProject?.();
    expect(extension.hasBinary({NAME: 'temporary'})).toBe(false);
  });
});
