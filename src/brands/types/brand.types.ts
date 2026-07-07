export interface Brand {
  id: string;
  name: string;
}

export interface VehicleModel {
  id: string;
  brandId: string;
  name: string;
}

export interface BrandRecord {
  id: string;
  name: string;
}

export interface VehicleModelRecord {
  id: string;
  brand_id: string;
  name: string;
}
