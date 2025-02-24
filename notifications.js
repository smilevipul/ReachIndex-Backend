const axios = require("axios");

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

async function sendSlackNotification(email) {
  if (!SLACK_WEBHOOK_URL) return;

  const message = {
    text: `📧 *New Interested Email Received!*\n*From:* ${email.from}\n*Subject:* ${email.subject}\n*Category:* ${email.category}`,
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, message);
    console.log("Slack notification sent.");
  } catch (err) {
    console.error("Error sending Slack notification:", err.message);
  }
}

async function triggerWebhook(email) {
  if (!WEBHOOK_URL) return;

  try {
    await axios.post(WEBHOOK_URL, email);
    console.log("Webhook triggered.");
  } catch (err) {
    console.error("Error triggering webhook:", err.message);
  }
}

module.exports = { sendSlackNotification, triggerWebhook };
