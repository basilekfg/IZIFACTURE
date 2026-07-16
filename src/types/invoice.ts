export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number; // in XOF/FCFA (integer)
  total: number; // quantity * unit_price (integer)
  sort_order: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  client?: Client | null;
  invoice_number: string;
  status: InvoiceStatus;
  issue_date: string; // ISO date string YYYY-MM-DD
  due_date: string; // ISO date string YYYY-MM-DD
  subtotal: number; // in XOF/FCFA (integer)
  tax_rate: number; // e.g. 18.00
  tax_amount: number; // in XOF/FCFA (integer)
  total: number; // in XOF/FCFA (integer)
  amount_paid: number; // in XOF/FCFA (integer)
  payment_method: string | null;
  paid_at: string | null;
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  company_city: string | null;
  company_country: string;
  tax_id: string | null; // NIF / RCCM
  logo_url: string | null;
  invoice_prefix: string;
  invoice_next_number: number;
  default_payment_terms: number;
  default_notes: string | null;
  currency: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}
