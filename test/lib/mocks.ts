import { mock, Mock } from 'bun:test';
import type GulpLogger from 'gulplog';

export type MockGulpLogger = {
  [K in keyof typeof GulpLogger]: Mock<(typeof GulpLogger)[K]>;
};

export function mockGulpLog(): void {
  mock.module('gulplog', () => {
    const mockObject = {} as Record<keyof typeof GulpLogger, MockGulpLogger[keyof MockGulpLogger]>;
    for (const level of ['debug', 'info', 'warn', 'error'] as (keyof typeof GulpLogger)[]) {
      mockObject[level] = mock(() => {});
    }
    return { default: mockObject };
  });
}

export async function getMockGulpLog(): Promise<MockGulpLogger> {
  const log = await import('gulplog');
  return (log as unknown as { default: MockGulpLogger }).default;
}
