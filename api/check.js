export default function handler(req, res) {
  const { value } = req.query;

  if (!value) {
    return res.status(400).json({ ok: false, msg: "Falta el parámetro 'value'" });
  }

  // Verificar si es un número de tarjeta (solo dígitos)
  const cleanValue = value.replace(/\s+/g, "");
  if (!/^\d{13,19}$/.test(cleanValue)) {
    return res.status(200).json({ ok: false, input: value, resultado: "❌ Formato de tarjeta inválido" });
  }

  // Algoritmo de Luhn
  const digits = cleanValue.split("").map(Number);
  const checksum = digits
    .reverse()
    .map((d, i) => (i % 2 ? (d * 2 > 9 ? d * 2 - 9 : d * 2) : d))
    .reduce((a, b) => a + b, 0);

  const isValid = checksum % 10 === 0;

  res.status(200).json({
    ok: true,
    input: value,
    resultado: isValid
      ? "✅ Tarjeta válida según el algoritmo de Luhn"
      : "❌ Tarjeta inválida según el algoritmo de Luhn",
  });
}
