import { Express, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export interface StoredEventAddOn {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  price: number;
  chargeType: 'per_student' | 'flat' | 'per_unit';
  unitLabel?: string;
  badge?: string;
  recommendedNote?: string;
  isAdminCustom: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

const AUTHORIZED_ADMIN_EMAILS = ['arjunmpgupta@gmail.com', 'ardha@vernunt.com'];
const ADDONS_DATA_FILE = path.join(process.cwd(), 'data', 'event_custom_addons.json');

function ensureDataDir() {
  const dir = path.dirname(ADDONS_DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadAllCustomAddOns(): Record<string, StoredEventAddOn[]> {
  try {
    ensureDataDir();
    if (!fs.existsSync(ADDONS_DATA_FILE)) return {};
    const raw = fs.readFileSync(ADDONS_DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch (err) {
    console.warn('[EventAddOns] Load note:', err);
    return {};
  }
}

function saveAllCustomAddOns(map: Record<string, StoredEventAddOn[]>) {
  try {
    ensureDataDir();
    fs.writeFileSync(ADDONS_DATA_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('[EventAddOns] Save error:', err);
    throw err;
  }
}

function isAuthorizedAdmin(req: Request): boolean {
  const role = String(
    req.body?.requesterRole ||
    req.headers['x-requester-role'] ||
    req.query?.requesterRole ||
    ''
  ).trim();
  const email = String(
    req.body?.requesterEmail ||
    req.headers['x-requester-email'] ||
    req.query?.requesterEmail ||
    ''
  ).trim().toLowerCase();

  return role === 'Admin' || AUTHORIZED_ADMIN_EMAILS.includes(email);
}

export function registerEventAddOnRoutes(app: Express) {
  // Public GET: Anyone viewing or booking an event can fetch its Admin custom add-ons
  app.get('/api/events/:eventId/addons', (req: Request, res: Response) => {
    try {
      const eventId = String(req.params.eventId || '').trim();
      if (!eventId) {
        return res.status(400).json({ success: false, error: 'Missing eventId' });
      }
      const all = loadAllCustomAddOns();
      const addons = Array.isArray(all[eventId]) ? all[eventId] : [];
      return res.json({ success: true, eventId, addons });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to load event add-ons' });
    }
  });

  // Admin-only POST: Create or update a custom add-on with charges for an event
  app.post('/api/events/:eventId/addons', (req: Request, res: Response) => {
    try {
      if (!isAuthorizedAdmin(req)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only Admins can create or modify custom event add-ons.'
        });
      }

      const eventId = String(req.params.eventId || '').trim();
      if (!eventId) {
        return res.status(400).json({ success: false, error: 'Missing eventId' });
      }

      const body = req.body || {};
      const name = String(body.name || '').trim();
      const description = String(body.description || '').trim();
      const rawPrice = Number(body.price);
      const chargeType = ['per_student', 'flat', 'per_unit'].includes(body.chargeType)
        ? (body.chargeType as 'per_student' | 'flat' | 'per_unit')
        : 'per_student';
      const unitLabel = String(body.unitLabel || '').trim() || (chargeType === 'per_unit' ? 'unit' : undefined);
      const badge = String(body.badge || '').trim() || 'Custom Add-On';
      const recommendedNote = String(body.recommendedNote || '').trim() || undefined;
      const createdBy = String(body.requesterEmail || req.headers['x-requester-email'] || 'Admin').trim();

      if (!name) {
        return res.status(400).json({ success: false, error: 'Add-on name is required.' });
      }
      if (!Number.isFinite(rawPrice)) {
        return res.status(400).json({ success: false, error: 'Valid numeric price in INR is required.' });
      }

      const all = loadAllCustomAddOns();
      const current = Array.isArray(all[eventId]) ? all[eventId] : [];
      const existingId = String(body.id || '').trim();
      const nowIso = new Date().toISOString();

      let savedAddon: StoredEventAddOn;
      if (existingId && current.some(a => a.id === existingId)) {
        savedAddon = {
          ...current.find(a => a.id === existingId)!,
          name,
          description,
          price: Math.round(rawPrice),
          chargeType,
          unitLabel,
          badge,
          recommendedNote,
          updatedAt: nowIso
        };
        all[eventId] = current.map(a => (a.id === existingId ? savedAddon : a));
      } else {
        savedAddon = {
          id: existingId || `custom-addon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          eventId,
          name,
          description,
          price: Math.round(rawPrice),
          chargeType,
          unitLabel,
          badge,
          recommendedNote,
          isAdminCustom: true,
          createdBy,
          createdAt: nowIso
        };
        all[eventId] = [...current, savedAddon];
      }

      saveAllCustomAddOns(all);
      return res.json({ success: true, addon: savedAddon, addons: all[eventId] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to save custom add-on' });
    }
  });

  // Admin-only DELETE: Remove a custom add-on from an event
  app.delete('/api/events/:eventId/addons/:addonId', (req: Request, res: Response) => {
    try {
      if (!isAuthorizedAdmin(req)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only Admins can delete custom event add-ons.'
        });
      }

      const eventId = String(req.params.eventId || '').trim();
      const addonId = String(req.params.addonId || '').trim();
      if (!eventId || !addonId) {
        return res.status(400).json({ success: false, error: 'Missing eventId or addonId' });
      }

      const all = loadAllCustomAddOns();
      const current = Array.isArray(all[eventId]) ? all[eventId] : [];
      const filtered = current.filter(a => a.id !== addonId);
      all[eventId] = filtered;
      saveAllCustomAddOns(all);

      return res.json({ success: true, deletedId: addonId, addons: filtered });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to delete custom add-on' });
    }
  });
}
