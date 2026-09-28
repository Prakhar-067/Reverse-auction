const Notification = require('../models/Notification');
const NotificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await NotificationService.getUserNotifications(req.user._id, page, limit);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
    if (!notification) return ApiResponse.notFound(res, 'Notification not found.');
    return ApiResponse.success(res, notification);
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user._id);
    return ApiResponse.success(res, null, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
};
