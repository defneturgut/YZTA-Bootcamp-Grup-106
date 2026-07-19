/* ==========================================================================
   ROUTES/DUYGU.JS
   Günlük duygu kaydı endpoint'leri (JSON DB Edition)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ── POST /api/duygu ──────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { profilId, emoji, metin } = req.body;

  if (!profilId || !emoji || !metin) {
    return res.status(400).json({ hata: 'profilId, emoji ve metin zorunludur' });
  }

  // Profil var mı kontrol et
  const profil = db.getProfil(profilId);
  if (!profil) {
    return res.status(404).json({ hata: 'Profil bulunamadı' });
  }

  const yeniKayit = db.insertDuygu({ profilId, emoji, metin });
  res.status(201).json(yeniKayit);
});

// ── GET /api/duygu/:profilId ─────────────────────────────────────────────────
router.get('/:profilId', (req, res) => {
  const kayitlar = db.getDuygular(req.params.profilId);
  res.json(kayitlar);
});

module.exports = router;
