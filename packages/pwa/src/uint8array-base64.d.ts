interface Uint8ArrayToBase64Options {
  alphabet?: 'base64' | 'base64url';
  omitPadding?: boolean;
}

interface Uint8ArrayFromBase64Options {
  alphabet?: 'base64' | 'base64url';
  lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial';
}

interface Uint8Array {
  toBase64(options?: Uint8ArrayToBase64Options): string;
}

interface Uint8ArrayConstructor {
  fromBase64(base64: string, options?: Uint8ArrayFromBase64Options): Uint8Array;
}
