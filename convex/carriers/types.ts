export interface CarrierCredentials {
  apiId?: string;
  apiToken?: string;
  bearerToken?: string;
  userGuid?: string;
}

export interface ShipmentData {
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  wilaya: string;
  commune?: string;
  totalAmount: number;
  weight?: number;
  isCod: boolean;
  deliveryType?: "home" | "stopdesk";
  stationCode?: string;
  productSummary?: string;
}

export interface Desk {
  code: string;
  name: string;
  address?: string;
  wilayaId?: number;
}

export interface CarrierAdapter {
  testConnection(): Promise<boolean>;
  getFees(fromWilaya: number, toWilaya: number, opts?: { stopDesk?: boolean; weight?: number }): Promise<number>;
  createShipment(order: ShipmentData): Promise<{ tracking: string; label?: string }>;
  getTrackingUrl(tracking: string): string;
  getDesks?(): Promise<Desk[]>;
}
