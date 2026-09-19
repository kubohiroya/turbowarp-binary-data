// Name: Binary Data
// ID: kubohiroyabinarydata
// Description: Store named binary data and expose immutable raw body snapshots.
// By: Hiroya Kubo
// License: MPL-2.0

(function (Scratch) {
  'use strict';

  function isBinaryDataMvpEnabled(source = globalThis) {
  	const value = source.BINARY_DATA_MVP;
  	return value === void 0 ? false : value === true || value === "true";
  }
  var extensionConfig = {
  	id: "kubohiroyabinarydata",
  	slug: "binary-data",
  	name: "Binary Data",
  	description: "Store named binary data and expose immutable raw body snapshots.",
  	author: "Hiroya Kubo",
  	license: "MPL-2.0",
  	unsandboxed: true,
  	docsURI: "https://kubohiroya.github.io/turbowarp-binary-data/",
  	blockIconURI: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE0IiByeD0iMyIgZmlsbD0iIzRDOTdGRiIvPjxyZWN0IHg9IjI2IiB5PSI4IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjNTlDMDU5Ii8+PHJlY3QgeD0iMTUiIHk9IjI2IiB3aWR0aD0iMTgiIGhlaWdodD0iMTQiIHJ4PSIzIiBmaWxsPSIjRkZBQjE5Ii8+PC9zdmc+"
  };
  var block_definitions_default = {
  	extensionName: "Binary Data",
  	blocks: [
  		{
  			"opcode": "createUtf8",
  			"blockType": "COMMAND",
  			"text": "store UTF-8 [TEXT] as binary [NAME] with MIME [MIME]",
  			"description": "Copies UTF-8 encoded text into a project-scoped named binary value.",
  			"arguments": {
  				"TEXT": {
  					"type": "STRING",
  					"defaultValue": "Hello"
  				},
  				"NAME": {
  					"type": "STRING",
  					"defaultValue": "message"
  				},
  				"MIME": {
  					"type": "STRING",
  					"defaultValue": "text/plain; charset=utf-8"
  				}
  			}
  		},
  		{
  			"opcode": "hasBinary",
  			"blockType": "BOOLEAN",
  			"text": "binary [NAME] exists?",
  			"description": "Reports whether a project-scoped named binary value exists.",
  			"arguments": { "NAME": {
  				"type": "STRING",
  				"defaultValue": "message"
  			} }
  		},
  		{
  			"opcode": "deleteBinary",
  			"blockType": "COMMAND",
  			"text": "delete binary [NAME]",
  			"description": "Deletes a project-scoped named binary value.",
  			"arguments": { "NAME": {
  				"type": "STRING",
  				"defaultValue": "message"
  			} }
  		},
  		{
  			"opcode": "mimeType",
  			"blockType": "REPORTER",
  			"text": "MIME type of binary [NAME]",
  			"description": "Returns the MIME type of a named binary value.",
  			"arguments": { "NAME": {
  				"type": "STRING",
  				"defaultValue": "message"
  			} }
  		},
  		{
  			"opcode": "byteLength",
  			"blockType": "REPORTER",
  			"text": "byte length of binary [NAME]",
  			"description": "Returns the byte length of a named binary value.",
  			"arguments": { "NAME": {
  				"type": "STRING",
  				"defaultValue": "message"
  			} }
  		},
  		{
  			"opcode": "sha256",
  			"blockType": "REPORTER",
  			"text": "SHA-256 of binary [NAME]",
  			"description": "Returns the SHA-256 digest of a named binary value.",
  			"arguments": { "NAME": {
  				"type": "STRING",
  				"defaultValue": "message"
  			} }
  		}
  	]
  };
  //#endregion
  //#region node_modules/.pnpm/@kubohiroya+turbowarp-named-data@https+++codeload.github.com+kubohiroya+turbowarp-named_9c01aa0963d4f4703e15731a8abd37a9/node_modules/@kubohiroya/turbowarp-named-data/dist/composition.js
  var NAMED_DATA_REGISTRY_SYMBOL_KEY = "@kubohiroya/turbowarp-named-data/registry/2.0";
  var NAMED_DATA_REGISTRY_SYMBOL = Symbol.for(NAMED_DATA_REGISTRY_SYMBOL_KEY);
  var NAMED_DATA_KINDS = [
  	"structured",
  	"document",
  	"binary",
  	"asset"
  ];
  var NAMED_DATA_SCOPES = ["target", "project"];
  var NAMED_DATA_REPRESENTATIONS = [
  	"json",
  	"yaml",
  	"html",
  	"markdown",
  	"raw"
  ];
  var NAMED_DATA_ERROR_CODES = [
  	"NAMED_DATA_INVALID_REF",
  	"NAMED_DATA_INCOMPATIBLE_VERSION",
  	"NAMED_DATA_NAMESPACE_CONFLICT",
  	"NAMED_DATA_PROVIDER_NOT_FOUND",
  	"NAMED_DATA_NOT_FOUND",
  	"NAMED_DATA_KIND_MISMATCH",
  	"NAMED_DATA_SCOPE_MISMATCH",
  	"NAMED_DATA_REPRESENTATION_UNSUPPORTED",
  	"NAMED_DATA_INVALID_METADATA",
  	"NAMED_DATA_BODY_TOO_LARGE",
  	"NAMED_DATA_ABORTED",
  	"NAMED_DATA_PROVIDER_RELEASED"
  ];
  var NamedDataError = class extends Error {
  	constructor(code, message, options) {
  		super(`${code}: ${message}`, options);
  		this.code = code;
  		this.name = "NamedDataError";
  	}
  };
  var LIFECYCLE_SYMBOL = Symbol.for("@kubohiroya/turbowarp-named-data/lifecycle/2.0");
  var NAMESPACE_PATTERN = /^[a-z][a-z0-9.-]{0,63}$/u;
  var errorCodes = new Set(NAMED_DATA_ERROR_CODES);
  var NamedDataRegistry = class {
  	constructor() {
  		this.contractVersion = "2.0";
  		this.symbolKey = NAMED_DATA_REGISTRY_SYMBOL_KEY;
  		this.providers = /* @__PURE__ */ new Map();
  		this.handles = /* @__PURE__ */ new Set();
  	}
  	registerProvider(provider, options = {}) {
  		requireNamespace(provider.namespace);
  		if (this.providers.has(provider.namespace)) throw new NamedDataError("NAMED_DATA_NAMESPACE_CONFLICT", `Namespace is already registered: ${provider.namespace}`);
  		if (!NAMED_DATA_KINDS.includes(provider.kind)) throw new NamedDataError("NAMED_DATA_INVALID_REF", `Unknown provider kind: ${provider.kind}`);
  		const entry = {
  			provider,
  			lifetime: options.lifetime ?? "session"
  		};
  		this.providers.set(provider.namespace, entry);
  		let active = true;
  		return {
  			namespace: provider.namespace,
  			unregister: async () => {
  				if (!active) return;
  				active = false;
  				if (this.providers.get(provider.namespace) === entry) {
  					this.providers.delete(provider.namespace);
  					await this.releaseHandlesForNamespace(provider.namespace);
  					await provider.release("shutdown");
  				}
  			}
  		};
  	}
  	canResolve(reference, representation) {
  		try {
  			validateReferenceShape(reference, representation);
  			const provider = this.providers.get(reference.namespace)?.provider;
  			return provider?.kind === reference.kind && provider.canResolve(reference, representation);
  		} catch {
  			return false;
  		}
  	}
  	async stat(reference, representation, context = {}) {
  		const provider = this.resolveProvider(reference, representation, context);
  		throwIfAborted$1(context.signal);
  		try {
  			const metadata = await provider.stat(reference, representation, context);
  			throwIfAborted$1(context.signal);
  			validateMetadata(metadata, reference, representation);
  			return metadata;
  		} catch (error) {
  			throw normalizeProviderError(error);
  		}
  	}
  	async openBody(reference, representation, context = {}) {
  		const provider = this.resolveProvider(reference, representation, context);
  		throwIfAborted$1(context.signal);
  		let opened;
  		try {
  			opened = await provider.openBody(reference, representation, context);
  			validateMetadata(opened, reference, representation);
  			if (!(opened.body instanceof Uint8Array) && !(opened.body instanceof ReadableStream)) throw new NamedDataError("NAMED_DATA_INVALID_METADATA", "Provider returned an invalid body.");
  		} catch (error) {
  			throw normalizeProviderError(error);
  		}
  		if (context.signal?.aborted) {
  			await opened.release("abort");
  			throw abortedError();
  		}
  		let released = false;
  		let abortListener;
  		const tracked = {
  			namespace: reference.namespace,
  			release: async (reason = "complete") => {
  				if (released) return;
  				released = true;
  				if (abortListener && context.signal) context.signal.removeEventListener("abort", abortListener);
  				this.handles.delete(tracked);
  				await opened.release(reason);
  			}
  		};
  		this.handles.add(tracked);
  		if (context.signal) {
  			abortListener = () => {
  				Promise.resolve(tracked.release("abort")).catch(() => void 0);
  			};
  			context.signal.addEventListener("abort", abortListener, { once: true });
  			if (context.signal.aborted) {
  				await tracked.release("abort");
  				throw abortedError();
  			}
  		}
  		return Object.freeze({
  			reference: Object.freeze({ ...opened.reference }),
  			nativeRepresentation: opened.nativeRepresentation,
  			representation: opened.representation,
  			mediaType: opened.mediaType,
  			...opened.byteLength === void 0 ? {} : { byteLength: opened.byteLength },
  			...opened.digest === void 0 ? {} : { digest: opened.digest },
  			revision: opened.revision,
  			replayable: opened.replayable,
  			body: opened.body,
  			release: tracked.release
  		});
  	}
  	async clearSession() {
  		const handles = [...this.handles];
  		this.handles.clear();
  		await Promise.allSettled(handles.map((handle) => handle.release("shutdown")));
  		const sessionEntries = [...this.providers.entries()].filter(([, entry]) => entry.lifetime === "session");
  		for (const [namespace] of sessionEntries) this.providers.delete(namespace);
  		await Promise.allSettled(sessionEntries.map(([, entry]) => entry.provider.release("shutdown")));
  		await Promise.allSettled([...this.providers.values()].map((entry) => entry.provider.clearSession?.()));
  	}
  	resolveProvider(reference, representation, context) {
  		validateReference(reference, representation, context);
  		const provider = this.providers.get(reference.namespace)?.provider;
  		if (!provider) throw new NamedDataError("NAMED_DATA_PROVIDER_NOT_FOUND", `No provider can resolve namespace: ${reference.namespace}`);
  		if (provider.kind !== reference.kind) throw new NamedDataError("NAMED_DATA_KIND_MISMATCH", `Provider kind ${provider.kind} does not match ${reference.kind}.`);
  		if (!provider.canResolve(reference, representation)) throw new NamedDataError("NAMED_DATA_REPRESENTATION_UNSUPPORTED", `Provider ${reference.namespace} does not support representation: ${representation}`);
  		return provider;
  	}
  	async releaseHandlesForNamespace(namespace) {
  		const handles = [...this.handles].filter((handle) => handle.namespace === namespace);
  		await Promise.allSettled(handles.map((handle) => handle.release("shutdown")));
  	}
  };
  function installNamedDataRegistry(runtime) {
  	const host = runtime;
  	const existing = host[NAMED_DATA_REGISTRY_SYMBOL];
  	if (existing !== void 0) return requireCompatibleRegistry(existing);
  	const registry = new NamedDataRegistry();
  	Object.defineProperty(host, NAMED_DATA_REGISTRY_SYMBOL, {
  		configurable: true,
  		enumerable: false,
  		writable: false,
  		value: registry
  	});
  	return registry;
  }
  function bindNamedDataRegistryLifecycle(runtime, registry) {
  	const host = runtime;
  	const existing = host[LIFECYCLE_SYMBOL];
  	if (existing !== void 0) {
  		if (existing.registry !== registry) throw new NamedDataError("NAMED_DATA_INCOMPATIBLE_VERSION", "Runtime already has a lifecycle binding for a different registry.");
  		existing.references += 1;
  		return lifecycleUnbind(runtime, host, existing);
  	}
  	const listener = () => {
  		registry.clearSession();
  	};
  	runtime.on("PROJECT_STOP_ALL", listener);
  	const binding = {
  		registry,
  		listener,
  		references: 1
  	};
  	Object.defineProperty(host, LIFECYCLE_SYMBOL, {
  		configurable: true,
  		enumerable: false,
  		writable: false,
  		value: binding
  	});
  	return lifecycleUnbind(runtime, host, binding);
  }
  function lifecycleUnbind(runtime, host, binding) {
  	let active = true;
  	return () => {
  		if (!active || host[LIFECYCLE_SYMBOL] !== binding) return;
  		active = false;
  		binding.references -= 1;
  		if (binding.references > 0) return;
  		runtime.off?.("PROJECT_STOP_ALL", binding.listener);
  		delete host[LIFECYCLE_SYMBOL];
  	};
  }
  function requireCompatibleRegistry(value) {
  	if (typeof value !== "object" || value === null || value.contractVersion !== "2.0" || value.symbolKey !== "@kubohiroya/turbowarp-named-data/registry/2.0") throw new NamedDataError("NAMED_DATA_INCOMPATIBLE_VERSION", `Runtime slot ${NAMED_DATA_REGISTRY_SYMBOL_KEY} contains an incompatible service.`);
  	return value;
  }
  function validateReference(reference, representation, context) {
  	validateReferenceShape(reference, representation);
  	if (reference.scope === "target" && context.target === void 0) throw new NamedDataError("NAMED_DATA_SCOPE_MISMATCH", "Target scope requires target context.");
  	if (reference.scope === "project" && context.project === void 0) throw new NamedDataError("NAMED_DATA_SCOPE_MISMATCH", "Project scope requires project context.");
  	throwIfAborted$1(context.signal);
  }
  function validateReferenceShape(reference, representation) {
  	if (!reference || typeof reference !== "object") throw invalidReference();
  	requireNamespace(reference.namespace);
  	if (typeof reference.name !== "string" || reference.name.length === 0 || reference.name.length > 256 || containsControlCharacter(reference.name) || !NAMED_DATA_KINDS.includes(reference.kind) || !NAMED_DATA_SCOPES.includes(reference.scope) || !NAMED_DATA_REPRESENTATIONS.includes(representation)) throw invalidReference();
  }
  function validateMetadata(metadata, reference, representation) {
  	if (metadata.representation !== representation || !isNativeRepresentation(metadata.reference.kind, metadata.nativeRepresentation) || metadata.reference.namespace !== reference.namespace || metadata.reference.name !== reference.name || metadata.reference.kind !== reference.kind || metadata.reference.scope !== reference.scope || typeof metadata.mediaType !== "string" || metadata.mediaType.length === 0 || typeof metadata.revision !== "string" || metadata.revision.length === 0 || typeof metadata.replayable !== "boolean" || metadata.byteLength !== void 0 && (!Number.isSafeInteger(metadata.byteLength) || metadata.byteLength < 0) || metadata.digest !== void 0 && !/^sha256-[A-Za-z0-9_-]+$/u.test(metadata.digest)) throw new NamedDataError("NAMED_DATA_INVALID_METADATA", "Provider returned invalid metadata.");
  }
  function isNativeRepresentation(kind, representation) {
  	if (kind === "structured") return representation === "json" || representation === "yaml";
  	if (kind === "document") return representation === "html" || representation === "markdown";
  	return representation === "raw";
  }
  function requireNamespace(namespace) {
  	if (typeof namespace !== "string" || !NAMESPACE_PATTERN.test(namespace)) throw invalidReference("Invalid namespace.");
  }
  function containsControlCharacter(value) {
  	return [...value].some((character) => {
  		const code = character.codePointAt(0) ?? 0;
  		return code <= 31 || code === 127;
  	});
  }
  function invalidReference(message = "Invalid named-data reference.") {
  	return new NamedDataError("NAMED_DATA_INVALID_REF", message);
  }
  function throwIfAborted$1(signal) {
  	if (signal?.aborted) throw abortedError();
  }
  function abortedError() {
  	return new NamedDataError("NAMED_DATA_ABORTED", "Named-data operation was aborted.");
  }
  function normalizeProviderError(error) {
  	if (error instanceof NamedDataError) return error;
  	if (error instanceof Error && "code" in error && typeof error.code === "string" && errorCodes.has(error.code)) return new NamedDataError(error.code, error.message, { cause: error });
  	return new NamedDataError("NAMED_DATA_PROVIDER_RELEASED", "Provider operation failed.", { cause: error });
  }
  function configuredFlag(name) {
  	const value = globalThis.__TW_NAMED_DATA_FEATURE_FLAGS__?.[name];
  	return value === true || value === "true";
  }
  Object.freeze({ NAMED_DATA_REGISTRY_MVP: configuredFlag("NAMED_DATA_REGISTRY_MVP") });
  //#endregion
  //#region src/binary-provider.ts
  var BINARY_DATA_NAMESPACE = "binary";
  var BinaryDataNamedDataProvider = class {
  	constructor(store) {
  		this.store = store;
  		this.namespace = BINARY_DATA_NAMESPACE;
  		this.kind = "binary";
  		this.openHandles = /* @__PURE__ */ new Set();
  		this.released = false;
  	}
  	canResolve(reference, representation) {
  		return reference.namespace === this.namespace && reference.kind === this.kind && reference.scope === "project" && representation === "raw";
  	}
  	stat(reference, representation, context) {
  		this.validate(reference, representation, context);
  		return this.toNamedMetadata(reference, this.store.metadata(reference.name));
  	}
  	openBody(reference, representation, context) {
  		this.validate(reference, representation, context);
  		const metadata = this.store.metadata(reference.name);
  		const snapshot = this.store.snapshot(reference.name);
  		this.throwIfAborted(context.signal);
  		const token = Symbol("binary-body");
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
  	clearSession() {
  		this.openHandles.clear();
  		this.store.clear();
  	}
  	release() {
  		this.released = true;
  		this.openHandles.clear();
  		this.store.clear();
  	}
  	validate(reference, representation, context) {
  		if (this.released) throw new NamedDataError("NAMED_DATA_PROVIDER_RELEASED", "The binary provider was released.");
  		if (reference.namespace !== this.namespace || reference.name.trim().length === 0) throw new NamedDataError("NAMED_DATA_INVALID_REF", "Invalid binary data reference.");
  		if (reference.kind !== this.kind) throw new NamedDataError("NAMED_DATA_KIND_MISMATCH", `Expected ${this.kind}, received ${reference.kind}.`);
  		if (reference.scope !== "project" || context.project === void 0) throw new NamedDataError("NAMED_DATA_SCOPE_MISMATCH", "Binary data currently requires project scope.");
  		if (representation !== "raw") throw new NamedDataError("NAMED_DATA_REPRESENTATION_UNSUPPORTED", `Binary data cannot be rendered as ${representation}.`);
  		this.throwIfAborted(context.signal);
  	}
  	toNamedMetadata(reference, metadata) {
  		return {
  			reference: {
  				...reference,
  				name: metadata.name
  			},
  			nativeRepresentation: "raw",
  			representation: "raw",
  			mediaType: metadata.mediaType,
  			byteLength: metadata.byteLength,
  			digest: metadata.digest,
  			revision: metadata.revision,
  			replayable: true
  		};
  	}
  	throwIfAborted(signal) {
  		if (signal?.aborted) throw new NamedDataError("NAMED_DATA_ABORTED", "Body resolution was aborted.");
  	}
  };
  //#endregion
  //#region src/binary-store.ts
  var DEFAULT_BINARY_MAX_BYTES = 16777216;
  var BinaryDataStore = class {
  	constructor(maxBytes = DEFAULT_BINARY_MAX_BYTES) {
  		this.maxBytes = maxBytes;
  		this.bindings = /* @__PURE__ */ new Map();
  		this.nextRevision = 1;
  		this.generation = 0;
  		if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new TypeError("Binary size limit must be a non-negative safe integer.");
  	}
  	async register(nameValue, source, options = {}) {
  		const name = normalizeBinaryName(nameValue);
  		const mediaType = normalizeMediaType(options.mediaType ?? "application/octet-stream");
  		const registrationGeneration = this.generation;
  		throwIfAborted(options.signal);
  		const bytes = copyBytes(source);
  		if (bytes.byteLength > this.maxBytes) throw new NamedDataError("NAMED_DATA_BODY_TOO_LARGE", `Binary value is ${bytes.byteLength} bytes; maximum is ${this.maxBytes}.`);
  		const digest = await sha256(bytes);
  		throwIfAborted(options.signal);
  		if (registrationGeneration !== this.generation) throw new NamedDataError("NAMED_DATA_ABORTED", "The binary data session ended during registration.");
  		const binding = {
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
  	has(nameValue) {
  		return this.bindings.has(normalizeBinaryName(nameValue));
  	}
  	delete(nameValue) {
  		return this.bindings.delete(normalizeBinaryName(nameValue));
  	}
  	metadata(nameValue) {
  		return metadataOf(this.require(nameValue));
  	}
  	snapshot(nameValue) {
  		return this.require(nameValue).bytes.slice();
  	}
  	clear() {
  		this.bindings.clear();
  		this.generation += 1;
  	}
  	require(nameValue) {
  		const name = normalizeBinaryName(nameValue);
  		const binding = this.bindings.get(name);
  		if (!binding) throw new NamedDataError("NAMED_DATA_NOT_FOUND", `Binary data does not exist: ${name}`);
  		return binding;
  	}
  };
  function normalizeBinaryName(value) {
  	const name = value;
  	if (name.trim().length === 0 || name.length > 256 || Array.from(name, (character) => character.codePointAt(0) ?? 0).some((codePoint) => codePoint <= 31 || codePoint === 127)) throw new NamedDataError("NAMED_DATA_INVALID_REF", "Binary data name is invalid.");
  	return name;
  }
  function normalizeMediaType(value) {
  	const mediaType = value.trim();
  	const essence = mediaType.split(";", 1)[0]?.trim() ?? "";
  	if (Array.from(mediaType, (character) => character.codePointAt(0) ?? 0).some((codePoint) => codePoint <= 31 || codePoint === 127) || !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/u.test(essence)) throw new NamedDataError("NAMED_DATA_INVALID_REF", "Binary data MIME type is invalid.");
  	return mediaType;
  }
  function copyBytes(source) {
  	if (source instanceof Uint8Array) return source.slice();
  	if (source instanceof ArrayBuffer) return new Uint8Array(source.slice(0));
  	throw new TypeError("Binary data must be an ArrayBuffer or Uint8Array.");
  }
  function metadataOf(binding) {
  	return {
  		name: binding.name,
  		mediaType: binding.mediaType,
  		byteLength: binding.byteLength,
  		digest: binding.digest,
  		revision: binding.revision
  	};
  }
  async function sha256(bytes) {
  	const result = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes).buffer);
  	return `sha256-${Array.from(new Uint8Array(result), (value) => value.toString(16).padStart(2, "0")).join("")}`;
  }
  function throwIfAborted(signal) {
  	if (signal?.aborted) throw new NamedDataError("NAMED_DATA_ABORTED", "Binary data operation was aborted.");
  }
  //#endregion
  //#region src/extension.ts
  var blockDefinitions = block_definitions_default.blocks;
  var BinaryDataExtension = class {
  	constructor(enabled = false, maxBytes, runtime = Scratch.vm?.runtime) {
  		this.enabled = enabled;
  		this.store = new BinaryDataStore(maxBytes);
  		if (enabled) {
  			this.provider = new BinaryDataNamedDataProvider(this.store);
  			if (runtime) {
  				const registry = installNamedDataRegistry(runtime);
  				this.providerRegistration = registry.registerProvider(this.provider, { lifetime: "persistent" });
  				if ("on" in runtime && typeof runtime.on === "function") {
  					this.unbindNamedDataRegistryLifecycle = bindNamedDataRegistryLifecycle(runtime, registry);
  					runtime.on("RUNTIME_DISPOSED", () => {
  						this.dispose();
  					});
  				}
  			}
  		}
  		if (runtime && "on" in runtime && typeof runtime.on === "function") runtime.on("PROJECT_STOP_ALL", () => this.clearProjectSession());
  	}
  	getInfo() {
  		return {
  			id: extensionConfig.id,
  			name: Scratch.translate(block_definitions_default.extensionName),
  			docsURI: extensionConfig.docsURI,
  			blockIconURI: extensionConfig.blockIconURI,
  			blocks: this.enabled ? blockDefinitions.map((block) => this.toScratchBlock(block)) : []
  		};
  	}
  	async registerBytes(name, bytes, options = {}) {
  		this.ensureEnabled();
  		return this.store.register(name, bytes, options);
  	}
  	snapshot(name) {
  		this.ensureEnabled();
  		return this.store.snapshot(name);
  	}
  	getNamedDataProvider() {
  		return this.provider;
  	}
  	async dispose() {
  		await this.providerRegistration?.unregister();
  		this.unbindNamedDataRegistryLifecycle?.();
  	}
  	async createUtf8(args) {
  		const text = Scratch.Cast.toString(args.TEXT);
  		await this.registerBytes(Scratch.Cast.toString(args.NAME), new TextEncoder().encode(text), { mediaType: Scratch.Cast.toString(args.MIME) });
  	}
  	hasBinary(args) {
  		this.ensureEnabled();
  		return this.store.has(Scratch.Cast.toString(args.NAME));
  	}
  	deleteBinary(args) {
  		this.ensureEnabled();
  		this.store.delete(Scratch.Cast.toString(args.NAME));
  	}
  	mimeType(args) {
  		this.ensureEnabled();
  		return this.store.metadata(Scratch.Cast.toString(args.NAME)).mediaType;
  	}
  	byteLength(args) {
  		this.ensureEnabled();
  		return this.store.metadata(Scratch.Cast.toString(args.NAME)).byteLength;
  	}
  	sha256(args) {
  		this.ensureEnabled();
  		return this.store.metadata(Scratch.Cast.toString(args.NAME)).digest;
  	}
  	clearProjectSession() {
  		if (this.provider) this.provider.clearSession();
  		else this.store.clear();
  	}
  	ensureEnabled() {
  		if (!this.enabled) throw new Error("BINARY_DATA_MVP is disabled.");
  	}
  	toScratchBlock(block) {
  		return {
  			opcode: block.opcode,
  			blockType: Scratch.BlockType[block.blockType],
  			text: Scratch.translate(block.text),
  			arguments: Object.fromEntries(Object.entries(block.arguments).map(([name, argument]) => [name, {
  				type: Scratch.ArgumentType[argument.type],
  				defaultValue: argument.defaultValue
  			}]))
  		};
  	}
  };
  //#endregion
  //#region src/index.ts
  if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) throw new Error(`${extensionConfig.name} must run unsandboxed.`);
  Scratch.extensions.register(new BinaryDataExtension(isBinaryDataMvpEnabled()));
  //#endregion

})(Scratch);
