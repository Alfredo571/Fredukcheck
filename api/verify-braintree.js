// api/verify-braintree.js
const braintree = require("braintree");

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, msg: "Método no permitido" });
  }

  try {
    const { paymentMethodNonce } = req.body;
    if (!paymentMethodNonce) {
      return res.status(400).json({ ok: false, msg: "Falta paymentMethodNonce" });
    }

    // Crea un método de pago temporal y fuerza verificación.
    // NOTA: no usamos customerId permanente (sandbox demo).
    const result = await gateway.paymentMethod.create({
      customerId: "freduk_temp_customer_" + Date.now(), // temporal
      paymentMethodNonce,
      options: {
        verifyCard: true,     // importante: forzar verificación
        verificationMerchantAccountId: undefined
      }
    });

    if (result.success) {
      const verification = result.paymentMethod.verification || result.paymentMethod.verifications?.[0];
      const status = verification ? verification.status : "unknown";

      return res.status(200).json({
        ok: true,
        estado: "Live",
        detalle: verification ? verification.processorResponseText || verification.status : "verified",
        raw: verification || null
      });
    } else {
      // result.message contiene info de fallo
      return res.status(200).json({
        ok: false,
        estado: "Dead",
        msg: result.message || "Rechazada o no verificada",
        raw: result
      });
    }
  } catch (err) {
    console.error("verify-braintree error:", err);
    return res.status(500).json({ ok: false, msg: "Error interno" });
  }
};
