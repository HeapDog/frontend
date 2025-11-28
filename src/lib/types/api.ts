export interface ApiResponse<T> {
  timestamp: string;
  data: T;
  path: string;
}

export interface PaginationMeta {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
}

export interface PaginatedData<T> {
  contents: T[];
  meta: PaginationMeta;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  details: ApiErrorDetail[] | null;
  path: string;
}

