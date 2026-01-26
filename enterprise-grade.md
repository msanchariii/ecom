// db/schema.ts - Production-Ready Clothing E-commerce
import {
pgTable,
text,
varchar,
integer,
numeric,
boolean,
timestamp,
json,
uuid,
pgEnum,
uniqueIndex,
index,
primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== ENUMS ====================

export const userRoleEnum = pgEnum('user_role', ['CUSTOMER', 'ADMIN', 'STAFF']);
export const addressTypeEnum = pgEnum('address_type', ['HOME', 'WORK', 'OTHER']);
export const genderEnum = pgEnum('gender', ['MEN', 'WOMEN', 'UNISEX', 'KIDS']);

export const orderStatusEnum = pgEnum('order_status', [
'PENDING', // Order created, awaiting payment
'PAYMENT_PENDING', // Payment initiated
'PAID', // Payment confirmed
'PROCESSING', // Being prepared
'SHIPPED', // Out for delivery
'DELIVERED', // Successfully delivered
'CANCELLED', // Cancelled by user/admin
'REFUNDED', // Money returned
'RETURNED', // Product returned
'FAILED' // Payment/processing failed
]);

export const paymentStatusEnum = pgEnum('payment_status', [
'PENDING',
'PROCESSING',
'COMPLETED',
'FAILED',
'REFUNDED',
'PARTIALLY_REFUNDED'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
'CARD',
'UPI',
'NET_BANKING',
'COD',
'WALLET'
]);

export const discountTypeEnum = pgEnum('discount_type', ['PERCENTAGE', 'FIXED']);
export const reviewStatusEnum = pgEnum('review_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const inventoryTransactionTypeEnum = pgEnum('inventory_transaction_type', [
'SALE',
'RETURN',
'RESTOCK',
'ADJUSTMENT',
'DAMAGED',
'RESERVED'
]);

// ==================== USER MANAGEMENT ====================

export const users = pgTable('users', {
id: uuid('id').primaryKey().defaultRandom(),
name: varchar('name', { length: 255 }).notNull(),
email: varchar('email', { length: 255 }).notNull().unique(),
emailVerified: boolean('email_verified').default(false).notNull(),
passwordHash: text('password_hash'),
phone: varchar('phone', { length: 20 }),
phoneVerified: boolean('phone_verified').default(false).notNull(),
image: text('image'),
role: userRoleEnum('role').default('CUSTOMER').notNull(),
isActive: boolean('is_active').default(true).notNull(),
createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
emailIdx: uniqueIndex('users_email_idx').on(table.email),
phoneIdx: index('users_phone_idx').on(table.phone),
}));

// For OAuth providers (Google, Facebook, etc.)
export const accounts = pgTable('accounts', {
id: uuid('id').primaryKey().defaultRandom(),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
provider: varchar('provider', { length: 50 }).notNull(), // 'google', 'facebook'
providerAccountId: text('provider_account_id').notNull(),
accessToken: text('access_token'),
refreshToken: text('refresh_token'),
expiresAt: timestamp('expires_at'),
tokenType: varchar('token_type', { length: 50 }),
scope: text('scope'),
idToken: text('id_token'),
createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
providerIdx: uniqueIndex('accounts_provider_idx').on(table.provider, table.providerAccountId),
userIdIdx: index('accounts_user_id_idx').on(table.userId),
}));

export const sessions = pgTable('sessions', {
id: uuid('id').primaryKey().defaultRandom(),
userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
token: text('token').notNull().unique(),
ipAddress: varchar('ip_address', { length: 45 }),
userAgent: text('user_agent'),
expiresAt: timestamp('expires_at').notNull(),
createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
tokenIdx: uniqueIndex('sessions_token_idx').on(table.token),
userIdIdx: index('sessions_user_id_idx').on(table.userId),
}));

export const addresses = pgTable('addresses', {
id: uuid('id').primaryKey().defaultRandom(),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
type: addressTypeEnum('type').default('HOME').notNull(),
fullName: varchar('full_name', { length: 255 }).notNull(),
phone: varchar('phone', { length: 20 }).notNull(),
line1: text('line1').notNull(),
line2: text('line2'),
city: varchar('city', { length: 100 }).notNull(),
state: varchar('state', { length: 100 }).notNull(),
country: varchar('country', { length: 100 }).notNull().default('India'),
postalCode: varchar('postal_code', { length: 10 }).notNull(),
isDefault: boolean('is_default').default(false).notNull(),
createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
userIdIdx: index('addresses_user_id_idx').on(table.userId),
}));

// ==================== GUEST SYSTEM ====================

export const guests = pgTable('guests', {
id: uuid('id').primaryKey().defaultRandom(),
sessionToken: text('session_token').notNull().unique(),
createdAt: timestamp('created_at').defaultNow().notNull(),
expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
sessionTokenIdx: uniqueIndex('guests_session_token_idx').on(table.sessionToken),
}));

// ==================== PRODUCT CATALOG ====================

export const categories = pgTable('categories', {
id: uuid('id').primaryKey().defaultRandom(),
name: varchar('name', { length: 255 }).notNull(),
slug: varchar('slug', { length: 255 }).notNull().unique(),
description: text('description'),
imageUrl: text('image_url'),
parentId: uuid('parent_id').references(() => categories.id),
sortOrder: integer('sort_order').default(0).notNull(),
isActive: boolean('is_active').default(true).notNull(),
createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
parentIdIdx: index('categories_parent_id_idx').on(table.parentId),
}));

export const brands = pgTable('brands', {
id: uuid('id').primaryKey().defaultRandom(),
name: varchar('name', { length: 255 }).notNull(),
slug: varchar('slug', { length: 255 }).notNull().unique(),
logoUrl: text('logo_url'),
description: text('description'),
isActive: boolean('is_active').default(true).notNull(),
createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
slugIdx: uniqueIndex('brands_slug_idx').on(table.slug),
}));

export const colors = pgTable('colors', {
id: uuid('id').primaryKey().defaultRandom(),
name: varchar('name', { length: 50 }).notNull(),
slug: varchar('slug', { length: 50 }).notNull().unique(),
hexCode: varchar('hex_code', { length: 7 }).notNull(), // #FF5733
sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => ({
slugIdx: uniqueIndex('colors_slug_idx').on(table.slug),
}));

export const sizes = pgTable('sizes', {
id: uuid('id').primaryKey().defaultRandom(),
name: varchar('name', { length: 20 }).notNull(), // 'S', 'M', 'L', 'XL', '32', '34'
slug: varchar('slug', { length: 20 }).notNull().unique(),
category: varchar('category', { length: 50 }), // 'clothing', 'shoes', 'kids'
sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => ({
slugIdx: uniqueIndex('sizes_slug_idx').on(table.slug),
}));

export const products = pgTable('products', {
id: uuid('id').primaryKey().defaultRandom(),
name: varchar('name', { length: 255 }).notNull(),
slug: varchar('slug', { length: 255 }).notNull().unique(),
description: text('description').notNull(),

categoryId: uuid('category_id').notNull().references(() => categories.id),
brandId: uuid('brand_id').references(() => brands.id),
gender: genderEnum('gender').notNull(),

// Product attributes
material: varchar('material', { length: 255 }), // 'Cotton', 'Polyester', etc.
careInstructions: text('care_instructions'),
fit: varchar('fit', { length: 50 }), // 'Regular', 'Slim', 'Loose'

// SEO
metaTitle: varchar('meta_title', { length: 255 }),
metaDescription: text('meta_description'),

// Status & visibility
isPublished: boolean('is_published').default(false).notNull(),
isFeatured: boolean('is_featured').default(false).notNull(),

// Denormalized for performance
minPrice: numeric('min_price', { precision: 10, scale: 2 }),
maxPrice: numeric('max_price', { precision: 10, scale: 2 }),
averageRating: numeric('average_rating', { precision: 3, scale: 2 }).default('0'),
reviewCount: integer('review_count').default(0).notNull(),
viewCount: integer('view_count').default(0).notNull(),

createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
categoryIdIdx: index('products_category_id_idx').on(table.categoryId),
brandIdIdx: index('products_brand_id_idx').on(table.brandId),
genderIdx: index('products_gender_idx').on(table.gender),
isFeaturedIdx: index('products_is_featured_idx').on(table.isFeatured),
isPublishedIdx: index('products_is_published_idx').on(table.isPublished),
}));

export const productVariants = pgTable('product_variants', {
id: uuid('id').primaryKey().defaultRandom(),
productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),

sku: varchar('sku', { length: 100 }).notNull().unique(),

colorId: uuid('color_id').notNull().references(() => colors.id),
sizeId: uuid('size_id').notNull().references(() => sizes.id),

price: numeric('price', { precision: 10, scale: 2 }).notNull(),
salePrice: numeric('sale_price', { precision: 10, scale: 2 }),
costPrice: numeric('cost_price', { precision: 10, scale: 2 }), // For profit tracking

// Inventory
inStock: integer('in_stock').default(0).notNull(),
lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
maxQuantityPerOrder: integer('max_quantity_per_order').default(10).notNull(),

// Physical attributes
weight: numeric('weight', { precision: 10, scale: 2 }), // in kg
dimensions: json('dimensions').$type<{ length: number; width: number; height: number }>(),

isActive: boolean('is_active').default(true).notNull(),
isDefault: boolean('is_default').default(false).notNull(),

createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
skuIdx: uniqueIndex('product_variants_sku_idx').on(table.sku),
productIdIdx: index('product_variants_product_id_idx').on(table.productId),
colorIdIdx: index('product_variants_color_id_idx').on(table.colorId),
sizeIdIdx: index('product_variants_size_id_idx').on(table.sizeId),
uniqueVariant: uniqueIndex('unique_variant').on(table.productId, table.colorId, table.sizeId),
}));

export const productImages = pgTable('product_images', {
id: uuid('id').primaryKey().defaultRandom(),
productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
url: text('url').notNull(),
altText: varchar('alt_text', { length: 255 }),
sortOrder: integer('sort_order').default(0).notNull(),
isPrimary: boolean('is_primary').default(false).notNull(),
createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
productIdIdx: index('product_images_product_id_idx').on(table.productId),
variantIdIdx: index('product_images_variant_id_idx').on(table.variantId),
}));

export const collections = pgTable('collections', {
id: uuid('id').primaryKey().defaultRandom(),
name: varchar('name', { length: 255 }).notNull(),
slug: varchar('slug', { length: 255 }).notNull().unique(),
description: text('description'),
imageUrl: text('image_url'),
isActive: boolean('is_active').default(true).notNull(),
sortOrder: integer('sort_order').default(0).notNull(),
createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
slugIdx: uniqueIndex('collections_slug_idx').on(table.slug),
}));

export const productCollections = pgTable('product_collections', {
productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
collectionId: uuid('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => ({
pk: primaryKey({ columns: [table.productId, table.collectionId] }),
productIdIdx: index('product_collections_product_id_idx').on(table.productId),
collectionIdIdx: index('product_collections_collection_id_idx').on(table.collectionId),
}));

// ==================== CART SYSTEM ====================

export const carts = pgTable('carts', {
id: uuid('id').primaryKey().defaultRandom(),
userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
userIdIdx: index('carts_user_id_idx').on(table.userId),
guestIdIdx: index('carts_guest_id_idx').on(table.guestId),
}));

export const cartItems = pgTable('cart_items', {
id: uuid('id').primaryKey().defaultRandom(),
cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
productVariantId: uuid('product_variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
quantity: integer('quantity').default(1).notNull(),
addedAt: timestamp('added_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
cartIdIdx: index('cart_items_cart_id_idx').on(table.cartId),
uniqueCartItem: uniqueIndex('unique_cart_item').on(table.cartId, table.productVariantId),
}));

export const wishlists = pgTable('wishlists', {
id: uuid('id').primaryKey().defaultRandom(),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => ({
userIdIdx: index('wishlists_user_id_idx').on(table.userId),
uniqueWishlist: uniqueIndex('unique_wishlist').on(table.userId, table.productId),
}));

// ==================== ORDER SYSTEM ====================

export const orders = pgTable('orders', {
id: uuid('id').primaryKey().defaultRandom(),
orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),

userId: uuid('user_id').references(() => users.id),

// Status
status: orderStatusEnum('status').default('PENDING').notNull(),
paymentStatus: paymentStatusEnum('payment_status').default('PENDING').notNull(),

// Pricing
subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
tax: numeric('tax', { precision: 10, scale: 2 }).notNull(),
shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).notNull(),
discount: numeric('discount', { precision: 10, scale: 2 }).default('0').notNull(),
totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),

// Addresses (snapshot at time of order)
shippingAddressId: uuid('shipping_address_id').references(() => addresses.id),
billingAddressId: uuid('billing_address_id').references(() => addresses.id),

// Shipping info
trackingNumber: varchar('tracking_number', { length: 100 }),
carrier: varchar('carrier', { length: 100 }), // 'Delhivery', 'Blue Dart', etc.
estimatedDelivery: timestamp('estimated_delivery'),
shippedAt: timestamp('shipped_at'),
deliveredAt: timestamp('delivered_at'),

// Notes
customerNotes: text('customer_notes'),
adminNotes: text('admin_notes'),

// Coupon applied
couponCode: varchar('coupon_code', { length: 50 }),

createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
orderNumberIdx: uniqueIndex('orders_order_number_idx').on(table.orderNumber),
userIdIdx: index('orders_user_id_idx').on(table.userId),
statusIdx: index('orders_status_idx').on(table.status),
createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
}));

export const orderItems = pgTable('order_items', {
id: uuid('id').primaryKey().defaultRandom(),
orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
productVariantId: uuid('product_variant_id').notNull().references(() => productVariants.id),

// Snapshot at time of purchase (CRITICAL for clothing - products change)
productName: varchar('product_name', { length: 255 }).notNull(),
variantSku: varchar('variant_sku', { length: 100 }).notNull(),
colorName: varchar('color_name', { length: 50 }).notNull(),
sizeName: varchar('size_name', { length: 20 }).notNull(),
imageUrl: text('image_url'),

quantity: integer('quantity').notNull(),
priceAtPurchase: numeric('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),

// Full product snapshot for legal/audit purposes
productSnapshot: json('product_snapshot'),
}, (table) => ({
orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
}));

export const orderStatusHistory = pgTable('order_status_history', {
id: uuid('id').primaryKey().defaultRandom(),
orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
fromStatus: orderStatusEnum('from_status'),
toStatus: orderStatusEnum('to_status').notNull(),
notes: text('notes'),
changedBy: uuid('changed_by').references(() => users.id), // Admin who made the change
changedAt: timestamp('changed_at').defaultNow().notNull(),
}, (table) => ({
orderIdIdx: index('order_status_history_order_id_idx').on(table.orderId),
changedAtIdx: index('order_status_history_changed_at_idx').on(table.changedAt),
}));

// ==================== PAYMENT SYSTEM ====================

export const payments = pgTable('payments', {
id: uuid('id').primaryKey().defaultRandom(),
orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),

amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
method: paymentMethodEnum('method').notNull(),
status: paymentStatusEnum('status').default('PENDING').notNull(),

// Payment gateway details
gateway: varchar('gateway', { length: 50 }), // 'razorpay', 'ccavenue', 'stripe'
gatewayOrderId: text('gateway_order_id'),
gatewayPaymentId: text('gateway_payment_id'),
gatewaySignature: text('gateway_signature'),

// Failure handling
failureReason: text('failure_reason'),
failureCode: varchar('failure_code', { length: 50 }),

// Response from gateway (for debugging)
gatewayResponse: json('gateway_response'),

paidAt: timestamp('paid_at'),
createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
orderIdIdx: index('payments_order_id_idx').on(table.orderId),
gatewayPaymentIdIdx: index('payments_gateway_payment_id_idx').on(table.gatewayPaymentId),
}));

export const refunds = pgTable('refunds', {
id: uuid('id').primaryKey().defaultRandom(),
paymentId: uuid('payment_id').notNull().references(() => payments.id),
orderId: uuid('order_id').notNull().references(() => orders.id),

amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
reason: text('reason').notNull(),
status: paymentStatusEnum('status').default('PENDING').notNull(),

gatewayRefundId: text('gateway_refund_id'),
processedBy: uuid('processed_by').references(() => users.id),
processedAt: timestamp('processed_at'),

createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
paymentIdIdx: index('refunds_payment_id_idx').on(table.paymentId),
orderIdIdx: index('refunds_order_id_idx').on(table.orderId),
}));

// ==================== INVENTORY MANAGEMENT ====================

export const inventoryTransactions = pgTable('inventory_transactions', {
id: uuid('id').primaryKey().defaultRandom(),
productVariantId: uuid('product_variant_id').notNull().references(() => productVariants.id),

type: inventoryTransactionTypeEnum('type').notNull(),
quantityChange: integer('quantity_change').notNull(), // +10 or -5
quantityAfter: integer('quantity_after').notNull(),

// Reference to what caused this transaction
referenceType: varchar('reference_type', { length: 50 }), // 'ORDER', 'RETURN', 'MANUAL'
referenceId: uuid('reference_id'), // order_id or adjustment_id

notes: text('notes'),
createdBy: uuid('created_by').references(() => users.id),
createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
variantIdIdx: index('inventory_transactions_variant_id_idx').on(table.productVariantId),
typeIdx: index('inventory_transactions_type_idx').on(table.type),
createdAtIdx: index('inventory_transactions_created_at_idx').on(table.createdAt),
}));

// ==================== REVIEWS ====================

export const reviews = pgTable('reviews', {
id: uuid('id').primaryKey().defaultRandom(),
productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
orderId: uuid('order_id').references(() => orders.id), // Link to purchase

rating: integer('rating').notNull(), // 1-5
title: varchar('title', { length: 255 }),
comment: text('comment').notNull(),

isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
status: reviewStatusEnum('status').default('PENDING').notNull(),

helpfulCount: integer('helpful_count').default(0).notNull(),

createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
productIdIdx: index('reviews_product_id_idx').on(table.productId),
userIdIdx: index('reviews_user_id_idx').on(table.userId),
ratingIdx: index('reviews_rating_idx').on(table.rating),
statusIdx: index('reviews_status_idx').on(table.status),
uniqueReview: uniqueIndex('unique_review').on(table.userId, table.productId, table.orderId),
}));

// ==================== COUPONS ====================

export const coupons = pgTable('coupons', {
id: uuid('id').primaryKey().defaultRandom(),
code: varchar('code', { length: 50 }).notNull().unique(),
description: text('description'),

discountType: discountTypeEnum('discount_type').notNull(),
discountValue: numeric('discount_value', { precision: 10, scale: 2 }).notNull(),

minOrderValue: numeric('min_order_value', { precision: 10, scale: 2 }),
maxDiscount: numeric('max_discount', { precision: 10, scale: 2 }),

maxTotalUsage: integer('max_total_usage'),
maxUsagePerUser: integer('max_usage_per_user').default(1).notNull(),
currentUsageCount: integer('current_usage_count').default(0).notNull(),

validFrom: timestamp('valid_from').notNull(),
validUntil: timestamp('valid_until').notNull(),
isActive: boolean('is_active').default(true).notNull(),

// Advanced: Applicable to specific categories/products
applicableCategories: json('applicable_categories').$type<string[]>(),
  applicableProducts: json('applicable_products').$type<string[]>(),

createdAt: timestamp('created_at').defaultNow().notNull(),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
codeIdx: uniqueIndex('coupons_code_idx').on(table.code),
validityIdx: index('coupons_validity_idx').on(table.validFrom, table.validUntil),
}));

export const couponUsage = pgTable('coupon_usage', {
id: uuid('id').primaryKey().defaultRandom(),
couponId: uuid('coupon_id').notNull().references(() => coupons.id),
userId: uuid('user_id').notNull().references(() => users.id),
orderId: uuid('order_id').notNull().references(() => orders.id),

discountApplied: numeric('discount_applied', { precision: 10, scale: 2 }).notNull(),
usedAt: timestamp('used_at').defaultNow().notNull(),
}, (table) => ({
couponIdIdx: index('coupon_usage_coupon_id_idx').on(table.couponId),
userIdIdx: index('coupon_usage_user_id_idx').on(table.userId),
}));

// ==================== ANALYTICS ====================

export const pageViews = pgTable('page_views', {
id: uuid('id').primaryKey().defaultRandom(),
productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
sessionId: text('session_id').notNull(),
ipAddress: varchar('ip_address', { length: 45 }),
userAgent: text('user_agent'),
referrer: text('referrer'),
viewedAt: timestamp('viewed_at').defaultNow().notNull(),
}, (table) => ({
productIdIdx: index('page_views_product_id_idx').on(table.productId),
viewedAtIdx: index('page_views_viewed_at_idx').on(table.viewedAt),
}));

export const abandonedCarts = pgTable('abandoned_carts', {
id: uuid('id').primaryKey().defaultRandom(),
cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
userId: uuid('user_id').references(() => users.id),
email: varchar('email', { length: 255 }),
totalValue: numeric('total_value', { precision: 10, scale: 2 }).notNull(),
itemCount: integer('item_count').notNull(),

recoveryEmailSent: boolean('recovery_email_sent').default(false).notNull(),
recoveryEmailSentAt: timestamp('recovery_email_sent_at'),

lastUpdatedAt: timestamp('last_updated_at').notNull(),
createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
userIdIdx: index('abandoned_carts_user_id_idx').on(table.userId),
emailIdx: index('abandoned_carts_email_idx').on(table.email),
}));

// ==================== SETTINGS ====================

export const settings = pgTable('settings', {
id: uuid('id').primaryKey().defaultRandom(),
key: varchar('key', { length: 100 }).notNull().unique(),
value: json('value').notNull(),
description: text('description'),
updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
keyIdx: uniqueIndex('settings_key_idx').on(table.key),
}));

// ==================== NOTIFICATIONS ====================

export const notifications = pgTable('notifications', {
id: uuid('id').primaryKey().defaultRandom(),
userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

type: varchar('type', { length: 50 }).notNull(), // 'ORDER_SHIPPED', 'PRICE_DROP', etc.
title: varchar('title', { length: 255 }).notNull(),
message: text('message').notNull(),

actionUrl: text('action_url'),

isRead: boolean('is_read').default(false).notNull(),
readAt: timestamp('read_at'),

createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
userIdIdx: index('notifications_user_id_idx').on(table.userId),
isReadIdx: index('notifications_is_read_idx').on(table.isRead),
}));

// ==================== EMAIL VERIFICATION ====================

export const verificationTokens = pgTable('verification_tokens', {
id: uuid('id').primaryKey().defaultRandom(),
identifier: varchar('identifier', { length: 255 }).notNull(), // email or phone
token: text('token').notNull().unique(),
type: varchar('type', { length: 50 }).notNull(), // 'EMAIL', 'PASSWORD_RESET', 'PHONE'
expiresAt: timestamp('expires_at').notNull(),
createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
tokenIdx: uniqueIndex('verification_tokens_token_idx').on(table.token),
identifierIdx: index('verification_tokens_identifier_idx').on(table.identifier),
}));

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ many }) => ({
accounts: many(accounts),
sessions: many(sessions),
addresses: many(addresses),
carts: many(carts),
orders: many(orders),
reviews: many(reviews),
wishlists: many(wishlists),
notifications: many(notifications),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
user: one(users, {
fields: [accounts.userId],
references: [users.id],
}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
user: one(users, {
fields: [sessions.userId],
references: [users.id],
}),
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
user: one(users, {
fields: [addresses.userId],
references: [users.id],
}),
shippingOrders: many(orders, { relationName: 'shipping_address' }),
billingOrders: many(orders, { relationName: 'billing_address' }),
}));

export const guestsRelations = relations(guests, ({ many }) => ({
carts: many(carts),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
parent: one(categories, {
fields: [categories.parentId],
references: [categories.id],
relationName: 'category_hierarchy',
}),
children: many(categories, { relationName: 'category_hierarchy' }),
products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
category: one(categories, {
fields: [products.categoryId],
references: [categories.id],
}),
brand: one(brands, {
fields: [products.brandId],
references: [brands.id],
}),
variants: many(productVariants),
images: many(productImages),
reviews: many(reviews),
wishlists: many(wishlists),
productCollections: many(productCollections),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
product: one(products, {
fields: [productVariants.productId],
references: [products.id],
}),
color: one(colors, {
fields: [productVariants.colorId],
references: [colors.id],
}),
size: one(sizes, {
fields: [productVariants.sizeId],
references: [sizes.id],
}),
images: many(productImages),
cartItems: many(cartItems),
orderItems: many(orderItems),
inventoryTransactions: many(inventoryTransactions),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
product: one(products, {
fields: [productImages.productId],
references: [products.id],
}),
variant: one(productVariants, {
fields: [productImages.variantId],
references: [productVariants.id],
}),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
productCollections: many(productCollections),
}));

export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
product: one(products, {
fields: [productCollections.productId],
references: [products.id],
}),
collection: one(collections, {
fields: [productCollections.collectionId],
references: [collections.id],
}),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
user: one(users, {
fields: [carts.userId],
references: [users.id],
}),
guest: one(guests, {
fields: [carts.guestId],
references: [guests.id],
}),
items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
cart: one(carts, {
fields: [cartItems.cartId],
references: [carts.id],
}),
variant: one(productVariants, {
fields: [cartItems.productVariantId],
references: [productVariants.id],
}),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
user: one(users, {
fields: [wishlists.userId],
references: [users.id],
}),
product: one(products, {
fields: [wishlists.productId],
references: [products.id],
}),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
user: one(users, {
fields: [orders.userId],
references: [users.id],
}),
shippingAddress: one(addresses, {
fields: [orders.shippingAddressId],
references: [addresses.id],
relationName: 'shipping_address',
}),
billingAddress: one(addresses, {
fields: [orders.billingAddressId],
references: [addresses.id],
relationName: 'billing_address',
}),
items: many(orderItems),
payments: many(payments),
refunds: many(refunds),
statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
order: one(orders, {
fields: [orderItems.orderId],
references: [orders.id],
}),
variant: one(productVariants, {
fields: [orderItems.productVariantId],
references: [productVariants.id],
}),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
order: one(orders, {
fields: [orderStatusHistory.orderId],
references: [orders.id],
}),
changedByUser: one(users, {
fields: [orderStatusHistory.changedBy],
references: [users.id],
}),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
order: one(orders, {
fields: [payments.orderId],
references: [orders.id],
}),
refunds: many(refunds),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
payment: one(payments, {
fields: [refunds.paymentId],
references: [payments.id],
}),
order: one(orders, {
fields: [refunds.orderId],
references: [orders.id],
}),
processedByUser: one(users, {
fields: [refunds.processedBy],
references: [users.id],
}),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
variant: one(productVariants, {
fields: [inventoryTransactions.productVariantId],
references: [productVariants.id],
}),
createdByUser: one(users, {
fields: [inventoryTransactions.createdBy],
references: [users.id],
}),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
product: one(products, {
fields: [reviews.productId],
references: [products.id],
}),
user: one(users, {
fields: [reviews.userId],
references: [users.id],
}),
order: one(orders, {
fields: [reviews.orderId],
references: [orders.id],
}),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
usage: many(couponUsage),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
coupon: one(coupons, {
fields: [couponUsage.couponId],
references: [coupons.id],
}),
user: one(users, {
fields: [couponUsage.userId],
references: [users.id],
}),
order: one(orders, {
fields: [couponUsage.orderId],
references: [orders.id],
}),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
user: one(users, {
fields: [notifications.userId],
references: [users.id],
}),
}))
