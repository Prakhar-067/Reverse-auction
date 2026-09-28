const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');

class AuditService {
  static async log({ actor, actorName, role, action, entityType, entityId, description, oldValue, newValue, ipAddress, userAgent, metadata }) {
    try {
      const validActor = (actor && mongoose.Types.ObjectId.isValid(actor)) ? actor : null;
      await AuditLog.create({
        actor: validActor,
        actorName: actorName || 'System',
        role: role || 'SYSTEM',
        action,
        entityType,
        entityId,
        description,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
        metadata,
      });
    } catch (error) {
      console.error('Audit log creation failed:', error.message);
    }
  }

  static async getAuditLogs(filters = {}, page = 1, limit = 20) {
    const query = {};

    if (filters.actor && mongoose.Types.ObjectId.isValid(filters.actor)) query.actor = filters.actor;
    if (filters.role) query.role = filters.role;
    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId && mongoose.Types.ObjectId.isValid(filters.entityId)) query.entityId = filters.entityId;

    if (filters.search) {
      query.$or = [
        { description: { $regex: filters.search, $options: 'i' } },
        { actorName: { $regex: filters.search, $options: 'i' } },
        { action: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const total = await AuditLog.countDocuments(query);
    const rawLogs = await AuditLog.find(query)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { logs: rawLogs, total, page, limit };
  }
}

module.exports = AuditService;
