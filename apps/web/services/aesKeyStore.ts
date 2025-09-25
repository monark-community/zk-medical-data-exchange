// TODO: These are temporary implementations. Replace with secure storage in production.
// let aesKey: string | null = null;

export function addAESKeyToStore(key: string) {
  localStorage.setItem("aesKey", key);
}

export function getAESKey(): string | null {
  return localStorage.getItem("aesKey");
}
