import type { StoreProduct, CartItem, DimensionalShippingRules } from '../types/store.ts';
import { DEFAULT_DIMENSIONAL_SHIPPING_RULES } from '../types/store.ts';
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

export interface CartShippingCalculation {
  totalDeadWeightGrams: number;
  totalDeadWeightKg: number;
  packageDimensions: { length: number; width: number; height: number };
  volumetricWeightGrams: number;
  volumetricWeightKg: number;
  chargeableWeightGrams: number;
  chargeableWeightKg: number;
  pincode: string;
  zoneName: string;
  zoneDescription: string;
  baseCharge: number;
  weightCharge: number;
  oversizeCharge: number;
  totalShippingFee: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  isCustomPincodeRate: boolean;
}

export const STORAGE_KEY_SHIPPING_RULES = 'vernunt_dimensional_shipping_rules_v2';

export function getStoredShippingRules(): DimensionalShippingRules {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SHIPPING_RULES);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_DIMENSIONAL_SHIPPING_RULES, ...parsed };
    }
  } catch (e) {
    console.debug('Failed to parse stored shipping rules:', e);
  }
  return DEFAULT_DIMENSIONAL_SHIPPING_RULES;
}

export function saveStoredShippingRules(rules: DimensionalShippingRules): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHIPPING_RULES, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save shipping rules:', e);
  }
}

/**
 * Calculates dynamic shipping charges based on actual product weight,
 * volumetric package dimensions (L × B × H), and customer destination PIN code.
 */
export function calculateCartDimensionalShipping(
  cart: CartItem[],
  pincode: string,
  rulesOverride?: DimensionalShippingRules,
  cartSubtotalOverride?: number
): CartShippingCalculation {
  const rules = rulesOverride || getStoredShippingRules();
  const cleanPin = cleanPincode(pincode);

  // 1. Calculate Dead Weight & Dimensions from products that use dynamic logistics
  let totalDeadWeightGrams = 0;
  let maxLength = 0;
  let maxWidth = 0;
  let totalHeight = 0;
  let totalSubtotal = cartSubtotalOverride ?? 0;
  let fixedCustomShippingTotal = 0;
  let hasDynamicWeightItems = false;
  let nonFreeItemsCount = 0;

  cart.forEach(item => {
    const qty = item.quantity || 1;
    const prod = item.product;

    if (cartSubtotalOverride === undefined) {
      totalSubtotal += (item.totalPrice || (item.unitPrice * qty));
    }

    const isProdFreeShipping = Boolean(
      prod?.isFreeShipping ||
      prod?.badges?.some(b => b.toLowerCase().includes('free shipping'))
    );

    if (isProdFreeShipping) {
      // Free shipping for this product - no shipping charges or weight added
      return;
    }

    nonFreeItemsCount += qty;

    const hasDeadWeight = typeof prod?.weightGrams === 'number' && prod.weightGrams > 0;
    const hasDimensions = Boolean(
      prod?.dimensionsCm &&
      (prod.dimensionsCm.length > 0 || prod.dimensionsCm.width > 0 || prod.dimensionsCm.height > 0)
    );

    if (hasDeadWeight || hasDimensions) {
      hasDynamicWeightItems = true;
      const weightPerUnit = hasDeadWeight ? prod.weightGrams! : 450;
      totalDeadWeightGrams += (weightPerUnit * qty);

      const l = prod?.dimensionsCm?.length || 20;
      const w = prod?.dimensionsCm?.width || 15;
      const h = prod?.dimensionsCm?.height || 8;

      maxLength = Math.max(maxLength, l);
      maxWidth = Math.max(maxWidth, w);
      totalHeight += (h * qty);
    } else {
      // No weight/dimensions provided: use product's custom flat shipping charge
      const itemCustomFee = typeof prod?.shippingFee === 'number'
        ? prod.shippingFee
        : (typeof prod?.defaultShippingFee === 'number' ? prod.defaultShippingFee : 49);
      fixedCustomShippingTotal += (itemCustomFee * qty);
    }
  });

  if (hasDynamicWeightItems) {
    if (maxLength === 0) maxLength = 20;
    if (maxWidth === 0) maxWidth = 15;
    if (totalHeight === 0) totalHeight = 10;
    if (totalDeadWeightGrams === 0) totalDeadWeightGrams = 500;
  }

  // 2. Volumetric Weight (cm³ / 5000 = kg)
  const divisor = rules.volumetricDivisor || 5000;
  const volWeightKg = hasDynamicWeightItems ? (maxLength * maxWidth * totalHeight) / divisor : 0;
  const volumetricWeightGrams = Math.round(volWeightKg * 1000);

  // 3. Chargeable Weight is max of dead weight vs volumetric
  const chargeableWeightGrams = Math.max(totalDeadWeightGrams, volumetricWeightGrams);
  const chargeableWeightKg = Number((chargeableWeightGrams / 1000).toFixed(2));

  // 4. Determine Zone and Base Charge from PIN Code
  let baseCharge = hasDynamicWeightItems ? rules.baseRateNational : 0;
  let zoneName = hasDynamicWeightItems ? 'National Zone' : 'Standard Shipping';
  let zoneDescription = hasDynamicWeightItems ? 'Rest of India Standard Surface' : 'Flat Product Shipping';
  let isCustomPincodeRate = false;

  if (hasDynamicWeightItems) {
    if (rules.customPincodeRates && cleanPin && rules.customPincodeRates[cleanPin] !== undefined) {
      baseCharge = rules.customPincodeRates[cleanPin];
      zoneName = `Custom PIN (${cleanPin})`;
      zoneDescription = `Special Admin Configured Rate for PIN ${cleanPin}`;
      isCustomPincodeRate = true;
    } else if (cleanPin.startsWith('560')) {
      baseCharge = rules.baseRateLocal;
      zoneName = 'Local Bengaluru Hub';
      zoneDescription = 'Local Hub Delivery (Within 24 Hours)';
    } else if (
      cleanPin.startsWith('57') || cleanPin.startsWith('58') || // Karnataka
      (Number(cleanPin.slice(0, 2)) >= 60 && Number(cleanPin.slice(0, 2)) <= 64) || // Tamil Nadu
      (Number(cleanPin.slice(0, 2)) >= 50 && Number(cleanPin.slice(0, 2)) <= 53) || // Telangana / AP
      (Number(cleanPin.slice(0, 2)) >= 67 && Number(cleanPin.slice(0, 2)) <= 69)    // Kerala
    ) {
      baseCharge = rules.baseRateRegional;
      zoneName = 'South India Regional';
      zoneDescription = 'Regional Priority Surface & Air';
    } else if (
      cleanPin.startsWith('110') || // Delhi
      cleanPin.startsWith('400') || // Mumbai
      cleanPin.startsWith('700') || // Kolkata
      cleanPin.startsWith('411') || // Pune
      cleanPin.startsWith('380')    // Ahmedabad
    ) {
      baseCharge = rules.baseRateMetro;
      zoneName = 'Tier-1 Metro Network';
      zoneDescription = 'Priority Metro Air Dispatch';
    } else if (
      cleanPin.startsWith('79') || cleanPin.startsWith('19') || cleanPin.startsWith('18') || cleanPin.startsWith('737')
    ) {
      baseCharge = rules.baseRateSpecial;
      zoneName = 'Remote / Hills / NE Zone';
      zoneDescription = 'Special Terrain Logistics';
    } else {
      baseCharge = rules.baseRateNational;
      zoneName = 'National Interstate';
      zoneDescription = 'Standard All-India Express Transport';
    }
  }

  // 5. Incremental Weight Charge
  let weightCharge = 0;
  const baseWeightGrams = rules.baseWeightGrams || 500;
  const stepGrams = rules.additionalWeightStepGrams || 500;
  const stepRate = rules.additionalRatePerStep || 25;

  if (hasDynamicWeightItems && chargeableWeightGrams > baseWeightGrams) {
    const extraGrams = chargeableWeightGrams - baseWeightGrams;
    const steps = Math.ceil(extraGrams / stepGrams);
    weightCharge = steps * stepRate;
  }

  // 6. Oversize Dimension Surcharge
  let oversizeCharge = 0;
  const oversizeThreshold = rules.oversizeLengthThresholdCm || 40;
  if (hasDynamicWeightItems && (maxLength > oversizeThreshold || maxWidth > oversizeThreshold || totalHeight > oversizeThreshold)) {
    oversizeCharge = rules.oversizeSurcharge || 30;
  }

  // 7. Free Shipping & Final Total Check
  const freeThreshold = rules.freeShippingThreshold || 499;
  const reachesFreeThreshold = totalSubtotal >= freeThreshold;
  const allItemsFree = cart.length > 0 && nonFreeItemsCount === 0;
  const isFreeShipping = allItemsFree || reachesFreeThreshold;

  const rawTotal = (hasDynamicWeightItems ? (baseCharge + weightCharge + oversizeCharge) : 0) + fixedCustomShippingTotal;
  const totalShippingFee = isFreeShipping ? 0 : rawTotal;

  return {
    totalDeadWeightGrams,
    totalDeadWeightKg: Number((totalDeadWeightGrams / 1000).toFixed(2)),
    packageDimensions: { length: maxLength, width: maxWidth, height: totalHeight },
    volumetricWeightGrams,
    volumetricWeightKg: Number((volumetricWeightGrams / 1000).toFixed(2)),
    chargeableWeightGrams,
    chargeableWeightKg,
    pincode: cleanPin || '560102',
    zoneName,
    zoneDescription,
    baseCharge,
    weightCharge,
    oversizeCharge,
    totalShippingFee,
    isFreeShipping,
    freeShippingThreshold: freeThreshold,
    isCustomPincodeRate
  };
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
  const isExplicitFreeShipping = Boolean(
    product.isFreeShipping ||
    product.badges?.some(b => b.toLowerCase().includes('free shipping'))
  );

  let fee = 49; // Standard fallback
  if (isExplicitFreeShipping) {
    fee = 0;
  } else if (typeof product.shippingFee === 'number') {
    fee = product.shippingFee;
  } else if (product.pincodeShippingRates && product.pincodeShippingRates[pin] !== undefined) {
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
  const isFreeDelivery = isExplicitFreeShipping || product.price >= freeThreshold || fee === 0;
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
