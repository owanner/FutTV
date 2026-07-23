/**
 * Match status constants.
 * Used across routes, cron jobs, and services to avoid magic numbers.
 */
const STATUS = {
  FINISHED: 0,
  SCHEDULED: 1,
  LIVE: 3,
  CANCELLED: 4
};

module.exports = { STATUS };
