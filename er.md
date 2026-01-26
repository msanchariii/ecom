erDiagram
users ||--o{ accounts : has
users ||--o{ sessions : has
users ||--o{ addresses : has
users ||--o{ carts : has
users ||--o{ orders : places
users ||--o{ reviews : writes
users ||--o{ wishlists : has

    guests ||--o{ carts : has

    categories ||--o{ products : contains
    categories ||--o{ categories : "parent-child"

    brands ||--o{ products : has

    genders ||--o{ products : has

    products ||--o{ product_variants : has
    products ||--o{ product_images : has
    products ||--o{ reviews : receives
    products ||--o{ wishlists : "in"
    products ||--o{ product_collections : "belongs to"

    product_variants ||--o{ product_images : has
    product_variants ||--o{ cart_items : contains
    product_variants ||--o{ order_items : contains

    colors ||--o{ product_variants : has
    sizes ||--o{ product_variants : has

    collections ||--o{ product_collections : has

    carts ||--o{ cart_items : contains

    orders ||--o{ order_items : contains
    orders ||--o{ payments : has
    orders }o--|| addresses : "shipping address"
    orders }o--|| addresses : "billing address"

    users {
        uuid id PK
        text name
        text email UK
        boolean email_verified
        text image
        timestamp created_at
        timestamp updated_at
    }

    accounts {
        uuid id PK
        uuid user_id FK
        text account_id
        text provider_id
        text access_token
        text refresh_token
        timestamp access_token_expires_at
        timestamp refresh_token_expires_at
        text scope
        text id_token
        text password
        timestamp created_at
        timestamp updated_at
    }

    sessions {
        uuid id PK
        uuid user_id FK
        text token UK
        text ip_address
        text user_agent
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    addresses {
        uuid id PK
        uuid user_id FK
        enum type
        text line1
        text line2
        text city
        text state
        text country
        text postal_code
        boolean is_default
    }

    guests {
        uuid id PK
        text session_token UK
        timestamp created_at
        timestamp expires_at
    }

    categories {
        uuid id PK
        text name
        text slug UK
        uuid parent_id FK
    }

    brands {
        uuid id PK
        text name
        text slug UK
        text logo_url
    }

    genders {
        uuid id PK
        text name
        text slug UK
    }

    products {
        uuid id PK
        text name
        text description
        uuid category_id FK
        uuid gender_id FK
        uuid brand_id FK
        boolean is_published
        uuid default_variant_id
        timestamp created_at
        timestamp updated_at
    }

    product_variants {
        uuid id PK
        uuid product_id FK
        text sku UK
        numeric price
        numeric sale_price
        uuid color_id FK
        uuid size_id FK
        integer in_stock
        real weight
        jsonb dimensions
        timestamp created_at
    }

    colors {
        uuid id PK
        text name
        text slug UK
        text hex_code
    }

    sizes {
        uuid id PK
        text name
        text slug UK
        integer sort_order
    }

    genders {
        uuid id PK
        text label
        text slug UK
    }

    product_images {
        uuid id PK
        uuid product_id FK
        uuid variant_id FK
        text url
        integer sort_order
        boolean is_primary
    }

    collections {
        uuid id PK
        text name
        text slug UK
        timestamp created_at
    }

    product_collections {
        uuid id PK
        uuid product_id FK
        uuid collection_id FK
    }

    carts {
        uuid id PK
        uuid user_id FK
        uuid guest_id FK
        timestamp created_at
        timestamp updated_at
    }

    cart_items {
        uuid id PK
        uuid cart_id FK
        uuid product_variant_id FK
        integer quantity
    }

    orders {
        uuid id PK
        uuid user_id FK
        enum status
        numeric total_amount
        uuid shipping_address_id FK
        uuid billing_address_id FK
        timestamp created_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_variant_id FK
        integer quantity
        numeric price_at_purchase
    }

    payments {
        uuid id PK
        uuid order_id FK
        enum method
        enum status
        timestamp paid_at
        text transaction_id
    }

    reviews {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        integer rating
        text comment
        timestamp created_at
    }

    wishlists {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        timestamp added_at
    }

    coupons {
        uuid id PK
        text code UK
        enum discount_type
        numeric discount_value
        timestamp expires_at
        integer max_usage
        integer used_count
    }

    verifications {
        uuid id PK
        text identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
