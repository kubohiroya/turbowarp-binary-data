import {describe, expect, it} from 'vitest';
import fixture from './fixtures/named-data-provider-contract.json';
import {BinaryDataNamedDataProvider} from '../src/binary-provider.js';
import {BinaryDataStore} from '../src/binary-store.js';
import type {NamedDataReference} from '@kubohiroya/turbowarp-named-data/composition';

function reference(overrides: Partial<NamedDataReference> = {}): NamedDataReference {
  return {
    namespace: fixture.namespace,
    name: fixture.name,
    kind: fixture.kind as 'binary',
    scope: fixture.scope as 'project',
    ...overrides
  };
}

describe('binary named-data provider contract', () => {
  it('matches the cross-repository raw body fixture', async () => {
    const project = {};
    const store = new BinaryDataStore();
    await store.register(fixture.name, new Uint8Array(fixture.bytes), {mediaType: fixture.mediaType});
    const provider = new BinaryDataNamedDataProvider(store);
    expect(provider.canResolve(reference(), 'raw')).toBe(true);
    expect(provider.canResolve(reference(), 'json')).toBe(false);
    const handle = provider.openBody(reference(), 'raw', {project});
    expect(handle).toMatchObject({
      nativeRepresentation: fixture.representation,
      representation: fixture.representation,
      mediaType: fixture.mediaType,
      byteLength: fixture.byteLength,
      digest: fixture.digest,
      revision: 'binary-1',
      replayable: true
    });
    expect(handle.body).toEqual(new Uint8Array(fixture.bytes));
    handle.release();
    handle.release();
  });

  it('keeps an opened snapshot stable after replacement', async () => {
    const project = {};
    const store = new BinaryDataStore();
    await store.register(fixture.name, new Uint8Array([1]));
    const provider = new BinaryDataNamedDataProvider(store);
    const first = provider.openBody(reference(), 'raw', {project});
    await store.register(fixture.name, new Uint8Array([2]));
    const second = provider.openBody(reference(), 'raw', {project});
    expect(first.revision).not.toBe(second.revision);
    expect(first.body).toEqual(new Uint8Array([1]));
    expect(second.body).toEqual(new Uint8Array([2]));
  });

  it('returns stable errors for scope, representation, abort, missing and release', async () => {
    const project = {};
    const store = new BinaryDataStore();
    const provider = new BinaryDataNamedDataProvider(store);
    expect(() => provider.stat(reference(), 'raw', {project})).toThrowError(
      expect.objectContaining({code: fixture.errors.missing})
    );
    await store.register(fixture.name, new Uint8Array(fixture.bytes));
    expect(() => provider.stat(reference(), 'raw', {})).toThrowError(
      expect.objectContaining({code: fixture.errors.missingProject})
    );
    expect(() => provider.stat(reference({scope: 'target'}), 'raw', {project})).toThrowError(
      expect.objectContaining({code: fixture.errors.targetScope})
    );
    expect(() => provider.stat(reference(), 'json', {project})).toThrowError(
      expect.objectContaining({code: fixture.errors.jsonRepresentation})
    );
    const controller = new AbortController();
    controller.abort();
    expect(() => provider.stat(reference(), 'raw', {project, signal: controller.signal})).toThrowError(
      expect.objectContaining({code: fixture.errors.aborted})
    );
    provider.release();
    expect(() => provider.stat(reference(), 'raw', {project})).toThrowError(
      expect.objectContaining({code: fixture.errors.released})
    );
  });
});
