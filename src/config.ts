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
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OCA0OCI+CiAgPHJlY3QgeD0iNCIgeT0iOCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjMyIiByeD0iNiIgZmlsbD0iIzhBNTVENyIvPgogIDx0ZXh0IHg9IjI0IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiI+PHRzcGFuIHg9IjI0IiB5PSIyMiI+MDEwMTwvdHNwYW4+PHRzcGFuIHg9IjI0IiB5PSIzNiI+MTAxMDwvdHNwYW4+PC90ZXh0Pgo8L3N2Zz4K'
} as const;
