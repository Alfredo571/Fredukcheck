export default function handler(req, res) {
  const { value } = req.query;

  if (!value) {
    return res.status(400).json({ ok: false, msg: "Falta el parámetro 'value'" });
  }

  // Algoritmo de Luhn
  function validarLuhn(num) {
    let suma = 0;
    let alternar = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num[i]);
      if (alternar) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      suma += n;
      alternar = !alternar;
    }
    return suma % 10 === 0;
  }

  const limpio = value.replace(/\s+/g, '');
  const esNumero = /^[0-9]{13,19}$/.test(limpio);

  if (!esNumero) {
    return res.status(200).json({ ok: true, input: value, resultado: "❌ No parece un número de tarjeta válido" });
  }

  const valido = validarLuhn(limpio);
  const resultado = valido
    ? "✅ Tarjeta válida según el algoritmo de Luhn"
    : "❌ Tarjeta inválida";

  res.status(200).json({ ok: true, input: value, resultado });
}
