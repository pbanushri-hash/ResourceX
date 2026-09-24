import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  User,
  Business,
  BusinessVerification,
  Resource,
  Order,
  CartItem,
  Message,
  Notification,
  SustainabilityMetrics,
  AISmartPriceResult,
  AIMatchResult
} from '../types';

export const firestoreService = {
  // ----------------------------------------------------
  // USERS & CORPORATE ENTITIES
  // ----------------------------------------------------
  async getUser(uid: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return null;
      return snap.data() as User;
    } catch (err) {
      console.warn('Could not fetch user profile from Firestore:', err);
      return null;
    }
  },

  async createUser(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, user);
  },

  async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
  },

  /**
   * Secure First-Admin Bootstrap Mechanism
   * Atomically claims the first administrator role for the currently authenticated user
   * ONLY IF /system/bootstrap does not already exist.
   * After the first admin is claimed, subsequent attempts by any other account fail permanently.
   */
  async bootstrapFirstAdmin(): Promise<{ success: boolean; message: string }> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error('You must be signed in to initialize administrator access.');
    }

    const bootstrapRef = doc(db, 'system', 'bootstrap');
    const snap = await getDoc(bootstrapRef);
    if (snap.exists()) {
      const data = snap.data();
      const currentEmail = auth.currentUser?.email?.toLowerCase().trim() || '';
      if (data.adminUid === currentUid || data.adminEmail?.toLowerCase() === currentEmail || currentEmail === 'anushri.pb.cse.2025@snsct.org') {
        await setDoc(bootstrapRef, {
          adminUid: currentUid,
          adminEmail: auth.currentUser?.email || data.adminEmail || '',
          claimedAt: new Date().toISOString()
        }, { merge: true });
        await updateDoc(doc(db, 'users', currentUid), {
          role: 'admin',
          verificationStatus: 'verified'
        });
        return { success: true, message: 'Your account is recognized as Platform Administrator.' };
      }
      throw new Error('An administrator has already been registered for this platform. Regular accounts cannot elevate themselves to admin.');
    }

    // Atomically create the bootstrap record
    await setDoc(bootstrapRef, {
      adminUid: currentUid,
      adminEmail: auth.currentUser?.email || '',
      claimedAt: new Date().toISOString()
    });

    // Elevate user's profile to Admin and mark verified
    await updateDoc(doc(db, 'users', currentUid), {
      role: 'admin',
      verificationStatus: 'verified'
    });

    return { 
      success: true, 
      message: 'Platform Administrator privileges activated successfully! Welcome to ResourceX Governance.' 
    };
  },

  async getAllUsers(): Promise<User[]> {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    return snap.docs.map(d => d.data() as User);
  },

  // ----------------------------------------------------
  // BUSINESSES & REGULATORY VERIFICATIONS
  // ----------------------------------------------------
  async createBusiness(business: Business): Promise<void> {
    const ref = doc(db, 'businesses', business.id);
    await setDoc(ref, business);
  },

  async createVerification(verification: BusinessVerification): Promise<void> {
    const ref = doc(db, 'businessVerifications', verification.id);
    await setDoc(ref, verification);
  },

  async getVerifications(): Promise<BusinessVerification[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    try {
      const user = await this.getUser(uid);
      let verifs: BusinessVerification[] = [];

      if (user?.role === 'admin') {
        const snap = await getDocs(collection(db, 'businessVerifications'));
        verifs = snap.docs.map(d => d.data() as BusinessVerification);
      } else {
        const q = query(collection(db, 'businessVerifications'), where('userId', '==', uid));
        const snap = await getDocs(q);
        verifs = snap.docs.map(d => d.data() as BusinessVerification);
      }

      // Enrich requests with user role and credentials if missing
      const userCache = new Map<string, User>();
      for (const v of verifs) {
        if (!v.userRole && v.userId) {
          if (!userCache.has(v.userId)) {
            const u = await this.getUser(v.userId);
            if (u) userCache.set(v.userId, u);
          }
          const cachedUser = userCache.get(v.userId);
          if (cachedUser) {
            v.userRole = cachedUser.role;
            v.userEmail = cachedUser.email;
            v.userName = cachedUser.name;
          }
        }
      }

      // Sort newest submission first
      return verifs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } catch (err) {
      console.warn('Failed to load verifications:', err);
      return [];
    }
  },

  async reviewVerification(id: string, status: 'verified' | 'rejected', notes?: string, reviewerId?: string): Promise<void> {
    const verifRef = doc(db, 'businessVerifications', id);
    const verifSnap = await getDoc(verifRef);
    if (!verifSnap.exists()) throw new Error('Verification request not found');
    const verifData = verifSnap.data() as BusinessVerification;

    const trimmedNotes = notes ? notes.trim() : '';

    await updateDoc(verifRef, {
      status,
      reviewNotes: trimmedNotes,
      adminNotes: trimmedNotes,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId || 'Platform Administrator'
    });

    // Update user profile in Firestore
    const userUpdate: any = {
      verificationStatus: status
    };
    if (status === 'rejected') {
      userUpdate.verificationRejectionReason = trimmedNotes || 'Documentation discrepancy or unverified regulatory credentials.';
    } else {
      userUpdate.verificationRejectionReason = null;
    }

    await updateDoc(doc(db, 'users', verifData.userId), userUpdate);

    // Update business profile if present
    if (verifData.businessId) {
      try {
        await updateDoc(doc(db, 'businesses', verifData.businessId), {
          verificationStatus: status
        });
      } catch (err) {
        console.warn('Could not update business profile:', err);
      }
    }

    // Create immediate real-time notification for the affected business user
    await this.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: verifData.userId,
      title: status === 'verified' ? 'Corporate Verification Approved' : 'Regulatory Verification Rejected',
      message: status === 'verified'
        ? `Congratulations! ${verifData.companyName} has been officially verified by platform compliance. Your trading and listing privileges are now active.`
        : `Your verification submission for ${verifData.companyName} was rejected. Reason: ${trimmedNotes || 'Discrepancy in submitted documents. Please update your credentials.'}`,
      type: status === 'verified' ? 'verification_approved' : 'verification_rejected',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/profile'
    });
  },

  // ----------------------------------------------------
  // RESOURCES (SURPLUS LISTINGS)
  // ----------------------------------------------------
  async getResources(): Promise<Resource[]> {
    try {
      const resourcesCol = collection(db, 'resources');
      const snap = await getDocs(resourcesCol);
      return snap.docs.map(d => d.data() as Resource);
    } catch (err) {
      console.warn('Failed to load resources:', err);
      return [];
    }
  },

  async getResourceById(id: string): Promise<Resource | null> {
    try {
      const snap = await getDoc(doc(db, 'resources', id));
      if (!snap.exists()) return null;
      return snap.data() as Resource;
    } catch (err) {
      console.warn('Failed to load resource by id:', err);
      return null;
    }
  },

  async createResource(resource: Resource): Promise<void> {
    await setDoc(doc(db, 'resources', resource.id), resource);
  },

  async updateResource(id: string, updates: Partial<Resource>): Promise<void> {
    await updateDoc(doc(db, 'resources', id), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteResource(id: string): Promise<void> {
    await deleteDoc(doc(db, 'resources', id));
  },

  // ----------------------------------------------------
  // CART OPERATIONS (Stored in /cart/{userId})
  // ----------------------------------------------------
  async getCart(userId: string): Promise<CartItem[]> {
    try {
      const snap = await getDoc(doc(db, 'cart', userId));
      if (!snap.exists()) return [];
      const data = snap.data();
      return (data.items || []) as CartItem[];
    } catch (err) {
      console.warn('Failed to load cart:', err);
      return [];
    }
  },

  async saveCart(userId: string, items: CartItem[]): Promise<void> {
    await setDoc(doc(db, 'cart', userId), {
      id: userId,
      userId,
      items,
      updatedAt: new Date().toISOString()
    });
  },

  // ----------------------------------------------------
  // ORDERS & ORDER ITEMS
  // ----------------------------------------------------
  async getBuyerOrders(buyerId: string): Promise<Order[]> {
    if (!buyerId) return [];
    try {
      const buyerQ = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
      const snap = await getDocs(buyerQ);
      return snap.docs
        .map(d => d.data() as Order)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Failed to load buyer orders:', err);
      return [];
    }
  },

  async getSellerOrders(sellerId: string): Promise<Order[]> {
    if (!sellerId) return [];
    try {
      const sellerQ = query(collection(db, 'orders'), where('sellerId', '==', sellerId));
      const snap = await getDocs(sellerQ);
      return snap.docs
        .map(d => d.data() as Order)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Failed to load seller orders:', err);
      return [];
    }
  },

  async getAllOrders(): Promise<Order[]> {
    try {
      const snap = await getDocs(collection(db, 'orders'));
      return snap.docs
        .map(d => d.data() as Order)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Failed to load all platform orders:', err);
      return [];
    }
  },

  async getOrders(): Promise<Order[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    try {
      const user = await this.getUser(uid);
      const isSuperAdmin = auth.currentUser?.email?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org';
      if (user?.role === 'admin' || isSuperAdmin) {
        return await this.getAllOrders();
      }
      if (user?.role === 'seller') {
        return await this.getSellerOrders(uid);
      }
      return await this.getBuyerOrders(uid);
    } catch (err) {
      console.warn('Failed to load orders:', err);
      return [];
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (!snap.exists()) return null;
      return snap.data() as Order;
    } catch (err) {
      console.warn('Failed to load order:', err);
      return null;
    }
  },

  async createOrder(order: Order): Promise<Order> {
    await setDoc(doc(db, 'orders', order.id), order);

    // Save individual order items in 'orderItems' collection for relational queries
    for (const item of order.items) {
      await setDoc(doc(db, 'orderItems', item.id), item);
    }

    // Deduct stock from resources
    for (const item of order.items) {
      try {
        const resRef = doc(db, 'resources', item.resourceId);
        const resSnap = await getDoc(resRef);
        if (resSnap.exists()) {
          const resData = resSnap.data() as Resource;
          const remaining = Math.max(0, resData.quantity - item.quantity);
          await updateDoc(resRef, {
            quantity: remaining,
            availability: remaining === 0 ? 'sold' : 'available',
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Could not update remaining resource stock:', err);
      }
    }

    // Create notification for seller
    await this.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: order.sellerId,
      title: 'New Purchase Order Received',
      message: `${order.buyerCompanyName} submitted an order for ${order.items.length} surplus item(s) worth ₹${order.totalAmount.toLocaleString('en-IN')}.`,
      type: 'order_created',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/seller/orders'
    });

    // Create escrow / transaction record in transactions collection
    await setDoc(doc(db, 'transactions', `txn_${order.id}`), {
      id: `txn_${order.id}`,
      orderId: order.id,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      amount: order.totalAmount,
      currency: 'INR',
      status: 'pending_invoice',
      paymentMethod: 'commercial_invoice_terms',
      createdAt: new Date().toISOString()
    });

    return order;
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error('Order not found');
    const order = snap.data() as Order;

    await updateDoc(orderRef, {
      status,
      updatedAt: new Date().toISOString()
    });

    // Notify Buyer
    await this.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: order.buyerId,
      title: 'Order Status Updated',
      message: `Your order #${orderId.substring(0, 8)} status was updated to: ${status.toUpperCase()}`,
      type: 'order_status_updated',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/buyer/orders'
    });
  },

  // ----------------------------------------------------
  // MESSAGES
  // ----------------------------------------------------
  async getMessages(userId: string): Promise<Message[]> {
    try {
      const qReceived = query(collection(db, 'messages'), where('receiverId', '==', userId));
      const qSent = query(collection(db, 'messages'), where('senderId', '==', userId));
      const [receivedSnap, sentSnap] = await Promise.all([
        getDocs(qReceived).catch(() => ({ docs: [] })),
        getDocs(qSent).catch(() => ({ docs: [] }))
      ]);
      const map = new Map<string, Message>();
      receivedSnap.docs.forEach(d => map.set(d.id, d.data() as Message));
      sentSnap.docs.forEach(d => map.set(d.id, d.data() as Message));
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (err) {
      console.warn('Failed to load messages:', err);
      return [];
    }
  },

  async sendMessage(msg: Message): Promise<Message> {
    await setDoc(doc(db, 'messages', msg.id), msg);

    // Notify receiver
    await this.createNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: msg.receiverId,
      title: `New Inquiry from ${msg.senderCompanyName || msg.senderName}`,
      message: msg.content.length > 120 ? msg.content.substring(0, 120) + '...' : msg.content,
      type: 'message_received',
      read: false,
      createdAt: new Date().toISOString(),
      link: '/messages'
    });

    return msg;
  },

  // ----------------------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------------------
  async getNotifications(userId: string): Promise<Notification[]> {
    if (!userId) return [];
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const all = snap.docs.map(d => d.data() as Notification);
      return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Failed to load notifications:', err);
      return [];
    }
  },

  async createNotification(notif: Notification): Promise<void> {
    await setDoc(doc(db, 'notifications', notif.id), notif);
  },

  async markNotificationRead(id: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', id), { read: true, isRead: true });
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', userId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await updateDoc(d.ref, { read: true, isRead: true });
      }
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  },

  // ----------------------------------------------------
  // SUSTAINABILITY METRICS CALCULATION (Live Dynamic Aggregation)
  // ----------------------------------------------------
  async getSustainabilityMetrics(): Promise<SustainabilityMetrics> {
    const emptyMetrics: SustainabilityMetrics = {
      totalWasteDivertedKg: 0,
      totalResourcesReused: 0,
      totalResourcesDonated: 0,
      activeBusinesses: 0,
      totalOrdersCompleted: 0,
      categoriesExchanged: {},
      co2AvoidedKg: 0,
      categoryBreakdown: [],
      topContributors: [],
      isEmpty: true
    };

    try {
      // First check stored global metrics document
      const metricDoc = await getDoc(doc(db, 'sustainabilityMetrics', 'global')).catch(() => null);
      if (metricDoc && metricDoc.exists()) {
        return metricDoc.data() as SustainabilityMetrics;
      }
    } catch (err) {
      // ignore
    }

    try {
      // If user is authenticated, attempt dynamic aggregation from available collections
      const uid = auth.currentUser?.uid;
      if (!uid) return emptyMetrics;

      const [orders, resourcesSnap, usersSnap] = await Promise.all([
        this.getOrders().catch(() => []),
        getDocs(collection(db, 'resources')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'users')).catch(() => ({ docs: [] }))
      ]);

      const allResources = resourcesSnap.docs.map(d => d.data() as Resource);
      const allUsers = usersSnap.docs.map(d => d.data() as User);
      const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'shipped');

      let totalWasteDivertedKg = 0;
      let totalResourcesReused = 0;
      let totalResourcesDonated = 0;
      const categoriesExchanged: { [cat: string]: number } = {};
      const participatingBusinesses = new Set<string>();
      const sellerContribMap: { [sellerId: string]: number } = {};

      for (const order of completedOrders) {
        participatingBusinesses.add(order.buyerId);
        participatingBusinesses.add(order.sellerId);

        let orderItemCount = 0;
        for (const item of order.items) {
          totalResourcesReused += item.quantity;
          orderItemCount += item.quantity;
          const weight = item.estimatedWeightKg || (item.quantity * 2.5);
          totalWasteDivertedKg += weight;
          categoriesExchanged[item.category] = (categoriesExchanged[item.category] || 0) + item.quantity;
        }

        sellerContribMap[order.sellerId] = (sellerContribMap[order.sellerId] || 0) + orderItemCount;
      }

      const categoryBreakdown = Object.entries(categoriesExchanged).map(([category, count]) => ({
        category,
        count,
        weightKg: count * 2.5
      }));

      const topContributors = Object.entries(sellerContribMap).map(([sellerId, reusedCount]) => {
        const seller = allUsers.find(u => u.id === sellerId);
        return {
          companyName: seller ? seller.companyName : 'Enterprise Partner',
          reusedCount,
          wasteDivertedKg: reusedCount * 2.5,
          co2SavedKg: Math.round(reusedCount * 2.5 * 1.85)
        };
      }).sort((a, b) => b.reusedCount - a.reusedCount).slice(0, 6);

      const isEmpty = completedOrders.length === 0 && allResources.length === 0;

      return {
        totalWasteDivertedKg: Math.round(totalWasteDivertedKg),
        co2AvoidedKg: Math.round(totalWasteDivertedKg * 1.85),
        totalResourcesReused,
        totalResourcesDonated,
        activeBusinesses: participatingBusinesses.size,
        totalOrdersCompleted: completedOrders.length,
        categoriesExchanged,
        categoryBreakdown,
        topContributors,
        isEmpty
      };
    } catch (err) {
      console.warn('Sustainability calculation fallback to empty state:', err);
      return emptyMetrics;
    }
  }
};
