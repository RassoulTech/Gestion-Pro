export type PaginationParams = {
  page?: number;
  perPage?: number;
  search?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type SortDirection = "asc" | "desc";

export type ActionResult<T = void> = {
  data?: T;
  serverError?: string;
  validationErrors?: Record<string, string[]>;
};
