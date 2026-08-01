/* ==========================================================================
   ROUTES/ONEMLIGUNLER.JS
   Önemli günler (doğum günü, özel gün vb.) endpoint'leri (JSON DB Edition)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/onemli-gunler/:profilId ─────────────────────────────────────────
router.get('/:profilId', (req, res) => {
  const gunler = db.getOnemliGunler(req.params.profilId);
  res.json(gunler);
});

// ── POST /api/onemli-gunler ───────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { profilId, baslik, tarih } = req.body;

  if (!profilId || !baslik || baslik.trim() === '' || !tarih) {
    return res.status(400).json({ hata: 'profilId, baslik ve tarih zorunludur' });
  }

  const profil = db.getProfil(profilId);
  if (!profil) {
    return res.status(404).json({ hata: 'Profil bulunamadı' });
  }

  const yeniGun = db.insertOnemliGun({
    profilId,
    baslik: baslik.trim(),
    tarih
  });

  res.status(201).json(yeniGun);
});

// ── DELETE /api/onemli-gunler/:id ─────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const basarili = db.deleteOnemliGun(req.params.id);
  if (!basarili) {
    return res.status(404).json({ hata: 'Önemli gün bulunamadı' });
  }
  res.json({ mesaj: 'Önemli gün silindi' });
});

module.exports = router;
