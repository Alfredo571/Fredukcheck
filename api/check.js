// /api/check.js — Freduk CheckApp API
// Valida hasta 20 tarjetas por lote usando Luhn + clasificación simulada

export default async function handler(req, res) {
  try {
    // Leer parámetro ?value= o body JSON
    let values = [];
    const binsParam = req.query.bins || null;

    if (req.method === "POST") {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const bodyStr = Buffer.concat(buffers).toString();
      try {
        const body = JSON.parse(bodyStr);
        if (Array.isArray(body.values)) values = body.values;
      } catch {
        return res.status(400).json({ ok: false, error: "JSON inválido" });
      }
    } else if (req.method === "GET") {
      const q = req.query.value || req.query.valor || req.query.values;
      if (!q)
        return res
          .status(400)
          .json({ ok: false, error: "Falta parámetro 'value' o 'valor'" });
      if (Array.isArray(q)) values = q;
      else values = String(q)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      return res.status(405).json({ ok: false, error: "Método no permitido" });
    }

    // Limitar a 20
    values = values.slice(0, 20);

    // BINs válidos (opcional)
    const binsAceptados = binsParam
      ? new Set(
          String(binsParam)
            .split(",")
            .map((b) => b.trim())
            .filter((b) => b.length === 6)
        )
      : null;

    // --- Funciones auxiliares ---
    function isValidLuhn(number) {
      const clean = number.replace(/\D/g, "");
      let sum = 0;
      let alt = false;
      for (let i = clean.length - 1; i >= 0; i--) {
        let n = parseInt(clean[i], 10);
        if (alt) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
      }
      return sum % 10 === 0;
    }

    function detectBrand(num) {
      if (!/^\d+$/.test(num)) return "Unknown";
      if (/^3[47]/.test(num)) return "American Express";
      if (/^3(?:0[0-5]|[68][0-9])/.test(num)) return "Diners Club";
      if (/^4/.test(num)) return "Visa";
      if (/^(5[1-5])/.test(num) || /^(22[2-9]|2[3-6]\d|27[01]|2720)/.test(num))
        return "MasterCard";
      if (/^6011|^65|^64[4-9]/.test(num)) return "Discover";
      if (/^35(2[89]|[3-8]\d)/.test(num)) return "JCB";
      if (/^(5[06-9]|6[0-9])/.test(num)) return "Maestro/Other";
      return "Unknown";
    }

    function maskNumber(num) {
      const n = String(num);
      const first6 = n.slice(0, 6);
      const last4 = n.slice(-4);
      const middle = "*".repeat(Math.max(0, n.length - 10));
      return `${first6}${middle}${last4}`;
    }

    // --- Procesar tarjetas ---
    const resultados = [];

    for (const raw of values) {
      const tarjeta = String(raw).split("|")[0].trim();
      const bin = tarjeta.slice(0, 6);

      if (!/^\d{13,19}$/.test(tarjeta)) {
        resultados.push({
          tarjeta,
          estado: "❌ Inválida (formato incorrecto)",
        });
        continue;
      }

      if (!isValidLuhn(tarjeta)) {
        resultados.push({
          tarjeta,
          estado: "❌ Inválida (Luhn)",
        });
        continue;
      }

      if (binsAceptados && !binsAceptados.has(bin)) {
        resultados.push({
          tarjeta,
          estado: `⚠️ BIN no permitido (${bin})`,
        });
        continue;
      }

      // Detección de marca
      const brand = detectBrand(tarjeta);
      const masked = maskNumber(tarjeta);

      // Simulación de resultados
      const r = Math.random();
      let estado = "";
      if (r < 0.2) estado = "✅ Live | [Charge $4.99] [GATE:01]";
      else if (r < 0.9) estado = "❌ Dead | [Charge $0.00] [GATE:01]";
      else estado = "⚠️ Unknown | [Charge N/D] [GATE:01]";

      resultados.push({
        tarjeta: masked,
        bin,
        brand,
        estado,
      });
    }

    // Responder
    return res.status(200).json({
      ok: true,
      total: resultados.length,
      resultados,
      note:
        "Freduk CheckApp — Validación Luhn y simulación Live/Dead/Unknown. No usar con tarjetas reales.",
    });
  } catch (err) {
    console.error("Error interno:", err);
    return res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
}
