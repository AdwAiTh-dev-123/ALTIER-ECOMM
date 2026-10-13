// Mock Data for Minimalist Clothing E-Commerce
// Adheres to 2-Variant system (Color & Size) with independent SKU, price, and stock counts.

export const initialCategories = [
  { _id: 'cat-1', name: 'T-Shirts & Tops', slug: 't-shirts', description: 'Essential heavyweight and organic cotton t-shirts.' },
  { _id: 'cat-2', name: 'Shirts', slug: 'shirts', description: 'Relaxed fit poplin and washed linen button-downs.' },
  { _id: 'cat-3', name: 'Trousers', slug: 'trousers', description: 'Pleated trousers, relaxed chinos, and everyday essentials.' },
  { _id: 'cat-4', name: 'Outerwear', slug: 'outerwear', description: 'Minimal overshirts, chore coats, and lightweight jackets.' }
];

export const initialProducts = [
  {
    _id: 'prod-1',
    title: 'Heavyweight Boxy Tee',
    slug: 'heavyweight-boxy-tee',
    category: 'cat-1',
    description: 'Crafted from 280 GSM organic combed cotton. Features a relaxed boxy cut, ribbed collar, and pre-shrunk finish for everyday durability.',
    basePrice: 1290,
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80'
    ],
    isActive: true,
    createdAt: '2026-10-01T10:00:00Z',
    variants: [
      { _id: 'v-101', sku: 'HBT-WHT-S', color: 'Off-White', size: 'S', price: 1290, stock: 14 },
      { _id: 'v-102', sku: 'HBT-WHT-M', color: 'Off-White', size: 'M', price: 1290, stock: 22 },
      { _id: 'v-103', sku: 'HBT-WHT-L', color: 'Off-White', size: 'L', price: 1290, stock: 0 }, // Out of stock test
      { _id: 'v-104', sku: 'HBT-CHR-S', color: 'Charcoal', size: 'S', price: 1290, stock: 18 },
      { _id: 'v-105', sku: 'HBT-CHR-M', color: 'Charcoal', size: 'M', price: 1290, stock: 9 },
      { _id: 'v-106', sku: 'HBT-CHR-L', color: 'Charcoal', size: 'L', price: 1290, stock: 5 },
      { _id: 'v-107', sku: 'HBT-OLV-M', color: 'Olive', size: 'M', price: 1290, stock: 11 },
      { _id: 'v-108', sku: 'HBT-OLV-L', color: 'Olive', size: 'L', price: 1290, stock: 8 }
    ]
  },
  {
    _id: 'prod-2',
    title: 'Relaxed Washed Linen Shirt',
    slug: 'relaxed-washed-linen-shirt',
    category: 'cat-2',
    description: '100% French linen garment-dyed for a soft, breathable handfeel. Camp collar with natural mother-of-pearl buttons.',
    basePrice: 2490,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'
    ],
    isActive: true,
    createdAt: '2026-10-02T11:30:00Z',
    variants: [
      { _id: 'v-201', sku: 'RLS-NAT-S', color: 'Natural Sand', size: 'S', price: 2490, stock: 7 },
      { _id: 'v-202', sku: 'RLS-NAT-M', color: 'Natural Sand', size: 'M', price: 2490, stock: 15 },
      { _id: 'v-203', sku: 'RLS-NAT-L', color: 'Natural Sand', size: 'L', price: 2490, stock: 12 },
      { _id: 'v-204', sku: 'RLS-NVY-S', color: 'Deep Navy', size: 'S', price: 2490, stock: 4 },
      { _id: 'v-205', sku: 'RLS-NVY-M', color: 'Deep Navy', size: 'M', price: 2490, stock: 0 },
      { _id: 'v-206', sku: 'RLS-NVY-L', color: 'Deep Navy', size: 'L', price: 2490, stock: 6 }
    ]
  },
  {
    _id: 'prod-3',
    title: 'Pleated Straight Leg Chino',
    slug: 'pleated-straight-leg-chino',
    category: 'cat-3',
    description: 'Mid-weight cotton twill trouser with subtle front single pleats, comfortable higher rise, and clean tapered leg silhouette.',
    basePrice: 2890,
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80'
    ],
    isActive: true,
    createdAt: '2026-10-03T14:15:00Z',
    variants: [
      { _id: 'v-301', sku: 'PSC-BEG-S', color: 'Beige', size: 'S', price: 2890, stock: 10 },
      { _id: 'v-302', sku: 'PSC-BEG-M', color: 'Beige', size: 'M', price: 2890, stock: 18 },
      { _id: 'v-303', sku: 'PSC-BEG-L', color: 'Beige', size: 'L', price: 2890, stock: 14 },
      { _id: 'v-304', sku: 'PSC-BLK-S', color: 'Black', size: 'S', price: 2890, stock: 12 },
      { _id: 'v-305', sku: 'PSC-BLK-M', color: 'Black', size: 'M', price: 2890, stock: 20 },
      { _id: 'v-306', sku: 'PSC-BLK-L', color: 'Black', size: 'L', price: 2890, stock: 9 }
    ]
  },
  {
    _id: 'prod-4',
    title: 'Canvas Workwear Chore Jacket',
    slug: 'canvas-chore-jacket',
    category: 'cat-4',
    description: 'Rugged 12oz cotton duck canvas utility jacket with 3 patch pockets, tonal corozo buttons, and unlined interior for year-round layering.',
    basePrice: 3890,
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80'
    ],
    isActive: true,
    createdAt: '2026-10-04T09:45:00Z',
    variants: [
      { _id: 'v-401', sku: 'CWJ-OLV-S', color: 'Olive Drab', size: 'S', price: 3890, stock: 5 },
      { _id: 'v-402', sku: 'CWJ-OLV-M', color: 'Olive Drab', size: 'M', price: 3890, stock: 8 },
      { _id: 'v-403', sku: 'CWJ-OLV-L', color: 'Olive Drab', size: 'L', price: 3890, stock: 4 },
      { _id: 'v-404', sku: 'CWJ-BRN-S', color: 'Dark Tan', size: 'S', price: 3890, stock: 6 },
      { _id: 'v-405', sku: 'CWJ-BRN-M', color: 'Dark Tan', size: 'M', price: 3890, stock: 11 },
      { _id: 'v-406', sku: 'CWJ-BRN-L', color: 'Dark Tan', size: 'L', price: 3890, stock: 0 }
    ]
  }
];

export const initialOrders = [
  {
    _id: 'ord-101',
    orderNumber: 'ORD-20261008-1092',
    user: { _id: 'u-1', name: 'John Doe', email: 'john@example.com' },
    createdAt: '2026-10-08T14:32:00Z',
    items: [
      {
        product: 'prod-1',
        title: 'Heavyweight Boxy Tee',
        color: 'Off-White',
        size: 'M',
        quantity: 2,
        price: 1290
      },
      {
        product: 'prod-3',
        title: 'Pleated Straight Leg Chino',
        color: 'Beige',
        size: 'M',
        quantity: 1,
        price: 2890
      }
    ],
    shippingAddress: {
      fullName: 'John Doe',
      phone: '+91 9876543210',
      street: '124 Minimalist Avenue, Apt 4B',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India'
    },
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    orderStatus: 'Processing',
    subtotal: 5470,
    shippingFee: 0,
    totalAmount: 5470
  },
  {
    _id: 'ord-102',
    orderNumber: 'ORD-20261005-4421',
    user: { _id: 'u-1', name: 'John Doe', email: 'john@example.com' },
    createdAt: '2026-10-05T09:15:00Z',
    items: [
      {
        product: 'prod-2',
        title: 'Relaxed Washed Linen Shirt',
        color: 'Natural Sand',
        size: 'L',
        quantity: 1,
        price: 2490
      }
    ],
    shippingAddress: {
      fullName: 'John Doe',
      phone: '+91 9876543210',
      street: '124 Minimalist Avenue, Apt 4B',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India'
    },
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    subtotal: 2490,
    shippingFee: 0,
    totalAmount: 2490
  }
];

export const initialUsers = [
  { _id: 'u-1', name: 'John Doe', email: 'john@example.com', role: 'customer', isBlocked: false, createdAt: '2026-09-12T10:00:00Z' },
  { _id: 'u-2', name: 'Jane Smith', email: 'jane@example.com', role: 'customer', isBlocked: false, createdAt: '2026-09-18T12:00:00Z' },
  { _id: 'u-3', name: 'Admin Store', email: 'admin@minimalist.com', role: 'admin', isBlocked: false, createdAt: '2026-08-01T08:00:00Z' }
];

export const initialBanners = [
  {
    _id: 'banner-1',
    title: 'Purposeful Garments & Everyday Essentials',
    subtitle: 'Crafted from 280 GSM organic cotton, French linen, and duck canvas.',
    tag: 'NEW SEASON 2026 CAPSULE',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
    category: 'cat-1',
    buttonText: 'Explore T-Shirts & Tops',
    isActive: true,
    order: 1
  },
  {
    _id: 'banner-2',
    title: 'Relaxed Tailoring & Washed Linen',
    subtitle: 'Breathable silhouettes designed for effortless layering and warm afternoons.',
    tag: 'FRENCH LINEN EDITION',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&auto=format&fit=crop&q=80',
    category: 'cat-2',
    buttonText: 'Shop Linen Shirts',
    isActive: true,
    order: 2
  },
  {
    _id: 'banner-3',
    title: 'Heavyweight Utility & Canvas Workwear',
    subtitle: 'Rugged 12oz duck canvas chore jackets built for timeless durability.',
    tag: 'ARCHIVE CHORE SERIES',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1600&auto=format&fit=crop&q=80',
    category: 'cat-4',
    buttonText: 'View Outerwear',
    isActive: true,
    order: 3
  }
];
