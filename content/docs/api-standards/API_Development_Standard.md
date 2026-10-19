---
title: "API Development Standard"
description: "Minimum engineering standards for building, maintaining, securing, and testing production APIs."
---

# API Development Standard

This document defines the minimum development standards for building and maintaining APIs.

## 1. API Structure and Coding Standards

- Use clear and consistent endpoint naming.
- Follow a standard project and folder structure.
- Follow one coding style across the project.
- Keep code clean and readable.
- Use meaningful variable, function, and class names.
- Keep functions small and focused on one responsibility.
- Avoid duplicated code.
- Avoid unnecessary nested conditions.
- Remove unused or dead code.
- Do not keep commented-out old code.
- Use constants or configuration instead of hard-coded values.
- Reuse helper or service functions where appropriate.
- Add comments only where logic needs explanation.
- Add PHPDoc, JSDoc, or docblocks for important functions and classes.
- Use consistent handling for date/time, currency, boolean, and IDs.

## 2. Request Validation

Every endpoint that receives input must validate it.

Validate:

- Required fields
- Data types
- Empty and null values
- Minimum and maximum length
- Numeric ranges
- Allowed enum values
- Date formats
- Email and phone formats where applicable
- Currency formats
- UUID or ID formats
- Array and object structure
- File type and file size for uploads
- Invalid characters where relevant
- Unknown or unexpected fields if strict payloads are required

Never trust frontend or client input.

## 3. Input Sanitization and Normalization

Before business logic:

- Trim strings.
- Normalize case where appropriate.
- Convert numbers safely.
- Normalize booleans.
- Normalize dates and time zones.
- Sanitize filenames.
- Never directly concatenate user input into SQL.
- Never execute raw client input.

Example:

```php
$userId = trim((string) $requestData['user_id']);
$status = strtoupper(trim((string) $requestData['status']));
$amount = (float) $requestData['amount'];
```

## 4. Authentication

Protected APIs must verify:

- Access token, API key, or session
- Token expiration
- Token signature
- Correct issuer and audience where applicable
- User or service identity

Never allow protected endpoints without authentication.

## 5. Authorization

Authentication answers:

> Who are you?

Authorization answers:

> Are you allowed to do this?

Check:

- Role
- Permission
- Resource ownership
- Service permission
- Admin-only operations

Examples:

- Customer cannot call admin reward configuration APIs.
- Store user cannot modify another store's configuration.

## 6. Security

Every API should consider:

- SQL injection
- XSS
- CSRF where applicable
- Command injection
- Path traversal
- SSRF
- Unsafe file uploads
- Broken access control
- Sensitive data exposure
- Brute-force attacks
- Replay attacks where relevant

Also:

- Use HTTPS.
- Hash passwords properly.
- Never store passwords in plain text.
- Never expose secrets.
- Never expose database credentials.
- Store API keys in environment variables or secret management.
- Mask sensitive values in logs.

## 7. Database Statements

Database code should use:

- Prepared statements
- Parameter binding
- Transactions where multiple writes must succeed together
- Correct indexes
- Explicit columns

Good:

```sql
SELECT id, user_id, status
FROM campaign_progress
WHERE campaign_code = ?
AND user_id = ?
```

Avoid:

```sql
SELECT *
```

Never:

```php
$sql = "SELECT * FROM users WHERE id = '$userId'";
```

## 8. Database Transaction Handling

Use transactions when operations depend on each other.

Example:

```text
BEGIN

Create reward
Update quantity
Update user progress
Insert reward log

COMMIT
```

If anything fails:

```text
ROLLBACK
```

Especially important for:

- Payments
- Rewards
- Points
- Coupons
- Inventory
- Campaign progress
- Wallet balances

## 9. Concurrency Protection

For critical operations, prevent two requests from modifying the same resource incorrectly.

Consider:

- `SELECT ... FOR UPDATE`
- Atomic updates
- Unique constraints
- Optimistic locking
- Distributed locks where required

Example:

Two requests must not assign the final prize at the same time.

## 10. Duplicate Request and Idempotency Protection

APIs processing transactions should protect against duplicates.

Examples:

- `transaction_id`
- `order_no`
- `payment_reference`
- `idempotency_key`

Before processing:

```text
Has transaction ABC123 already been processed?
```

If yes, safely return the existing result rather than applying it twice.

## 11. Logging

Every important API should have logs.

Log:

- Request ID
- Endpoint
- Timestamp
- User or service ID
- Transaction ID
- Campaign, order, or reference ID
- Action
- Result
- Error code
- Error details
- Processing duration where useful

Example:

```text
request_id: req_abc123
endpoint: /api/v1/rewards/claim
user_id: 92831
campaign_code: STAMP2026
action: REWARD_CLAIM
status: FAILED
reason: PRIZE_OUT_OF_STOCK
```

Never log:

- Passwords
- Access tokens
- Refresh tokens
- Credit card numbers
- Private keys
- Secrets

## 12. Audit Logs

Normal application logs and audit logs are different.

Audit logs should record important business changes:

- Who changed it?
- What changed?
- Old value?
- New value?
- When?
- Why?

Example:

```text
Admin: 123
Action: CAMPAIGN_UPDATE

Before:
minimum_order_value = 5

After:
minimum_order_value = 10
```

Especially useful for:

- Campaigns
- Rewards
- Coupons
- Points
- Permissions
- Financial settings
- Admin configuration

## 13. Error Handling

Never return raw system or database errors to clients.

Bad:

```json
{
  "error": "SQLSTATE[23000]: Integrity constraint violation..."
}
```

Better:

```json
{
  "success": false,
  "code": "REWARD_ASSIGNMENT_FAILED",
  "message": "Unable to assign reward.",
  "request_id": "req_abc123"
}
```

Keep technical details in internal logs.

## 14. Standard API Response Format

Success:

```json
{
  "success": true,
  "message": "Reward assigned successfully.",
  "data": {
    "reward_id": 123
  }
}
```

Failure:

```json
{
  "success": false,
  "code": "INVALID_REQUEST",
  "message": "campaign_code is required.",
  "data": null
}
```

## 15. Correct HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `204` | Success, no content |
| `400` | Invalid request |
| `401` | Not authenticated |
| `403` | Not allowed |
| `404` | Resource not found |
| `409` | Conflict / duplicate |
| `422` | Validation error |
| `429` | Too many requests |
| `500` | Internal server error |
| `502/503` | Upstream or service unavailable |

## 16. Business-Rule Validation

Do not only validate request format. Validate business rules too.

Example for a campaign:

- Campaign exists.
- Campaign is active.
- Current date is within campaign dates.
- User is eligible.
- Store is eligible.
- Sale channel is allowed.
- Minimum order value is reached.
- Currency is correct.
- Transaction is not refunded.
- Transaction is not duplicate.
- Reward stock is available.
- User has not exceeded reward limits.

## 17. Comments

Comments should explain **why**, not obvious code.

Bad:

```php
// Set user id
$userId = $requestData['user_id'];
```

Better:

```php
// Lock progress because reward assignment and progress reset
// must not be processed concurrently.
$progress = estamp_get_user_progress(
    $table,
    $campaignCode,
    $userId,
    true
);
```

## 18. Function Documentation

Important functions should explain:

- Purpose
- Parameters
- Return value
- Exceptions or errors
- Important business behavior

Example:

```php
/**
 * Assign a campaign reward to a qualified user.
 *
 * Ensures the reward has remaining inventory and prevents
 * duplicate assignment for the same campaign milestone.
 *
 * @param DbTable $rewardTable
 * @param string $campaignCode
 * @param string $userId
 *
 * @return array|null
 */
```

## 19. Configuration Management

Do not hard-code:

```php
$apiUrl = "https://production.example.com";
$password = "abc123";
```

Use:

- `.env`
- Environment configuration
- Secret manager
- Config files

Separate:

- Development
- Staging
- Production

## 20. API Versioning

Public and internal APIs should have a version strategy.

Example:

```text
/api/v1/campaigns
/api/v1/rewards
```

Breaking changes should normally use a new version:

```text
/api/v2/...
```

## 21. Rate Limiting

Protect APIs against excessive calls.

Example:

```text
Login:
10 requests/minute

Public API:
100 requests/minute

Internal API:
based on service requirements
```

## 22. Pagination

Large lists must support pagination.

Example:

```text
GET /campaigns?page=1&page_size=25
```

Response:

```json
{
  "items": [],
  "page": 1,
  "page_size": 25,
  "total": 172
}
```

Never return very large record sets unnecessarily.

## 23. Filtering, Sorting, and Searching

Use controlled inputs such as:

```text
?page=1
&page_size=25
&status=ACTIVE
&q=coffee
&sort=created_at
&direction=desc
```

Whitelist sortable and filterable columns instead of trusting request column names directly.

## 24. Performance

Developers should check:

- Avoid N+1 queries.
- Avoid unnecessary database calls.
- Use indexes.
- Avoid loading unnecessary columns.
- Use pagination.
- Cache suitable data.
- Avoid repeated external API calls.
- Set external API timeouts.
- Measure and review slow queries.

## 25. External API Handling

When calling another service:

- Set connection timeout.
- Set request timeout.
- Validate the response.
- Check HTTP status.
- Handle invalid JSON.
- Handle network failures.
- Log failures.
- Retry only when safe.
- Prevent duplicate processing.
- Never retry non-idempotent operations blindly.

## 26. Request Tracing

Generate a request ID:

```text
request_id = req_01HXYZ...
```

Pass it between services:

```text
Mobile App
    ↓
Central API
    ↓
Campaign Service
    ↓
Reward Service
```

All logs can then be searched using one request ID.

## 27. Testing

Every important API should include:

- Happy-path test
- Validation tests
- Authentication test
- Authorization test
- Invalid-data test
- Duplicate test
- Not-found test
- Business-rule test
- Database failure test where appropriate
- External service failure test
- Edge-case tests

Critical calculations should also have unit tests.

## 28. API Documentation

Every API needs documentation containing:

- Endpoint
- Method
- Description
- Authentication
- Headers
- Request body
- Field descriptions
- Validation rules
- Success response
- Error responses
- Business rules
- Example request
- Example response

OpenAPI or Swagger is recommended.

## 29. Database Schema Rules

Tables should generally have:

- Primary key
- Appropriate foreign keys
- Indexes
- `created_at`
- `updated_at`
- Correct data types
- Unique constraints where needed
- Clear column names

Do not use `VARCHAR(255)` for everything without considering the actual data.

## 30. Data Integrity

Use the database to help enforce rules.

Examples:

```sql
UNIQUE(transaction_id)
UNIQUE(campaign_code, user_id, milestone_id)
```

Application checks alone are not always enough because simultaneous requests can bypass them.

## 31. Date and Timezone Handling

Have one clear standard.

Prefer storing timestamps consistently, commonly UTC:

```text
2026-10-15 05:30:00 UTC
```

Convert to the user's or local timezone only where appropriate.

Clearly define:

- Campaign start date
- Campaign end date
- Expiration date
- Inclusive and exclusive date boundaries

## 32. Money Handling

Avoid floating-point calculations for sensitive financial values where precision matters.

Prefer:

- Integer cents
- Fixed-point or `DECIMAL` database types

Example:

```text
$10.25 = 1025 cents
```

or:

```sql
DECIMAL(12,2)
```

Always validate currency.

## 33. Status and Enum Standards

Avoid random status strings throughout the code.

Define accepted values centrally:

```text
IN_PROGRESS
COMPLETED
EXPIRED
REDEEMED
CANCELLED
```

Reject invalid statuses.

## 34. Soft Delete and Historical Records

Important business records should often not be physically deleted.

Consider:

```text
deleted_at
is_active
status
```

Especially for:

- Transactions
- Rewards
- Campaign history
- Audit history

## 35. Monitoring and Alerts

Production APIs should monitor:

- Error rate
- Response time
- CPU and memory where relevant
- Database connection failures
- Queue failures
- External API failures
- HTTP 5xx increases

Critical failures should trigger alerts.

## 36. Health-Check Endpoints

Services should expose something like:

```text
GET /health
```

Example:

```json
{
  "status": "healthy",
  "database": "healthy",
  "service": "campaign-api"
}
```

Do not expose sensitive infrastructure details publicly.

## 37. Git and Source-Control Rules

Developers should:

- Create feature branches.
- Use meaningful commit messages.
- Never commit `.env`.
- Never commit credentials.
- Never commit production database exports.
- Never commit temporary or debug files.
- Review code before merge.

Good commit:

```text
feat: add campaign reward expiration handling
```

Avoid:

```text
update code
```

## 38. Pull Request and Code Review Checklist

Before merging:

```text
☐ Code is readable
☐ No duplicate logic
☐ Validation exists
☐ Authentication checked
☐ Authorization checked
☐ SQL uses parameters
☐ Transaction used where required
☐ Duplicate processing protected
☐ Errors handled
☐ Logs added
☐ Sensitive information not logged
☐ Business rules verified
☐ Tests added
☐ API documentation updated
☐ No debug code
☐ No credentials
☐ Performance considered
```

## 39. No Debug Code in Production

Remove uncontrolled debug statements such as:

```php
var_dump();
print_r();
die();
exit();
dd();
```

Also remove unnecessary:

```javascript
console.log();
```

Use proper logging instead.

## 40. Deployment Readiness

Before production:

```text
☐ Environment configuration is correct
☐ Database migration reviewed
☐ Migration rollback considered
☐ Secrets configured
☐ Logging enabled
☐ Monitoring enabled
☐ API documentation updated
☐ Tests passing
☐ Backup considered
☐ Rollback plan available
```

# Minimum Mandatory API Rules

Every API project must follow at least these rules:

1. Clean and readable code
2. Standard project structure
3. Request validation
4. Input normalization and sanitization
5. Authentication
6. Authorization
7. Prepared SQL statements
8. Database transactions for related writes
9. Concurrency protection where necessary
10. Duplicate and idempotency protection
11. Application logging
12. Audit logging for important changes
13. Standard error handling
14. Standard API response format
15. Correct HTTP status codes
16. Business-rule validation
17. Useful comments and function documentation
18. No hard-coded credentials or environment configuration
19. API versioning
20. Rate limiting
21. Pagination for list endpoints
22. Safe filtering, searching, and sorting
23. Performance optimization
24. External API timeout and error handling
25. Request ID or trace ID
26. Automated testing
27. Swagger or API documentation
28. Proper database constraints and indexes
29. Data integrity protection
30. Standard date and time handling
31. Correct money and decimal handling
32. Standard enums and statuses
33. Historical and audit data preservation
34. Monitoring and alerts
35. Health checks
36. Git standards
37. Mandatory code review
38. No debug code in production
39. No secrets or sensitive data in logs or source code
40. Production deployment checklist

## Critical Rules for Transactional APIs

For APIs involving payments, loyalty points, rewards, coupons, campaigns, orders, inventory, or balances, the following are mandatory:

- Logging
- Database transactions
- Duplicate protection
- Concurrency protection
- Audit history
- Request validation
- Business-rule validation
- Data integrity constraints
- Error handling
- Request tracing
