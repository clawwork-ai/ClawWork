import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => ({
  openSync: vi.fn(),
  realpathSync: vi.fn(),
  fstatSync: vi.fn(),
  readSync: vi.fn(),
  closeSync: vi.fn(),
}));

import { readContextFile } from '../src/main/context/file-reader.js';
import { openSync, realpathSync, fstatSync, readSync, closeSync } from 'fs';

const mockOpenSync = vi.mocked(openSync);
const mockRealpathSync = vi.mocked(realpathSync);
const mockFstatSync = vi.mocked(fstatSync);
const mockReadSync = vi.mocked(readSync);
const mockCloseSync = vi.mocked(closeSync);

const FAKE_FD = 42;
const CONTEXT_DIR = '/mock/context';
const LARGE_SIZE = 11 * 1024 * 1024;
const MAX_BINARY_SIZE = 10 * 1024 * 1024;

function mockFile(filePath: string, fileSize: number) {
  mockOpenSync.mockReturnValue(FAKE_FD);
  mockRealpathSync.mockImplementation(((p: string) =>
    p === `/dev/fd/${FAKE_FD}` ? filePath : p) as typeof realpathSync);
  mockFstatSync.mockReturnValue({ size: fileSize } as ReturnType<typeof fstatSync>);
  mockReadSync.mockReturnValue(0);
  mockCloseSync.mockReturnValue(undefined);
}

beforeEach(() => {
  mockOpenSync.mockReset();
  mockRealpathSync.mockReset();
  mockFstatSync.mockReset();
  mockReadSync.mockReset();
  mockCloseSync.mockReset();
});

describe('readContextFile', () => {
  it('returns truncated: true for PDF files larger than 10MB', () => {
    const filePath = `${CONTEXT_DIR}/large.pdf`;
    mockFile(filePath, LARGE_SIZE);

    const result = readContextFile(filePath, [CONTEXT_DIR]);

    expect(result.truncated).toBe(true);
    expect(result.size).toBe(LARGE_SIZE);
    expect(result.content).toBeDefined();
    expect(result.mimeType).toBe('application/pdf');
    expect(result.tier).toBe('document');
    expect(mockCloseSync).toHaveBeenCalledWith(FAKE_FD);
  });

  it('returns truncated: true for image files larger than 10MB', () => {
    const filePath = `${CONTEXT_DIR}/large.jpg`;
    mockFile(filePath, LARGE_SIZE);

    const result = readContextFile(filePath, [CONTEXT_DIR]);

    expect(result.truncated).toBe(true);
    expect(result.size).toBe(LARGE_SIZE);
    expect(result.content).toBeDefined();
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.tier).toBe('image');
  });

  it('returns truncated: false for files smaller than 10MB', () => {
    const smallSize = 1024 * 1024;
    const filePath = `${CONTEXT_DIR}/small.pdf`;
    mockFile(filePath, smallSize);

    const result = readContextFile(filePath, [CONTEXT_DIR]);

    expect(result.truncated).toBe(false);
    expect(result.size).toBe(smallSize);
    expect(result.content).toBeDefined();
    expect(result.mimeType).toBe('application/pdf');
    expect(result.tier).toBe('document');
  });

  it('returns content as base64 for binary files', () => {
    const filePath = `${CONTEXT_DIR}/large.jpg`;
    mockFile(filePath, LARGE_SIZE);

    const result = readContextFile(filePath, [CONTEXT_DIR]);

    expect(() => Buffer.from(result.content, 'base64')).not.toThrow();
    const decoded = Buffer.from(result.content, 'base64');
    expect(decoded.length).toBe(Math.min(LARGE_SIZE, MAX_BINARY_SIZE));
  });

  it('truncates text files larger than 100KB and appends marker', () => {
    const filePath = `${CONTEXT_DIR}/big.ts`;
    mockFile(filePath, 200 * 1024);

    const result = readContextFile(filePath, [CONTEXT_DIR]);

    expect(result.truncated).toBe(true);
    expect(result.size).toBe(200 * 1024);
    expect(result.content).toContain('\n[truncated at 100KB]');
    expect(result.tier).toBe('text');
    expect(result.mimeType).toBe('text/typescript');
  });

  it('returns full content for text files under 100KB', () => {
    const filePath = `${CONTEXT_DIR}/small.ts`;
    mockFile(filePath, 50 * 1024);

    const result = readContextFile(filePath, [CONTEXT_DIR]);

    expect(result.truncated).toBe(false);
    expect(result.size).toBe(50 * 1024);
    expect(result.content).not.toContain('[truncated');
    expect(result.tier).toBe('text');
  });

  it('closes fd even when path check fails', () => {
    const filePath = '/outside/not-allowed.pdf';
    mockFile(filePath, 1024);

    expect(() => readContextFile(filePath, [CONTEXT_DIR])).toThrow('path outside allowed context folders');
    expect(mockCloseSync).toHaveBeenCalledWith(FAKE_FD);
  });

  it('throws for unsupported file types', () => {
    const filePath = `${CONTEXT_DIR}/data.exe`;
    mockFile(filePath, 1024);

    expect(() => readContextFile(filePath, [CONTEXT_DIR])).toThrow('unsupported file type');
    expect(mockCloseSync).toHaveBeenCalledWith(FAKE_FD);
  });
});
