export interface SLAMetricItem {
  metric: string;
  target: string;
  description: string;
  consequence: string;
}

export interface SLASection {
  title: string;
  icon?: string;
  clauses: string[];
}

export interface SLADefinition {
  id: 'daycare' | 'event_organizer' | 'specialist' | 'caregiver' | 'vendor' | 'creator';
  roleTitle: string;
  officialName: string;
  badge: string;
  effectiveDate: string;
  version: string;
  overview: string;
  statutoryBacking: string;
  metrics: SLAMetricItem[];
  sections: SLASection[];
  breachRemedies: string[];
}

export const VERNUNT_SLA_DEFINITIONS: Record<string, SLADefinition> = {
  'daycare': {
    id: 'daycare',
    roleTitle: 'Daycare Center & Creche Operator',
    officialName: 'Vernunt B2B Early Childhood Care & Daycare Service Level Agreement',
    badge: 'Statutory Care SLA • Child Safety Mandate',
    effectiveDate: 'October 1, 2026',
    version: '2026-v2.1',
    overview: 'This Service Level Agreement (SLA) establishes the binding operational standards, caregiver ratios, emergency health response times, and facility hygiene obligations for Daycare and Creche operators listing on the Vernunt Platform.',
    statutoryBacking: 'National Early Childhood Care and Education (ECCE) Guidelines • POCSO Act 2012 • Digital Personal Data Protection Act 2023',
    metrics: [
      {
        metric: 'Staff-to-Child Safety Ratio',
        target: 'Infants 1:4 • Toddlers 1:8 • Preschool 1:12',
        description: 'Dedicated qualified educators/caregivers actively attending children at all operational hours.',
        consequence: 'Immediate audit lock on new bookings if caregiver ratio drops.'
      },
      {
        metric: 'Emergency Medical Parent Notification',
        target: '< 5 Minutes',
        description: 'Direct telephone call and high-priority app broadcast upon any fever (>100°F), fall, or injury.',
        consequence: 'Platform safety warning and mandatory incident review board.'
      },
      {
        metric: 'Pediatric Hospital Escalation',
        target: '< 15 Minutes',
        description: 'Physical transport to the pre-agreed emergency tie-up hospital in severe medical distress.',
        consequence: 'Immediate suspension and statutory emergency review.'
      },
      {
        metric: 'CCTV Live Stream & Daily Updates',
        target: '99.5% Scheduled Uptime',
        description: 'Functional high-definition parent surveillance streaming or minimum 3 daily digital activity photo check-ins.',
        consequence: 'Partial day credit refund to impacted parents.'
      },
      {
        metric: 'Handover & Pickup Verification',
        target: '100% Zero-Unverified Gate Release',
        description: 'Strict verification of parent government photo ID / OTP code before releasing any child.',
        consequence: 'Zero tolerance: Immediate permanent deregistration and legal reporting.'
      }
    ],
    sections: [
      {
        title: '1. Facility Health, Hygiene & Dietary Protocol',
        clauses: [
          'All play spaces, sleeping cots, feeding utensils, and sensory toys must be sterilized using child-safe non-toxic disinfectants at least twice every operating day.',
          'Mandatory non-contact temperature check and hand sanitization at entry for every child, staff member, and visitor.',
          'Meals and snacks provided must adhere strictly to verified allergen checklists (peanut-free, gluten-free, dairy-free where noted by parents).',
          'Strict sick-child quarantine bay maintained for any child who develops contagious symptoms during center hours.'
        ]
      },
      {
        title: '2. Staff Background Checks & Vetting Verification',
        clauses: [
          '100% of teachers, ayahs, helpers, and drivers must have verified police criminal background checks and government Aadhaar verification on file.',
          'Zero unauthorized adult visitors allowed inside children play or nap areas without active director supervision.',
          'At least two staff members certified in Pediatric Basic Life Support (BLS) and Pediatric CPR present on premises during all operational shifts.'
        ]
      },
      {
        title: '3. Handover Protocol & Anti-Abduction Security',
        clauses: [
          'Children shall be released solely to parents registered in the Vernunt child profile, verified by secondary mobile OTP or biometric verification.',
          'Written parental consent via Vernunt app is strictly required 2 hours in advance for any emergency non-parent pickup.',
          'Center must maintain timestamped entry and exit logs archived digitally for minimum 180 days.'
        ]
      },
      {
        title: '4. Fee Transparency, Refunds & Unexpected Closures',
        clauses: [
          'In case of unexpected facility closure due to maintenance, sanitary contamination, or regulatory orders, center must issue pro-rata fee refunds or compensatory makeup days within 5 business days.',
          'Withdrawal requests submitted with 15 days written notice entitle parents to security deposit refund without arbitrary deductions.'
        ]
      }
    ],
    breachRemedies: [
      'Level 1 (Punctuality / Streaming Downtime): Warning notice and mandatory cure within 24 hours.',
      'Level 2 (Hygiene or Ratio Lapses): Temporary listing suspension on Vernunt discovery radar pending physical reinspection.',
      'Level 3 (Safety, Unverified Release or Child Harm): Immediate account termination, forfeiture of platform escrow funds, and notification to local child welfare authorities.'
    ]
  },
  'event_organizer': {
    id: 'event_organizer',
    roleTitle: 'Event Organizer, Activity & Classes Host',
    officialName: 'Vernunt B2B Event Organizer, Ticketing & Workshop SLA',
    badge: 'Ticketing & Venue Safety SLA • Buyer Protection',
    effectiveDate: 'October 1, 2026',
    version: '2026-v2.1',
    overview: 'Defines mandatory service delivery commitments, venue crowd safety protocols, dynamic QR scanner latency, and buyer refund guarantees for ticketed workshops, sports camps, and family events hosted on Vernunt.',
    statutoryBacking: 'Consumer Protection Act 2019 • Information Technology Act Sec 79 • Public Entertainment Safety By-laws',
    metrics: [
      {
        metric: 'Gate Check-In & Scanner Latency',
        target: '< 3 Seconds per Attendee',
        description: 'Ultra-fast QR pass verification to eliminate congested entrance queues under heat or rain.',
        consequence: 'Organizer must deploy secondary manual bypass station if queue exceeds 10 persons.'
      },
      {
        metric: 'Event Rescheduling Notice Window',
        target: '≥ 48 Hours Prior',
        description: 'Advance notice required for any date, venue, or timing modification via Vernunt push broadcast.',
        consequence: 'Failure requires automatic unconditional 100% refund entitlement for ticket buyers.'
      },
      {
        metric: 'Cancellation Full Refund Turnaround',
        target: '< 48 Hours',
        description: 'Automatic settlement reversal directly back to buyer payment source (UPI/Card) upon event cancellation.',
        consequence: 'Vernunt automated refund engine debits organizer balance with zero platform penalty to parent.'
      },
      {
        metric: 'Chaperone-to-Child Safety Ratio',
        target: '1 Adult Coach per 10 Children',
        description: 'Sufficient adult supervisors for all drop-off kids workshops and outdoor sports meets.',
        consequence: 'Immediate activity halt until supplemental staff is mobilized.'
      },
      {
        metric: 'Lost Child / Rapid Reunification SLA',
        target: '< 180 Seconds',
        description: 'Gate lockdown and organizer broadcast activated immediately if an unaccompanied child is identified.',
        consequence: 'Mandatory security audit report submitted to Vernunt trust team within 12 hours.'
      }
    ],
    sections: [
      {
        title: '1. Venue Safety, First-Aid & Hazard Controls',
        clauses: [
          'Host warrants that the event venue possesses clear unblocked emergency exits, working fire extinguishers, and child-safe electrical fixtures.',
          'A fully stocked first-aid kit containing pediatric bandages, antiseptic, cold packs, and burn gel must be stationed at the check-in desk.',
          'For sports or high-mobility events (soccer, gymnastics, skating), a certified sports medic or nurse must be on standby on-site.'
        ]
      },
      {
        title: '2. Syllabus & Materials Guarantee',
        clauses: [
          'All promised workshop materials (robotics kits, canvas boards, musical instruments, uniforms) must be supplied in pristine condition with zero surprise surcharges.',
          'Instructors listed on the event promotion must personally lead the session; substitutions require prior attendee notice.'
        ]
      },
      {
        title: '3. Zero Corporal Punishment & Code of Conduct',
        clauses: [
          'Absolute prohibition of physical discipline, shaming, bullying, or verbal abuse of any child participant.',
          'All staff and volunteer coordinators must maintain professional, nurturing communication with kids and parents at all times.'
        ]
      }
    ],
    breachRemedies: [
      'Event Delays > 30 mins: Mandatory 25% goodwill ticket credit issued to attendees.',
      'Unannounced Cancellations: 100% attendee refund + platform de-listing of future organizer events.',
      'Safety Violations: Permanent ban and referral to relevant licensing authorities.'
    ]
  },
  'specialist': {
    id: 'specialist',
    roleTitle: 'Kids Specialist, Doctor, Pediatrician & Educator',
    officialName: 'Vernunt Professional Child Portfolio & Healthcare SLA',
    badge: 'Clinical Practice SLA • DPDP Health Privacy Mandate',
    effectiveDate: 'October 1, 2026',
    version: '2026-v2.1',
    overview: 'Governs professional ethics, appointment queue punctuality, digital health record privacy, and clinical consultation standards for pediatricians, child therapists, psychologists, and specialists on Vernunt.',
    statutoryBacking: 'National Medical Commission (NMC) Act • DPDP Act 2023 • Rehabilitation Council of India (RCI) Standards',
    metrics: [
      {
        metric: 'Consultation Punctuality & Queue Wait',
        target: '< 15 Minutes Wait Time',
        description: 'Specialist must attend booked consultation within 15 minutes of scheduled time slot.',
        consequence: 'Free reschedule or automatic 20% convenience rebate credited to parent.'
      },
      {
        metric: 'Digital Summary & Notes Turnaround',
        target: '< 2 Hours Post-Consult',
        description: 'Clinical observation summary, milestone action plan, or diet chart uploaded to parent child portfolio.',
        consequence: 'Specialist payout hold until documentation is dispatched.'
      },
      {
        metric: 'Patient Data Privacy & Child Health Records',
        target: '100% Zero-Leakage DPDP Standard',
        description: 'Child health cards, milestone assessments, and clinical notes encrypted at rest and in transit.',
        consequence: 'Immediate permanent expulsion and statutory DPDP regulatory disclosure.'
      },
      {
        metric: 'Specialist Emergency Notice Window',
        target: '≥ 2 Hours in Advance',
        description: 'Advance notice for doctor surgery or emergency delay, offering seamless priority rebooking.',
        consequence: 'Unconditional 100% refund if the alternate slot is inconvenient to parent.'
      },
      {
        metric: 'Registration & License Compliance',
        target: '100% Active Council Validity',
        description: 'Continuous valid registration with State Medical Council, NMC, or relevant professional council.',
        consequence: 'Automated de-badging and portfolio visibility deactivation upon license lapse.'
      }
    ],
    sections: [
      {
        title: '1. Professional Conduct & Evidence-Based Guidance',
        clauses: [
          'Consultations must follow established pediatric medical consensus, developmental milestones, and evidence-based clinical protocols.',
          'Specialist shall not endorse unverified supplements, off-label medications, or commercial baby brands during consultations.',
          'Clear emergency disclaimer: Tele-consults and digital advice do not substitute in-person Emergency Room (ER) pediatric trauma care.'
        ]
      },
      {
        title: '2. Confidentiality & Parent Consent',
        clauses: [
          'Specialist agrees never to use, disclose, or publish child health assessments, developmental scores, or photos without explicit parent consent.',
          'All records must comply with the Digital Personal Data Protection Act 2023 and DISHA digital health standards.'
        ]
      },
      {
        title: '3. Fee Transparency & Zero Direct Extortion',
        clauses: [
          'All consultation fees must be billed transparently through the Vernunt verified gateway without demand for off-platform cash surcharges.',
          'If a specialist is unable to conclude a consultation due to technical failure, a complimentary follow-up slot must be scheduled within 24 hours.'
        ]
      }
    ],
    breachRemedies: [
      'Unannounced Doctor No-Show: 100% fee refund to parent + specialist debited with missed slot penalty.',
      'Unverified Credential Misrepresentation: Instant referral to state medical licensing council + legal prosecution.',
      'Privacy Breach: Total platform ban with permanent revocation of Vernunt verified mark.'
    ]
  },
  'caregiver': {
    id: 'caregiver',
    roleTitle: 'Home Care Sitter & In-Home Babysitting Host',
    officialName: 'Vernunt Caregiver & Sitter Safety Service Level Agreement',
    badge: 'Caregiver Punctuality & Safety SLA • In-Home Protocol',
    effectiveDate: 'October 1, 2026',
    version: '2026-v2.1',
    overview: 'Outlines non-negotiable childcare safety rules, 100% active eyes-on supervision standards, emergency notifications, and verified handover protocols for verified babysitters and home care providers.',
    statutoryBacking: 'Child Protection Guidelines • Bharatiya Nyaya Sanhita • Juvenile Justice Act',
    metrics: [
      {
        metric: 'Punctuality & Shift Arrival',
        target: '≥ 98% On-Time Arrival',
        description: 'Arrival at parent residence or home care center promptly at scheduled booking time.',
        consequence: 'Caregiver rating deduction and partial booking credit to family.'
      },
      {
        metric: 'Active Eyes-On Supervision',
        target: '100% Unbroken Attention',
        description: 'Zero unattended moments during bath, outdoor play, feeding, or balcony access.',
        consequence: 'Zero-tolerance violation resulting in immediate suspension.'
      },
      {
        metric: 'Emergency Escalation Notification',
        target: '< 3 Minutes',
        description: 'Immediate phone call to parents if child develops high fever, falls, or has an allergic reaction.',
        consequence: 'Mandatory safety retraining and suspension pending enquiry.'
      },
      {
        metric: 'Authorized Handover Security',
        target: '100% OTP / Registered Parent Only',
        description: 'Never hand over the child to any neighbor, delivery person, or stranger without prior parent consent.',
        consequence: 'Immediate police reporting and permanent lifetime ban.'
      }
    ],
    sections: [
      {
        title: '1. In-Home Care Safety Code',
        clauses: [
          'Caregiver shall never invite personal visitors, friends, or family members into the client residence during active shift hours.',
          'Strict zero-tolerance for smoking, alcohol, vaping, or intoxicants prior to or during childcare shifts.',
          'Strict prohibition on taking photos or videos of the child for posting on personal social media or sending to third parties.'
        ]
      },
      {
        title: '2. Incident Reporting & Transparent Communication',
        clauses: [
          'Any minor scrape, scratch, temper tantrum, or loss of appetite must be logged honestly in the shift handover report.',
          'Follow parental instructions diligently regarding nap routines, screen time limits, and dietary restrictions.'
        ]
      }
    ],
    breachRemedies: [
      'Unjustified Late Arrival > 20 mins: Hourly rate discounted by 50% for the session.',
      'Unauthorized Visitor Violation: Instant shift termination with zero payout and permanent platform ban.',
      'Child Neglect: Complete de-registration, legal prosecution, and referral to child protection authorities.'
    ]
  },
  'vendor': {
    id: 'vendor',
    roleTitle: 'Kids Store Vendor & Product Brand Seller',
    officialName: 'Vernunt Marketplace Seller & Logistics Service Level Agreement',
    badge: 'Logistics SLA • BIS Toy Safety & FSSAI Standards',
    effectiveDate: 'October 1, 2026',
    version: '2026-v2.1',
    overview: 'Binds verified toy makers, book publishers, and nursery brands to strict 24–48 hour dispatch SLAs, Bureau of Indian Standards (BIS) non-toxic certifications, and 7-day hassle-free customer replacement guarantees.',
    statutoryBacking: 'Consumer Protection (E-Commerce) Rules 2020 • BIS Toys Safety Standards (IS 9873) • FSSAI Regulations',
    metrics: [
      {
        metric: 'Order Packaging & Courier Handover',
        target: '24–48 Hours SLA',
        description: 'Items securely packed and handed over to Shiprocket/Delhivery with active AWB tracking.',
        consequence: 'Late dispatch fee and merchant search ranking suppression.'
      },
      {
        metric: 'BIS Non-Toxic Toy Compliance',
        target: '100% Certified Safe',
        description: 'Zero lead, zero phthalates, BPA-free baby materials meeting mandatory BIS safety mark.',
        consequence: 'Immediate product seizure, listing termination, and recall liability.'
      },
      {
        metric: 'Stockout Cancellation Rate',
        target: '< 1.5% Monthly',
        description: 'Accurate inventory levels to avoid disappointing children with unfulfilled orders.',
        consequence: 'Temporary suspension of store instant-checkout badge.'
      },
      {
        metric: 'Customer Return & Replacement Window',
        target: '7 Days Hassle-Free',
        description: 'Prompt replacement for transit-damaged, broken, or defective products.',
        consequence: 'Automatic deduction from seller escrow payout in favor of buyer.'
      }
    ],
    sections: [
      {
        title: '1. Genuine Kids Products & Packaging Standards',
        clauses: [
          'All goods must be 100% original, brand new, factory sealed, and stored in hygienic, pest-free warehouse premises.',
          'Packaging must be tamper-evident and sufficiently cushioned to withstand transit handling without child-hazard sharp edges.'
        ]
      },
      {
        title: '2. Payout Settlements & 60-Day Free Trial',
        clauses: [
          'Sellers enjoy 60 days of zero platform commission from activation date.',
          'Reconciled sales payouts are transferred on weekly settlement cycles via NEFT or verified merchant UPI.'
        ]
      }
    ],
    breachRemedies: [
      'Dispatch Delays > 72 hours: Auto-refund triggered with seller bearing reverse logistics charges.',
      'Counterfeit or Toxic Goods: Immediate permanent store ban, merchant escrow freeze, and legal referral.'
    ]
  },
  'creator': {
    id: 'creator',
    roleTitle: 'Community Creator & Influencer Ambassador',
    officialName: 'Vernunt Creator Ambassador & Family Content SLA',
    badge: 'Creator Ethics SLA • Child Dignity & ASCI Compliance',
    effectiveDate: 'October 1, 2026',
    version: '2026-v2.1',
    overview: 'Sets ethical standards for family creators, mommy vloggers, and parent ambassadors advocating for the Vernunt verified community.',
    statutoryBacking: 'ASCI Influencer Guidelines • DPDP Act 2023 • Child Online Safety Protocols',
    metrics: [
      {
        metric: 'Child Dignity & Respectful Representation',
        target: '100% Ethical Guidelines',
        description: 'No forced performances, emotional exploitation, or unsafe stunts featuring children.',
        consequence: 'Immediate ambassador badge revocation.'
      },
      {
        metric: 'Campaign Promotion Turnaround',
        target: '< 5 Days of Event/Launch',
        description: 'Delivery of agreed community event reviews, playdate spotlights, or app walkthroughs.',
        consequence: 'Reallocation of ambassador ticketing credits to community co-hosts.'
      },
      {
        metric: 'Honest Disclosure & Transparency',
        target: '#Collab / #Partner Disclosure',
        description: 'Clear transparent labeling of brand collaborations complying with ASCI rules.',
        consequence: 'Warning notice and post correction mandate within 4 hours.'
      }
    ],
    sections: [
      {
        title: '1. Community Ambassadorship Responsibilities',
        clauses: [
          'Promote inclusive, kind, and safe neighborhood playdate interactions.',
          'Never reveal precise home addresses, school uniforms, or sensitive locations of other neighborhood kids in social media videos.'
        ]
      }
    ],
    breachRemedies: [
      'Violation of Child Safety: Instant termination of creator ambassador status and revocation of VIP perks.'
    ]
  }
};

/**
 * Returns the relevant SLA for a given registration role or provider type
 */
export function getSLAForRole(roleOrType: string): SLADefinition {
  const normalized = roleOrType.toLowerCase();
  if (normalized.includes('daycare') || normalized.includes('creche')) {
    return VERNUNT_SLA_DEFINITIONS['daycare'];
  }
  if (normalized.includes('event') || normalized.includes('host') || normalized.includes('organizer')) {
    return VERNUNT_SLA_DEFINITIONS['event_organizer'];
  }
  if (normalized.includes('specialist') || normalized.includes('doctor') || normalized.includes('portfolio') || normalized.includes('pediatric')) {
    return VERNUNT_SLA_DEFINITIONS['specialist'];
  }
  if (normalized.includes('sitter') || normalized.includes('babysitter') || normalized.includes('caregiver')) {
    return VERNUNT_SLA_DEFINITIONS['caregiver'];
  }
  if (normalized.includes('vendor') || normalized.includes('seller') || normalized.includes('store')) {
    return VERNUNT_SLA_DEFINITIONS['vendor'];
  }
  if (normalized.includes('creator') || normalized.includes('influencer')) {
    return VERNUNT_SLA_DEFINITIONS['creator'];
  }
  // Default fallback to Daycare SLA
  return VERNUNT_SLA_DEFINITIONS['daycare'];
}
