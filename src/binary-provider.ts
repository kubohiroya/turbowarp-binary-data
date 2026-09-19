import type {BinaryDataStore, BinaryMetadata} from './binary-store.js';
import {
  NamedDataError,
  type NamedDataBody,
  type NamedDataMetadata,
  type NamedDataProvider,
  type NamedDataReference,
  type NamedDataRepresentation,
  type NamedDataResolveContext
} from '@kubohiroya/turbowarp-named-data/composition';

export const BINARY_DATA_NAMESPACE = 'binary';

export class BinaryDataNamedDataProvider implements NamedDataProvider {
  public readonly namespace = BINARY_DATA_NAMESPACE;
  public readonly kind = 'binary' as const;
  private readonly openHandles = new Set<symbol>();
  private released = false;

  public constructor(private readonly store: BinaryDataStore) {}

  public canResolve(reference: NamedDataReference, representation: NamedDataRepresentation): boolean {
    return (
      reference.namespace === this.namespace &&
      reference.kind === this.kind &&
      reference.scope === 'project' &&
      representation === 'raw'
    );
  }

  public stat(reference: NamedDataReference, representation: NamedDataRepresentation, context: NamedDataResolveContext): NamedDataMetadata {
    this.validate(reference, representation, context);
    return this.toNamedMetadata(reference, this.store.metadata(reference.name));
  }

  public openBody(reference: NamedDataReference, representation: NamedDataRepresentation, context: NamedDataResolveContext): NamedDataBody {
    this.validate(reference, representation, context);
    const metadata = this.store.metadata(reference.name);
    const snapshot = this.store.snapshot(reference.name);
    this.throwIfAborted(context.signal);
    const token = Symbol('binary-body');
    this.openHandles.add(token);
    let handleReleased = false;
    return {
      ...this.toNamedMetadata(reference, metadata),
      body: snapshot,
      release: () => {
        if (handleReleased) return;
        handleReleased = true;
        this.openHandles.delete(token);
      }
    };
  }

  public clearSession(): void {
    this.openHandles.clear();
    this.store.clear();
  }

  public release(): void {
    this.released = true;
    this.openHandles.clear();
    this.store.clear();
  }

  private validate(reference: NamedDataReference, representation: NamedDataRepresentation, context: NamedDataResolveContext): void {
    if (this.released) throw new NamedDataError('NAMED_DATA_PROVIDER_RELEASED', 'The binary provider was released.');
    if (reference.namespace !== this.namespace || reference.name.trim().length === 0) {
      throw new NamedDataError('NAMED_DATA_INVALID_REF', 'Invalid binary data reference.');
    }
    if (reference.kind !== this.kind) {
      throw new NamedDataError('NAMED_DATA_KIND_MISMATCH', `Expected ${this.kind}, received ${reference.kind}.`);
    }
    if (reference.scope !== 'project' || context.project === undefined) {
      throw new NamedDataError('NAMED_DATA_SCOPE_MISMATCH', 'Binary data currently requires project scope.');
    }
    if (representation !== 'raw') {
      throw new NamedDataError('NAMED_DATA_REPRESENTATION_UNSUPPORTED', `Binary data cannot be rendered as ${representation}.`);
    }
    this.throwIfAborted(context.signal);
  }

  private toNamedMetadata(reference: NamedDataReference, metadata: BinaryMetadata): NamedDataMetadata {
    return {
      reference: {...reference, name: metadata.name},
      nativeRepresentation: 'raw',
      representation: 'raw',
      mediaType: metadata.mediaType,
      byteLength: metadata.byteLength,
      digest: metadata.digest,
      revision: metadata.revision,
      replayable: true
    };
  }

  private throwIfAborted(signal: AbortSignal | undefined): void {
    if (signal?.aborted) throw new NamedDataError('NAMED_DATA_ABORTED', 'Body resolution was aborted.');
  }
}
