export interface VendorAgreementData {
  agreementId: string;
  storeName: string;
  ownerName: string;
  contactPerson?: string;
  email: string;
  phone: string;
  businessType: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  pickupAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  gstNumber?: string;
  panNumber?: string;
  bankDetails?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  commissionRate: number; // Always 10% on gross selling price
  commissionTerms: string;
  returnPolicy: string; // Mandatory return acceptance within minimum 7 days
  acceptedAt: string; // ISO 8601 string
  acceptanceHash: string; // SHA/Cryptographic verification identifier
  version: string;
  signatoryIp?: string;
}

export const CURRENT_VENDOR_AGREEMENT_VERSION = '2026-v2.2-COMMISSION10-RETURN-MANDATE';
export const STANDARD_VENDOR_COMMISSION_PERCENT = 10;
