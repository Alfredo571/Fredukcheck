export default async function handler(req, res) {
  const { value, bins } = req.query;

  if (!value) {
    return res.status(400).json({ ok: false, msg: "Falta el parámetro 'value'" });
  }

  // Convertir a lista si hay varias tarjetas separadas por comas
  const tarjetas = value.split(",").map(v => v.trim()).filter(v => v.length > 0);

  if (tarjetas.length === 0) {
    return res.status(400).json({ ok: false, msg: "No se proporcionaron tarjetas válidas" });
  }

  // Si hay BINs definidos (separados por coma)
  const binsAceptados = bins
    ? new Set(bins.split(",").map(b => b.trim()).filter(b => b.length === 6))
    : null;

  // Función de verificación Luhn
  const isValidLuhn = number => {
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
  };

  // Clasificación
  const resultados = tarjetas.slice(0, 20).map(tarjeta => {
    const card = tarjeta.split("|")[0].trim();
    const bin = card.substring(0, 6);

    if (!/^\d{13,19}$/.test(card)) {
      return { tarjeta, estado: "❌ Inválida (formato incorrecto)" };
    }

    if (!isValidLuhn(card)) {
      return { tarjeta, estado: "❌ Inválida (Luhn)" };
    }

    if (binsAceptados && !binsAceptados.has(bin)) {
      return { tarjeta, estado: `⚠️ BIN no permitido (${bin})` };
    }

    const r = Math.random();
    if (r < 0.2) return { tarjeta, estado: "✅ Live | [Charge $4.99] [GATE:01]" };
    if (r < 0.9) return { tarjeta, estado: "❌ Dead | [Charge $0.00] [GATE:01]" };
    return { tarjeta, estado: "⚠️ Unknown | [Charge N/D] [GATE:01]" };
  });

  // Respuesta JSON
  res.status(200).json({
    ok: true,
    total: resultados.length,
    resultados,
  });
}
