# Reverse Auction Management System - Documentation

## 1. Project Overview
The Reverse Auction Management System is a centralized digital procurement platform where buyers can create procurement requirements and authorized vendors can compete in real-time by submitting progressively lower bids. This solution replaces traditional procurement processes by offering a dynamic, transparent, and scalable platform that drives down costs and optimizes vendor selection.

## 2. Technology Stack
The application is built using the MERN stack with modern web technologies:

### Frontend
- **Framework:** React.js (via Vite)
- **Styling:** Tailwind CSS for responsive, modern, and customizable UI components
- **Routing:** React Router DOM (v6) for seamless Single Page Application (SPA) navigation
- **State Management:** React Context API for global state (Authentication, WebSockets)
- **Real-time Communication:** Socket.IO Client for real-time bid updates and notifications
- **Notifications:** React Hot Toast for modern toast notifications
- **Icons:** Lucide React for crisp, lightweight SVG icons

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js for RESTful API architecture
- **Database:** MongoDB with Mongoose ODM (utilizing transactions and ACID compliance)
- **Real-time Engine:** Socket.IO for broadcasting real-time auction state
- **Authentication:** JSON Web Tokens (JWT) for secure, stateless sessions
- **Validation:** Express Validator / Custom Mongoose validations
- **Logging:** Custom Audit Logs stored in MongoDB for system traceability

## 3. Core Entities and Data Models
1. **User:** Role-based entity with varying permissions (`ADMIN`, `BUYER`, `PROCUREMENT_OFFICER`, `VENDOR`, `FINANCE_OFFICER`, `AUCTION_AUDITOR`).
2. **ProcurementRequirement:** Created by a buyer and subjected to a review workflow. It specifies what is being procured, budgets, constraints, and conditions.
3. **Auction:** Spawned from an approved requirement. Handles the live bidding logic, current lowest bid tracking, and time constraints.
4. **Bid:** Represents a vendor's offer during an auction.
5. **Order:** Created automatically when an auction concludes and a winning vendor is selected. Tracks fulfillment logic between the Buyer and the winning Vendor.
6. **Payment:** Tracks the financial transaction tied to an Order.
7. **AuditLog:** Records critical system events for compliance and security.

## 4. System Workflow

### A. Procurement Requirement Flow
1. **Creation:** A `BUYER` creates a Procurement Requirement (draft).
2. **Submission:** The buyer submits the requirement for review.
3. **Approval:** A `PROCUREMENT_OFFICER` reviews and approves the requirement.

### B. Reverse Auction & Bidding Flow
1. **Publishing:** Upon requirement approval, the `BUYER` or `PROCUREMENT_OFFICER` creates and publishes the Reverse Auction.
2. **Live Bidding:** 
   - The auction opens at a scheduled time.
   - `VENDOR`s join the auction room (via Socket.IO).
   - Vendors submit bids. The backend uses **MongoDB Sessions (Transactions)** to ensure that the bid is lower than the current lowest bid by at least the `minimumBidDecrement`.
   - The lowest bid is updated atomically, and real-time events are broadcasted to all participants.
3. **Conclusion:** The auction closes automatically when the timer runs out.

### C. Winner Selection & Fulfillment
1. **Winner Selection:** The `BUYER` reviews the valid bids and selects the winning bid.
2. **Order Creation:** An order is automatically generated mapping the Buyer to the winning Vendor.
3. **Fulfillment:** The winning `VENDOR` updates fulfillment statuses (`ASSIGNED` -> `ACCEPTED` -> `PROCESSING` -> `READY_FOR_DELIVERY` -> `DELIVERED`).
4. **Completion:** The Buyer marks the order as `COMPLETED`.

## 5. Security & Concurrency

### Real-Time Bid Integrity
In a reverse auction, multiple vendors might submit bids simultaneously. To prevent race conditions (e.g., two vendors submitting ₹10,000 simultaneously when the current price is ₹11,000):
- **MongoDB Transactions:** The `submitBid` controller uses Mongoose `startSession()` and `withTransaction()`. It locks the `Auction` document, verifies the new bid against the *current* `currentLowestBid` stored in the database, updates the auction, and saves the new `Bid` document within a single atomic operation.

### Role-Based Access Control (RBAC)
- Strict access control is enforced via custom middleware (`authorize`).
- The frontend dynamically renders sidebar navigation and action buttons based on the user's role array stored in the JWT context.

## 6. Scalability Strategies for High Loads

To scale this platform for high vendor activity and numerous simultaneous auctions:

1. **Horizontal Scaling (Statelessness):** 
   - The Node.js backend is stateless. JWTs manage sessions.
   - You can spin up multiple backend instances behind a Load Balancer (e.g., Nginx, AWS ALB).
2. **WebSocket Scalability:**
   - Integrate **Redis Adapter** for Socket.IO. When multiple backend servers are running, the Redis pub/sub mechanism ensures that an event emitted on Server A is broadcasted to users connected to Server B.
3. **Database Optimization:**
   - Separate reads and writes: Implement MongoDB Replica Sets to route heavy reporting queries to secondary read-only nodes.
   - Indexing: Compound indexes on `auctionId` and `amount` for fast bid retrieval.
4. **Microservices (Future):**
   - Extract the Bidding Engine into a separate high-throughput microservice (e.g., written in Go or Rust) that purely handles high-speed bid validations and writes to an in-memory datastore (Redis) before persisting to MongoDB in batches.

## 7. Recent Updates
- **Role Consolidation:** Removed the legacy `SUPPLIER` role. Vendors who win auctions are now inherently responsible for fulfilling the subsequent orders, simplifying the workflow and the data model.
- **Enhanced Dashboards:** Customized dashboards tailored for Buyers, Vendors, Procurement Officers, and Admins to provide high-level metrics and actionable insights immediately upon login.
