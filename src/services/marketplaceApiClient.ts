import { VendorProfile, VendorStatus, VendorDashboardStats } from '../types/vendor.ts';
import { StoreProduct, StoreOrder } from '../types/store.ts';
import { 
  getStoredVendors, saveStoredVendors
} from '../data/storeVendors.ts';
import { 
  getStoredProducts, saveStoredProducts,
  getStoredOrders, saveStoredOrders 
} from '../data/storeProducts.ts';
import { DeliverabilityCheckResult, CartDeliverabilityResult, checkProductDeliverability, validateCartForDelivery } from '../utils/pincodeChecker.ts';

export class MarketplaceApiClient {
  /**
   * Fetch all marketplace vendors
   */
  static async getVendors(filterStatus?: string): Promise<VendorProfile[]> {
    try {
      const url = filterStatus && filterStatus !== 'all' 
        ? `/api/marketplace/vendors?status=${filterStatus}` 
        : '/api/marketplace/vendors';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.vendors)) {
          saveStoredVendors(data.vendors);
          return data.vendors;
        }
      }
    } catch {
      // Local fallback
    }
    const local = getStoredVendors();
    if (filterStatus && filterStatus !== 'all') {
      return local.filter(v => v.status === filterStatus);
    }
    return local;
  }

  /**
   * Register a new vendor
   */
  static async registerVendor(vendorData: Partial<VendorProfile>): Promise<{ success: boolean; vendor?: VendorProfile; error?: string }> {
    try {
      const res = await fetch('/api/marketplace/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
      });
      const data = await res.json();
      if (res.ok && data.success && data.vendor) {
        const current = getStoredVendors();
        saveStoredVendors([data.vendor, ...current.filter(v => v.id !== data.vendor.id)]);
        return { success: true, vendor: data.vendor };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch (err: any) {
      // Local fallback registration
      const newVendor: VendorProfile = {
        id: 'vend-' + Date.now(),
        slug: vendorData.storeName?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'new-store',
        storeName: vendorData.storeName || 'New Store',
        ownerName: vendorData.ownerName || vendorData.contactPerson || 'Store Owner',
        email: vendorData.email || '',
        phone: vendorData.phone || '',
        bio: vendorData.bio || '',
        logo: vendorData.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
        bannerImage: vendorData.bannerImage || 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1200&auto=format&fit=crop&q=80',
        businessType: vendorData.businessType || 'Proprietorship',
        contactPerson: vendorData.contactPerson || vendorData.ownerName,
        address: vendorData.address || {
          street: '', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', country: 'India'
        },
        pickupAddress: vendorData.pickupAddress || vendorData.address || {
          street: '', city: 'Bengaluru', state: 'Karnataka', pincode: '560001', country: 'India'
        },
        status: 'pending',
        isVerified: false,
        rating: 5.0,
        totalReviews: 0,
        joinedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        bankDetails: vendorData.bankDetails || {
          accountHolder: vendorData.storeName || '',
          bankName: 'HDFC Bank',
          accountNumber: '',
          ifscCode: '',
          upiId: ''
        },
        commissionType: 'percentage',
        commissionRate: 10,
        balance: 0,
        totalSales: 0,
        totalEarnings: 0,
        totalOrders: 0,
        primaryServiceablePincodes: vendorData.primaryServiceablePincodes || [],
        serviceablePincodes: vendorData.serviceablePincodes || vendorData.primaryServiceablePincodes || [],
        defaultShippingFee: vendorData.defaultShippingFee || 49,
        freeShippingThreshold: vendorData.freeShippingThreshold || 499,
        expressShippingFee: vendorData.expressShippingFee || 89,
        pincodeShippingOverrides: vendorData.pincodeShippingOverrides || {},
        verificationDocuments: vendorData.verificationDocuments || {},
        slaAccepted: true,
        slaAcceptedAt: new Date().toISOString()
      };
      const current = getStoredVendors();
      saveStoredVendors([newVendor, ...current]);
      return { success: true, vendor: newVendor };
    }
  }

  /**
   * Update Vendor Profile or Status
   */
  static async updateVendor(vendorId: string, updates: Partial<VendorProfile>): Promise<{ success: boolean; vendor?: VendorProfile; error?: string }> {
    try {
      const res = await fetch(`/api/marketplace/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok && data.success && data.vendor) {
        const current = getStoredVendors();
        saveStoredVendors(current.map(v => v.id === vendorId ? data.vendor : v));
        return { success: true, vendor: data.vendor };
      }
    } catch {
      // Local fallback
    }
    const current = getStoredVendors();
    let updatedVendor: VendorProfile | undefined;
    const updated = current.map(v => {
      if (v.id === vendorId) {
        updatedVendor = { ...v, ...updates };
        return updatedVendor;
      }
      return v;
    });
    saveStoredVendors(updated);
    return { success: true, vendor: updatedVendor };
  }

  /**
   * Fetch 14 KPI Dashboard Stats for a Vendor
   */
  static async getVendorStats(vendorId: string): Promise<VendorDashboardStats | null> {
    try {
      const res = await fetch(`/api/marketplace/vendors/${vendorId}/stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          return data.stats;
        }
      }
    } catch {
      // Fallback calculation from local data
    }

    const vendors = getStoredVendors();
    const vendor = vendors.find(v => v.id === vendorId);
    const products = getStoredProducts().filter(p => p.vendorId === vendorId || p.brand === vendor?.storeName);
    const orders = getStoredOrders().filter(o => 
      o.items.some(i => i.vendorId === vendorId || i.product?.vendorId === vendorId || i.product?.brand === vendor?.storeName)
    );

    const coveredPincodes = new Set<string>(vendor?.serviceablePincodes || []);
    products.forEach(p => p.serviceablePincodes?.forEach(pin => coveredPincodes.add(pin)));

    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.approvalStatus === 'approved' && p.stockStatus !== 'outofstock').length,
      pendingProducts: products.filter(p => p.approvalStatus === 'pending' || p.approvalStatus === 'draft').length,
      totalOrders: orders.length,
      newOrders: orders.filter(o => o.orderStatus === 'pending').length,
      awaitingShipmentOrders: orders.filter(o => o.orderStatus === 'processing' || o.orderStatus === 'packed').length,
      shippedOrders: orders.filter(o => o.orderStatus === 'shipped' || o.orderStatus === 'out_for_delivery').length,
      deliveredOrders: orders.filter(o => o.orderStatus === 'delivered').length,
      cancelledOrders: orders.filter(o => o.orderStatus === 'cancelled').length,
      totalSales: vendor?.totalSales || orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      shippingChargesCollected: orders.reduce((sum, o) => sum + (o.shippingFee || 0), 0),
      availableInventory: products.reduce((sum, p) => sum + (p.stockQuantity || 0), 0),
      pincodeCoverageCount: coveredPincodes.size
    };
  }

  /**
   * Bulk Assign Pincodes to Vendor Products
   */
  static async bulkAssignPincodes(payload: {
    vendorId: string;
    productIds?: string[] | 'all';
    pincodes: string[] | string;
    mode?: 'add' | 'replace';
    customShippingFee?: number;
  }): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const res = await fetch('/api/marketplace/pincodes/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Also update local storage products & vendors
        const localProds = getStoredProducts();
        const pins = Array.isArray(payload.pincodes)
          ? payload.pincodes
          : payload.pincodes.split(/[\s,\n]+/).filter(Boolean);

        const updated = localProds.map(p => {
          if (p.vendorId === payload.vendorId && (payload.productIds === 'all' || !payload.productIds || payload.productIds.includes(p.id))) {
            const nextPins = payload.mode === 'replace' 
              ? Array.from(new Set(pins))
              : Array.from(new Set([...(p.serviceablePincodes || []), ...pins]));
            const nextRates = { ...(p.pincodeShippingRates || {}) };
            if (payload.customShippingFee !== undefined) {
              pins.forEach(pin => { nextRates[pin] = payload.customShippingFee!; });
            }
            return { ...p, serviceablePincodes: nextPins, pincodeShippingRates: nextRates };
          }
          return p;
        });
        saveStoredProducts(updated);

        return { success: true, message: data.message, count: data.pincodesCount };
      }
    } catch {
      // Local fallback
    }

    const localProds = getStoredProducts();
    const pins = Array.isArray(payload.pincodes)
      ? payload.pincodes
      : payload.pincodes.split(/[\s,\n]+/).filter(Boolean);

    let updatedCount = 0;
    const updated = localProds.map(p => {
      if (p.vendorId === payload.vendorId && (payload.productIds === 'all' || !payload.productIds || payload.productIds.includes(p.id))) {
        const nextPins = payload.mode === 'replace'
          ? Array.from(new Set(pins))
          : Array.from(new Set([...(p.serviceablePincodes || []), ...pins]));
        const nextRates = { ...(p.pincodeShippingRates || {}) };
        if (payload.customShippingFee !== undefined) {
          pins.forEach(pin => { nextRates[pin] = payload.customShippingFee!; });
        }
        updatedCount++;
        return { ...p, serviceablePincodes: nextPins, pincodeShippingRates: nextRates };
      }
      return p;
    });
    saveStoredProducts(updated);

    return {
      success: true,
      message: `Assigned ${pins.length} pincodes across ${updatedCount} products.`,
      count: pins.length
    };
  }

  /**
   * Check Deliverability of a Product to a Customer Pincode
   */
  static async checkDeliverability(productId: string, pincode: string): Promise<DeliverabilityCheckResult> {
    try {
      const res = await fetch(`/api/marketplace/check-deliverability?productId=${productId}&pincode=${pincode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data;
        }
      }
    } catch {
      // Local fallback
    }

    const products = getStoredProducts();
    const vendors = getStoredVendors();
    const product = products.find(p => p.id === productId || p.slug === productId);

    if (!product) {
      return {
        isDeliverable: false,
        pincode,
        shippingFee: 0,
        isFreeDelivery: false,
        estimatedDeliveryDays: 0,
        deliveryDateText: 'N/A',
        courierPartner: 'N/A',
        message: 'Product not found.'
      };
    }

    const vendor = vendors.find(v => v.id === product.vendorId);
    return checkProductDeliverability(product, pincode, vendor);
  }

  /**
   * Update order status with tracking details
   */
  static async updateOrderStatus(payload: {
    orderId: string;
    status: string;
    courierPartner?: string;
    trackingNumber?: string;
    note?: string;
    vendorId?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/marketplace/orders/${payload.orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Sync local
        const orders = getStoredOrders();
        saveStoredOrders(orders.map(o => o.id === payload.orderId ? data.order : o));
        return { success: true, message: data.message };
      }
    } catch {
      // Local fallback
    }

    const orders = getStoredOrders();
    const updated = orders.map(o => {
      if (o.id === payload.orderId) {
        return {
          ...o,
          orderStatus: payload.status as any,
          courierPartner: payload.courierPartner || o.courierPartner,
          trackingNumber: payload.trackingNumber || o.trackingNumber,
          statusHistory: [
            ...o.statusHistory,
            {
              status: payload.status as any,
              timestamp: new Date().toLocaleString('en-IN'),
              note: payload.note || `Status updated to ${payload.status}. Tracking: ${payload.trackingNumber || 'N/A'}`
            }
          ]
        };
      }
      return o;
    });
    saveStoredOrders(updated);
    return { success: true, message: `Order #${payload.orderId} updated to ${payload.status}.` };
  }
}
