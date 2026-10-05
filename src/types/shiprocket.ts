export interface ShiprocketCredentials {
  email: string;
  password?: string;
  apiKey?: string;
  token?: string;
  tokenExpiry?: string;
  isConnected: boolean;
  isSandbox: boolean;
  companyId?: string;
}

export interface ShiprocketPickupLocation {
  id?: number | string;
  pickup_location: string; // Nickname e.g. "Primary-Warehouse"
  name: string; // Contact person
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  lat?: number;
  long?: number;
  is_primary?: boolean;
}

export interface ShiprocketCourierService {
  courier_company_id: number;
  courier_name: string; // e.g. 'Delhivery Surface', 'BlueDart Express', 'Shadowfax'
  rate: number; // e.g. 52.5
  cod_charges?: number;
  etd: string; // Estimated transit days e.g. '2-3 days'
  estimated_delivery_days: number;
  rating: number; // 4.8 / 5
  cod: number; // 1 = available, 0 = unavailable
  air_max_weight?: string;
  surface_max_weight?: string;
  call_courier?: number;
  mode?: 'Surface' | 'Air';
  tracking_performance?: string; // 'High', 'Optimal'
}

export interface ShiprocketServiceabilityResult {
  success: boolean;
  pickup_postcode: string;
  delivery_postcode: string;
  weight_kg: number;
  available_courier_companies: ShiprocketCourierService[];
  recommended_courier_company_id?: number;
  message?: string;
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number | string;
}

export interface ShiprocketShipmentOrder {
  id?: string;
  order_id: string; // Platform order ID e.g. "VRN-2026-8901"
  order_date: string;
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: 'Prepaid' | 'COD';
  sub_total: number;
  length: number; // cm
  breadth: number; // cm
  height: number; // cm
  weight: number; // kg
  
  // Fulfillment results
  shipment_id?: number | string;
  awb_code?: string;
  courier_name?: string;
  courier_company_id?: number;
  label_url?: string;
  manifest_url?: string;
  pickup_status?: 'scheduled' | 'picked_up' | 'in_transit' | 'delivered' | 'pending';
  pickup_scheduled_date?: string;
  pickup_token_number?: string;
  current_status?: string;
  tracking_scans?: ShiprocketTrackingScan[];
  createdAt?: string;
}

export interface ShiprocketTrackingScan {
  date: string;
  status: string;
  activity: string;
  location: string;
  sr_status_label?: string;
}

export interface ShiprocketTrackingResponse {
  success: boolean;
  awb_code: string;
  courier_name: string;
  current_status: string;
  estimated_delivery_date?: string;
  origin: string;
  destination: string;
  scans: ShiprocketTrackingScan[];
}
