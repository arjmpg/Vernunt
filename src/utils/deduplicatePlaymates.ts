import { ChildProfile } from '../types.ts';

function normalizeEmail(email?: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone10(phone?: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

function normalizeText(val?: string): string {
  return String(val || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function scoreProfileRichness(p: ChildProfile): number {
  let score = 0;
  if (p.aadhaarVerified || p.digilockerVerified) score += 4;
  if (p.verificationStatus === 'VERIFIED') score += 3;
  if (p.photoUrl && !p.photoUrl.includes('placeholder')) score += 3;
  if (Array.isArray(p.interests) && p.interests.length > 0) score += 2;
  if (p.bio && p.bio.trim().length > 10) score += 2;
  if (p.childName && p.childName.trim() && p.childName.trim().toUpperCase() !== 'N/A') score += 2;
  if (Number(p.childAge) > 0) score += 1;
  return score;
}

/**
 * Deduplicates playmate profiles across id, email, 10-digit phone number,
 * and normalized (parentName + childName + childAge) identity so no profile
 * ever renders more than once in Discover Playmates or Playtime feeds.
 */
export function deduplicatePlaymates(
  profiles: ChildProfile[],
  options?: { excludeInvalidChildren?: boolean }
): ChildProfile[] {
  const excludeInvalidChildren = options?.excludeInvalidChildren ?? false;

  const uniqueList: ChildProfile[] = [];
  const keyToIndex = new Map<string, number>();

  for (const raw of profiles) {
    if (!raw || !raw.id) continue;

    // Skip synthetic ping/test records
    if (raw.id.startsWith('test_ping_')) continue;

    const cleanChild = normalizeText(raw.childName);
    const isInvalidChild = !cleanChild || cleanChild === 'n/a' || cleanChild === 'none';
    if (excludeInvalidChildren && isInvalidChild) continue;

    const idKey = `id:${raw.id}`;
    const email = normalizeEmail((raw as any).email);
    const emailKey = email && email.includes('@') ? `email:${email}` : '';
    const phone10 = normalizePhone10((raw as any).phone || raw.phoneNumber);
    const phoneKey = phone10 ? `phone:${phone10}` : '';

    const cleanParent = normalizeText(raw.parentName);
    const ageNum = Number(raw.childAge) || 0;
    const identityKey =
      cleanChild && !isInvalidChild && cleanParent
        ? `identity:${cleanParent}|${cleanChild}|${ageNum}`
        : '';

    const keys = [idKey, emailKey, phoneKey, identityKey].filter(Boolean);

    let existingIndex = -1;
    for (const k of keys) {
      const idx = keyToIndex.get(k);
      if (idx !== undefined) {
        existingIndex = idx;
        break;
      }
    }

    if (existingIndex >= 0) {
      const existing = uniqueList[existingIndex];
      const existingScore = scoreProfileRichness(existing);
      const incomingScore = scoreProfileRichness(raw);

      // Keep the richer profile while filling any missing fields from the other
      const merged: ChildProfile =
        incomingScore > existingScore
          ? {
              ...existing,
              ...raw,
              interests: (raw.interests && raw.interests.length > 0) ? raw.interests : existing.interests,
              photoUrl: raw.photoUrl || existing.photoUrl
            }
          : {
              ...raw,
              ...existing,
              interests: (existing.interests && existing.interests.length > 0) ? existing.interests : raw.interests,
              photoUrl: existing.photoUrl || raw.photoUrl
            };

      uniqueList[existingIndex] = merged;
      for (const k of keys) {
        keyToIndex.set(k, existingIndex);
      }
    } else {
      const nextIdx = uniqueList.length;
      uniqueList.push(raw);
      for (const k of keys) {
        keyToIndex.set(k, nextIdx);
      }
    }
  }

  return uniqueList;
}
