import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { readContextFile } from '../src/main/context/file-reader.js';

const TEST_DIR = join(__dirname, 'temp-test-files');
const LARGE_FILE_SIZE = 11 * 1024 * 1024; // 11 MB (exceeds MAX_BINARY_SIZE of 10MB)

describe('readContextFile', () => {
  beforeEach(() => {
    // Create test directory if it doesn't exist
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    try {
      unlinkSync(join(TEST_DIR, 'large-test-file.pdf'));
      unlinkSync(join(TEST_DIR, 'large-test-file.jpg'));
      unlinkSync(join(TEST_DIR, 'small-test-file.pdf'));
    } catch {
      // Ignore errors if files don't exist
    }
  });

  it('returns truncated: true for PDF files larger than 10MB', () => {
    const largeFilePath = join(TEST_DIR, 'large-test-file.pdf');

    // Create a large PDF file (11MB)
    const largeContent = Buffer.alloc(LARGE_FILE_SIZE, 'A');
    // Add PDF header
    const pdfHeader = Buffer.from('%PDF-1.4\n');
    const pdfContent = Buffer.concat([pdfHeader, largeContent.slice(pdfHeader.length)]);
    writeFileSync(largeFilePath, pdfContent);

    const result = readContextFile(largeFilePath, [TEST_DIR]);

    expect(result.truncated).toBe(true);
    expect(result.size).toBe(LARGE_FILE_SIZE);
    expect(result.content).toBeDefined();
    expect(result.mimeType).toBe('application/pdf');
    expect(result.tier).toBe('document');
  });

  it('returns truncated: true for image files larger than 10MB', () => {
    const largeFilePath = join(TEST_DIR, 'large-test-file.jpg');

    // Create a large image file (11MB) with JPEG header
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const largeContent = Buffer.alloc(LARGE_FILE_SIZE, 'B');
    const imageContent = Buffer.concat([jpegHeader, largeContent.slice(jpegHeader.length)]);
    writeFileSync(largeFilePath, imageContent);

    const result = readContextFile(largeFilePath, [TEST_DIR]);

    expect(result.truncated).toBe(true);
    expect(result.size).toBe(LARGE_FILE_SIZE);
    expect(result.content).toBeDefined();
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.tier).toBe('image');
  });

  it('returns truncated: false for files smaller than 10MB', () => {
    const smallFilePath = join(TEST_DIR, 'small-test-file.pdf');
    const smallSize = 1024 * 1024; // 1MB

    // Create a small PDF file
    const pdfHeader = Buffer.from('%PDF-1.4\n');
    const smallContent = Buffer.alloc(smallSize - pdfHeader.length, 'C');
    const pdfContent = Buffer.concat([pdfHeader, smallContent]);
    writeFileSync(smallFilePath, pdfContent);

    const result = readContextFile(smallFilePath, [TEST_DIR]);

    expect(result.truncated).toBe(false);
    expect(result.size).toBe(smallSize);
    expect(result.content).toBeDefined();
    expect(result.mimeType).toBe('application/pdf');
    expect(result.tier).toBe('document');
  });

  it('returns content as base64 for binary files', () => {
    const largeFilePath = join(TEST_DIR, 'large-test-file.jpg');

    // Create a large image file with specific content
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    const largeContent = Buffer.alloc(LARGE_FILE_SIZE, 'D');
    const imageContent = Buffer.concat([jpegHeader, largeContent.slice(jpegHeader.length)]);
    writeFileSync(largeFilePath, imageContent);

    const result = readContextFile(largeFilePath, [TEST_DIR]);

    // Content should be base64 encoded
    expect(() => Buffer.from(result.content, 'base64')).not.toThrow();

    // The decoded content should match what we expect (truncated at 10MB)
    const decodedContent = Buffer.from(result.content, 'base64');
    const expectedSize = Math.min(LARGE_FILE_SIZE, 10 * 1024 * 1024);
    expect(decodedContent.length).toBe(expectedSize);
  });
});
