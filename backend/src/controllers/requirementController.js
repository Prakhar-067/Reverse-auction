const ProcurementRequirement = require('../models/ProcurementRequirement');
const AuditService = require('../services/auditService');
const NotificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');

// Get requirements
exports.getRequirements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const query = {};

    // Buyers see only their own; procurement/admin see all
    if (req.user.role === 'BUYER') {
      query.buyer = req.user._id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await ProcurementRequirement.countDocuments(query);
    const requirements = await ProcurementRequirement.find(query)
      .populate('buyer', 'name email')
      .populate('category', 'name')
      .populate('review.reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return ApiResponse.paginated(res, requirements, page, limit, total);
  } catch (error) {
    next(error);
  }
};

// Create requirement
exports.createRequirement = async (req, res, next) => {
  try {
    const requirementData = {
      ...req.body,
      buyer: req.user._id,
      status: 'DRAFT',
    };

    const requirement = await ProcurementRequirement.create(requirementData);
    
    await requirement.populate('buyer', 'name email');
    await requirement.populate('category', 'name');

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'REQUIREMENT_CREATED',
      entityType: 'REQUIREMENT',
      entityId: requirement._id,
      description: `Requirement "${requirement.title}" created`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.created(res, requirement, 'Requirement created successfully.');
  } catch (error) {
    next(error);
  }
};

// Get requirement by ID
exports.getRequirementById = async (req, res, next) => {
  try {
    const requirement = await ProcurementRequirement.findById(req.params.id)
      .populate('buyer', 'name email company')
      .populate('category', 'name')
      .populate('review.reviewedBy', 'name email')
      .populate('reviewHistory.reviewedBy', 'name email');

    if (!requirement) return ApiResponse.notFound(res, 'Requirement not found.');

    // Check ownership for buyers
    if (req.user.role === 'BUYER' && requirement.buyer._id.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }

    return ApiResponse.success(res, requirement);
  } catch (error) {
    next(error);
  }
};

// Update requirement
exports.updateRequirement = async (req, res, next) => {
  try {
    const requirement = await ProcurementRequirement.findById(req.params.id);
    if (!requirement) return ApiResponse.notFound(res, 'Requirement not found.');

    // Only buyer who owns it can edit
    if (req.user.role === 'BUYER' && requirement.buyer.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }

    // Can only edit DRAFT or REVISION_REQUIRED
    if (!['DRAFT', 'REVISION_REQUIRED'].includes(requirement.status)) {
      return ApiResponse.badRequest(res, `Cannot edit requirement in ${requirement.status} status.`);
    }

    const allowedFields = ['title', 'description', 'category', 'productType', 'items', 'quantity', 'unit',
      'specifications', 'estimatedBudget', 'minimumBudget', 'maximumBudget', 'deliveryLocation',
      'deliveryDeadline', 'eligibilityRequirements', 'auctionStartDate', 'auctionEndDate',
      'minimumBidDecrement', 'isPublic', 'vendorEligibilityCriteria'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) requirement[field] = req.body[field];
    });

    await requirement.save();
    await requirement.populate('buyer', 'name email');
    await requirement.populate('category', 'name');

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'REQUIREMENT_UPDATED',
      entityType: 'REQUIREMENT',
      entityId: requirement._id,
      description: `Requirement "${requirement.title}" updated`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, requirement, 'Requirement updated successfully.');
  } catch (error) {
    next(error);
  }
};

// Submit for review
exports.submitRequirement = async (req, res, next) => {
  try {
    const requirement = await ProcurementRequirement.findById(req.params.id);
    if (!requirement) return ApiResponse.notFound(res, 'Requirement not found.');

    if (requirement.buyer.toString() !== req.user._id.toString()) {
      return ApiResponse.forbidden(res, 'Access denied.');
    }

    if (!['DRAFT', 'REVISION_REQUIRED'].includes(requirement.status)) {
      return ApiResponse.badRequest(res, `Cannot submit requirement in ${requirement.status} status.`);
    }

    requirement.status = 'PENDING_REVIEW';
    await requirement.save();

    // Notify procurement officers
    const User = require('../models/User');
    const officers = await User.find({ role: 'PROCUREMENT_OFFICER', status: 'ACTIVE' });
    for (const officer of officers) {
      await NotificationService.create({
        recipient: officer._id,
        type: 'REQUIREMENT_SUBMITTED',
        title: 'New Requirement for Review',
        message: `Requirement "${requirement.title}" has been submitted for review.`,
        data: { entityType: 'REQUIREMENT', entityId: requirement._id, link: `/procurement/requirements/${requirement._id}` },
      });
    }

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'REQUIREMENT_SUBMITTED',
      entityType: 'REQUIREMENT',
      entityId: requirement._id,
      description: `Requirement "${requirement.title}" submitted for review`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, requirement, 'Requirement submitted for review.');
  } catch (error) {
    next(error);
  }
};

// Approve requirement
exports.approveRequirement = async (req, res, next) => {
  try {
    const requirement = await ProcurementRequirement.findById(req.params.id);
    if (!requirement) return ApiResponse.notFound(res, 'Requirement not found.');

    if (requirement.status !== 'PENDING_REVIEW') {
      return ApiResponse.badRequest(res, 'Only pending review requirements can be approved.');
    }

    requirement.status = 'APPROVED';
    requirement.review = {
      reviewedBy: req.user._id,
      action: 'APPROVE',
      reason: req.body.reason || 'Approved',
      reviewedAt: new Date(),
    };
    requirement.reviewHistory.push({
      reviewedBy: req.user._id,
      action: 'APPROVE',
      reason: req.body.reason || 'Approved',
    });
    await requirement.save();

    // Notify buyer
    await NotificationService.create({
      recipient: requirement.buyer,
      type: 'REQUIREMENT_APPROVED',
      title: 'Requirement Approved',
      message: `Your requirement "${requirement.title}" has been approved.`,
      data: { entityType: 'REQUIREMENT', entityId: requirement._id, link: `/buyer/requirements/${requirement._id}` },
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'REQUIREMENT_APPROVED',
      entityType: 'REQUIREMENT',
      entityId: requirement._id,
      description: `Requirement "${requirement.title}" approved`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, requirement, 'Requirement approved.');
  } catch (error) {
    next(error);
  }
};

// Reject requirement
exports.rejectRequirement = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return ApiResponse.badRequest(res, 'Rejection reason is required.');

    const requirement = await ProcurementRequirement.findById(req.params.id);
    if (!requirement) return ApiResponse.notFound(res, 'Requirement not found.');

    if (requirement.status !== 'PENDING_REVIEW') {
      return ApiResponse.badRequest(res, 'Only pending review requirements can be rejected.');
    }

    requirement.status = 'REJECTED';
    requirement.review = {
      reviewedBy: req.user._id,
      action: 'REJECT',
      reason,
      reviewedAt: new Date(),
    };
    requirement.reviewHistory.push({
      reviewedBy: req.user._id,
      action: 'REJECT',
      reason,
    });
    await requirement.save();

    await NotificationService.create({
      recipient: requirement.buyer,
      type: 'REQUIREMENT_REJECTED',
      title: 'Requirement Rejected',
      message: `Your requirement "${requirement.title}" has been rejected. Reason: ${reason}`,
      data: { entityType: 'REQUIREMENT', entityId: requirement._id, link: `/buyer/requirements/${requirement._id}` },
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'REQUIREMENT_REJECTED',
      entityType: 'REQUIREMENT',
      entityId: requirement._id,
      description: `Requirement "${requirement.title}" rejected. Reason: ${reason}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, requirement, 'Requirement rejected.');
  } catch (error) {
    next(error);
  }
};

// Request revision
exports.requestRevision = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return ApiResponse.badRequest(res, 'Revision reason is required.');

    const requirement = await ProcurementRequirement.findById(req.params.id);
    if (!requirement) return ApiResponse.notFound(res, 'Requirement not found.');

    if (requirement.status !== 'PENDING_REVIEW') {
      return ApiResponse.badRequest(res, 'Only pending review requirements can be sent for revision.');
    }

    requirement.status = 'REVISION_REQUIRED';
    requirement.review = {
      reviewedBy: req.user._id,
      action: 'REQUEST_REVISION',
      reason,
      reviewedAt: new Date(),
    };
    requirement.reviewHistory.push({
      reviewedBy: req.user._id,
      action: 'REQUEST_REVISION',
      reason,
    });
    await requirement.save();

    await NotificationService.create({
      recipient: requirement.buyer,
      type: 'REQUIREMENT_REVISION',
      title: 'Revision Requested',
      message: `Revision requested for "${requirement.title}". Reason: ${reason}`,
      data: { entityType: 'REQUIREMENT', entityId: requirement._id, link: `/buyer/requirements/${requirement._id}` },
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'REQUIREMENT_REVISION_REQUESTED',
      entityType: 'REQUIREMENT',
      entityId: requirement._id,
      description: `Revision requested for "${requirement.title}". Reason: ${reason}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.success(res, requirement, 'Revision requested.');
  } catch (error) {
    next(error);
  }
};
