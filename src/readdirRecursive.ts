import fs from 'node:fs';
import { join as joinPath } from 'node:path';

interface Entry {
  pathname: string;
  isDirectory: boolean;
}

export default function* readdirRecursive(dir: string): Iterable<Entry> {
  for (const relativePath of fs.readdirSync(dir)) {
    const pathname = joinPath(dir, relativePath);

    const isDirectory = fs.statSync(pathname, { throwIfNoEntry: true }).isDirectory();
    if (isDirectory) {
      // Iterate subdirectory
      yield* readdirRecursive(pathname);
    }
    yield { pathname, isDirectory };
  }
}
