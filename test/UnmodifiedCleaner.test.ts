import * as fs from 'node:fs';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';

import logger from 'gulplog';
import mockFs from 'mock-fs';
import Vinyl from 'vinyl';

import UnmodifiedCleaner from '../src/UnmodifiedCleaner';

import { collateStream, makeFiles } from './lib';

const MOCKFS_ROOT = resolve('__mockfs');

jest.mock('gulplog');
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('UnmodifiedCleaner', () => {
  afterEach(() => {
    mockFs.restore();
  });

  it('instantiates', () => {
    expect(() => new UnmodifiedCleaner()).not.toThrow();
  });

  it('stores & resets files', async () => {
    const instance = new UnmodifiedCleaner();

    const inputFiles: Vinyl[] = makeFiles([`${MOCKFS_ROOT}/one`, `${MOCKFS_ROOT}/two`]);
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
    const exampleContent = 'Example file';
    /* eslint-disable id-denylist -- Testing use */
    mockFs({
      [MOCKFS_ROOT]: {
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

    const inputFiles: Vinyl[] = makeFiles([
      `${MOCKFS_ROOT}/a.txt`,
      `${MOCKFS_ROOT}/c/one.txt`,
      `${MOCKFS_ROOT}/e/one/inner.txt`,
    ]);

    const instance = new UnmodifiedCleaner();
    await collateStream<Vinyl>(Readable.from(inputFiles).pipe(instance.register()));
    instance.clean(MOCKFS_ROOT);

    const debugCalls = mockLogger.debug.mock.calls as unknown as [string, string][];

    const expectToExistAndNotBeLogged = (pathname: string): void => {
      expect(fs.existsSync(pathname)).toBeTruthy();
      // Should never be logged
      expect(debugCalls.find((call) => call[1] === pathname)).toBeUndefined();
    };
    expectToExistAndNotBeLogged(`${MOCKFS_ROOT}/a.txt`);
    expectToExistAndNotBeLogged(`${MOCKFS_ROOT}/c`);
    expectToExistAndNotBeLogged(`${MOCKFS_ROOT}/c/one.txt`);
    expectToExistAndNotBeLogged(`${MOCKFS_ROOT}/e/one`);
    expectToExistAndNotBeLogged(`${MOCKFS_ROOT}/e/one/inner.txt`);

    const expectNotToExistAndBeLogged = (pathname: string): void => {
      expect(fs.existsSync(pathname)).toBeFalsy();
      // Should only be logged once
      expect(debugCalls.filter((call) => call[1] === pathname).length).toEqual(1);
    };
    expectNotToExistAndBeLogged(`${MOCKFS_ROOT}/b.txt`);
    expectNotToExistAndBeLogged(`${MOCKFS_ROOT}/c/two/inner.txt`);
    expectNotToExistAndBeLogged(`${MOCKFS_ROOT}/c/two`);
    expectNotToExistAndBeLogged(`${MOCKFS_ROOT}/c/three`);
    expectNotToExistAndBeLogged(`${MOCKFS_ROOT}/d/one`);
    expectNotToExistAndBeLogged(`${MOCKFS_ROOT}/d`);
    expectNotToExistAndBeLogged(`${MOCKFS_ROOT}/e/two.txt`);
  });

  it('handles pathname-less files gracefully', async () => {
    const file = new Vinyl();

    const instance = new UnmodifiedCleaner();
    await collateStream<Vinyl>(Readable.from([file]).pipe(instance.register()));

    const warnCalls = mockLogger.warn.mock.calls as unknown as [string, string][];
    expect(warnCalls.length).toEqual(1);
    expect(warnCalls[0]?.[1]).toEqual(file);
  });
});
