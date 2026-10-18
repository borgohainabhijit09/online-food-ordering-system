import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Default to live production server restobuddy.in
export const DEFAULT_API_URL = 'https://restobuddy.in';
export const PROD_API_URL = 'https://restobuddy.in';
export const LOCAL_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

const SERVER_URL_KEY = 'restobuddy_food_api_url';
const CUSTOMER_PROFILE_KEY = 'restobuddy_food_customer_profile';
const SAVED_ADDRESS_KEY = 'restobuddy_food_saved_address';

export async function getStoredBaseUrl(): Promise<string> {
  try {
    const saved = await Promise.race([
      SecureStore.getItemAsync(SERVER_URL_KEY),
      new Promise<string>((resolve) => setTimeout(() => resolve(DEFAULT_API_URL), 1200)),
    ]);
    return saved || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export async function setStoredBaseUrl(url: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SERVER_URL_KEY, url.trim().replace(/\/$/, ''));
  } catch (error) {
    console.warn('Failed to save base URL:', error);
  }
}

export interface CustomerProfile {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export async function getStoredProfile(): Promise<CustomerProfile | null> {
  try {
    const raw = await SecureStore.getItemAsync(CUSTOMER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredProfile(profile: CustomerProfile): Promise<void> {
  try {
    await SecureStore.setItemAsync(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn('Failed to save profile:', error);
  }
}

const DELIVERY_ADDRESS_KEY = 'resto_delivery_address';
const SAVED_ADDRESSES_KEY = 'resto_saved_addresses';

export async function getStoredDeliveryAddress(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(DELIVERY_ADDRESS_KEY);
  } catch {
    return null;
  }
}

export async function setStoredDeliveryAddress(address: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(DELIVERY_ADDRESS_KEY, address);
  } catch (error) {
    console.warn('Failed to save delivery address:', error);
  }
}

export async function getStoredSavedAddresses(): Promise<any[] | null> {
  try {
    const raw = await SecureStore.getItemAsync(SAVED_ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredSavedAddresses(addresses: any[]): Promise<void> {
  try {
    await SecureStore.setItemAsync(SAVED_ADDRESSES_KEY, JSON.stringify(addresses));
  } catch (error) {
    console.warn('Failed to save addresses:', error);
  }
}

export interface ApiRequestOptions extends RequestInit {
  tenantSlug?: string;
  timeoutMs?: number;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = await getStoredBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (options.tenantSlug) {
    headers['x-tenant-slug'] = options.tenantSlug;
  }

  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data?.message ? data.message : `HTTP ${response.status}: Request failed`;
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    // If host fails due to DNS (UnknownHostException) or connection drop in emulator, attempt local fallback
    if (baseUrl === PROD_API_URL && Boolean(LOCAL_API_URL)) {
      try {
        const localUrl = `${LOCAL_API_URL}${cleanEndpoint}`;
        const localController = new AbortController();
        const localTimeout = setTimeout(() => localController.abort(), 6000);
        const localRes = await fetch(localUrl, {
          ...options,
          headers,
          signal: localController.signal,
        });
        clearTimeout(localTimeout);

        if (localRes.ok) {
          const contentType = localRes.headers.get('content-type');
          const isJson = contentType && contentType.includes('application/json');
          return (isJson ? await localRes.json() : await localRes.text()) as T;
        }
      } catch {
        // Fall through to original error
      }
    }

    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Please check if your server is running.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const RESTAURANTS_CACHE_KEY = 'restobuddy_cached_restaurants';
let _memoryRestaurantsCache: any[] | null = null;

export const KNOWN_RESTAURANTS_META: Record<string, {
  name: string;
  cuisines: string[];
  cuisineText: string;
  deliveryRadiusKm: number;
  rating: number;
  prepTime: string;
  distance: string;
  imageUrl: string;
}> = {
  bamboho: {
    name: 'Bamboho',
    cuisines: ['Burgers', 'Momos', 'Pizza', 'Ramen', 'Sandwiches', 'Biryani', 'Rolls', 'Multi-Cuisine', 'Fast Food', 'Desserts'],
    cuisineText: 'Burgers • Momos • Pizza • Ramen • Rolls',
    deliveryRadiusKm: 10000,
    rating: 4.8,
    prepTime: '20-30 min',
    distance: '1.2 km',
    imageUrl: 'https://b.zmtcdn.com/data/dish_photos/b2f/d3d776ba5cd4fbc20395c94300cb3b2f.jpeg',
  },
  'demo-restaurant': {
    name: 'Demo Restaurant',
    cuisines: ['Momos', 'Rolls', 'Biryani', 'Starters', 'North Indian', 'Fast Food', 'Multi-Cuisine'],
    cuisineText: 'Momos • Rolls • Biryani • Starters',
    deliveryRadiusKm: 10000,
    rating: 4.6,
    prepTime: '20-30 min',
    distance: '1.5 km',
    imageUrl: 'https://b.zmtcdn.com/data/dish_photos/e58/ee159031064545b34b3751b834acde58.jpg',
  },
  singpho: {
    name: 'Singpho Shat Gawk',
    cuisines: ['Thali', 'Rolls', 'Noodles', 'Ethnic', 'Curries', 'Assamese', 'Traditional'],
    cuisineText: 'Ethnic Thali • Traditional Assamese • Rolls',
    deliveryRadiusKm: 10000,
    rating: 4.7,
    prepTime: '25-35 min',
    distance: '2.0 km',
    imageUrl: 'https://b.zmtcdn.com/data/dish_photos/4f1/c2c36116c90e37a09517cefc19e1b4f1.jpg',
  },
  'eat-street': {
    name: 'Eat Street',
    cuisines: ['Burgers', 'Rolls', 'Chowmein', 'Starters', 'Fast Food', 'Multi-Cuisine'],
    cuisineText: 'Burgers • Chowmein • Starters • Rolls',
    deliveryRadiusKm: 10000,
    rating: 4.5,
    prepTime: '15-25 min',
    distance: '2.2 km',
    imageUrl: 'https://b.zmtcdn.com/data/dish_photos/8a0/837d5f4ba75a5056414144e7b79088a0.png',
  },
  madhuban: {
    name: 'Madhuban Pure Veg',
    cuisines: ['Thali', 'Pure Veg', 'Desserts', 'North Indian', 'Sweets'],
    cuisineText: 'Pure Veg • Royal Thali • North Indian • Desserts',
    deliveryRadiusKm: 10000,
    rating: 4.8,
    prepTime: '20-30 min',
    distance: '2.5 km',
    imageUrl: 'https://b.zmtcdn.com/data/dish_photos/f6d/620938393cda6f4363419805f277ff6d.jpg',
  },
  'the-chai-local': {
    name: 'The Chai Local',
    cuisines: ['Chai', 'Snacks', 'Beverages', 'Fast Food', 'Desserts'],
    cuisineText: 'Artisanal Chai • Quick Bites • Snacks • Shakes',
    deliveryRadiusKm: 10000,
    rating: 4.7,
    prepTime: '10-20 min',
    distance: '1.0 km',
    imageUrl: 'https://b.zmtcdn.com/data/dish_photos/538/0738f9c00637ac2feced11e0a662b538.png',
  },
  'fish-n-roll': {
    name: 'Fish N Roll',
    cuisines: ['Rolls', 'Fish', 'Seafood', 'Fast Food', 'Starters'],
    cuisineText: 'Kolkata Rolls • Fresh Fish Fry • Fast Food',
    deliveryRadiusKm: 10000,
    rating: 4.5,
    prepTime: '15-25 min',
    distance: '2.8 km',
    imageUrl: 'https://b.zmtcdn.com/data/dish_photos/7bb/519932302190757ff2b390bbaf0077bb.png',
  },
  'naga-hot-chilli': {
    name: 'Naga Hot Chilli',
    cuisines: ['Naga Cuisine', 'Smoked Meat', 'Thali', 'Spicy', 'Ethnic', 'Fast Food'],
    cuisineText: 'Smoked Pork • Raja Mircha • Naga Thali',
    deliveryRadiusKm: 10000,
    rating: 4.6,
    prepTime: '25-35 min',
    distance: '3.0 km',
    imageUrl: 'https://b.zmtcdn.com/data/dish_photos/b44/d868193656f7564030ca6fc5962eeb44.png',
  },
  'hainari-bodo-ethnic-kitchen': {
    name: 'Hainari Bodo Ethnic Kitchen',
    cuisines: ['Bodo Cuisine', 'Thali', 'Ethnic', 'Traditional', 'Curries'],
    cuisineText: 'Authentic Bodo Thali • Herbal Curries • Ethnic Rice',
    deliveryRadiusKm: 10000,
    rating: 4.6,
    prepTime: '25-35 min',
    distance: '3.5 km',
    imageUrl: 'https://b.zmtcdn.com/data/dish_photos/7b3/ee9adc719e46d6a0ef5ec6d3936667b3.png',
  },
};

const KNOWN_RESTAURANT_SLUGS = Object.keys(KNOWN_RESTAURANTS_META);

// Public Marketplace API helpers with graceful production fallback and offline resiliency
export async function getRestaurants(search?: string): Promise<any[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  let fetchedRestaurants: any[] = [];

  try {
    const data = await apiFetch(`/api/public/restaurants${query}`);
    if (Array.isArray(data) && data.length > 0) {
      fetchedRestaurants = data.map((r: any) => {
        const meta = KNOWN_RESTAURANTS_META[r.slug];
        return {
          ...r,
          imageUrl: r.imageUrl || r.logoUrl || meta?.imageUrl || null,
          logoUrl: r.logoUrl || meta?.imageUrl || null,
          cuisines: r.cuisines?.length ? r.cuisines : (meta?.cuisines || ['Multi-Cuisine', 'Fast Food']),
          cuisineText: r.cuisineText || meta?.cuisineText || 'Indian • Fast Food • Beverages',
          // Guarantee Bamboho has 10,000 km radius
          deliveryRadiusKm: r.slug === 'bamboho' ? Math.max(r.deliveryRadiusKm || 0, 10000) : (r.deliveryRadiusKm || 5),
        };
      });
    }
  } catch (err) {
    // Graceful fallback for production restobuddy.in where /api/public is pending deployment
    const results = await Promise.all(
      KNOWN_RESTAURANT_SLUGS.map(async (slug) => {
        const meta = KNOWN_RESTAURANTS_META[slug];
        try {
          const s = await apiFetch<any>('/api/settings', { tenantSlug: slug });
          if (!s || (!s.restaurantName && !s.tenant?.businessName)) {
            // Even if settings call is empty, use meta if available
            return {
              id: slug,
              name: meta?.name || slug,
              slug,
              phone: '',
              logoUrl: meta?.imageUrl || null,
              imageUrl: meta?.imageUrl || null,
              isAcceptingOrders: true,
              deliveryRadiusKm: meta?.deliveryRadiusKm || 10000,
              deliveryFee: 0,
              minOrder: 0,
              cuisines: meta?.cuisines || ['Multi-Cuisine', 'Fast Food'],
              cuisineText: meta?.cuisineText || 'Indian • Fast Food • Beverages',
              rating: meta?.rating || 4.6,
              reviewCount: 45,
              prepTime: meta?.prepTime || '20-30 min',
              distance: meta?.distance || '1.5 km',
              totalProducts: 50,
            };
          }
          return {
            id: s.tenantId || slug,
            name: s.restaurantName || s.tenant?.businessName || meta?.name || slug,
            slug,
            phone: s.whatsappNumber || '',
            logoUrl: s.logoUrl || meta?.imageUrl || null,
            imageUrl: s.logoUrl || meta?.imageUrl || null,
            isAcceptingOrders: s.isAcceptingOrders ?? true,
            deliveryRadiusKm: slug === 'bamboho' ? 10000 : (s.deliveryRadiusKm || meta?.deliveryRadiusKm || 10000),
            deliveryFee: s.hasDeliveryCharge ? (s.deliveryChargeAmount || 0) : 0,
            minOrder: s.minOrderValueForDelivery || 0,
            cuisines: meta?.cuisines || ['Multi-Cuisine', 'Fast Food'],
            cuisineText: meta?.cuisineText || 'Indian • Fast Food • Beverages',
            rating: meta?.rating || 4.6,
            reviewCount: 45,
            prepTime: meta?.prepTime || '20-30 min',
            distance: meta?.distance || '1.5 km',
            totalProducts: 50,
          };
        } catch {
          // If individual fetch fails, return meta fallback
          return {
            id: slug,
            name: meta?.name || slug,
            slug,
            phone: '',
            logoUrl: meta?.imageUrl || null,
            imageUrl: meta?.imageUrl || null,
            isAcceptingOrders: true,
            deliveryRadiusKm: meta?.deliveryRadiusKm || 10000,
            deliveryFee: 0,
            minOrder: 0,
            cuisines: meta?.cuisines || ['Multi-Cuisine', 'Fast Food'],
            cuisineText: meta?.cuisineText || 'Indian • Fast Food • Beverages',
            rating: meta?.rating || 4.6,
            reviewCount: 45,
            prepTime: meta?.prepTime || '20-30 min',
            distance: meta?.distance || '1.5 km',
            totalProducts: 50,
          };
        }
      })
    );
    fetchedRestaurants = results.filter(Boolean);
  }

  // Update in-memory and persistent cache if we got restaurants
  if (fetchedRestaurants.length > 0) {
    _memoryRestaurantsCache = fetchedRestaurants;
    SecureStore.setItemAsync(RESTAURANTS_CACHE_KEY, JSON.stringify(fetchedRestaurants)).catch(() => {});
  } else if (_memoryRestaurantsCache && _memoryRestaurantsCache.length > 0) {
    // Use memory cache
    fetchedRestaurants = _memoryRestaurantsCache;
  } else {
    // Ultimate fallback: return known restaurants meta list so screen is never blank
    fetchedRestaurants = KNOWN_RESTAURANT_SLUGS.map((slug) => {
      const meta = KNOWN_RESTAURANTS_META[slug];
      return {
        id: slug,
        name: meta.name,
        slug,
        phone: '',
        logoUrl: meta.imageUrl,
        imageUrl: meta.imageUrl,
        isAcceptingOrders: true,
        deliveryRadiusKm: meta.deliveryRadiusKm,
        deliveryFee: 0,
        minOrder: 0,
        cuisines: meta.cuisines,
        cuisineText: meta.cuisineText,
        rating: meta.rating,
        reviewCount: 45,
        prepTime: meta.prepTime,
        distance: meta.distance,
        totalProducts: 50,
      };
    });
  }

  // Apply search filter with location awareness
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    // If the search is a location query (e.g., dibrugarh, assam, near me, etc.),
    // all partner restaurants deliver to that area, so don't filter them out!
    const locationKeywords = ['dibrugarh', 'assam', 'guwahati', 'near me', 'near', 'location', 'my location', 'here', 'city', 'area'];
    const isLocationSearch = locationKeywords.some((loc) => q.includes(loc));

    if (!isLocationSearch) {
      return fetchedRestaurants.filter((r: any) => {
        const nameMatch = r.name.toLowerCase().includes(q);
        const slugMatch = r.slug.toLowerCase().includes(q);
        const cuisineMatch = (r.cuisines || []).some((c: string) => c.toLowerCase().includes(q));
        const textMatch = (r.cuisineText || '').toLowerCase().includes(q);
        return nameMatch || slugMatch || cuisineMatch || textMatch;
      });
    }
  }

  return fetchedRestaurants;
}

const MENU_CACHE_PREFIX = 'restobuddy_menu_cache_';
const _memoryMenuCache: Record<string, any> = {};

export async function getRestaurantDetails(slug: string): Promise<any> {
  // If in-memory menu cache exists, return it immediately
  if (_memoryMenuCache[slug]) {
    return _memoryMenuCache[slug];
  }

  try {
    let result: any = null;
    try {
      result = await apiFetch(`/api/public/restaurants/${slug}`);
    } catch {
      // Assemble from tenant-scoped endpoints (/api/settings, /api/categories, /api/products)
      const [settings, categories, products] = await Promise.all([
        apiFetch<any>('/api/settings', { tenantSlug: slug }).catch(() => null),
        apiFetch<any[]>('/api/categories', { tenantSlug: slug }).catch(() => []),
        apiFetch<any[]>('/api/products', { tenantSlug: slug }).catch(() => []),
      ]);

      if (!settings && categories.length === 0 && products.length === 0) {
        throw new Error('No restaurant data returned');
      }

      const activeProducts = Array.isArray(products)
        ? products
            .filter((p: any) => p.isActive)
            .map((p: any) => {
              const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
              const minVariantPrice = hasVariants
                ? Math.min(...p.variants.map((v: any) => v.offerPrice ?? v.price ?? p.basePrice ?? 0))
                : (p.basePrice ?? 0);
              const isDiscounted =
                typeof p.offerPrice === 'number' &&
                p.offerPrice > 0 &&
                (p.basePrice == null || p.offerPrice < p.basePrice);
              const effectivePrice = isDiscounted
                ? p.offerPrice
                : (p.basePrice > 0 ? p.basePrice : (hasVariants ? minVariantPrice : (p.price || 0)));
              const imageUrl = p.images?.[0]?.url || p.image || null;

              return {
                ...p,
                price: effectivePrice,
                basePrice: p.basePrice ?? effectivePrice,
                offerPrice: isDiscounted ? p.offerPrice : null,
                image: imageUrl,
              };
            })
        : [];
      const validCategories = Array.isArray(categories) ? categories.filter((c: any) => c.isActive !== false) : [];

      const enrichedCategories = validCategories.map((cat: any) => ({
        ...cat,
        products: activeProducts.filter((p: any) => p.categoryId === cat.id),
      }));

      const categorizedProductIds = new Set(
        enrichedCategories.flatMap((c: any) => c.products.map((p: any) => p.id))
      );
      const uncatProducts = activeProducts.filter((p: any) => !categorizedProductIds.has(p.id));
      if (uncatProducts.length > 0) {
        enrichedCategories.push({
          id: 'all-dishes',
          name: 'All Dishes',
          order: 999,
          isActive: true,
          products: uncatProducts,
        });
      }

      result = {
        id: settings?.tenantId || settings?.tenant?.id || slug,
        name: settings?.restaurantName || settings?.tenant?.businessName || slug,
        slug,
        phone: settings?.whatsappNumber || '',
        logoUrl: settings?.logoUrl || null,
        fssaiNumber: settings?.fssaiNumber || null,
        isAcceptingOrders: settings?.isAcceptingOrders ?? true,
        deliveryRadiusKm: slug === 'bamboho' ? 10000 : (settings?.deliveryRadiusKm || 10000),
        deliveryFee: settings?.hasDeliveryCharge ? (settings?.deliveryChargeAmount || 0) : 0,
        minOrder: settings?.minOrderValueForDelivery || 0,
        categories: enrichedCategories,
      };
    }

    if (result) {
      _memoryMenuCache[slug] = result;
      SecureStore.setItemAsync(MENU_CACHE_PREFIX + slug, JSON.stringify(result)).catch(() => {});
      return result;
    }
  } catch (err: any) {
    // Check persistent SecureStore cache
    try {
      const cached = await SecureStore.getItemAsync(MENU_CACHE_PREFIX + slug);
      if (cached) {
        const parsed = JSON.parse(cached);
        _memoryMenuCache[slug] = parsed;
        return parsed;
      }
    } catch {}

    // Direct local attempt on Android emulator if prod host was unreachable
    if (LOCAL_API_URL) {
      try {
        const localRes = await fetch(`${LOCAL_API_URL}/api/public/restaurants/${slug}`);
        if (localRes.ok) {
          const localData = await localRes.json();
          _memoryMenuCache[slug] = localData;
          return localData;
        }
      } catch {}
    }

    throw err;
  }
}

export async function submitOrder(orderData: any, tenantSlug: string): Promise<any> {
  return apiFetch('/api/orders', {
    method: 'POST',
    tenantSlug,
    body: JSON.stringify({
      ...orderData,
      tenantSlug,
    }),
  });
}

export async function trackOrderById(orderId: string, tenantSlug?: string): Promise<any> {
  try {
    return await apiFetch(`/api/public/orders/track/${orderId}`);
  } catch (err) {
    if (tenantSlug) {
      return await apiFetch(`/api/orders/${orderId}`, { tenantSlug });
    }
    throw err;
  }
}

export async function getOrderHistoryByPhone(phone: string): Promise<any[]> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  try {
    return await apiFetch(`/api/public/orders/history?phone=${encodeURIComponent(cleanPhone)}`);
  } catch {
    return [];
  }
}

export interface PublicCustomerProfile {
  phone: string;
  name: string;
  dob?: string | null;
  addresses: {
    id: string;
    label: 'Home' | 'Work' | 'Other';
    address: string;
    latitude?: number | null;
    longitude?: number | null;
  }[];
  loyalty: {
    tenantId: string;
    restaurantName: string;
    restaurantSlug: string;
    restaurantLogo?: string | null;
    points: number;
    pointValueInRupees: number;
    minimumPointsToRedeem: number;
  }[];
  totalOrders: number;
}

export async function fetchCustomerProfile(phone: string): Promise<PublicCustomerProfile | null> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  if (!cleanPhone || cleanPhone.length < 10) return null;
  try {
    return await apiFetch<PublicCustomerProfile>(`/api/public/customer/${cleanPhone}`);
  } catch {
    return null;
  }
}

export async function saveCustomerProfile(data: { phone: string; name?: string; dob?: string }): Promise<boolean> {
  try {
    await apiFetch('/api/public/customer/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return true;
  } catch {
    return false;
  }
}
