export const BINARY_DATA_MVP_DEFAULT = false;

export function isBinaryDataMvpEnabled(
  source: {BINARY_DATA_MVP?: unknown} = globalThis as {BINARY_DATA_MVP?: unknown}
): boolean {
  const value = source.BINARY_DATA_MVP;
  return value === undefined ? BINARY_DATA_MVP_DEFAULT : value === true || value === 'true';
}

export const extensionConfig = {
  id: 'kubohiroyabinarydata',
  slug: 'binary-data',
  name: 'Binary Data',
  description: 'Store named binary data and expose immutable raw body snapshots.',
  author: 'Hiroya Kubo',
  license: 'MPL-2.0',
  unsandboxed: true,
  docsURI: 'https://kubohiroya.github.io/turbowarp-binary-data/',
  blockIconURI:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzhBNTVENyIvPjx0ZXh0IHg9IjI0IiB5PSIyOS43NiIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNmZmYiPjAxPC90ZXh0Pjwvc3ZnPg=='
} as const;
