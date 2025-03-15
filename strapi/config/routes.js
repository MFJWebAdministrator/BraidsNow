module.exports = [
  {
    method: "POST",
    path: "/webhooks/stripe",
    handler: "webhooks.stripeWebhook",
    config: { auth: false },
  },
];
