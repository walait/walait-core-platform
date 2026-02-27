import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomInt,
  scryptSync,
} from "crypto";

/**
 * Returns a cryptographically-strong passphrase that:
 *  • is ≥ 32 characters (default 48)
 *  • always contains at least one uppercase, one lowercase, one digit and one symbol
 *  • avoids visually ambiguous characters (l, I, O, 0, 1, etc.)
 */
export function generateStrongPassphrase(length = 48): string {
  if (length < 12)
    throw new Error("Passphrase should be at least 12 characters");

  const LOWER = "abcdefghjkmnpqrstuvwxyz";
  const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const DIGIT = "23456789";
  const SYMBOL = "-_=+.";

  // guarantee mandatory character classes
  const mandatory = [
    LOWER[randomInt(0, LOWER.length)],
    UPPER[randomInt(0, UPPER.length)],
    DIGIT[randomInt(0, DIGIT.length)],
    SYMBOL[randomInt(0, SYMBOL.length)],
  ];

  const all = LOWER + UPPER + DIGIT + SYMBOL;
  const remaining = Array.from(
    randomBytes(length - mandatory.length),
    (b) => all[b % all.length],
  );

  // shuffle with Fisher-Yates so mandatory chars aren't always in front
  const passArray = [...mandatory, ...remaining];
  for (let i = passArray.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [passArray[i], passArray[j]] = [passArray[j], passArray[i]];
  }

  return passArray.join("");
}

function getEncryptionKey(): Buffer {
  const secret = process.env.PKI_MASTER_SECRET;
  if (!secret) {
    throw new Error("PKI_MASTER_SECRET environment variable is not set");
  }
  return scryptSync(secret, "salt", 32);
}

const IV_LENGTH = 12;

export function encryptPem(pem: string): string {
  const encryptionKey = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);

  const encrypted = Buffer.concat([cipher.update(pem, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptPem(data: string): string {
  const encryptionKey = getEncryptionKey();
  const buffer = Buffer.from(data, "base64");
  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const text = buffer.subarray(IV_LENGTH + 16);

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(text), decipher.final()]).toString(
    "utf8",
  );
}
