let aesKey: string | null = null;

export function addAESKeyToStore(key: string) {
  aesKey = key;
}

export function getAESKey(): string | null {
  return aesKey;
}