export type UserRole = 'employee' | 'it_staff' | 'admin'

export interface Profile {
  id: string
  full_name: string
  email: string
  department?: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

// ASSETS
export type AssetCategory = 'laptop' | 'desktop' | 'monitor' | 'keyboard' | 'mouse' | 'printer' | 'phone' | 'tablet' | 'server' | 'network' | 'peripheral' | 'other'
export type AssetStatus = 'available' | 'assigned' | 'under_repair' | 'retired' | 'lost'
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor'

export interface Asset {
  id: string
  asset_tag: string
  name: string
  category: AssetCategory
  brand?: string
  model?: string
  serial_number?: string
  status: AssetStatus
  condition: AssetCondition
  purchase_date?: string
  purchase_cost?: number
  warranty_expiry?: string
  assigned_to?: string
  assigned_at?: string
  location?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Joined
  assigned_user?: Profile
}

export interface AssetHistory {
  id: string
  asset_id: string
  action: string
  from_user?: string
  to_user?: string
  notes?: string
  performed_by?: string
  created_at: string
}

// TICKETS
export type TicketCategory = 'hardware' | 'software' | 'network' | 'account' | 'email' | 'printer' | 'phone' | 'other'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'

export interface Ticket {
  id: string
  ticket_number: number
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  submitted_by?: string
  assigned_to?: string
  related_asset?: string
  resolution?: string
  resolved_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
  // Joined
  submitter?: Profile
  assignee?: Profile
}

export interface TicketComment {
  id: string
  ticket_id: string
  author?: string
  content: string
  is_internal: boolean
  created_at: string
  // Joined
  author_profile?: Profile
}

// LICENSES
export type LicenseCategory = 'productivity' | 'security' | 'development' | 'design' | 'communication' | 'erp' | 'crm' | 'cloud' | 'other'
export type LicenseType = 'perpetual' | 'subscription' | 'per_user' | 'concurrent' | 'open_source'
export type BillingCycle = 'monthly' | 'annual' | 'one_time'
export type LicenseStatus = 'active' | 'expired' | 'cancelled' | 'pending'

export interface SoftwareLicense {
  id: string
  name: string
  vendor: string
  category: LicenseCategory
  license_type: LicenseType
  license_key?: string
  total_seats?: number
  used_seats: number
  cost_per_seat?: number
  total_cost?: number
  billing_cycle?: BillingCycle
  purchase_date?: string
  renewal_date?: string
  expiry_date?: string
  vendor_contact?: string
  vendor_email?: string
  notes?: string
  status: LicenseStatus
  created_by?: string
  created_at: string
  updated_at: string
}

export interface LicenseAssignment {
  id: string
  license_id: string
  user_id: string
  assigned_at: string
  assigned_by?: string
  user?: Profile
}
