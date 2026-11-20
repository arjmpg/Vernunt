import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Download, Upload, QrCode, Mail, CheckCircle2, AlertCircle,
  Search, FileSpreadsheet, Sparkles, ShieldCheck, RefreshCw, X,
  UserPlus, Trash2, Check, Phone, Calendar, MapPin, Eye, Send
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase.ts';
import { CommunityEvent, ChildProfile } from '../../types.ts';
import { saveEventPurchase } from '../../data/eventPurchases.ts';

export interface EventWiseAttendeeRow {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
  userId?: string;
  name: string;
  childName?: string;
  email: string;
  mobile: string;
  ticketNumber: string;
  bookingReference: string;
  ticketTierName: string;
  quantity: number;
  amountPaid: number;
  paymentStatus: 'PAID' | 'COMPLIMENTARY' | 'IMPORTED';
  checkedIn: boolean;
  checkedInAt?: string;
  source: 'booking' | 'host_import' | 'admin_bulk_upload';
  emailSent?: boolean;
  emailSentAt?: string;
  qrDataUrl?: string;
  createdAt: string;
}

interface ParsedCsvUserRow {
  id: string;
  name: string;
  email: string;
  mobile: string;
  childName?: string;
  ticketTierName?: string;
  quantity: number;
  isValid: boolean;
  validationNote?: string;
}

interface BulkUploadResultItem {
  name: string;
  email: string;
  mobile: string;
  userId: string;
  accountAction: 'created' | 'linked';
  ticketNumber: string;
  bookingReference: string;
  qrDataUrl: string;
  emailSent: boolean;
  emailStatus: string;
  error?: string;
}

interface EventWiseUsersManagerProps {
  eventsList: CommunityEvent[];
  userProfile?: ChildProfile | null;
  isAdmin: boolean;
  initialEventId?: string;
  initialTab?: 'list' | 'import' | 'admin-upload';
  onClose?: () => void;
  isModal?: boolean;
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseUsersCsvText(rawText: string): ParsedCsvUserRow[] {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Auto-detect delimiter (tab, semicolon, or comma)
  const firstLine = lines[0];
  const delimiter =
    firstLine.includes('\t')
      ? '\t'
      : firstLine.split(';').length > firstLine.split(',').length
      ? ';'
      : ',';

  const firstCells = parseCsvLine(firstLine, delimiter).map((c) => c.toLowerCase());
  const looksLikeHeader = firstCells.some((c) =>
    /^(name|full\s*name|parent\s*name|attendee|user|email|email\s*id|mail|mobile|phone|contact|mobile\s*number)$/i.test(c)
  );

  let nameIdx = 0;
  let emailIdx = 1;
  let mobileIdx = 2;
  let childIdx = -1;
  let tierIdx = -1;
  let qtyIdx = -1;

  if (looksLikeHeader) {
    firstCells.forEach((cell, idx) => {
      if (/(child|kid)/.test(cell)) childIdx = idx;
      else if (/(name|attendee|user|parent)/.test(cell) && nameIdx === 0 && !cell.includes('email')) nameIdx = idx;
      else if (/(email|mail)/.test(cell)) emailIdx = idx;
      else if (/(mobile|phone|contact|whatsapp|tel)/.test(cell)) mobileIdx = idx;
      else if (/(tier|pass|ticket|category)/.test(cell)) tierIdx = idx;
      else if (/(qty|quantity|count|seats)/.test(cell)) qtyIdx = idx;
    });
  }

  const dataLines = looksLikeHeader ? lines.slice(1) : lines;
  const parsed: ParsedCsvUserRow[] = [];

  dataLines.forEach((line, idx) => {
    const cells = parseCsvLine(line, delimiter);
    const name = String(cells[nameIdx] || '').trim();
    const email = String(cells[emailIdx] || '').trim().toLowerCase();
    const mobileRaw = String(cells[mobileIdx] || '').trim();
    const childName = childIdx >= 0 ? String(cells[childIdx] || '').trim() : '';
    const ticketTierName = tierIdx >= 0 ? String(cells[tierIdx] || '').trim() : '';
    const qtyRaw = qtyIdx >= 0 ? Number(cells[qtyIdx]) : 1;
    const quantity = Number.isFinite(qtyRaw) && qtyRaw > 0 ? Math.min(20, Math.round(qtyRaw)) : 1;

    const emailValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const mobileDigits = mobileRaw.replace(/\D/g, '');
    const hasContact = Boolean(email || mobileDigits.length >= 10);

    let validationNote = '';
    if (!name) validationNote = 'Missing name';
    else if (!hasContact) validationNote = 'Provide valid Email ID or 10-digit Mobile';
    else if (email && !emailValid) validationNote = 'Invalid email format';

    parsed.push({
      id: `row_${idx}_${Date.now()}`,
      name,
      email,
      mobile: mobileRaw,
      childName: childName || undefined,
      ticketTierName: ticketTierName || undefined,
      quantity,
      isValid: Boolean(name && hasContact && emailValid),
      validationNote: validationNote || undefined
    });
  });

  return parsed;
}

function csvEscapeCell(val: unknown): string {
  const s = String(val ?? '');
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function isEventHostedByUser(evt: CommunityEvent, userProfile?: ChildProfile | null): boolean {
  if (!userProfile) return false;
  const userId = String(userProfile.id || '').trim();
  const userEmail = String((userProfile as any).email || '').trim().toLowerCase();
  const userName = String(userProfile.parentName || '').trim().toLowerCase();

  const evtHostId = String((evt as any).hostId || '').trim();
  const evtOrgEmail = String((evt as any).organizerEmail || '').trim().toLowerCase();
  const evtHostName = String(evt.hostName || '').trim().toLowerCase();

  if (userId && evtHostId && userId === evtHostId) return true;
  if (userEmail && evtOrgEmail && userEmail === evtOrgEmail) return true;
  if (userName && evtHostName && userName === evtHostName) return true;
  return false;
}

export default function EventWiseUsersManager({
  eventsList,
  userProfile,
  isAdmin,
  initialEventId,
  initialTab = 'list',
  onClose,
  isModal = false
}: EventWiseUsersManagerProps) {
  // Admins can manage any event; Event Hosts can ONLY manage events they themselves organized/hosted
  const accessibleEvents = useMemo(() => {
    if (isAdmin) return eventsList;
    return eventsList.filter((evt) => isEventHostedByUser(evt, userProfile));
  }, [eventsList, isAdmin, userProfile]);

  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    if (initialEventId && accessibleEvents.some((e) => e.id === initialEventId)) {
      return initialEventId;
    }
    return accessibleEvents[0]?.id || '';
  });
  const [activeTab, setActiveTab] = useState<'list' | 'import' | 'admin-upload'>(
    initialTab === 'admin-upload' && !isAdmin ? 'import' : initialTab
  );

  // Sync if parent updates initialEventId or accessibleEvents changes
  useEffect(() => {
    if (initialEventId && accessibleEvents.some((e) => e.id === initialEventId)) {
      setSelectedEventId(initialEventId);
    } else if (!accessibleEvents.some((e) => e.id === selectedEventId)) {
      setSelectedEventId(accessibleEvents[0]?.id || '');
    }
  }, [initialEventId, accessibleEvents, selectedEventId]);

  const selectedEvent = useMemo(
    () => accessibleEvents.find((e) => e.id === selectedEventId) || accessibleEvents[0] || null,
    [accessibleEvents, selectedEventId]
  );

  // Attendees list state
  const [attendees, setAttendees] = useState<EventWiseAttendeeRow[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewQrAttendee, setPreviewQrAttendee] = useState<{
    name: string;
    email: string;
    mobile: string;
    ticketNumber: string;
    qrDataUrl?: string;
    eventTitle: string;
  } | null>(null);

  // Import & Admin Bulk Upload shared CSV editor state
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedCsvUserRow[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [sendEmailsOnAdminUpload, setSendEmailsOnAdminUpload] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [bulkReport, setBulkReport] = useState<{
    summary: {
      totalProcessed: number;
      usersCreated: number;
      existingUsersLinked: number;
      bookingsGenerated: number;
      emailsSent: number;
      emailsFailed: number;
      skippedInvalid: number;
    };
    results: BulkUploadResultItem[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load merged attendees for selected single event (Server + Local Roster)
  const fetchEventAttendees = async (evtId: string) => {
    if (!evtId) {
      setAttendees([]);
      return;
    }
    setIsLoadingList(true);
    try {
      let serverRows: EventWiseAttendeeRow[] = [];
      try {
        const params = new URLSearchParams({
          requesterRole: isAdmin ? 'Admin' : String(userProfile?.userRole || 'Event Organizer'),
          requesterId: String(userProfile?.id || ''),
          requesterEmail: String((userProfile as any)?.email || ''),
          requesterName: String(userProfile?.parentName || ''),
          eventHostId: String((selectedEvent as any)?.hostId || ''),
          eventOrganizerEmail: String((selectedEvent as any)?.organizerEmail || ''),
          eventHostName: String(selectedEvent?.hostName || '')
        });
        const res = await fetch(`/api/events/${encodeURIComponent(evtId)}/attendees?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.attendees)) {
            serverRows = data.attendees;
          }
        }
      } catch {
        // Fallback to local records
      }

      // Merge localStorage gate roster (vernunt_attendees_<evtId>) & booked tickets for this event
      const localMerged: EventWiseAttendeeRow[] = [];
      try {
        const rosterRaw = localStorage.getItem(`vernunt_attendees_${evtId}`);
        if (rosterRaw) {
          const parsedRoster = JSON.parse(rosterRaw);
          if (Array.isArray(parsedRoster)) {
            parsedRoster.forEach((r: any) => {
              localMerged.push({
                id: r.id || `loc_${Math.random().toString(36).slice(2, 7)}`,
                eventId: evtId,
                eventTitle: r.eventTitle || selectedEvent?.title || 'Event',
                eventDate: r.eventDate || selectedEvent?.date,
                eventTime: r.eventTime || selectedEvent?.time,
                eventVenue: r.eventVenue || selectedEvent?.location,
                name: r.buyerName || r.name || 'Attendee',
                childName: r.childName || r.buyerName || r.name,
                email: (r.buyerEmail || r.email || '').toLowerCase(),
                mobile: r.buyerPhone || r.mobile || '',
                ticketNumber: r.ticketNumber || r.bookingReference || '',
                bookingReference: r.bookingReference || r.ticketNumber || '',
                ticketTierName: r.ticketTierName || 'General Pass',
                quantity: Number(r.quantity || 1),
                amountPaid: Number(r.amountPaid || 0),
                paymentStatus: r.amountPaid > 0 ? 'PAID' : 'COMPLIMENTARY',
                checkedIn: Boolean(r.checkedIn),
                checkedInAt: r.checkedInAt,
                source: r.source || 'booking',
                emailSent: Boolean(r.emailSent),
                qrDataUrl: r.qrDataUrl,
                createdAt: r.createdAt || new Date().toISOString()
              });
            });
          }
        }
      } catch {
        // Ignore storage read issue
      }

      // Deduplicate preferring server records (which have QR codes + emailSent status)
      const seen = new Set<string>();
      const combined: EventWiseAttendeeRow[] = [];
      for (const item of [...serverRows, ...localMerged]) {
        const key = (
          item.ticketNumber ||
          item.email ||
          item.mobile.replace(/\D/g, '').slice(-10) ||
          item.id
        ).toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          combined.push(item);
        }
      }

      setAttendees(combined);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (selectedEvent?.id) {
      fetchEventAttendees(selectedEvent.id);
      setBulkReport(null);
      setFeedbackBanner(null);
    }
  }, [selectedEvent?.id]);

  // Keep Gate Check-in local roster synchronized whenever server returns updated attendees
  const syncAttendeesToLocalGateRoster = (evt: CommunityEvent, rows: EventWiseAttendeeRow[]) => {
    try {
      const storageKey = `vernunt_attendees_${evt.id}`;
      const existingRaw = localStorage.getItem(storageKey);
      const existingList: any[] = existingRaw ? JSON.parse(existingRaw) : [];
      const existingMap = new Map<string, any>();
      existingList.forEach((a) => {
        if (a?.ticketNumber) existingMap.set(a.ticketNumber.toLowerCase(), a);
      });

      rows.forEach((r) => {
        const key = (r.ticketNumber || r.id).toLowerCase();
        if (!existingMap.has(key)) {
          existingMap.set(key, {
            id: r.id,
            ticketNumber: r.ticketNumber,
            eventId: evt.id,
            eventTitle: evt.title,
            eventDate: evt.date,
            eventTime: evt.time,
            eventVenue: evt.location,
            buyerName: r.name,
            buyerEmail: r.email,
            buyerPhone: r.mobile,
            childName: r.childName || r.name,
            ticketTierName: r.ticketTierName,
            quantity: r.quantity,
            amountPaid: r.amountPaid,
            checkedIn: r.checkedIn,
            source: r.source,
            emailSent: r.emailSent,
            qrDataUrl: r.qrDataUrl,
            createdAt: r.createdAt
          });
        }
      });

      localStorage.setItem(storageKey, JSON.stringify(Array.from(existingMap.values())));
    } catch {
      // Ignore storage quota note
    }
  };

  // Filtered attendees for search bar
  const filteredAttendees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.childName || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.mobile || '').toLowerCase().includes(q) ||
        (a.ticketNumber || '').toLowerCase().includes(q)
    );
  }, [attendees, searchQuery]);

  // Handle CSV file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      setCsvRawText(text);
      setParsedRows(parseUsersCsvText(text));
      setBulkReport(null);
      setFeedbackBanner(null);
    };
    reader.readAsText(file);
  };

  const handlePasteTextChange = (text: string) => {
    setCsvRawText(text);
    setParsedRows(parseUsersCsvText(text));
    setBulkReport(null);
  };

  const handleRemoveParsedRow = (rowId: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Download ready-to-use CSV template
  const handleDownloadSampleCsv = () => {
    const sample = [
      'Name,Email ID,Mobile Number,Child Name,Ticket Tier,Quantity',
      'Priya Sharma,priya.sharma@example.com,9845011223,Aarav Sharma,General Pass,1',
      'Rohan Kulkarni,rohan.k@example.com,9900122334,Diya Kulkarni,Family Pass,2',
      'Meera Nair,meera.nair@example.com,9741055667,Kabir Nair,General Pass,1'
    ].join('\r\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vernunt-event-users-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export selected single event's users list as CSV (Admin & Event Hosts)
  const handleExportEventCsv = () => {
    if (!selectedEvent) return;
    const headers = [
      'Event Title',
      'Name',
      'Email ID',
      'Mobile Number',
      'Child Name',
      'Ticket Tier',
      'Quantity',
      'Booking Reference',
      'QR Pass Code',
      'Check-In Status',
      'Email Sent',
      'Source',
      'Registered At'
    ];
    const rowsToExport = attendees;
    const lines = [
      headers.map(csvEscapeCell).join(','),
      ...rowsToExport.map((a) =>
        [
          selectedEvent.title,
          a.name,
          a.email,
          a.mobile,
          a.childName || a.name,
          a.ticketTierName,
          a.quantity,
          a.bookingReference,
          a.ticketNumber,
          a.checkedIn ? 'Checked In' : 'Upcoming',
          a.emailSent ? 'Yes' : 'No',
          a.source,
          a.createdAt
        ]
          .map(csvEscapeCell)
          .join(',')
      )
    ];

    const safeSlug =
      selectedEvent.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'event';

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vernunt-event-users-${safeSlug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFeedbackBanner({
      type: 'success',
      text: `Exported ${rowsToExport.length} user(s) for "${selectedEvent.title}" (Name, Email ID, Mobile Number & QR Pass ID).`
    });
  };

  // Host & Admin Standard Roster Import
  const handleRosterImport = async () => {
    if (!selectedEvent) return;
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setFeedbackBanner({
        type: 'error',
        text: 'Please upload or paste at least one valid user row with Name and Email ID / Mobile Number.'
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(selectedEvent.id)}/attendees/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterRole: isAdmin ? 'Admin' : String(userProfile?.userRole || 'Event Organizer'),
          requesterId: String(userProfile?.id || ''),
          requesterEmail: String((userProfile as any)?.email || ''),
          requesterName: String(userProfile?.parentName || ''),
          event: {
            id: selectedEvent.id,
            title: selectedEvent.title,
            date: selectedEvent.date,
            time: selectedEvent.time,
            location: selectedEvent.location,
            hostName: selectedEvent.hostName,
            hostId: (selectedEvent as any).hostId,
            organizerEmail: (selectedEvent as any).organizerEmail
          },
          rows: validRows.map((r) => ({
            name: r.name,
            email: r.email,
            mobile: r.mobile,
            childName: r.childName,
            ticketTierName: r.ticketTierName,
            quantity: r.quantity
          }))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Import failed');
      }

      if (Array.isArray(data.attendees)) {
        setAttendees(data.attendees);
        syncAttendeesToLocalGateRoster(selectedEvent, data.attendees);
      }

      setFeedbackBanner({
        type: 'success',
        text: `Imported ${data.summary.importedCount} attendee(s) into "${selectedEvent.title}" (${data.summary.skippedDuplicates} duplicate(s) skipped).`
      });
      setCsvRawText('');
      setParsedRows([]);
      setUploadedFileName('');
      setActiveTab('list');
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err?.message || 'Failed to import event users list.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ADMIN-ONLY Auto-Provision Bulk Upload:
  // Creates Users + Generates Event Booking QR Codes + Sends Email Notifications to all uploaded users
  const handleAdminBulkUpload = async () => {
    if (!isAdmin || !selectedEvent) return;
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setFeedbackBanner({
        type: 'error',
        text: 'Please upload or paste at least one valid row (Name, Email ID, Mobile Number).'
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackBanner(null);
    setBulkReport(null);

    try {
      const res = await fetch(`/api/events/${encodeURIComponent(selectedEvent.id)}/admin-bulk-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterRole: userProfile?.userRole || 'Admin',
          requesterEmail: (userProfile as any)?.email || '',
          sendEmails: sendEmailsOnAdminUpload,
          event: {
            id: selectedEvent.id,
            title: selectedEvent.title,
            category: selectedEvent.category,
            date: selectedEvent.date,
            time: selectedEvent.time,
            location: selectedEvent.location,
            hostName: selectedEvent.hostName
          },
          rows: validRows.map((r) => ({
            name: r.name,
            email: r.email,
            mobile: r.mobile,
            childName: r.childName,
            ticketTierName: r.ticketTierName,
            quantity: r.quantity
          }))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Admin bulk upload failed');
      }

      // Mirror newly created user profiles to Firestore cleanly when Admin is signed in
      if (Array.isArray(data.createdUsers) && data.createdUsers.length > 0) {
        for (const u of data.createdUsers) {
          if (u?.id) {
            setDoc(
              doc(db, 'users', u.id),
              {
                id: u.id,
                parentName: String(u.parentName || '').slice(0, 180),
                childName: String(u.childName || u.parentName || '').slice(0, 180),
                email: u.email,
                phoneNumber: u.phoneNumber,
                userRole: 'eventbuyers',
                verificationStatus: 'VERIFIED',
                aadhaarVerified: false,
                neighbourhood: String(selectedEvent.location || 'Bengaluru').slice(0, 180),
                registeredAt: u.registeredAt
              },
              { merge: true }
            ).catch(() => {});
          }
        }
      }

      // Sync event attendees locally for Gate Check-in Scanner & My Passes
      if (Array.isArray(data.attendees)) {
        setAttendees(data.attendees);
        syncAttendeesToLocalGateRoster(selectedEvent, data.attendees);
      }

      if (Array.isArray(data.results)) {
        data.results.forEach((r: BulkUploadResultItem) => {
          try {
            saveEventPurchase({
              eventId: selectedEvent.id,
              eventTitle: selectedEvent.title,
              eventType: (selectedEvent.category as any) || 'event',
              eventDate: selectedEvent.date,
              eventTime: selectedEvent.time,
              eventLocation: selectedEvent.location,
              ticketTierName: 'Verified Event Pass',
              ticketQuantity: 1,
              ticketPrice: 0,
              totalPaid: 0,
              buyerName: r.name,
              buyerPhone: r.mobile,
              buyerEmail: r.email,
              buyerRole: 'eventbuyers',
              qrPassCode: r.ticketNumber,
              bookingReference: r.bookingReference,
              childName: r.name,
              organizerName: selectedEvent.hostName
            });
          } catch {
            // Non-blocking
          }
        });
      }

      setBulkReport({
        summary: data.summary,
        results: data.results || []
      });

      setFeedbackBanner({
        type: 'success',
        text: `Bulk upload complete for "${selectedEvent.title}": ${data.summary.usersCreated} new user(s) created, ${data.summary.bookingsGenerated} booking QR code(s) generated, and ${data.summary.emailsSent} email notification(s) dispatched.`
      });
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err?.message || 'Admin bulk upload failed.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validRowCount = parsedRows.filter((r) => r.isValid).length;
  const invalidRowCount = parsedRows.length - validRowCount;
  const emailsSentCount = attendees.filter((a) => a.emailSent).length;
  const checkedInCount = attendees.filter((a) => a.checkedIn).length;

  const content = (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-wider text-amber-200">
              <FileSpreadsheet className="w-3 h-3" /> Event-Wise Users Manager
            </span>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-[10px] font-bold text-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Admin Auto-Provision Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/25 border border-orange-400/40 text-[10px] font-bold text-orange-200">
                Event Host Export &amp; Import
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold font-serif">
            Single-Event User List: Export, Import &amp; QR Passes
          </h3>
          <p className="text-xs text-slate-300">
            Select any single event to export or import attendee lists (Name, Email ID, Mobile Number)
            {isAdmin ? ', or bulk upload users to auto-create accounts, generate booking QR codes & send emails.' : '.'}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-center p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Single-Event Selector & Quick Action Strip */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          {/* Event Selector Dropdown */}
          <div className="lg:col-span-6 space-y-1">
            <label
              htmlFor="select-single-event-users"
              className="block text-[11px] font-black uppercase tracking-wider text-slate-600"
            >
              {isAdmin ? 'Select Single Event (All Platform Events)' : 'Select Your Hosted Event (Own Events Only)'}
            </label>
            <select
              id="select-single-event-users"
              value={selectedEvent?.id || ''}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={accessibleEvents.length === 0}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
            >
              {accessibleEvents.length === 0 ? (
                <option value="">No events organized by your account yet</option>
              ) : (
                accessibleEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.title} — {evt.date} ({evt.location})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Primary Actions */}
          <div className="lg:col-span-6 flex flex-wrap items-center lg:justify-end gap-2">
            <button
              type="button"
              onClick={handleExportEventCsv}
              disabled={!selectedEvent}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Event CSV ({attendees.length})</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
              <span>CSV Template</span>
            </button>

            <button
              type="button"
              onClick={() => selectedEvent && fetchEventAttendees(selectedEvent.id)}
              className="p-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl transition cursor-pointer"
              title="Refresh selected event users"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin text-rose-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Selected Event Summary Bar */}
        {selectedEvent && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
              <span className="font-bold text-slate-900">{selectedEvent.title}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" /> {selectedEvent.date} • {selectedEvent.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> {selectedEvent.location}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {attendees.length} Users
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {checkedInCount} Checked-In
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {emailsSentCount} Emailed
              </span>
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              setFeedbackBanner(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'list'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Event Users &amp; Export ({attendees.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setFeedbackBanner(null);
              setBulkReport(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'import'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Event Users CSV</span>
          </button>

          {/* ADMIN-ONLY Tab: Upload single-event list -> Auto-Create Users + Booking QRs + Email Notifications */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin-upload');
                setFeedbackBanner(null);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'admin-upload'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin Bulk Upload: Auto-Create Users, QR &amp; Email</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`mx-5 mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-start justify-between gap-2 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedbackBanner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <span className="flex items-start gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{feedbackBanner.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Body Content */}
      <div className="p-4 sm:p-5 space-y-4">
        {!selectedEvent && !isAdmin ? (
          <div className="py-12 px-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2.5">
            <ShieldCheck className="w-10 h-10 text-orange-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">
              No Hosted Events Found for Your Account
            </h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              For privacy and security, event hosts can only view, export, or import user lists for events they have organized or hosted. Post an event in Vernunt to manage its attendee CSV here.
            </p>
          </div>
        ) : null}

        {/* TAB 1: EVENT USERS TABLE & EXPORT */}
        {selectedEvent && activeTab === 'list' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email ID, mobile number, or pass ID..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                />
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Showing {filteredAttendees.length} of {attendees.length} user(s) for selected event
              </span>
            </div>

            {isLoadingList ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading event users...
              </div>
            ) : filteredAttendees.length === 0 ? (
              <div className="py-12 px-4 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No users registered for this event yet</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Users who book this event automatically appear here, or you can import a CSV list of names, email IDs, and mobile numbers.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('import')}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Import Event Users CSV
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin-upload')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Admin Auto-Upload Users + QR + Emails
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Email ID</th>
                      <th className="py-2.5 px-3">Mobile Number</th>
                      <th className="py-2.5 px-3">Booking / QR Pass</th>
                      <th className="py-2.5 px-3">Status &amp; Email</th>
                      <th className="py-2.5 px-3 text-right">QR Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendees.map((att, index) => (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{index + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{att.name}</div>
                          {att.childName && att.childName !== att.name && (
                            <div className="text-[11px] text-slate-500">Child: {att.childName}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {att.email || <span className="text-slate-400 italic">—</span>}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {att.mobile || <span className="text-slate-400 italic">—</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-slate-800">{att.ticketNumber}</div>
                          <div className="text-[10px] text-slate-500">
                            {att.ticketTierName} × {att.quantity}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                att.checkedIn
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {att.checkedIn ? 'Checked In' : 'Confirmed'}
                            </span>
                            {att.emailSent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 flex items-center gap-0.5">
                                <Mail className="w-2.5 h-2.5" /> Emailed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewQrAttendee({
                                name: att.name,
                                email: att.email,
                                mobile: att.mobile,
                                ticketNumber: att.ticketNumber,
                                qrDataUrl: att.qrDataUrl,
                                eventTitle: selectedEvent?.title || att.eventTitle
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            <QrCode className="w-3 h-3 text-rose-400" />
                            <span>QR</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2 (HOST & ADMIN ROSTER IMPORT) & TAB 3 (ADMIN-ONLY AUTO-PROVISION UPLOAD) */}
        {selectedEvent && (activeTab === 'import' || (activeTab === 'admin-upload' && isAdmin)) && (
          <div className="space-y-4">
            {/* Mode Explanation Card */}
            {activeTab === 'admin-upload' ? (
              <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border border-rose-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Admin Single-Event Bulk User Upload (Auto-Create + Booking QR + Email)
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        Target Event: <strong className="text-rose-700">{selectedEvent?.title}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                    Admin Only
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="bg-white/90 border border-rose-100 rounded-xl p-2.5 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>1. Auto-Create Users</strong> for every new email/mobile</span>
                  </div>
                  <div className="bg-white/90 border border-rose-100 rounded-xl p-2.5 flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>2. Generate Booking QRs</strong> for this selected event</span>
                  </div>
                  <div className="bg-white/90 border border-rose-100 rounded-xl p-2.5 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>3. Send Ticket Emails</strong> with QR &amp; PDF Pass</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    Import Attendees into "{selectedEvent?.title}"
                  </h4>
                  <p className="text-xs text-slate-600">
                    Upload a CSV or paste rows with <strong>Name, Email ID, Mobile Number</strong> to add attendees and QR passes to this event's roster.
                  </p>
                </div>
                {!isAdmin && (
                  <span className="text-[10px] font-bold bg-white border border-amber-300 text-amber-900 px-2.5 py-1 rounded-lg shrink-0">
                    Host Roster Mode
                  </span>
                )}
              </div>
            )}

            {/* File Picker + Direct Paste Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Upload Box */}
              <div className="lg:col-span-5 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 transition">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-rose-600 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {uploadedFileName ? `Loaded: ${uploadedFileName}` : 'Upload Users CSV File'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Columns: <code>Name, Email ID, Mobile Number</code> (optional: Child Name, Ticket Tier, Quantity)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    Choose CSV File
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    Download Template
                  </button>
                </div>
              </div>

              {/* Paste CSV / Excel Box */}
              <div className="lg:col-span-7 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Or Paste Users List Directly (CSV or Copy-Paste from Excel / Sheets)
                  </label>
                  {csvRawText && (
                    <button
                      type="button"
                      onClick={() => {
                        setCsvRawText('');
                        setParsedRows([]);
                        setUploadedFileName('');
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={csvRawText}
                  onChange={(e) => handlePasteTextChange(e.target.value)}
                  placeholder={`Name,Email ID,Mobile Number\nPriya Sharma,priya@example.com,9845011223\nRohan Kulkarni,rohan@example.com,9900122334`}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500"
                />
              </div>
            </div>

            {/* Live Validation Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-800">Preview ({parsedRows.length} rows)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {validRowCount} Valid
                    </span>
                    {invalidRowCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                        {invalidRowCount} Needs Fix
                      </span>
                    )}
                  </div>

                  {activeTab === 'admin-upload' && isAdmin && (
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sendEmailsOnAdminUpload}
                        onChange={(e) => setSendEmailsOnAdminUpload(e.target.checked)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>Send email notifications (QR + PDF Pass) to all users</span>
                    </label>
                  )}
                </div>

                <div className="overflow-x-auto max-h-60 border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Email ID</th>
                        <th className="py-2 px-3">Mobile Number</th>
                        <th className="py-2 px-3">Tier / Qty</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row) => (
                        <tr key={row.id} className={row.isValid ? 'bg-white' : 'bg-rose-50/70'}>
                          <td className="py-2 px-3 font-bold text-slate-800">{row.name || '—'}</td>
                          <td className="py-2 px-3 text-slate-700">{row.email || '—'}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{row.mobile || '—'}</td>
                          <td className="py-2 px-3 text-slate-600">
                            {row.ticketTierName || 'General Pass'} × {row.quantity}
                          </td>
                          <td className="py-2 px-3">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                <Check className="w-3.5 h-3.5" /> Ready
                              </span>
                            ) : (
                              <span className="text-rose-700 font-bold text-[11px]">{row.validationNote}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveParsedRow(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Remove row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Submit Action Bar */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  {activeTab === 'admin-upload' && isAdmin ? (
                    <button
                      type="button"
                      disabled={isSubmitting || validRowCount === 0 || !selectedEvent}
                      onClick={handleAdminBulkUpload}
                      className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating Users, Generating QR Codes &amp; Sending Emails...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>
                            Upload {validRowCount} User(s): Auto-Create Accounts, Generate Booking QRs &amp; Send Emails
                          </span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting || validRowCount === 0 || !selectedEvent}
                      onClick={handleRosterImport}
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Importing Event Users...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Import {validRowCount} User(s) to Selected Event</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Admin Bulk Upload Execution Report */}
            {bulkReport && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Admin Upload Results — {selectedEvent?.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 cursor-pointer"
                  >
                    View Full Event Roster
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white border border-emerald-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Users Auto-Created</div>
                    <div className="text-lg font-black text-emerald-700">{bulkReport.summary.usersCreated}</div>
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Existing Linked</div>
                    <div className="text-lg font-black text-slate-800">{bulkReport.summary.existingUsersLinked}</div>
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Booking QRs Generated</div>
                    <div className="text-lg font-black text-rose-600">{bulkReport.summary.bookingsGenerated}</div>
                  </div>
                  <div className="bg-white border border-emerald-100 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Emails Dispatched</div>
                    <div className="text-lg font-black text-blue-700">{bulkReport.summary.emailsSent}</div>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white border border-emerald-200 rounded-xl max-h-72">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="py-2 px-3">User</th>
                        <th className="py-2 px-3">Account</th>
                        <th className="py-2 px-3">Booking Pass ID</th>
                        <th className="py-2 px-3">Email Notification</th>
                        <th className="py-2 px-3 text-right">Booking QR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkReport.results.map((r, i) => (
                        <tr key={`${r.ticketNumber}_${i}`}>
                          <td className="py-2 px-3">
                            <div className="font-bold text-slate-900">{r.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {r.email} {r.mobile ? `• ${r.mobile}` : ''}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.accountAction === 'created'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r.accountAction === 'created' ? 'New User Created' : 'Existing Linked'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{r.ticketNumber}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[11px] font-semibold ${
                                r.emailSent ? 'text-blue-700' : 'text-amber-700'
                              }`}
                            >
                              {r.emailStatus}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewQrAttendee({
                                  name: r.name,
                                  email: r.email,
                                  mobile: r.mobile,
                                  ticketNumber: r.ticketNumber,
                                  qrDataUrl: r.qrDataUrl,
                                  eventTitle: selectedEvent?.title || 'Vernunt Event'
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-rose-400" />
                              <span>View QR</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline QR Preview Lightbox */}
      {previewQrAttendee && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 relative">
            <button
              type="button"
              onClick={() => setPreviewQrAttendee(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                Event Booking QR Pass
              </span>
              <h4 className="text-base font-bold text-slate-900 font-serif">
                {previewQrAttendee.eventTitle}
              </h4>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-flex flex-col items-center justify-center">
              {previewQrAttendee.qrDataUrl ? (
                <img
                  src={previewQrAttendee.qrDataUrl}
                  alt={`QR Code ${previewQrAttendee.ticketNumber}`}
                  className="w-44 h-44 object-contain rounded-lg bg-white p-1"
                />
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    previewQrAttendee.ticketNumber
                  )}`}
                  alt={`QR Code ${previewQrAttendee.ticketNumber}`}
                  className="w-44 h-44 object-contain rounded-lg bg-white p-1"
                />
              )}
              <span className="mt-2 font-mono text-xs font-black text-slate-900">
                #{previewQrAttendee.ticketNumber}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 rounded-xl p-3 text-left">
              <div><strong>Attendee:</strong> {previewQrAttendee.name}</div>
              {previewQrAttendee.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {previewQrAttendee.email}
                </div>
              )}
              {previewQrAttendee.mobile && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {previewQrAttendee.mobile}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPreviewQrAttendee(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close QR Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
        <div className="w-full max-w-5xl my-auto max-h-[92vh] overflow-y-auto rounded-2xl">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
