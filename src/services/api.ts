import { firestoreService } from './firestoreService';
import { firebaseAuthService } from './firebaseAuthService';
import { auth } from '../lib/firebase';
import {
  User,
  Resource,
  Order,
  CartItem,
  Message,
  Notification,
  BusinessVerification,
  SustainabilityMetrics,
  AISmartPriceResult,
  AIMatchResult
} from '../types';

// Helper for Gemini AI backend endpoints that remain server-side
async function aiBackendRequest<T>(endpoint: string, payload: any): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `AI Service failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // ----------------------------------------------------
  // AUTHENTICATION (Delegated directly to Firebase Auth + Firestore)
  // ----------------------------------------------------
  register: (payload: any) => firebaseAuthService.register(payload),
  login: (payload: { email: string; password: string }) => firebaseAuthService.login(payload.email, payload.password),
  getCurrentUser: async () => {
    const currentFbUser = auth.currentUser;
    if (!currentFbUser) return { user: null as any };
    const user = await firestoreService.getUser(currentFbUser.uid);
    if (user && (user.email?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org' || currentFbUser.email?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org')) {
      user.role = 'admin';
      user.verificationStatus = 'verified';
    }
    return { user: user as User };
  },
  submitVerification: async (payload: {
    registrationNumber: string;
    gstNumber: string;
    companyName?: string;
    address?: string;
    documentName?: string;
    documentDataUrl?: string;
    documentUrl?: string;
  }) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const user = await firestoreService.getUser(uid);
    if (!user) throw new Error('User not found');

    const verif: BusinessVerification = {
      id: `verif_${uid}_${Date.now()}`,
      businessId: user.businessId || `biz_${uid}`,
      userId: uid,
      userRole: user.role,
      userEmail: user.email,
      userName: user.name,
      companyName: payload.companyName || user.companyName,
      businessType: user.businessType,
      registrationNumber: payload.registrationNumber,
      gstNumber: payload.gstNumber,
      address: payload.address || user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      documentName: payload.documentName || 'Document.pdf',
      documentUrl: payload.documentUrl || payload.documentDataUrl || '',
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    await firestoreService.createVerification(verif);
    await firestoreService.updateUser(uid, {
      registrationNumber: payload.registrationNumber,
      gstNumber: payload.gstNumber,
      verificationStatus: 'pending'
    });

    return { message: 'Regulatory verification request submitted for compliance audit.' };
  },

  // ----------------------------------------------------
  // RESOURCES (Surplus Marketplace via Firestore)
  // ----------------------------------------------------
  getResources: async (params?: {
    category?: string;
    condition?: string;
    type?: string;
    resourceType?: string;
    location?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    availability?: string;
    sortBy?: string;
  }) => {
    let resources = await firestoreService.getResources();

    // Only display published / active resources
    resources = resources.filter(r => !r.status || r.status === 'active');

    if (params) {
      if (params.category && params.category !== 'All' && params.category !== 'All Categories') {
        resources = resources.filter(r => r.category.toLowerCase() === params.category!.toLowerCase());
      }
      if (params.condition && params.condition !== 'All' && params.condition !== 'All Conditions') {
        resources = resources.filter(r => r.condition === params.condition);
      }
      const typeFilter = params.resourceType || params.type;
      if (typeFilter && typeFilter !== 'All') {
        resources = resources.filter(r => r.resourceType === typeFilter);
      }
      if (params.location) {
        resources = resources.filter(r => r.location.toLowerCase().includes(params.location!.toLowerCase()));
      }
      if (params.availability && params.availability !== 'All') {
        resources = resources.filter(r => r.availability === params.availability);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        resources = resources.filter(r =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.sellerCompanyName.toLowerCase().includes(q)
        );
      }
      if (params.minPrice !== undefined) {
        resources = resources.filter(r => r.sellingPrice >= params.minPrice!);
      }
      if (params.maxPrice !== undefined) {
        resources = resources.filter(r => r.sellingPrice <= params.maxPrice!);
      }

      if (params.sortBy === 'price_asc') {
        resources.sort((a, b) => a.sellingPrice - b.sellingPrice);
      } else if (params.sortBy === 'price_desc') {
        resources.sort((a, b) => b.sellingPrice - a.sellingPrice);
      } else if (params.sortBy === 'newest') {
        resources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    return resources;
  },

  getResourceById: (id: string) => firestoreService.getResourceById(id),

  createResource: async (payload: any) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const user = await firestoreService.getUser(uid);

    const isVerifiedSeller = user?.role === 'seller' && user?.verificationStatus === 'verified';
    const isAdmin = user?.role === 'admin' || user?.email?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org' || auth.currentUser?.email?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org';

    if (!isVerifiedSeller && !isAdmin) {
      throw new Error(
        `Only verified sellers can publish surplus resources to the live marketplace. Your business verification status is: ${user?.verificationStatus || 'unverified'}. Please complete regulatory verification first.`
      );
    }

    const now = new Date().toISOString();
    const newResource: Resource = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sellerId: uid,
      businessId: user?.businessId || `biz_${uid}`,
      sellerCompanyName: user?.companyName || user?.name || 'Enterprise Seller',
      sellerLocation: payload.location || `${user?.city || ''}, ${user?.state || ''}`,
      name: payload.name.trim(),
      category: payload.category,
      description: payload.description.trim(),
      quantity: Number(payload.quantity),
      unit: payload.unit || 'units',
      condition: payload.condition,
      originalPrice: Number(payload.originalPrice || 0),
      sellingPrice: payload.resourceType === 'donation' ? 0 : Number(payload.sellingPrice || 0),
      minOrderQuantity: Number(payload.minOrderQuantity || 1),
      location: payload.location.trim(),
      availability: payload.availability || 'available',
      images: payload.images && payload.images.length > 0 ? payload.images : [],
      resourceType: payload.resourceType || 'for_sale',
      expiryDate: payload.expiryDate || undefined,
      sustainabilityInfo: payload.sustainabilityInfo || {
        estimatedWeightKg: Number(payload.quantity) * 2.5,
        co2SavingsKg: Math.round(Number(payload.quantity) * 2.5 * 1.85),
        recyclabilityNotes: 'High circular repurposing potential'
      },
      status: 'active',
      createdAt: now,
      updatedAt: now
    };

    await firestoreService.createResource(newResource);
    return newResource;
  },

  updateResource: async (id: string, payload: any): Promise<Resource> => {
    await firestoreService.updateResource(id, payload);
    const updated = await firestoreService.getResourceById(id);
    if (updated) return updated;
    return { id, ...payload } as Resource;
  },

  deleteResource: (id: string) => firestoreService.deleteResource(id),

  getMyResources: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const all = await firestoreService.getResources();
    return all.filter(r => r.sellerId === uid);
  },

  getSellerResources: async (sellerId?: string): Promise<Resource[]> => {
    const uid = sellerId || auth.currentUser?.uid;
    if (!uid) return [];
    const all = await firestoreService.getResources();
    return all.filter(r => r.sellerId === uid);
  },

  getSellerStats: async (sellerId?: string) => {
    const uid = sellerId || auth.currentUser?.uid;
    if (!uid) {
      return {
        totalRevenue: 0,
        soldResourcesCount: 0,
        activeListings: 0,
        availableQuantity: 0,
        pendingOrders: 0,
        isEmpty: true
      };
    }
    const [allResources, allOrders] = await Promise.all([
      firestoreService.getResources(),
      firestoreService.getOrders()
    ]);
    const sellerResources = allResources.filter(r => r.sellerId === uid);
    const sellerOrders = allOrders.filter(o => o.sellerId === uid);

    const activeListings = sellerResources.filter(r => r.status === 'active').length;
    const availableQuantity = sellerResources.reduce(
      (sum, r) => sum + (r.availability === 'available' ? r.quantity : 0),
      0
    );
    const deliveredOrders = sellerOrders.filter(o => o.status === 'delivered' || o.status === 'shipped');
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const soldResourcesCount = deliveredOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
      0
    );
    const pendingOrders = sellerOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;

    const isEmpty = sellerResources.length === 0 && sellerOrders.length === 0;

    return {
      totalRevenue,
      soldResourcesCount,
      activeListings,
      availableQuantity,
      pendingOrders,
      isEmpty
    };
  },

  // ----------------------------------------------------
  // CART (Stored in Firestore /cart/{userId})
  // ----------------------------------------------------
  getCart: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    return firestoreService.getCart(uid);
  },

  addToCart: async (resourceId: string, quantity: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    const resource = await firestoreService.getResourceById(resourceId);
    if (!resource) throw new Error('Resource not found');

    const currentCart = await firestoreService.getCart(uid);
    const existingIndex = currentCart.findIndex(i => i.resourceId === resourceId);

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += quantity;
    } else {
      currentCart.push({
        resourceId,
        resource,
        quantity
      });
    }

    await firestoreService.saveCart(uid, currentCart);
    return currentCart;
  },

  updateCartItem: async (resourceId: string, quantity: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    let currentCart = await firestoreService.getCart(uid);
    if (quantity <= 0) {
      currentCart = currentCart.filter(i => i.resourceId !== resourceId);
    } else {
      const item = currentCart.find(i => i.resourceId === resourceId);
      if (item) item.quantity = quantity;
    }

    await firestoreService.saveCart(uid, currentCart);
    return currentCart;
  },

  removeFromCart: async (resourceId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    const currentCart = await firestoreService.getCart(uid);
    const updated = currentCart.filter(i => i.resourceId !== resourceId);
    await firestoreService.saveCart(uid, updated);
    return updated;
  },

  clearCart: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await firestoreService.saveCart(uid, []);
  },

  // ----------------------------------------------------
  // ORDERS (Stored in Firestore /orders and /orderItems)
  // ----------------------------------------------------
  createOrder: async (payload: {
    items: { resourceId: string; quantity: number }[];
    shippingAddress: string;
    notes?: string;
  }) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const user = await firestoreService.getUser(uid);
    if (!user) throw new Error('User not found');

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // Group items by seller
    const sellerItemsMap: { [sellerId: string]: any[] } = {};
    for (const reqItem of payload.items) {
      const resource = await firestoreService.getResourceById(reqItem.resourceId);
      if (!resource) throw new Error(`Resource ${reqItem.resourceId} not found`);
      if (resource.quantity < reqItem.quantity) {
        throw new Error(`Insufficient surplus stock for: ${resource.name}`);
      }

      if (!sellerItemsMap[resource.sellerId]) {
        sellerItemsMap[resource.sellerId] = [];
      }
      sellerItemsMap[resource.sellerId].push({
        resource,
        quantity: reqItem.quantity
      });
    }

    const createdOrders: Order[] = [];
    const now = new Date().toISOString();

    for (const [sellerId, itemsGroup] of Object.entries(sellerItemsMap)) {
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const seller = await firestoreService.getUser(sellerId);

      const orderItems = itemsGroup.map((ig, idx) => ({
        id: `oi_${orderId}_${idx}`,
        orderId,
        resourceId: ig.resource.id,
        resourceName: ig.resource.name,
        category: ig.resource.category,
        quantity: ig.quantity,
        unit: ig.resource.unit,
        pricePerUnit: ig.resource.sellingPrice,
        totalPrice: ig.quantity * ig.resource.sellingPrice,
        estimatedWeightKg: ig.quantity * 2.5
      }));

      const totalAmount = orderItems.reduce((acc, it) => acc + it.totalPrice, 0);

      const newOrder: Order = {
        id: orderId,
        buyerId: uid,
        buyerName: user.name,
        buyerCompanyName: user.companyName,
        sellerId,
        sellerCompanyName: seller?.companyName || itemsGroup[0].resource.sellerCompanyName || 'Verified Supplier',
        items: orderItems,
        totalAmount,
        status: 'pending',
        shippingAddress: payload.shippingAddress,
        paymentStatus: 'pending_gateway',
        notes: payload.notes || '',
        createdAt: now,
        updatedAt: now
      };

      await firestoreService.createOrder(newOrder);
      createdOrders.push(newOrder);
    }

    // Clear buyer's cart after successful checkout
    await firestoreService.saveCart(uid, []);

    const firstOrder = createdOrders[0] || ({} as Order);
    return {
      message: 'Purchase orders created and submitted to suppliers.',
      orders: createdOrders,
      ...firstOrder
    };
  },

  getOrders: async (): Promise<Order[]> => {
    return firestoreService.getOrders();
  },

  getBuyerOrders: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    return firestoreService.getBuyerOrders(uid);
  },

  getSellerOrders: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    return firestoreService.getSellerOrders(uid);
  },

  getAllOrders: async () => {
    return firestoreService.getAllOrders();
  },

  updateOrderStatus: async (id: string, status: Order['status']): Promise<Order> => {
    await firestoreService.updateOrderStatus(id, status);
    const updated = await firestoreService.getOrderById(id);
    if (updated) return updated;
    return { id, status } as any;
  },

  // ----------------------------------------------------
  // MESSAGES
  // ----------------------------------------------------
  getMessages: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    return firestoreService.getMessages(uid);
  },

  sendMessage: async (payload: {
    receiverId: string;
    content: string;
    resourceId?: string;
    resourceName?: string;
  }) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const sender = await firestoreService.getUser(uid);
    const receiver = await firestoreService.getUser(payload.receiverId);

    const msg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: uid,
      senderName: sender?.name || 'Authorized Signatory',
      senderCompanyName: sender?.companyName,
      senderRole: sender?.role,
      receiverId: payload.receiverId,
      receiverName: receiver?.name || 'Counterparty',
      receiverCompanyName: receiver?.companyName,
      resourceId: payload.resourceId,
      resourceName: payload.resourceName,
      content: payload.content,
      read: false,
      createdAt: new Date().toISOString()
    };

    return firestoreService.sendMessage(msg);
  },

  // ----------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------
  getNotifications: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    return firestoreService.getNotifications(uid);
  },

  markNotificationRead: (id: string) => firestoreService.markNotificationRead(id),

  markAllNotificationsRead: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { success: true };
    await firestoreService.markAllNotificationsRead(uid);
    return { success: true };
  },

  // ----------------------------------------------------
  // SUSTAINABILITY & ESG IMPACT
  // ----------------------------------------------------
  getSustainability: () => firestoreService.getSustainabilityMetrics(),

  // ----------------------------------------------------
  // ADMIN GOVERNANCE (Live Firestore Collections)
  // ----------------------------------------------------
  getVerifications: () => firestoreService.getVerifications(),
  getAdminVerifications: () => firestoreService.getVerifications(),

  reviewVerification: (id: string, status: 'verified' | 'rejected', notes?: string) => {
    const uid = auth.currentUser?.uid;
    return firestoreService.reviewVerification(id, status, notes, uid);
  },

  getUsers: () => firestoreService.getAllUsers(),
  getAdminUsers: () => firestoreService.getAllUsers(),

  updateUserVerification: async (userId: string, status: string) => {
    await firestoreService.updateUser(userId, { verificationStatus: status as any });
    return { success: true, status };
  },

  getAdminAnalytics: async () => {
    const [users, verifs, resources, orders] = await Promise.all([
      firestoreService.getAllUsers(),
      firestoreService.getVerifications(),
      firestoreService.getResources(),
      firestoreService.getOrders()
    ]);

    const totalTransactionValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalBusinesses: users.filter(u => u.role !== 'admin').length,
      totalUsers: users.length,
      pendingVerifications: verifs.filter(v => v.status === 'pending').length,
      totalResources: resources.length,
      activeResources: resources.filter(r => !r.status || r.status === 'active').length,
      totalOrders: orders.length,
      totalTradeVolume: totalTransactionValue,
      totalTransactionValue,
      recentUsers: users.slice(-5).reverse(),
      recentVerifications: verifs.slice(-5).reverse()
    };
  },

  claimAdminRole: async (passcode?: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    // If passcode is provided and matches server-side secret, allow claiming
    if (passcode && passcode.trim()) {
      try {
        const res = await fetch('/api/admin/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: passcode.trim(), uid })
        });
        if (res.ok) {
          await firestoreService.updateUser(uid, {
            role: 'admin',
            verificationStatus: 'verified',
            verificationRejectionReason: null
          });
          return { success: true, message: 'Account granted platform Administrator privileges.' };
        }
      } catch (e) {
        // Fallback to bootstrap check below
      }
    }

    // Secure first-admin bootstrap: allows the first authenticated account to bootstrap governance
    return await firestoreService.bootstrapFirstAdmin();
  },

  // ----------------------------------------------------
  // GEMINI AI INTEGRATIONS (Proxied to secure server routes)
  // ----------------------------------------------------
  aiSuggestCategory: (title: string) =>
    aiBackendRequest<{ category: string; suggestedUnit: string; tags: string[]; reasoning: string }>(
      '/api/ai/category-suggest',
      { input: title, title, name: title }
    ),

  aiCategorize: (payload: { name: string; description?: string }) =>
    aiBackendRequest<{ category: string; tags: string[]; recommendedUnit: string; circularPotential: string }>(
      '/api/ai/category-suggest',
      { input: payload.name, ...payload }
    ),

  aiGenerateDescription: (payload: {
    name: string;
    category?: string;
    condition?: string;
    quantity?: number;
    unit?: string;
    originalPrice?: number;
    location?: string;
    industrySector?: string;
  }) =>
    aiBackendRequest<{
      description: string;
      sustainabilityHighlight: string;
      sustainabilityImpact?: string;
      specifications: string[];
      circularNotes?: string;
    }>(
      '/api/ai/generate-description',
      payload
    ),

  aiSmartPricing: (payload: {
    name: string;
    category?: string;
    condition?: string;
    originalPrice: number;
    quantity?: number;
    unit?: string;
    location?: string;
  }) =>
    aiBackendRequest<AISmartPriceResult>(
      '/api/ai/smart-pricing',
      payload
    ),

  aiSmartPrice: (payload: {
    name: string;
    category: string;
    condition: string;
    originalPrice: number;
    quantity: number;
    unit?: string;
    location?: string;
  }) =>
    aiBackendRequest<AISmartPriceResult>(
      '/api/ai/smart-pricing',
      payload
    ),

  aiDuplicateCheck: async (payload: { name: string; category?: string; description?: string }) => {
    const uid = auth.currentUser?.uid;
    let existingResources: Resource[] = [];
    if (uid) {
      try {
        const all = await firestoreService.getResources();
        existingResources = all.filter(r => r.sellerId === uid && (!r.status || r.status === 'active'));
      } catch (err) {
        console.warn('Could not query seller resources for duplicate check:', err);
      }
    }
    return aiBackendRequest<{ isDuplicate: boolean; warningMessage?: string; similarResourceId?: string; confidenceScore?: number; rationale?: string }>(
      '/api/ai/duplicate-check',
      { ...payload, existingResources }
    );
  },

  aiCheckDuplicate: async (payload: { name: string; category: string; description: string }) => {
    const uid = auth.currentUser?.uid;
    let existingResources: Resource[] = [];
    if (uid) {
      try {
        const all = await firestoreService.getResources();
        existingResources = all.filter(r => r.sellerId === uid && (!r.status || r.status === 'active'));
      } catch (err) {
        console.warn('Could not query seller resources for duplicate check:', err);
      }
    }
    return aiBackendRequest<{ isDuplicate: boolean; warningMessage?: string; similarResourceId?: string; confidenceScore?: number; rationale?: string }>(
      '/api/ai/duplicate-check',
      { ...payload, existingResources }
    );
  },

  aiMatchRequirements: (payload: {
    query?: string;
    keywords?: string;
    category?: string;
    targetQuantity?: number;
    maxBudget?: number;
    location?: string;
    urgency?: string;
    businessType?: string;
  }) =>
    aiBackendRequest<AIMatchResult>(
      '/api/ai/matching',
      {
        ...payload,
        keywords: payload.keywords || payload.query || ''
      }
    )
};

function igs(v: any) {
  return typeof v === 'string' ? v : 'Industrial Enterprise';
}
