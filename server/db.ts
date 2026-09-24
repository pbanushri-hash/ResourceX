import fs from 'fs';
import path from 'path';
import { 
  User, 
  Business, 
  BusinessVerification, 
  Resource, 
  Order, 
  OrderItem, 
  Message, 
  Notification,
  SustainabilityMetrics,
  Category
} from '../src/types.js';

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  businesses: Business[];
  businessVerifications: BusinessVerification[];
  resources: Resource[];
  categories: Category[];
  orders: Order[];
  orderItems: OrderItem[];
  cart: { [userId: string]: { resourceId: string; quantity: number }[] };
  messages: Message[];
  notifications: Notification[];
  transactions: {
    id: string;
    orderId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    status: string;
    paymentNote: string;
    createdAt: string;
  }[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'raw-materials', name: 'Raw Materials', description: 'Metals, industrial chemicals, plastics, timber, and minerals' },
  { id: 'packaging-materials', name: 'Packaging Materials', description: 'Boxes, pallets, containers, bubble wrap, and strapping' },
  { id: 'machinery', name: 'Machinery', description: 'Manufacturing, CNC, stamping, processing, and assembly machines' },
  { id: 'equipment', name: 'Equipment', description: 'Compressors, pumps, testing apparatus, forklifts, and tooling' },
  { id: 'office-assets', name: 'Office Assets', description: 'Workstations, IT hardware, monitors, networking gear, and printers' },
  { id: 'electronics', name: 'Electronics', description: 'Circuit boards, wiring, passive components, and industrial semiconductors' },
  { id: 'furniture', name: 'Furniture', description: 'Desks, ergonomic chairs, storage racks, and conference tables' },
  { id: 'construction-materials', name: 'Construction Materials', description: 'Steel beams, drywall, structural pipes, tiles, and fittings' },
  { id: 'reusable-materials', name: 'Reusable Materials', description: 'Scrap metal, offcuts, regrind plastics, and reclaimed glass' },
  { id: 'other', name: 'Other', description: 'Miscellaneous surplus industrial and commercial inventory' }
];

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'resourcex_db.json');

// Initialize empty database strictly with ZERO fake records
function getEmptyDatabase(): DatabaseSchema {
  return {
    users: [],
    businesses: [],
    businessVerifications: [],
    resources: [],
    categories: DEFAULT_CATEGORIES,
    orders: [],
    orderItems: [],
    cart: {},
    messages: [],
    notifications: [],
    transactions: []
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all arrays exist
        return {
          users: parsed.users || [],
          businesses: parsed.businesses || [],
          businessVerifications: parsed.businessVerifications || [],
          resources: parsed.resources || [],
          categories: parsed.categories?.length ? parsed.categories : DEFAULT_CATEGORIES,
          orders: parsed.orders || [],
          orderItems: parsed.orderItems || [],
          cart: parsed.cart || {},
          messages: parsed.messages || [],
          notifications: parsed.notifications || [],
          transactions: parsed.transactions || []
        };
      }
    } catch (err) {
      console.error('Failed to load database file, starting clean:', err);
    }

    const empty = getEmptyDatabase();
    this.saveDirect(empty);
    return empty;
  }

  private saveDirect(db: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database file:', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  // Users & Businesses
  public getUsers() {
    return this.data.users;
  }

  public getUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: User & { passwordHash: string }) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUserVerification(userId: string, status: 'pending' | 'verified' | 'rejected') {
    const user = this.getUserById(userId);
    if (user) {
      user.verificationStatus = status;
    }
    const business = this.data.businesses.find(b => b.userId === userId);
    if (business) {
      business.verificationStatus = status;
    }
    this.save();
  }

  public addBusiness(business: Business) {
    this.data.businesses.push(business);
    this.save();
    return business;
  }

  public getBusinesses() {
    return this.data.businesses;
  }

  public getBusinessByUserId(userId: string) {
    return this.data.businesses.find(b => b.userId === userId);
  }

  // Verifications
  public addVerification(verif: BusinessVerification) {
    this.data.businessVerifications.push(verif);
    this.save();
    return verif;
  }

  public getVerifications() {
    return this.data.businessVerifications;
  }

  public getVerificationById(id: string) {
    return this.data.businessVerifications.find(v => v.id === id);
  }

  public reviewVerification(id: string, status: 'verified' | 'rejected', notes: string, adminId: string) {
    const verif = this.getVerificationById(id);
    if (!verif) return null;

    verif.status = status;
    verif.reviewNotes = notes;
    verif.reviewedAt = new Date().toISOString();
    verif.reviewedBy = adminId;

    this.updateUserVerification(verif.userId, status);

    // Notify user
    this.addNotification({
      id: 'notif_' + Date.now(),
      userId: verif.userId,
      title: status === 'verified' ? 'Business Verified' : 'Business Verification Rejected',
      message: status === 'verified' 
        ? 'Congratulations! Your business documents have been verified. You can now list surplus resources and place orders.'
        : `Your business verification was rejected: ${notes}. Please re-submit valid documentation.`,
      type: 'verification',
      read: false,
      link: status === 'verified' ? '/dashboard' : '/profile',
      createdAt: new Date().toISOString()
    });

    this.save();
    return verif;
  }

  // Resources
  public getResources(filters?: {
    category?: string;
    search?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    resourceType?: string;
    location?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'newest';
    sellerId?: string;
  }) {
    let list = this.data.resources.filter(r => r.status === 'active');

    if (filters?.sellerId) {
      list = this.data.resources.filter(r => r.sellerId === filters.sellerId);
    }

    if (filters?.category && filters.category !== 'all') {
      list = list.filter(r => r.category.toLowerCase() === filters.category!.toLowerCase());
    }

    if (filters?.condition && filters.condition !== 'all') {
      list = list.filter(r => r.condition === filters.condition);
    }

    if (filters?.resourceType && filters.resourceType !== 'all') {
      list = list.filter(r => r.resourceType === filters.resourceType);
    }

    if (filters?.location) {
      const q = filters.location.toLowerCase();
      list = list.filter(r => r.location.toLowerCase().includes(q));
    }

    if (filters?.minPrice !== undefined && !isNaN(filters.minPrice)) {
      list = list.filter(r => r.sellingPrice >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
      list = list.filter(r => r.sellingPrice <= filters.maxPrice!);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.sellerCompanyName.toLowerCase().includes(q)
      );
    }

    if (filters?.sortBy === 'price_asc') {
      list.sort((a, b) => a.sellingPrice - b.sellingPrice);
    } else if (filters?.sortBy === 'price_desc') {
      list.sort((a, b) => b.sellingPrice - a.sellingPrice);
    } else {
      // Newest
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }

  public getResourceById(id: string) {
    return this.data.resources.find(r => r.id === id);
  }

  public addResource(resource: Resource) {
    this.data.resources.push(resource);
    this.save();
    return resource;
  }

  public updateResource(id: string, updates: Partial<Resource>) {
    const res = this.getResourceById(id);
    if (!res) return null;
    Object.assign(res, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return res;
  }

  public removeResource(id: string) {
    const idx = this.data.resources.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.resources.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // Cart
  public getCart(userId: string): { resource: Resource; quantity: number }[] {
    const userCart = this.data.cart[userId] || [];
    const validItems: { resource: Resource; quantity: number }[] = [];

    for (const item of userCart) {
      const resource = this.getResourceById(item.resourceId);
      if (resource && resource.availability === 'available' && resource.status === 'active') {
        validItems.push({
          resource,
          quantity: Math.min(item.quantity, resource.quantity)
        });
      }
    }
    return validItems;
  }

  public addToCart(userId: string, resourceId: string, quantity: number) {
    if (!this.data.cart[userId]) {
      this.data.cart[userId] = [];
    }
    const existing = this.data.cart[userId].find(i => i.resourceId === resourceId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.data.cart[userId].push({ resourceId, quantity });
    }
    this.save();
    return this.getCart(userId);
  }

  public updateCartItem(userId: string, resourceId: string, quantity: number) {
    if (!this.data.cart[userId]) return [];
    if (quantity <= 0) {
      this.data.cart[userId] = this.data.cart[userId].filter(i => i.resourceId !== resourceId);
    } else {
      const item = this.data.cart[userId].find(i => i.resourceId === resourceId);
      if (item) item.quantity = quantity;
    }
    this.save();
    return this.getCart(userId);
  }

  public clearCart(userId: string) {
    this.data.cart[userId] = [];
    this.save();
  }

  // Orders
  public addOrder(order: Order) {
    this.data.orders.push(order);
    for (const item of order.items) {
      this.data.orderItems.push(item);
      // Reduce resource quantity or mark sold
      const res = this.getResourceById(item.resourceId);
      if (res) {
        res.quantity = Math.max(0, res.quantity - item.quantity);
        if (res.quantity === 0) {
          res.availability = 'sold';
        }
        res.updatedAt = new Date().toISOString();
      }
    }

    // Record pending transaction
    this.data.transactions.push({
      id: 'tx_' + Date.now(),
      orderId: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      amount: order.totalAmount,
      status: 'pending_gateway_setup',
      paymentNote: 'Payment gateway not configured. Order logged under B2B deferred settlement/invoice terms.',
      createdAt: new Date().toISOString()
    });

    // Notify seller
    this.addNotification({
      id: 'notif_' + Date.now() + '_s',
      userId: order.sellerId,
      title: 'New Surplus Resource Order',
      message: `${order.buyerCompanyName} placed order #${order.id.slice(-6)} for ${order.items.length} item(s) totalling ₹${order.totalAmount.toLocaleString('en-IN')}.`,
      type: 'order',
      read: false,
      link: '/seller/orders',
      createdAt: new Date().toISOString()
    });

    this.save();
    return order;
  }

  public getOrders(filters?: { buyerId?: string; sellerId?: string }) {
    let list = this.data.orders;
    if (filters?.buyerId) {
      list = list.filter(o => o.buyerId === filters.buyerId);
    }
    if (filters?.sellerId) {
      list = list.filter(o => o.sellerId === filters.sellerId);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  public getOrderById(id: string) {
    return this.data.orders.find(o => o.id === id);
  }

  public updateOrderStatus(id: string, status: Order['status']) {
    const order = this.getOrderById(id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();

    // If delivered, update transaction
    if (status === 'delivered') {
      const tx = this.data.transactions.find(t => t.orderId === id);
      if (tx) tx.status = 'completed';
    }

    // Notify buyer
    this.addNotification({
      id: 'notif_' + Date.now() + '_b',
      userId: order.buyerId,
      title: `Order Status Updated: ${status.toUpperCase()}`,
      message: `Your order #${order.id.slice(-6)} from ${order.sellerCompanyName} is now marked as ${status}.`,
      type: 'order',
      read: false,
      link: '/buyer/orders',
      createdAt: new Date().toISOString()
    });

    this.save();
    return order;
  }

  // Messages
  public getMessagesForUser(userId: string) {
    return this.data.messages.filter(m => m.senderId === userId || m.receiverId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addMessage(msg: Message) {
    this.data.messages.push(msg);
    this.addNotification({
      id: 'notif_' + Date.now() + '_m',
      userId: msg.receiverId,
      title: `New Message from ${msg.senderName}`,
      message: msg.content.length > 80 ? msg.content.slice(0, 77) + '...' : msg.content,
      type: 'message',
      read: false,
      link: '/messages',
      createdAt: new Date().toISOString()
    });
    this.save();
    return msg;
  }

  // Notifications
  public getNotifications(userId: string) {
    return this.data.notifications.filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notif: Notification) {
    this.data.notifications.push(notif);
    this.save();
    return notif;
  }

  public markNotificationRead(id: string) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.save();
    }
  }

  public markAllNotificationsRead(userId: string) {
    this.data.notifications
      .filter(n => n.userId === userId)
      .forEach(n => { n.read = true; });
    this.save();
  }

  // Live Calculated Statistics
  public getSellerStats(sellerId: string) {
    const sellerResources = this.data.resources.filter(r => r.sellerId === sellerId);
    const sellerOrders = this.data.orders.filter(o => o.sellerId === sellerId);

    const activeListings = sellerResources.filter(r => r.status === 'active' && r.availability === 'available').length;
    const availableQuantity = sellerResources
      .filter(r => r.status === 'active' && r.availability === 'available')
      .reduce((sum, r) => sum + r.quantity, 0);
    const soldResourcesCount = sellerResources.filter(r => r.availability === 'sold').length;
    const pendingOrders = sellerOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const totalRevenue = sellerOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const isEmpty = sellerResources.length === 0 && sellerOrders.length === 0;

    return {
      activeListings,
      availableQuantity,
      soldResourcesCount,
      pendingOrders,
      totalRevenue,
      totalListingsCreated: sellerResources.length,
      isEmpty
    };
  }

  public getAdminStats() {
    const totalBusinesses = this.data.businesses.length;
    const pendingVerifications = this.data.businessVerifications.filter(v => v.status === 'pending').length;
    const totalResources = this.data.resources.length;
    const activeResources = this.data.resources.filter(r => r.status === 'active' && r.availability === 'available').length;
    const totalOrders = this.data.orders.length;
    const totalTradeVolume = this.data.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const isEmpty = totalBusinesses === 0 && totalResources === 0 && totalOrders === 0;

    return {
      totalBusinesses,
      pendingVerifications,
      totalResources,
      activeResources,
      totalOrders,
      totalTradeVolume,
      totalUsers: this.data.users.length,
      isEmpty
    };
  }

  public getSustainabilityMetrics(): SustainabilityMetrics {
    const completedOrders = this.data.orders.filter(o => o.status === 'delivered' || o.status === 'shipped' || o.status === 'confirmed');
    
    // Calculate actual waste diverted from order items or active surplus listings
    let totalWasteDivertedKg = 0;
    let totalResourcesReused = 0;
    let totalResourcesDonated = 0;
    const categoriesExchanged: { [cat: string]: number } = {};

    for (const order of completedOrders) {
      for (const item of order.items) {
        totalResourcesReused += item.quantity;
        const weight = item.estimatedWeightKg ? item.estimatedWeightKg * item.quantity : item.quantity * 2.5;
        totalWasteDivertedKg += weight;
        categoriesExchanged[item.category] = (categoriesExchanged[item.category] || 0) + item.quantity;
      }
    }

    // Count donation listings that have been claimed
    for (const res of this.data.resources) {
      if (res.resourceType === 'for_donation' && res.availability === 'sold') {
        totalResourcesDonated += res.quantity;
      }
    }

    const participatingBusinessIds = new Set<string>();
    const sellerContribMap: { [sellerId: string]: number } = {};

    for (const o of completedOrders) {
      participatingBusinessIds.add(o.buyerId);
      participatingBusinessIds.add(o.sellerId);
      const itemsCount = o.items.reduce((s, i) => s + i.quantity, 0);
      sellerContribMap[o.sellerId] = (sellerContribMap[o.sellerId] || 0) + itemsCount;
    }

    const categoryBreakdown = Object.entries(categoriesExchanged).map(([category, count]) => ({
      category,
      count,
      weightKg: count * 2.5
    }));

    const topContributors = Object.entries(sellerContribMap).map(([sellerId, reusedCount]) => {
      const seller = this.data.users.find(u => u.id === sellerId);
      return {
        companyName: seller ? seller.companyName : 'Enterprise Partner',
        reusedCount,
        wasteDivertedKg: reusedCount * 2.5,
        co2SavedKg: Math.round(reusedCount * 2.5 * 1.85)
      };
    }).sort((a, b) => b.reusedCount - a.reusedCount).slice(0, 6);

    const isEmpty = completedOrders.length === 0 && this.data.resources.length === 0;

    return {
      totalWasteDivertedKg: Math.round(totalWasteDivertedKg),
      co2AvoidedKg: Math.round(totalWasteDivertedKg * 1.85),
      totalResourcesReused,
      totalResourcesDonated,
      activeBusinesses: participatingBusinessIds.size,
      totalOrdersCompleted: completedOrders.length,
      categoriesExchanged,
      categoryBreakdown,
      topContributors,
      isEmpty
    };
  }
}

export const db = new DatabaseManager();
