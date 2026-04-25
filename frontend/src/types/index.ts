export type EmissionScope = 1 | 2 | 3;

// Structura pentru Grupul de documente (Batch)
export interface Batch {
  id: number;
  company_name: string;
  reporting_period: string;
  status: string;
  created_at: string;
}

// Structura pentru un Fișier încărcat (Document)
export interface Document {
  id: number;
  batch_id: number;
  filename: string;
  document_type: string;
  status: 'uploaded' | 'processing' | 'extracted' | 'failed';
  confidence?: number;
}

// Structura pentru datele extrase din document (Activity)
export interface Activity {
  id: number;
  document_id: number;
  activity_type: string;
  scope: EmissionScope;
  quantity: number;
  unit: string;
  confidence: number;
  emission?: Emission; // Poate fi null până nu rulăm calculul
}

// Structura pentru rezultatul matematic (Emission)
export interface Emission {
  id: number;
  activity_id: number;
  emission_factor: number;
  emission_factor_unit: string;
  co2e_value: number;
  formula: string;
}

// Tipurile vechi pe care le aveai pentru UI
export interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}