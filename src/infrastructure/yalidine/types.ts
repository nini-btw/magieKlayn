export interface YalidineWilaya {
  id: number;
  name: string;
  zone: number; // pricing zone tier — maps to fee bands
  is_deliverable: 0 | 1;
}

export interface YalidineListResponse<T> {
  has_more: boolean;
  total_data: number;
  data: T[];
  links: { self: string };
}

export interface YalidineQuota {
  second: number;
  minute: number;
  hour: number;
  day: number;
}

export interface YalidineCommune {
  id: number;
  name: string;
  wilaya_id: number;
  wilaya_name: string;
  has_stop_desk: 0 | 1;
  is_deliverable: 0 | 1;
  delivery_time_parcel: number; // days, parcel delivery
  delivery_time_payment: number; // days, COD payment remittance
}

export interface YalidineCommuneFee {
  commune_id: number;
  commune_name: string;
  express_home: number | null;
  express_desk: number | null;
  economic_home: number | null;
  economic_desk: number | null;
}

export interface YalidineFeeResponse {
  from_wilaya_name: string;
  to_wilaya_name: string;
  zone: number;
  retour_fee: number;
  cod_percentage: number;
  insurance_percentage: number;
  oversize_fee: number;
  per_commune: Record<string, YalidineCommuneFee>;
}

/**
 * A Yalidine stop-desk center. Used to resolve a default stopdesk_id
 * for a commune server-side (customer never picks one).
 */
export interface YalidineCenter {
  center_id: number;
  name: string;
  address: string;
  gps: string;
  commune_id: number;
  commune_name: string;
  wilaya_id: number;
  wilaya_name: string;
}

/**
 * Payload shape for POST /v1/parcels — one entry per parcel, sent as
 * an array even for a single parcel.
 */
export interface YalidineCreateParcelPayload {
  order_id: string;
  from_wilaya_name: string;
  firstname: string;
  familyname: string;
  contact_phone: string;
  address: string;
  to_commune_name: string;
  to_wilaya_name: string;
  product_list: string;
  price: number;
  do_insurance: boolean;
  declared_value: number;
  // Optional — currently omitted entirely from create-parcel.ts as a test
  // of whether sending them at all is what's triggering Yalidine's
  // platform-side ">5kg" oversize display, despite their own docs listing
  // these as "Required". See create-parcel.ts for the revert note.
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  freeshipping: boolean;
  is_stopdesk: boolean;
  stopdesk_id?: number;
  has_exchange: boolean;
  product_to_collect?: string | null;
}

/**
 * Result for a single parcel within a createParcels response.
 */
export interface YalidineCreateParcelResult {
  success: boolean;
  order_id: string;
  tracking: string | null;
  import_id: number | null;
  label: string | null;
  labels: string | null;
  message: string;
}

/**
 * POST /v1/parcels returns a map keyed by the order_id you supplied,
 * NOT an array — index results by order_id, not position.
 */
export type YalidineCreateParcelResponse = Record<
  string,
  YalidineCreateParcelResult
>;
