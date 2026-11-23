import { EventAddOn } from '../types.ts';

const STORAGE_KEY = 'vernunt_event_custom_addons_v1';
const ADMIN_EMAILS = ['arjunmpgupta@gmail.com', 'ardha@vernunt.com'];

export function isAdminProfile(userProfile: any): boolean {
  if (!userProfile) return false;
  if (userProfile.userRole === 'Admin') return true;
  const email = String(userProfile.email || '').trim().toLowerCase();
  return ADMIN_EMAILS.includes(email);
}

function readLocalMap(): Record<string, EventAddOn[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalMap(map: Record<string, EventAddOn[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota issues
  }
}

function broadcastAddOnsUpdate(eventId: string, addons: EventAddOn[]) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('vernunt_event_addons_updated', {
      detail: { eventId, addons }
    })
  );
}

export function getCachedCustomAddOns(eventId: string): EventAddOn[] {
  const map = readLocalMap();
  return Array.isArray(map[eventId]) ? map[eventId] : [];
}

export async function fetchCustomEventAddOns(eventId: string): Promise<EventAddOn[]> {
  try {
    const resp = await fetch(`/api/events/${encodeURIComponent(eventId)}/addons`);
    if (resp.ok) {
      const data = await resp.json();
      if (data?.success && Array.isArray(data.addons)) {
        const map = readLocalMap();
        map[eventId] = data.addons;
        writeLocalMap(map);
        return data.addons;
      }
    }
  } catch (err) {
    console.debug('[eventAddOnsStorage] Offline fallback to cached add-ons:', err);
  }
  return getCachedCustomAddOns(eventId);
}

export async function saveCustomEventAddOn(
  eventId: string,
  addonInput: Omit<EventAddOn, 'id' | 'isAdminCustom' | 'createdAt'> & { id?: string },
  userProfile: any
): Promise<{ success: boolean; addons: EventAddOn[]; error?: string }> {
  const requesterRole = userProfile?.userRole || '';
  const requesterEmail = userProfile?.email || '';

  if (!isAdminProfile(userProfile)) {
    return {
      success: false,
      addons: getCachedCustomAddOns(eventId),
      error: 'Only Admins can create or edit custom add-ons.'
    };
  }

  try {
    const resp = await fetch(`/api/events/${encodeURIComponent(eventId)}/addons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-requester-role': String(requesterRole),
        'x-requester-email': String(requesterEmail)
      },
      body: JSON.stringify({
        ...addonInput,
        requesterRole,
        requesterEmail
      })
    });
    const data = await resp.json();
    if (!resp.ok || !data?.success) {
      return {
        success: false,
        addons: getCachedCustomAddOns(eventId),
        error: data?.error || 'Failed to save custom add-on'
      };
    }

    const updatedList: EventAddOn[] = Array.isArray(data.addons) ? data.addons : [];
    const map = readLocalMap();
    map[eventId] = updatedList;
    writeLocalMap(map);
    broadcastAddOnsUpdate(eventId, updatedList);
    return { success: true, addons: updatedList };
  } catch (err: any) {
    // Offline local fallback for admin preview
    const map = readLocalMap();
    const existing = Array.isArray(map[eventId]) ? map[eventId] : [];
    const newAddon: EventAddOn = {
      id: addonInput.id || `custom-addon-${Date.now()}`,
      name: addonInput.name,
      description: addonInput.description,
      price: Math.round(Number(addonInput.price) || 0),
      chargeType: addonInput.chargeType,
      unitLabel: addonInput.unitLabel,
      badge: addonInput.badge || 'Custom Add-On',
      recommendedNote: addonInput.recommendedNote,
      isAdminCustom: true,
      createdBy: requesterEmail || 'Admin',
      createdAt: new Date().toISOString()
    };
    const updatedList = addonInput.id && existing.some(a => a.id === addonInput.id)
      ? existing.map(a => (a.id === addonInput.id ? newAddon : a))
      : [...existing, newAddon];
    map[eventId] = updatedList;
    writeLocalMap(map);
    broadcastAddOnsUpdate(eventId, updatedList);
    return { success: true, addons: updatedList };
  }
}

export async function deleteCustomEventAddOn(
  eventId: string,
  addonId: string,
  userProfile: any
): Promise<{ success: boolean; addons: EventAddOn[]; error?: string }> {
  const requesterRole = userProfile?.userRole || '';
  const requesterEmail = userProfile?.email || '';

  if (!isAdminProfile(userProfile)) {
    return {
      success: false,
      addons: getCachedCustomAddOns(eventId),
      error: 'Only Admins can delete custom add-ons.'
    };
  }

  try {
    const resp = await fetch(
      `/api/events/${encodeURIComponent(eventId)}/addons/${encodeURIComponent(addonId)}?requesterRole=${encodeURIComponent(requesterRole)}&requesterEmail=${encodeURIComponent(requesterEmail)}`,
      {
        method: 'DELETE',
        headers: {
          'x-requester-role': String(requesterRole),
          'x-requester-email': String(requesterEmail)
        }
      }
    );
    const data = await resp.json();
    if (!resp.ok || !data?.success) {
      return {
        success: false,
        addons: getCachedCustomAddOns(eventId),
        error: data?.error || 'Failed to delete custom add-on'
      };
    }

    const updatedList: EventAddOn[] = Array.isArray(data.addons) ? data.addons : [];
    const map = readLocalMap();
    map[eventId] = updatedList;
    writeLocalMap(map);
    broadcastAddOnsUpdate(eventId, updatedList);
    return { success: true, addons: updatedList };
  } catch {
    const map = readLocalMap();
    const updatedList = (map[eventId] || []).filter(a => a.id !== addonId);
    map[eventId] = updatedList;
    writeLocalMap(map);
    broadcastAddOnsUpdate(eventId, updatedList);
    return { success: true, addons: updatedList };
  }
}

export function mergeEventAddOns(baseAddOns?: EventAddOn[], customAddOns?: EventAddOn[]): EventAddOn[] {
  const base = Array.isArray(baseAddOns) ? baseAddOns : [];
  const custom = Array.isArray(customAddOns) ? customAddOns : [];
  const seen = new Set(base.map(a => a.id));
  return [...base, ...custom.filter(a => !seen.has(a.id))];
}
