---
title: "PHASE 06 — Catalog Service"
---

# PHASE 06 — Catalog Service

> **Purpose:** Implement the platform Catalog Service as the authoritative source for product definition, customer-facing menu structure, categories, base prices, modifier configuration, store/channel sellability, menu publication, and catalog versioning.
>
> **Previous Phase:** Phase 05 — Customer Service
>
> **Next Phase:** Phase 07 — Inventory Service
>
> **Primary Architecture Basis:** PART 10 — Catalog Service, supported by PART 04 — Clean + Hexagonal Architecture, PART 05 — Contracts, PART 06 — Security Architecture, PART 07 — Data Architecture, PART 21 — Service Communication, PART 23 — Kafka / Event Architecture, PART 24 — Redis / Caching, PART 25 — Testing Strategy, and PART 31 — Observability.
>
> **Primary Stack:** Java, Spring Boot, PostgreSQL, Flyway, Redis, REST, Kafka, object storage/CDN where media is enabled, OpenTelemetry.
>
> **Status:** Service Implementation Specification

---

# 1. Phase 6 Goal

Phase 6 builds:

```text
catalog-service
```

Catalog Service is the authoritative model of:

```text
Products
Categories
Menus
Menu Items
Base Prices
Modifier Groups
Modifiers
Sub-Modifiers where required
Store / Channel Configuration
Catalog Availability Metadata
Menu Publication State
Menu Versioning
Media References
```

The service must answer:

```text
What products exist?
Which categories do they belong to?
Which products appear in a store/channel menu?
Which items are visible?
Which items are sellable by catalog rules?
Which modifiers may be selected?
Which base price applies?
Which published menu version is current?
What catalog snapshot should Ordering validate and persist?
```

The service does **not** own:

```text
Physical stock quantity
Inventory reservation
Inventory deduction
Order lifecycle
Promotion/coupon discount ownership
Payment state
Wallet balance
Loyalty balance
Customer profile
```

The critical domain separation is:

```text
Catalog
= what the product is
+ how it is presented
+ how it is configured
+ its authoritative base price

Inventory
= whether the product can actually be fulfilled now

Promotion
= discount / coupon / campaign benefit

Ordering
= immutable transaction-time item/price/configuration snapshot
```

---

# 2. Phase 6 Success State

Phase 6 is complete when this product lifecycle works:

```text
Admin
  ↓
Create Product
  ↓
Add Translation / Category / Price
  ↓
Add to Store + Channel Menu
  ↓
Validate Draft
  ↓
Publish Menu
  ↓
Increment Menu Version
  ↓
Invalidate / Version Cache
  ↓
Publish MenuPublished / CatalogChanged
  ↓
Public Client Reads Published Menu
```

And this order-validation flow works:

```text
Order Service
    ↓
GetOrderableItem / ValidateOrderItems
    ↓
Catalog Service
    ↓
Validate:
  product active
  product in menu
  store/channel allowed
  current base price
  modifier rules
  catalog sellability
    ↓
Return OrderableItemSnapshot
    ↓
Order Service stores immutable snapshot
```

The service must also prove:

```text
product_code uniqueness
menu version coherence
price selection determinism
price effective-dating
no partial publish
modifier validation
optimistic concurrency
cache fallback
ETag / 304 behavior
outbox reliability
safe event replay
admin authorization
price/publish auditability
legacy reconciliation where migration applies
```

---

# 3. Source-Defined Open Decisions

PART 10 intentionally leaves several implementation choices configurable.

Do not invent them as permanent production rules.

Freeze required decisions before production.

Major decision areas:

```text
product ID strategy
product code format
product types
supported languages
language fallback
category hierarchy depth
channel codes
store reference source
menu version scope
draft/published representation
atomic publish mechanism
price precedence
price time-boundary semantics
modifier nesting scope
inventory availability composition
cache TTL / invalidation
admin role matrix
publish approval policy
media requirements
time/daypart scope
legacy migration source
```

---

# 4. Product ID Strategy

`product_id` is the stable internal identity.

Decision:

```text
PRODUCT_ID_STRATEGY = TBD_POLICY
```

Requirements:

```text
immutable
globally stable within Catalog
safe for downstream reference
not derived from display name
not silently changed during migration
```

---

# 5. Product Code Strategy

Catalog owns:

```text
product_code
```

Requirements:

```text
stable
unique
business-readable if required
not based on mutable product name
```

Decision:

```text
PRODUCT_CODE_FORMAT = TBD_POLICY
PRODUCT_CODE_CASE_RULE = TBD_POLICY
LEGACY_CODE_MAPPING_REQUIRED = TBD_SCOPE
```

---

# 6. Product Type Policy

Source examples:

```text
DRINK
FOOD
MERCHANDISE
BUNDLE
TOPUP
SERVICE
```

Only introduce types required by actual business behavior.

Decision:

```text
PRODUCT_TYPES = TBD_POLICY
```

Do not use one broad enum to hide unrelated complex domain behavior.

---

# 7. Product Status Policy

Source-defined statuses:

```text
DRAFT
ACTIVE
INACTIVE
ARCHIVED
```

Initial implementation should preserve these meanings unless architecture is formally changed.

---

# 8. Product Lifecycle

Source model:

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

Archived products should not normally return to ACTIVE without explicit policy.

Decision:

```text
ARCHIVE_REACTIVATION_ALLOWED = TBD_POLICY
```

---

# 9. Localization Policy

Freeze:

```text
supported languages
default product language
fallback language
whether category/modifier names are localized
whether missing translation blocks publish
```

Decision:

```text
SUPPORTED_CATALOG_LANGUAGES = TBD_POLICY
DEFAULT_CATALOG_LANGUAGE = TBD_POLICY
FALLBACK_LANGUAGE = TBD_POLICY
MISSING_TRANSLATION_PUBLISH_RULE = TBD_POLICY
```

---

# 10. Category Hierarchy Policy

Category model may support:

```text
parent_category_id
```

Decision:

```text
CATEGORY_HIERARCHY_ENABLED = TBD_SCOPE
MAX_CATEGORY_DEPTH = TBD_POLICY
```

Avoid deep hierarchy unless the product experience requires it.

---

# 11. Store Reference Policy

Catalog stores:

```text
store_id
```

as a logical reference.

Decision:

```text
STORE_SOURCE_OF_TRUTH = TBD_ARCHITECTURE
STORE_VALIDATION_MODE = TBD_ARCHITECTURE
```

Possible future owner:

```text
Store / Location Service
```

Catalog does not automatically own full store master data.

---

# 12. Sales Channel Policy

Source examples:

```text
APP
POS
DELIVERY
DINE_IN
PICKUP
PARTNER
SELF_DINE_IN
PARTNER_GRAB
```

Freeze one canonical set.

Decision:

```text
SALES_CHANNEL_CODES = TBD_POLICY
```

Do not let individual services invent incompatible spellings.

---

# 13. Menu Scope Strategy

A menu may represent:

```text
store
channel
campaign
time-based configuration
```

Recommended initial scope:

```text
store + channel
```

Decision:

```text
MENU_SCOPE = TBD_POLICY
```

---

# 14. Menu Version Strategy

Architecture options:

```text
global menu version
per-store version
per-channel version
per-resource version
```

Source recommendation where store menus vary significantly:

```text
per store + channel version
```

Decision:

```text
MENU_VERSION_SCOPE = TBD_POLICY
```

---

# 15. Draft / Published Strategy

Admin changes should not necessarily alter the live menu immediately.

Decision:

```text
CATALOG_DRAFT_PUBLISH_ENABLED = TBD_POLICY
```

Recommended source pattern:

```text
Draft
  ↓
Validate
  ↓
Publish
  ↓
Version
```

---

# 16. Atomic Publication Strategy

Possible source-supported strategies:

```text
versioned rows
publish flag switch
snapshot table
transactional copy
```

Decision:

```text
ATOMIC_PUBLISH_STRATEGY = TBD_ARCHITECTURE
```

Hard requirement:

```text
A published version must be internally coherent.
```

Never expose:

```text
v42 category structure
+
v43 price state
```

as one published menu.

---

# 17. Price Scope Policy

Price model may be scoped by:

```text
product
store
channel
time
currency
```

Decision:

```text
STORE_SPECIFIC_PRICE_ENABLED = TBD_SCOPE
CHANNEL_SPECIFIC_PRICE_ENABLED = TBD_SCOPE
```

---

# 18. Price Precedence Policy

Source example:

```text
Store + Channel price
        ↓
Store price
        ↓
Channel price
        ↓
Default product price
```

If this model is used, freeze the exact precedence.

Decision:

```text
PRICE_SCOPE_PRECEDENCE = TBD_POLICY
```

Never resolve ambiguous matches through unordered:

```sql
LIMIT 1
```

---

# 19. Price Effective-Date Boundary

Source selection concept:

```text
valid_from <= now
AND
(valid_to IS NULL OR valid_to > now)
```

Freeze exact inclusive/exclusive semantics.

Decision:

```text
PRICE_VALID_FROM_INCLUSIVE = TBD_POLICY
PRICE_VALID_TO_EXCLUSIVE = TBD_POLICY
PRICE_TIMEZONE_RULE = TBD_POLICY
```

---

# 20. Currency Policy

Freeze:

```text
supported currencies
money precision
rounding rules
whether cross-currency price rows are allowed
```

Decision:

```text
SUPPORTED_CATALOG_CURRENCIES = TBD_POLICY
MONEY_SCALE = TBD_DATA_STANDARD
ROUNDING_RULE = TBD_POLICY
```

Use exact monetary types.

Never use binary floating point for authoritative money.

---

# 21. Modifier Scope Policy

Freeze whether initial Catalog requires:

```text
modifier groups
modifiers
sub-modifiers
```

Decision:

```text
MODIFIERS_REQUIRED_INITIAL_RELEASE = TBD_SCOPE
SUB_MODIFIERS_ENABLED = TBD_SCOPE
MAX_MODIFIER_NESTING_DEPTH = TBD_POLICY
```

Source says nested choices should remain shallow.

---

# 22. Inventory Availability Composition

Possible source patterns:

```text
runtime Catalog → Inventory call
local availability projection from Inventory events
gateway composition
```

Decision:

```text
MENU_INVENTORY_COMPOSITION_MODE = TBD_ARCHITECTURE
```

If projection is used:

```text
MAX_INVENTORY_PROJECTION_LAG = TBD_POLICY
```

Menu availability remains advisory.

Order/Inventory must still perform authoritative reservation/validation.

---

# 23. Cache Policy

Freeze:

```text
cached resources
TTL
versioned key behavior
prewarming
stale-while-revalidate
stampede protection
Redis outage capacity
```

Decision:

```text
CATALOG_MENU_CACHE_TTL = TBD_POLICY
CATALOG_ITEM_CACHE_TTL = TBD_POLICY
CATALOG_CATEGORY_CACHE_TTL = TBD_POLICY
CACHE_PREWARM_ENABLED = TBD_POLICY
```

Primary freshness must be:

```text
versioning
or explicit invalidation
```

not TTL alone.

---

# 24. ETag / Client Cache Policy

Source supports:

```text
ETag
menu_version
Cache-Control
If-None-Match
304 Not Modified
```

Decision:

```text
PUBLIC_MENU_ETAG_ENABLED = TBD_POLICY
PUBLIC_MENU_CACHE_CONTROL = TBD_POLICY
```

---

# 25. Publish Approval Policy

High-risk catalog changes may use:

```text
Editor
  ↓
Reviewer
  ↓
Publisher
```

Decision:

```text
PRICE_APPROVAL_REQUIRED = TBD_SECURITY
MENU_PUBLISH_APPROVAL_REQUIRED = TBD_SECURITY
MFA_FOR_PUBLISH = TBD_SECURITY
```

---

# 26. Media Scope Policy

If product media is enabled:

```text
object storage / CDN
```

stores content.

Catalog stores metadata.

Decision:

```text
PRODUCT_MEDIA_ENABLED = TBD_SCOPE
ALLOWED_MEDIA_TYPES = TBD_POLICY
MAX_MEDIA_SIZE = TBD_POLICY
MEDIA_DIMENSION_RULES = TBD_POLICY
```

---

# 27. Time / Daypart Scope

Potential future capabilities:

```text
BREAKFAST
LUNCH
DINNER
ALL_DAY
seasonal availability
weekday rules
store-local time windows
```

Decision:

```text
TIME_BASED_MENU_ENABLED = TBD_SCOPE
DAYPART_ENABLED = TBD_SCOPE
```

Do not assume UTC for local store business schedules.

---

# 28. Search Scope Policy

Initial scale may use PostgreSQL.

Future full-text may use:

```text
OpenSearch / Elasticsearch
```

as projection.

Decision:

```text
CATALOG_SEARCH_ENGINE_REQUIRED = TBD_SCOPE
```

The search index is never authoritative.

---

# 29. Legacy Migration Scope

If migrating existing menu systems, freeze:

```text
legacy source systems
legacy item ID mapping
store mapping
price source
modifier source
migration cutover model
reconciliation threshold
```

Decision:

```text
LEGACY_CATALOG_MIGRATION = TBD_SCOPE
```

---

# 30. Catalog Boundary

```text
                      Admin Portal
                          │
                          ▼
                   Catalog Service
              ┌───────────┼────────────┐
              │           │            │
              ▼           ▼            ▼
           Product      Menus        Pricing
              │           │            │
              └───────────┼────────────┘
                          ▼
                      catalog_db
                          │
                          ▼
                        Redis
```

Consumers:

```text
Mobile / Web
Ordering
Inventory
Cart
Promotion
Search / Reporting
Integration / ACL
```

---

# 31. Critical Service Boundaries

## Catalog vs Inventory

```text
Catalog:
product/menu configuration
catalog sellability
base price
modifier configuration

Inventory:
stock
availability from stock
reservation
deduction
release
adjustment
```

## Catalog vs Promotion

```text
Catalog:
base price

Promotion:
discount
coupon
campaign benefit
```

## Catalog vs Ordering

```text
Catalog:
current authoritative orderable definition

Ordering:
historical immutable transaction snapshot
```

---

# 32. Repository Location

```text
brown-platform/
└── services/
    └── catalog-service/
```

---

# 33. Java Package

Use the Phase 2 standard:

```text
com.company.catalog
```

Replace `company` with the approved organization package.

---

# 34. Catalog Service Package Structure

```text
catalog-service/
│
├── src/main/java/com/company/catalog/
│   │
│   ├── domain/
│   │   ├── product/
│   │   ├── category/
│   │   ├── menu/
│   │   ├── pricing/
│   │   ├── modifier/
│   │   ├── media/
│   │   ├── event/
│   │   ├── policy/
│   │   └── exception/
│   │
│   ├── application/
│   │   ├── port/
│   │   │   ├── in/
│   │   │   └── out/
│   │   ├── product/
│   │   ├── category/
│   │   ├── menu/
│   │   ├── pricing/
│   │   ├── modifier/
│   │   ├── publish/
│   │   ├── validation/
│   │   └── query/
│   │
│   ├── adapter/
│   │   ├── in/
│   │   │   ├── rest/
│   │   │   ├── grpc/
│   │   │   └── kafka/
│   │   └── out/
│   │       ├── persistence/
│   │       ├── redis/
│   │       ├── storage/
│   │       ├── inventory/
│   │       └── kafka/
│   │
│   └── config/
│       ├── security/
│       ├── persistence/
│       ├── kafka/
│       ├── redis/
│       └── observability/
│
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│
└── src/test/
```

Dependency direction:

```text
Adapters
   ↓
Application
   ↓
Domain
```

---

# 35. Initial Technology Dependencies

Typical dependencies:

```text
Spring Boot Web
Spring Validation
Spring Security Resource Server
Spring Data JPA or approved persistence stack
PostgreSQL Driver
Flyway
Spring Kafka
Redis client
Actuator
Micrometer
OpenTelemetry integration
Jackson
JUnit 5
AssertJ
Mockito where appropriate
Testcontainers PostgreSQL
Testcontainers Kafka where required
ArchUnit
```

Optional:

```text
Object-storage SDK
CDN integration
Search-engine client
```

only when those capabilities are in scope.

---

# 36. Ubiquitous Language

| Term | Meaning |
|---|---|
| Product | Core sellable business item |
| Product Code | Stable Catalog-owned business code |
| Menu Item | Product presentation in one menu context |
| Category | Grouping of menu items |
| Menu | Published/draft sellable presentation scope |
| Store Menu | Menu configuration for a store |
| Channel | Sales channel such as APP, POS, DELIVERY |
| Price | Authoritative base selling price |
| Modifier Group | Selection group attached to an item |
| Modifier | Choice within a modifier group |
| Sub-Modifier | Additional nested choice |
| Availability Metadata | Catalog-owned sellability metadata |
| Publication | Activation of coherent catalog configuration |
| Menu Version | Version identifying a published menu state |
| Orderable Item Snapshot | Current Catalog data Ordering can snapshot |

---

# 37. Product vs Menu Item

Never treat these as identical.

Example:

```text
Product
= Americano

Menu Item
= Americano shown in Store A / APP menu
```

A single Product may have:

```text
multiple store placements
multiple channels
different visibility
different sellability
different prices
different modifier attachments
```

---

# 38. Product Aggregate

Primary aggregate:

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

# 39. Product Invariants

Enforce:

```text
product_id immutable
product_code unique
active product has display name
active menu item references active product
price is not negative
published menu has valid category references
modifier constraints internally valid
```

---

# 40. Product Translation Model

Table/model:

```text
product_translations
```

Core fields:

```text
product_id
language
name
description
updated_at
```

Unique:

```text
(product_id, language)
```

---

# 41. Language Fallback

Source flow:

```text
requested translation exists?
    ↓ yes → use it
    ↓ no
fallback language exists?
    ↓ yes → use it
    ↓ no
use default product text
```

This rule must be consistent across:

```text
products
categories
modifier groups
modifiers
```

when localized.

---

# 42. Category Model

Possible state:

```text
category_id
code
name
description
display_order
status
parent_category_id
version
```

---

# 43. Category Invariants

Enforce:

```text
category code unique
display_order >= 0
no circular hierarchy
active child cannot reference archived parent
```

If hierarchy disabled:

```text
parent_category_id remains unused
```

---

# 44. Category Ordering

Use:

```text
display_order
```

with stable secondary ordering such as:

```text
id
```

Avoid ambiguous ordering.

---

# 45. Menu Model

Possible fields:

```text
menu_id
store_id
channel
status
valid_from
valid_to
version
published_at
created_at
updated_at
```

---

# 46. Menu Status

Source statuses:

```text
DRAFT
PUBLISHED
UNPUBLISHED
EXPIRED
```

Only:

```text
PUBLISHED
```

is customer-facing.

---

# 47. Store Menu

Store-specific menu configuration may support:

```text
Store A sells item
Store B does not
Store A uses different price
Store B uses different modifiers
```

Model this explicitly.

---

# 48. Channel-Specific Menu

A product may be:

```text
available in APP
not available in PARTNER
visible in POS
not visible in DELIVERY
```

Channel is a first-class menu dimension.

---

# 49. Menu Category Placement

Association:

```text
menu_categories
```

Possible fields:

```text
menu_id
category_id
display_order
visible
```

---

# 50. Menu Item Model

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
price reference where chosen
created_at
updated_at
```

---

# 51. Visibility vs Sellability

Distinguish:

```text
visible
= displayed to customer

sellable
= may be ordered according to Catalog
```

Example:

```text
visible = true
sellable = false
```

can represent a temporarily unavailable but visible item.

---

# 52. Catalog Availability Metadata

Catalog-level states may include:

```text
ACTIVE
UNAVAILABLE
HIDDEN
COMING_SOON
```

Do not confuse:

```text
Catalog UNAVAILABLE
```

with:

```text
Inventory OUT_OF_STOCK
```

---

# 53. Availability Composition

Final user-facing availability may be composed from:

```text
Catalog sellable
AND Store/menu enabled
AND Inventory available
AND Time rule active
AND Channel allowed
```

Catalog owns only the Catalog/menu/channel/time configuration portions.

---

# 54. Price Domain

Catalog owns authoritative:

```text
base price
```

unless a separate Pricing bounded context is introduced later.

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

# 55. Price Invariants

Enforce:

```text
amount >= 0
currency required
valid_from <= valid_to when valid_to exists
scope is valid
overlap rules are respected
price selection is deterministic
```

---

# 56. Base Price vs Promotion

Pricing flow:

```text
Catalog Base Price
      ↓
Promotion / Coupon
      ↓
Order Final Price Snapshot
```

Catalog does not own promotion discount calculations.

---

# 57. Historical Price Rule

When current Catalog price changes:

```text
2.50 → 2.75
```

old orders remain:

```text
2.50
```

because Ordering stores an immutable snapshot.

Never rewrite historical orders after Catalog changes.

---

# 58. Effective Price Selection

At a given time:

```text
valid_from <= now
AND
(valid_to IS NULL OR valid_to > now)
```

plus deterministic scope precedence.

Selection logic must be covered by unit/integration tests.

---

# 59. Price Overlap Control

Where only one price is permitted for a scope/time, use:

```text
application validation
+
strong database protection where feasible
```

Possible PostgreSQL mechanism:

```text
exclusion constraint
```

if chosen by the data design.

---

# 60. Price Change Transaction

```text
BEGIN

Load / validate product
Validate store/channel scope
Validate currency
Validate date range
Validate overlap
Close/expire prior row if required
Insert/update price
Insert outbox PriceChanged
Write audit

COMMIT
```

---

# 61. Modifier Group

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

Examples:

```text
Size
Sugar Level
Milk Choice
Extra Shot
```

---

# 62. Modifier Selection Type

Source types:

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

# 63. Modifier Group Invariants

Enforce:

```text
min_select >= 0
max_select >= min_select
required implies min_select >= 1
single-select implies max_select = 1
```

---

# 64. Modifier Model

Possible fields:

```text
modifier_id
modifier_group_id
code
name
price_delta
status
display_order
```

---

# 65. Modifier Price Delta

Examples:

```text
Large +0.50
Extra Shot +0.75
```

Use exact money type and currency semantics aligned with the item.

---

# 66. Sub-Modifier Model

Only if business requires nested structure.

Possible relationship:

```text
modifier
  ↓
sub_modifier
```

Keep nesting shallow.

If nested options become complex, revisit the domain instead of recursively extending forever.

---

# 67. Menu Item Modifier Attachment

Association:

```text
menu_item_modifier_groups
```

Possible fields:

```text
menu_item_id
modifier_group_id
display_order
required_override
```

---

# 68. Modifier Validation

At order validation, enforce:

```text
required group satisfied
min selections satisfied
max selection not exceeded
modifier active
modifier belongs to group
group belongs to menu item
sub-modifier belongs to selected parent
price delta valid
```

---

# 69. Orderable Item Snapshot

Catalog should expose a purpose-specific contract such as:

```text
OrderableItemSnapshot
```

Containing only what Ordering needs.

Potential content:

```text
product_id
product_code if needed
localized/display name
store_id
channel
menu_version
base price
currency
catalog sellability
allowed modifier groups
modifier price deltas
```

Ordering persists the required immutable snapshot.

---

# 70. Orderable Item Validation Contract

Internal operation may be:

```text
GetOrderableItem
```

or:

```text
ValidateOrderItems
```

Do not expose Catalog persistence rows directly.

---

# 71. Order Validation Flow

```text
Ordering
   ↓
Get Orderable Item
   ↓
Catalog
   ↓
Validate:
  product ACTIVE
  present in published menu
  store scope
  channel scope
  base price
  modifier rules
  catalog sellability
   ↓
Return current snapshot
```

Ordering then validates other domains such as:

```text
Inventory
Promotion
Payment
```

as required.

---

# 72. Public REST APIs

Source examples:

```text
GET /api/v1/catalog/categories
GET /api/v1/catalog/items
GET /api/v1/catalog/items/{itemId}
GET /api/v1/catalog/stores/{storeId}/menu
```

Only published/customer-visible state may appear.

---

# 73. Public Menu API

Primary endpoint:

```text
GET /api/v1/catalog/stores/{storeId}/menu
```

Typical dimensions:

```text
store
channel
language
published version
```

---

# 74. Catalog Query Parameters

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

Do not dynamically turn arbitrary request fields into SQL.

---

# 75. Public Catalog Response

Published response should expose:

```text
menu_id
store_id
channel
menu_version
localized categories
localized items
prices
modifier configuration needed by client
catalog availability
media references where active
```

Do not expose draft/admin metadata.

---

# 76. Admin REST APIs

Source examples:

```text
POST   /api/v1/admin/catalog/products
PATCH  /api/v1/admin/catalog/products/{id}

POST   /api/v1/admin/catalog/categories

POST   /api/v1/admin/catalog/modifier-groups

POST   /api/v1/admin/catalog/menus
POST   /api/v1/admin/catalog/menus/{id}/publish
```

Implementation can add purpose-specific endpoints only when contracts are defined in Phase 03 standards.

---

# 77. Create Product Flow

```text
Admin
  ↓
Validate permission
  ↓
Validate product code
  ↓
Create Product DRAFT
  ↓
Save translations
  ↓
Save media metadata if approved
  ↓
Outbox ProductCreated
  ↓
Audit
  ↓
Commit
```

---

# 78. Create Product Transaction

```text
BEGIN

Validate product_code uniqueness
Insert product
Insert translations
Insert media metadata if supplied
Insert outbox event
Insert audit where required

COMMIT
```

---

# 79. Product Activation

Before activation validate at least:

```text
display name exists
product type valid
required business metadata exists
product not archived
```

Whether price/menu placement is required before Product ACTIVE is a policy decision.

---

# 80. Product Deactivation

Source flow:

```text
Admin
  ↓
Deactivate Product
  ↓
Update state
  ↓
ProductDeactivated
  ↓
Invalidate affected menus/cache
```

Existing orders remain valid historical transactions.

---

# 81. Menu Version

Every published store/channel menu should carry:

```text
version
```

Uses:

```text
cache key version
client refresh
ETag generation
debugging
order validation
incident analysis
rollback comparison
```

---

# 82. Menu Publication Lifecycle

```text
Edit Draft
   ↓
Validate
   ↓
Publish
   ↓
Increment Version
   ↓
Commit Published State
   ↓
Invalidate / supersede cache
   ↓
MenuPublished / CatalogChanged
   ↓
Prewarm if enabled
```

---

# 83. Publish Validation

Before publication validate:

```text
active product references
valid categories
price exists where required
currency valid
modifier rules valid
no impossible min/max combinations
valid time windows
no duplicate ordering conflicts
media valid if required
store/channel scope valid
```

---

# 84. Atomic Publish Requirement

Hard requirement:

```text
customer-facing published state is coherent
```

Do not expose partial updates.

---

# 85. Publish Transaction

Concept:

```text
BEGIN

Lock relevant publish scope
Validate draft
Generate unique next version
Mark/persist published state
Store publication metadata
Insert outbox MenuPublished
Write audit

COMMIT
```

After commit:

```text
invalidate/version cache
publish/prewarm asynchronously
```

---

# 86. Concurrent Publishing

Two admins publishing the same store/channel concurrently must not create conflicting active versions.

Protect with:

```text
row lock
version check
unique version generation
transaction
```

---

# 87. Menu Roll Forward

For a bad publish:

```text
Version 42 good
Version 43 bad
```

Preferred source pattern:

```text
republish v42 content as v44
```

or equivalent next version.

Do not mutate historical v43 into something it was not.

---

# 88. Price Roll Forward

Bad price correction should usually:

```text
create corrected effective price record
```

rather than rewrite historical records unnecessarily.

---

# 89. Client ETag

Example:

```http
ETag: "store-001-app-v42"
```

The exact format is contract-controlled.

---

# 90. Conditional GET

Client:

```http
If-None-Match: "store-001-app-v42"
```

Server when unchanged:

```text
304 Not Modified
```

This reduces menu payload bandwidth.

---

# 91. Redis Cache Usage

Redis may cache:

```text
published menu
product summary
category list
modifier configuration
```

Authoritative state remains:

```text
PostgreSQL
```

---

# 92. Catalog Cache Keys

Source examples:

```text
catalog:menu:{store_id}:{channel}:{language}:v{version}
catalog:item:{item_id}:{language}
catalog:category:{category_id}:{language}
```

Recommended additional keys must follow the shared Redis key/version standard.

---

# 93. Cache Freshness

Primary freshness mechanism:

```text
versioned key
or explicit invalidation
```

TTL is only a safety mechanism.

---

# 94. Cache Invalidation

On successful publish:

```text
DB commit
    ↓
version increment already durable
    ↓
supersede/invalidate prior cache
    ↓
CatalogChanged / MenuPublished
```

---

# 95. Cache Stampede

For high-volume menus, potential controls:

```text
request coalescing
single-flight
short lock
stale-while-revalidate
randomized TTL
prewarming
```

Use only where measurements justify them.

---

# 96. Redis Failure

If Redis fails:

```text
read from PostgreSQL
```

when capacity permits.

Catalog should not become unavailable solely because Redis is down.

---

# 97. Published Menu Prewarm

Optional source pattern:

```text
MenuPublished
    ↓
Prewarm Redis / CDN
```

Use to reduce first-hit latency after publication.

---

# 98. Product Search

Initial search may support:

```text
product name
category
keyword
tag
```

PostgreSQL may be sufficient at modest scale.

---

# 99. Search Projection

If larger full-text scale is needed:

```text
Catalog
  ↓ event
Search Projection
  ↓
OpenSearch / Elasticsearch
```

Search remains non-authoritative.

---

# 100. Product Media

Media content belongs in:

```text
object storage / CDN
```

Catalog stores metadata:

```text
object_key
URL metadata if required
alt text
display_order
status
checksum
```

---

# 101. Product Image Model

Possible:

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

# 102. Image Publish Validation

Before image becomes public, validate as required:

```text
object exists
supported type
valid dimensions
checksum
active/approved status
```

---

# 103. Product Tags — Optional

Potential:

```text
NEW
POPULAR
VEGAN
SPICY
SEASONAL
```

Tags are metadata.

Do not use tags to replace proper domain fields.

---

# 104. Allergen Metadata — Optional

If required:

```text
MILK
NUTS
GLUTEN
EGG
```

Business/legal policy controls customer-facing claims.

---

# 105. Nutrition — Optional

Potential fields:

```text
calories
protein
fat
carbohydrate
```

Keep separate from critical ordering logic unless needed.

---

# 106. Time-Based Availability — Optional

Possible configuration:

```text
timezone
days_of_week
start_time
end_time
```

Use store-local business time.

---

# 107. Daypart — Optional

Potential values:

```text
BREAKFAST
LUNCH
DINNER
ALL_DAY
```

Only implement if product scope requires it.

---

# 108. Seasonal Availability — Optional

Potential:

```text
valid_from
valid_to
```

Use explicit date/timezone semantics.

---

# 109. Catalog Database

Logical database:

```text
catalog_db
```

Catalog Service is the only writer/owner.

Other services use contracts/events.

No cross-service direct SQL.

---

# 110. Catalog Database Tables

Possible initial tables:

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
legacy_product_mapping
inventory_availability_projection
```

---

# 111. Products Table

Concept:

```text
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

Constraint:

```text
UNIQUE(product_code)
```

---

# 112. Product Translations Table

```text
product_id
language
name
description
updated_at
```

Unique:

```text
(product_id, language)
```

---

# 113. Categories Table

Concept:

```text
id
code
status
display_order
parent_category_id
created_at
updated_at
version
```

Category translations may be separate if localization is enabled.

---

# 114. Menus Table

Concept:

```text
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

Potential uniqueness:

```text
(store_id, channel, version)
```

---

# 115. Menu Categories Table

```text
menu_id
category_id
display_order
visible
```

---

# 116. Menu Items Table

```text
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

# 117. Prices Table

```text
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

Add constraints for:

```text
non-negative amount
valid time range
scope validity
overlap behavior
```

---

# 118. Modifier Groups Table

```text
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

# 119. Modifiers Table

```text
id
modifier_group_id
code
price_delta
status
display_order
```

Localized display fields may live in translation tables.

---

# 120. Sub-Modifiers Table

Only if required:

```text
id
modifier_id
code
price_delta
status
display_order
```

---

# 121. Menu Item Modifier Groups Table

```text
menu_item_id
modifier_group_id
display_order
required_override
```

---

# 122. Catalog Versions Table

Possible:

```text
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

# 123. Product Images Table

```text
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

# 124. Outbox Events Table

Use the shared transactional outbox pattern.

Catalog events may include:

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

# 125. Optimistic Locking

Use:

```text
version
```

for mutable admin-managed aggregates such as:

```text
Product
Category
Menu draft
Modifier Group
```

Map stale update to:

```text
VERSION_CONFLICT
```

---

# 126. Menu Item Uniqueness

Business rule must decide whether one product may appear:

```text
once per menu/category
```

or:

```text
multiple times intentionally
```

Decision:

```text
MENU_ITEM_DUPLICATE_PLACEMENT_RULE = TBD_POLICY
```

---

# 127. Event Catalog

Candidate published events:

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

Events must be versioned according to Phase 03.

---

# 128. ProductUpdated Event

Prefer changed-field metadata over dumping full product state.

Example semantic content:

```text
product_id
changed_fields
```

---

# 129. PriceChanged Event

Consumers often need invalidation/context rather than full price history.

Possible content:

```text
product_id
store_id
channel
currency
```

plus event metadata.

---

# 130. MenuPublished Event

Minimum useful content:

```text
menu_id
store_id
channel
version
```

Potential consumers:

```text
cache prewarm
search projection
client synchronization
analytics
```

---

# 131. Events Consumed

Catalog should consume minimal external facts.

Possible source-supported events:

```text
StoreActivated
StoreDeactivated
ChannelChanged
InventoryAvailabilityChanged
```

only when required by chosen composition model.

---

# 132. Inventory Availability Projection — Optional

If using event projection:

```text
inventory_availability_projection
```

possible fields:

```text
store_id
product_id
availability_status
updated_at
source_version
```

This is not authoritative Inventory state.

---

# 133. Availability Staleness

When Inventory projection exists, define:

```text
maximum acceptable lag
stale-state behavior
unknown-state behavior
```

Ordering still performs authoritative final inventory validation/reservation.

---

# 134. Input Ports

Recommended:

```text
CreateProductUseCase
UpdateProductUseCase
ActivateProductUseCase
DeactivateProductUseCase

CreateCategoryUseCase
UpdateCategoryUseCase

CreateMenuUseCase
UpdateMenuUseCase
PublishMenuUseCase
UnpublishMenuUseCase

SetPriceUseCase

CreateModifierGroupUseCase
UpdateModifierGroupUseCase
AttachModifierGroupUseCase

GetPublishedMenuUseCase
GetProductUseCase
GetOrderableItemUseCase
ValidateOrderableItemUseCase
```

Only add use cases required by approved scope.

---

# 135. Output Ports

Recommended:

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
StoreReferencePort
AuditPort
ClockPort
```

---

# 136. Published Menu Query Port

Read-heavy public menu queries may use optimized projections rather than aggregate reconstruction.

Concept:

```java
public interface PublishedMenuQueryPort {

    PublishedMenuView getMenu(
        StoreId storeId,
        SalesChannel channel,
        Language language
    );
}
```

---

# 137. Orderable Item Port

Concept:

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
current base price
allowed modifiers
catalog sellability
menu version
```

---

# 138. Error Catalog

Source candidate errors:

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

Any new public error must be added to the shared error catalog.

---

# 139. HTTP Error Mapping

Source examples:

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

# 140. Admin Permissions

Source permissions:

```text
catalog.read
catalog.product.manage
catalog.price.manage
catalog.menu.manage
catalog.publish
catalog.modifier.manage
```

Do not grant publish permission automatically to every Catalog editor.

---

# 141. Public Authorization

Public published reads may require:

```text
no authenticated user
```

or gateway-level policy depending on platform decision.

But the API must expose only:

```text
published
active
customer-visible
```

data.

---

# 142. Public Data Exposure

Do not expose:

```text
draft notes
internal cost
supplier secrets
admin metadata
unpublished configuration
audit history
```

through public APIs.

---

# 143. Data Classification

Source guidance:

```text
Public:
published names/images/prices

Internal:
draft menus
internal tags/configuration

Confidential:
supplier/internal cost if stored
```

---

# 144. Publish Permission

Publishing customer-visible data is higher risk than ordinary edit.

May require:

```text
separate permission
approval
audit
MFA
```

depending on policy.

---

# 145. Catalog Audit

Audit actions:

```text
product activation/deactivation
price changes
menu publish/unpublish
modifier rule changes
category archive/deletion
manual store visibility override
```

---

# 146. Audit Fields

Possible:

```text
actor_id
action
resource_type
resource_id
old_value_summary
new_value_summary
reason where required
request_id
correlation_id
occurred_at
```

Avoid storing giant unnecessary payloads.

---

# 147. Price Change Audit

Price audit should record:

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

# 148. Catalog History

Historical explanation may require:

```text
price versions
menu versions
modifier configuration history
publication state
```

This is essential for investigating historical orders.

---

# 149. Published Menu Snapshot

Published menu can be represented as:

```text
immutable snapshot
```

or reconstructable versioned records.

Snapshot benefits:

```text
debugging
rollback
comparison
cache
```

Trade-off:

```text
additional storage
```

---

# 150. Catalog Import — Optional

Bulk import may support:

```text
CSV
Excel
external master data
```

Never publish raw import directly.

---

# 151. Bulk Import Workflow

Recommended:

```text
Upload
  ↓
Parse into staging
  ↓
Validate entire input
  ↓
Show errors
  ↓
Approve
  ↓
Apply
  ↓
Publish
```

---

# 152. Import Idempotency

Use:

```text
import_id
source checksum
```

to prevent accidental duplicate import.

---

# 153. Import Validation

Validate:

```text
duplicate product codes
unknown categories
invalid prices
invalid currency
invalid modifier references
duplicate store mapping
```

---

# 154. Catalog Export — Optional

Admin export may include:

```text
products
prices
menus
modifier rules
```

Apply authorization.

Do not leak restricted internal fields.

---

# 155. Catalog Change Workflow

Recommended:

```text
Draft
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
Cache / Search refresh
```

---

# 156. Public Read Flow

```text
Client
  ↓
GET Store Menu
  ↓
REST Adapter
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
     Cache
       ↓
     Response
```

---

# 157. Consistency Model

Strong/local consistency:

```text
product edits
price edits
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

# 158. Read-After-Write

Admin draft:

```text
read-after-write from authoritative DB
```

Public client:

```text
published version + cache semantics
```

---

# 159. Publication Consistency

Once:

```text
version 43
```

is published, all resources composing v43 must be coherent.

Never mix versions in one response.

---

# 160. Read Performance

Catalog is read-heavy.

Optimize:

```text
store menu retrieval
product detail
category listing
orderable item validation
```

---

# 161. Menu Query Strategy

Avoid N+1 queries.

Possible approaches:

```text
single optimized projection query
batched queries
materialized published snapshot
```

Measure before selecting permanent complexity.

---

# 162. Menu Payload Size

Potential controls:

```text
gzip / brotli
ETag
conditional GET
client cache
category pagination if needed
delta sync later
```

---

# 163. Delta Sync — Future

Future optimization:

```text
client version 41
server version 42
→ return delta
```

Do not implement until traffic/payload data justifies it.

---

# 164. CDN

Static media and possibly published public JSON may use CDN.

Requirement:

```text
correct versioning/invalidation
```

---

# 165. Catalog Metrics

Business metrics:

```text
products_active
menus_published
menu_publish_total
price_change_total
catalog_validation_failure_total
```

Technical metrics:

```text
menu_request_total
menu_latency
cache_hit_ratio
DB_latency
outbox_backlog
outbox_oldest_age
```

---

# 166. Catalog SLIs

Potential:

```text
published menu availability
P95 menu response latency
cache hit ratio
publish success rate
event publication lag
```

Exact SLO targets are not set by PART 10.

Keep:

```text
TBD_SLO
```

until observability policy approves them.

---

# 167. Alerts

Alert on actionable conditions such as:

```text
high menu API error rate
Catalog DB failure
Redis/cache failure when impact is material
publish failure
outbox backlog
missing active price
menu validation failure spike
event lag
```

---

# 168. Structured Logging

Safe fields:

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

Do not attach large menu/product payloads to logs.

---

# 169. Tracing

Trace:

```text
public menu request
cache lookup
DB fallback
publish
price update
orderable-item validation
outbox publication
inventory call if runtime composition is used
```

Useful span attributes:

```text
store_id
channel
menu_version
cache_hit
```

---

# 170. Catalog Dashboard

Show:

```text
request rate
menu latency
cache hit
DB query latency/count
publish count
publish failure
outbox lag
active product count
active published menu count
```

---

# 171. Runbooks

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

# 172. Incorrect Price Incident

Source recovery flow:

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
Check orders created during affected window
      ↓
Business follow-up
```

Never silently rewrite historical orders.

---

# 173. Broken Menu Incident

Preferred source recovery:

```text
republish previous known-good content
as a new version
```

Then investigate root cause.

---

# 174. Backup

Catalog backup includes:

```text
products
translations
categories
menus
prices
modifier configuration
publication/version history
outbox state as required
```

Media storage has a separate backup/retention policy.

---

# 175. Restore Verification

After restore verify:

```text
schema version
published versions
price periods
modifier relations
product/category integrity
cache rebuilt
outbox state
media references
```

---

# 176. Flyway Sequence

Source example:

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

Additional required relation/translation/sub-modifier migrations should receive new versions rather than modifying applied files.

---

# 177. Backward-Compatible Migration

Example:

```text
Add new field nullable
    ↓
Deploy code supporting null
    ↓
Backfill
    ↓
Publish new catalog version
    ↓
Enforce stronger constraint later
```

---

# 178. Product Code Migration

If legacy code changes:

```text
keep immutable product_id
store legacy mapping
introduce new product_code
```

Do not break downstream identifiers without explicit migration.

---

# 179. Legacy Product Mapping

Possible table:

```text
legacy_product_mapping
----------------------
source_system
legacy_product_id
product_id
created_at
```

Unique according to source-system mapping needs.

---

# 180. Migration Validation

Validate:

```text
product counts
category counts
price coverage
store-menu coverage
modifier relationships
duplicate codes
orphan references
invalid effective dates
```

---

# 181. Migration Reconciliation

For each store/channel compare:

```text
legacy visible menu
vs
new published menu
```

Every difference must be:

```text
expected
approved
documented
```

before cutover.

---

# 182. Testing Strategy

Required categories:

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
Authorization
Performance
Migration
```

---

# 183. Product Domain Tests

Test:

```text
valid status transitions
invalid transitions
activation requirements
unique product code behavior
archive rules
menu item cannot reference invalid product
```

---

# 184. Price Tests

Test:

```text
non-negative amount
currency required
valid dates
scope precedence
overlap detection
effective-date selection
boundary timestamp behavior
historical row preservation
```

---

# 185. Modifier Tests

Test:

```text
single-select
multi-select
required group
min/max
sub-modifier ownership
modifier attachment
price delta
invalid configuration
```

---

# 186. Publish Tests

Test:

```text
valid publish
missing price
inactive product
invalid category
invalid modifier group
invalid time range
version increment
concurrent publish
outbox event
cache invalidation
no partial published state
```

---

# 187. Localization Tests

Test:

```text
requested language
fallback language
default text
missing translation
category translation
modifier translation
```

---

# 188. REST Contract Tests

Test:

```text
menu response schema
product detail
filter whitelist
ETag
If-None-Match
304
error mapping
admin authorization
no draft/internal data in public response
```

---

# 189. Persistence Tests

Use PostgreSQL Testcontainers.

Test:

```text
unique product_code
price constraints
price overlap protection where chosen
menu version uniqueness
modifier relationships
optimistic locking
Flyway migrations
transaction rollback
```

---

# 190. Cache Tests

Test:

```text
cache hit
cache miss
versioned key
invalidation
stale key not selected as current
Redis unavailable
DB fallback
prewarm if enabled
```

---

# 191. Kafka / Outbox Tests

Test:

```text
ProductCreated
ProductUpdated
PriceChanged
MenuPublished
outbox persistence
publisher retry
event contract version
duplicate external event handling where Catalog consumes events
```

---

# 192. Inventory Composition Tests

Where runtime call is used:

```text
Inventory success
Inventory timeout
Inventory unavailable
bounded timeout
fallback behavior
```

Where projection is used:

```text
new availability event
duplicate event
out-of-order/source-version behavior
stale projection behavior
```

---

# 193. Load / Performance Tests

Scenarios:

```text
hot-store menu
hot-product detail
many concurrent menu requests
cold-cache burst
large-menu payload
publish while read traffic remains high
cache outage fallback
```

Do not hard-code final latency targets without measurement.

---

# 194. Security Review Checklist

- [ ] Public endpoint exposes only published/customer-visible fields.
- [ ] Admin endpoints require RBAC.
- [ ] Product edit and publish permissions are separated where policy requires.
- [ ] Price changes are protected.
- [ ] Publish is audited.
- [ ] Modifier rule changes are audited.
- [ ] Internal cost/supplier information is not public.
- [ ] Bulk import is validated before apply/publish.
- [ ] Object-storage upload credentials are not exposed.
- [ ] Admin request tracing/audit correlation exists.
- [ ] No direct writes to Catalog DB by other services.

---

# 195. Data Review Checklist

- [ ] Product ID is stable.
- [ ] Product code is unique.
- [ ] Table ownership is Catalog-only.
- [ ] Internal foreign keys remain inside Catalog.
- [ ] Product/version fields support concurrency.
- [ ] Price constraints are defined.
- [ ] Effective-date semantics are frozen.
- [ ] Menu publication history is preserved.
- [ ] Modifier integrity is constrained.
- [ ] Outbox exists.
- [ ] Archive/retention rules are defined.
- [ ] Legacy mappings exist where migration requires them.

---

# 196. Contract Review Checklist

- [ ] Public menu contract is stable.
- [ ] Store/channel dimensions are explicit.
- [ ] Localization behavior is explicit.
- [ ] ETag/menu_version contract is defined.
- [ ] Internal orderable-item contract is purpose-specific.
- [ ] Inventory data is not falsely represented as Catalog truth.
- [ ] Error codes are stable.
- [ ] Admin APIs are separate.
- [ ] Events are versioned.
- [ ] Persistence models are not leaked.

---

# 197. Testing Definition of Done

A Catalog feature is complete only when:

- [ ] Domain tests pass.
- [ ] Application tests pass.
- [ ] Persistence tests pass.
- [ ] REST/contract tests pass.
- [ ] Cache tests pass where applicable.
- [ ] Publish tests pass.
- [ ] Pricing tests pass.
- [ ] Modifier tests pass where applicable.
- [ ] Authorization tests pass.
- [ ] Event/outbox tests pass.
- [ ] Metrics/logging/tracing are present.
- [ ] Documentation is updated.
- [ ] DB migration is tested.

---

# 198. Production Readiness Checklist

Before production:

- [ ] All active store/channel menus validate.
- [ ] Prices reconcile with authoritative source.
- [ ] Price precedence is frozen.
- [ ] Effective-date boundary is frozen.
- [ ] Modifier rules validate.
- [ ] Public menu never exposes draft state.
- [ ] Cache fallback is tested.
- [ ] Cold-cache capacity is tested.
- [ ] Menu publish rollback/roll-forward is tested.
- [ ] Concurrent publish is tested.
- [ ] Outbox replay/recovery is tested.
- [ ] Backup/restore is tested.
- [ ] Search projection rebuild is tested if used.
- [ ] Inventory projection recovery is tested if used.
- [ ] Load test passes.
- [ ] Alerts are configured.
- [ ] Dashboards are available.
- [ ] Runbooks are available.
- [ ] Admin permissions are reviewed.
- [ ] All required `TBD_*` decisions are frozen.

---

# 199. Recommended Implementation Sequence

```text
Step 1
Bootstrap catalog-service

Step 2
Create catalog_db and Flyway baseline

Step 3
Implement Product aggregate/status/invariants

Step 4
Implement Product persistence + unique product code

Step 5
Implement Categories

Step 6
Implement Product/Category localization

Step 7
Implement Menu + Store/Channel scope

Step 8
Implement Menu Item placement / visibility / sellability

Step 9
Implement Price domain + effective dating + precedence

Step 10
Implement public published-menu query

Step 11
Implement ETag / menu_version / conditional GET

Step 12
Implement Redis published-menu cache

Step 13
Implement Modifier Groups / Modifiers if required by current products

Step 14
Implement OrderableItemSnapshot / validation contract

Step 15
Implement Draft validation + atomic publish/versioning

Step 16
Implement Catalog outbox and events

Step 17
Implement Admin APIs + RBAC + audit

Step 18
Implement media if initial scope requires it

Step 19
Implement Inventory availability composition/projection if required for menu response

Step 20
Implement Search projection only if required

Step 21
Implement legacy import/migration if required

Step 22
Complete tests

Step 23
Complete observability/dashboard/alerts/runbooks

Step 24
Backup/restore/publish recovery acceptance

Step 25
Docker/local full-flow acceptance

Step 26
Phase completion review and handoff to Inventory
```

---

# 200. Step 1 — Bootstrap Acceptance

Before business logic:

```text
service starts
Actuator health works
catalog_db connection works
Flyway starts
security config loads
test profile works
PostgreSQL Testcontainer works
ArchUnit test runs
Docker image builds
Redis local dependency reachable where enabled
```

---

# 201. Step 2 — Database Acceptance

Verify:

```text
Catalog owns only catalog_db
core migrations apply from zero
constraints exist
product_code uniqueness exists
version columns exist where required
outbox table exists
no direct dependency on Customer/Identity DB
```

---

# 202. Step 3 — Product Acceptance

Verify:

```text
create DRAFT product
product_id immutable
product_code unique
activate valid product
reject invalid activation
deactivate
archive
archived reactivation follows approved policy
outbox/audit written where required
```

---

# 203. Step 4 — Localization Acceptance

Verify:

```text
requested translation returned
fallback works
default text works
duplicate language row rejected
missing translation publish behavior follows policy
```

---

# 204. Step 5 — Category Acceptance

Verify:

```text
create category
unique code
stable ordering
parent rule if enabled
cycle rejected
invalid archived parent rejected
```

---

# 205. Step 6 — Menu Acceptance

Verify:

```text
create store/channel menu
draft not publicly visible
add category
add item
visible/sellable distinction works
wrong store/channel does not leak
```

---

# 206. Step 7 — Price Acceptance

Verify:

```text
create default price
create scoped price if enabled
amount exact
negative rejected
currency validated
effective-date selection correct
overlap rejected per policy
precedence deterministic
PriceChanged outbox created
audit exists
```

---

# 207. Step 8 — Public Menu Acceptance

Verify:

```text
published menu loads
draft menu does not
store/channel correct
language correct
category order stable
item order stable
active base price selected
menu_version returned
```

---

# 208. Step 9 — Client Cache Acceptance

Verify:

```text
ETag returned
If-None-Match accepted
304 returned when unchanged
new publish changes version/ETag
client cannot receive mixed menu versions
```

---

# 209. Step 10 — Redis Acceptance

Verify:

```text
cache miss → PostgreSQL
cache hit → response
versioned key
publish supersedes old version
Redis outage → DB fallback
cold-cache load within tested capacity
```

---

# 210. Step 11 — Modifier Acceptance

If modifiers in scope:

```text
single select
multiple select
required group
min/max
attachment to menu item
price delta
invalid configuration rejected
nested option ownership correct
```

---

# 211. Step 12 — Orderable Item Acceptance

Verify:

```text
active product in published menu returns
wrong store rejected
wrong channel rejected
inactive product rejected
non-sellable item rejected
price current
modifier rules current
menu version returned
persistence table structure not exposed
```

---

# 212. Step 13 — Publication Acceptance

Verify:

```text
invalid draft rejected
valid draft publishes
version increments exactly once
concurrent publish safe
published state coherent
outbox MenuPublished saved
audit saved
cache invalidated/superseded after commit
```

---

# 213. Step 14 — Publish Recovery Acceptance

Verify:

```text
known-good version identifiable
bad version can be replaced by new version using prior content
historical versions preserved
cache moves to corrected version
clients refresh
orders created during bad-price window can be identified
```

---

# 214. Step 15 — Authorization Acceptance

Verify:

```text
public can read only approved published data
editor can edit only permitted resources
price manage permission enforced
publish permission enforced
modifier permission enforced
unauthorized admin denied
sensitive actions audited
```

---

# 215. Step 16 — Inventory Boundary Acceptance

Verify:

```text
Catalog does not own stock quantity
Inventory availability is clearly separate
menu response composition follows chosen pattern
projection is marked non-authoritative if used
Ordering still performs authoritative final inventory validation
```

---

# 216. Step 17 — Failure Acceptance

Exercise:

```text
PostgreSQL unavailable
Redis unavailable
Kafka unavailable
Inventory unavailable if runtime call used
object storage unavailable if media used
duplicate event
publish conflict
price conflict
```

All behavior must be safe and observable.

---

# 217. Step 18 — Observability Acceptance

Verify:

```text
menu request metrics
cache metrics
publish metrics
DB metrics
outbox metrics
traces
structured logs
dashboard
alerts
correlation IDs
no large payloads in telemetry
```

---

# 218. Step 19 — Backup / Restore Acceptance

Verify:

```text
restore succeeds
published menu versions valid
price periods valid
modifier relations valid
outbox state understood
cache rebuild works
media references valid
public menu functions after restore
```

---

# 219. Step 20 — Legacy Migration Acceptance

If required:

```text
legacy IDs mapped
counts reconciled
prices reconciled
all store/channel menus compared
modifier relations compared
orphans rejected
unexpected differences documented and resolved
```

---

# 220. Recommended Phase 6 Work Breakdown

Suggested implementation tickets:

```text
CAT-001 Bootstrap catalog-service
CAT-002 Create catalog_db / Flyway baseline
CAT-003 Implement Product aggregate
CAT-004 Implement ProductStatus lifecycle
CAT-005 Implement Product persistence
CAT-006 Implement product-code uniqueness
CAT-007 Implement Product translations
CAT-008 Implement Category model
CAT-009 Implement Category persistence/hierarchy rules
CAT-010 Implement Menu model
CAT-011 Implement Store/Channel menu scope
CAT-012 Implement Menu Category placement
CAT-013 Implement Menu Item model
CAT-014 Implement visibility/sellability
CAT-015 Implement Price model
CAT-016 Implement price effective dating
CAT-017 Implement price precedence
CAT-018 Implement price overlap protection
CAT-019 Implement public Store Menu query
CAT-020 Implement ETag / conditional GET
CAT-021 Implement Redis cache adapter
CAT-022 Implement cache invalidation/versioning
CAT-023 Implement ModifierGroup
CAT-024 Implement Modifier
CAT-025 Implement SubModifier if required
CAT-026 Implement MenuItem modifier attachment
CAT-027 Implement modifier validation
CAT-028 Implement GetOrderableItem contract
CAT-029 Implement publish validation
CAT-030 Implement atomic publish/versioning
CAT-031 Implement concurrent publish protection
CAT-032 Implement Catalog transactional outbox
CAT-033 Implement Catalog events
CAT-034 Implement admin Product APIs
CAT-035 Implement admin Price APIs
CAT-036 Implement admin Menu APIs
CAT-037 Implement Catalog RBAC
CAT-038 Implement Catalog audit
CAT-039 Implement media integration if required
CAT-040 Implement Inventory availability composition/projection if required
CAT-041 Implement search projection if required
CAT-042 Implement legacy mapping/import if required
CAT-043 Implement Product tests
CAT-044 Implement Price tests
CAT-045 Implement Modifier tests
CAT-046 Implement Publish tests
CAT-047 Implement REST/contract tests
CAT-048 Implement PostgreSQL integration tests
CAT-049 Implement Redis tests
CAT-050 Implement Kafka/outbox tests
CAT-051 Implement authorization tests
CAT-052 Implement performance tests
CAT-053 Implement observability
CAT-054 Implement alerts/dashboard
CAT-055 Write runbooks
CAT-056 Backup/restore/recovery test
CAT-057 Docker/local acceptance
CAT-058 Complete ADRs/policy freeze
CAT-059 Phase 6 exit review
```

---

# 221. Minimum Viable Catalog Service

Source-defined first production-capable version:

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

Modifiers should be included early when current products require them.

---

# 222. Recommended Initial Scope

Recommended required now:

```text
Product
Product translation
Category
Store/channel menu
Menu items
Base price
Product status
Draft/publish/version
Public menu API
ETag / version
Redis cache
Orderable item validation
Outbox/events
Admin RBAC
Price/publish audit
Testing/observability
```

Conditional now:

```text
Modifiers
Sub-modifiers
Product media
Inventory availability projection
Search engine
Time/daypart
Bulk import
Legacy migration
```

Do not block Phase 07 for optional catalog features unless current Inventory/Ordering behavior depends on them.

---

# 223. Out of Initial Scope Unless Approved

```text
Bundles
Complex combos
Advanced merchandising
Nutritional catalog
Allergen catalog
Regional pricing
Advanced search engine
Delta sync
Complex approval workflow
Daypart scheduling
Multi-level modifier trees
Automated catalog recommendation
```

---

# 224. Phase 6 Policy Freeze Checklist

Before production resolve required items:

- [ ] Product ID strategy.
- [ ] Product code format/case rules.
- [ ] Product types.
- [ ] Product status rules.
- [ ] Archive/reactivation rule.
- [ ] Supported languages.
- [ ] Default/fallback language.
- [ ] Missing translation publish rule.
- [ ] Category hierarchy scope/depth.
- [ ] Canonical channel codes.
- [ ] Store source of truth.
- [ ] Store validation mechanism.
- [ ] Menu scope.
- [ ] Menu version scope.
- [ ] Draft/published strategy.
- [ ] Atomic publish mechanism.
- [ ] Menu item duplicate placement rule.
- [ ] Supported currencies.
- [ ] Money precision/rounding.
- [ ] Store-specific pricing scope.
- [ ] Channel-specific pricing scope.
- [ ] Price precedence.
- [ ] Price valid-from/to boundary.
- [ ] Price overlap rule.
- [ ] Modifier scope.
- [ ] Sub-modifier scope/depth.
- [ ] Inventory composition mode.
- [ ] Projection lag rule if used.
- [ ] Cache TTLs.
- [ ] Cache invalidation/prewarm policy.
- [ ] ETag / Cache-Control policy.
- [ ] Public auth policy.
- [ ] Admin permissions.
- [ ] Publish approval/MFA rule.
- [ ] Media scope.
- [ ] Search scope.
- [ ] Time/daypart scope.
- [ ] Legacy migration scope.
- [ ] Audit retention.
- [ ] SLO targets.
- [ ] Alert thresholds.

Until required decisions are approved:

```text
Phase 6 may proceed in local/DEV,
but production catalog behavior is not fully frozen.
```

---

# 225. Phase 6 Completion Tree

```text
PHASE 06 — CATALOG SERVICE

├── Service Foundation                         ✅
│   ├── Spring Boot
│   ├── Health
│   ├── Docker
│   └── Architecture rules
│
├── Product Domain                             ✅
│   ├── Product
│   ├── ProductStatus
│   ├── ProductCode
│   └── Localization
│
├── Category Domain                            ✅
│
├── Menu Domain                                ✅
│   ├── Store / Channel
│   ├── Menu Items
│   ├── Visibility
│   ├── Sellability
│   ├── Draft
│   └── Published Version
│
├── Pricing                                    ✅
│   ├── Exact Money
│   ├── Effective Dating
│   ├── Scope Precedence
│   └── Historical Preservation
│
├── Modifiers                                  ✅ / Conditional
│
├── Persistence                                ✅
│   ├── catalog_db
│   ├── Flyway
│   ├── Constraints
│   ├── Optimistic Locking
│   └── Outbox
│
├── Public API                                 ✅
│   ├── Store Menu
│   ├── Product
│   ├── Categories
│   ├── ETag
│   └── 304
│
├── Internal Contracts                         ✅
│   └── OrderableItemSnapshot
│
├── Publication                               ✅
│   ├── Validation
│   ├── Atomicity
│   ├── Version
│   ├── Audit
│   └── Recovery
│
├── Cache                                      ✅
│   ├── Versioned Keys
│   ├── Invalidation
│   ├── DB Fallback
│   └── Stampede Controls if needed
│
├── Inventory Boundary                         ✅
├── Security / RBAC                            ✅
├── Testing                                    ✅
├── Observability                              ✅
├── Backup / Restore                           ✅
├── Runbooks                                   ✅
└── Documentation / ADRs                       ✅
```

---

# 226. Exit Criteria

Phase 6 is complete when the team can answer and prove:

## Product Ownership

```text
What exactly belongs to Catalog?
What does not belong to Catalog?
```

## Inventory Boundary

```text
Which availability is Catalog metadata?
Which availability is authoritative Inventory state?
```

## Menu

```text
How is a store/channel menu represented?
How does draft differ from published state?
```

## Publication

```text
How is partial publication prevented?
What creates the next version?
How is concurrent publish protected?
```

## Pricing

```text
How is the current base price selected?
What is the scope precedence?
What are the time-boundary semantics?
How is historical pricing preserved?
```

## Modifiers

```text
How are required/optional/min/max rules represented and validated?
How does Ordering know a selected modifier is valid?
```

## Ordering Contract

```text
What exact OrderableItemSnapshot is returned?
What does Ordering persist permanently?
```

## Client Versioning

```text
How does the mobile/web client know a menu changed?
How do ETag and menu_version interact?
```

## Cache

```text
How is Redis used without becoming authoritative?
What happens if Redis disappears?
```

## Recovery

```text
How is a bad price corrected?
How is a bad menu publish corrected?
How is the previous known-good state identified?
```

## Events

```text
Which Catalog events are emitted?
Which external events are consumed?
Are event contracts versioned?
```

## Operations

```text
Can operators detect:
menu API failure
publish failure
missing price
outbox backlog
cache failure
bad modifier configuration
```

If these answers are implemented, tested, observable, and documented, Phase 6 is ready to close.

---

# 227. Handoff to Phase 7

After Catalog is complete, move to:

```text
PHASE 07 — Inventory Service
```

The boundary is:

```text
Catalog
    owns:
        product definition
        menu presentation
        store/channel catalog configuration
        base price
        modifier rules
        catalog sellability

Inventory
    owns:
        stock item
        stock level
        availability from stock
        reservation
        release
        deduction
        adjustment
        reservation expiry
        inventory concurrency
```

Catalog may reference Inventory availability through an approved contract/projection.

Catalog must not:

```text
write inventory_db
own stock quantity
reserve inventory
deduct inventory
```

Inventory must not redefine:

```text
product name
base price
menu placement
modifier rules
```

---

# 228. Final Phase 6 Principle

The core rule is:

```text
Catalog tells the platform what may be sold and how it is configured.

Inventory tells the platform whether it can be fulfilled right now.

Ordering preserves what was actually sold.
```

And the most important implementation rules are:

```text
stable product identity
unique product code
separate Product from Menu Item
explicit store/channel scope
exact deterministic base pricing
historical price preservation
strong modifier validation
atomic coherent publishing
versioned public menus
Redis as disposable acceleration
purpose-specific Ordering contract
transactional outbox
strict admin authorization
auditable price/publish changes
no direct cross-service database access
```

---

**End of PHASE 06 — Catalog Service**
