import type { StoreProduct, CartItem } from '../types/store.ts';
import type { VendorProfile } from '../types/vendor.ts';

// Major Regional Indian PIN code clusters
export const REGIONAL_PINCODE_PRESETS = {
  METROS: [
    '110001', '110016', '110020', '110024', '110092', // Delhi
    '400001', '400050', '400076', '400092', // Mumbai
    '560001', '560034', '560100', '560102', '560068', // Bengaluru
    '600001', '600018', '600028', '600096', // Chennai
    '500001', '500032', '500081', // Hyderabad
    '411001', '411004', '411014', '411038', // Pune
    '700001', '700091', // Kolkata
    '380001', '380015' // Ahmedabad
  ],
  SOUTH_INDIA: [
    '560001', '560002', '560034', '560100', '560102', '560103', '560068', '560076', '570001', '575001', // Karnataka
    '600001', '600018', '600028', '600096', '641001', '625001', // Tamil Nadu
    '500001', '500032', '500081', '500084', '530001', '520001', // Telangana & AP
    '682001', '682016', '682017', '682020', '695001', '673001'  // Kerala
  ],
  NORTH_INDIA: [
    '110001', '110016', '110020', '110024', '110092', // Delhi
    '201301', '201309', '201305', '201010', '226001', '208001', // UP & NCR
    '122001', '122002', '122018', '121001', // Haryana & Gurugram
    '160001', '141001', '143001', // Punjab & Chandigarh
    '302001', '302020', '342001' // Rajasthan
  ],
  WEST_INDIA: [
    '400001', '400050', '400076', '400092', '400601', '400703', // Mumbai MMR
    '411001', '411004', '411014', '411028', '411038', '422001', // Maharashtra
    '380001', '380015', '395001', '390001', '360001', // Gujarat
    '403001', '403501' // Goa
  ],
  EAST_AND_CENTRAL: [
    '700001', '700019', '700091', '711101', // West Bengal
    '751001', '753001', // Odisha
    '800001', '834001', // Bihar & Jharkhand
    '462001', '452001', '492001', // MP & Chhattisgarh
    '781001' // Assam & NE
  ]
};

export interface DeliverabilityCheckResult {
  isDeliverable: boolean;
  pincode: string;
  vendorId?: string;
  vendorName?: string;
  shippingFee: number;
  isFreeDelivery: boolean;
  estimatedDeliveryDays: number;
  deliveryDateText: string;
  courierPartner: string;
  message: string;
}

export interface VendorCartGroup {
  vendorId: string;
  vendorName: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  isFreeDelivery: boolean;
  isDeliverable: boolean;
  undeliverableItems: CartItem[];
}

export interface CartDeliverabilityResult {
  isValid: boolean;
  totalShippingFee: number;
  vendorGroups: Record<string, VendorCartGroup>;
  undeliverableCount: number;
  undeliverableItems: CartItem[];
  errorSummary?: string;
}

// Clean 6-digit PIN code
export function cleanPincode(pin: string): string {
  if (!pin) return '';
  return pin.trim().replace(/\D/g, '').slice(0, 6);
}

// Format expected delivery date string (e.g. "Tuesday, Oct 20")
export function getEstimatedDeliveryDate(days: number): string {
  const target = new Date();
  target.setDate(target.getDate() + days);
  return target.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Checks deliverability of a specific product to a given customer pincode.
 */
export function checkProductDeliverability(
  product: StoreProduct,
  customerPincode: string,
  vendor?: VendorProfile
): DeliverabilityCheckResult {
  const pin = cleanPincode(customerPincode);

  if (pin.length !== 6) {
    return {
      isDeliverable: false,
      pincode: pin,
      shippingFee: 0,
      isFreeDelivery: false,
      estimatedDeliveryDays: 0,
      deliveryDateText: 'N/A',
      courierPartner: 'N/A',
      message: 'Please enter a valid 6-digit Indian Postal Code.'
    };
  }

  const vendorName = product.vendorName || vendor?.storeName || 'Vernunt Certified Vendor';
  const vendorId = product.vendorId || vendor?.id;

  // Determine if product is serviceable
  let isDeliverable = false;

  if (product.isAllIndiaDelivery) {
    isDeliverable = true;
  } else if (product.serviceablePincodes && product.serviceablePincodes.length > 0) {
    isDeliverable = product.serviceablePincodes.includes(pin);
  } else if (vendor?.serviceablePincodes && vendor.serviceablePincodes.length > 0) {
    isDeliverable = vendor.serviceablePincodes.includes(pin);
  } else {
    // Default fallback: if no explicit restrictions configured by vendor, available pan-India
    isDeliverable = true;
  }

  if (!isDeliverable) {
    return {
      isDeliverable: false,
      pincode: pin,
      vendorId,
      vendorName,
      shippingFee: 0,
      isFreeDelivery: false,
      estimatedDeliveryDays: 0,
      deliveryDateText: 'Not Available',
      courierPartner: 'N/A',
      message: `Sorry, this item is not deliverable to PIN ${pin} by ${vendorName}.`
    };
  }

  // Calculate Shipping Fee
  let fee = 49; // Standard fallback
  if (product.pincodeShippingRates && product.pincodeShippingRates[pin] !== undefined) {
    fee = product.pincodeShippingRates[pin];
  } else if (vendor?.pincodeShippingOverrides && vendor.pincodeShippingOverrides[pin] !== undefined) {
    fee = vendor.pincodeShippingOverrides[pin];
  } else if (product.defaultShippingFee !== undefined) {
    fee = product.defaultShippingFee;
  } else if (vendor?.defaultShippingFee !== undefined) {
    fee = vendor.defaultShippingFee;
  }

  // Check Free Shipping Threshold
  const freeThreshold = vendor?.freeShippingThreshold || 499;
  const isFreeDelivery = product.price >= freeThreshold || fee === 0;
  const finalFee = isFreeDelivery ? 0 : fee;

  // Estimate delivery days
  // If first 3 digits match vendor pincode, local delivery (1-2 days)
  let days = product.deliveryDaysEstimate || 3;
  let courier = 'BlueDart Priority / Delhivery Express';

  const vendorPinPrefix = vendor?.address?.pincode?.slice(0, 3) || vendor?.pickupAddress?.pincode?.slice(0, 3);
  const custPinPrefix = pin.slice(0, 3);

  if (vendorPinPrefix && vendorPinPrefix === custPinPrefix) {
    days = 1;
    courier = 'Local Warehouse Express (Same-Day / Next-Day)';
  } else if (vendor?.address?.state && isNearbyState(vendor.address.state, pin)) {
    days = 2;
    courier = 'Shadowfax Regional Priority';
  } else {
    days = Math.max(3, product.deliveryDaysEstimate || 3);
  }

  const deliveryDateText = getEstimatedDeliveryDate(days);

  return {
    isDeliverable: true,
    pincode: pin,
    vendorId,
    vendorName,
    shippingFee: finalFee,
    isFreeDelivery,
    estimatedDeliveryDays: days,
    deliveryDateText,
    courierPartner: courier,
    message: isFreeDelivery
      ? `🎉 FREE Delivery to PIN ${pin} by ${deliveryDateText}`
      : `🚚 Delivery to PIN ${pin} for ₹${finalFee} by ${deliveryDateText}`
  };
}

// Simple heuristic for neighboring state based on PIN first digit
function isNearbyState(vendorState: string, pin: string): boolean {
  const pinFirst = pin.charAt(0);
  if (vendorState.toLowerCase().includes('karnataka') && (pinFirst === '5' || pinFirst === '6')) return true;
  if (vendorState.toLowerCase().includes('maharashtra') && (pinFirst === '4' || pinFirst === '3')) return true;
  if (vendorState.toLowerCase().includes('delhi') && (pinFirst === '1' || pinFirst === '2')) return true;
  return false;
}

/**
 * Validates all items in the customer's cart against their delivery pincode.
 * Groups items by vendor to compute separate vendor shipping charges and thresholds.
 */
export function validateCartForDelivery(
  cartItems: CartItem[],
  customerPincode: string,
  vendors: VendorProfile[]
): CartDeliverabilityResult {
  const pin = cleanPincode(customerPincode);
  const vendorMap = new Map<string, VendorProfile>();
  vendors.forEach(v => vendorMap.set(v.id, v));

  const vendorGroups: Record<string, VendorCartGroup> = {};
  const undeliverableItems: CartItem[] = [];

  // Group items by vendor
  cartItems.forEach(item => {
    const vId = item.vendorId || item.product?.vendorId || 'direct-vernunt';
    const vName = item.vendorName || item.product?.vendorName || 'Vernunt Certified Store';

    if (!vendorGroups[vId]) {
      vendorGroups[vId] = {
        vendorId: vId,
        vendorName: vName,
        items: [],
        subtotal: 0,
        shippingFee: 0,
        isFreeDelivery: false,
        isDeliverable: true,
        undeliverableItems: []
      };
    }

    vendorGroups[vId].items.push(item);
    vendorGroups[vId].subtotal += item.totalPrice || (item.unitPrice * item.quantity);

    // Check deliverability of this item
    const vendorProfile = vendorMap.get(vId);
    const check = checkProductDeliverability(item.product, pin, vendorProfile);

    if (!check.isDeliverable) {
      vendorGroups[vId].isDeliverable = false;
      vendorGroups[vId].undeliverableItems.push(item);
      undeliverableItems.push(item);
    }
  });

  // Calculate shipping per vendor
  let totalShippingFee = 0;

  Object.values(vendorGroups).forEach(group => {
    if (!group.isDeliverable) {
      group.shippingFee = 0;
      return;
    }

    const vendorProfile = vendorMap.get(group.vendorId);
    const freeThreshold = vendorProfile?.freeShippingThreshold ?? 499;

    if (group.subtotal >= freeThreshold) {
      group.isFreeDelivery = true;
      group.shippingFee = 0;
    } else {
      // Find highest product shipping fee or vendor default
      let maxFee = vendorProfile?.defaultShippingFee ?? 49;
      if (vendorProfile?.pincodeShippingOverrides?.[pin] !== undefined) {
        maxFee = vendorProfile.pincodeShippingOverrides[pin];
      }

      group.items.forEach(it => {
        if (it.product?.pincodeShippingRates?.[pin] !== undefined) {
          maxFee = Math.max(maxFee, it.product.pincodeShippingRates[pin]);
        } else if (it.product?.defaultShippingFee !== undefined) {
          maxFee = Math.max(maxFee, it.product.defaultShippingFee);
        }
      });

      group.shippingFee = maxFee;
      totalShippingFee += maxFee;
    }
  });

  const isValid = undeliverableItems.length === 0 && pin.length === 6;

  let errorSummary: string | undefined = undefined;
  if (pin.length !== 6) {
    errorSummary = 'Please enter a valid 6-digit delivery pincode.';
  } else if (undeliverableItems.length > 0) {
    const names = undeliverableItems.map(i => `"${i.product.name}"`).join(', ');
    errorSummary = `The following items cannot be delivered to PIN ${pin}: ${names}. Please remove them or change your delivery pincode.`;
  }

  return {
    isValid,
    totalShippingFee,
    vendorGroups,
    undeliverableCount: undeliverableItems.length,
    undeliverableItems,
    errorSummary
  };
}
