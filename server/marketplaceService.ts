import type { Request, Response, Express } from 'express';
import { INITIAL_VENDORS } from '../src/data/storeVendors.ts';
import { INITIAL_STORE_PRODUCTS, INITIAL_MOCK_ORDERS } from '../src/data/storeProducts.ts';
import type { VendorProfile, VendorStatus, VendorDashboardStats } from '../src/types/vendor.ts';
import type { StoreProduct, StoreOrder, CartItem, OrderStatus } from '../src/types/store.ts';
import { checkProductDeliverability, validateCartForDelivery, cleanPincode } from '../src/utils/pincodeChecker.ts';

// In-Memory Marketplace Store with Persistence Cache
const vendorsList: VendorProfile[] = JSON.parse(JSON.stringify(INITIAL_VENDORS));
const productsList: StoreProduct[] = JSON.parse(JSON.stringify(INITIAL_STORE_PRODUCTS));
const ordersList: StoreOrder[] = JSON.parse(JSON.stringify(INITIAL_MOCK_ORDERS));

export function getMarketplaceVendors(): VendorProfile[] {
  return vendorsList;
}

export function getMarketplaceProducts(): StoreProduct[] {
  return productsList;
}

export function registerMarketplaceRoutes(app: Express) {
  console.log('[Marketplace Server] Registering Multi-Vendor Marketplace Endpoints...');

  // =========================================================================
  // 1. VENDORS MANAGEMENT
  // =========================================================================

  // GET /api/marketplace/vendors
  app.get('/api/marketplace/vendors', (req: Request, res: Response) => {
    try {
      const { status, search } = req.query;
      let result = vendorsList;

      if (status && typeof status === 'string' && status !== 'all') {
        result = result.filter(v => v.status === status);
      }

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        result = result.filter(v => 
          v.storeName.toLowerCase().includes(q) ||
          v.ownerName.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          v.address.city.toLowerCase().includes(q)
        );
      }

      res.json({ success: true, count: result.length, vendors: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch vendors' });
    }
  });

  // GET /api/marketplace/vendors/:id
  app.get('/api/marketplace/vendors/:id', (req: Request, res: Response) => {
    try {
      const vendor = vendorsList.find(v => v.id === req.params.id || v.slug === req.params.id);
      if (!vendor) {
        return res.status(404).json({ success: false, error: 'Vendor not found' });
      }
      res.json({ success: true, vendor });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // POST /api/marketplace/vendors (Vendor Registration)
  app.post('/api/marketplace/vendors', (req: Request, res: Response) => {
    try {
      const data = req.body || {};
      if (!data.storeName || !data.email) {
        return res.status(400).json({ success: false, error: 'Store name and email are required.' });
      }

      // Check if email or storeName already exists
      const existing = vendorsList.find(v => v.email.toLowerCase() === data.email.toLowerCase());
      if (existing) {
        return res.status(409).json({ success: false, error: 'A vendor with this email address already exists.' });
      }

      const id = 'vend-' + Date.now();
      const slug = data.slug || data.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const newVendor: VendorProfile = {
        id,
        slug,
        storeName: data.storeName,
        ownerName: data.ownerName || data.contactPerson || 'Store Owner',
        email: data.email,
        phone: data.phone || '',
        bio: data.bio || `Welcome to ${data.storeName} on Vernunt Marketplace.`,
        logo: data.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
        bannerImage: data.bannerImage || 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=1200&auto=format&fit=crop&q=80',
        businessType: data.businessType || 'Proprietorship',
        contactPerson: data.contactPerson || data.ownerName,
        address: data.address || {
          street: data.street || '',
          city: data.city || 'Bengaluru',
          state: data.state || 'Karnataka',
          pincode: data.pincode || '560001',
          country: 'India'
        },
        pickupAddress: data.pickupAddress || data.address || {
          street: data.street || '',
          city: data.city || 'Bengaluru',
          state: data.state || 'Karnataka',
          pincode: data.pincode || '560001',
          country: 'India'
        },
        status: data.autoApprove ? 'active' : 'pending',
        isVerified: data.autoApprove ? true : false,
        rating: 5.0,
        totalReviews: 0,
        joinedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        gstNumber: data.gstNumber || '',
        panNumber: data.panNumber || '',
        bankDetails: data.bankDetails || {
          accountHolder: data.accountHolder || data.storeName,
          bankName: data.bankName || 'HDFC Bank',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          upiId: data.upiId || ''
        },
        commissionType: 'percentage',
        commissionRate: data.commissionRate || 10,
        balance: 0,
        totalSales: 0,
        totalEarnings: 0,
        totalOrders: 0,
        defaultShippingFee: data.defaultShippingFee !== undefined ? Number(data.defaultShippingFee) : 49,
        freeShippingThreshold: data.freeShippingThreshold !== undefined ? Number(data.freeShippingThreshold) : 499,
        expressShippingFee: data.expressShippingFee !== undefined ? Number(data.expressShippingFee) : 89,
        primaryServiceablePincodes: Array.isArray(data.primaryServiceablePincodes) ? data.primaryServiceablePincodes : [],
        serviceablePincodes: Array.isArray(data.serviceablePincodes) ? data.serviceablePincodes : (Array.isArray(data.primaryServiceablePincodes) ? data.primaryServiceablePincodes : []),
        pincodeShippingOverrides: data.pincodeShippingOverrides || {},
        shippingRules: data.shippingRules || [],
        verificationDocuments: data.verificationDocuments || {},
        slaAccepted: data.slaAccepted || false,
        slaAcceptedAt: data.slaAccepted ? new Date().toISOString() : undefined,
        slaType: 'B2B Marketplace & Logistics SLA',
        slaVersion: '2026-v2.1',
        supportEmail: data.email,
        supportPhone: data.phone
      };

      vendorsList.unshift(newVendor);

      res.status(201).json({
        success: true,
        message: newVendor.status === 'active'
          ? 'Vendor account registered and activated successfully!'
          : 'Vendor registered successfully! Account is pending administrator approval.',
        vendor: newVendor
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Vendor registration failed.' });
    }
  });

  // PUT /api/marketplace/vendors/:id (Update Vendor Profile, Status, Settings)
  app.put('/api/marketplace/vendors/:id', (req: Request, res: Response) => {
    try {
      const idx = vendorsList.findIndex(v => v.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Vendor not found' });
      }

      const updates = req.body || {};
      vendorsList[idx] = {
        ...vendorsList[idx],
        ...updates,
        // Preserve unchangeable IDs
        id: vendorsList[idx].id
      };

      res.json({
        success: true,
        message: 'Vendor updated successfully',
        vendor: vendorsList[idx]
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // GET /api/marketplace/vendors/:id/stats (14 KPI Metrics Required by Specification)
  app.get('/api/marketplace/vendors/:id/stats', (req: Request, res: Response) => {
    try {
      const vendorId = req.params.id;
      const vendor = vendorsList.find(v => v.id === vendorId);
      if (!vendor) {
        return res.status(404).json({ success: false, error: 'Vendor not found' });
      }

      // Filter products for this vendor
      const vendorProds = productsList.filter(p => p.vendorId === vendorId || p.brand === vendor.storeName);

      const totalProducts = vendorProds.length;
      const activeProducts = vendorProds.filter(p => p.approvalStatus === 'approved' && p.stockStatus !== 'outofstock').length;
      const pendingProducts = vendorProds.filter(p => p.approvalStatus === 'pending' || p.approvalStatus === 'draft').length;
      const availableInventory = vendorProds.reduce((sum, p) => sum + (p.stockQuantity || 0), 0);

      // Filter orders containing items for this vendor
      const vendorOrders = ordersList.filter(order => 
        order.items.some(item => (item.vendorId === vendorId || item.product?.vendorId === vendorId || item.product?.brand === vendor.storeName))
      );

      const totalOrders = vendorOrders.length;
      const newOrders = vendorOrders.filter(o => o.orderStatus === 'pending').length;
      const awaitingShipmentOrders = vendorOrders.filter(o => o.orderStatus === 'processing' || o.orderStatus === 'packed').length;
      const shippedOrders = vendorOrders.filter(o => o.orderStatus === 'shipped' || o.orderStatus === 'out_for_delivery').length;
      const deliveredOrders = vendorOrders.filter(o => o.orderStatus === 'delivered').length;
      const cancelledOrders = vendorOrders.filter(o => o.orderStatus === 'cancelled' || o.orderStatus === 'refunded').length;

      // Compute total sales for this vendor
      let totalSales = 0;
      let shippingChargesCollected = 0;

      vendorOrders.forEach(o => {
        if (o.orderStatus !== 'cancelled' && o.orderStatus !== 'refunded') {
          o.items.forEach(item => {
            if (item.vendorId === vendorId || item.product?.vendorId === vendorId || item.product?.brand === vendor.storeName) {
              totalSales += (item.totalPrice || (item.unitPrice * item.quantity));
            }
          });
          shippingChargesCollected += (o.shippingFee || 0);
        }
      });

      // Best-selling products
      const salesCountMap: Record<string, { product: StoreProduct; units: number; revenue: number }> = {};
      vendorProds.forEach(p => {
        salesCountMap[p.id] = { product: p, units: 0, revenue: 0 };
      });

      vendorOrders.forEach(o => {
        o.items.forEach(item => {
          const pid = item.productId || item.product?.id;
          if (pid && salesCountMap[pid]) {
            salesCountMap[pid].units += item.quantity || 1;
            salesCountMap[pid].revenue += item.totalPrice || (item.unitPrice * item.quantity);
          }
        });
      });

      const bestSellingProducts = Object.values(salesCountMap)
        .sort((a, b) => b.units - a.units)
        .slice(0, 5);

      // Unique serviceable pincodes coverage
      const coveredPincodes = new Set<string>(vendor.serviceablePincodes || []);
      vendorProds.forEach(p => {
        p.serviceablePincodes?.forEach(pin => coveredPincodes.add(pin));
      });

      const stats: VendorDashboardStats = {
        totalProducts,
        activeProducts,
        pendingProducts,
        totalOrders,
        newOrders,
        awaitingShipmentOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalSales: totalSales || vendor.totalSales,
        shippingChargesCollected,
        availableInventory,
        pincodeCoverageCount: coveredPincodes.size
      };

      res.json({
        success: true,
        stats,
        recentOrders: vendorOrders.slice(0, 5),
        bestSellingProducts,
        serviceablePincodesCount: coveredPincodes.size
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // PUT /api/marketplace/vendors/:id/shipping-charges (Update Custom Shipping Rules)
  app.put('/api/marketplace/vendors/:id/shipping-charges', (req: Request, res: Response) => {
    try {
      const vendor = vendorsList.find(v => v.id === req.params.id);
      if (!vendor) {
        return res.status(404).json({ success: false, error: 'Vendor not found' });
      }

      const { defaultShippingFee, freeShippingThreshold, expressShippingFee, pincodeShippingOverrides, shippingRules } = req.body || {};

      if (defaultShippingFee !== undefined) vendor.defaultShippingFee = Number(defaultShippingFee);
      if (freeShippingThreshold !== undefined) vendor.freeShippingThreshold = Number(freeShippingThreshold);
      if (expressShippingFee !== undefined) vendor.expressShippingFee = Number(expressShippingFee);
      if (pincodeShippingOverrides !== undefined) vendor.pincodeShippingOverrides = pincodeShippingOverrides;
      if (shippingRules !== undefined) vendor.shippingRules = shippingRules;

      res.json({
        success: true,
        message: 'Shipping charges & delivery thresholds updated successfully',
        vendor
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // =========================================================================
  // 2. PRODUCTS MANAGEMENT
  // =========================================================================

  // GET /api/marketplace/products
  app.get('/api/marketplace/products', (req: Request, res: Response) => {
    try {
      const { vendorId, category, status, search } = req.query;
      let result = productsList;

      if (vendorId && typeof vendorId === 'string') {
        result = result.filter(p => p.vendorId === vendorId || p.vendorSlug === vendorId);
      }

      if (category && typeof category === 'string' && category !== 'all') {
        result = result.filter(p => p.category === category);
      }

      if (status && typeof status === 'string' && status !== 'all') {
        result = result.filter(p => p.approvalStatus === status);
      }

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        result = result.filter(p => 
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
        );
      }

      res.json({ success: true, count: result.length, products: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // POST /api/marketplace/products (Vendor Product Creation)
  app.post('/api/marketplace/products', (req: Request, res: Response) => {
    try {
      const data = req.body || {};
      if (!data.name || data.price === undefined) {
        return res.status(400).json({ success: false, error: 'Product name and price are required.' });
      }

      const vendor = vendorsList.find(v => v.id === data.vendorId);
      const id = 'prod-' + Date.now();
      const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Parse serviceable pincodes
      let pincodes: string[] = [];
      if (Array.isArray(data.serviceablePincodes)) {
        pincodes = data.serviceablePincodes.map((p: any) => cleanPincode(String(p))).filter((p: string) => p.length === 6);
      } else if (typeof data.serviceablePincodes === 'string') {
        pincodes = data.serviceablePincodes.split(/[\s,\n]+/).map(cleanPincode).filter((p: string) => p.length === 6);
      }

      // If no pincodes specified, inherit vendor's serviceable pincodes
      if (pincodes.length === 0 && vendor?.serviceablePincodes && vendor.serviceablePincodes.length > 0) {
        pincodes = [...vendor.serviceablePincodes];
      }

      const newProduct: StoreProduct = {
        id,
        name: data.name,
        slug,
        shortDescription: data.shortDescription || '',
        description: data.description || '',
        price: Number(data.price),
        regularPrice: Number(data.regularPrice || data.price),
        salePrice: data.salePrice ? Number(data.salePrice) : undefined,
        onSale: !!data.salePrice || (Number(data.regularPrice || 0) > Number(data.price)),
        discountPercentage: data.discountPercentage || 0,
        sku: data.sku || ('SKU-' + Math.floor(1000 + Math.random() * 9000)),
        stockQuantity: Number(data.stockQuantity || 10),
        stockStatus: Number(data.stockQuantity || 10) > 0 ? 'instock' : 'outofstock',
        manageStock: data.manageStock !== false,
        lowStockThreshold: Number(data.lowStockThreshold || 5),
        category: data.category || 'Montessori & STEM',
        subcategory: data.subcategory,
        ageGroup: data.ageGroup || '3-6y',
        ageLabel: data.ageLabel || 'Ages 3-6 Years',
        featuredImage: data.featuredImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
        galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [data.featuredImage],
        tags: Array.isArray(data.tags) ? data.tags : ['Multi-Vendor', 'Child Safe'],
        attributes: data.attributes || [],
        variations: data.variations || [],
        rating: 5.0,
        reviewCount: 0,
        reviews: [],
        qaList: [],
        isFeatured: !!data.isFeatured,
        isBestSeller: false,
        isNewArrival: true,
        isDigital: !!data.isDigital,
        weightGrams: Number(data.weightGrams || 500),
        dimensionsCm: data.dimensionsCm || { length: 20, width: 15, height: 10 },
        badges: Array.isArray(data.badges) ? data.badges : ['100% Non-Toxic', 'BIS Certified'],
        hsnCode: data.hsnCode || '950300',
        gstRate: Number(data.gstRate || 12),
        brand: data.brand || vendor?.storeName || 'Vernunt Certified',
        deliveryDaysEstimate: Number(data.deliveryDaysEstimate || 3),
        vendorId: data.vendorId || vendor?.id,
        vendorName: vendor?.storeName || data.vendorName,
        vendorSlug: vendor?.slug || data.vendorSlug,
        approvalStatus: data.approvalStatus || (data.autoApprove ? 'approved' : 'pending'),
        isActive: data.isActive !== false,
        isAllIndiaDelivery: !!data.isAllIndiaDelivery,
        serviceablePincodes: pincodes,
        pincodeShippingRates: data.pincodeShippingRates || {},
        defaultShippingFee: data.defaultShippingFee !== undefined ? Number(data.defaultShippingFee) : vendor?.defaultShippingFee
      };

      productsList.unshift(newProduct);

      res.status(201).json({
        success: true,
        message: newProduct.approvalStatus === 'approved'
          ? 'Product created and published to marketplace!'
          : 'Product created successfully and submitted for admin review.',
        product: newProduct
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // PUT /api/marketplace/products/:id
  app.put('/api/marketplace/products/:id', (req: Request, res: Response) => {
    try {
      const idx = productsList.findIndex(p => p.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      const updates = req.body || {};
      productsList[idx] = {
        ...productsList[idx],
        ...updates,
        id: productsList[idx].id
      };

      res.json({
        success: true,
        message: 'Product updated successfully',
        product: productsList[idx]
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // DELETE /api/marketplace/products/:id
  app.delete('/api/marketplace/products/:id', (req: Request, res: Response) => {
    try {
      const idx = productsList.findIndex(p => p.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }

      const deleted = productsList.splice(idx, 1)[0];
      res.json({
        success: true,
        message: `Product "${deleted.name}" deleted from marketplace.`,
        deletedId: deleted.id
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // =========================================================================
  // 3. PINCODE MANAGEMENT & BULK ASSIGNMENT
  // =========================================================================

  // POST /api/marketplace/pincodes/bulk-assign
  // Assigns or replaces pincodes across multiple products or vendor master
  app.post('/api/marketplace/pincodes/bulk-assign', (req: Request, res: Response) => {
    try {
      const { vendorId, productIds, pincodes, mode, customShippingFee } = req.body || {};
      if (!vendorId) {
        return res.status(400).json({ success: false, error: 'Vendor ID is required.' });
      }

      // Parse pincodes
      let cleanPins: string[] = [];
      if (Array.isArray(pincodes)) {
        cleanPins = pincodes.map(cleanPincode).filter(p => p.length === 6);
      } else if (typeof pincodes === 'string') {
        cleanPins = pincodes.split(/[\s,\n]+/).map(cleanPincode).filter(p => p.length === 6);
      }

      if (cleanPins.length === 0) {
        return res.status(400).json({ success: false, error: 'Please provide at least one valid 6-digit Indian PIN code.' });
      }

      const vendor = vendorsList.find(v => v.id === vendorId);
      if (!vendor) {
        return res.status(404).json({ success: false, error: 'Vendor not found' });
      }

      // Update Vendor master serviceable pincodes
      if (mode === 'replace') {
        vendor.serviceablePincodes = Array.from(new Set(cleanPins));
      } else {
        vendor.serviceablePincodes = Array.from(new Set([...(vendor.serviceablePincodes || []), ...cleanPins]));
      }

      // Determine which products to update
      let targetProducts: StoreProduct[] = [];
      if (!productIds || productIds === 'all' || (Array.isArray(productIds) && productIds.length === 0)) {
        targetProducts = productsList.filter(p => p.vendorId === vendorId || p.brand === vendor.storeName);
      } else if (Array.isArray(productIds)) {
        targetProducts = productsList.filter(p => productIds.includes(p.id));
      }

      let updatedCount = 0;
      targetProducts.forEach(prod => {
        if (mode === 'replace') {
          prod.serviceablePincodes = Array.from(new Set(cleanPins));
        } else {
          prod.serviceablePincodes = Array.from(new Set([...(prod.serviceablePincodes || []), ...cleanPins]));
        }

        // Apply uniform custom shipping fee if provided
        if (customShippingFee !== undefined && customShippingFee !== null) {
          if (!prod.pincodeShippingRates) prod.pincodeShippingRates = {};
          cleanPins.forEach(pin => {
            prod.pincodeShippingRates![pin] = Number(customShippingFee);
          });
        }

        updatedCount++;
      });

      res.json({
        success: true,
        message: `Successfully assigned ${cleanPins.length} pincodes to ${updatedCount} products for vendor ${vendor.storeName}.`,
        pincodesCount: cleanPins.length,
        updatedProductsCount: updatedCount,
        vendorPincodesCount: vendor.serviceablePincodes.length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // POST /api/marketplace/pincodes/bulk-remove
  app.post('/api/marketplace/pincodes/bulk-remove', (req: Request, res: Response) => {
    try {
      const { vendorId, productIds, pincodes } = req.body || {};
      if (!vendorId) {
        return res.status(400).json({ success: false, error: 'Vendor ID is required.' });
      }

      let cleanPins: string[] = [];
      if (Array.isArray(pincodes)) {
        cleanPins = pincodes.map(cleanPincode).filter(p => p.length === 6);
      } else if (typeof pincodes === 'string') {
        cleanPins = pincodes.split(/[\s,\n]+/).map(cleanPincode).filter(p => p.length === 6);
      }

      const removeSet = new Set(cleanPins);
      const vendor = vendorsList.find(v => v.id === vendorId);
      if (vendor && vendor.serviceablePincodes) {
        vendor.serviceablePincodes = vendor.serviceablePincodes.filter(p => !removeSet.has(p));
      }

      let targetProducts: StoreProduct[] = [];
      if (!productIds || productIds === 'all' || (Array.isArray(productIds) && productIds.length === 0)) {
        targetProducts = productsList.filter(p => p.vendorId === vendorId);
      } else if (Array.isArray(productIds)) {
        targetProducts = productsList.filter(p => productIds.includes(p.id));
      }

      targetProducts.forEach(prod => {
        if (prod.serviceablePincodes) {
          prod.serviceablePincodes = prod.serviceablePincodes.filter(p => !removeSet.has(p));
        }
        if (prod.pincodeShippingRates) {
          cleanPins.forEach(p => delete prod.pincodeShippingRates![p]);
        }
      });

      res.json({
        success: true,
        message: `Removed ${cleanPins.length} pincodes from ${targetProducts.length} products.`,
        removedCount: cleanPins.length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // GET /api/marketplace/check-deliverability
  // Customer Deliverability Check Query
  app.get('/api/marketplace/check-deliverability', (req: Request, res: Response) => {
    try {
      const { pincode, productId } = req.query;
      if (!pincode || typeof pincode !== 'string') {
        return res.status(400).json({ success: false, error: 'Pincode is required.' });
      }

      const pin = cleanPincode(pincode);
      if (pin.length !== 6) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 6-digit Indian PIN code.' });
      }

      if (!productId || typeof productId !== 'string') {
        return res.status(400).json({ success: false, error: 'Product ID is required.' });
      }

      const product = productsList.find(p => p.id === productId || p.slug === productId);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found.' });
      }

      const vendor = vendorsList.find(v => v.id === product.vendorId);
      const result = checkProductDeliverability(product, pin, vendor);

      res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // POST /api/marketplace/validate-cart
  // Cart-level deliverability validation
  app.post('/api/marketplace/validate-cart', (req: Request, res: Response) => {
    try {
      const { items, pincode } = req.body || {};
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ success: false, error: 'Cart items array is required.' });
      }

      const pin = cleanPincode(pincode || '');
      const result = validateCartForDelivery(items, pin, vendorsList);

      res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // =========================================================================
  // 4. ORDERS & FULFILLMENT
  // =========================================================================

  // GET /api/marketplace/orders
  app.get('/api/marketplace/orders', (req: Request, res: Response) => {
    try {
      const { vendorId, status, search } = req.query;
      let result = ordersList;

      if (vendorId && typeof vendorId === 'string' && vendorId !== 'all') {
        const vendor = vendorsList.find(v => v.id === vendorId);
        result = result.filter(o =>
          o.items.some(it => it.vendorId === vendorId || it.product?.vendorId === vendorId || (vendor && it.product?.brand === vendor.storeName))
        );
      }

      if (status && typeof status === 'string' && status !== 'all') {
        result = result.filter(o => o.orderStatus === status);
      }

      if (search && typeof search === 'string') {
        const q = search.toLowerCase();
        result = result.filter(o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.shippingAddress.pincode.includes(q)
        );
      }

      res.json({ success: true, count: result.length, orders: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // PUT /api/marketplace/orders/:id/status
  app.put('/api/marketplace/orders/:id/status', (req: Request, res: Response) => {
    try {
      const { status, courierPartner, trackingNumber, note, vendorId } = req.body || {};
      const order = ordersList.find(o => o.id === req.params.id);

      if (!order) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      if (status) {
        order.orderStatus = status as OrderStatus;
      }
      if (courierPartner) order.courierPartner = courierPartner;
      if (trackingNumber) order.trackingNumber = trackingNumber;

      const vendor = vendorsList.find(v => v.id === vendorId);
      const actor = vendor ? `Vendor ${vendor.storeName}` : 'Marketplace Fulfillment Desk';

      order.statusHistory.push({
        status: order.orderStatus,
        timestamp: new Date().toLocaleString('en-IN'),
        note: note || `Order status updated to ${order.orderStatus} by ${actor}. Tracking: ${order.trackingNumber || 'N/A'}`
      });

      res.json({
        success: true,
        message: `Order #${order.orderNumber} status updated to ${order.orderStatus}.`,
        order
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });
}

export function getMarketplaceOrdersList() {
  return ordersList;
}

export function updateMarketplaceOrderStatus(
  orderIdOrNum: string,
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded',
  orderStatus?: OrderStatus,
  paymentRef?: string
) {
  const order = ordersList.find(o => o.id === orderIdOrNum || o.orderNumber === orderIdOrNum);
  if (order) {
    order.paymentStatus = paymentStatus;
    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentRef) order.paymentReferenceId = paymentRef;
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: new Date().toLocaleString('en-IN'),
      note: `Payment status updated to ${paymentStatus.toUpperCase()} via Online Payment Gateway. Ref: ${paymentRef || 'N/A'}`
    });
    return order;
  }
  return null;
}

