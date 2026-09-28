const mongoose = require('mongoose');
const config = require('../config');
const connectDB = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const ProcurementRequirement = require('../models/ProcurementRequirement');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { AUTH_METHODS } = require('../config/roles');

const DEMO_PASSWORD = 'Password@123';

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting database seed...\n');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      ProcurementRequirement.deleteMany({}),
      Auction.deleteMany({}),
      Bid.deleteMany({}),
      Order.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log('✓ Cleared existing data');

    // Create users
    const users = await User.create([
      {
        name: 'System Administrator',
        email: config.admin.email,
        username: config.admin.username,
        passwordHash: config.admin.password,
        role: 'ADMIN',
        phone: '+91-9876543210',
        company: 'Reverse Auction Corp',
        authenticationMethod: AUTH_METHODS.ADMIN.method,
        mfaEnabled: true,
        mfaSecret: 'DEV_MFA_SECRET',
        status: 'ACTIVE',
      },
      {
        name: 'Rajesh Kumar',
        email: 'buyer@example.com',
        username: 'buyer',
        passwordHash: DEMO_PASSWORD,
        role: 'BUYER',
        phone: '+91-9876543211',
        company: 'Tech Solutions Pvt Ltd',
        authenticationMethod: AUTH_METHODS.BUYER.method,
        status: 'ACTIVE',
      },
      {
        name: 'Priya Sharma',
        email: 'procurement@example.com',
        username: 'procurement',
        passwordHash: DEMO_PASSWORD,
        role: 'PROCUREMENT_OFFICER',
        phone: '+91-9876543212',
        company: 'Reverse Auction Corp',
        authenticationMethod: AUTH_METHODS.PROCUREMENT_OFFICER.method,
        status: 'ACTIVE',
      },
      {
        name: 'Amit Technologies',
        email: 'vendor1@example.com',
        username: 'vendor1',
        passwordHash: DEMO_PASSWORD,
        role: 'VENDOR',
        phone: '+91-9876543213',
        company: 'Amit Technologies Pvt Ltd',
        authenticationMethod: AUTH_METHODS.VENDOR.method,
        status: 'ACTIVE',
      },
      {
        name: 'Digital Systems Ltd',
        email: 'vendor2@example.com',
        username: 'vendor2',
        passwordHash: DEMO_PASSWORD,
        role: 'VENDOR',
        phone: '+91-9876543214',
        company: 'Digital Systems Ltd',
        authenticationMethod: AUTH_METHODS.VENDOR.method,
        status: 'ACTIVE',
      },
      {
        name: 'MicroTech Solutions',
        email: 'vendor3@example.com',
        username: 'vendor3',
        passwordHash: DEMO_PASSWORD,
        role: 'VENDOR',
        phone: '+91-9876543215',
        company: 'MicroTech Solutions',
        authenticationMethod: AUTH_METHODS.VENDOR.method,
        status: 'ACTIVE',
      },

      {
        name: 'Anita Desai',
        email: 'finance@example.com',
        username: 'finance',
        passwordHash: DEMO_PASSWORD,
        role: 'FINANCE_OFFICER',
        phone: '+91-9876543217',
        company: 'Reverse Auction Corp',
        authenticationMethod: AUTH_METHODS.FINANCE_OFFICER.method,
        mfaEnabled: true,
        mfaSecret: 'DEV_MFA_SECRET',
        status: 'ACTIVE',
      },
      {
        name: 'Suresh Auditor',
        email: 'auditor@example.com',
        username: 'auditor',
        passwordHash: DEMO_PASSWORD,
        role: 'AUCTION_AUDITOR',
        phone: '+91-9876543218',
        company: 'Reverse Auction Corp',
        authenticationMethod: AUTH_METHODS.AUCTION_AUDITOR.method,
        status: 'ACTIVE',
      },
    ]);
    console.log(`✓ Created ${users.length} demo users`);

    const [admin, buyer, procurement, vendor1, vendor2, vendor3, finance, auditor] = users;

    // Create categories
    const categories = await Category.create([
      { name: 'IT Equipment', description: 'Computers, laptops, servers, and peripherals', createdBy: admin._id },
      { name: 'Office Supplies', description: 'Stationery, furniture, and office equipment', createdBy: admin._id },
      { name: 'Software & Licenses', description: 'Software products and licensing', createdBy: admin._id },
      { name: 'Networking Equipment', description: 'Routers, switches, cables, and network devices', createdBy: admin._id },
      { name: 'Security Systems', description: 'CCTV, access control, and surveillance equipment', createdBy: admin._id },
      { name: 'Facility Management', description: 'Building maintenance and facility services', createdBy: admin._id },
      { name: 'Consulting Services', description: 'Professional consulting and advisory services', createdBy: admin._id },
      { name: 'Training & Development', description: 'Employee training programs and materials', createdBy: admin._id },
    ]);
    console.log(`✓ Created ${categories.length} categories`);

    // Create requirements
    const now = new Date();
    const requirements = await ProcurementRequirement.create([
      {
        buyer: buyer._id,
        title: 'Procurement of 100 Business Laptops',
        description: 'Procurement of 100 high-performance business laptops for the IT department. Required specifications: Intel i7 or equivalent, 16GB RAM, 512GB SSD, 14-inch FHD display, Windows 11 Pro license included.',
        category: categories[0]._id,
        productType: 'PRODUCT',
        items: [
          { name: 'Business Laptop', description: 'Intel i7, 16GB RAM, 512GB SSD', quantity: 100, unit: 'units', specifications: '14-inch FHD, Windows 11 Pro' },
        ],
        quantity: 100,
        unit: 'units',
        specifications: 'Intel i7 12th Gen+, 16GB DDR5 RAM, 512GB NVMe SSD, 14" FHD IPS, Backlit keyboard, Fingerprint reader, Min 8hr battery, 3-year warranty',
        estimatedBudget: 5000000,
        minimumBudget: 4000000,
        maximumBudget: 5500000,
        deliveryLocation: 'Tech Solutions Pvt Ltd, Bangalore, Karnataka 560001',
        deliveryDeadline: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        eligibilityRequirements: 'Vendor must be an authorized dealer. Minimum 3 years in business. ISO 9001 certified preferred.',
        auctionStartDate: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        auctionEndDate: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        minimumBidDecrement: 5000,
        isPublic: true,
        vendorEligibilityCriteria: 'Authorized laptop dealer with warranty support',
        status: 'APPROVED',
        review: {
          reviewedBy: procurement._id,
          action: 'APPROVE',
          reason: 'Budget and specifications are reasonable. Approved for auction.',
          reviewedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        },
        reviewHistory: [{
          reviewedBy: procurement._id,
          action: 'APPROVE',
          reason: 'Budget and specifications are reasonable. Approved for auction.',
        }],
      },
      {
        buyer: buyer._id,
        title: 'Office Furniture - 50 Ergonomic Desks',
        description: 'Procurement of 50 ergonomic adjustable standing desks for the new office floor.',
        category: categories[1]._id,
        productType: 'PRODUCT',
        items: [
          { name: 'Ergonomic Standing Desk', description: 'Electric height-adjustable', quantity: 50, unit: 'units' },
        ],
        quantity: 50,
        unit: 'units',
        specifications: 'Electric height adjustment, 120x60cm top, Weight capacity 100kg, Cable management, 5-year warranty',
        estimatedBudget: 1500000,
        deliveryLocation: 'Tech Solutions Pvt Ltd, Bangalore, Karnataka 560001',
        deliveryDeadline: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        minimumBidDecrement: 2000,
        isPublic: true,
        status: 'PENDING_REVIEW',
      },
      {
        buyer: buyer._id,
        title: 'Annual Software License Renewal',
        description: 'Renewal of enterprise software licenses including Microsoft 365, Adobe Creative Suite, and project management tools.',
        category: categories[2]._id,
        productType: 'SERVICE',
        quantity: 200,
        unit: 'licenses',
        estimatedBudget: 3000000,
        deliveryLocation: 'Digital delivery',
        deliveryDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
      },
    ]);
    console.log(`✓ Created ${requirements.length} procurement requirements`);

    // Create auctions
    const auctionStartTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Started 2 hours ago
    const auctionEndTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Ends in 24 hours

    const auction1 = await Auction.create({
      requirement: requirements[0]._id,
      buyer: buyer._id,
      title: 'Procurement of 100 Business Laptops',
      description: requirements[0].description,
      category: categories[0]._id,
      startingPrice: 5000000,
      currentLowestBid: 4600000,
      minimumBidDecrement: 5000,
      startTime: auctionStartTime,
      endTime: auctionEndTime,
      status: 'OPEN',
      visibility: 'PUBLIC',
      eligibilityRequirements: requirements[0].eligibilityRequirements,
      participants: [
        { vendor: vendor1._id, joinedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000) },
        { vendor: vendor2._id, joinedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
        { vendor: vendor3._id, joinedAt: new Date(now.getTime() - 0.5 * 60 * 60 * 1000) },
      ],
      totalBids: 5,
      createdBy: buyer._id,
    });

    // Update requirement status
    requirements[0].status = 'PUBLISHED';
    await requirements[0].save();

    console.log('✓ Created demo auction');

    // Create demo bids
    const bids = await Bid.create([
      {
        auction: auction1._id,
        vendor: vendor1._id,
        amount: 4900000,
        status: 'OUTBID',
        isBinding: true,
        submittedAt: new Date(now.getTime() - 90 * 60 * 1000),
        validationResult: { isValid: true, message: 'Bid accepted' },
      },
      {
        auction: auction1._id,
        vendor: vendor2._id,
        amount: 4800000,
        status: 'OUTBID',
        isBinding: true,
        submittedAt: new Date(now.getTime() - 80 * 60 * 1000),
        validationResult: { isValid: true, message: 'Bid accepted' },
      },
      {
        auction: auction1._id,
        vendor: vendor3._id,
        amount: 4750000,
        status: 'OUTBID',
        isBinding: true,
        submittedAt: new Date(now.getTime() - 70 * 60 * 1000),
        validationResult: { isValid: true, message: 'Bid accepted' },
      },
      {
        auction: auction1._id,
        vendor: vendor1._id,
        amount: 4650000,
        status: 'OUTBID',
        isBinding: true,
        submittedAt: new Date(now.getTime() - 60 * 60 * 1000),
        validationResult: { isValid: true, message: 'Bid accepted' },
      },
      {
        auction: auction1._id,
        vendor: vendor2._id,
        amount: 4600000,
        status: 'WINNING',
        isBinding: true,
        submittedAt: new Date(now.getTime() - 45 * 60 * 1000),
        validationResult: { isValid: true, message: 'Bid accepted' },
      },
    ]);
    console.log(`✓ Created ${bids.length} demo bids`);

    // Create demo notifications
    await Notification.create([
      {
        recipient: buyer._id,
        type: 'REQUIREMENT_APPROVED',
        title: 'Requirement Approved',
        message: 'Your requirement "Procurement of 100 Business Laptops" has been approved.',
        data: { entityType: 'REQUIREMENT', entityId: requirements[0]._id },
      },
      {
        recipient: vendor1._id,
        type: 'AUCTION_PUBLISHED',
        title: 'New Auction Available',
        message: 'A new auction "Procurement of 100 Business Laptops" has been published.',
        data: { entityType: 'AUCTION', entityId: auction1._id },
      },
      {
        recipient: vendor1._id,
        type: 'OUTBID',
        title: 'You have been outbid!',
        message: 'A new lower bid has been submitted in auction "Procurement of 100 Business Laptops".',
        data: { entityType: 'AUCTION', entityId: auction1._id },
      },
      {
        recipient: vendor2._id,
        type: 'BID_ACCEPTED',
        title: 'Bid Accepted',
        message: 'Your bid of ₹46,00,000 has been accepted.',
        data: { entityType: 'BID', entityId: bids[4]._id },
      },
      {
        recipient: procurement._id,
        type: 'REQUIREMENT_SUBMITTED',
        title: 'New Requirement for Review',
        message: 'Requirement "Office Furniture - 50 Ergonomic Desks" has been submitted for review.',
        data: { entityType: 'REQUIREMENT', entityId: requirements[1]._id },
      },
    ]);
    console.log('✓ Created demo notifications');

    // Create audit logs
    await AuditLog.create([
      {
        actor: buyer._id,
        actorName: buyer.name,
        role: 'BUYER',
        action: 'REQUIREMENT_CREATED',
        entityType: 'REQUIREMENT',
        entityId: requirements[0]._id,
        description: 'Requirement "Procurement of 100 Business Laptops" created',
      },
      {
        actor: buyer._id,
        actorName: buyer.name,
        role: 'BUYER',
        action: 'REQUIREMENT_SUBMITTED',
        entityType: 'REQUIREMENT',
        entityId: requirements[0]._id,
        description: 'Requirement submitted for review',
      },
      {
        actor: procurement._id,
        actorName: procurement.name,
        role: 'PROCUREMENT_OFFICER',
        action: 'REQUIREMENT_APPROVED',
        entityType: 'REQUIREMENT',
        entityId: requirements[0]._id,
        description: 'Requirement approved for auction',
      },
      {
        actor: buyer._id,
        actorName: buyer.name,
        role: 'BUYER',
        action: 'AUCTION_CREATED',
        entityType: 'AUCTION',
        entityId: auction1._id,
        description: 'Auction "Procurement of 100 Business Laptops" created',
      },
      {
        actor: procurement._id,
        actorName: procurement.name,
        role: 'PROCUREMENT_OFFICER',
        action: 'AUCTION_PUBLISHED',
        entityType: 'AUCTION',
        entityId: auction1._id,
        description: 'Auction published and opened for bidding',
      },
      ...bids.map(bid => ({
        actor: bid.vendor,
        actorName: 'Vendor',
        role: 'VENDOR',
        action: 'BID_SUBMITTED',
        entityType: 'BID',
        entityId: bid._id,
        description: `Bid of ₹${bid.amount.toLocaleString()} submitted`,
      })),
    ]);
    console.log('✓ Created demo audit logs');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log('  DEMO CREDENTIALS (Password: Password@123)');
    console.log('═══════════════════════════════════════════');
    console.log(`  Admin:         ${config.admin.email} (Username: ${config.admin.username})`);
    console.log('  Buyer:         buyer@example.com     (OTP code: 123456)');
    console.log('  Procurement:   procurement@example.com (username: procurement)');
    console.log('  Vendor 1:      vendor1@example.com   (OTP code: 123456)');
    console.log('  Vendor 2:      vendor2@example.com   (OTP code: 123456)');
    console.log('  Vendor 3:      vendor3@example.com   (OTP code: 123456)');

    console.log('  Finance:       finance@example.com   (MFA code: 000000)');
    console.log('  Auditor:       auditor@example.com   (username: auditor)');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
