/* ==========================================================================
   ROUTES/PROFIL.JS
   Çocuk profili CRUD endpoint'leri (JSON DB Edition)
   ========================================================================== */

const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/profil/:id ──────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const profil = db.getProfil(req.params.id);

  if (!profil) {
    return res.status(404).json({ hata: 'Profil bulunamadı' });
  }
  res.json(profil);
});

// ── POST /api/profil ─────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { isim, avatar = '🙂', renk = '#a8d8c8' } = req.body;

  if (!isim || isim.trim() === '') {
    return res.status(400).json({ hata: 'İsim boş olamaz' });
  }

  const yeniProfil = db.insertProfil({
    isim: isim.trim(),
    avatar,
    renk
  });

  res.status(201).json(yeniProfil);
});

// ── PUT /api/profil/:id ──────────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const mevcut = db.getProfil(req.params.id);

  if (!mevcut) {
    return res.status(404).json({ hata: 'Profil bulunamadı' });
  }

  const isim = req.body.isim !== undefined ? req.body.isim.trim() : undefined;
  if (isim === '') {
    return res.status(400).json({ hata: 'İsim boş olamaz' });
  }

  const guncel = db.updateProfil(req.params.id, {
    isim,
    avatar: req.body.avatar,
    renk: req.body.renk
  });

  res.json(guncel);
});

module.exports = router;
