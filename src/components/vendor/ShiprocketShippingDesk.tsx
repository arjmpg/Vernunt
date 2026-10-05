import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, Search, CheckCircle2, Clock, MapPin, 
  Printer, RefreshCw, ExternalLink, ShieldCheck, Zap, 
  AlertCircle, ChevronRight, Download, Calendar, Phone, Mail, 
  Building, Check, Sparkles, X, ArrowUpRight, Barcode, FileText
} from 'lucide-react';
import { 
  ShiprocketCredentials, 
  ShiprocketPickupLocation, 
  ShiprocketServiceabilityResult, 
  ShiprocketShipmentOrder, 
  ShiprocketTrackingResponse,
  ShiprocketCourierService 
} from '../../types/shiprocket.ts';
import { ShiprocketClient } from '../../services/shiprocketClient.ts';
import { StoreOrder } from '../../types/store.ts';
import { VendorProfile } from '../../types/vendor.ts';

interface ShiprocketShippingDeskProps {
  currentVendor?: VendorProfile;
  orders: StoreOrder[];
  onOrderUpdated?: (orderId: string, status: string, trackingNumber?: string) => void;
}

export const ShiprocketShippingDesk: React.FC<ShiprocketShippingDeskProps> = ({
  currentVendor,
  orders,
  onOrderUpdated
}) => {
  // Credentials & Status
  const [credentials, setCredentials] = useState<ShiprocketCredentials>(ShiprocketClient.getCredentials);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState(credentials.email || 'seller@vernunt.com');
  const [authPassword, setAuthPassword] = useState('');
  const [isSandboxMode, setIsSandboxMode] = useState(credentials.isSandbox);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Rate & Serviceability Calculator State
  const defaultPickupPin = currentVendor?.address?.pincode || '560102';
  const [calcPickupPin, setCalcPickupPin] = useState(defaultPickupPin);
  const [calcDeliveryPin, setCalcDeliveryPin] = useState('400001'); // Mumbai sample
  const [calcWeight, setCalcWeight] = useState<number>(0.5);
  const [calcCod, setCalcCod] = useState<boolean>(false);
  const [isCheckingRate, setIsCheckingRate] = useState(false);
  const [serviceabilityResult, setServiceabilityResult] = useState<ShiprocketServiceabilityResult | null>(null);

  // Pickup Locations
  const [pickupLocations, setPickupLocations] = useState<ShiprocketPickupLocation[]>([]);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [newLocationForm, setNewLocationForm] = useState({
    pickup_location: `${currentVendor?.storeName || 'Primary'}-Hub`,
    name: currentVendor?.ownerName || 'Warehouse Manager',
    email: currentVendor?.email || 'dispatch@vernunt.com',
    phone: currentVendor?.phone || '9845012345',
    address: currentVendor?.address?.street || '27th Main, Sector 2, HSR Layout',
    city: currentVendor?.address?.city || 'Bengaluru',
    state: currentVendor?.address?.state || 'Karnataka',
    pin_code: currentVendor?.address?.pincode || '560102'
  });

  // Shipments & Orders
  const [shipments, setShipments] = useState<Record<string, ShiprocketShipmentOrder>>({});
  
  // Tracking Modal
  const [trackingModalAwb, setTrackingModalAwb] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<ShiprocketTrackingResponse | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  // Shipping Label Modal
  const [selectedLabelShipment, setSelectedLabelShipment] = useState<ShiprocketShipmentOrder | null>(null);

  // Dispatch Modal for creating new shipment
  const [dispatchModalOrder, setDispatchModalOrder] = useState<StoreOrder | null>(null);
  const [selectedCourierId, setSelectedCourierId] = useState<number>(1);
  const [parcelWeight, setParcelWeight] = useState<number>(0.5);
  const [parcelLength, setParcelLength] = useState<number>(20);
  const [parcelBreadth, setParcelBreadth] = useState<number>(15);
  const [parcelHeight, setParcelHeight] = useState<number>(10);
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);

  // Pickup Scheduling Modal
  const [pickupModalShipment, setPickupModalShipment] = useState<ShiprocketShipmentOrder | null>(null);
  const [pickupDate, setPickupDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [isSchedulingPickup, setIsSchedulingPickup] = useState(false);

  // Load initial data
  useEffect(() => {
    loadPickupLocations();
    loadLocalShipments();
    runInitialServiceabilityCheck();
  }, []);

  const loadPickupLocations = async () => {
    const locs = await ShiprocketClient.getPickupLocations();
    setPickupLocations(locs);
  };

  const loadLocalShipments = () => {
    const all = ShiprocketClient.getAllLocalShipments();
    setShipments(all);
  };

  const runInitialServiceabilityCheck = async () => {
    const res = await ShiprocketClient.checkServiceability(defaultPickupPin, '400001', 0.5, 0);
    setServiceabilityResult(res);
  };

  const handleCalculateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcPickupPin || !calcDeliveryPin) return;
    setIsCheckingRate(true);
    try {
      const res = await ShiprocketClient.checkServiceability(calcPickupPin, calcDeliveryPin, calcWeight, calcCod ? 1 : 0);
      setServiceabilityResult(res);
    } finally {
      setIsCheckingRate(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthMessage(null);
    try {
      const res = await ShiprocketClient.authenticate(authEmail, authPassword, isSandboxMode);
      if (res.success) {
        setCredentials(ShiprocketClient.getCredentials());
        setAuthMessage({ text: res.message, type: 'success' });
        setTimeout(() => setIsAuthModalOpen(false), 1200);
      } else {
        setAuthMessage({ text: res.message || 'Authentication failed', type: 'error' });
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    await ShiprocketClient.addPickupLocation({
      ...newLocationForm,
      country: 'India'
    });
    setIsAddLocationModalOpen(false);
    loadPickupLocations();
  };

  // Open Dispatch Modal for an Order
  const handleOpenDispatch = (order: StoreOrder) => {
    setDispatchModalOrder(order);
    setSelectedCourierId(1);
    setParcelWeight(0.5);
  };

  // Execute Shipment Creation with Shiprocket
  const handleCreateShipment = async () => {
    if (!dispatchModalOrder) return;
    setIsCreatingShipment(true);
    try {
      const courierMap: Record<number, string> = {
        1: 'Delhivery Surface',
        2: 'BlueDart Express Air',
        3: 'Shadowfax Hyperlocal',
        4: 'Xpressbees Priority',
        5: 'DTDC National'
      };

      const primaryHub = pickupLocations.find(l => l.is_primary) || pickupLocations[0];

      const shipmentPayload: ShiprocketShipmentOrder = {
        order_id: dispatchModalOrder.orderNumber || dispatchModalOrder.id,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: primaryHub?.pickup_location || 'Vernunt-Bengaluru-Central-Hub',
        billing_customer_name: dispatchModalOrder.customerName,
        billing_address: dispatchModalOrder.shippingAddress?.addressLine1 || 'Customer Address',
        billing_city: dispatchModalOrder.shippingAddress?.city || 'Bengaluru',
        billing_pincode: dispatchModalOrder.shippingAddress?.pincode || '560001',
        billing_state: dispatchModalOrder.shippingAddress?.state || 'Karnataka',
        billing_country: 'India',
        billing_email: dispatchModalOrder.customerEmail || 'buyer@vernunt.com',
        billing_phone: dispatchModalOrder.customerPhone || '9876543210',
        shipping_is_billing: true,
        order_items: dispatchModalOrder.items.map(i => ({
          name: i.product.name,
          sku: i.product.sku || 'SKU-VRN',
          units: i.quantity,
          selling_price: i.unitPrice
        })),
        payment_method: dispatchModalOrder.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        sub_total: dispatchModalOrder.totalAmount,
        length: parcelLength,
        breadth: parcelBreadth,
        height: parcelHeight,
        weight: parcelWeight,
        courier_company_id: selectedCourierId,
        courier_name: courierMap[selectedCourierId] || 'Delhivery Surface'
      };

      const result = await ShiprocketClient.createShipment(shipmentPayload);
      if (result.success && result.shipment) {
        setShipments(prev => ({
          ...prev,
          [dispatchModalOrder.id]: result.shipment,
          [result.shipment.order_id]: result.shipment,
          ...(result.shipment.awb_code ? { [result.shipment.awb_code]: result.shipment } : {})
        }));

        onOrderUpdated?.(dispatchModalOrder.id, 'shipped', result.shipment.awb_code);
        setDispatchModalOrder(null);
        setSelectedLabelShipment(result.shipment);
      }
    } finally {
      setIsCreatingShipment(false);
    }
  };

  // Open Real-time Tracking Modal
  const handleOpenTracking = async (awb: string) => {
    setTrackingModalAwb(awb);
    setIsLoadingTracking(true);
    try {
      const data = await ShiprocketClient.trackShipment(awb);
      setTrackingData(data);
    } finally {
      setIsLoadingTracking(false);
    }
  };

  // Schedule Doorstep Pickup
  const handleSchedulePickup = async () => {
    if (!pickupModalShipment) return;
    setIsSchedulingPickup(true);
    try {
      await ShiprocketClient.schedulePickup(pickupModalShipment.order_id, pickupDate);
      loadLocalShipments();
      setPickupModalShipment(null);
    } finally {
      setIsSchedulingPickup(false);
    }
  };

  return (
    <div id="shiprocket-shipping-desk" className="space-y-6 animate-fadeIn font-sans text-slate-800">
      
      {/* Shiprocket Brand Banner & Connectivity Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 rounded-full text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> SHIPROCKET PRO FULFILLMENT
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {credentials.isSandbox ? 'Sandbox Simulator Active' : 'Live Carrier Network'}
              </span>
              <span className="px-2.5 py-0.5 bg-white/10 text-slate-300 rounded-full text-[10px] font-medium">
                29,000+ Indian Pincodes
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-black text-white tracking-tight">
              Integrated Courier Logistics &amp; Doorstep Dispatch
            </h2>
            <p className="text-xs sm:text-[13px] text-indigo-200/90 leading-relaxed">
              Automated multi-carrier shipping with <strong>Delhivery, BlueDart, Shadowfax, Xpressbees &amp; DTDC</strong>. 
              Generate air waybills (AWB), print barcode labels, schedule doorstep courier pickups, and track packages in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 text-left">
              <span className="text-[10px] uppercase font-bold text-indigo-200 block">Account Status</span>
              <span className="text-xs font-black text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {credentials.email}
              </span>
            </div>

            <button
              id="btn-shiprocket-settings"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Settings &amp; API Key
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Rate Calculator & Warehouse Hubs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Courier Rate & Serviceability Calculator (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Courier Serviceability &amp; Rate Estimator
              </h3>
              <p className="text-xs text-slate-500">Live shipping cost and estimated transit days across top carriers.</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
              Pan-India Matrix
            </span>
          </div>

          <form onSubmit={handleCalculateRate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-150">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Pickup Pincode</label>
              <input
                type="text"
                maxLength={6}
                value={calcPickupPin}
                onChange={e => setCalcPickupPin(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 560102"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Destination Pincode</label>
              <input
                type="text"
                maxLength={6}
                value={calcDeliveryPin}
                onChange={e => setCalcDeliveryPin(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 400001"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="30"
                value={calcWeight}
                onChange={e => setCalcWeight(parseFloat(e.target.value) || 0.5)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="submit"
                disabled={isCheckingRate}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isCheckingRate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Check Rates</span>
              </button>
            </div>
          </form>

          {/* Results List */}
          {serviceabilityResult && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                <span>Route: {serviceabilityResult.pickup_postcode} ➔ {serviceabilityResult.delivery_postcode} ({serviceabilityResult.weight_kg} kg)</span>
                <span className="text-emerald-700 font-bold">5 Available Carriers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {serviceabilityResult.available_courier_companies.map((courier: ShiprocketCourierService) => (
                  <div
                    key={courier.courier_company_id}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-300"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{courier.courier_name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-slate-400" /> {courier.etd}</span>
                          <span>•</span>
                          <span className="text-amber-600 font-bold">⭐ {courier.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold font-mono text-slate-900 block">₹{courier.rate}</span>
                      <span className="text-[9.5px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                        {courier.mode || 'Standard'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Pickup Warehouses & Hubs (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" /> Dispatch Hubs &amp; Warehouses
                </h3>
                <p className="text-xs text-slate-500">Doorstep courier pickup addresses registered with Shiprocket.</p>
              </div>
              <button
                onClick={() => setIsAddLocationModalOpen(true)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                + Add Hub
              </button>
            </div>

            <div className="space-y-3">
              {pickupLocations.map((loc) => (
                <div 
                  key={loc.id || loc.pickup_location}
                  className={`p-3.5 rounded-2xl border transition text-left space-y-1.5 ${
                    loc.is_primary ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs' : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      {loc.pickup_location}
                    </span>
                    {loc.is_primary && (
                      <span className="text-[9.5px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                        Primary Hub
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{loc.address}, {loc.city}, {loc.state} - <strong className="font-mono">{loc.pin_code}</strong></p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {loc.phone}</span>
                    <span>•</span>
                    <span>Manager: {loc.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11.5px] leading-relaxed">
              <strong>Doorstep Pickup SLA:</strong> When an order is packed, Shiprocket dispatches a courier boy to your primary warehouse within 24 hours.
            </span>
          </div>
        </div>
      </div>

      {/* Orders Ready for Shiprocket Dispatch & Shipped History */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" /> Orders &amp; Shiprocket Dispatch Desk
            </h3>
            <p className="text-xs text-slate-500">Generate AWBs, print official barcode shipping labels, and schedule pickups.</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            Total Orders: {orders.length}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No customer orders received yet. Once orders are placed, they will appear here for instant Shiprocket courier booking.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 text-[10.5px] uppercase font-black tracking-wider">
                  <th className="py-3 px-4">Order / Invoice</th>
                  <th className="py-3 px-4">Customer &amp; Destination</th>
                  <th className="py-3 px-4">Items / Total</th>
                  <th className="py-3 px-4">Shiprocket Carrier &amp; AWB</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Logistics Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const shipment = shipments[ord.id] || shipments[ord.orderNumber];
                  const hasAwb = !!shipment?.awb_code;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{ord.orderNumber}</span>
                        <span className="text-[10px] text-slate-400">{ord.placedAt}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {ord.shippingAddress?.city}, {ord.shippingAddress?.pincode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 block font-medium">{ord.items.length} item(s)</span>
                        <span className="font-mono font-extrabold text-slate-900">₹{ord.totalAmount}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {hasAwb ? (
                          <div className="space-y-1">
                            <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Barcode className="w-3 h-3" /> {shipment.awb_code}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-semibold">{shipment.courier_name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                            AWB Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          hasAwb 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {hasAwb ? (shipment.current_status || 'Ready for Pickup') : ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {!hasAwb ? (
                          <button
                            onClick={() => handleOpenDispatch(ord)}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5" /> Ship with Shiprocket
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenTracking(shipment.awb_code!)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                              title="Track Live Courier Status"
                            >
                              <Truck className="w-3 h-3 text-indigo-600" /> Track
                            </button>
                            <button
                              onClick={() => setSelectedLabelShipment(shipment)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                              title="Print Barcode Shipping Label"
                            >
                              <Printer className="w-3 h-3 text-slate-600" /> Label
                            </button>
                            <button
                              onClick={() => setPickupModalShipment(shipment)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer border border-amber-200"
                              title="Schedule Doorstep Pickup"
                            >
                              <Calendar className="w-3 h-3 text-amber-600" /> Pickup
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SHIP WITH SHIPROCKET DISPATCH MODAL                               */}
      {/* ========================================================================= */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-indigo-100 animate-scaleUp my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Ship Order via Shiprocket</h3>
                  <p className="text-xs text-slate-500 font-mono">Order: {dispatchModalOrder.orderNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => setDispatchModalOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buyer Delivery Card */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">{dispatchModalOrder.customerName}</span>
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  {dispatchModalOrder.paymentMethod}
                </span>
              </div>
              <p className="text-slate-600">{dispatchModalOrder.shippingAddress?.addressLine1}, {dispatchModalOrder.shippingAddress?.city}, {dispatchModalOrder.shippingAddress?.state} - <strong className="font-mono">{dispatchModalOrder.shippingAddress?.pincode}</strong></p>
              <p className="text-[11px] text-slate-500">Phone: {dispatchModalOrder.customerPhone || '9876543210'}</p>
            </div>

            {/* Package Dimensions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">📦 Parcel Dimensions &amp; Weight</h4>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={parcelWeight}
                    onChange={e => setParcelWeight(parseFloat(e.target.value) || 0.5)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Length (cm)</label>
                  <input
                    type="number"
                    value={parcelLength}
                    onChange={e => setParcelLength(parseInt(e.target.value) || 20)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Breadth (cm)</label>
                  <input
                    type="number"
                    value={parcelBreadth}
                    onChange={e => setParcelBreadth(parseInt(e.target.value) || 15)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={parcelHeight}
                    onChange={e => setParcelHeight(parseInt(e.target.value) || 10)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Courier Selection */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">🚚 Choose Shiprocket Courier Partner</h4>
              <div className="space-y-2">
                {[
                  { id: 1, name: 'Delhivery Surface Express', rate: 48, etd: '2-3 Days', rating: 4.8 },
                  { id: 2, name: 'BlueDart Express Air (Fastest)', rate: 85, etd: 'Next Day', rating: 4.9 },
                  { id: 3, name: 'Shadowfax Priority Surface', rate: 42, etd: '1-2 Days', rating: 4.6 }
                ].map(c => (
                  <label
                    key={c.id}
                    onClick={() => setSelectedCourierId(c.id)}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                      selectedCourierId === c.id 
                        ? 'bg-indigo-50 border-indigo-400 shadow-xs ring-2 ring-indigo-200' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="courier_select"
                        checked={selectedCourierId === c.id}
                        onChange={() => setSelectedCourierId(c.id)}
                        className="text-indigo-600"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Transit: {c.etd} • Rating: ⭐ {c.rating}</span>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold font-mono text-slate-900">₹{c.rate}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <button
              onClick={handleCreateShipment}
              disabled={isCreatingShipment}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isCreatingShipment ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Connecting with Shiprocket &amp; Assigning AWB...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Generate Shiprocket AWB &amp; Book Courier</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LIVE TRACKING TIMELINE MODAL                                     */}
      {/* ========================================================================= */}
      {trackingModalAwb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-indigo-100 animate-scaleUp my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Live Courier GPS
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">Shipment Tracking</h3>
                <p className="text-xs text-slate-500 font-mono">AWB: {trackingModalAwb}</p>
              </div>
              <button 
                onClick={() => setTrackingModalAwb(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingTracking ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-bold">Querying Shiprocket Carrier Network...</p>
              </div>
            ) : trackingData ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Courier Partner:</span>
                    <strong className="text-slate-900">{trackingData.courier_name}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status:</span>
                    <strong className="text-emerald-700 font-bold">{trackingData.current_status}</strong>
                  </div>
                  {trackingData.estimated_delivery_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Estimated Delivery:</span>
                      <strong className="text-slate-900">{trackingData.estimated_delivery_date}</strong>
                    </div>
                  )}
                </div>

                {/* Scans Timeline */}
                <div className="space-y-3 pl-2 border-l-2 border-indigo-200 ml-3">
                  {trackingData.scans.map((scan, idx) => (
                    <div key={idx} className="relative pl-4 space-y-0.5 text-xs text-left">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-100"></div>
                      <span className="text-[10px] text-slate-400 font-bold block">{scan.date}</span>
                      <h5 className="font-bold text-slate-900">{scan.activity}</h5>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {scan.location}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              onClick={() => setTrackingModalAwb(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              Close Tracking
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRINT OFFICIAL SHIPPING LABEL                                    */}
      {/* ========================================================================= */}
      {selectedLabelShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scaleUp my-auto text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Printer className="w-4 h-4 text-indigo-600" /> Shiprocket Barcode Shipping Label
              </span>
              <button 
                onClick={() => setSelectedLabelShipment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Label Print Canvas Container */}
            <div id="print-label-canvas" className="border-2 border-dashed border-slate-900 p-4 rounded-xl space-y-3 font-mono text-xs bg-white text-slate-950">
              <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                <div>
                  <h4 className="font-black text-sm uppercase">VERNUNT LOGISTICS</h4>
                  <span className="text-[10px] block">Powered by Shiprocket</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold block">{selectedLabelShipment.courier_name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-900 text-white font-bold rounded-xs">
                    {selectedLabelShipment.payment_method}
                  </span>
                </div>
              </div>

              {/* Barcode Display */}
              <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="tracking-widest font-black text-lg select-all">
                  ||||| | |||| ||| ||||||| | |||
                </div>
                <span className="text-xs font-bold tracking-wider">AWB: {selectedLabelShipment.awb_code}</span>
              </div>

              {/* Routing Details */}
              <div className="grid grid-cols-2 gap-2 text-[10.5px] pb-2 border-b border-slate-900">
                <div>
                  <span className="font-bold text-[9px] text-slate-500 uppercase block">Return / Pickup Hub:</span>
                  <p className="font-semibold">{selectedLabelShipment.pickup_location}</p>
                  <p className="text-slate-600">Bengaluru, KA - 560102</p>
                </div>
                <div>
                  <span className="font-bold text-[9px] text-slate-500 uppercase block">Ship To (Customer):</span>
                  <p className="font-semibold">{selectedLabelShipment.billing_customer_name}</p>
                  <p className="text-slate-600">{selectedLabelShipment.billing_city} - {selectedLabelShipment.billing_pincode}</p>
                </div>
              </div>

              <div className="flex justify-between text-[10px]">
                <span>Order: {selectedLabelShipment.order_id}</span>
                <span>Weight: {selectedLabelShipment.weight} kg</span>
                <span>Dims: {selectedLabelShipment.length}x{selectedLabelShipment.breadth}x{selectedLabelShipment.height} cm</span>
              </div>

              <div className="text-[9px] text-center pt-1 border-t border-slate-300 text-slate-500">
                ★ 100% Non-Toxic &amp; BIS Certified Children's Product • Handle with Care
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" /> Quick Print
              </button>
              <a
                href={selectedLabelShipment.label_url || `/api/shiprocket/label/${selectedLabelShipment.awb_code}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Full Label
              </a>
              <a
                href={selectedLabelShipment.manifest_url || `/api/shiprocket/manifest/${selectedLabelShipment.awb_code}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" /> Manifest
              </a>
              <button
                onClick={() => setSelectedLabelShipment(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DOORSTEP PICKUP SCHEDULING                                       */}
      {/* ========================================================================= */}
      {pickupModalShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scaleUp my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" /> Schedule Doorstep Pickup
              </h3>
              <button 
                onClick={() => setPickupModalShipment(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Request courier executive pickup from <strong>{pickupModalShipment.pickup_location}</strong> for Order <strong>{pickupModalShipment.order_id}</strong>.
            </p>

            <div className="space-y-1 text-left">
              <label className="text-[10px] uppercase font-bold text-slate-600">Select Pickup Date</label>
              <input
                type="date"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-hidden"
              />
            </div>

            <button
              onClick={handleSchedulePickup}
              disabled={isSchedulingPickup}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSchedulingPickup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Confirm Doorstep Pickup</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: SHIPROCKET API & SETTINGS CONFIGURATION                           */}
      {/* ========================================================================= */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-indigo-100 animate-scaleUp my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Shiprocket API Configuration</h3>
              </div>
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {authMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                authMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {authMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{authMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleAuthenticate} className="space-y-3 text-left">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Shiprocket Account Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="seller@yourstore.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">API Password (Optional in Sandbox)</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sandbox_mode_toggle"
                  checked={isSandboxMode}
                  onChange={e => setIsSandboxMode(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="sandbox_mode_toggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Enable Sandbox / Test Simulation Mode
                </label>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                In Sandbox mode, live Shiprocket AWB generation, Delhivery/BlueDart rates, tracking timelines, and printable barcode labels work seamlessly without requiring billing.
              </p>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save &amp; Connect Shiprocket Account</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: REGISTER NEW PICKUP WAREHOUSE                                     */}
      {/* ========================================================================= */}
      {isAddLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scaleUp my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-600" /> Register Dispatch Hub
              </h3>
              <button 
                onClick={() => setIsAddLocationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="space-y-3 text-left">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Hub Nickname</label>
                <input
                  type="text"
                  value={newLocationForm.pickup_location}
                  onChange={e => setNewLocationForm({ ...newLocationForm, pickup_location: e.target.value })}
                  placeholder="e.g. South-Bengaluru-Hub"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={newLocationForm.address}
                  onChange={e => setNewLocationForm({ ...newLocationForm, address: e.target.value })}
                  placeholder="Building, street, and landmark"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">City</label>
                  <input
                    type="text"
                    value={newLocationForm.city}
                    onChange={e => setNewLocationForm({ ...newLocationForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={newLocationForm.pin_code}
                    onChange={e => setNewLocationForm({ ...newLocationForm, pin_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Manager Name</label>
                  <input
                    type="text"
                    value={newLocationForm.name}
                    onChange={e => setNewLocationForm({ ...newLocationForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">Manager Phone</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={newLocationForm.phone}
                    onChange={e => setNewLocationForm({ ...newLocationForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" /> Save Pickup Location
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default ShiprocketShippingDesk;
