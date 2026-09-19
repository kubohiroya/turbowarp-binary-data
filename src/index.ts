import {extensionConfig, isBinaryDataMvpEnabled} from './config.js';
import {BinaryDataExtension} from './extension.js';

if (extensionConfig.unsandboxed && !Scratch.extensions.unsandboxed) {
  throw new Error(`${extensionConfig.name} must run unsandboxed.`);
}

Scratch.extensions.register(new BinaryDataExtension(isBinaryDataMvpEnabled()));
