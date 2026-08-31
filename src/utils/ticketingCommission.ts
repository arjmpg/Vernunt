// src/utils/ticketingCommission.ts
/**
 * Vernunt Enterprise Event Ticketing & Commission Policy Engine
 * Controls free ticket allowances, platform commission rates, influencer quotas,
 * and tiered commission rules configured by administrators.
 */

import { CommunityEvent } from '../types.ts';

export interface CommissionTierRule {
  minTickets: number; // e.g. 0
  maxTickets: number; // e.g. 1000
  commissionPercent: number; // e.g. 0 (0%)
  label: string; // e.g. "Influencer 0% Free Quota"
}

export interface HostCustomOverride {
  hostIdOrName: string; // e.g. "Priya Sharma (@bangalore_mommy_diaries)"
  freeTicketsQuota: number; // e.g. 1500
  commissionRate: number; // e.g. 2.5%
  role: 'influencer' | 'standard' | 'verified_partner';
  notes?: string;
  updatedAt: string;
}

export interface AdminTicketingConfig {
  // Standard Hosts (Parents, Daycare Centers, Local Coaches)
  defaultStandardFreeTicketsLimit: number; // Default e.g. 50 free tickets
  defaultStandardCommissionRate: number; // Default e.g. 8.0%

  // Influencer Hosts (Instagram Ambassadors, Parenting Creators)
  defaultInfluencerFreeTicketsLimit: number; // Default 1000 free tickets at 0% commission
  defaultInfluencerCommissionRate: number; // Default e.g. 2.5% after free quota

  // Tiered Commission Setup for Influencer & High-Volume Hosts
  enableTieredCommission: boolean;
  influencerTiers: CommissionTierRule[];

  // Granular Per-Host Custom Overrides (configured by Admin)
  hostOverrides: Record<string, HostCustomOverride>;

  // Per-Event Custom Overrides (Key: Event ID)
  eventOverrides: Record<string, {
    freeTicketsQuota: number;
    commissionRate: number;
    notes?: string;
  }>;

  lastUpdated: string;
}

export const DEFAULT_TICKETING_CONFIG: AdminTicketingConfig = {
  defaultStandardFreeTicketsLimit: 30,
  defaultStandardCommissionRate: 8.0,
  defaultInfluencerFreeTicketsLimit: 1000,
  defaultInfluencerCommissionRate: 2.5,
  enableTieredCommission: true,
  influencerTiers: [
    { minTickets: 1, maxTickets: 1000, commissionPercent: 0.0, label: '0% Free Influencer Quota (First 1,000 Tickets)' },
    { minTickets: 1001, maxTickets: 3000, commissionPercent: 2.0, label: 'Super Creator Tier (2% Platform Commission)' },
    { minTickets: 3001, maxTickets: 10000, commissionPercent: 3.5, label: 'High-Volume Mega Tier (3.5% Commission)' },
    { minTickets: 10001, maxTickets: 999999, commissionPercent: 5.0, label: 'Enterprise Arena Tier (5% Commission)' }
  ],
  hostOverrides: {
    'Priya Sharma (@bangalore_mommy_diaries)': {
      hostIdOrName: 'Priya Sharma (@bangalore_mommy_diaries)',
      freeTicketsQuota: 1000,
      commissionRate: 2.0,
      role: 'influencer',
      notes: 'Official Vernunt Bangalore Ambassador. 1,000 free tickets quota at 0% fee.',
      updatedAt: new Date().toISOString()
    },
    'Neha Kapoor (@delhi_montessori_mom)': {
      hostIdOrName: 'Neha Kapoor (@delhi_montessori_mom)',
      freeTicketsQuota: 1500,
      commissionRate: 1.5,
      role: 'influencer',
      notes: 'Delhi/NCR Parenting Creator Partner.',
      updatedAt: new Date().toISOString()
    }
  },
  eventOverrides: {},
  lastUpdated: new Date().toISOString()
};

const TICKETING_CONFIG_STORAGE_KEY = 'vernunt_admin_ticketing_config';

/**
 * Retrieve current admin ticketing & commission configuration
 */
export function getAdminTicketingConfig(): AdminTicketingConfig {
  if (typeof window === 'undefined') return DEFAULT_TICKETING_CONFIG;
  try {
    const raw = localStorage.getItem(TICKETING_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_TICKETING_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_TICKETING_CONFIG,
      ...parsed,
      influencerTiers: parsed.influencerTiers || DEFAULT_TICKETING_CONFIG.influencerTiers,
      hostOverrides: parsed.hostOverrides || DEFAULT_TICKETING_CONFIG.hostOverrides,
      eventOverrides: parsed.eventOverrides || DEFAULT_TICKETING_CONFIG.eventOverrides
    };
  } catch {
    return DEFAULT_TICKETING_CONFIG;
  }
}

/**
 * Save updated admin ticketing & commission configuration to client storage & server
 */
export function saveAdminTicketingConfig(config: AdminTicketingConfig): void {
  const updated: AdminTicketingConfig = {
    ...config,
    lastUpdated: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TICKETING_CONFIG_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save ticketing config locally:', e);
    }
  }

  // Attempt async sync with server
  try {
    fetch('/api/ticketing-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => {
      console.debug('Server ticketing sync queued:', err);
    });
  } catch (err) {
    console.debug('Ticketing sync error:', err);
  }
}

/**
 * Calculate effective free ticket quota and commission percentage for an event or host
 */
export function calculateEventCommissionPolicy(
  eventOrHost: {
    id?: string;
    hostName?: string;
    hostRole?: string;
    isInfluencer?: boolean;
    ticketPrice?: number;
    attendeesCount?: number;
    commissionPercentage?: number;
  },
  config: AdminTicketingConfig = getAdminTicketingConfig()
): {
  freeTicketsQuota: number;
  freeTicketsRemaining: number;
  effectiveCommissionRate: number;
  isInfluencerHost: boolean;
  policyDescription: string;
  appliedTierLabel?: string;
} {
  const hostName = (eventOrHost.hostName || '').trim();
  const eventId = eventOrHost.id || '';
  const isInfluencer = !!(
    eventOrHost.isInfluencer ||
    eventOrHost.hostRole === 'influencer' ||
    hostName.includes('@') ||
    (config.hostOverrides[hostName] && config.hostOverrides[hostName].role === 'influencer')
  );

  const currentTicketsIssued = eventOrHost.attendeesCount || 0;

  // 1. Check if specific Event Override exists
  if (eventId && config.eventOverrides[eventId]) {
    const eventOverride = config.eventOverrides[eventId];
    const remaining = Math.max(0, eventOverride.freeTicketsQuota - currentTicketsIssued);
    return {
      freeTicketsQuota: eventOverride.freeTicketsQuota,
      freeTicketsRemaining: remaining,
      effectiveCommissionRate: eventOverride.commissionRate,
      isInfluencerHost: isInfluencer,
      policyDescription: `Custom Event Override: ${eventOverride.freeTicketsQuota} Free Tickets Quota (0% Commission), ${eventOverride.commissionRate}% Commission on subsequent tickets.`
    };
  }

  // 2. Check if Host Specific Custom Override exists
  if (hostName && config.hostOverrides[hostName]) {
    const hostOverride = config.hostOverrides[hostName];
    const remaining = Math.max(0, hostOverride.freeTicketsQuota - currentTicketsIssued);
    return {
      freeTicketsQuota: hostOverride.freeTicketsQuota,
      freeTicketsRemaining: remaining,
      effectiveCommissionRate: hostOverride.commissionRate,
      isInfluencerHost: hostOverride.role === 'influencer',
      policyDescription: `Host VIP Agreement (${hostName}): ${hostOverride.freeTicketsQuota} Free Tickets Quota, ${hostOverride.commissionRate}% Platform Fee.`
    };
  }

  // 3. Influencer Host Default Policy
  if (isInfluencer) {
    const freeQuota = config.defaultInfluencerFreeTicketsLimit;
    const remaining = Math.max(0, freeQuota - currentTicketsIssued);

    // If within free quota, rate is 0%
    if (currentTicketsIssued < freeQuota) {
      return {
        freeTicketsQuota: freeQuota,
        freeTicketsRemaining: remaining,
        effectiveCommissionRate: 0.0,
        isInfluencerHost: true,
        policyDescription: `Influencer 0% Free Quota Active: ${remaining} of ${freeQuota} Free Tickets remaining. 0% Platform Commission applied.`,
        appliedTierLabel: '0% Free Influencer Quota'
      };
    }

    // If tiered commission is enabled, lookup matching bracket
    if (config.enableTieredCommission && config.influencerTiers?.length > 0) {
      const matchedTier = config.influencerTiers.find(
        t => currentTicketsIssued >= t.minTickets && currentTicketsIssued <= t.maxTickets
      ) || config.influencerTiers[config.influencerTiers.length - 1];

      return {
        freeTicketsQuota: freeQuota,
        freeTicketsRemaining: 0,
        effectiveCommissionRate: matchedTier.commissionPercent,
        isInfluencerHost: true,
        policyDescription: `Tiered Influencer Rate (${matchedTier.label}): ${matchedTier.commissionPercent}% Commission applied beyond 1,000 free tickets.`,
        appliedTierLabel: matchedTier.label
      };
    }

    return {
      freeTicketsQuota: freeQuota,
      freeTicketsRemaining: 0,
      effectiveCommissionRate: config.defaultInfluencerCommissionRate,
      isInfluencerHost: true,
      policyDescription: `Influencer Quota Completed: ${config.defaultInfluencerCommissionRate}% standard commission applied on paid tickets.`
    };
  }

  // 4. Standard Host Default Policy
  const stdFreeQuota = config.defaultStandardFreeTicketsLimit;
  const stdRemaining = Math.max(0, stdFreeQuota - currentTicketsIssued);

  if (currentTicketsIssued < stdFreeQuota) {
    return {
      freeTicketsQuota: stdFreeQuota,
      freeTicketsRemaining: stdRemaining,
      effectiveCommissionRate: 0.0,
      isInfluencerHost: false,
      policyDescription: `Standard Host Free Allowance: ${stdRemaining} of ${stdFreeQuota} Free Tickets remaining (0% Fee).`
    };
  }

  return {
    freeTicketsQuota: stdFreeQuota,
    freeTicketsRemaining: 0,
    effectiveCommissionRate: config.defaultStandardCommissionRate,
    isInfluencerHost: false,
    policyDescription: `Standard Host Platform Fee: ${config.defaultStandardCommissionRate}% Commission on paid tickets.`
  };
}

/**
 * Breakdown of ticket purchase amount with platform commission and host payout
 */
export function calculateTicketOrderBreakdown(
  ticketPrice: number,
  quantity: number = 1,
  event: CommunityEvent,
  config: AdminTicketingConfig = getAdminTicketingConfig()
): {
  subtotal: number;
  isFreeTicket: boolean;
  commissionPercentage: number;
  commissionEarned: number;
  hostPayout: number;
  freeQuotaApplied: boolean;
} {
  const subtotal = ticketPrice * quantity;

  if (subtotal === 0) {
    return {
      subtotal: 0,
      isFreeTicket: true,
      commissionPercentage: 0,
      commissionEarned: 0,
      hostPayout: 0,
      freeQuotaApplied: true
    };
  }

  const policy = calculateEventCommissionPolicy(event, config);
  const isFreeQuotaStillActive = policy.freeTicketsRemaining >= quantity;

  if (isFreeQuotaStillActive) {
    return {
      subtotal,
      isFreeTicket: false,
      commissionPercentage: 0,
      commissionEarned: 0,
      hostPayout: subtotal,
      freeQuotaApplied: true
    };
  }

  const rate = policy.effectiveCommissionRate;
  const commissionEarned = Math.round((subtotal * rate) / 100);
  const hostPayout = Math.max(0, subtotal - commissionEarned);

  return {
    subtotal,
    isFreeTicket: false,
    commissionPercentage: rate,
    commissionEarned,
    hostPayout,
    freeQuotaApplied: false
  };
}
