import type { FileTier } from '@clawwork/shared';

const TEXT_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.c',
  '.cpp',
  '.h',
  '.rb',
  '.sh',
  '.sql',
  '.yaml',
  '.yml',
  '.toml',
  '.json',
  '.xml',
  '.html',
  '.css',
  '.scss',
  '.less',
  '.md',
  '.txt',
  '.csv',
  '.env',
  '.gitignore',
  '.dockerfile',
  '.log',
  '.vue',
  '.svelte',
  '.swift',
  '.kt',
  '.r',
  '.lua',
  '.pl',
  '.makefile',
  '.cmake',
  '.proto',
  '.graphql',
  '.tf',
  '.ini',
  '.cfg',
  '.conf',
  '.lock',
  '.editorconfig',
]);

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
const DOC_EXTS = new Set(['.pdf', '.docx', '.xlsx', '.pptx']);

export function classifyTier(ext: string): FileTier {
  if (TEXT_EXTS.has(ext)) return 'text';
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (DOC_EXTS.has(ext)) return 'document';
  return 'unsupported';
}

const MIME_MAP: Record<string, string> = {
  '.ts': 'text/typescript',
  '.tsx': 'text/typescript',
  '.js': 'text/javascript',
  '.jsx': 'text/javascript',
  '.py': 'text/x-python',
  '.go': 'text/x-go',
  '.rs': 'text/x-rust',
  '.java': 'text/x-java',
  '.c': 'text/x-c',
  '.cpp': 'text/x-c++',
  '.h': 'text/x-c',
  '.rb': 'text/x-ruby',
  '.sh': 'text/x-shellscript',
  '.sql': 'text/x-sql',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.toml': 'text/x-toml',
  '.json': 'application/json',
  '.xml': 'text/xml',
  '.html': 'text/html',
  '.css': 'text/css',
  '.scss': 'text/x-scss',
  '.less': 'text/x-less',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.log': 'text/plain',
  '.vue': 'text/x-vue',
  '.svelte': 'text/x-svelte',
  '.swift': 'text/x-swift',
  '.kt': 'text/x-kotlin',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export function getMimeType(ext: string): string {
  return MIME_MAP[ext] ?? 'application/octet-stream';
}
