// /api/check.js
export default async function handler(req, res) {
  const MAX_ITEMS = 20;

  // Leer valores: POST JSON { values: [...] } o GET ?value=card1,card2,...
  let values = [];
  if (req.method === "POST") {
    try {
      const body = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => (data += chunk));
        req.on("end", () => {
          try { resolve(JSON.parse(data || "{}")); }
          catch(e){ reject(e); }
        });
        req.on("error", reject);
      });
      if (body && Array.isArray(body.values)) values = body.values;
    } catch (err) {
      return res.status(400).json({ ok: false, error: "Cuerpo JSON inválido" });
    }
  } else if (req.method === "GET") {
    const q = req.query && (req.query.value || req.query.values || req.query.valor);
    if (!q) return res.status(400).json({ ok: false, error: "Falta parámetro 'value' (GET) o body.values (POST)" });
    if (Array.isArray(q)) values = q; // raro, pero por compatibilidad
    else values = String(q).split(",").map(s => s.trim()).filter(Boolean);
  } else {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  if (!Array.isArray(values) || values.length === 0) {
    return res.status(400).json({ ok: false, error: "No se recibieron valores" });
  }
  if (values.length > MAX_ITEMS) values = values.slice(0, MAX_ITEMS);

  // Helpers
  const normalize = s => String(s).replace(/\s|-/g, "");
  function validarLuhn(number) {
    const n = String(number);
    let sum = 0;
    let double = false;
    for (let i = n.length - 1; i >= 0; i--) {
      let d = parseInt(n[i], 10);
      if (Number.isNaN(d)) return false;
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    return sum % 10 === 0;
  }
  function maskNumber(num) {
    const n = String(num);
    if (n.length <= 6) return n.replace(/\d/g, "*");
    const first6 = n.slice(0,6);
    const last4 = n.length > 10 ? n.slice(-4) : "";
    const middle = "*".repeat(Math.max(0, n.length - 6 - last4.length));
    return `${first6}${middle}${last4}`;
  }

  // Procesar valores (serie, para no saturar)
  const results = [];
  for (const raw of values) {
    const n = normalize(raw);
    const okFormat = /^\d{13,19}$/.test(n); // tarjeta típica 13-19 dígitos
    let luhn = false;
    let resultado = "";

    if (!okFormat) {
      resultado = "❌ Formato inválido (se esperan 13-19 dígitos)";
    } else {
      luhn = validarLuhn(n);
      resultado = luhn ? "✅ Tarjeta válida según Luhn" : "❌ Tarjeta inválida";
    }

    results.push({
      masked: maskNumber(n),
      length: n.length,
      luhn,
      resultado
    });

    // breve pausa para cortesía (no necesaria, pero evita ráfagas)
    await new Promise(r => setTimeout(r, 50));
  }

  return res.status(200).json({
    ok: true,
    count: results.length,
    results,
    note: "Usa solo números de prueba o tus propios datos. No pruebes tarjetas de terceros sin permiso."
  });
}
