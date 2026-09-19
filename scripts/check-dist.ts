import {execFile} from 'node:child_process';
import {readdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

interface Manifest {
  formatVersion: number;
  id: string;
  blocks: Array<{opcode: string}>;
}

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const distUrl = new URL('../dist/', import.meta.url);
const expectedFiles = ['binary-data.js', 'extension-manifest.json'];
const files = (await readdir(distUrl)).sort();

if (JSON.stringify(files) !== JSON.stringify(expectedFiles)) {
  throw new Error(`dist must contain exactly: ${expectedFiles.join(', ')}; found: ${files.join(', ')}`);
}

const manifest = JSON.parse(await readFile(new URL('extension-manifest.json', distUrl), 'utf8')) as Manifest;
if (manifest.formatVersion !== 1 || manifest.id !== 'kubohiroyabinarydata') {
  throw new Error('dist/extension-manifest.json has unexpected identity or format version.');
}
if (manifest.blocks.length !== 6 || new Set(manifest.blocks.map((block) => block.opcode)).size !== 6) {
  throw new Error('dist/extension-manifest.json must contain all six unique MVP opcodes.');
}

const bundle = await readFile(new URL('binary-data.js', distUrl), 'utf8');
if (!bundle.includes('// ID: kubohiroyabinarydata') || !bundle.includes('BINARY_DATA_MVP')) {
  throw new Error('dist/binary-data.js does not match the extension identity or feature flag.');
}

if (process.env.CI === 'true' || process.env.CHECK_TRACKED_DIST === 'true') {
  const {stdout} = await promisify(execFile)(
    'git',
    ['status', '--short', '--untracked-files=all', '--', 'dist'],
    {cwd: repositoryRoot}
  );
  if (stdout.length > 0) throw new Error(`Generated dist files are not committed and up to date:\n${stdout}`);
}

process.stdout.write(`Validated generated dist files in ${repositoryRoot}.\n`);
