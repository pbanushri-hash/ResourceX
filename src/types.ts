export type UserRole = 'buyer' | 'seller' | 'admin';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'unverified';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export type ResourceCondition = 
  | 'Brand New / Unopened'
  | 'Surplus / Unused'
  | 'Refurbished / Like New'
  | 'Like New'
  | 'Refurbished'
  | 'Used / Good'
  | 'Fair / Usable'
  | 'Salvage / Recyclable'
  | 'For Parts / Scrap';

export type ResourceType = 'for_sale' | 'for_donation' | 'donation';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  businessId: string;
  companyName: string;
  businessType: string;
  registrationNumber: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  verificationStatus: VerificationStatus;
  verificationRejectionReason?: string | null;
  createdAt: string;
}

export interface Business {
  id: string;
  userId: string;
  companyName: string;
  businessType: string;
  registrationNumber: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  verificationStatus: VerificationStatus;
  verificationDocUrl?: string;
  verificationDocName?: string;
  createdAt: string;
}

export interface BusinessVerification {
  id: string;
  businessId: string;
  userId: string;
  userRole?: UserRole;
  userEmail?: string;
  userName?: string;
  companyName: string;
  businessType?: string;
  registrationNumber: string;
  gstNumber: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  documentName: string;
  documentUrl: string;
  status: VerificationStatus;
  reviewNotes?: string;
  adminNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  submittedAt: string;
}

export type VerificationRequest = BusinessVerification;

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Resource {
  id: string;
  sellerId: string;
  businessId?: string;
  sellerCompanyName: string;
  sellerLocation?: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  condition: ResourceCondition | string;
  originalPrice: number;
  sellingPrice: number;
  minOrderQuantity: number;
  location: string;
  availability: 'available' | 'reserved' | 'sold';
  images: string[];
  resourceType: ResourceType;
  expiryDate?: string;
  sustainabilityInfo?: {
    estimatedWeightKg?: number;
    co2SavingsKg?: number;
    recyclabilityNotes?: string;
  };
  status: 'active' | 'removed_by_admin';
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  resourceId: string;
  resource: Resource;
  quantity: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  resourceId: string;
  resourceName: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  estimatedWeightKg?: number;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerCompanyName: string;
  sellerId: string;
  sellerCompanyName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  paymentStatus: 'pending_gateway' | 'escrow_simulated' | 'invoiced' | string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderCompanyName?: string;
  senderRole?: UserRole;
  receiverId: string;
  receiverName: string;
  receiverCompanyName?: string;
  resourceId?: string;
  resourceName?: string;
  content: string;
  message?: string;
  createdAt: string;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'verification' | 'order' | 'message' | 'system' | string;
  read: boolean;
  isRead?: boolean;
  link?: string;
  createdAt: string;
}

export type AppNotification = Notification;

export interface SustainabilityMetrics {
  totalWasteDivertedKg: number;
  totalResourcesReused: number;
  totalResourcesDonated: number;
  activeBusinesses: number;
  totalOrdersCompleted: number;
  categoriesExchanged: { [category: string]: number };
  co2AvoidedKg: number;
  categoryBreakdown: { category: string; count: number; weightKg: number }[];
  topContributors?: { companyName: string; reusedCount: number; wasteDivertedKg?: number; co2SavedKg?: number }[];
  isEmpty: boolean;
}

export interface AISmartPriceResult {
  suggestedPrice: number;
  recommendedPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  confidenceScore?: number;
  marketRationale?: string;
  reasoning?: string;
  circularSavingsPercentage?: number;
  estimatedDiscountPercent?: number;
  factors?: string[];
}

export interface AIMatchResult {
  matches: {
    resourceId: string;
    resourceName: string;
    category: string;
    sellingPrice: number;
    availableQuantity: number;
    matchScore: number;
    reasoning: string;
    reasons?: string[];
    resource?: Resource;
  }[];
  summary: string;
  aiSummary?: string;
}
