/* ==========================================================================
   ROUTES/SKORLAR.JS
   Oyun skorları endpoint'leri (JSON DB Edition)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ── POST /api/skorlar ────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { profilId, oyun, dogru = 0, yanlis = 0 } = req.body;

  if (!profilId || !oyun) {
    return res.status(400).json({ hata: 'profilId ve oyun zorunludur' });
  }

  const gecerliOyunlar = ['diskalkuli', 'disleksi'];
  if (!gecerliOyunlar.includes(oyun)) {
    return res.status(400).json({ hata: `oyun 'diskalkuli' veya 'disleksi' olmalıdır` });
  }

  const profil = db.getProfil(profilId);
  if (!profil) {
    return res.status(404).json({ hata: 'Profil bulunamadı' });
  }

  const yeniSkor = db.insertSkor({ profilId, oyun, dogru, yanlis });
  res.status(201).json(yeniSkor);
});

// ── GET /api/skorlar/:profilId ───────────────────────────────────────────────
router.get('/:profilId', (req, res) => {
  const { profilId } = req.params;
  const { oyun } = req.query;

  if (oyun) {
    const kayitlar = db.getSkorlar(profilId, oyun);
    return res.json(kayitlar);
  }

  const istatistikler = db.getSkorIstatistikler(profilId);
  res.json(istatistikler);
});

module.exports = router;
