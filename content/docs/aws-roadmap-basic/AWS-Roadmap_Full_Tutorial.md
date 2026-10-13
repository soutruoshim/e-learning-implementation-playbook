---
title: "AWS Roadmap — Full Beginner Tutorial"
---

# AWS Roadmap — Full Beginner Tutorial

This tutorial follows the roadmap:

1. Linux & Networking
2. IAM
3. EC2
4. S3
5. VPC
6. RDS + DynamoDB
7. Docker + ECS + EKS
8. Lambda + API Gateway
9. Terraform / CloudFormation
10. CloudWatch + CloudTrail + Cost Management

The main project will be a simple **Task API** that evolves as you learn each topic.

---

## Overall Learning Architecture

```text
Stage 1
Laptop
   │
   │ SSH
   ▼
 EC2
   │
   ▼
 MySQL


Stage 2
Internet
   │
   ▼
EC2 / Docker
   │
   ├────────► S3
   │
   ▼
RDS MySQL


Stage 3
Internet
   │
   ▼
ECS Fargate
   │
   ├────────► S3
   │
   ▼
RDS


Stage 4 - Serverless
Internet
   │
   ▼
API Gateway
   │
   ▼
Lambda
   │
   ▼
DynamoDB


Everything managed by:
      │
      ├── IAM
      ├── VPC
      ├── Terraform
      ├── CloudWatch
      ├── CloudTrail
      └── AWS Budgets
```

---

# 0. AWS Account and Local Setup

## Step 0.1 — Create an AWS Account

Recommended region for this tutorial:

```text
Region:
Asia Pacific (Singapore)

Region code:
ap-southeast-1
```

Keep all resources in one region while learning.

---

## Step 0.2 — Protect the Root Account

Do not use the AWS root account for normal work.

Recommended setup:

```text
Root Account
   │
   ├── Strong password
   ├── MFA
   └── Never create root access keys
   │
   ▼
IAM Identity Center / IAM Role
   │
   ▼
Daily AWS work
```

Security rule:

> Use least privilege and temporary credentials whenever possible.

---

## Step 0.3 — Create an AWS Budget

Go to:

```text
AWS Console
→ Billing and Cost Management
→ Budgets
→ Create budget
```

Example:

```text
Name: aws-learning-budget

Type: Cost budget

Monthly budget:
$5 or $10

Notifications:
50%
80%
100%
```

Create this before launching paid resources.

---

## Step 0.4 — Install Development Tools

Install:

```text
Git
AWS CLI v2
Docker Desktop
Terraform
VS Code
SSH
Optional: WSL2 Ubuntu
```

Check AWS CLI:

```powershell
aws --version
```

Configure AWS CLI using SSO:

```powershell
aws configure sso
```

Verify authentication:

```powershell
aws sts get-caller-identity
```

Expected structure:

```json
{
  "UserId": "...",
  "Account": "123456789012",
  "Arn": "..."
}
```

---

# 1. Linux & Networking

Do not skip this part.

Linux and networking are the foundation for:

- EC2
- Docker
- Kubernetes
- Load balancers
- VPC
- RDS
- Troubleshooting

---

## Linux Commands to Learn

```bash
pwd
ls
ls -la

cd
mkdir
touch

cp
mv
rm

cat
less
head
tail

grep
find

whoami
sudo

ps
top

df -h
free -m

systemctl
journalctl

curl
wget

ip addr
ip route

ss -tulpn

ping
nslookup
dig

ssh
```

Examples:

```bash
pwd
```

Means:

```text
Where am I?
```

```bash
ls -la
```

Means:

```text
Show all files, including hidden files.
```

```bash
ps aux
```

Means:

```text
Show running processes.
```

```bash
ss -tulpn
```

Means:

```text
Show network services listening on ports.
```

---

# Networking Basics

Understand these first:

```text
IP address
DNS
Port
Protocol
Route
```

Example:

```text
https://api.example.com:443
```

Breakdown:

```text
api.example.com
      │
      │ DNS
      ▼
18.141.x.x
      │
      │ TCP
      ▼
Port 443
      │
      ▼
HTTPS Server
```

Typical request flow:

```text
Laptop
192.168.1.20
      │
      ▼
Home Router
      │
      ▼
Internet
      │
      ▼
AWS Public IP
      │
      ▼
Security Group
      │
      ▼
EC2
10.20.1.10
      │
      ▼
Application :8080
```

Important ports:

```text
22    SSH
80    HTTP
443   HTTPS
3306  MySQL
5432  PostgreSQL
6379  Redis
8080  Common application port
```

---

## CIDR Basics

Example:

```text
10.20.0.0/16
```

Large private network range.

Example subnet:

```text
10.20.1.0/24
```

Represents a smaller section of the VPC network.

---

# 2. IAM

IAM means:

> Identity and Access Management

IAM answers:

```text
WHO
can do
WHAT
to
WHICH RESOURCE?
```

Example:

```text
Developer
   │
   ▼
IAM Role
   │
   ▼
Policy
   │
   ├── Allow S3:GetObject
   └── Allow S3:ListBucket
```

---

## IAM User

Represents a person or older style application identity.

```text
IAM User
   │
   ├── Username
   ├── Permissions
   └── Optional credentials
```

Prefer temporary credentials for modern systems.

---

## IAM Role

Roles are extremely important.

Example:

```text
EC2
 │
 ▼
IAM Role
 │
 ▼
S3
```

Do **not** hardcode AWS credentials in source code:

```php
$accessKey = "...";
$secretKey = "...";
```

Instead:

```text
EC2
 │
 ▼
IAM Role
 │
 ▼
Temporary AWS credentials
```

---

## IAM Policy Example

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::aws-roadmap-demo",
        "arn:aws:s3:::aws-roadmap-demo/*"
      ]
    }
  ]
}
```

Meaning:

```text
ALLOW

s3:GetObject
s3:ListBucket

ONLY FOR

aws-roadmap-demo
```

---

# 3. EC2 — Virtual Server

EC2 is basically a computer running inside AWS.

```text
Your Laptop
     │
     │ SSH :22
     ▼
┌──────────────────┐
│      EC2         │
│                  │
│ Amazon Linux     │
│ Nginx            │
│ PHP / Java       │
└──────────────────┘
```

---

## Step 3.1 — Launch EC2

Go to:

```text
AWS Console
→ EC2
→ Instances
→ Launch instances
```

Example:

```text
Name:
aws-roadmap-web

AMI:
Amazon Linux 2023
```

Choose a small instance suitable for learning.

Create a key pair:

```text
aws-roadmap-key
```

Download:

```text
aws-roadmap-key.pem
```

Keep it safe.

---

## Step 3.2 — Configure Security Group

Inbound rules:

```text
SSH
TCP 22
Source: My IP

HTTP
TCP 80
Source: 0.0.0.0/0
```

Avoid:

```text
SSH 22
Source: 0.0.0.0/0
```

unless you specifically understand the risk.

---

## Step 3.3 — Connect to EC2

```bash
ssh -i aws-roadmap-key.pem ec2-user@YOUR_EC2_IP
```

Expected shell:

```text
[ec2-user@ip-xxx ~]$
```

---

## Step 3.4 — Install Nginx

```bash
sudo dnf update -y
```

```bash
sudo dnf install nginx -y
```

Start Nginx:

```bash
sudo systemctl start nginx
```

Enable after reboot:

```bash
sudo systemctl enable nginx
```

Check status:

```bash
sudo systemctl status nginx
```

Open:

```text
http://EC2_PUBLIC_IP
```

---

## Step 3.5 — Create Your Own Web Page

```bash
echo '<h1>Hello AWS</h1>' | sudo tee /usr/share/nginx/html/index.html
```

Reload browser.

Expected:

```text
Hello AWS
```

---

# EC2 AMI Concept

AMI is a server template.

```text
Configured EC2
   │
   ▼
Create AMI
   │
   ▼
Server Template
   │
   ├── EC2 #1
   ├── EC2 #2
   └── EC2 #3
```

---

# Auto Scaling Concept

```text
                 ┌──── EC2
Internet ───────►│
                 ├──── EC2
                 │
                 └──── EC2

                     ▲
                     │
                Auto Scaling
```

Example:

```text
Minimum: 1
Desired: 2
Maximum: 3
```

High load:

```text
2 EC2
 ↓
3 EC2
```

Low load:

```text
3 EC2
 ↓
2 EC2
```

---

# 4. Amazon S3

S3 is object storage.

Use it for:

```text
Images
Documents
Videos
Backups
Logs
Static files
```

Structure:

```text
S3
 │
 ▼
Bucket
 │
 ├── avatar.jpg
 ├── invoice.pdf
 └── uploads/
       └── photo.png
```

---

## Step 4.1 — Create Bucket

Go to:

```text
S3
→ Create bucket
```

Example:

```text
aws-roadmap-yourname-2026
```

Region:

```text
ap-southeast-1
```

Keep:

```text
Block Public Access = ON
```

for the learning lab.

---

## Step 4.2 — Upload File

Create:

```text
hello.txt
```

Content:

```text
Hello from AWS S3
```

Upload using AWS CLI:

```bash
aws s3 cp hello.txt s3://YOUR-BUCKET/
```

List:

```bash
aws s3 ls s3://YOUR-BUCKET/
```

Download:

```bash
aws s3 cp s3://YOUR-BUCKET/hello.txt .
```

---

## Step 4.3 — Enable Versioning

Go to:

```text
Bucket
→ Properties
→ Bucket Versioning
→ Enable
```

Upload multiple versions of the same file:

```text
hello.txt version 1
hello.txt version 2
hello.txt version 3
```

S3 keeps historical versions.

---

## Step 4.4 — Lifecycle Rules

Example:

```text
Old object versions
       │
       ▼
After 30 days
       │
       ▼
Move or expire
```

Useful for:

- backups
- logs
- archive data
- old file versions

---

# 5. VPC — AWS Networking

VPC means:

> Virtual Private Cloud

Think of it as your own private network inside AWS.

```text
AWS
┌────────────────────────────────────────┐
│             YOUR VPC                   │
│             10.20.0.0/16              │
│                                        │
│    Public              Private         │
│    subnet              subnet          │
│                                        │
│    EC2                 RDS             │
│    ECS                 Redis           │
└────────────────────────────────────────┘
```

---

## VPC Design

Use:

```text
VPC
10.20.0.0/16
```

Subnets:

```text
Availability Zone A

Public-A
10.20.1.0/24

Private-A
10.20.11.0/24


Availability Zone B

Public-B
10.20.2.0/24

Private-B
10.20.12.0/24
```

Diagram:

```text
                        Internet
                           │
                           ▼
                 Internet Gateway
                           │
              ┌────────────┴────────────┐
              │                         │
       Public Subnet A           Public Subnet B
       10.20.1.0/24              10.20.2.0/24
              │                         │
             EC2                       EC2
              │                         │
              └────────────┬────────────┘
                           │
                  Application Layer
                           │
              ┌────────────┴────────────┐
              │                         │
      Private Subnet A         Private Subnet B
      10.20.11.0/24            10.20.12.0/24
              │                         │
              └────────── RDS ──────────┘
```

---

## Internet Gateway

Public route table:

```text
Destination          Target

10.20.0.0/16         local

0.0.0.0/0            Internet Gateway
```

---

## Private Subnet

Private route table can initially be:

```text
10.20.0.0/16 → local
```

RDS can live here without direct internet exposure.

---

## NAT Gateway Concept

For private servers needing outbound internet:

```text
Private EC2
    │
    ▼
NAT Gateway
    │
    ▼
Internet Gateway
    │
    ▼
Internet
```

Be careful:

> NAT Gateway is a paid AWS service.

Do not create it unless you need it for the lab.

---

## Security Groups

Web security group:

```text
web-sg

80   ← Internet
443  ← Internet
22   ← Your IP
```

Database security group:

```text
database-sg

3306 ← web-sg
```

Avoid:

```text
3306
Source: 0.0.0.0/0
```

Prefer:

```text
3306
Source: web-sg
```

---

# 6. RDS and DynamoDB

## RDS

RDS is for relational databases:

```text
MySQL
PostgreSQL
MariaDB
SQL Server
etc.
```

## DynamoDB

DynamoDB is AWS NoSQL storage.

```text
Key/value
Document database
Serverless
Highly scalable
```

---

# RDS Architecture

```text
Internet
   │
   ▼
EC2
Public Subnet
   │
   │ 3306
   ▼
RDS MySQL
Private Subnet
```

---

## Step 6.1 — Create RDS

Go to:

```text
RDS
→ Databases
→ Create database
```

Choose:

```text
MySQL
```

Example:

```text
Database name:
awsroadmap

Master username:
admin
```

Network:

```text
VPC:
aws-roadmap-vpc

Public access:
NO
```

DB subnet group:

```text
Private-A
Private-B
```

Security Group:

```text
rds-sg
```

Inbound:

```text
MySQL
3306
Source: ec2-web-sg
```

---

## Connect EC2 to RDS

```text
EC2
10.20.1.10
      │
      │ :3306
      ▼
RDS
10.20.x.x
```

Connect:

```bash
mysql -h YOUR_RDS_ENDPOINT \
      -u admin \
      -p
```

Create database:

```sql
CREATE DATABASE roadmap;
```

Use it:

```sql
USE roadmap;
```

Create table:

```sql
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE
);
```

Insert:

```sql
INSERT INTO tasks(title)
VALUES ('Learn EC2');
```

Query:

```sql
SELECT * FROM tasks;
```

Architecture now:

```text
Browser
  │
  ▼
EC2
  │
  ▼
RDS MySQL
```

---

# DynamoDB Lab

Create table:

```text
Table:
RoadmapUsers

Partition key:
userId
```

CLI:

```bash
aws dynamodb create-table \
  --table-name RoadmapUsers \
  --attribute-definitions AttributeName=userId,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

Insert:

```bash
aws dynamodb put-item \
  --table-name RoadmapUsers \
  --item '{"userId":{"S":"u001"},"name":{"S":"Alice"}}'
```

Read:

```bash
aws dynamodb get-item \
  --table-name RoadmapUsers \
  --key '{"userId":{"S":"u001"}}'
```

---

# RDS vs DynamoDB

Use RDS when you need:

```text
SQL
Joins
Relationships
Complex transactions
Relational modeling
```

Use DynamoDB when you need:

```text
Very high scale
Simple access patterns
Key/value
Serverless operation
Fast predictable performance
```

---

# 7. Containers — Docker → ECR → ECS → EKS

Recommended order:

```text
Docker
  ↓
ECR
  ↓
ECS
  ↓
Fargate
  ↓
Kubernetes concepts
  ↓
EKS
```

Do not start with EKS.

---

## Step 7.1 — Create a PHP Docker Application

Project:

```text
aws-roadmap-api/
│
├── Dockerfile
└── index.php
```

`index.php`:

```php
<?php

header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'message' => 'Hello from Docker on AWS'
]);
```

`Dockerfile`:

```dockerfile
FROM php:8.2-apache

COPY index.php /var/www/html/index.php

EXPOSE 80
```

Build:

```bash
docker build -t aws-roadmap-api .
```

Run:

```bash
docker run -p 8080:80 aws-roadmap-api
```

Open:

```text
http://localhost:8080
```

Expected response:

```json
{
  "success": true,
  "message": "Hello from Docker on AWS"
}
```

---

# Step 7.2 — Push Docker Image to ECR

Create repository:

```bash
aws ecr create-repository \
    --repository-name aws-roadmap-api
```

Get account number:

```bash
aws sts get-caller-identity \
    --query Account \
    --output text
```

Example variables:

```bash
ACCOUNT_ID=123456789012
REGION=ap-southeast-1
```

Login Docker to ECR:

```bash
aws ecr get-login-password \
  --region $REGION \
  | docker login \
  --username AWS \
  --password-stdin \
  $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
```

Tag image:

```bash
docker tag aws-roadmap-api:latest \
$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/aws-roadmap-api:latest
```

Push:

```bash
docker push \
$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/aws-roadmap-api:latest
```

Architecture:

```text
Your PC
   │
   │ docker push
   ▼
Amazon ECR
   │
   │ docker pull
   ▼
Amazon ECS
```

---

# Step 7.3 — ECS + Fargate

Architecture:

```text
             Amazon ECR
                 │
             Docker image
                 │
                 ▼
        ┌─────────────────┐
        │   ECS Cluster   │
        │                 │
        │ Fargate Task    │
        │ ┌─────────────┐ │
        │ │ PHP Docker  │ │
        │ └─────────────┘ │
        └─────────────────┘
```

Create cluster:

```text
ECS
→ Clusters
→ Create cluster
```

Name:

```text
aws-roadmap-cluster
```

Create Task Definition:

```text
Launch type:
Fargate

CPU:
0.25 vCPU

Memory:
0.5 GB
```

Container image:

```text
Your ECR image
```

Container port:

```text
80
```

Create service:

```text
Desired tasks:
1
```

Delete or stop the service when finished.

---

# ECS vs EKS

```text
ECS
   │
   ├── Easier
   ├── AWS-native
   ├── Fewer Kubernetes concepts
   └── Great starting point


EKS
   │
   ├── Kubernetes
   ├── More flexible
   ├── More complex
   └── Better after learning Kubernetes
```

Before EKS, learn:

```text
Pod
Deployment
Service
ConfigMap
Secret
Ingress
Namespace
Replica
```

Use:

```text
Docker
+
kind
or
Minikube
```

locally before paying for EKS.

---

# 8. Serverless — Lambda

Traditional server:

```text
Application
   │
   ▼
Server
   │
   ▼
You manage the server
```

Lambda:

```text
Request
   │
   ▼
Lambda Function
   │
   ▼
Runs code
   │
   ▼
Stops
```

---

## Step 8.1 — Create Lambda

Go to:

```text
Lambda
→ Create function
```

Name:

```text
aws-roadmap-hello
```

Runtime:

```text
Python
```

Code:

```python
import json

def lambda_handler(event, context):

    params = event.get("queryStringParameters") or {}

    name = params.get("name", "World")

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "message": f"Hello {name}"
        })
    }
```

Deploy and test.

---

# Add API Gateway

Architecture:

```text
Mobile App
    │
    │ HTTPS
    ▼
API Gateway
    │
    ▼
Lambda
    │
    ▼
DynamoDB
```

Create:

```text
API Gateway
→ Create API
→ HTTP API
```

Integration:

```text
Lambda
```

Choose:

```text
aws-roadmap-hello
```

Route:

```text
GET /hello
```

Call:

```text
GET /hello?name=John
```

Response:

```json
{
  "message": "Hello John"
}
```

---

# Add DynamoDB to Lambda

Example endpoint:

```text
POST /users
```

Flow:

```text
HTTP Request
     │
     ▼
API Gateway
     │
     ▼
Lambda
     │
     ▼
DynamoDB
```

Now you have a basic serverless API.

---

# Traditional vs Serverless

Traditional:

```text
API
 │
 ▼
EC2 / ECS
 │
 ▼
RDS
```

Serverless:

```text
API Gateway
 │
 ▼
Lambda
 │
 ▼
DynamoDB
```

Neither is always better.

Choose based on business and technical requirements.

---

# 9. Infrastructure as Code

Instead of:

```text
AWS Console
Click
Click
Click
Click
```

use:

```text
Code
 │
 ▼
Terraform
 │
 ▼
AWS
```

Workflow:

```text
Write
 ↓
terraform init
 ↓
terraform plan
 ↓
Review
 ↓
terraform apply
 ↓
AWS Resources
```

---

# Terraform First Project

Project:

```text
aws-terraform/
│
├── main.tf
├── variables.tf
└── terraform.tfvars
```

`main.tf`:

```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "roadmap" {
  bucket = var.bucket_name

  tags = {
    Project     = "aws-roadmap"
    Environment = "learning"
  }
}

resource "aws_s3_bucket_versioning" "roadmap" {
  bucket = aws_s3_bucket.roadmap.id

  versioning_configuration {
    status = "Enabled"
  }
}
```

`variables.tf`:

```hcl
variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "bucket_name" {
  type = string
}
```

`terraform.tfvars`:

```hcl
bucket_name = "YOUR-UNIQUE-AWS-ROADMAP-BUCKET"
```

---

# Terraform Commands

Initialize:

```bash
terraform init
```

Format:

```bash
terraform fmt
```

Validate:

```bash
terraform validate
```

Preview:

```bash
terraform plan
```

Create resources:

```bash
terraform apply
```

Destroy:

```bash
terraform destroy
```

Always review the plan before applying or destroying.

---

# Terraform vs CloudFormation

```text
Terraform
      │
      ├── AWS
      ├── Azure
      ├── GCP
      └── Many providers


CloudFormation
      │
      └── AWS-native
```

Recommended:

> Learn Terraform first, then CloudFormation.

---

# 10. Monitoring and Cost

Production systems need:

```text
Application
     │
     ├── Logs
     ├── Metrics
     ├── Alerts
     ├── Traces
     └── Audit history
```

---

# CloudWatch

Use CloudWatch for:

```text
Metrics
Logs
Alarms
Dashboards
```

EC2 examples:

```text
EC2
 │
 ├── CPUUtilization
 ├── NetworkIn
 ├── NetworkOut
 └── StatusCheckFailed
```

Create an alarm:

```text
CloudWatch
→ Alarms
→ Create alarm
```

Select:

```text
EC2
→ Per-Instance Metrics
→ CPUUtilization
```

Example threshold:

```text
CPU > 70%
for 5 minutes
```

Notification flow:

```text
Alarm
   │
   ▼
SNS
   │
   ▼
Email
```

---

# Lambda Monitoring

```text
Lambda
 │
 ├── Invocation count
 ├── Errors
 ├── Duration
 └── Logs
        │
        ▼
   CloudWatch
```

Example logging:

```python
print("Processing user registration")
```

Then inspect CloudWatch Logs.

---

# CloudTrail

CloudWatch answers:

```text
What is happening to my application?
```

CloudTrail answers:

```text
WHO changed AWS?
```

Example event:

```text
User: developer@example
Action: RunInstances
Resource: EC2
Time: 10:32
```

Another example:

```text
User
  │
  ▼
DeleteBucket
  │
  ▼
CloudTrail records event
```

---

# Cost Management

Use tags:

```text
Project = aws-roadmap
Environment = learning
Owner = student
```

Then use Cost Explorer:

```text
AWS Cost Explorer
        │
        ▼
Filter:
Project = aws-roadmap
```

This helps you understand how much the project costs.

---

# Final Architecture

```text
                         INTERNET
                            │
                            ▼
                    ┌───────────────┐
                    │ API Gateway   │
                    └───────┬───────┘
                            │
                     ┌──────▼──────┐
                     │   Lambda    │
                     └──────┬──────┘
                            │
                      ┌─────▼─────┐
                      │ DynamoDB  │
                      └───────────┘
```

Container-based application:

```text
                         INTERNET
                            │
                            ▼
               ┌──────────────────────┐
               │         VPC          │
               │     10.20.0.0/16     │
               │                      │
               │     PUBLIC           │
               │       │              │
               │       ▼              │
               │ ┌───────────────┐    │
               │ │ ECS Fargate   │    │
               │ │ Docker API    │    │
               │ └───────┬───────┘    │
               │         │            │
               │ ───── PRIVATE ─────  │
               │         │            │
               │         ▼            │
               │ ┌───────────────┐    │
               │ │ RDS MySQL     │    │
               │ └───────────────┘    │
               │                      │
               └──────────────────────┘
                          │
                          ▼
                ┌───────────────────┐
                │        S3         │
                │ files / images    │
                └───────────────────┘
```

Cross-cutting services:

```text
IAM
 ├── Users
 ├── Roles
 └── Policies

Terraform
 └── Infrastructure as Code

CloudWatch
 └── Monitoring and Logs

CloudTrail
 └── Audit History

AWS Budgets
 └── Cost Protection
```

---

# 12-Week Learning Plan

| Week | Topic | Project |
|---|---|---|
| 1 | Linux | Linux commands, processes, permissions |
| 2 | Networking + IAM | TCP/IP, ports, SSH, roles, policies |
| 3 | EC2 | Deploy Nginx/API |
| 4 | S3 | Uploads, versioning, lifecycle |
| 5 | VPC | Public/private subnets, routes, security groups |
| 6 | RDS + DynamoDB | SQL + NoSQL |
| 7 | Docker | Containerize PHP/Java API |
| 8 | ECS/Fargate | Deploy Docker to AWS |
| 9 | Lambda | Build serverless API |
| 10 | Terraform | Infrastructure as Code |
| 11 | CloudWatch/CloudTrail | Monitoring and auditing |
| 12 | Final Project | Build everything together |

---

# Recommended Path After AWS Basics

```text
AWS
 ↓
Docker
 ↓
Microservices
 ↓
Kafka
 ↓
Redis
 ↓
CI/CD
 ↓
Kubernetes
 ↓
EKS
 ↓
Observability
 ↓
Production Architecture
```

---

# Best Learning Rule

Do not create every AWS resource at once.

Use this cycle:

```text
Create
   ↓
Understand
   ↓
Test
   ↓
Break it
   ↓
Fix it
   ↓
DELETE IT
```

Especially remove resources that can continue costing money, including:

```text
EC2
RDS
ECS tasks
NAT Gateway
EKS cluster
Load Balancer
Unused Elastic IPs
```

---

# Best First Hands-On Lesson

Start with:

```text
Linux
  ↓
Networking
  ↓
IAM
  ↓
EC2
```

Then deploy:

```text
Browser
   │
   ▼
EC2
   │
   ▼
Nginx
   │
   ▼
Hello AWS
```

Once this works, continue with S3, VPC, RDS, Docker, ECS, Lambda, Terraform, and monitoring.
