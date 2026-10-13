---
title: "PART 10 — CATALOG SERVICE"
---

# PART 10 — CATALOG SERVICE

> **Document Role:** Defines the complete architecture, domain model, persistence model, contracts, caching strategy, event model, testing strategy, and operational standards for the Catalog Service.  
> **Previous Part:** PART 09 — Customer Service  
> **Next Part:** PART 11 — Inventory Service  
> **Status:** Service Architecture / Implementation Specification  
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Redis, REST, Kafka  
> **Audience:** Backend engineers, software architects, QA engineers, product/menu engineers, DevOps engineers, SREs, technical leads.

---

# 1157 — Purpose

The Catalog Service owns the authoritative description of what can be sold.

It answers:

```text
What products exist?
Which categories do they belong to?
Which products appear in which store menus?
Which modifiers and sub-modifiers are available?
What prices apply?
What metadata is needed for customer-facing menus?
What catalog configuration is active?
```

The Catalog Service does **not** own:

```text
Stock quantity
Inventory reservation
Order lifecycle
Payment state
Wallet balance
Loyalty points
Customer profile
```

Catalog defines the sellable structure.

Inventory determines whether stock can satisfy demand.

Ordering creates transaction snapshots.

---

# 1158 — Catalog Service Responsibilities

Catalog Service owns:

```text
Products
Menu items
Categories
Category ordering
Modifiers
Modifier groups
Sub-modifiers
Product descriptions
Images / media references
Store menu configuration
Store-specific product visibility
Store-specific price configuration
Product availability metadata
Menu versioning
Catalog publication state
```

Possible future responsibilities:

```text
Bundles
Combo products
Time-based menus
Daypart menus
Channel-specific menus
Regional menus
Localized names/descriptions
Tax-category metadata
Nutritional metadata
Allergen metadata
Search metadata
```

---

# 1159 — Non-Responsibilities

Catalog Service should not own:

```text
Physical stock count
Stock reservation
Order item fulfillment
Payment price authorization
Wallet transactions
Customer-specific loyalty reward state
```

The service may expose information needed by those domains but remains the authoritative owner only for catalog data.

---

# 1160 — Catalog Boundary

High-level architecture:

```text
                     Admin Portal
                         │
                         ▼
                  Catalog Service
              ┌──────────┼───────────┐
              │          │           │
              ▼          ▼           ▼
           Product    Menu Model    Pricing
              │          │           │
              └──────────┼───────────┘
                         ▼
                    catalog_db
                         │
                         ▼
                      Redis
```

Consumers:

```text
Mobile App
Web App
Order Service
Inventory Service
Search / Reporting
```

---

# 1161 — Ubiquitous Language

| Term | Meaning |
|---|---|
| Product | Core sellable business item |
| Menu Item | Product presentation in a specific menu context |
| Category | Grouping of menu items |
| Modifier Group | Configurable selection group attached to an item |
| Modifier | Choice inside a modifier group |
| Sub-Modifier | Additional configurable choice under a modifier |
| Store Menu | Menu configuration for a specific store |
| Channel | Sales channel such as APP, POS, DELIVERY |
| Price | Monetary selling price |
| Availability Metadata | Catalog-level rule or flag describing sellability |
| Publication | Whether catalog content is visible to consumers |
| Menu Version | Version of published menu state |

---

# 1162 — Product vs Menu Item

Do not treat them as automatically identical.

Example:

```text
Product:
Americano

Menu Item:
Americano shown in Mobile App menu for Store A
```

A product may have:

```text
different menu placements
different store availability
different channel exposure
different price
different modifier configuration
```

---

# 1163 — Product Aggregate

Possible aggregate root:

```text
Product
```

Possible state:

```text
product_id
product_code
status
default_name
default_description
product_type
tax_category
image_reference
created_at
updated_at
version
```

---

# 1164 — Product Status

Recommended statuses:

```text
DRAFT
ACTIVE
INACTIVE
ARCHIVED
```

Meaning:

```text
DRAFT    → not publicly available
ACTIVE   → eligible for menu publication
INACTIVE → temporarily disabled
ARCHIVED → historical/inactive permanently
```

---

# 1165 — Product State Transitions

Example:

```text
DRAFT
  ├──> ACTIVE
  └──> ARCHIVED

ACTIVE
  ├──> INACTIVE
  └──> ARCHIVED

INACTIVE
  ├──> ACTIVE
  └──> ARCHIVED
```

Archived products should not normally return to active without explicit policy.

---

# 1166 — Product Invariants

Examples:

```text
product_id is immutable
product_code is unique
active product must have a display name
active menu item must reference an active product
price must not be negative
modifier constraints must be internally valid
published menu cannot reference missing category
```

---

# 1167 — Product Types

Possible types:

```text
DRINK
FOOD
MERCHANDISE
BUNDLE
TOPUP
SERVICE
```

Only introduce types needed by real business requirements.

Do not encode too much logic in one broad enum if separate domain behavior becomes large.

---

# 1168 — Product Code

Product code should be:

```text
stable
unique
owned by Catalog
```

Possible field:

```text
product_code
```

Do not use display name as identifier.

---

# 1169 — Localized Product Text

Possible table:

```text
product_translations
```

Fields:

```text
product_id
language
name
description
```

Unique:

```text
(product_id, language)
```

---

# 1170 — Language Fallback

Example:

```text
Requested language available?
   ↓ yes → return translated value
   ↓ no
Fallback language available?
   ↓ yes → return fallback
   ↓ no
Return default product text
```

Fallback policy should be consistent.

---

# 1171 — Category Model

Possible aggregate/entity:

```text
Category
```

Fields:

```text
category_id
code
name
description
display_order
status
parent_category_id optional
```

---

# 1172 — Category Hierarchy

Optional hierarchy:

```text
Drinks
  ├── Coffee
  ├── Tea
  └── Frappe
```

Avoid deep nesting unless product experience requires it.

---

# 1173 — Category Invariants

Examples:

```text
category code unique
display order non-negative
active child cannot reference archived parent
circular parent relationships forbidden
```

---

# 1174 — Menu Model

A menu may represent:

```text
Store menu
Channel menu
Campaign menu
Time-based menu
```

Core concept:

```text
Menu
```

Possible fields:

```text
menu_id
store_id
channel
status
valid_from
valid_to
version
```

---

# 1175 — Menu Status

Possible:

```text
DRAFT
PUBLISHED
UNPUBLISHED
EXPIRED
```

Only published menu is customer-facing.

---

# 1176 — Store Menu

Store-specific menu allows:

```text
Store A sells Americano
Store B does not
Store A price differs
Store B modifiers differ
```

Model store configuration explicitly.

---

# 1177 — Channel-Specific Menu

Possible channels:

```text
APP
POS
DELIVERY
DINE_IN
PICKUP
PARTNER
```

One product may be available on one channel and unavailable on another.

---

# 1178 — Menu Item Model

Possible fields:

```text
menu_item_id
menu_id
product_id
category_id
display_order
status
visible
sellable
price_id
```

---

# 1179 — Visibility vs Sellability

Distinguish:

```text
visible = shown to user
sellable = may be ordered
```

Example:

```text
visible = true
sellable = false
```

may represent temporarily unavailable item shown in menu.

---

# 1180 — Catalog Availability Metadata

Catalog-level availability may indicate:

```text
ACTIVE
UNAVAILABLE
HIDDEN
COMING_SOON
```

Inventory may separately determine real-time stock availability.

Do not confuse:

```text
catalog unavailable
```

with:

```text
inventory out of stock
```

---

# 1181 — Availability Composition

Final customer availability may be:

```text
Catalog says sellable
      AND
Store/menu says enabled
      AND
Inventory says available
      AND
Time rule says active
      AND
Channel says allowed
```

Catalog owns only its part.

---

# 1182 — Price Model

Price is a domain concept owned by Catalog unless Pricing becomes its own bounded context.

Possible fields:

```text
price_id
product_id
store_id optional
channel optional
amount
currency
valid_from
valid_to
status
```

---

# 1183 — Price Invariants

Examples:

```text
amount >= 0
currency required
valid_from <= valid_to
only one active price for same scope/time where required
```

---

# 1184 — Store-Specific Price

Example precedence:

```text
Store + Channel price
        ↓
Store price
        ↓
Channel price
        ↓
Default product price
```

If using precedence, define exact order.

Avoid ambiguous simultaneous matches.

---

# 1185 — Price Versioning

Historical transactions require price snapshot.

Catalog may change:

```text
Americano = 2.50
```

later:

```text
Americano = 2.75
```

Old orders must preserve:

```text
2.50
```

Order Service stores snapshot.

---

# 1186 — Promotion vs Base Price

Catalog owns base price.

Promotion Service may own:

```text
discount
coupon
campaign benefit
```

Order pricing flow:

```text
Catalog base price
      ↓
Promotion rules
      ↓
Order price snapshot
```

---

# 1187 — Modifier Group

Example:

```text
Size
Sugar Level
Milk Choice
Extra Shot
```

Possible fields:

```text
modifier_group_id
code
name
selection_type
min_select
max_select
required
display_order
status
```

---

# 1188 — Modifier Selection Types

Possible:

```text
SINGLE
MULTIPLE
```

Rules:

```text
SINGLE → max_select = 1
MULTIPLE → max_select >= 1
```

---

# 1189 — Modifier Group Invariants

Examples:

```text
min_select >= 0
max_select >= min_select
required implies min_select >= 1
single-select max_select = 1
```

---

# 1190 — Modifier

Fields:

```text
modifier_id
modifier_group_id
code
name
price_delta
status
display_order
```

A modifier may change item price.

---

# 1191 — Modifier Price Delta

Example:

```text
Large size +0.50 USD
Extra shot +0.75 USD
```

Use exact monetary type.

---

# 1192 — Sub-Modifier

Some modifiers may have nested options.

Example:

```text
Milk
  ↓
Oat Milk
  ↓
Temperature option
```

Keep nesting shallow.

If sub-modifier complexity becomes large, revisit domain structure.

---

# 1193 — Modifier Attachment

Product/menu item can reference modifier groups.

Possible table:

```text
menu_item_modifier_groups
```

Fields:

```text
menu_item_id
modifier_group_id
required_override
display_order
```

---

# 1194 — Modifier Validation

At order time, Order Service should validate against Catalog contract/snapshot.

Rules may include:

```text
required group satisfied
max selection not exceeded
modifier active
modifier belongs to item
sub-modifier belongs to selected parent
```

---

# 1195 — Catalog Snapshot for Order

Catalog may expose:

```text
OrderableItemSnapshot
```

Example:

```json
{
  "product_id": "PROD001",
  "name": "Americano",
  "base_price": {
    "amount": "2.50",
    "currency": "USD"
  },
  "modifier_groups": []
}
```

Order stores the required immutable snapshot.

---

# 1196 — Catalog Validation Contract

Order Service may call:

```text
ValidateOrderItems
```

or:

```text
GetOrderableItem
```

to validate current catalog state.

Avoid sending raw table structure.

---

# 1197 — Catalog REST Endpoints

Public examples:

```text
GET /api/v1/catalog/categories
GET /api/v1/catalog/items
GET /api/v1/catalog/items/{itemId}
GET /api/v1/catalog/stores/{storeId}/menu
```

Admin examples:

```text
POST   /api/v1/admin/catalog/products
PATCH  /api/v1/admin/catalog/products/{id}
POST   /api/v1/admin/catalog/categories
POST   /api/v1/admin/catalog/modifier-groups
POST   /api/v1/admin/catalog/menus
POST   /api/v1/admin/catalog/menus/{id}/publish
```

---

# 1198 — Catalog Query Parameters

Possible:

```text
store_id
channel
category_id
language
status
available_only
```

Whitelist valid combinations.

---

# 1199 — Catalog Response

Example:

```json
{
  "data": {
    "menu_id": "MENU001",
    "store_id": "STORE001",
    "version": 42,
    "categories": [
      {
        "category_id": "CAT001",
        "name": "Coffee",
        "items": []
      }
    ]
  }
}
```

---

# 1200 — Menu Version

Published menu should carry:

```text
version
```

Example:

```text
42
```

Useful for:

```text
cache invalidation
client refresh
debugging
order validation
```

---

# 1201 — Menu Publication

Recommended lifecycle:

```text
Edit Draft
   ↓
Validate
   ↓
Publish
   ↓
Increment Version
   ↓
Invalidate Cache
   ↓
Publish CatalogChanged Event
```

---

# 1202 — Draft vs Published State

Admin changes should not necessarily affect live menu immediately.

Use:

```text
draft
published
```

separation if business needs controlled release.

---

# 1203 — Publish Validation

Before publishing validate:

```text
active product references
category references
price exists
currency valid
modifier rules valid
no impossible selection rules
valid time windows
no duplicate ordering conflicts
```

---

# 1204 — Atomic Publish

A publish operation should avoid partially visible menu changes.

Possible strategies:

```text
versioned rows
publish flag switch
snapshot table
transactional copy
```

The customer-facing version should be internally consistent.

---

# 1205 — Catalog Versioning Strategy

Options:

```text
Global menu version
Per-store menu version
Per-channel version
Per-resource updated_at/version
```

Recommended:

```text
per store + channel menu version
```

if store menus vary significantly.

---

# 1206 — Client Cache Contract

Response may include:

```text
ETag
menu_version
Cache-Control
```

Example:

```http
ETag: "store-001-app-v42"
```

---

# 1207 — Conditional GET

Client:

```http
If-None-Match: "store-001-app-v42"
```

Server:

```text
304 Not Modified
```

This reduces menu payload traffic.

---

# 1208 — Redis Cache

Redis may cache:

```text
published menu
product summary
category list
modifier configuration
```

Authoritative catalog remains PostgreSQL.

---

# 1209 — Cache Key Strategy

Example:

```text
catalog:menu:{store_id}:{channel}:{language}:v{version}
catalog:item:{item_id}:{language}
catalog:category:{category_id}:{language}
```

---

# 1210 — Cache TTL

TTL is a safety mechanism.

Primary freshness mechanism should be:

```text
versioned cache key
or
explicit invalidation
```

not only waiting for TTL.

---

# 1211 — Cache Invalidation

On publish:

```text
DB commit
   ↓
version increment
   ↓
invalidate old cache
   ↓
publish CatalogChanged
```

---

# 1212 — Cache Stampede

Popular menus may cause cache stampede.

Mitigation:

```text
request coalescing
short lock
stale-while-revalidate
randomized TTL
prewarming
```

Use only where needed.

---

# 1213 — Cache Failure

If Redis fails:

```text
serve from PostgreSQL
```

if capacity allows.

Catalog should degrade rather than become unavailable solely because cache is down.

---

# 1214 — Catalog Search

Search needs may include:

```text
product name
category
keyword
tag
```

For modest scale, PostgreSQL can handle.

For larger/full-text needs:

```text
OpenSearch/Elasticsearch
```

may be introduced as a projection.

---

# 1215 — Search Index Ownership

Search index is not authoritative.

Flow:

```text
Catalog
  ↓ event
Search Projection
  ↓
Search Engine
```

---

# 1216 — Product Media

Images should live in object storage/CDN.

Catalog stores:

```text
image_key
image_url metadata
alt text
sort order
```

Do not store large image blobs in PostgreSQL by default.

---

# 1217 — Product Image Model

Possible fields:

```text
product_image_id
product_id
object_key
media_type
display_order
status
checksum
created_at
```

---

# 1218 — Image Publication

Only approved/active media should be published.

Avoid broken references.

Publish validation can verify:

```text
object exists
supported type
valid dimensions if required
```

---

# 1219 — Product Tags

Optional:

```text
NEW
POPULAR
VEGAN
SPICY
SEASONAL
```

Tags should be business metadata.

Do not overload tags to replace proper domain fields.

---

# 1220 — Allergen Metadata

If business requires:

```text
MILK
NUTS
GLUTEN
EGG
```

Catalog may own allergen metadata.

Display disclaimers and compliance rules require business/legal review.

---

# 1221 — Nutritional Metadata

Optional:

```text
calories
protein
fat
carbohydrate
```

Keep separate from core ordering logic unless required.

---

# 1222 — Time-Based Availability

Example:

```text
Breakfast menu:
06:00–11:00
```

Store:

```text
timezone
days of week
start time
end time
```

Do not assume UTC clock time for local business schedules.

---

# 1223 — Daypart Rule

Possible:

```text
BREAKFAST
LUNCH
DINNER
ALL_DAY
```

Menu publication may filter items based on current store-local time.

---

# 1224 — Seasonal Availability

Possible fields:

```text
valid_from
valid_to
```

Example:

```text
Pchum Ben seasonal item
```

Use explicit timezone/date semantics.

---

# 1225 — Store Mapping

Catalog needs canonical store identifiers.

Possible dependency:

```text
Store/Location Service
```

If no separate service exists yet, Catalog may own store-menu mapping but not all store master data.

---

# 1226 — Store Reference

Catalog stores:

```text
store_id
```

as logical reference.

Do not copy full store profile unless needed for read model.

---

# 1227 — Channel Mapping

Channel identifiers should be explicit.

Example:

```text
APP
POS
DELIVERY
SELF_DINE_IN
PARTNER_GRAB
```

Use stable codes.

---

# 1228 — Catalog Database Overview

Possible tables:

```text
products
product_translations
categories
category_translations
menus
menu_categories
menu_items
prices
modifier_groups
modifier_group_translations
modifiers
modifier_translations
sub_modifiers
menu_item_modifier_groups
product_images
catalog_versions
outbox_events
```

Optional:

```text
product_tags
product_allergens
product_nutrition
time_rules
channel_rules
```

---

# 1229 — Products Table

Example:

```text
products
--------
id
product_code
product_type
status
default_name
default_description
tax_category
created_at
updated_at
version
```

Unique:

```text
product_code
```

---

# 1230 — Product Translations Table

```text
product_translations
--------------------
product_id
language
name
description
updated_at
```

Primary/unique:

```text
(product_id, language)
```

---

# 1231 — Categories Table

```text
categories
----------
id
code
status
display_order
parent_category_id
created_at
updated_at
version
```

---

# 1232 — Menus Table

```text
menus
-----
id
store_id
channel
status
version
valid_from
valid_to
published_at
created_at
updated_at
```

Potential unique active scope:

```text
(store_id, channel, version)
```

---

# 1233 — Menu Categories Table

```text
menu_categories
---------------
menu_id
category_id
display_order
visible
```

---

# 1234 — Menu Items Table

```text
menu_items
----------
id
menu_id
product_id
category_id
display_order
visible
sellable
status
created_at
updated_at
```

---

# 1235 — Prices Table

```text
prices
------
id
product_id
store_id
channel
amount
currency
valid_from
valid_to
status
created_at
updated_at
```

Add constraints for valid ranges.

---

# 1236 — Modifier Groups Table

```text
modifier_groups
---------------
id
code
selection_type
min_select
max_select
required
status
display_order
```

---

# 1237 — Modifiers Table

```text
modifiers
---------
id
modifier_group_id
code
price_delta
status
display_order
```

---

# 1238 — Sub-Modifiers Table

```text
sub_modifiers
-------------
id
modifier_id
code
price_delta
status
display_order
```

Only if business requires nested structure.

---

# 1239 — Menu Item Modifier Groups Table

```text
menu_item_modifier_groups
-------------------------
menu_item_id
modifier_group_id
display_order
required_override
```

---

# 1240 — Catalog Versions Table

Possible:

```text
catalog_versions
----------------
store_id
channel
version
published_at
published_by
```

Unique:

```text
(store_id, channel, version)
```

---

# 1241 — Product Images Table

```text
product_images
--------------
id
product_id
object_key
media_type
display_order
status
checksum
created_at
```

---

# 1242 — Outbox Table

Catalog events use:

```text
outbox_events
```

Examples:

```text
ProductChanged
PriceChanged
MenuPublished
CatalogChanged
```

---

# 1243 — Catalog Transactions

Examples:

```text
Create product
Update product
Create menu
Publish menu
Update price
Attach modifier group
```

Each should be local database transactions.

---

# 1244 — Create Product Transaction

```text
BEGIN

Validate code uniqueness
Insert product
Insert translations
Insert images metadata if provided
Insert outbox ProductCreated

COMMIT
```

---

# 1245 — Update Price Transaction

```text
BEGIN

Validate product
Validate price period
Close/expire previous price if needed
Insert/update new price
Insert outbox PriceChanged

COMMIT
```

---

# 1246 — Publish Menu Transaction

Concept:

```text
BEGIN

Validate draft
Increment version
Mark publish state
Store publication metadata
Insert outbox MenuPublished

COMMIT
```

Cache invalidation happens after commit.

---

# 1247 — Optimistic Locking

Admin edits may conflict.

Use:

```text
version
```

on:

```text
product
category
menu
modifier group
```

Prevent accidental overwrite.

---

# 1248 — Concurrent Publishing

Two admins may publish same store/channel simultaneously.

Protect using:

```text
row lock
version constraint
unique version generation
transaction
```

---

# 1249 — Price Overlap

Prevent overlapping active prices for same scope if business requires single price.

Strategies:

```text
application validation
exclusion constraint
controlled effective dating
```

---

# 1250 — Effective-Dated Price

Price selection:

```text
valid_from <= now
AND
(valid_to IS NULL OR valid_to > now)
```

The exact inclusive/exclusive boundary must be standardized.

---

# 1251 — Price Conflict Resolution

If multiple rules match, define deterministic precedence.

Do not:

```text
SELECT ... LIMIT 1
```

without explicit ordering.

---

# 1252 — Menu Item Uniqueness

Possible rule:

```text
one product once per menu/category
```

or allow duplicates intentionally.

Document business choice.

---

# 1253 — Category Ordering

Use:

```text
display_order
```

and stable secondary sort such as:

```text
id
```

Avoid ambiguous order.

---

# 1254 — Modifier Ordering

Use:

```text
display_order
```

for groups and choices.

This affects customer UX and should be owned by Catalog.

---

# 1255 — Catalog Events Published

Candidate:

```text
ProductCreated
ProductUpdated
ProductActivated
ProductDeactivated
CategoryChanged
PriceChanged
ModifierConfigurationChanged
MenuPublished
MenuUnpublished
CatalogChanged
```

---

# 1256 — ProductUpdated Event

Publish only necessary public information.

Example:

```json
{
  "event_id": "evt_...",
  "event_type": "PRODUCT_UPDATED",
  "event_version": 1,
  "producer": "catalog-service",
  "data": {
    "product_id": "PROD001",
    "changed_fields": [
      "default_name",
      "status"
    ]
  }
}
```

---

# 1257 — PriceChanged Event

Example:

```json
{
  "event_type": "PRICE_CHANGED",
  "data": {
    "product_id": "PROD001",
    "store_id": "STORE001",
    "channel": "APP",
    "currency": "USD"
  }
}
```

Avoid publishing all price history if consumers only need invalidation.

---

# 1258 — MenuPublished Event

Example:

```json
{
  "event_type": "MENU_PUBLISHED",
  "data": {
    "menu_id": "MENU001",
    "store_id": "STORE001",
    "channel": "APP",
    "version": 42
  }
}
```

Useful for:

```text
cache prewarm
search projection
client sync
analytics
```

---

# 1259 — Events Consumed

Catalog should consume minimal external events.

Possible:

```text
StoreActivated
StoreDeactivated
ChannelChanged
```

if Store/Location owns store state.

Avoid unrelated dependencies.

---

# 1260 — Product Availability Integration

Inventory may publish:

```text
InventoryAvailabilityChanged
```

Catalog should not necessarily persist that as authoritative stock.

For customer menu assembly, options:

```text
runtime composition
local availability projection
gateway composition
```

Choose based on latency needs.

---

# 1261 — Catalog + Inventory Composition

Option A:

```text
Client
  ↓
Catalog API
  ↓
Catalog calls Inventory
```

Risk:

```text
hard dependency
latency
```

Option B:

```text
Inventory events
   ↓
Catalog local projection
```

Better for high-read menu APIs if eventual consistency is acceptable.

---

# 1262 — Availability Projection

Possible table/cache:

```text
inventory_availability_projection
```

Fields:

```text
store_id
product_id
availability_status
updated_at
source_version
```

This is not authoritative inventory.

---

# 1263 — Availability Staleness

If using projection, define:

```text
maximum acceptable lag
```

Order Service must still perform authoritative validation/reservation before final acceptance.

Menu availability is advisory.

---

# 1264 — Catalog Service Clean Architecture

Recommended package:

```text
catalog-service/
│
├── domain/
│   ├── product/
│   ├── category/
│   ├── menu/
│   ├── pricing/
│   ├── modifier/
│   ├── event/
│   ├── policy/
│   └── exception/
│
├── application/
│   ├── product/
│   ├── category/
│   ├── menu/
│   ├── pricing/
│   ├── publish/
│   └── query/
│
├── adapter/in/
│   ├── rest/
│   ├── grpc/
│   └── kafka/
│
├── adapter/out/
│   ├── persistence/
│   ├── redis/
│   ├── storage/
│   ├── inventory/
│   └── kafka/
│
└── config/
```

---

# 1265 — Input Ports

Examples:

```text
CreateProductUseCase
UpdateProductUseCase
ActivateProductUseCase
CreateCategoryUseCase
CreateMenuUseCase
UpdateMenuUseCase
PublishMenuUseCase
SetPriceUseCase
CreateModifierGroupUseCase
AttachModifierGroupUseCase
GetPublishedMenuUseCase
GetProductUseCase
ValidateOrderableItemUseCase
```

---

# 1266 — Output Ports

Examples:

```text
LoadProductPort
SaveProductPort
CatalogQueryPort
MenuPort
PricePort
ModifierPort
CatalogCachePort
OutboxPort
ObjectStoragePort
InventoryAvailabilityPort
ClockPort
```

---

# 1267 — Catalog Query Port

Example:

```java
public interface PublishedMenuQueryPort {

    PublishedMenuView getMenu(
        StoreId storeId,
        SalesChannel channel,
        Language language
    );
}
```

This query may use optimized joins/projections rather than aggregates.

---

# 1268 — Orderable Item Port

Internal contract:

```java
public interface GetOrderableItemUseCase {

    OrderableItemResult get(
        StoreId storeId,
        ProductId productId,
        SalesChannel channel
    );
}
```

Return:

```text
current price
allowed modifiers
catalog sellability
menu version
```

---

# 1269 — Catalog Error Catalog

Candidate:

```text
PRODUCT_NOT_FOUND
PRODUCT_INACTIVE
CATEGORY_NOT_FOUND
MENU_NOT_FOUND
MENU_NOT_PUBLISHED
MENU_VALIDATION_FAILED
PRICE_NOT_FOUND
PRICE_CONFLICT
INVALID_MODIFIER_CONFIGURATION
MODIFIER_NOT_FOUND
PRODUCT_NOT_IN_MENU
PRODUCT_NOT_SELLABLE
INVALID_LANGUAGE
VERSION_CONFLICT
```

---

# 1270 — HTTP Error Mapping

Example:

| Error | HTTP |
|---|---:|
| PRODUCT_NOT_FOUND | 404 |
| MENU_NOT_FOUND | 404 |
| PRODUCT_INACTIVE | 409 |
| MENU_VALIDATION_FAILED | 422 |
| PRICE_CONFLICT | 409 |
| VERSION_CONFLICT | 409 |
| INVALID_MODIFIER_CONFIGURATION | 422 |

---

# 1271 — Admin Authorization

Permissions:

```text
catalog.read
catalog.product.manage
catalog.price.manage
catalog.menu.manage
catalog.publish
catalog.modifier.manage
```

Do not give every catalog administrator publish permission automatically.

---

# 1272 — Publish Permission

Publishing changes customer-visible behavior.

May require:

```text
separate permission
approval workflow
audit
```

depending on business risk.

---

# 1273 — Audit Requirements

Audit:

```text
product activation/deactivation
price change
menu publish/unpublish
modifier rule change
category deletion/archive
manual store visibility override
```

---

# 1274 — Audit Fields

Possible:

```text
actor_id
action
resource_type
resource_id
old_value summary
new_value summary
request_id
occurred_at
```

Avoid storing unnecessary huge payloads.

---

# 1275 — Catalog History

Important configuration may need historical versioning.

Examples:

```text
price
menu version
modifier configuration
publication state
```

This helps explain historical orders.

---

# 1276 — Menu Snapshot

Published menu version may be represented as:

```text
immutable snapshot
```

or reconstructable versioned records.

Snapshot improves:

```text
debugging
rollback
comparison
cache
```

but increases storage.

---

# 1277 — Catalog Rollback

Possible:

```text
Publish version 42
      ↓ issue
Re-publish version 41 content as version 43
```

Prefer forward publication over mutating old history.

---

# 1278 — Price Rollback

Do not rewrite historical price rows unnecessarily.

Create new effective record.

---

# 1279 — Catalog Migration from Legacy

Migration inputs may include:

```text
legacy menu tables
price tables
modifier tables
store mappings
legacy item IDs
```

Create explicit mapping.

---

# 1280 — Legacy Product Mapping

Possible table:

```text
legacy_product_mapping
----------------------
source_system
legacy_product_id
product_id
created_at
```

---

# 1281 — Migration Validation

Validate:

```text
product counts
category counts
price coverage
store menu coverage
modifier relationships
duplicate codes
orphan rows
invalid dates
```

---

# 1282 — Migration Reconciliation

Compare:

```text
legacy visible menu
vs
new published menu
```

for each store/channel.

Any difference must be:

```text
expected
approved
documented
```

---

# 1283 — Catalog Read Performance

Catalog is typically read-heavy.

Optimize for:

```text
menu retrieval
product detail
category listing
store-specific menu
```

Write volume is usually lower.

---

# 1284 — Menu Query Strategy

Avoid N+1 queries.

Possible:

```text
single optimized projection query
multiple batched queries
materialized published snapshot
```

Measure before choosing.

---

# 1285 — Menu Payload Size

Large menus can be expensive.

Strategies:

```text
gzip/brotli
ETag
conditional GET
category pagination if needed
delta sync
client cache
```

---

# 1286 — Delta Catalog Sync

Future optimization:

```text
client version = 41
server version = 42
```

Return only changes.

Use only if menu size/traffic justifies complexity.

---

# 1287 — Catalog Prewarming

After publish:

```text
MenuPublished
      ↓
prewarm Redis/CDN
```

This reduces first-request latency.

---

# 1288 — CDN

Static media and possibly public catalog JSON may use CDN.

Ensure invalidation/versioning is correct.

---

# 1289 — Cache Key Versioning

Versioned key pattern:

```text
catalog:menu:STORE001:APP:km:v42
```

New publish uses:

```text
v43
```

No risk of mixed stale object under same key.

---

# 1290 — Catalog Metrics

Business metrics:

```text
products_active
menus_published
menu_publish_total
price_change_total
catalog_validation_failure_total
```

Technical:

```text
menu_request_total
menu_latency
cache_hit_ratio
DB latency
outbox backlog
```

---

# 1291 — Catalog SLIs

Possible:

```text
published menu availability
P95 menu response latency
cache hit ratio
publish success rate
event publication lag
```

---

# 1292 — Alerts

Alert on:

```text
high menu API error rate
cache failure
DB failure
publish failures
outbox backlog
missing active price
menu validation failures spike
```

---

# 1293 — Catalog Logs

Safe structured fields:

```text
product_id
menu_id
store_id
channel
version
operation
result
request_id
correlation_id
```

No major PII should exist in Catalog.

---

# 1294 — Catalog Dashboard

Show:

```text
request rate
menu latency
cache hit
DB queries
publish count
publish failure
outbox lag
active product count
active menu count
```

---

# 1295 — Runbooks

Required:

```text
Published menu unavailable
Redis unavailable
Catalog DB unavailable
Incorrect price published
Bad modifier configuration
Outbox backlog
Search projection lag
Broken product image
```

---

# 1296 — Incorrect Price Incident

Runbook:

```text
Identify affected scope
      ↓
Disable/unpublish if severe
      ↓
Create corrected price
      ↓
Publish new menu version
      ↓
Invalidate cache
      ↓
Check orders created during window
      ↓
Business follow-up
```

Do not silently rewrite historical orders.

---

# 1297 — Broken Menu Incident

If publish creates invalid user experience:

```text
publish previous known-good configuration as new version
```

then investigate.

---

# 1298 — Backup

Catalog backup includes:

```text
products
categories
menus
prices
modifier configuration
publication versions
```

Media object storage requires separate backup/retention strategy.

---

# 1299 — Restore

After restore validate:

```text
published versions
price periods
modifier relations
cache rebuilt
outbox state
media references
```

---

# 1300 — Schema Migration

Example:

```text
V1__create_products.sql
V2__create_product_translations.sql
V3__create_categories.sql
V4__create_menus.sql
V5__create_menu_items.sql
V6__create_prices.sql
V7__create_modifier_groups.sql
V8__create_modifiers.sql
V9__create_product_images.sql
V10__create_catalog_versions.sql
V11__create_outbox.sql
```

---

# 1301 — Backward-Compatible Catalog Migration

Example:

```text
Add new modifier field nullable
      ↓
Deploy code supporting null
      ↓
Backfill
      ↓
Publish new catalog version
      ↓
Enforce constraint later
```

---

# 1302 — Product Code Migration

If legacy product code changes:

```text
keep immutable product_id
store legacy mapping
introduce new code
```

Avoid changing identifiers consumers rely on without migration.

---

# 1303 — Catalog Testing Strategy

Test:

```text
Domain
Application
REST
Persistence
Cache
Kafka
Publication
Pricing
Modifiers
Localization
Performance
Migration
```

---

# 1304 — Product Domain Tests

Test:

```text
status transitions
activation requirements
unique product code behavior
archive rules
```

---

# 1305 — Price Tests

Test:

```text
positive amount
currency required
date validity
scope precedence
overlap detection
effective date selection
```

---

# 1306 — Modifier Tests

Test:

```text
single selection
multi-selection
required
min/max
sub-modifier ownership
price delta
invalid configuration
```

---

# 1307 — Menu Publish Tests

Test:

```text
valid publish
missing price
inactive product
invalid category
invalid modifier group
version increment
outbox event
cache invalidation
```

---

# 1308 — Localization Tests

Test:

```text
requested language
fallback language
missing translation
category translation
modifier translation
```

---

# 1309 — REST Contract Tests

Test:

```text
menu response schema
product detail
filters
ETag
304 response
errors
admin authorization
```

---

# 1310 — Persistence Tests

Use PostgreSQL Testcontainers.

Test:

```text
unique product code
price constraints
menu version uniqueness
modifier foreign keys
Flyway
optimistic lock
```

---

# 1311 — Cache Tests

Test:

```text
cache hit
cache miss
Redis unavailable
invalidation
versioned key
stale entry
```

---

# 1312 — Kafka Tests

Test:

```text
ProductUpdated
PriceChanged
MenuPublished
duplicate consumer event if consuming store events
outbox publisher
```

---

# 1313 — Load Tests

Scenarios:

```text
hot store menu
many concurrent menu requests
cold-cache burst
product detail burst
publish while read traffic high
```

---

# 1314 — Performance Targets

Illustrative targets should be defined later.

Example categories:

```text
menu P95 latency
cache hit ratio
max menu payload
publish duration
DB query count per menu request
```

Do not hard-code targets without measurement.

---

# 1315 — Catalog Security

Catalog public reads may be low-risk.

Admin writes require strong control.

Protect:

```text
price changes
publication
product activation
modifier changes
```

with:

```text
RBAC
audit
MFA for high-risk admin if policy requires
```

---

# 1316 — Public Catalog Exposure

Only expose:

```text
published
active
customer-visible
```

data.

Do not expose:

```text
draft notes
internal cost
supplier secret
admin metadata
```

---

# 1317 — Internal Cost

If cost price is required:

```text
cost
margin
supplier pricing
```

may belong to another restricted domain or restricted Catalog submodel.

Do not expose through public menu API.

---

# 1318 — Catalog Data Classification

Likely:

```text
Public:
published names/images/prices

Internal:
draft menus
internal tags

Confidential:
supplier/internal pricing if present
```

---

# 1319 — Catalog Authorization Matrix

Example:

| Action | USER | CATALOG_EDITOR | CATALOG_PUBLISHER | ADMIN |
|---|---:|---:|---:|---:|
| View published menu | Yes | Yes | Yes | Yes |
| Edit product | No | Yes | Yes | Yes |
| Change price | No | Maybe | Yes | Yes |
| Publish menu | No | No/Maybe | Yes | Yes |
| Archive product | No | Maybe | Yes | Yes |

Exact policy must be approved.

---

# 1320 — Catalog Approval Workflow

Optional for high-risk price/menu changes:

```text
Editor creates draft
      ↓
Reviewer approves
      ↓
Publisher publishes
```

Useful when price mistakes are costly.

---

# 1321 — Catalog Audit Event Examples

```text
PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_ARCHIVED
PRICE_CREATED
PRICE_CHANGED
MENU_PUBLISHED
MENU_UNPUBLISHED
MODIFIER_RULE_CHANGED
```

---

# 1322 — Price Change Audit

Audit should include:

```text
old amount
new amount
currency
store
channel
effective period
actor
reason
```

---

# 1323 — Catalog Import

Admin bulk import may support:

```text
CSV
Excel
external master data
```

Import must validate all rows before publish.

---

# 1324 — Bulk Import Staging

Recommended:

```text
Upload
  ↓
Parse into staging
  ↓
Validate
  ↓
Show errors
  ↓
Approve
  ↓
Apply transaction/batches
  ↓
Publish
```

Do not directly overwrite live menu from raw upload.

---

# 1325 — Import Idempotency

Use:

```text
import_id
source checksum
```

to prevent accidental duplicate import.

---

# 1326 — Import Validation

Validate:

```text
duplicate product codes
unknown categories
invalid prices
bad currency
invalid modifier references
duplicate store mapping
```

---

# 1327 — Catalog Export

Admin export may produce:

```text
products
prices
menus
modifier rules
```

Apply authorization.

Do not include restricted internal fields unless requested and permitted.

---

# 1328 — Catalog Change Workflow

Recommended:

```text
Draft change
   ↓
Validate
   ↓
Review
   ↓
Publish
   ↓
Version
   ↓
Event
   ↓
Cache/Search refresh
```

---

# 1329 — Catalog API Read Flow

```text
Client
  ↓
GET Store Menu
  ↓
Catalog REST Adapter
  ↓
GetPublishedMenuUseCase
  ↓
Cache Port
   ├── hit → return
   └── miss
        ↓
      Query Port
        ↓
      PostgreSQL
        ↓
      Cache result
        ↓
      Response
```

---

# 1330 — Order Validation Flow

```text
Order Service
   ↓
Get Orderable Item
   ↓
Catalog Service
   ↓
Validate:
product active
menu membership
channel
base price
modifier rules
   ↓
Return snapshot
```

Order Service then combines:

```text
Inventory
Promotion
Payment
```

as needed.

---

# 1331 — Product Deactivation Flow

```text
Admin
  ↓
Deactivate Product
  ↓
Catalog
  ↓
Update state
  ↓
Publish ProductDeactivated
  ↓
Invalidate menus/cache
```

Existing orders remain historical and valid.

---

# 1332 — Store Menu Publish Flow

```text
Editor changes draft
      ↓
Validate
      ↓
Publish
      ↓
Version 43
      ↓
CatalogChanged
      ↓
Cache prewarm
      ↓
Clients refresh
```

---

# 1333 — Catalog Consistency Model

Strong/local:

```text
product update
price update
publish version
modifier configuration
```

Eventually consistent:

```text
search projection
inventory availability projection
analytics
client cache
```

---

# 1334 — Read-After-Write

Admin should see a just-saved draft immediately from primary DB.

Public client may use cached published menu by version.

---

# 1335 — Publication Consistency

Once version 43 is declared published, all categories/items/prices in that version must represent one coherent menu state.

Avoid mixed:

```text
v42 categories
v43 prices
```

---

# 1336 — Catalog Observability

Trace:

```text
menu request
cache lookup
DB fallback
publish
outbox publication
```

Useful span attributes:

```text
store_id
channel
menu_version
cache_hit
```

Do not attach large product payloads to traces.

---

# 1337 — Catalog SLO Inputs

Measure:

```text
availability
menu latency
publish success
cache hit
event lag
```

SLO targets belong in observability/production parts.

---

# 1338 — Catalog Review Checklist

## Ownership

- [ ] Product ownership clear.
- [ ] Inventory excluded.
- [ ] Promotion ownership separated.
- [ ] Order snapshots separated.

## Product

- [ ] Product ID stable.
- [ ] Product code unique.
- [ ] Status lifecycle defined.
- [ ] Localization defined.

## Menu

- [ ] Store/channel scope defined.
- [ ] Publish lifecycle defined.
- [ ] Versioning defined.
- [ ] Cache invalidation defined.

## Price

- [ ] Exact money type.
- [ ] Currency required.
- [ ] Effective dating defined.
- [ ] Overlap/precedence rules defined.

## Modifiers

- [ ] Selection rules defined.
- [ ] Validation defined.
- [ ] Price deltas supported safely.
- [ ] Nested options controlled.

---

# 1339 — Catalog Data Review Checklist

- [ ] Tables have one owner.
- [ ] Foreign keys remain internal.
- [ ] Unique product codes.
- [ ] Version columns where needed.
- [ ] Price constraints.
- [ ] Publication history.
- [ ] Outbox.
- [ ] Retention/archive rules.
- [ ] Migration mapping for legacy data.

---

# 1340 — Catalog Contract Review Checklist

- [ ] Public menu contract stable.
- [ ] Internal orderable-item contract defined.
- [ ] ETag/version defined.
- [ ] Localization contract defined.
- [ ] Error codes stable.
- [ ] Admin APIs separate.
- [ ] Events versioned.
- [ ] No persistence models leaked.

---

# 1341 — Catalog Testing Definition of Done

Feature complete when:

- [ ] Domain tests.
- [ ] Application tests.
- [ ] Persistence tests.
- [ ] REST tests.
- [ ] Cache tests.
- [ ] Publish tests.
- [ ] Pricing tests.
- [ ] Modifier tests.
- [ ] Authorization tests.
- [ ] Event tests.
- [ ] Observability added.
- [ ] Documentation updated.

---

# 1342 — Catalog Production Readiness Checklist

Before production:

- [ ] All store menus validated.
- [ ] Prices reconciled with current source.
- [ ] Modifier rules validated.
- [ ] Cache fallback tested.
- [ ] Menu publish rollback tested.
- [ ] Outbox replay tested.
- [ ] Backup/restore tested.
- [ ] Search projection rebuild tested if used.
- [ ] Load test passed.
- [ ] Alerts configured.
- [ ] Runbooks available.
- [ ] Admin permissions reviewed.

---

# 1343 — Initial Implementation Order

Recommended:

```text
1. Product model
2. Category model
3. Product translations
4. Menu model
5. Menu item model
6. Price model
7. Public menu query
8. Redis cache
9. Modifier groups
10. Modifiers
11. Orderable-item validation contract
12. Menu publish/versioning
13. Outbox events
14. Admin APIs
15. Product media
16. Search projection
17. Legacy migration
```

---

# 1344 — Minimum Viable Catalog Service

First production-capable version:

```text
Products
Categories
Store menu
Base price
Product status
Menu publish/version
Public menu API
Orderable-item validation
Redis cache
Outbox
Admin authorization
Audit for price/publish
```

Modifiers can be added early if required by current products.

---

# 1345 — Future Enhancements

Potential:

```text
Bundles
Combos
Time-based menus
Daypart menus
Advanced search
Nutritional data
Allergens
Channel-specific pricing
Regional pricing
Catalog delta sync
Approval workflow
Automated merchandising
```

---

# 1346 — PART 10 Deliverables

PART 10 produces:

1. Catalog Service responsibility definition.
2. Boundary from Inventory, Ordering, Promotion.
3. Product aggregate.
4. Product status lifecycle.
5. Product code strategy.
6. Localization model.
7. Category model.
8. Menu model.
9. Store/channel menu model.
10. Menu-item model.
11. Visibility/sellability distinction.
12. Catalog availability metadata.
13. Price model.
14. Store/channel price rules.
15. Price versioning/effective dating.
16. Modifier-group model.
17. Modifier/sub-modifier model.
18. Modifier validation.
19. Orderable-item snapshot contract.
20. Public REST APIs.
21. Admin REST APIs.
22. Menu versioning.
23. Publish workflow.
24. Redis cache strategy.
25. ETag/conditional GET.
26. Search guidance.
27. Media/object-storage model.
28. Time/daypart rules.
29. Catalog database schema.
30. Transaction patterns.
31. Concurrency controls.
32. Event catalog.
33. Inventory availability integration.
34. Clean Architecture structure.
35. Input/output ports.
36. Error catalog.
37. Authorization and audit rules.
38. Legacy migration.
39. Read performance guidance.
40. Metrics and SLIs.
41. Alerts.
42. Logging.
43. Runbooks.
44. Backup/restore.
45. Flyway migration plan.
46. Testing strategy.
47. Review checklists.
48. Production readiness.
49. Implementation order.

---

# 1347 — Exit Criteria

PART 10 is complete when the team can answer:

### Product Ownership

```text
What does Catalog own?
```

### Inventory Boundary

```text
What availability data belongs to Inventory instead?
```

### Menu

```text
How are store/channel menus represented and published?
```

### Pricing

```text
How is the active base price selected and historically preserved?
```

### Modifiers

```text
How are required/optional selections validated?
```

### Ordering

```text
What snapshot does Order Service receive?
```

### Versioning

```text
How does a client know the menu changed?
```

### Cache

```text
How is Redis used without becoming authoritative?
```

### Publication

```text
How do we prevent partially published catalog states?
```

### Operations

```text
How do we roll forward after a bad menu or price publish?
```

If these answers are clear and tested, Catalog Service is ready for implementation.

---

# 1348 — Handoff to PART 11

PART 11 defines Inventory Service.

```text
PART 10
Catalog Service
      ↓
Product / Menu Definition
Store / Channel Sellability
Base Price
Modifier Rules
      ↓
PART 11
Inventory Service
```

Inventory Service will own:

```text
Stock Item
Stock Level
Reservation
Release
Deduction
Adjustment
Availability
Concurrency
Reservation Expiry
Inventory Events
```

Catalog will remain responsible for:

```text
what the product is
how it is presented
how it is priced
how it is configured
```

Inventory will answer:

```text
Can the product actually be fulfilled right now?
```

---

# PART 10 — Summary

The Catalog Service is the authoritative model of:

```text
Products
Categories
Menus
Prices
Modifiers
Store/Channel Configuration
```

The customer-facing menu is derived from:

```text
Product
   ↓
Category
   ↓
Store Menu
   ↓
Channel
   ↓
Price
   ↓
Modifier Rules
   ↓
Published Version
```

Availability is composed later with:

```text
Inventory
Time Rules
Channel Rules
```

The most important architectural rules are:

```text
Catalog owns product/menu definition.
Inventory owns stock.
Promotion owns discounts.
Order stores transaction snapshots.
Published menus are versioned.
Prices are exact and effective-dated.
Redis is cache, not source of truth.
Admin publication is auditable.
Events are emitted through the outbox.
```

---

**End of PART 10 — Catalog Service**
