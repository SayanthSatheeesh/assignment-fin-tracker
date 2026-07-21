export interface Investment {
  id: string;
  userId: string;
  investmentName: string;
  investmentType: string;
  investedAmount: number;
  currentValue: number;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedInvestments {
  data: Investment[];
  meta: PaginationMeta;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
}
