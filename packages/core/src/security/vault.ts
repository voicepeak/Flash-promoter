/* ===== Local Credential Vault =====
 * Encrypted storage for platform credentials.
 * MVP uses local file-based encryption via Node.js crypto.
 * In production, should use OS-native vaults (Keychain, Credential Manager, Secret Service).
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync, timingSafeEqual } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type { PlatformAccount, PlatformId } from "../models.js";
import { createId, now } from "../models.js";

const ALGORITHM = "aes-256-gcm";
const KEY_ITERATIONS = 100000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

interface VaultData {
  salt: string;
  verificationHash: string;
  accounts: Array<{ id: string; account: PlatformAccount }>;
}

export class CredentialVault {
  private readonly filePath: string;
  private masterKey: Buffer | null = null;
  private salt: Buffer | null = null;
  private accounts: Map<string, PlatformAccount> = new Map();

  constructor(dataDir: string) {
    this.filePath = join(dataDir, "vault.json");
  }

  /** Initialize a new vault with the given password (destroys existing data). */
  initialize(password: string): void {
    this.salt = randomBytes(SALT_LENGTH);
    this.masterKey = scryptSync(password, this.salt, KEY_LENGTH, { N: KEY_ITERATIONS, r: 8, p: 1 });
    this.accounts.clear();
    this.save();
  }

  unlock(password: string): void {
    const raw = this.loadRaw();
    if (!raw || !raw.salt) {
      throw new Error("Vault 未初始化，请先调用 initialize() 创建。");
    }

    this.salt = Buffer.from(raw.salt, "hex");
    this.masterKey = scryptSync(password, this.salt, KEY_LENGTH, { N: KEY_ITERATIONS, r: 8, p: 1 });

    // Verify password against stored hash
    if (raw.verificationHash) {
      const testIv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv(ALGORITHM, this.masterKey, testIv);
      const testEncrypted = cipher.update("FLASH_PROMOTER_VAULT_VERIFY", "utf8", "hex") + cipher.final("hex");
      const testTag = cipher.getAuthTag().toString("hex");
      const testPayload = `${testIv.toString("hex")}:${testTag}:${testEncrypted}`;

      if (testPayload.length !== raw.verificationHash.length) {
        this.masterKey = null;
        throw new Error("密码错误：无法解锁 Vault。");
      }
    }

    this.accounts = new Map();
    for (const entry of raw.accounts ?? []) {
      this.accounts.set(entry.id, entry.account);
    }
  }

  lock(): void {
    this.masterKey = null;
    this.salt = null;
    this.accounts.clear();
  }

  isUnlocked(): boolean {
    return this.masterKey !== null;
  }

  changePassword(oldPassword: string, newPassword: string): void {
    // Unlock with old password to verify
    this.unlock(oldPassword);
    // Save accounts, re-init with new password
    const savedAccounts = Array.from(this.accounts.values());
    this.initialize(newPassword);
    for (const account of savedAccounts) {
      this.accounts.set(account.id, account);
    }
    this.save();
  }

  addAccount(account: Omit<PlatformAccount, "encryptedCredentials" | "id" | "createdAt" | "updatedAt">, credentials: Record<string, string>): PlatformAccount {
    this.ensureUnlocked();
    const timestamp = now();
    const newAccount: PlatformAccount = {
      id: createId("acct"),
      platform: account.platform,
      displayName: account.displayName,
      authType: account.authType,
      scopes: account.scopes,
      status: "active",
      encryptedCredentials: this.encrypt(JSON.stringify(credentials)),
      expiresAt: account.expiresAt,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.accounts.set(newAccount.id, newAccount);
    this.save();
    return newAccount;
  }

  getAccount(accountId: string): PlatformAccount | null {
    this.ensureUnlocked();
    return this.accounts.get(accountId) ?? null;
  }

  getAccountForPlatform(platform: PlatformId): PlatformAccount | null {
    this.ensureUnlocked();
    for (const account of this.accounts.values()) {
      if (account.platform === platform) return account;
    }
    return null;
  }

  listAccounts(): PlatformAccount[] {
    this.ensureUnlocked();
    return Array.from(this.accounts.values()).map((acct) => ({
      ...acct,
      encryptedCredentials: "***"
    }));
  }

  decryptCredentials(account: PlatformAccount): Record<string, string> {
    this.ensureUnlocked();
    if (!account.encryptedCredentials || account.encryptedCredentials === "***") {
      throw new Error("无法解密凭证");
    }
    const decrypted = this.decrypt(account.encryptedCredentials);
    return JSON.parse(decrypted) as Record<string, string>;
  }

  updateAccountStatus(accountId: string, status: PlatformAccount["status"]): PlatformAccount | null {
    const account = this.accounts.get(accountId);
    if (!account) return null;
    account.status = status;
    account.updatedAt = now();
    this.save();
    return account;
  }

  updateAccount(accountId: string, updates: { displayName?: string; scopes?: string[]; status?: PlatformAccount["status"] }): PlatformAccount | null {
    const account = this.accounts.get(accountId);
    if (!account) return null;
    if (updates.displayName !== undefined) account.displayName = updates.displayName;
    if (updates.scopes !== undefined) account.scopes = updates.scopes;
    if (updates.status !== undefined) account.status = updates.status;
    account.updatedAt = now();
    this.save();
    return account;
  }

  removeAccount(accountId: string): boolean {
    const deleted = this.accounts.delete(accountId);
    if (deleted) this.save();
    return deleted;
  }

  private encrypt(plaintext: string): string {
    if (!this.masterKey) throw new Error("Vault 未解锁");
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.masterKey, iv);
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${tag}:${encrypted}`;
  }

  private decrypt(ciphertext: string): string {
    if (!this.masterKey) throw new Error("Vault 未解锁");
    const [ivHex, tagHex, encrypted] = ciphertext.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, this.masterKey, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  private ensureUnlocked(): void {
    if (!this.masterKey) throw new Error("CredentialVault 未解锁，请先调用 unlock()。如果是首次使用，请调用 initialize()。");
  }

  private save(): void {
    if (!this.salt) return;
    const data: VaultData = {
      salt: this.salt.toString("hex"),
      verificationHash: this.computeVerificationHash(),
      accounts: Array.from(this.accounts.entries()).map(([id, account]) => ({
        id,
        account
      }))
    };
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  private loadRaw(): VaultData | null {
    if (!existsSync(this.filePath)) return null;
    return JSON.parse(readFileSync(this.filePath, "utf-8")) as VaultData;
  }

  private computeVerificationHash(): string {
    if (!this.masterKey) return "";
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.masterKey, iv);
    const testEncrypted = cipher.update("FLASH_PROMOTER_VAULT_VERIFY", "utf8", "hex") + cipher.final("hex");
    const testTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${testTag}:${testEncrypted}`;
  }
}

export function maskCredential(value: string): string {
  if (!value || value.length < 8) return value;
  return value.slice(0, 4) + "****" + value.slice(-4);
}

export function sanitizeForLog(account: PlatformAccount): PlatformAccount {
  return {
    ...account,
    encryptedCredentials: "***"
  };
}
