export interface Broker {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Tenant {
  id: string;
  tenantName: string;
  creditType: string;
  squareFeet: number;
  rentPsf: number;
  annualEscalations: number;
  leaseStart: string;
  leaseEnd: string;
  leaseType: string;
  renew: string;
  downtimeMonths: number;
  tiPsf: number;
  lcPsf: number;
  isVacant: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface PropertyVersionProjection {
  propertyId: string;
  version: string;
  revision: number;
  isLatest: boolean;
  isHistorical: boolean;
}
