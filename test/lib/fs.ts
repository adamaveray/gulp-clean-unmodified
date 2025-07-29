import * as fs from 'node:fs';
import * as os from 'node:os';

type FsEntry = string | { [key: string]: FsEntry };

function prefixKeys<TKey extends string, TValue, TPrefix extends string>(
  values: Record<TKey, TValue>,
  prefix: TPrefix,
): Record<`${TPrefix}${TKey}`, TValue> {
  const mapped = {} as Record<`${TPrefix}${TKey}`, TValue>;
  for (const [key, value] of Object.entries(values) as [TKey, TValue][]) {
    mapped[`${prefix}${key}`] = value;
  }
  return mapped;
}

export function dumpFs(entries: Record<string, FsEntry>): void {
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value === 'string') {
      fs.writeFileSync(key, value);
    } else {
      if (!fs.existsSync(key)) {
        fs.mkdirSync(key);
      }
      dumpFs(prefixKeys(value, `${key}/`));
    }
  }
}

export function getTempDir(prefix: string): string {
  return fs.mkdtempSync(os.tmpdir() + '/' + prefix);
}
