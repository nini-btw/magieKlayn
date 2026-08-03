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

export interface YalidineListResponse<T> {
  has_more: boolean;
  total_data: number;
  data: T[];
  links: { self: string };
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
