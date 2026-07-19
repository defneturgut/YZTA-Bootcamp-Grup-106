/* ==========================================================================
   DB.JS (JSON File Database Edition)
   Pure JavaScript, zero native dependencies, immune to compilation errors.
   ========================================================================== */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// SQLite DB path'ini .json dosyasına çevirelim ya da direkt benim_dunyam.json yapalım
const dbPath = path.resolve(process.env.DB_PATH ? process.env.DB_PATH.replace('.db', '.json') : './benim_dunyam.json');

const defaultData = {
  profiller: [],
  duygu_kayitlari: [],
  gorevler: [],
  oyun_skorlari: [],
  nextIds: {
    profiller: 1,
    duygu_kayitlari: 1,
    gorevler: 1,
    oyun_skorlari: 1
  }
};

function readDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("DB okuma hatası, sıfırlanıyor:", err);
    return defaultData;
  }
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── PROFIL ─────────────────────────────────────────────────────────────────
function getProfil(id) {
  const db = readDB();
  return db.profiller.find(p => p.id === Number(id)) || null;
}

function insertProfil({ isim, avatar, renk }) {
  const db = readDB();
  const id = db.nextIds.profiller++;
  const yeniProfil = {
    id,
    isim,
    avatar,
    renk,
    olusturulma: new Date().toISOString()
  };
  db.profiller.push(yeniProfil);
  writeDB(db);
  return yeniProfil;
}

function updateProfil(id, { isim, avatar, renk }) {
  const db = readDB();
  const index = db.profiller.findIndex(p => p.id === Number(id));
  if (index === -1) return null;
  
  db.profiller[index] = {
    ...db.profiller[index],
    isim: isim !== undefined ? isim : db.profiller[index].isim,
    avatar: avatar !== undefined ? avatar : db.profiller[index].avatar,
    renk: renk !== undefined ? renk : db.profiller[index].renk
  };
  writeDB(db);
  return db.profiller[index];
}

// ─── DUYGU ──────────────────────────────────────────────────────────────────
function insertDuygu({ profilId, emoji, metin }) {
  const db = readDB();
  const id = db.nextIds.duygu_kayitlari++;
  const yeniKayit = {
    id,
    profil_id: Number(profilId),
    emoji,
    metin,
    tarih: new Date().toISOString()
  };
  db.duygu_kayitlari.push(yeniKayit);
  writeDB(db);
  return yeniKayit;
}

function getDuygular(profilId) {
  const db = readDB();
  // Son 30 günün kayıtları
  const otuzGunOnce = new Date();
  otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);
  
  return db.duygu_kayitlari
    .filter(d => d.profil_id === Number(profilId) && new Date(d.tarih) >= otuzGunOnce)
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
}

// ─── GOREVLER ───────────────────────────────────────────────────────────────
function getGorevler(profilId, tarih) {
  const db = readDB();
  return db.gorevler.filter(g => g.profil_id === Number(profilId) && g.tarih === tarih);
}

function insertGorev({ profilId, metin, tarih }) {
  const db = readDB();
  const id = db.nextIds.gorevler++;
  const yeniGorev = {
    id,
    profil_id: Number(profilId),
    metin,
    tamam: 0,
    tarih
  };
  db.gorevler.push(yeniGorev);
  writeDB(db);
  return yeniGorev;
}

function updateGorev(id, { tamam, metin }) {
  const db = readDB();
  const index = db.gorevler.findIndex(g => g.id === Number(id));
  if (index === -1) return null;

  if (tamam !== undefined) db.gorevler[index].tamam = tamam ? 1 : 0;
  if (metin !== undefined) db.gorevler[index].metin = metin;

  writeDB(db);
  return db.gorevler[index];
}

function deleteGorev(id) {
  const db = readDB();
  const index = db.gorevler.findIndex(g => g.id === Number(id));
  if (index === -1) return false;
  
  db.gorevler.splice(index, 1);
  writeDB(db);
  return true;
}

// ─── SKORLAR ────────────────────────────────────────────────────────────────
function insertSkor({ profilId, oyun, dogru, yanlis }) {
  const db = readDB();
  const id = db.nextIds.oyun_skorlari++;
  const yeniSkor = {
    id,
    profil_id: Number(profilId),
    oyun,
    dogru: Number(dogru),
    yanlis: Number(yanlis),
    tarih: new Date().toISOString()
  };
  db.oyun_skorlari.push(yeniSkor);
  writeDB(db);
  return yeniSkor;
}

function getSkorlar(profilId, oyun) {
  const db = readDB();
  return db.oyun_skorlari
    .filter(s => s.profil_id === Number(profilId) && s.oyun === oyun)
    .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))
    .slice(0, 20); // son 20 kayıt
}

function getSkorIstatistikler(profilId) {
  const db = readDB();
  const oyunlar = ['diskalkuli', 'disleksi'];
  const sonuclar = [];

  for (const oyun of oyunlar) {
    const oyunSkorlari = db.oyun_skorlari.filter(s => s.profil_id === Number(profilId) && s.oyun === oyun);
    if (oyunSkorlari.length === 0) continue;

    const oturumSayisi = oyunSkorlari.length;
    const toplamDogru = oyunSkorlari.reduce((sum, s) => sum + s.dogru, 0);
    const toplamYanlis = oyunSkorlari.reduce((sum, s) => sum + s.yanlis, 0);
    const toplamSoru = toplamDogru + toplamYanlis;
    const basariYuzdesi = toplamSoru > 0 ? Number((100.0 * toplamDogru / toplamSoru).toFixed(1)) : 0;

    sonuclar.push({
      oyun,
      oturum_sayisi: oturumSayisi,
      toplam_dogru: toplamDogru,
      toplam_yanlis: toplamYanlis,
      basari_yuzdesi: basariYuzdesi
    });
  }

  return sonuclar;
}

console.log(`✅ JSON Veritabanı hazır: ${dbPath}`);

module.exports = {
  getProfil,
  insertProfil,
  updateProfil,
  insertDuygu,
  getDuygular,
  getGorevler,
  insertGorev,
  updateGorev,
  deleteGorev,
  insertSkor,
  getSkorlar,
  getSkorIstatistikler
};
