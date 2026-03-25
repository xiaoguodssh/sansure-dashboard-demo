export type UserRole =
  | 'chairman'
  | 'president'
  | 'finance_lead'
  | 'sales_lead'
  | 'rd_lead'
  | 'production_lead';

export interface RoleOption {
  label: string;
  value: UserRole;
}

export interface MenuPermission {
  key: string;
  label: string;
  path: string;
  roles: UserRole[];
}

export type ThemeMode = 'business' | 'tech';

export interface GlobalFilterState {
  dateRange: [string, string];
  caliber: 'combined' | 'management';
  orgLevel: 'group' | 'subsidiary';
  marketScope: 'all' | 'domestic' | 'international';
  businessView: 'default' | 'line' | 'domestic_region' | 'international_region';
}
