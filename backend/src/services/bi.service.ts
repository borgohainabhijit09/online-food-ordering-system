import prisma from './prisma';

export const calculateHealthScore = (tenant: any): { score: number, category: string } => {
  let score = 0;

  // 1. Orders Last 30 Days (Max 40 points)
  // Let's assume 100 orders in 30 days is excellent (40 pts)
  const recentOrders = tenant.orders?.length || 0;
  score += Math.min(40, (recentOrders / 100) * 40);

  // 2. Revenue Last 30 Days (Max 30 points)
  // Let's assume 50,000 INR in 30 days is excellent (30 pts)
  const recentRevenue = tenant.orders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) || 0;
  score += Math.min(30, (recentRevenue / 50000) * 30);

  // 3. Last Login (Max 20 points)
  // Look at the most recent login of any user in this tenant
  let maxLogin = 0;
  if (tenant.users && tenant.users.length > 0) {
    const logins = tenant.users.map((u: any) => u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0);
    maxLogin = Math.max(...logins);
  }
  
  if (maxLogin > 0) {
    const daysSinceLogin = (Date.now() - maxLogin) / (1000 * 60 * 60 * 24);
    if (daysSinceLogin <= 3) score += 20;
    else if (daysSinceLogin <= 7) score += 10;
    else if (daysSinceLogin <= 14) score += 5;
  }

  // 4. Subscription Status (Max 10 points)
  if (tenant.subscription?.status === 'ACTIVE') score += 10;
  else if (tenant.subscription?.status === 'TRIAL') score += 5;

  score = Math.round(score);

  let category = 'Critical';
  if (score >= 90) category = 'Excellent';
  else if (score >= 70) category = 'Healthy';
  else if (score >= 40) category = 'Needs Attention';

  return { score, category };
};

export const calculateChurnRisk = (tenant: any): { score: number, level: string, reasons: string[], actions: string[] } => {
  let score = 0;
  const reasons: string[] = [];
  const actions: string[] = [];

  // 1. No login for 14+ days (+30 pts)
  let maxLogin = 0;
  if (tenant.users && tenant.users.length > 0) {
    const logins = tenant.users.map((u: any) => u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0);
    maxLogin = Math.max(...logins);
  }
  const daysSinceLogin = maxLogin > 0 ? (Date.now() - maxLogin) / (1000 * 60 * 60 * 24) : 999;
  
  if (daysSinceLogin > 14) {
    score += 30;
    reasons.push(`No login for ${maxLogin === 0 ? 'ever' : Math.round(daysSinceLogin) + ' days'}`);
    actions.push('Send re-engagement email or WhatsApp message');
  }

  // 2. No orders for 7+ days (+30 pts)
  let maxOrderDate = 0;
  if (tenant.orders && tenant.orders.length > 0) {
    const orderDates = tenant.orders.map((o: any) => new Date(o.createdAt).getTime());
    maxOrderDate = Math.max(...orderDates);
  }
  const daysSinceOrder = maxOrderDate > 0 ? (Date.now() - maxOrderDate) / (1000 * 60 * 60 * 24) : 999;

  if (daysSinceOrder > 7 && maxOrderDate > 0) {
    score += 30;
    reasons.push(`No orders for ${Math.round(daysSinceOrder)} days`);
    actions.push('Suggest running a discount coupon campaign');
  }

  // 3. Subscription Expiring soon (+20 pts)
  if (tenant.subscription?.nextBillingDate) {
    const daysUntilExpiry = (new Date(tenant.subscription.nextBillingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      score += 20;
      reasons.push(`Subscription expires in ${Math.round(daysUntilExpiry)} days`);
      actions.push('Call owner for renewal assistance');
    } else if (tenant.subscription.status === 'PAST_DUE' || tenant.subscription.status === 'CANCELLED') {
      score += 40;
      reasons.push(`Subscription is ${tenant.subscription.status}`);
      actions.push('Contact immediately for payment recovery');
    }
  }

  // 4. Low Setup Completion (+20 pts)
  // If no products, highly likely to churn
  if (!tenant.products || tenant.products.length === 0) {
    score += 20;
    reasons.push('No products added to menu');
    actions.push('Offer free menu data-entry assistance');
  }

  score = Math.min(100, score);

  let level = 'LOW';
  if (score >= 80) level = 'CRITICAL';
  else if (score >= 50) level = 'HIGH';
  else if (score >= 30) level = 'MEDIUM';

  return { score, level, reasons, actions };
};

export const getOnboardingStatus = (tenant: any) => {
  const checklist = [
    { key: 'menu', label: 'Menu Uploaded', completed: tenant.categories?.length > 0 },
    { key: 'logo', label: 'Logo Uploaded', completed: !!tenant.settings?.logoUrl },
    { key: 'whatsapp', label: 'WhatsApp Configured', completed: !!tenant.settings?.whatsappNumber },
    { key: 'details', label: 'Business Details Added', completed: !!tenant.settings?.fssaiNumber },
    { key: 'products', label: 'Products Published', completed: tenant.products?.some((p: any) => p.isActive) },
    { key: 'first_order', label: 'First Order Received', completed: tenant.orders?.length > 0 },
    { key: 'subscription', label: 'Subscription Activated', completed: tenant.subscription?.status === 'ACTIVE' }
  ];

  const completedCount = checklist.filter(c => c.completed).length;
  const percentage = Math.round((completedCount / checklist.length) * 100);

  let status = 'NOT_STARTED';
  if (percentage === 100) status = 'COMPLETED';
  else if (percentage > 0) status = 'IN_PROGRESS';

  return {
    percentage,
    completedCount,
    totalCount: checklist.length,
    status,
    checklist
  };
};
