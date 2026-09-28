const Notification = require('../models/Notification');

class NotificationService {
  static io = null;

  static setIO(io) {
    NotificationService.io = io;
  }

  static async create({ recipient, type, title, message, data }) {
    try {
      const notification = await Notification.create({
        recipient,
        type,
        title,
        message,
        data,
      });

      // Emit real-time notification if socket is available
      if (NotificationService.io) {
        NotificationService.io.to(`user:${recipient}`).emit('notification:new', notification);
      }

      return notification;
    } catch (error) {
      console.error('Notification creation failed:', error.message);
    }
  }

  static async createBulk(notifications) {
    try {
      const created = await Notification.insertMany(notifications);
      
      // Emit to each recipient
      if (NotificationService.io) {
        created.forEach(n => {
          NotificationService.io.to(`user:${n.recipient}`).emit('notification:new', n);
        });
      }

      return created;
    } catch (error) {
      console.error('Bulk notification creation failed:', error.message);
    }
  }

  static async getUserNotifications(userId, page = 1, limit = 20) {
    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { notifications, total, unreadCount, page, limit };
  }

  static async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  static async markAllAsRead(userId) {
    return Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }
}

module.exports = NotificationService;
