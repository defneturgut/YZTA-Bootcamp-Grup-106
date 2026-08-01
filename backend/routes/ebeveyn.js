/* ==========================================================================
   ROUTES/EBEVEYN.JS
   Ebeveyn paneli için PIN doğrulama endpoint'i.
   PIN artık .env dosyasında (EBEVEYN_PIN) saklanır —
   client-side kodda hiçbir zaman görünmez.
   ========================================================================== */

const express = require('express');
const router = express.Router();

// ── POST /api/ebeveyn/pin-dogrula ────────────────────────────────────────────
router.post('/pin-dogrula', (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ hata: 'PIN zorunludur' });
  }

  const dogruPin = process.env.EBEVEYN_PIN || '1234';

  if (String(pin) === dogruPin) {
    return res.json({ basarili: true });
  }

  // Hatalı PIN — HTTP 401 ve basarili: false
  res.status(401).json({ basarili: false, hata: 'Hatalı PIN kodu' });
});

module.exports = router;
