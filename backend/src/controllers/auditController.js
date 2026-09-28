const AuditLog = require('../models/AuditLog');
const AuditService = require('../services/auditService');
const ApiResponse = require('../utils/ApiResponse');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, actor, role, action, entityType, entityId, startDate, endDate } = req.query;
    const result = await AuditService.getAuditLogs(
      { actor, role, action, entityType, entityId, startDate, endDate },
      parseInt(page),
      parseInt(limit)
    );
    return ApiResponse.paginated(res, result.logs, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

exports.getAuditLogById = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('actor', 'name email role');
    if (!log) return ApiResponse.notFound(res, 'Audit log not found.');
    return ApiResponse.success(res, log);
  } catch (error) {
    next(error);
  }
};
