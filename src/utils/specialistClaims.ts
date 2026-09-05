import { SpecialistClaimRequest, SpecialistProfile } from '../types.ts';
import { db } from './firebase.ts';
import { collection, doc, setDoc, getDocs, updateDoc, getDoc } from 'firebase/firestore';

const STORAGE_KEY = 'vernunt_specialist_claims_v1';
const CLAIMED_SPECIALISTS_STORAGE_KEY = 'vernunt_claimed_specialists_map_v1';

/**
 * Gets all local cached claims
 */
export function getLocalClaims(): SpecialistClaimRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error reading local claims:', err);
    return [];
  }
}

/**
 * Saves local cached claims
 */
export function saveLocalClaims(claims: SpecialistClaimRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
  } catch (err) {
    console.warn('Error saving local claims:', err);
  }
}

/**
 * Gets map of claimed specialists: specialistId -> { claimed: true, claimedByEmail, claimedByPhone, claimedAt, claimStatus }
 */
export function getClaimedSpecialistsMap(): Record<string, Partial<SpecialistProfile>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CLAIMED_SPECIALISTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Error reading claimed specialists map:', err);
    return {};
  }
}

/**
 * Saves map of claimed specialists
 */
export function saveClaimedSpecialistsMap(map: Record<string, Partial<SpecialistProfile>>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLAIMED_SPECIALISTS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Error saving claimed specialists map:', err);
  }
}

/**
 * Submits a new specialist portfolio claim
 */
export async function submitSpecialistClaim(claim: SpecialistClaimRequest): Promise<boolean> {
  // 1. Save locally
  const currentClaims = getLocalClaims();
  const existingIdx = currentClaims.findIndex(c => c.id === claim.id || (c.specialistId === claim.specialistId && c.status === 'pending'));
  if (existingIdx >= 0) {
    currentClaims[existingIdx] = claim;
  } else {
    currentClaims.unshift(claim);
  }
  saveLocalClaims(currentClaims);

  // 2. Update claimed status map as 'pending'
  const claimedMap = getClaimedSpecialistsMap();
  claimedMap[claim.specialistId] = {
    claimStatus: 'pending',
    claimedByEmail: claim.applicantEmail,
    claimedByPhone: claim.applicantPhone,
    claimRegistrationNumber: claim.registrationNumber,
    claimIdDocUrl: claim.idCardDocUrl,
  };
  saveClaimedSpecialistsMap(claimedMap);

  // 3. Persist to Firestore if available
  try {
    if (db) {
      await setDoc(doc(db, 'specialist_claims', claim.id), claim);
      // Also update specialist document if exists
      const specRef = doc(db, 'specialists', claim.specialistId);
      const specSnap = await getDoc(specRef);
      if (specSnap.exists()) {
        await updateDoc(specRef, {
          claimStatus: 'pending',
          claimedByEmail: claim.applicantEmail,
          claimedByPhone: claim.applicantPhone,
          claimRegistrationNumber: claim.registrationNumber
        });
      }
    }
  } catch (err) {
    console.warn('Firestore claim sync fallback to local:', err);
  }

  // 4. Also notify server endpoint if online
  try {
    await fetch('/api/specialists/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim)
    }).catch(() => null);
  } catch {
    // Non-blocking
  }

  return true;
}

/**
 * Fetches all claim requests (Firestore + local)
 */
export async function fetchAllSpecialistClaims(): Promise<SpecialistClaimRequest[]> {
  const local = getLocalClaims();
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'specialist_claims'));
      const remote: SpecialistClaimRequest[] = [];
      snap.forEach(d => {
        remote.push(d.data() as SpecialistClaimRequest);
      });
      if (remote.length > 0) {
        // Merge
        const map = new Map<string, SpecialistClaimRequest>();
        remote.forEach(r => map.set(r.id, r));
        local.forEach(l => {
          if (!map.has(l.id)) map.set(l.id, l);
        });
        const merged = Array.from(map.values());
        saveLocalClaims(merged);
        return merged;
      }
    }
  } catch (err) {
    console.debug('Firestore claims fetch error, using local:', err);
  }
  return local;
}

/**
 * Approves a specialist claim, marking it claimed and linking it to their account
 */
export async function approveSpecialistClaim(
  claimId: string,
  adminEmail: string
): Promise<{ success: boolean; claim?: SpecialistClaimRequest }> {
  const claims = getLocalClaims();
  const claim = claims.find(c => c.id === claimId);
  if (!claim) {
    return { success: false };
  }

  const now = new Date().toISOString();
  claim.status = 'approved';
  claim.reviewedAt = now;
  claim.reviewedBy = adminEmail;

  saveLocalClaims(claims);

  // Link portfolio to user account in claimed map
  const claimedMap = getClaimedSpecialistsMap();
  claimedMap[claim.specialistId] = {
    claimed: true,
    claimStatus: 'approved',
    claimedByEmail: claim.applicantEmail,
    claimedByPhone: claim.applicantPhone,
    claimedAt: now,
    claimRegistrationNumber: claim.registrationNumber,
    claimIdDocUrl: claim.idCardDocUrl
  };
  saveClaimedSpecialistsMap(claimedMap);

  // Sync to Firestore
  try {
    if (db) {
      await updateDoc(doc(db, 'specialist_claims', claimId), {
        status: 'approved',
        reviewedAt: now,
        reviewedBy: adminEmail
      });

      const specRef = doc(db, 'specialists', claim.specialistId);
      const specSnap = await getDoc(specRef);
      if (specSnap.exists()) {
        await updateDoc(specRef, {
          claimed: true,
          claimStatus: 'approved',
          claimedByEmail: claim.applicantEmail,
          claimedByPhone: claim.applicantPhone,
          claimedAt: now,
          claimRegistrationNumber: claim.registrationNumber
        });
      }
    }
  } catch (err) {
    console.warn('Firestore claim approval sync error:', err);
  }

  // Sync with server
  try {
    await fetch(`/api/specialists/claims/${claimId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, specialistId: claim.specialistId })
    }).catch(() => null);
  } catch {
    // Non-blocking
  }

  return { success: true, claim };
}

/**
 * Rejects a specialist claim with reason
 */
export async function rejectSpecialistClaim(
  claimId: string,
  adminEmail: string,
  rejectionReason: string
): Promise<{ success: boolean }> {
  const claims = getLocalClaims();
  const claim = claims.find(c => c.id === claimId);
  if (!claim) {
    return { success: false };
  }

  const now = new Date().toISOString();
  claim.status = 'rejected';
  claim.reviewedAt = now;
  claim.reviewedBy = adminEmail;
  claim.rejectionReason = rejectionReason;

  saveLocalClaims(claims);

  const claimedMap = getClaimedSpecialistsMap();
  if (claimedMap[claim.specialistId]) {
    claimedMap[claim.specialistId].claimStatus = 'rejected';
    claimedMap[claim.specialistId].claimed = false;
    saveClaimedSpecialistsMap(claimedMap);
  }

  try {
    if (db) {
      await updateDoc(doc(db, 'specialist_claims', claimId), {
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: adminEmail,
        rejectionReason
      });
    }
  } catch (err) {
    console.warn('Firestore claim rejection sync error:', err);
  }

  return { success: true };
}
