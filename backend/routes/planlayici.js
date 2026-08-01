/* ==========================================================================
   ROUTES/PLANLAYICI.JS
   AI Gün Planlayıcı'nın önerdiği saatli plan maddeleri için endpoint'ler.
   Günlük sabit rutin görevlerden (routes/gorevler.js) farklı olarak, burada
   her maddenin bir tarihi ve saati vardır (JSON DB Edition)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/planlayici/:profilId ────────────────────────────────────────────
router.get('/:profilId', (req, res) => {
  const maddeler = db.getPlanlanmisGorevler(req.params.profilId);
  res.json(maddeler);
});

// ── POST /api/planlayici ─────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { profilId, tarih, saat, etkinlik, sure } = req.body;

  if (!profilId || !tarih || !saat || !etkinlik || etkinlik.trim() === '') {
    return res.status(400).json({ hata: 'profilId, tarih, saat ve etkinlik zorunludur' });
  }

  const profil = db.getProfil(profilId);
  if (!profil) {
    return res.status(404).json({ hata: 'Profil bulunamadı' });
  }

  const yeniMadde = db.insertPlanlanmisGorev({
    profilId,
    tarih,
    saat,
    etkinlik: etkinlik.trim(),
    sure
  });

  res.status(201).json(yeniMadde);
});

// ── DELETE /api/planlayici/:id ───────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const basarili = db.deletePlanlanmisGorev(req.params.id);
  if (!basarili) {
    return res.status(404).json({ hata: 'Plan maddesi bulunamadı' });
  }
  res.json({ mesaj: 'Plan maddesi silindi' });
});

module.exports = router;
