/* ==========================================================================
   SERVER.JS
   "Benim Dünyam" Express REST API sunucusu.
   
   Başlatmak için:
     node server.js          (production)
     npm run dev             (geliştirme — nodemon ile otomatik yeniden başlatma)
   
   Varsayılan adres: http://localhost:3001
   ========================================================================== */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

// Veritabanını başlat (tablolar yoksa oluşturulur)
require('./db');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ------------------------------------------------------------------
   MIDDLEWARE
   ------------------------------------------------------------------ */

// CORS: Frontend dosyaları file:// protokolü veya localhost'tan açılabilir
app.use(cors({
  origin: (origin, callback) => {
    // null (file:// protokolü), localhost:* veya 127.0.0.1:* izinli
    if (!origin || origin === 'null' || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} adresine izin verilmiyor`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

/* ------------------------------------------------------------------
   ROUTE'LAR
   ------------------------------------------------------------------ */
app.use('/api/profil',    require('./routes/profil'));
app.use('/api/duygu',     require('./routes/duygu'));
app.use('/api/gorevler',  require('./routes/gorevler'));
app.use('/api/skorlar',   require('./routes/skorlar'));

/* ------------------------------------------------------------------
   SAĞLIK KONTROLÜ
   ------------------------------------------------------------------ */
app.get('/api/saglik', (_req, res) => {
  res.json({ durum: 'ok', zaman: new Date().toISOString() });
});

/* ------------------------------------------------------------------
   404 ve HATA YAKALAMA
   ------------------------------------------------------------------ */
app.use((_req, res) => {
  res.status(404).json({ hata: 'Sayfa bulunamadı' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌ Sunucu hatası:', err.message);
  res.status(500).json({ hata: 'Sunucu hatası', detay: err.message });
});

/* ------------------------------------------------------------------
   SUNUCUYU BAŞLAT
   ------------------------------------------------------------------ */
app.listen(PORT, () => {
  console.log(`🚀 Benim Dünyam API → http://localhost:${PORT}`);
  console.log(`   Sağlık kontrolü  → http://localhost:${PORT}/api/saglik`);
});
