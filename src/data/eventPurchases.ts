import { EventTicketPurchase } from '../types.ts';

const PURCHASES_STORAGE_KEY = 'vernunt_event_ticket_purchases_v1';

export const INITIAL_EVENT_PURCHASES: EventTicketPurchase[] = [
  {
    id: 'tkt-demo-1',
    eventId: 'blr-event-1',
    eventTitle: 'Cubbon Park Weekend Family Art & Nature Sketching',
    eventType: 'event',
    eventDate: '2026-06-20',
    eventTime: '09:00 AM',
    eventLocation: 'Cubbon Park Bamboo Grove Lawn, Bangalore',
    ticketTierName: 'Free Family General Pass',
    ticketQuantity: 2,
    ticketPrice: 0,
    totalPaid: 0,
    purchasedAt: '2026-06-12T11:00:00.000Z',
    buyerName: 'Vikram Mehta',
    buyerPhone: '9845012345',
    buyerRole: 'eventbuyers',
    status: 'confirmed',
    qrPassCode: 'PASS-CP-882190',
    bookingReference: 'VERN-EVT-7721'
  }
];

export function getStoredEventPurchases(): EventTicketPurchase[] {
  if (typeof window === 'undefined') return INITIAL_EVENT_PURCHASES;
  try {
    const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(INITIAL_EVENT_PURCHASES));
      return INITIAL_EVENT_PURCHASES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_EVENT_PURCHASES;
  } catch (err) {
    console.error('Failed to load event purchases:', err);
    return INITIAL_EVENT_PURCHASES;
  }
}

export function saveEventPurchase(purchase: Omit<EventTicketPurchase, 'id' | 'purchasedAt' | 'qrPassCode' | 'bookingReference'>): EventTicketPurchase {
  const all = getStoredEventPurchases();
  const id = `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const qrPassCode = `PASS-${purchase.eventId.slice(-4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const bookingReference = `VERN-${Math.floor(10000 + Math.random() * 90000)}`;
  
  const record: EventTicketPurchase = {
    ...purchase,
    id,
    purchasedAt: new Date().toISOString(),
    qrPassCode,
    bookingReference,
    status: 'confirmed'
  };
  
  const updated = [record, ...all];
  if (typeof window !== 'undefined') {
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(updated));
  }
  return record;
}

export function getUserEventPurchases(phone?: string, email?: string): EventTicketPurchase[] {
  const all = getStoredEventPurchases();
  if (!phone && !email) return all;
  
  const cleanPhone = phone?.replace(/\D/g, '').slice(-10);
  return all.filter(p => {
    const pPhone = p.buyerPhone.replace(/\D/g, '').slice(-10);
    const phoneMatch = cleanPhone && pPhone === cleanPhone;
    const emailMatch = email && p.buyerEmail?.toLowerCase() === email.toLowerCase();
    return phoneMatch || emailMatch;
  });
}
