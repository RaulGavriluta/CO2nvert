export type EmissionScope = 'Scope 1' | 'Scope 2' | 'Scope 3';

export interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

export interface InvoiceData {
  id: string;
  type: 'gas' | 'electricity' | 'water';
  value: number;
  unit: string;
  cost: number;
  period: string;
}