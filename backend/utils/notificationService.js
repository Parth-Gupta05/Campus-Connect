const Notification = require('../models/Notification');

/**
 * Creates and saves a new notification.
 * 
 * @param {Object} params
 * @param {ObjectId} params.recipient - ID of the recipient (User or Club)
 * @param {String} params.recipientModel - 'User' or 'Club'
 * @param {String} params.type - enum value
 * @param {String} params.title - Title of the notification
 * @param {String} params.message - Body text
 * @param {String} [params.link] - Optional link to navigate to
 * @param {ObjectId} [params.sender] - Optional ID of the sender
 * @param {String} [params.senderModel] - 'User' or 'Club'
 */
const createNotification = async ({
  recipient,
  recipientModel,
  type,
  title,
  message,
  link,
  sender,
  senderModel
}) => {
  try {
    const notification = new Notification({
      recipient,
      recipientModel,
      type,
      title,
      message,
      link,
      sender,
      senderModel
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    // We don't want to break the main flow if a notification fails
    return null;
  }
};

/**
 * Broadcasts a notification to multiple recipients.
 * Useful for announcements.
 */
const broadcastNotification = async (recipients, recipientModel, notificationData) => {
  try {
    const notifications = recipients.map(recipient => ({
      ...notificationData,
      recipient,
      recipientModel
    }));
    
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error broadcasting notifications:', error);
  }
};

module.exports = {
  createNotification,
  broadcastNotification
};
