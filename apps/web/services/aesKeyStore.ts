let aesKey: string | null = null;

export function setAESKey(key: string) {
  aesKey = key;
}

export function getAESKey(): string | null {
  return aesKey;
}