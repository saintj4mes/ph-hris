import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string): Promise<string> {
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");
  const salt = randomBytes(16).toString("base64url");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(`scrypt$${salt}$${Buffer.from(key).toString("base64url")}`);
    });
  });
}

export function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, salt, expectedEncoded] = encoded.split("$");
  if (scheme !== "scrypt" || !salt || !expectedEncoded) return Promise.resolve(false);
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) return reject(error);
      const expected = Buffer.from(expectedEncoded, "base64url");
      const actual = Buffer.from(key);
      resolve(expected.length === actual.length && timingSafeEqual(expected, actual));
    });
  });
}
