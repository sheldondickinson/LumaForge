import { hash, verify, type Options } from "@node-rs/argon2";

const passwordHashOptions = {
  algorithm: 2,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32,
} satisfies Options;

export const dummyPasswordHash =
  "$argon2id$v=19$m=65536,t=3,p=1$GEChjY904E1/tgqiE3OxKA$DnTf+YWaj9aDra+k3uSGGc2zNDsWh8l1SATudo1KNZs";

export function hashPassword(password: string) {
  return hash(password, passwordHashOptions);
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}
