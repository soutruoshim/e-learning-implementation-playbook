---
title: "Advanced DevSecOps Roadmap — Detailed Guide"
description: "Structured learning path for designing, building, deploying, operating, and securing production systems end to end."
---

# Advanced DevSecOps Roadmap — Detailed Guide

This document turns the DevSecOps roadmap into a structured, advanced learning path. The goal is not only to learn tools, but to understand how to design, build, deploy, operate, monitor, and secure production systems end to end.

---

# 1. DevSecOps Fundamentals

Traditional software delivery often looks like:

```text
Develop
   ↓
Test
   ↓
Deploy
   ↓
Security Review
```

DevSecOps moves security earlier and keeps it active throughout the lifecycle:

```text
Plan
 ↓
Design
 ↓
Develop
 ↓
Build
 ↓
Test
 ↓
Release
 ↓
Deploy
 ↓
Operate
 ↓
Monitor
```

Security should exist at every stage.

## Core concepts

| Concept | Meaning |
|---|---|
| Shift Left | Detect security issues earlier |
| Shift Right | Monitor security after deployment |
| Security as Code | Store security configuration as code |
| Policy as Code | Enforce security rules automatically |
| Infrastructure as Code | Define infrastructure through code |
| Least Privilege | Grant only the minimum permissions required |
| Zero Trust | Never trust automatically; verify continuously |
| Defense in Depth | Use multiple security controls |
| Continuous Security | Continuously test and monitor security |

A mature pipeline may behave like:

```text
Developer Push
     ↓
Security Checks
     ↓
High Severity Issue?
     │
 ┌───┴────┐
Yes       No
 │         │
Block    Continue
          ↓
       Deploy
```

---

# 2. Programming for DevSecOps

You do not need to master every language in the roadmap.

Recommended focus:

```text
Automation
    ↓
Python

Cloud-native ecosystem
    ↓
Go

Application development
    ↓
PHP / Java / JavaScript
```

## Python topics to learn

- HTTP APIs
- JSON
- YAML
- Regular expressions
- File processing
- Environment variables
- Subprocess execution
- Logging
- Exception handling
- CLI applications
- Concurrency
- Cryptography libraries
- SSH automation

Example:

```python
import requests

url = "https://api.example.com/health"

response = requests.get(url, timeout=5)

if response.status_code != 200:
    print("Security or availability alert")
```

Later, automate tasks such as:

- TLS certificate checks
- Port checks
- API health checks
- Log parsing
- Credential rotation
- Kubernetes validation
- Alerting

---

# 3. Linux Fundamentals

A DevSecOps engineer should be comfortable in Linux.

Study:

- Linux filesystem
- Processes
- Users and groups
- Permissions
- Services
- Networking
- SSH
- Logs
- Package managers
- Environment variables
- `cron`
- `systemd`
- `iptables` / `nftables`

Important commands:

```bash
ps aux
top
htop
ss -tulpn
ip addr
ip route
curl
dig
nslookup
traceroute
ping
journalctl
systemctl
chmod
chown
grep
awk
sed
find
tail
ssh
scp
rsync
```

Example:

```bash
ss -tulpn
```

If MySQL is shown as:

```text
0.0.0.0:3306
```

it may be listening on every interface. Investigate whether that exposure is necessary.

---

# 4. Bash Scripting

Example health check:

```bash
#!/bin/bash

URL="https://api.example.com/health"

HTTP_CODE=$(curl \
    -s \
    -o /dev/null \
    -w "%{http_code}" \
    "$URL"
)

if [ "$HTTP_CODE" != "200" ]; then
    echo "ALERT: API unhealthy"
    exit 1
fi

echo "API healthy"
```

Learn:

- Functions
- Loops
- Conditions
- Exit codes
- Signals
- Pipes
- Redirection
- Environment variables
- Arguments
- `trap`
- `jq`
- `curl`

Example:

```bash
curl -s https://api.example.com/users | jq '.data[]'
```

---

# 5. CIA Triad

```text
          Security
             │
   ┌─────────┼──────────┐
   │         │          │
Confidentiality Integrity Availability
```

## Confidentiality

Protect data from unauthorized access.

Examples:

- TLS
- Encryption
- Authentication
- RBAC
- Secrets management

## Integrity

Protect data from unauthorized modification.

Examples:

- Digital signatures
- Hashing
- Audit logs
- Database constraints

## Availability

Keep systems accessible and operational.

Examples:

- Load balancing
- Backups
- Failover
- Rate limiting
- DDoS protection
- Autoscaling

---

# 6. Authentication

Authentication answers:

> Who are you?

Common methods:

- Username/password
- OTP
- API keys
- JWT
- OAuth 2.0
- OpenID Connect
- Certificates
- Passkeys

Typical flow:

```text
User
 │
 │ Username/password
 ▼
Authentication Service
 │
 ├─ Validate credentials
 ├─ Create access token
 └─ Create refresh token
 │
 ▼
Client
```

Advanced topics:

- Access token lifetime
- Refresh token rotation
- Token revocation
- Token replay protection
- MFA
- Session management
- Brute-force protection
- Credential stuffing defense

---

# 7. Authorization

Authorization answers:

> What is this identity allowed to do?

```text
User
 │
 ▼
Role
 │
 ▼
Permission
```

Example:

```text
Admin
 ├─ user:create
 ├─ user:update
 ├─ user:delete
 └─ order:view

Staff
 ├─ order:view
 └─ order:update

Customer
 └─ order:view-own
```

Study:

- RBAC
- ABAC
- PBAC
- Tenant isolation
- Resource ownership
- Policy engines

Important:

```text
Authenticated
    ≠
Authorized
```

---

# 8. OWASP Top 10

Do not only memorize categories. Reproduce vulnerabilities safely in local environments and then fix them.

Example broken object authorization:

```http
GET /users/100/orders
Authorization: Bearer USER_200_TOKEN
```

Your application should verify whether the requester owns the resource or has sufficient privileges.

Important OWASP areas:

- Broken Access Control
- Injection
- Authentication Failures
- Security Misconfiguration
- Vulnerable Components
- SSRF
- Cryptographic Failures

---

# 9. SQL Injection

Bad:

```php
$sql = "SELECT * FROM users WHERE email = '$email'";
```

Better:

```php
$stmt = $pdo->prepare(
    "SELECT * FROM users WHERE email = ?"
);

$stmt->execute([$email]);
```

Defense also includes:

- Least privilege DB users
- Input constraints
- Safe ORM usage
- Monitoring suspicious queries
- Secure error handling

---

# 10. XSS

Dangerous output:

```html
<div>
    <?= $userInput ?>
</div>
```

Safer PHP output:

```php
<?= htmlspecialchars(
    $userInput,
    ENT_QUOTES,
    'UTF-8'
) ?>
```

Study:

- Stored XSS
- Reflected XSS
- DOM XSS
- CSP
- Output encoding
- Input sanitization

---

# 11. Input Validation

Never trust:

- Browsers
- Mobile apps
- Other APIs
- Internal microservices
- Admin portals

Example:

```php
if (
    !isset($request['amount']) ||
    !is_numeric($request['amount']) ||
    $request['amount'] <= 0
) {
    throw new InvalidArgumentException('Invalid amount');
}
```

Advanced validation:

- Type validation
- Length limits
- Range validation
- Allow lists
- JSON schema validation
- File validation
- MIME checking
- Business-rule validation
- Canonicalization

---

# 12. Networking Fundamentals

Study:

- MAC
- IP
- Subnets
- Gateway
- NAT
- DNS
- TCP
- UDP
- Ports
- HTTP
- HTTPS
- TLS

Typical request path:

```text
Mobile App
    ↓
DNS
    ↓
Internet
    ↓
Firewall
    ↓
Load Balancer
    ↓
Reverse Proxy
    ↓
API Gateway
    ↓
Backend
    ↓
Database
```

Ask at every layer:

- Who can connect?
- Which ports are open?
- Is traffic encrypted?
- Is authentication required?
- Are events logged?

---

# 13. DNS

DNS maps names to IP addresses.

```text
api.example.com
      ↓
203.0.113.20
```

Study:

- A
- AAAA
- CNAME
- TXT
- MX
- NS
- TTL
- DNS caching
- DNS spoofing
- DNSSEC basics

Commands:

```bash
dig example.com
nslookup example.com
```

---

# 14. HTTP

Example:

```http
POST /api/login HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer TOKEN
```

Study:

- Methods
- Status codes
- Headers
- Cookies
- Caching
- CORS
- Content-Type
- Authorization
- Host
- Origin
- Referer

Security headers:

- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy

---

# 15. TLS

Simplified TLS process:

```text
Client
  │
  │ Hello
  ▼
Server
  │
  │ Certificate
  ▼
Client verifies certificate
  │
  ▼
Key agreement
  │
  ▼
Encrypted communication
```

Study:

- Certificates
- Certificate Authorities
- Public/private keys
- TLS versions
- Cipher suites
- Certificate expiry
- mTLS

---

# 16. Firewalls

Example firewall policy:

```text
ALLOW TCP 443
DENY everything else
```

Database example:

```text
Internet
   X
   │
MySQL 3306

Allowed only from:
10.0.2.0/24
```

Study:

- Host firewall
- Network firewall
- Cloud firewall
- Security groups
- WAF

---

# 17. VLANs and Network Segmentation

Bad design:

```text
Everything
    │
Same Network
```

Better:

```text
Public Subnet
     │
Load Balancer
     │
Private App Subnet
     │
Private Database Subnet
```

Segmentation limits lateral movement after compromise.

---

# 18. ACLs

Example:

```text
Source         Destination     Port      Action

Internet       API             443       ALLOW
API            MySQL           3306      ALLOW
Internet       MySQL           3306      DENY
```

---

# 19. Secure API Design

Production API security layers:

```text
Request
 ↓
TLS
 ↓
WAF
 ↓
Rate Limiter
 ↓
Authentication
 ↓
Authorization
 ↓
Input Validation
 ↓
Business Rules
 ↓
Database
 ↓
Audit Logging
```

Important controls:

- HTTPS only
- Authentication
- Authorization
- Rate limiting
- Request size limits
- Input validation
- Output filtering
- Idempotency
- Replay protection
- Audit logging
- CORS
- Secret management
- Safe error handling

---

# 20. Rate Limiting

Example:

```text
Login

5 requests / minute / user
10 requests / minute / IP
```

Password reset example:

```text
POST /forgot-password
        ↓
Rate Limiter
        ↓
Generate OTP
        ↓
Store hashed OTP
        ↓
Send notification
```

---

# 21. Idempotency

Useful for payment and order APIs.

```http
Idempotency-Key: abc123
```

First request:

```text
abc123
   ↓
Process payment
   ↓
Save result
```

Retry:

```text
abc123
   ↓
Already processed
   ↓
Return original result
```

---

# 22. Secure Error Handling

Do not expose:

- SQL queries
- Database passwords
- Filesystem paths
- Stack traces
- Internal IPs
- Secrets

Bad:

```json
{
  "error": "SQLSTATE 28000 password=root123"
}
```

Better:

```json
{
  "code": "INTERNAL_ERROR",
  "message": "Unable to process request"
}
```

---

# 23. IAM

Identity and Access Management should cover:

- Human identities
- Machine identities
- Service accounts
- API identities

Do not give:

```text
Administrator
```

when only this is needed:

```text
Read object storage
```

---

# 24. Secrets Management

Never hardcode:

```text
DB_PASSWORD=mysecret
AWS_SECRET_KEY=...
JWT_PRIVATE_KEY=...
```

Better architecture:

```text
Application
     ↓
Secret Reference
     ↓
Secret Manager
```

Study:

- Secret rotation
- Audit access
- Encryption at rest
- Dynamic credentials
- Short-lived credentials

---

# 25. Monitoring

Monitor:

- CPU
- Memory
- Disk
- Latency
- Error rate
- Request rate
- DB connections
- Queue depth
- Authentication failures
- Security events

The four golden signals:

```text
Latency
Traffic
Errors
Saturation
```

---

# 26. Logging

Prefer structured logs:

```json
{
  "timestamp": "2026-10-13T10:00:00Z",
  "level": "WARN",
  "event": "LOGIN_FAILED",
  "user_id": "1234",
  "ip": "10.10.1.20"
}
```

Avoid vague logs like:

```text
Something failed!!!
```

---

# 27. SIEM

SIEM = Security Information and Event Management.

```text
Application
Firewall
Database
Kubernetes
Cloud
Operating System

      ↓

Central Logs

      ↓

SIEM

      ↓

Detection Rules

      ↓

Alerts
```

Example rule:

```text
IF
login failures > 20
AND same IP
WITHIN 1 minute

THEN
Create security alert
```

---

# 28. Nmap

Use only against systems you own or are authorized to test.

```bash
nmap 192.168.1.100
```

Example result:

```text
22/tcp    SSH
80/tcp    HTTP
443/tcp   HTTPS
3306/tcp  MySQL
```

Then ask whether every exposed service is necessary.

---

# 29. Wireshark

Use Wireshark to inspect:

- DNS
- TCP handshakes
- HTTP
- TLS
- Retransmissions
- Network failures

TCP handshake:

```text
Client → SYN
Server → SYN-ACK
Client → ACK
```

---

# 30. Burp Suite

Use Burp only for authorized testing.

Typical flow:

```text
Client
   ↓
Burp Proxy
   ↓
API
```

Inspect:

- Headers
- Cookies
- JWTs
- Requests
- Responses
- Parameters
- Authorization behavior

---

# 31. Threat Modeling

Architecture example:

```text
Mobile App
    ↓
API Gateway
    ↓
Order Service
    ↓
Database
```

Identify:

- Assets
- Entry points
- Trust boundaries
- Attack surfaces
- Threats
- Mitigations

---

# 32. STRIDE

| Letter | Threat |
|---|---|
| S | Spoofing |
| T | Tampering |
| R | Repudiation |
| I | Information Disclosure |
| D | Denial of Service |
| E | Elevation of Privilege |

Ask:

```text
S: Can someone impersonate another user?
T: Can order values be changed?
R: Can someone deny making the request?
I: Can customer data leak?
D: Can the service be overwhelmed?
E: Can a normal user become admin?
```

---

# 33. Attack Surface Mapping

List externally reachable systems:

```text
api.example.com
admin.example.com
auth.example.com
websocket.example.com
VPN
SSH
Database
Cloud Console
GitLab
Container Registry
```

Reduce unnecessary exposure.

---

# 34. Docker Security

Container lifecycle:

```text
Dockerfile
   ↓
Image
   ↓
Registry
   ↓
Container
```

Common risks:

- Running as root
- Secrets embedded in images
- Outdated packages
- Vulnerable dependencies
- Exposed ports
- Privileged containers

Safer example:

```dockerfile
FROM php:8.3-fpm-alpine

RUN addgroup -S app \
    && adduser -S app -G app

WORKDIR /app

COPY . .

USER app
```

---

# 35. Container Image Scanning

Pipeline:

```text
Docker Build
     ↓
Vulnerability Scan
     ↓
Critical Vulnerability?
     │
 ┌───┴───┐
Yes      No
 │        │
Block    Push
```

Scan for:

- OS vulnerabilities
- Language dependencies
- Secrets
- Misconfiguration

---

# 36. Kubernetes Fundamentals

Learn:

- Cluster
- Node
- Pod
- Deployment
- Service
- Ingress
- ConfigMap
- Secret
- Namespace
- Persistent Volume

Architecture:

```text
Internet
    ↓
Ingress
    ↓
Service
    ↓
Pods
    ↓
Database
```

---

# 37. Kubernetes Security

Study:

- RBAC
- NetworkPolicy
- Pod Security
- Secrets
- Service Accounts
- Admission policies
- Image trust
- Resource limits
- Namespaces
- Audit logs

Avoid using:

```yaml
privileged: true
```

unless absolutely required.

---

# 38. Kubernetes NetworkPolicy

Example intended flow:

```text
Frontend
   │
   ▼
Order Service
   │
   ▼
Order DB

Payment Service
   │
   ▼
Payment DB
```

Unnecessary paths, such as:

```text
Frontend → Payment DB
```

should be blocked.

---

# 39. Cloud Security

Key areas:

- IAM
- CSPM
- Key management
- Logging
- Network segmentation
- Secrets
- Encryption

Most cloud incidents involve:

```text
Misconfiguration
or
Excessive Permissions
```

---

# 40. KMS

KMS = Key Management Service.

```text
Application
     ↓
KMS API
     ↓
Managed Encryption Key
```

Use KMS for:

- Key storage
- Rotation
- Access control
- Audit logs
- Encryption operations

---

# 41. CI/CD Security

A mature pipeline:

```text
Commit
   │
   ▼
Lint
   │
   ▼
Unit Tests
   │
   ▼
Secret Scan
   │
   ▼
SAST
   │
   ▼
Dependency Scan
   │
   ▼
Build
   │
   ▼
Container Scan
   │
   ▼
Integration Tests
   │
   ▼
Deploy Staging
   │
   ▼
DAST
   │
   ▼
Approval
   │
   ▼
Production
```

---

# 42. SAST

Static Application Security Testing scans source code without executing it.

Look for:

- Injection
- Unsafe functions
- Hardcoded secrets
- Weak crypto
- Path traversal
- Misconfiguration

```text
Source Code
     ↓
SAST
     ↓
Security Findings
```

---

# 43. DAST

Dynamic Application Security Testing scans a running application.

```text
Running API
     ↑
     │
DAST Scanner
```

It may test:

- Authentication
- Headers
- Injection
- Input validation
- Configuration

Use:

```text
SAST + DAST
```

because they detect different classes of issues.

---

# 44. SCA

Software Composition Analysis checks third-party dependencies.

Files may include:

```text
composer.json
package.json
pom.xml
requirements.txt
```

Flow:

```text
Dependency
    ↓
Known Vulnerability Database
    ↓
Version Vulnerable?
```

---

# 45. Secret Scanning

Detect:

- API keys
- Passwords
- Private keys
- Tokens
- Cloud credentials

If a real secret is committed:

```text
Revoke
Rotate
Investigate
Remove
```

Simply deleting the line is not enough.

---

# 46. Infrastructure as Code Scanning

Scan:

- Terraform
- Kubernetes YAML
- Dockerfiles
- CloudFormation
- Helm

Examples of dangerous findings:

```text
Public storage bucket
0.0.0.0/0 → SSH
Privileged pod
Unencrypted database
```

---

# 47. Policy as Code

Instead of writing a rule in documentation only:

> Developers must not deploy privileged containers.

Enforce it:

```text
Deployment
     ↓
Policy Engine
     ↓
privileged=true?
   │
 ┌─┴─┐
Yes  No
 │    │
Deny Allow
```

---

# 48. Zero Trust

Traditional model:

```text
Inside Network = Trusted
Outside Network = Untrusted
```

Zero Trust model:

```text
Nobody is automatically trusted.
```

Evaluate:

- Identity
- Device
- Context
- Permission
- Resource
- Risk

Principles:

```text
Never Trust
Always Verify
Least Privilege
Assume Breach
```

---

# 49. Defense in Depth

Example API protection:

```text
Internet
   ↓
DDoS Protection
   ↓
WAF
   ↓
Firewall
   ↓
API Gateway
   ↓
Rate Limiting
   ↓
Authentication
   ↓
Authorization
   ↓
Input Validation
   ↓
Database Permissions
   ↓
Encryption
   ↓
Monitoring
```

---

# 50. IDS and IPS

IDS:

```text
Detect
  ↓
Alert
```

IPS:

```text
Detect
  ↓
Block
```

Simple distinction:

```text
IDS = Alarm
IPS = Alarm + Prevention
```

---

# 51. DDoS Mitigation

Controls include:

- CDN
- Rate limiting
- WAF
- Autoscaling
- Caching
- Traffic filtering
- Connection limits

Architecture:

```text
Attacker Traffic
      ↓
DDoS Protection
      ↓
CDN/WAF
      ↓
Load Balancer
      ↓
Application
```

---

# 52. Supply Chain Security

Protect:

- Dependencies
- Build tools
- Package registries
- CI/CD
- Container registry
- Source control

Questions to ask:

- Can someone replace a dependency?
- Can CI runners be compromised?
- Can an image be modified?
- Can build scripts be changed?
- Are artifacts signed?

---

# 53. SBOM

SBOM = Software Bill of Materials.

Example:

```text
My API
├── Laravel
├── Guzzle
├── Redis Library
├── JWT Library
└── OpenSSL
```

It helps answer:

> Which applications are affected by a vulnerable component?

---

# 54. Build Pipeline Hardening

Use:

- Protected branches
- MFA
- Limited CI permissions
- Protected secrets
- Isolated runners
- Artifact integrity
- Approval rules
- Audit logs

Do not give every pipeline unrestricted production credentials.

---

# 55. Cryptographic Hashing

```text
Input
 ↓
Hash Function
 ↓
Fixed-size Digest
```

Example:

```text
hello
 ↓
SHA-256
 ↓
2cf24d...
```

For passwords, prefer:

- bcrypt
- Argon2

Do not use plain SHA-256 for password storage.

---

# 56. PKI

Public Key Infrastructure includes:

- Certificate Authorities
- Certificates
- Public keys
- Private keys
- Revocation
- Certificate lifecycle

TLS relies heavily on PKI.

---

# 57. Certificate Lifecycle

```text
Generate Key
     ↓
Create CSR
     ↓
Certificate Issued
     ↓
Deploy
     ↓
Monitor
     ↓
Renew
     ↓
Rotate
     ↓
Revoke
```

Monitor expiry to prevent outages.

---

# 58. Incident Response

Lifecycle:

```text
Preparation
     ↓
Detection
     ↓
Analysis
     ↓
Containment
     ↓
Eradication
     ↓
Recovery
     ↓
Lessons Learned
```

Example:

```text
SIEM Detects Suspicious Login
        ↓
Investigate
        ↓
Confirm Compromise
        ↓
Revoke Token
        ↓
Block Attacker
        ↓
Rotate Credentials
        ↓
Inspect Logs
        ↓
Fix Root Cause
        ↓
Post-Incident Review
```

---

# 59. Forensics

Evidence may include:

- System logs
- API logs
- Authentication logs
- Firewall logs
- Database logs
- Cloud logs
- Network traffic
- Container logs

Do not destroy evidence during incident handling.

---

# 60. Root Cause Analysis

Example:

```text
Why did the server crash?
→ Memory exhausted.

Why?
→ Request volume increased.

Why?
→ Endpoint had no request limit.

Why?
→ Payload size was unlimited.

Why?
→ Security requirements were not defined.
```

Fix the root cause, not only the symptom.

---

# 61. SOAR

SOAR = Security Orchestration, Automation and Response.

Example:

```text
SIEM Alert
    ↓
SOAR
    ↓
Check IP Reputation
    ↓
Check Authentication Logs
    ↓
Malicious?
    ↓
Block IP
    ↓
Create Incident
    ↓
Notify Team
```

---

# 62. Endpoint Detection and Response

EDR monitors endpoints such as:

- Employee laptops
- Servers
- Virtual machines

It detects:

- Suspicious processes
- File modifications
- Network connections
- Malicious commands
- Malware behavior

---

# 63. Vulnerability Management

Lifecycle:

```text
Discover
   ↓
Classify
   ↓
Prioritize
   ↓
Remediate
   ↓
Verify
   ↓
Track
```

Prioritize based on:

- Severity
- Exploitability
- Internet exposure
- Asset importance
- Business impact
- Existing protections

---

# 64. Secure Architecture

Example:

```text
Mobile App
     ↓
API Gateway
     ↓
Auth Service
     ↓
Order Service
     ↓
Payment Service
     ↓
Database
```

Ask:

- Where are trust boundaries?
- How do services authenticate?
- Where are secrets stored?
- How are tokens validated?
- How are logs centralized?
- What happens if one service is compromised?
- Which network paths are allowed?
- Are messages encrypted?
- How are retries handled?
- How are duplicate transactions prevented?

---

# 65. Microservice Security

Do not assume internal services are automatically trusted.

Use:

- Service identities
- mTLS
- Short-lived credentials
- Service authorization
- Network policies
- Rate limits
- Tracing
- Audit logs

---

# 66. Observability

Observability usually combines:

```text
Metrics
Logs
Traces
```

Example:

```text
Mobile Request
     ↓
Gateway        trace abc123
     ↓
Order Service  trace abc123
     ↓
Payment        trace abc123
     ↓
Database
```

This makes cross-service debugging easier.

---

# 67. Secure Database Design

Use:

- Restricted network access
- Dedicated application users
- Least privilege
- TLS
- Encryption at rest
- Backup encryption
- Audit logging
- Secure backups

Avoid:

```text
Application → DB Root
```

Prefer:

```text
Application
   ↓
app_user
   ↓
Required Tables Only
```

---

# 68. Backup Security

Good backup architecture:

```text
Production Database
       ↓
Encrypted Backup
       ↓
Separate Storage
       ↓
Retention Policy
       ↓
Restore Testing
```

A backup is not trustworthy until restore has been tested.

---

# 69. Governance

Governance defines operational security rules.

Examples:

- Who can deploy to production?
- Who approves privileged access?
- How long are logs retained?
- How fast must critical vulnerabilities be fixed?
- Who owns incidents?
- Who reviews exceptions?

---

# 70. NIST

A useful high-level model:

```text
Identify
Protect
Detect
Respond
Recover
```

This maps naturally to DevSecOps.

---

# 71. ISO 27001

Important practical areas:

- Risk management
- Access control
- Asset management
- Logging
- Incident response
- Change management
- Supplier security
- Business continuity

---

# 72. SOC 2

Typical trust areas include:

- Security
- Availability
- Confidentiality
- Processing Integrity
- Privacy

Engineering evidence may include:

- Deployment history
- Access logs
- MFA configuration
- Security alerts
- Backup reports
- Change approvals

---

# End-to-End DevSecOps Flow

A mature code change may move through:

```text
Developer
    │
    ▼
Feature Branch
    │
    ├── Secret Scanning
    ├── SAST
    ├── Unit Tests
    └── Dependency Scanning
    │
    ▼
Merge Request
    │
    ├── Code Review
    ├── Security Review
    └── Approval
    │
    ▼
Build Container
    │
    ├── SBOM Generation
    └── Container Scanning
    │
    ▼
Container Registry
    │
    ▼
Staging Kubernetes
    │
    ├── DAST
    ├── Integration Tests
    └── Security Tests
    │
    ▼
Production Approval
    │
    ▼
Production Kubernetes
    │
    ├── WAF
    ├── NetworkPolicy
    ├── RBAC
    ├── Secrets
    └── mTLS
    │
    ▼
Application
    │
    ├── Logs
    ├── Metrics
    └── Traces
    │
    ▼
SIEM / Monitoring
    │
    ▼
Alerts
    │
    ▼
Incident Response
```

---

# Recommended Advanced Learning Order

| Stage | Focus | Expected Outcome |
|---|---|---|
| 1 | Linux | Manage Linux confidently |
| 2 | Bash | Automate operational tasks |
| 3 | Networking | Understand traffic and architecture |
| 4 | HTTP/TLS/DNS | Understand web communication |
| 5 | OWASP | Identify application vulnerabilities |
| 6 | Secure APIs | Design secure backend endpoints |
| 7 | IAM | Control identities and permissions |
| 8 | Cryptography | Understand hashing, encryption and PKI |
| 9 | Docker | Build secure containers |
| 10 | GitLab CI/CD | Automate builds and deployment |
| 11 | SAST/SCA/Secret Scanning | Secure source and dependencies |
| 12 | Container Scanning | Secure container images |
| 13 | DAST | Test running applications |
| 14 | Logging | Produce useful security events |
| 15 | SIEM | Detect suspicious activity |
| 16 | Threat Modeling | Design secure systems |
| 17 | Kubernetes | Deploy microservices |
| 18 | Kubernetes Security | Harden clusters |
| 19 | Cloud IAM/KMS | Secure cloud infrastructure |
| 20 | Zero Trust | Build advanced identity architecture |
| 21 | Incident Response | Handle breaches and incidents |
| 22 | Supply Chain Security | Protect builds and dependencies |
| 23 | Observability | Combine metrics, logs and traces |
| 24 | Governance | Learn NIST, ISO 27001 and SOC 2 |

---

# Recommended Practice Project

Build a secure ordering or e-commerce platform:

```text
API Gateway
        │
        ├── Authentication Service
        ├── User Service
        ├── Order Service
        ├── Payment Service
        └── Notification Service
```

Suggested technologies:

- Spring Boot or Laravel
- PostgreSQL or MySQL
- Redis
- Kafka
- Docker
- GitLab CI/CD
- Kubernetes
- Prometheus
- Grafana
- Centralized logging

Security pipeline:

```text
Git Push
    ↓
Unit Tests
    ↓
SAST
    ↓
Secret Scan
    ↓
Dependency Scan
    ↓
Build Docker Image
    ↓
Image Scan
    ↓
SBOM Generation
    ↓
Deploy Staging
    ↓
DAST
    ↓
Deploy Production
    ↓
Monitor
```

Add:

- JWT / OAuth2
- RBAC
- Rate limiting
- mTLS
- NetworkPolicy
- Secrets management
- Centralized logging
- Audit logging
- Distributed tracing
- WAF
- KMS
- Backup strategy
- Incident response

---

# Final Goal

Your final goal should be to understand and implement this lifecycle:

```text
Plan
 ↓
Code
 ↓
Build
 ↓
Scan
 ↓
Test
 ↓
Deploy
 ↓
Protect
 ↓
Observe
 ↓
Detect
 ↓
Respond
 ↓
Improve
```

A strong DevSecOps engineer should be able to explain not only **how** a tool works, but also **why the control exists, what threat it mitigates, where it belongs in the architecture, and how it should be monitored in production**.
