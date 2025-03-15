module.exports = {
  async stripeWebhook(ctx) {
    try {
      const event = ctx.request.body;

      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;
          await strapi.services.subscription.create({
            stripeCustomerId: session.customer,
            status: "active",
            email: session.customer_email,
          });
          break;

        case "customer.subscription.deleted":
          await strapi.services.subscription.update(
            { stripeCustomerId: event.data.object.customer },
            { status: "canceled" }
          );
          break;
      }

      ctx.send({ received: true });
    } catch (err) {
      ctx.throw(400, `Webhook error: ${err.message}`);
    }
  },
};
