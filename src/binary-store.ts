import {NamedDataError} from '@kubohiroya/turbowarp-named-data/composition';

export const DEFAULT_BINARY_MAX_BYTES = 16 * 1024 * 1024;
export const DEFAULT_BINARY_MEDIA_TYPE = 'application/octet-stream';

export interface BinaryRegistrationOptions {
  mediaType?: string;
  signal?: AbortSignal;
}

export interface BinaryMetadata {
  name: string;
  mediaType: string;
  byteLength: number;
  digest: `sha256-${string}`;
  revision: string;
}

interface BinaryBinding extends BinaryMetadata {
  bytes: Uint8Array;
}

export class BinaryDataStore {
  private readonly bindings = new Map<string, BinaryBinding>();
  private nextRevision = 1;
  private generation = 0;

  public constructor(private readonly maxBytes = DEFAULT_BINARY_MAX_BYTES) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
      throw new TypeError('Binary size limit must be a non-negative safe integer.');
    }
  }

  public async register(nameValue: string, source: ArrayBuffer | Uint8Array, options: BinaryRegistrationOptions = {}): Promise<BinaryMetadata> {
    const name = normalizeBinaryName(nameValue);
    const mediaType = normalizeMediaType(options.mediaType ?? DEFAULT_BINARY_MEDIA_TYPE);
    const registrationGeneration = this.generation;
    throwIfAborted(options.signal);
    const bytes = copyBytes(source);
    if (bytes.byteLength > this.maxBytes) {
      throw new NamedDataError('NAMED_DATA_BODY_TOO_LARGE', `Binary value is ${bytes.byteLength} bytes; maximum is ${this.maxBytes}.`);
    }
    const digest = await sha256(bytes);
    throwIfAborted(options.signal);
    if (registrationGeneration !== this.generation) {
      throw new NamedDataError('NAMED_DATA_ABORTED', 'The binary data session ended during registration.');
    }
    const binding: BinaryBinding = {
      name,
      mediaType,
      byteLength: bytes.byteLength,
      digest,
      revision: `binary-${this.nextRevision++}`,
      bytes
    };
    this.bindings.set(name, binding);
    return metadataOf(binding);
  }

  public has(nameValue: string): boolean {
    return this.bindings.has(normalizeBinaryName(nameValue));
  }

  public delete(nameValue: string): boolean {
    return this.bindings.delete(normalizeBinaryName(nameValue));
  }

  public metadata(nameValue: string): BinaryMetadata {
    return metadataOf(this.require(nameValue));
  }

  public snapshot(nameValue: string): Uint8Array {
    return this.require(nameValue).bytes.slice();
  }

  public clear(): void {
    this.bindings.clear();
    this.generation += 1;
  }

  private require(nameValue: string): BinaryBinding {
    const name = normalizeBinaryName(nameValue);
    const binding = this.bindings.get(name);
    if (!binding) throw new NamedDataError('NAMED_DATA_NOT_FOUND', `Binary data does not exist: ${name}`);
    return binding;
  }
}

export function normalizeBinaryName(value: string): string {
  const name = value;
  if (
    name.trim().length === 0 ||
    name.length > 256 ||
    Array.from(name, (character) => character.codePointAt(0) ?? 0).some(
      (codePoint) => codePoint <= 31 || codePoint === 127
    )
  ) {
    throw new NamedDataError('NAMED_DATA_INVALID_REF', 'Binary data name is invalid.');
  }
  return name;
}

export function normalizeMediaType(value: string): string {
  const mediaType = value.trim();
  const essence = mediaType.split(';', 1)[0]?.trim() ?? '';
  if (
    Array.from(mediaType, (character) => character.codePointAt(0) ?? 0).some(
      (codePoint) => codePoint <= 31 || codePoint === 127
    ) ||
    !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/u.test(essence)
  ) {
    throw new NamedDataError('NAMED_DATA_INVALID_REF', 'Binary data MIME type is invalid.');
  }
  return mediaType;
}

function copyBytes(source: ArrayBuffer | Uint8Array): Uint8Array {
  if (source instanceof Uint8Array) return source.slice();
  if (source instanceof ArrayBuffer) return new Uint8Array(source.slice(0));
  throw new TypeError('Binary data must be an ArrayBuffer or Uint8Array.');
}

function metadataOf(binding: BinaryBinding): BinaryMetadata {
  return {name: binding.name, mediaType: binding.mediaType, byteLength: binding.byteLength, digest: binding.digest, revision: binding.revision};
}

async function sha256(bytes: Uint8Array): Promise<`sha256-${string}`> {
  const result = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer);
  const hex = Array.from(new Uint8Array(result), (value) => value.toString(16).padStart(2, '0')).join('');
  return `sha256-${hex}`;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new NamedDataError('NAMED_DATA_ABORTED', 'Binary data operation was aborted.');
}
