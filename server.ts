import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { 
  suggestCategory, 
  generateDescription, 
  calculateSmartPricing, 
  checkDuplicateListing, 
  matchBuyerRequirements 
} from './server/gemini.js';
import { User, Business, BusinessVerification, Resource, Order, Message } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Helper auth middleware from headers
  function getAuthUser(req: express.Request): User | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    // In our lightweight authenticated session, token contains the user ID
    return db.getUserById(token) || null;
  }

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  app.post('/api/auth/register', (req, res) => {
    try {
      const {
        fullName,
        email,
        password,
        confirmPassword,
        phone,
        companyName,
        businessType,
        registrationNumber,
        gstNumber,
        address,
        city,
        state,
        country,
        role,
        documentDataUrl,
        documentName
      } = req.body;

      if (!fullName || !email || !password || !companyName || !role) {
        return res.status(400).json({ error: 'Missing required registration fields' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const existingUser = db.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists' });
      }

      const userId = 'usr_' + Date.now();
      const businessId = 'biz_' + Date.now();
      const isAdmin = role === 'admin';
      const initialVerificationStatus = isAdmin ? 'verified' : 'pending';

      const business: Business = {
        id: businessId,
        userId,
        companyName,
        businessType: businessType || 'Private Limited',
        registrationNumber: registrationNumber || 'PENDING-REG',
        gstNumber: gstNumber || 'PENDING-GST',
        address: address || 'Corporate Headquarters',
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        country: country || 'India',
        verificationStatus: initialVerificationStatus,
        verificationDocUrl: documentDataUrl || '',
        verificationDocName: documentName || 'Registration Certificate.pdf',
        createdAt: new Date().toISOString()
      };
      db.addBusiness(business);

      // Business verification request
      const verificationReq: BusinessVerification = {
        id: 'verif_' + Date.now(),
        businessId,
        userId,
        companyName,
        registrationNumber: registrationNumber || 'PENDING-REG',
        gstNumber: gstNumber || 'PENDING-GST',
        address: `${address || ''}, ${city || ''}, ${state || ''}, ${country || ''}`,
        documentName: documentName || 'Incorporation Certificate.pdf',
        documentUrl: documentDataUrl || '',
        status: initialVerificationStatus,
        submittedAt: new Date().toISOString()
      };
      db.addVerification(verificationReq);

      const user: User & { passwordHash: string } = {
        id: userId,
        name: fullName,
        email: email.toLowerCase(),
        phone: phone || '',
        role: role as 'buyer' | 'seller' | 'admin',
        businessId,
        companyName,
        businessType: businessType || 'Private Limited',
        registrationNumber: registrationNumber || '',
        gstNumber: gstNumber || '',
        address: address || '',
        city: city || '',
        state: state || '',
        country: country || 'India',
        verificationStatus: initialVerificationStatus,
        createdAt: new Date().toISOString(),
        passwordHash: password // In production use bcrypt
      };
      db.addUser(user);

      // Create welcome notification
      db.addNotification({
        id: 'notif_' + Date.now(),
        userId,
        title: 'Welcome to ResourceX',
        message: isAdmin 
          ? 'Admin account created successfully with full platform governance access.'
          : 'Your account has been created. Your business verification is currently pending admin review.',
        type: 'verification',
        read: false,
        link: '/profile',
        createdAt: new Date().toISOString()
      });

      // Strip passwordHash in response
      const { passwordHash: _, ...safeUser } = user;
      return res.json({
        token: user.id,
        user: safeUser,
        message: 'Your account has been created. Your business verification is pending.'
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: err.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = db.getUserByEmail(email);
      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const { passwordHash: _, ...safeUser } = user;
      return res.json({
        token: user.id,
        user: safeUser
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  // Admin passcode verification on server-side (no credentials in frontend code)
  app.post('/api/admin/verify-passcode', (req, res) => {
    try {
      const { passcode } = req.body;
      const expectedSecret = process.env.ADMIN_SETUP_SECRET || process.env.ADMIN_KEY;
      if (!expectedSecret) {
        return res.status(403).json({
          error: 'Server-side ADMIN_SETUP_SECRET is not configured. Assign the Admin role securely via Firebase Console by editing the user document in Firestore.'
        });
      }
      if (!passcode || passcode.trim() !== expectedSecret.trim()) {
        return res.status(401).json({ error: 'Invalid Administrator Security Passcode.' });
      }
      return res.json({ success: true, message: 'Administrator passcode verified.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  });

  app.post('/api/admin/claim', (req, res) => {
    try {
      const { passcode, uid } = req.body;
      const expectedSecret = process.env.ADMIN_SETUP_SECRET || process.env.ADMIN_KEY;
      if (!expectedSecret) {
        return res.status(403).json({
          error: 'Server-side ADMIN_SETUP_SECRET is not configured. Assign the Admin role securely via Firebase Console by editing the user document in Firestore.'
        });
      }
      if (!passcode || passcode.trim() !== expectedSecret.trim()) {
        return res.status(401).json({ error: 'Invalid Administrator Security Passcode.' });
      }
      if (!uid) {
        return res.status(400).json({ error: 'User UID is required.' });
      }
      return res.json({ success: true, message: 'Administrator credentials verified.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { passwordHash: _, ...safeUser } = user as any;
    return res.json({ user: safeUser });
  });

  // ==========================================
  // BUSINESS VERIFICATIONS (Admin + Seller/Buyer)
  // ==========================================

  app.get('/api/verifications', (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return res.json(db.getVerifications());
  });

  app.post('/api/verifications/:id/review', (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { status, notes } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified or rejected' });
    }

    const updated = db.reviewVerification(req.params.id, status, notes || '', user.id);
    if (!updated) {
      return res.status(404).json({ error: 'Verification request not found' });
    }
    return res.json(updated);
  });

  app.post('/api/verifications/submit', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { companyName, registrationNumber, gstNumber, address, documentName, documentUrl } = req.body;
    const verif: BusinessVerification = {
      id: 'verif_' + Date.now(),
      businessId: user.businessId,
      userId: user.id,
      companyName: companyName || user.companyName,
      registrationNumber: registrationNumber || user.registrationNumber,
      gstNumber: gstNumber || user.gstNumber,
      address: address || user.address,
      documentName: documentName || 'Verification_Document.pdf',
      documentUrl: documentUrl || '',
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    db.addVerification(verif);
    db.updateUserVerification(user.id, 'pending');
    return res.json(verif);
  });

  // ==========================================
  // RESOURCES (Surplus Listings)
  // ==========================================

  app.get('/api/resources', (req, res) => {
    const { category, search, condition, minPrice, maxPrice, resourceType, location, sortBy } = req.query;
    const resources = db.getResources({
      category: category as string,
      search: search as string,
      condition: condition as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      resourceType: resourceType as string,
      location: location as string,
      sortBy: sortBy as any
    });
    return res.json(resources);
  });

  app.get('/api/resources/:id', (req, res) => {
    const resource = db.getResourceById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    return res.json(resource);
  });

  app.get('/api/seller/resources', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const resources = db.getResources({ sellerId: user.id });
    return res.json(resources);
  });

  app.get('/api/seller/stats', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    return res.json(db.getSellerStats(user.id));
  });

  app.post('/api/resources', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role !== 'seller' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only sellers can list surplus resources' });
    }

    if (user.verificationStatus !== 'verified') {
      return res.status(403).json({ error: 'Your business verification is pending. Only verified businesses can actively list surplus resources.' });
    }

    const {
      name,
      category,
      description,
      quantity,
      unit,
      condition,
      originalPrice,
      sellingPrice,
      minOrderQuantity,
      location,
      images,
      resourceType,
      expiryDate,
      sustainabilityInfo
    } = req.body;

    if (!name || !category || !quantity || !sellingPrice) {
      return res.status(400).json({ error: 'Missing required listing fields' });
    }

    const newResource: Resource = {
      id: 'res_' + Date.now(),
      sellerId: user.id,
      sellerCompanyName: user.companyName,
      sellerLocation: location || `${user.city}, ${user.state}`,
      name,
      category,
      description: description || '',
      quantity: Number(quantity),
      unit: unit || 'units',
      condition: condition || 'Surplus / Unused',
      originalPrice: Number(originalPrice || sellingPrice),
      sellingPrice: Number(sellingPrice),
      minOrderQuantity: Number(minOrderQuantity || 1),
      location: location || `${user.city}, ${user.state}`,
      availability: 'available',
      images: Array.isArray(images) && images.length > 0 ? images : [],
      resourceType: (resourceType as any) || 'for_sale',
      expiryDate: expiryDate || undefined,
      sustainabilityInfo: sustainabilityInfo || {
        estimatedWeightKg: Number(quantity) * 2,
        co2SavingsKg: Number(quantity) * 3.5,
        recyclabilityNotes: 'Diverted from industrial surplus disposal'
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.addResource(newResource);
    return res.json(saved);
  });

  app.put('/api/resources/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = db.getResourceById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Resource not found' });

    if (existing.sellerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }

    const updated = db.updateResource(req.params.id, req.body);
    return res.json(updated);
  });

  app.delete('/api/resources/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = db.getResourceById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Resource not found' });

    if (existing.sellerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    db.removeResource(req.params.id);
    return res.json({ success: true, message: 'Resource removed' });
  });

  // ==========================================
  // CART & CHECKOUT
  // ==========================================

  app.get('/api/cart', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.json([]);
    return res.json(db.getCart(user.id));
  });

  app.post('/api/cart', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Please login to add items to cart' });
    const { resourceId, quantity } = req.body;
    if (!resourceId) return res.status(400).json({ error: 'Resource ID is required' });

    const resource = db.getResourceById(resourceId);
    if (!resource || resource.availability !== 'available') {
      return res.status(400).json({ error: 'Resource is no longer available' });
    }

    const cart = db.addToCart(user.id, resourceId, Math.max(1, Number(quantity) || 1));
    return res.json(cart);
  });

  app.patch('/api/cart/:resourceId', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { quantity } = req.body;
    const cart = db.updateCartItem(user.id, req.params.resourceId, Number(quantity));
    return res.json(cart);
  });

  app.delete('/api/cart/:resourceId', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const cart = db.updateCartItem(user.id, req.params.resourceId, 0);
    return res.json(cart);
  });

  app.delete('/api/cart', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    db.clearCart(user.id);
    return res.json([]);
  });

  // ==========================================
  // ORDERS
  // ==========================================

  app.get('/api/orders', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role === 'admin') {
      return res.json(db.getOrders());
    } else if (user.role === 'seller') {
      return res.json(db.getOrders({ sellerId: user.id }));
    } else {
      return res.json(db.getOrders({ buyerId: user.id }));
    }
  });

  app.get('/api/orders/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.buyerId !== user.id && order.sellerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this order' });
    }
    return res.json(order);
  });

  app.post('/api/orders', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Please login to place orders' });

    if (user.role !== 'buyer' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only registered buyers can place purchase orders' });
    }

    if (user.verificationStatus !== 'verified') {
      return res.status(403).json({ error: 'Your business verification is pending. Only verified businesses can place orders.' });
    }

    const { items, shippingAddress, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Group items by seller or process each seller order
    const createdOrders: Order[] = [];

    // Group by sellerId
    const sellerGroups: { [sellerId: string]: typeof items } = {};
    for (const it of items) {
      const resource = db.getResourceById(it.resourceId);
      if (!resource || resource.availability !== 'available' || resource.status !== 'active') {
        return res.status(400).json({ error: `Resource "${it.resourceName || it.resourceId}" is not available` });
      }
      if (resource.quantity < it.quantity) {
        return res.status(400).json({ error: `Requested quantity for "${resource.name}" exceeds stock (${resource.quantity} available)` });
      }
      if (!sellerGroups[resource.sellerId]) {
        sellerGroups[resource.sellerId] = [];
      }
      sellerGroups[resource.sellerId].push({ ...it, resource });
    }

    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
      const seller = db.getUserById(sellerId);
      const orderId = 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const orderItems = sellerItems.map((item: any) => ({
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        orderId,
        resourceId: item.resource.id,
        resourceName: item.resource.name,
        category: item.resource.category,
        quantity: item.quantity,
        unit: item.resource.unit,
        pricePerUnit: item.resource.sellingPrice,
        totalPrice: item.quantity * item.resource.sellingPrice,
        estimatedWeightKg: item.resource.sustainabilityInfo?.estimatedWeightKg || 2
      }));

      const totalAmount = orderItems.reduce((sum: number, i: any) => sum + i.totalPrice, 0);

      const order: Order = {
        id: orderId,
        buyerId: user.id,
        buyerName: user.name,
        buyerCompanyName: user.companyName,
        sellerId,
        sellerCompanyName: seller ? seller.companyName : sellerItems[0].resource.sellerCompanyName,
        items: orderItems,
        totalAmount,
        status: 'pending',
        shippingAddress: shippingAddress || `${user.address}, ${user.city}, ${user.state}`,
        paymentStatus: 'pending_gateway',
        notes: notes || 'Standard circular procurement purchase agreement',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.addOrder(order);
      createdOrders.push(order);
    }

    // Clear buyer's cart
    db.clearCart(user.id);

    return res.json({
      orders: createdOrders,
      message: 'Orders placed successfully. Payment gateway not configured. Order logged under B2B invoice terms.'
    });
  });

  app.patch('/api/orders/:id/status', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { status } = req.body;

    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Sellers and Admins can update fulfillment status, buyers can confirm receipt or cancel
    if (order.sellerId !== user.id && order.buyerId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updated = db.updateOrderStatus(req.params.id, status);
    return res.json(updated);
  });

  // ==========================================
  // MESSAGES
  // ==========================================

  app.get('/api/messages', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    return res.json(db.getMessagesForUser(user.id));
  });

  app.post('/api/messages', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { receiverId, content, resourceId, resourceName } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver and content are required' });
    }

    const receiver = db.getUserById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Recipient business not found' });
    }

    const msg: Message = {
      id: 'msg_' + Date.now(),
      senderId: user.id,
      senderName: user.companyName ? `${user.name} (${user.companyName})` : user.name,
      senderRole: user.role,
      receiverId,
      receiverName: receiver.companyName ? `${receiver.name} (${receiver.companyName})` : receiver.name,
      resourceId,
      resourceName,
      content,
      read: false,
      createdAt: new Date().toISOString()
    };

    db.addMessage(msg);
    return res.json(msg);
  });

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  app.get('/api/notifications', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.json([]);
    return res.json(db.getNotifications(user.id));
  });

  app.patch('/api/notifications/:id/read', (req, res) => {
    db.markNotificationRead(req.params.id);
    return res.json({ success: true });
  });

  app.patch('/api/notifications/read-all', (req, res) => {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    db.markAllNotificationsRead(user.id);
    return res.json({ success: true });
  });

  // ==========================================
  // CIRCULAR ECONOMY & SUSTAINABILITY
  // ==========================================

  app.get('/api/sustainability', (req, res) => {
    return res.json(db.getSustainabilityMetrics());
  });

  // ==========================================
  // ADMIN DASHBOARD & GOVERNANCE
  // ==========================================

  app.get('/api/admin/users', (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    const users = db.getUsers().map(({ passwordHash: _, ...u }) => u);
    return res.json(users);
  });

  app.patch('/api/admin/users/:id/verification', (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    const { status } = req.body;
    db.updateUserVerification(req.params.id, status);
    return res.json({ success: true, status });
  });

  app.get('/api/admin/analytics', (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    return res.json(db.getAdminStats());
  });

  app.delete('/api/admin/resources/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    db.removeResource(req.params.id);
    return res.json({ success: true, message: 'Resource removed by administrator' });
  });

  // ==========================================
  // GEMINI AI ENDPOINTS
  // ==========================================

  app.post('/api/ai/category-suggest', async (req, res) => {
    try {
      const { input } = req.body;
      if (!input) return res.status(400).json({ error: 'Input title or text is required' });
      const result = await suggestCategory(input);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/generate-description', async (req, res) => {
    try {
      const { name, category, condition, quantity, unit, originalPrice, location } = req.body;
      if (!name) return res.status(400).json({ error: 'Resource name is required' });
      const result = await generateDescription({
        name,
        category: category || 'Raw Materials',
        condition: condition || 'Surplus / Unused',
        quantity: Number(quantity) || 100,
        unit: unit || 'units',
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
        location
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/smart-pricing', async (req, res) => {
    try {
      const { name, category, condition, quantity, originalPrice, location } = req.body;
      if (!originalPrice || Number(originalPrice) <= 0) {
        return res.status(400).json({ error: 'Valid original price is required for smart pricing calculation' });
      }
      const result = await calculateSmartPricing({
        name: name || 'Surplus Inventory Lot',
        category: category || 'Raw Materials',
        condition: condition || 'Surplus / Unused',
        quantity: Number(quantity) || 1,
        originalPrice: Number(originalPrice),
        location
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/duplicate-check', async (req, res) => {
    try {
      const { name, category, existingResources } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });

      let resourcesToCheck = Array.isArray(existingResources) ? existingResources : [];
      if (resourcesToCheck.length === 0) {
        const user = getAuthUser(req);
        if (user) {
          resourcesToCheck = db.getResources({ sellerId: user.id });
        }
      }

      const result = await checkDuplicateListing(name, category || '', resourcesToCheck);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ai/matching', async (req, res) => {
    try {
      const { category, keywords, targetQuantity, maxBudget, location, businessType } = req.body;
      const allResources = db.getResources();
      const result = await matchBuyerRequirements(
        {
          category,
          keywords,
          targetQuantity: targetQuantity ? Number(targetQuantity) : undefined,
          maxBudget: maxBudget ? Number(maxBudget) : undefined,
          location,
          businessType
        },
        allResources
      );
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResourceX Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
