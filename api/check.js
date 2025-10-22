export default function handler(req, res) {
  const { valor } = req.query;

  if (!valor) {
    return res.status(400).json({ error: "Falta el parámetro 'valor'" });
  }

  if (valor === "freduk") {
    res.status(200).json({ ok: true, mensaje: "✅ Valor verificado correctamente" });
  } else {
    res.status(200).json({ ok: false, mensaje: "❌ Valor incorrecto o no reconocido" });
  }
}
