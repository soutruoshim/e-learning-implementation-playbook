---
title: "Social Media Platform — Zero to Production Guide"
description: "End-to-end architecture, user journeys, data models, and delivery playbook for a modern social media platform."
---

# Social Media Platform — Zero to Production Documentation Guide

## 1. Project Overview

Start by explaining **what you are building and why**.

```text
Project Name:
Social Media Platform

Purpose:
Build a scalable social media platform where users can:
- Register and login
- Create profiles
- Follow/unfollow users
- Create posts
- Upload images/videos
- Like posts
- Comment on posts
- Share posts
- Search users/posts/hashtags
- Receive notifications
- View a personalized feed

Target Platforms:
- Web
- iOS
- Android

Initial Target:
100,000 users

Future Target:
1,000,000+ users
```

Also define what is **not included** in V1.

```text
Out of Scope V1:
- Live streaming
- Video calling
- Marketplace
- Advertising platform
- Creator monetization
```

---

## 2. Functional Requirements

Document exactly what the system must do.

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | User can register | High |
| FR-002 | User can login | High |
| FR-003 | User can update profile | High |
| FR-004 | User can follow another user | High |
| FR-005 | User can create post | High |
| FR-006 | User can upload images | High |
| FR-007 | User can like a post | High |
| FR-008 | User can comment | High |
| FR-009 | User can view feed | High |
| FR-010 | User receives notifications | High |
| FR-011 | User can search users | Medium |
| FR-012 | User can search hashtags | Medium |

Example detailed requirement:

```text
FR-007 Like Post

Actor:
Authenticated User

Preconditions:
- User is logged in
- Post exists

Flow:
1. User clicks Like.
2. Client sends POST /posts/{postId}/likes.
3. API Gateway validates authentication.
4. Request goes to Post Service.
5. Post Service checks duplicate like.
6. Like is stored.
7. Like count is updated.
8. Notification event is published.
9. Notification Service notifies post owner.

Result:
Post displays updated like count.
```

---

## 3. Non-Functional Requirements

```text
NFR-001
API response time should normally be < 300ms.

NFR-002
System availability target: 99.9%.

NFR-003
System should support horizontal scaling.

NFR-004
Passwords must never be stored as plain text.

NFR-005
All public communication must use HTTPS.

NFR-006
API endpoints must use rate limiting.

NFR-007
Database backups must run automatically.

NFR-008
Production logs must be centralized.

NFR-009
Services must expose health-check endpoints.

NFR-010
System should tolerate failure of individual application instances.
```

---

## 4. Capacity Estimation

Estimate expected usage before selecting infrastructure.

```text
Registered users:
100,000

Daily active users:
20,000

Average posts/user/day:
2

Posts/day:
40,000

Likes/day:
500,000

Comments/day:
100,000

Image uploads/day:
60,000

Average image:
2 MB

Storage/day:
~120 GB
```

Also estimate:

```text
- Normal requests/sec
- Peak requests/sec
- Storage growth/month
- Database growth/month
- Bandwidth
- Notification volume
```

---

## 5. High-Level Architecture

```text
                    Clients
                       |
                       v
                Load Balancer
                       |
                       v
                  API Gateway
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
 User Service     Post Service    Media Service
        |              |              |
        |              |              v
        |              |             S3
        |              |
        v              v
   PostgreSQL      PostgreSQL

        +----------------------------+
        |
        v
     RabbitMQ / Kafka
        |
   +----+---------+
   |              |
   v              v
Notification    Feed Service
Service

        |
        v
      Redis
```

Explain why each component exists.

```text
Redis
Purpose:
- Cache feeds
- Session/token data
- Rate limiting
- Frequently requested objects

RabbitMQ
Purpose:
- Notification jobs
- Feed generation
- Image processing
- Background jobs

S3
Purpose:
- User images
- Post images
- Videos
```

---

## 6. Service Boundaries

Define exactly what each service owns.

| Service | Responsibility |
|---|---|
| Auth Service | Authentication, tokens |
| User Service | Profile/account data |
| Social Graph Service | Follow/unfollow relationships |
| Post Service | Posts, comments, likes |
| Feed Service | User feed generation |
| Media Service | Images/video |
| Notification Service | Push/in-app notifications |
| Search Service | User/post/hashtag search |

### User Service

```text
Responsibilities:
- User registration
- Profile management
- Account status

Owns:
users
user_profiles

Does NOT own:
posts
followers
notifications
```

### Post Service

```text
Responsibilities:
- Create post
- Edit post
- Delete post
- Like
- Comment

Owns:
posts
post_likes
comments
```

### Social Graph Service

```text
Responsibilities:
- Follow
- Unfollow
- Followers list
- Following list

Owns:
user_followers
```

---

## 7. Database Ownership

| Table | Owner |
|---|---|
| users | User Service |
| user_profiles | User Service |
| followers | Social Graph Service |
| posts | Post Service |
| comments | Post Service |
| post_likes | Post Service |
| media | Media Service |
| notifications | Notification Service |

Rule:

```text
Only the owning service may directly WRITE to its tables.
```

Other services should communicate through:

```text
- REST API
- gRPC
- Message/Event
```

---

## 8. Database Design

### posts

```text
posts
--------------------------------
id              BIGINT PK
user_id         BIGINT
content         TEXT
visibility      VARCHAR
status          VARCHAR
created_at      DATETIME
updated_at      DATETIME
```

### post_likes

```text
post_likes
--------------------------------
id              BIGINT PK
post_id         BIGINT
user_id         BIGINT
created_at      DATETIME

UNIQUE(post_id, user_id)
```

### followers

```text
followers
--------------------------------
follower_id
following_id
created_at

PRIMARY KEY (
    follower_id,
    following_id
)
```

Also create an ERD.

---

## 9. API Specifications

### Authentication

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### User

```text
GET    /api/v1/users/{id}
PATCH  /api/v1/users/{id}
GET    /api/v1/users/{id}/followers
GET    /api/v1/users/{id}/following
POST   /api/v1/users/{id}/follow
DELETE /api/v1/users/{id}/follow
```

### Posts

```text
GET    /api/v1/posts/{id}
POST   /api/v1/posts
PATCH  /api/v1/posts/{id}
DELETE /api/v1/posts/{id}

POST   /api/v1/posts/{id}/likes
DELETE /api/v1/posts/{id}/likes

POST   /api/v1/posts/{id}/comments
GET    /api/v1/posts/{id}/comments
```

### Feed

```text
GET /api/v1/feed
```

Document for every endpoint:

```text
- Method
- URL
- Authentication
- Request body
- Validation
- Success response
- Error responses
- Permissions
- Rate limit
```

Example:

```json
POST /api/v1/posts

{
  "content": "Hello World",
  "media_ids": [
    "med_123"
  ],
  "visibility": "PUBLIC"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "post_123",
    "content": "Hello World",
    "like_count": 0,
    "comment_count": 0,
    "created_at": "2026-10-15T14:00:00Z"
  }
}
```

---

## 10. Events and Message Queue

Example events:

```text
USER_REGISTERED
USER_FOLLOWED
USER_UNFOLLOWED

POST_CREATED
POST_UPDATED
POST_DELETED

POST_LIKED
POST_UNLIKED

COMMENT_CREATED

MEDIA_UPLOADED
MEDIA_PROCESSED

NOTIFICATION_REQUESTED
```

Example event:

```json
{
  "event": "POST_LIKED",
  "event_id": "evt_823782",
  "occurred_at": "2026-10-15T14:30:00Z",
  "data": {
    "post_id": "post_123",
    "post_owner_id": "user_200",
    "liked_by": "user_100"
  }
}
```

Producer/consumer mapping:

| Event | Producer | Consumer |
|---|---|---|
| POST_CREATED | Post Service | Feed Service |
| POST_LIKED | Post Service | Notification Service |
| USER_FOLLOWED | Social Graph | Notification Service |
| MEDIA_UPLOADED | Media Service | Media Processor |

---

## 11. Request Flow Diagrams

Example: **Like Post**

```text
User
 |
 v
Mobile App
 |
 v
API Gateway
 |
 v
Post Service
 |
 +----> Database
 |
 +----> Redis
 |
 +----> Message Queue
           |
           v
    Notification Service
           |
           v
        WebSocket
           |
           v
      Post Owner
```

Document at least:

```text
- Register/Login
- Create Post
- Upload Image
- Like Post
- Comment
- Follow User
- Generate Feed
- Search
- Notification
- Delete Account
```

---

## 12. Authentication and Authorization

```text
Login
   ↓
Auth Service
   ↓
Validate password
   ↓
Generate Access Token
   ↓
Generate Refresh Token
```

Example:

```text
Access Token:
15 minutes

Refresh Token:
30 days
```

Roles:

```text
USER
MODERATOR
ADMIN
```

Example permissions:

```text
USER
- create post
- edit own post
- delete own post

MODERATOR
- hide inappropriate posts
- suspend users

ADMIN
- manage entire platform
```

---

## 13. Security Design

Cover:

```text
- HTTPS/TLS
- JWT/OAuth
- Password hashing
- Refresh-token rotation
- Rate limiting
- CORS
- CSRF where applicable
- SQL injection protection
- XSS protection
- Input validation
- File validation
- Malware scanning
- Secrets management
- API authorization
- Encryption at rest
- Audit logs
- Admin access controls
```

Do not hardcode secrets:

```php
$databasePassword = "mypassword";
```

Use:

```text
- Environment variables
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
```

---

## 14. Cache Design

```text
Redis

Keys:

user:{id}
TTL: 10 minutes

post:{id}
TTL: 5 minutes

feed:{user_id}
TTL: 2 minutes

rate_limit:{user_id}
TTL: 1 minute
```

Cache invalidation example:

```text
When a post is updated:

1. Update database.
2. Delete post:{postId} from Redis.
3. Next request reloads it from DB.
```

---

## 15. Media Architecture

```text
Client
  |
  v
Media Service
  |
  v
S3
```

Store only metadata in DB:

```text
media_id
user_id
file_url
file_type
file_size
width
height
status
created_at
```

Production architecture:

```text
Client
   |
   v
CDN
   |
   v
S3
```

---

## 16. Feed Architecture

Basic V1:

```text
GET /feed

Feed Service
     |
     v
Get people user follows
     |
     v
Query recent posts
     |
     v
Sort
     |
     v
Return feed
```

For large scale, later use:

```text
Fan-out on write
```

Example:

```text
POST_CREATED
      |
      v
Feed Worker
      |
      +-- Bob feed
      +-- John feed
      +-- Sarah feed
      +-- ...
```

---

## 17. Search Architecture

```text
Post Service
     |
 POST_CREATED
     |
     v
Message Queue
     |
     v
Search Indexer
     |
     v
Elasticsearch
```

Search request:

```text
GET /search?q=coffee
            |
            v
     Elasticsearch
```

PostgreSQL remains the source of truth.

---

## 18. Notification Architecture

```text
POST_LIKED
     |
     v
RabbitMQ/Kafka
     |
     v
Notification Service
     |
 +---+------------+
 |        |       |
 v        v       v
FCM     Email   WebSocket
```

Notification types:

```text
LIKE
COMMENT
FOLLOW
MENTION
SYSTEM
```

---

## 19. Error Handling Standard

```json
{
  "success": false,
  "error": {
    "code": "POST_NOT_FOUND",
    "message": "The requested post does not exist."
  }
}
```

HTTP standards:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```

---

## 20. Logging and Observability

Logs:

```text
- Application Logs
- Access Logs
- Error Logs
- Security Logs
- Audit Logs
```

Monitoring stack:

```text
- Prometheus
- Grafana
- OpenTelemetry
- ELK / OpenSearch
- Sentry
```

Useful fields:

```text
request_id
trace_id
user_id
service
endpoint
status
duration
timestamp
```

---

## 21. Health Checks

Each service should expose:

```text
GET /health
```

Example:

```json
{
  "status": "healthy",
  "service": "post-service",
  "database": "healthy",
  "redis": "healthy",
  "queue": "healthy"
}
```

Recommended:

```text
/health/live
/health/ready
```

---

## 22. Environments

```text
Local
Development
Staging
Production
```

Example:

```text
Developer
    |
    v
Local Docker
    |
    v
GitLab
    |
    v
Development
    |
    v
Staging
    |
    v
Production
```

---

## 23. Infrastructure Design

```text
                        Internet
                           |
                           v
                     Cloudflare/WAF
                           |
                           v
                    Load Balancer
                           |
                           v
                     API Gateway
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
      User Pods        Post Pods       Feed Pods
          |                |                |
          +---------- Kubernetes -----------+
                           |
            +--------------+-------------+
            |              |             |
            v              v             v
       PostgreSQL        Redis        RabbitMQ
            |
            v
       Read Replica

Media
 |
 v
S3
 |
 v
CDN
```

---

## 24. CI/CD Design

```text
Developer
    |
git push
    |
    v
GitLab
    |
    v
CI Pipeline
    |
    +-- Lint
    |
    +-- Unit Tests
    |
    +-- Security Scan
    |
    +-- Build Docker Image
    |
    +-- Integration Tests
    |
    v
Container Registry
    |
    v
Deploy Staging
    |
    v
QA / Approval
    |
    v
Production
```

---

## 25. Testing Strategy

```text
- Unit Testing
- Integration Testing
- API Testing
- Contract Testing
- Database Testing
- Security Testing
- Load Testing
- End-to-End Testing
- Failover Testing
- User Acceptance Testing
```

Critical APIs to load test:

```text
GET /feed
POST /posts
POST /posts/{id}/likes
GET /search
POST /auth/login
```

---

## 26. Database Migration Strategy

Use tracked migration files:

```text
001_create_users.sql
002_create_posts.sql
003_create_comments.sql
004_create_followers.sql
005_add_post_visibility.sql
```

Deployment sequence:

```text
Deployment
       |
       v
Backup
       |
       v
Run migration
       |
       v
Deploy application
       |
       v
Health checks
```

Always define rollback procedures.

---

## 27. Backup and Disaster Recovery

Example:

```text
Database backup:
Daily full backup

Incremental backup:
Hourly

Retention:
30 days

S3:
Versioning enabled

Production RPO:
1 hour

Production RTO:
4 hours
```

Definitions:

```text
RPO = Maximum acceptable data loss.
RTO = Maximum acceptable recovery time.
```

---

## 28. Production Deployment Plan

```text
1. Freeze release branch.
2. Run automated tests.
3. Run security scan.
4. Build production image.
5. Backup database.
6. Apply DB migration.
7. Deploy application.
8. Run health checks.
9. Run smoke tests.
10. Monitor logs/errors.
11. Monitor CPU/RAM/DB.
12. Confirm deployment.
```

Rollback example:

```text
If error rate > 5%

1. Stop deployment.
2. Roll back Docker version.
3. Roll back compatible migration if required.
4. Verify health endpoints.
5. Notify engineering team.
```

---

## 29. Production Readiness Checklist

### Architecture

- [ ] Architecture reviewed
- [ ] Service ownership confirmed
- [ ] Database ownership confirmed

### Security

- [ ] HTTPS enabled
- [ ] Secrets stored securely
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Rate limiting enabled

### Database

- [ ] Indexes reviewed
- [ ] Migrations tested
- [ ] Backups enabled
- [ ] Restore tested

### Infrastructure

- [ ] Load balancer configured
- [ ] Auto scaling configured
- [ ] Health checks enabled

### Monitoring

- [ ] Logs centralized
- [ ] Error monitoring enabled
- [ ] CPU alerts configured
- [ ] Memory alerts configured
- [ ] DB alerts configured

### Testing

- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] API tests passed
- [ ] Load tests passed
- [ ] Security tests passed

### Deployment

- [ ] CI/CD working
- [ ] Rollback tested
- [ ] Staging approved

### Operations

- [ ] Runbook completed
- [ ] Incident contacts confirmed
- [ ] Disaster recovery plan completed

---

## 30. Final Documentation Structure

```text
SOCIAL MEDIA PLATFORM
SOFTWARE DESIGN DOCUMENT

1. Document Information
2. Revision History
3. Introduction
4. Project Objectives
5. Scope
6. Functional Requirements
7. Non-Functional Requirements
8. Capacity Estimation

9. System Architecture
   9.1 System Context
   9.2 High-Level Architecture
   9.3 Technology Stack

10. Microservice Architecture
    10.1 Auth Service
    10.2 User Service
    10.3 Post Service
    10.4 Social Graph Service
    10.5 Feed Service
    10.6 Media Service
    10.7 Notification Service
    10.8 Search Service

11. Service Ownership
12. Database Ownership

13. Database Design
    13.1 ERD
    13.2 Tables
    13.3 Indexes
    13.4 Constraints

14. API Design
    14.1 Authentication API
    14.2 User API
    14.3 Post API
    14.4 Feed API
    14.5 Media API
    14.6 Search API

15. Event Architecture
16. Message Queue Design

17. Sequence Diagrams
    17.1 Login
    17.2 Create Post
    17.3 Upload Media
    17.4 Like Post
    17.5 Follow User
    17.6 Generate Feed
    17.7 Notification

18. Authentication
19. Authorization
20. Security

21. Redis / Cache Design
22. File Storage Design
23. Search Design
24. Feed Design
25. Notification Design
26. WebSocket Design

27. Error Handling
28. Logging
29. Monitoring
30. Health Checks

31. Infrastructure
32. Docker Architecture
33. Kubernetes Architecture
34. Network Architecture

35. Environments
    35.1 Local
    35.2 Development
    35.3 Staging
    35.4 Production

36. CI/CD
37. Testing Strategy
38. Database Migration Strategy

39. Backup Strategy
40. Disaster Recovery

41. Deployment Plan
42. Rollback Plan
43. Production Readiness Checklist
44. Operations Runbook

45. Future Improvements
46. Appendix
```

---

## Recommended Build Order

Do not write all documentation first and only then start coding.

Use this order:

```text
STEP 1
Requirements
        ↓
STEP 2
Service Boundaries
        ↓
STEP 3
Database Ownership
        ↓
STEP 4
Database Design
        ↓
STEP 5
API Contracts
        ↓
STEP 6
Events
        ↓
STEP 7
Architecture Diagrams
        ↓
STEP 8
Security
        ↓
STEP 9
Implement MVP
        ↓
STEP 10
Testing
        ↓
STEP 11
Docker + Infrastructure
        ↓
STEP 12
CI/CD
        ↓
STEP 13
Monitoring
        ↓
STEP 14
Staging
        ↓
STEP 15
Production Readiness Review
        ↓
STEP 16
PRODUCTION
```

## Start Here Before Coding

The first four things to define are:

```text
Requirements
    ↓
Service Boundaries
    ↓
Database / Table Ownership
    ↓
API Contracts
```

Once these are clear, each developer knows:

- Which service they are building
- Which tables that service owns
- Which APIs it exposes
- How it communicates with other services
- Which events it produces and consumes
