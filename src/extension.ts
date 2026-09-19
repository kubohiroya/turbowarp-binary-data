import definitions from './block-definitions.json';
import {
  bindNamedDataRegistryLifecycle,
  installNamedDataRegistry,
  type NamedDataProviderRegistration
} from '@kubohiroya/turbowarp-named-data/composition';
import {BinaryDataNamedDataProvider} from './binary-provider.js';
import {BinaryDataStore, type BinaryMetadata, type BinaryRegistrationOptions} from './binary-store.js';
import {extensionConfig} from './config.js';

type BlockTypeName = 'COMMAND' | 'REPORTER' | 'BOOLEAN';
type ArgumentTypeName = 'STRING';

interface DefinitionArgument {
  type: ArgumentTypeName;
  defaultValue: string;
}

interface BlockDefinition {
  opcode: string;
  blockType: BlockTypeName;
  text: string;
  description: string;
  arguments: Record<string, DefinitionArgument>;
}

const blockDefinitions = definitions.blocks as readonly BlockDefinition[];

export class BinaryDataExtension implements TurboWarpExtension {
  private readonly store: BinaryDataStore;
  private readonly provider?: BinaryDataNamedDataProvider;
  private readonly providerRegistration?: NamedDataProviderRegistration;
  private readonly unbindNamedDataRegistryLifecycle?: () => void;

  public constructor(
    private readonly enabled = false,
    maxBytes?: number,
    runtime: object | undefined = Scratch.vm?.runtime
  ) {
    this.store = new BinaryDataStore(maxBytes);
    if (enabled) {
      this.provider = new BinaryDataNamedDataProvider(this.store);
      if (runtime) {
        const registry = installNamedDataRegistry(runtime);
        this.providerRegistration = registry.registerProvider(
          this.provider,
          {lifetime: 'persistent'}
        );
        if ('on' in runtime && typeof runtime.on === 'function') {
          this.unbindNamedDataRegistryLifecycle = bindNamedDataRegistryLifecycle(
            runtime as {on(event: string, listener: () => void): void},
            registry
          );
          (runtime as {on(event: string, listener: () => void): void}).on(
            'RUNTIME_DISPOSED',
            () => { void this.dispose(); }
          );
        }
      }
    }
    if (runtime && 'on' in runtime && typeof runtime.on === 'function') {
      (runtime as {on(event: string, listener: () => void): void}).on(
        'PROJECT_STOP_ALL',
        () => this.clearProjectSession()
      );
    }
  }

  public getInfo(): Record<string, unknown> {
    return {
      id: extensionConfig.id,
      name: Scratch.translate(definitions.extensionName),
      docsURI: extensionConfig.docsURI,
      blockIconURI: extensionConfig.blockIconURI,
      blocks: this.enabled ? blockDefinitions.map((block) => this.toScratchBlock(block)) : []
    };
  }

  public async registerBytes(name: string, bytes: ArrayBuffer | Uint8Array, options: BinaryRegistrationOptions = {}): Promise<BinaryMetadata> {
    this.ensureEnabled();
    return this.store.register(name, bytes, options);
  }

  public snapshot(name: string): Uint8Array {
    this.ensureEnabled();
    return this.store.snapshot(name);
  }

  public getNamedDataProvider(): BinaryDataNamedDataProvider | undefined {
    return this.provider;
  }

  public async dispose(): Promise<void> {
    await this.providerRegistration?.unregister();
    this.unbindNamedDataRegistryLifecycle?.();
  }

  public async createUtf8(args: {TEXT: unknown; NAME: unknown; MIME: unknown}): Promise<void> {
    const text = Scratch.Cast.toString(args.TEXT);
    await this.registerBytes(Scratch.Cast.toString(args.NAME), new TextEncoder().encode(text), {
      mediaType: Scratch.Cast.toString(args.MIME)
    });
  }

  public hasBinary(args: {NAME: unknown}): boolean {
    this.ensureEnabled();
    return this.store.has(Scratch.Cast.toString(args.NAME));
  }

  public deleteBinary(args: {NAME: unknown}): void {
    this.ensureEnabled();
    this.store.delete(Scratch.Cast.toString(args.NAME));
  }

  public mimeType(args: {NAME: unknown}): string {
    this.ensureEnabled();
    return this.store.metadata(Scratch.Cast.toString(args.NAME)).mediaType;
  }

  public byteLength(args: {NAME: unknown}): number {
    this.ensureEnabled();
    return this.store.metadata(Scratch.Cast.toString(args.NAME)).byteLength;
  }

  public sha256(args: {NAME: unknown}): string {
    this.ensureEnabled();
    return this.store.metadata(Scratch.Cast.toString(args.NAME)).digest;
  }

  private clearProjectSession(): void {
    if (this.provider) this.provider.clearSession();
    else this.store.clear();
  }

  private ensureEnabled(): void {
    if (!this.enabled) throw new Error('BINARY_DATA_MVP is disabled.');
  }

  private toScratchBlock(block: BlockDefinition): Record<string, unknown> {
    return {
      opcode: block.opcode,
      blockType: Scratch.BlockType[block.blockType],
      text: Scratch.translate(block.text),
      arguments: Object.fromEntries(
        Object.entries(block.arguments).map(([name, argument]) => [name, {
          type: Scratch.ArgumentType[argument.type],
          defaultValue: argument.defaultValue
        }])
      )
    };
  }
}
