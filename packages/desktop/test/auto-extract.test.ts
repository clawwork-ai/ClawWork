import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'crypto';

const webContentsSendMock = vi.fn();
const dbAllMock = vi.fn();
const whereMock = vi.fn(() => ({ all: dbAllMock }));
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));
const getDbMock = vi.fn(() => ({ select: selectMock }));
const saveArtifactFromBufferMock = vi.fn();
const readOpenClawMediaFileMock = vi.fn();

vi.mock('electron', () => ({
  BrowserWindow: {
    getAllWindows: vi.fn(() => [{ webContents: { send: webContentsSendMock } }]),
  },
}));

vi.mock('../src/main/db/index.js', () => ({
  getDb: getDbMock,
}));

vi.mock('../src/main/artifact/save.js', () => ({
  saveArtifactFromBuffer: saveArtifactFromBufferMock,
}));

vi.mock('../src/main/media/resolve.js', () => ({
  readOpenClawMediaFile: readOpenClawMediaFileMock,
}));

describe('autoExtractArtifacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbAllMock.mockReturnValue([]);
    saveArtifactFromBufferMock.mockResolvedValue({
      id: 'artifact-1',
      taskId: 'task-1',
      messageId: 'msg-1',
      type: 'image',
      name: 'result.png',
      localPath: 'task-1/result.png',
      mimeType: 'image/png',
      size: 5,
      createdAt: '2026-03-16T00:00:00.000Z',
    });
    readOpenClawMediaFileMock.mockResolvedValue(Buffer.from('image').toString('base64'));
  });

  it('saves assistant image attachments as image artifacts', async () => {
    const { autoExtractArtifacts } = await import('../src/main/artifact/auto-extract.js');

    await autoExtractArtifacts({
      workspacePath: '/workspace',
      taskId: 'task-1',
      messageId: 'msg-1',
      content: '',
      attachments: [
        {
          fileName: 'result.png',
          dataUrl: 'file:///Users/x/.openclaw/media/result.png',
          mimeType: 'image/png',
          sourcePath: '/Users/x/.openclaw/media/result.png',
        },
      ],
    });

    expect(readOpenClawMediaFileMock).toHaveBeenCalledWith('/Users/x/.openclaw/media/result.png');
    expect(saveArtifactFromBufferMock).toHaveBeenCalledWith(
      expect.objectContaining({
        workspacePath: '/workspace',
        taskId: 'task-1',
        messageId: 'msg-1',
        fileName: 'result.png',
        buffer: Buffer.from('image'),
        artifactType: 'image',
        sourceKey: expect.stringMatching(/^attachment:/),
      }),
    );
    expect(webContentsSendMock).toHaveBeenCalledWith('artifact:saved', expect.objectContaining({ id: 'artifact-1' }));
  });

  it('does not save duplicate attachment artifacts with the same source key', async () => {
    const { autoExtractArtifacts } = await import('../src/main/artifact/auto-extract.js');

    const sourcePath = '/Users/x/.openclaw/media/result.png';
    const key = `attachment:${createHash('sha256').update(sourcePath).digest('hex').slice(0, 16)}`;
    dbAllMock.mockReturnValue([{ name: 'result-a1b2c3d4.png', type: 'image', size: 5, sourceKey: key }]);

    await autoExtractArtifacts({
      workspacePath: '/workspace',
      taskId: 'task-1',
      messageId: 'msg-1',
      content: '',
      attachments: [
        {
          fileName: 'result.png',
          dataUrl: 'file:///Users/x/.openclaw/media/result.png',
          mimeType: 'image/png',
          sourcePath,
        },
      ],
    });

    expect(saveArtifactFromBufferMock).not.toHaveBeenCalled();
    expect(webContentsSendMock).not.toHaveBeenCalled();
  });

  it('does not re-save legacy attachment artifacts that predate source keys', async () => {
    const { autoExtractArtifacts } = await import('../src/main/artifact/auto-extract.js');

    dbAllMock.mockReturnValue([{ name: 'result-a1b2c3d4.png', type: 'image', size: 5, sourceKey: '' }]);

    await autoExtractArtifacts({
      workspacePath: '/workspace',
      taskId: 'task-1',
      messageId: 'msg-1',
      content: '',
      attachments: [
        {
          fileName: 'result.png',
          dataUrl: 'file:///Users/x/.openclaw/media/result.png',
          mimeType: 'image/png',
          sourcePath: '/Users/x/.openclaw/media/result.png',
        },
      ],
    });

    expect(saveArtifactFromBufferMock).not.toHaveBeenCalled();
    expect(webContentsSendMock).not.toHaveBeenCalled();
  });

  it('serializes concurrent extraction for the same message', async () => {
    const { autoExtractArtifacts } = await import('../src/main/artifact/auto-extract.js');

    let resolveRead: (value: string) => void = () => {};
    readOpenClawMediaFileMock.mockReturnValue(
      new Promise<string>((resolve) => {
        resolveRead = resolve;
      }),
    );

    const params = {
      workspacePath: '/workspace',
      taskId: 'task-1',
      messageId: 'msg-1',
      content: '',
      attachments: [
        {
          fileName: 'result.png',
          dataUrl: 'file:///Users/x/.openclaw/media/result.png',
          mimeType: 'image/png',
          sourcePath: '/Users/x/.openclaw/media/result.png',
        },
      ],
    };

    const first = autoExtractArtifacts(params);
    const second = autoExtractArtifacts(params);
    expect(readOpenClawMediaFileMock).toHaveBeenCalledTimes(1);

    resolveRead(Buffer.from('image').toString('base64'));
    await Promise.all([first, second]);

    expect(saveArtifactFromBufferMock).toHaveBeenCalledTimes(1);
    expect(webContentsSendMock).toHaveBeenCalledTimes(1);
  });
});
