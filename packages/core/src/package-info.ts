import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type PackageInfo = { name: string; version: string };

let cached: PackageInfo | null = null;

// The package name is its identity at runtime: the CLI installs it by name,
// the plugins import it by name, and the dev server reports its version. It
// is read from this package's own manifest so the scope lives in one place.
export function ownPackage(): PackageInfo {
  cached ??= readOwnPackage();
  return cached;
}

export function ownPackageName(): string {
  return ownPackage().name;
}

function readOwnPackage(): PackageInfo {
  // Bundled chunks land at unpredictable depths under dist/, so walk up to
  // the package root instead of resolving a fixed relative path.
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (dir !== path.dirname(dir)) {
    const pkgPath = path.join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
          name?: string;
          version?: string;
        };
        if (pkg.name) return { name: pkg.name, version: pkg.version ?? '0.0.0' };
      } catch {}
      break;
    }
    dir = path.dirname(dir);
  }
  return { name: 'unknown', version: '0.0.0' };
}
