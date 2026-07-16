import { Listing } from '../../listings/types';

export interface PublicSeller {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
}

export interface SellerListingsQueryInput {
  page?: number;
  limit?: number;
}

export interface SellerListingsResponse {
  data: Listing[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
