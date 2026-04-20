# ScholarKit: Enterprise-Grade Serverless E-Commerce Ecosystem 🎓☁️
### CSD214 Cloud Computing | Final Project Submission | Shiv Nadar University

**ScholarKit** is a high-performance, multi-tenant cloud platform engineered for the automated procurement of school supplies and uniforms. This project demonstrates a transition from monolithic legacy systems to a fully decoupled, **Event-Driven Serverless Microservices Architecture**, leveraging high-availability managed services across AWS and Microsoft Azure.

---

## 🏛️ Architecture Overview
The system architecture follows a **Microservices pattern** where each domain (Product Catalog, Order Management, User Authentication, AI Moderation) is isolated as an independent serverless unit. By utilizing **Amazon API Gateway** and **AWS Lambda**, the infrastructure achieves near-infinite scalability with a "pay-as-you-go" cost model, eliminating the overhead of idle server capacity.

---

## 🛠️ Cloud Infrastructure Stack

The implementation utilizes a strategic selection of 10 cloud services, grouped by their architectural role:

### 1. **Compute & Orchestration**
*   **AWS Lambda**: Executes the core business logic as stateless microservices, providing automated scaling and high availability without managing underlying EC2 instances.

### 2. **Storage & Content Delivery**
*   **Amazon S3**: Acts as the immutable storage layer for frontend static assets and product media.
*   **Amazon CloudFront**: A Global Content Delivery Network (CDN) that caches content at edge locations, significantly reducing latency and protecting the origin via SSL/TLS termination.

### 3. **Data Persistence (NoSQL)**
*   **Amazon DynamoDB**: A fully managed NoSQL database implementing **Single Table Design**. It provides single-digit millisecond latency for the platform's multi-tenant data model using partition key (PK) and sort key (SK) patterns.

### 4. **Identity & Access Management**
*   **Amazon Cognito**: Handles secure user registration, authentication, and JWT-based session management, providing a robust identity layer without storing sensitive credentials in the primary database.

### 5. **Messaging & Asynchronous Processing**
*   **Amazon SQS (Simple Queue Service)**: Decouples the Checkout service from Order Processing. This ensures that peak traffic bursts are buffered, maintaining platform stability during high-load periods.

### 6. **Security & Secrets Management**
*   **AWS SSM Parameter Store**: Centralized management for environment configurations and encrypted API keys.
*   **AWS KMS (Key Management Service)**: Provides hardware-backed encryption keys to secure `SecureString` parameters in SSM, ensuring end-to-end data confidentiality.

### 7. **Multi-Cloud MLaaS Integration**
*   **Microsoft Azure AI Language**: Powers the "ScholarKit Sentiment Engine," performing natural language processing (NLP) on user reviews to derive quantitative sentiment insights.
*   **Microsoft Azure AI Vision**: Implements automated content moderation for product images, ensuring all storefront assets comply with institutional standards.

---

## 🏗️ Engineering & Security Highlights

### 🔐 Origin Access Control (OAC)
The frontend S3 bucket is strictly isolated from the public internet. Access is granted exclusively to the **Amazon CloudFront** service principal via **Origin Access Control (OAC)**. This prevents "S3 bucket leaking" and ensures all traffic is filtered through edge security policies.

### ⚡ Asynchronous SQS Pipeline
The platform implements a **non-blocking checkout flow**. When a user places an order, the request is immediately acknowledged and queued in **Amazon SQS**. A background worker Lambda then processes the ACID transaction (stock decrement, order creation) asynchronously, ensuring a highly responsive user experience.

### 🌍 Multi-Cloud MLaaS Strategy
By integrating AWS compute with Azure's specialized AI models, the project demonstrates a **Multi-Cloud strategy**. This avoids vendor lock-in for high-level services and allows the platform to leverage best-of-breed AI capabilities for sentiment and vision analysis.

---

## 🚀 Local Setup & Deployment

### 1. Prerequisites
*   Node.js v20+ & npm
*   AWS CLI configured with appropriate IAM permissions
*   Terraform or AWS SAM (Optional, for IaC deployment)

### 2. Dependency Installation
```bash
# Install root dependencies
npm install

# Install service-specific dependencies
cd aws/lambda/shared && npm install
```

### 3. Deployment Pipeline
```bash
# Build Lambda artifacts
bash aws/lambda/build.sh

# Deploy Frontend to S3 and CloudFront
bash scripts/deploy_cloudfront.sh
```

---

## 📊 Academic Context
*   **Course:** CSD214 - Cloud Computing
*   **Instructor:** Department of Computer Science & Engineering
*   **Institution:** Shiv Nadar University (SNU), Delhi-NCR
*   **Submission Date:** April 2026

*Developed by: BAT4K (Student ID: CSD214-FINAL)*
