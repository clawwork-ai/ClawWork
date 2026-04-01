const AVATAR_MAX_SIZE = 2 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml';

const AVATAR_TYPES = new Set(AVATAR_ACCEPT.split(','));

type TranslateFn = (key: string, opts?: Record<string, unknown>) => string;

export function validateAvatarFile(file: File, t: TranslateFn): string | null {
  if (file.size > AVATAR_MAX_SIZE) return t('settings.agentAvatarTooLarge');
  if (!file.type.startsWith('image/') || !AVATAR_TYPES.has(file.type)) return t('settings.agentAvatarInvalidType');
  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}
