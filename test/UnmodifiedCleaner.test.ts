import { describe, afterEach, it, expect, beforeEach } from 'bun:test';
import * as fs from 'node:fs';
import { Readable } from 'node:stream';

import Vinyl from 'vinyl';

import UnmodifiedCleaner from '../src/UnmodifiedCleaner';

import { collateStream, makeFiles } from './lib';
import { getMockGulpLog } from './lib/mocks.ts';
import { dumpFs, getTempDir } from './lib/fs.ts';

describe('UnmodifiedCleaner', () => {
  let FS_ROOT: string;

  beforeEach(() => {
    FS_ROOT = getTempDir('gulp-clean-unmodified-test-fs-');
  });

  afterEach(() => {
    fs.rmdirSync(FS_ROOT, { recursive: true });
  });

  it('instantiates', () => {
    expect(() => new UnmodifiedCleaner()).not.toThrow();
  });

  it('stores & resets files', async () => {
    const instance = new UnmodifiedCleaner();

    const inputFiles: Vinyl[] = makeFiles([`${FS_ROOT}/one`, `${FS_ROOT}/two`]);
    const outputFiles: Vinyl[] = await collateStream<Vinyl>(Readable.from(inputFiles).pipe(instance.register()));

    // Ensure files are passed through
    expect(outputFiles).toEqual(inputFiles);

    // Ensure files are recorded
    expect([...instance.preservedFiles]).toEqual(inputFiles.map((file) => file.path));

    // Ensure files are forgotten after reset
    instance.reset();
    expect([...instance.preservedFiles]).toEqual([]);
  });

  it('removes files', async () => {
    const mockLogger = await getMockGulpLog();

    const exampleContent = 'Example file';
    /* eslint-disable id-denylist -- Testing use */
    dumpFs({
      [FS_ROOT]: {
        'a.txt': exampleContent,
        'b.txt': exampleContent,
        c: {
          'one.txt': exampleContent,
          two: {
            'inner.txt': exampleContent,
          },
          three: {},
        },
        d: {
          one: {},
        },
        e: {
          one: {
            'inner.txt': exampleContent,
          },
          'two.txt': exampleContent,
        },
      },
    });
    /* eslint-enable id-denylist -- Testing use */

    const inputFiles: Vinyl[] = makeFiles([`${FS_ROOT}/a.txt`, `${FS_ROOT}/c/one.txt`, `${FS_ROOT}/e/one/inner.txt`]);

    const instance = new UnmodifiedCleaner();
    await collateStream<Vinyl>(Readable.from(inputFiles).pipe(instance.register()));
    instance.clean(FS_ROOT);

    const debugCalls = mockLogger.debug.mock.calls as unknown as [string, string][];

    const expectToExistAndNotBeLogged = (pathname: string): void => {
      expect(fs.existsSync(pathname)).toBeTruthy();
      // Should never be logged
      expect(debugCalls.find((call) => call[1] === pathname)).toBeUndefined();
    };
    expectToExistAndNotBeLogged(`${FS_ROOT}/a.txt`);
    expectToExistAndNotBeLogged(`${FS_ROOT}/c`);
    expectToExistAndNotBeLogged(`${FS_ROOT}/c/one.txt`);
    expectToExistAndNotBeLogged(`${FS_ROOT}/e/one`);
    expectToExistAndNotBeLogged(`${FS_ROOT}/e/one/inner.txt`);

    const expectNotToExistAndBeLogged = (pathname: string): void => {
      expect(fs.existsSync(pathname)).toBeFalsy();
      // Should only be logged once
      expect(debugCalls.filter((call) => call[1] === pathname).length).toEqual(1);
    };
    expectNotToExistAndBeLogged(`${FS_ROOT}/b.txt`);
    expectNotToExistAndBeLogged(`${FS_ROOT}/c/two/inner.txt`);
    expectNotToExistAndBeLogged(`${FS_ROOT}/c/two`);
    expectNotToExistAndBeLogged(`${FS_ROOT}/c/three`);
    expectNotToExistAndBeLogged(`${FS_ROOT}/d/one`);
    expectNotToExistAndBeLogged(`${FS_ROOT}/d`);
    expectNotToExistAndBeLogged(`${FS_ROOT}/e/two.txt`);
  });

  it('handles pathname-less files gracefully', async () => {
    const mockLogger = await getMockGulpLog();

    const file = new Vinyl();

    const instance = new UnmodifiedCleaner();
    await collateStream<Vinyl>(Readable.from([file]).pipe(instance.register()));

    const warnCalls = mockLogger.warn.mock.calls as unknown as [string, Vinyl][];
    expect(warnCalls.length).toEqual(1);
    expect(warnCalls[0]?.[1]).toEqual(file);
  });
});
