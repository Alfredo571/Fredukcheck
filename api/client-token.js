// api/client-token.js
const braintree = require("braintree");

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

module.exports = async (req, res) => {
  try {
    const response = await gateway.clientToken.generate({});
    res.status(200).json({ ok: true, clientToken: response.clientToken });
  } catch (err) {
    console.error("client-token error", err);
    res.status(500).json({ ok: false, msg: "No se pudo generar client token" });
  }
};
