// Load environment variables
require("dotenv").config();

const { setGlobalOptions } = require("firebase-functions");

// Set global options
setGlobalOptions({ maxInstances: 10 });

// Import all function modules
const dailyContent = require("./content/dailyContent");
const moderation = require("./content/moderation");
const pleaNotifications = require("./notifications/pleas");
const encouragementNotifications = require("./notifications/encouragements");
const messageNotifications = require("./notifications/messages");
const streakNotifications = require("./notifications/streaks");
const accountabilityNotifications = require("./notifications/accountability");
const checkIns = require("./accountability/checkIns");
const invites = require("./accountability/invites");
const blockFunctions = require("./user/blocks");
const streakFunctions = require("./user/streaks");
const userDeletion = require("./user/deletion");
const organizationFunctions = require("./user/organization");
const adminOrganization = require("./admin/organization");
const adminOrganizationInvites = require("./admin/organizationInvites");

// Export all functions
module.exports = {
  // Daily Content
  ...dailyContent,

  // Moderation
  ...moderation,

  // Notifications - Pleas
  ...pleaNotifications,

  // Notifications - Encouragements
  ...encouragementNotifications,

  // Notifications - Messages
  ...messageNotifications,

  // Notifications - Streaks
  ...streakNotifications,

  // Notifications - Accountability
  ...accountabilityNotifications,

  // Accountability - Check-ins
  ...checkIns,

  // Accountability - Invites
  ...invites,

  // User - Blocks
  ...blockFunctions,

  // User - Streaks
  ...streakFunctions,

  // User - Deletion
  ...userDeletion,

  // User - Organization
  ...organizationFunctions,

  // Admin - Organization
  ...adminOrganization,

  // Admin - Organization Invites
  ...adminOrganizationInvites,
};
