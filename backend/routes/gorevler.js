/* ==========================================================================
   ROUTES/GOREVLER.JS
   Günlük yapılacaklar listesi endpoint'leri (JSON DB Edition)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

function bugunTarih() {
  const bugun = new Date();
  return bugun.toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

// ── GET /api/gorevler/:profilId ──────────────────────────────────────────────
router.get('/:profilId', (req, res) => {
  const tarih = req.query.tarih || bugunTarih();
  const gorevler = db.getGorevler(req.params.profilId, tarih);
  res.json(gorevler);
});

// ── POST /api/gorevler ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { profilId, metin, tarih } = req.body;

  if (!profilId || !metin || metin.trim() === '') {
    return res.status(400).json({ hata: 'profilId ve metin zorunludur' });
  }

  const profil = db.getProfil(profilId);
  if (!profil) {
    return res.status(404).json({ hata: 'Profil bulunamadı' });
  }

  const gununTarihi = tarih || bugunTarih();
  const yeniGorev = db.insertGorev({
    profilId,
    metin: metin.trim(),
    tarih: gununTarihi
  });

  res.status(201).json(yeniGorev);
});

// ── PUT /api/gorevler/:id ────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const guncel = db.updateGorev(req.params.id, {
    tamam: req.body.tamam,
    metin: req.body.metin
  });

  if (!guncel) {
    return res.status(404).json({ hata: 'Görev bulunamadı' });
  }

  res.json(guncel);
});

// ── DELETE /api/gorevler/:id ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const basarili = db.deleteGorev(req.params.id);
  if (!basarili) {
    return res.status(404).json({ hata: 'Görev bulunamadı' });
  }
  res.json({ mesaj: 'Görev silindi' });
});

module.exports = router;
