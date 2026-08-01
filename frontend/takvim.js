/* ==========================================================================
   TAKVIM.JS
   Günlük yapılacaklar listesi (To-Do List).
   - Backend API çalışıyorsa görevler sunucuda saklanır (profil_id ile)
   - Sunucu yoksa localStorage fallback devreye girer
   - Görev ekleme, tamamlandı işaretleme, silme
   - Alttaki ilerleme çubuğu tamamlanan görev oranını gösterir
   ========================================================================== */

const GOREV_ANAHTARI = 'gunlukGorevler';

/* ─── Yardımcılar ─────────────────────────────────────────────────────────── */

function bugunTarihStr() {
  return new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

// localStorage fallback
function gorevleriLocalOku() {
  const veri = localStorage.getItem(GOREV_ANAHTARI);
  return veri ? JSON.parse(veri) : [];
}
function gorevleriLocalKaydet(gorevler) {
  localStorage.setItem(GOREV_ANAHTARI, JSON.stringify(gorevler));
}

// Bugünün tarihini Türkçe, okunaklı biçimde göster
function bugununTarihiniGoster() {
  const bugun = new Date();
  const secenekler = { weekday: 'long', day: 'numeric', month: 'long' };
  document.getElementById('bugununTarihi').textContent =
    'Bugün: ' + bugun.toLocaleDateString('tr-TR', secenekler);
}

/* ─── API destekli veri katmanı ───────────────────────────────────────────── */

// Görevleri önce API'den, başarısızsa localStorage'dan çeker
async function gorevleriYukle() {
  const profilId = typeof profilIdGetir === 'function' ? profilIdGetir() : null;
  if (profilId) {
    const veriler = await apiIstegi(`/gorevler/${profilId}`);
    if (veriler) {
      // localStorage cache'ini de güncelle
      gorevleriLocalKaydet(veriler.map(g => ({ id: g.id, metin: g.metin, tamam: !!g.tamam })));
      return veriler;
    }
  }
  // Fallback: localStorage
  return gorevleriLocalOku();
}

/* ─── Ekran çizimi ────────────────────────────────────────────────────────── */

async function gorevListesiniCiz() {
  const gorevler = await gorevleriYukle();
  const liste = document.getElementById('gorevListesi');
  liste.innerHTML = '';

  if (gorevler.length === 0) {
    liste.innerHTML = '<div class="bos-durum">Henüz görev eklenmedi. Yukarıdan bir tane ekle! 😊</div>';
  }

  gorevler.forEach((gorev, index) => {
    const satir = document.createElement('div');
    satir.className = 'gorev-satiri';

    const checkbox = document.createElement('button');
    checkbox.className = 'gorev-checkbox' + (gorev.tamam ? ' tamam' : '');
    checkbox.setAttribute('aria-label', gorev.tamam ? 'Tamamlandı, geri al' : 'Tamamlandı olarak işaretle');
    checkbox.textContent = gorev.tamam ? '✓' : '';
    checkbox.addEventListener('click', () => gorevDurumunuDegistir(index, gorev));

    const metin = document.createElement('span');
    metin.className = 'gorev-metin' + (gorev.tamam ? ' tamam' : '');
    
    // Basit PECS görsel mantığı
    let ikon = '📋';
    const k = gorev.metin.toLowerCase();
    if (k.includes('diş')) ikon = '🪥';
    else if (k.includes('okul') || k.includes('ders')) ikon = '🏫';
    else if (k.includes('uyku') || k.includes('yat')) ikon = '🛌';
    else if (k.includes('oyun') || k.includes('arkadaş')) ikon = '🎮';
    else if (k.includes('yemek') || k.includes('kahvaltı')) ikon = '🍲';
    else if (k.includes('kitap') || k.includes('oku')) ikon = '📖';
    else if (k.includes('banyo') || k.includes('yıka')) ikon = '🛁';
    else if (k.includes('terapi')) ikon = '🧩';
    
    metin.innerHTML = `<span style="font-size: 1.3rem; margin-right: 8px;">${ikon}</span> ${gorev.metin}`;

    const silBtn = document.createElement('button');
    silBtn.className = 'gorev-sil';
    silBtn.setAttribute('aria-label', 'Görevi sil');
    silBtn.textContent = '🗑️';
    silBtn.addEventListener('click', () => gorevSil(index, gorev));

    satir.appendChild(checkbox);
    satir.appendChild(metin);
    satir.appendChild(silBtn);
    liste.appendChild(satir);
  });

  ilerlemeCubugunuGuncelle(gorevler);
}

function ilerlemeCubugunuGuncelle(gorevler) {
  const toplam = gorevler.length;
  const tamamlanan = gorevler.filter(g => g.tamam).length;
  const yuzde = toplam === 0 ? 0 : Math.round((tamamlanan / toplam) * 100);

  document.getElementById('ilerlemeCubugu').style.width = yuzde + '%';
  document.getElementById('ilerlemeYuzde').textContent = yuzde + '%';
}

/* ─── CRUD işlemleri ──────────────────────────────────────────────────────── */

async function gorevEkle(metin) {
  const temizMetin = metin.trim();
  if (temizMetin === '') return;

  const profilId = typeof profilIdGetir === 'function' ? profilIdGetir() : null;

  if (profilId) {
    // Backend'e ekle
    await apiIstegi('/gorevler', {
      method: 'POST',
      body: JSON.stringify({ profilId: Number(profilId), metin: temizMetin })
    });
  } else {
    // localStorage fallback
    const gorevler = gorevleriLocalOku();
    gorevler.push({ metin: temizMetin, tamam: false });
    gorevleriLocalKaydet(gorevler);
  }

  gorevListesiniCiz();
}

async function gorevDurumunuDegistir(index, gorev) {
  const yeniDurum = !gorev.tamam;

  if (gorev.id && typeof apiIstegi === 'function') {
    await apiIstegi(`/gorevler/${gorev.id}`, {
      method: 'PUT',
      body: JSON.stringify({ tamam: yeniDurum })
    });
  } else {
    // localStorage fallback
    const gorevler = gorevleriLocalOku();
    gorevler[index].tamam = yeniDurum;
    gorevleriLocalKaydet(gorevler);
  }

  gorevListesiniCiz();
}

async function gorevSil(index, gorev) {
  if (gorev.id && typeof apiIstegi === 'function') {
    await apiIstegi(`/gorevler/${gorev.id}`, { method: 'DELETE' });
  } else {
    // localStorage fallback
    const gorevler = gorevleriLocalOku();
    gorevler.splice(index, 1);
    gorevleriLocalKaydet(gorevler);
  }

  gorevListesiniCiz();
}

/* ==========================================================================
   AI GÜN PLANLAYICI
   - /api/ai/gunum-sohbet ile sohbet eder, sohbet geçmişi sayfa hafızasında tutulur
   - Web Speech API ile mikrofonla metin girişi desteklenir
   ========================================================================== */

const aiSohbetGecmisi = []; // { rol: 'user'|'assistant', metin } — sayfa hafızası, kalıcı değil

/* --------------------------------------------------------------------
   SESLİ OKU (aç/kapa) — AI'ın yanıtlarını sesli okuyup okumayacağını yönetir.
   Henüz okuma bilmeyen çocuklar için varsayılan olarak açık, istenirse kapatılabilir.
   -------------------------------------------------------------------- */
const AI_SESLI_OKUMA_ANAHTARI = 'aiSesliOkumaAcik';

function aiSesliOkumaAcikMi() {
  const kayitli = localStorage.getItem(AI_SESLI_OKUMA_ANAHTARI);
  return kayitli === null ? true : kayitli === 'true';
}

function aiSesliOkuButonunuGuncelle() {
  const btn = document.getElementById('aiSesliOkuBtn');
  const acik = aiSesliOkumaAcikMi();
  btn.textContent = acik ? '🔊 Sesli Oku: Açık' : '🔇 Sesli Oku: Kapalı';
  btn.setAttribute('aria-pressed', acik ? 'true' : 'false');
  btn.classList.toggle('aktif', acik);
}

function aiSesliOkumayiBagla() {
  const btn = document.getElementById('aiSesliOkuBtn');
  aiSesliOkuButonunuGuncelle();

  btn.addEventListener('click', () => {
    const yeniDurum = !aiSesliOkumaAcikMi();
    localStorage.setItem(AI_SESLI_OKUMA_ANAHTARI, String(yeniDurum));
    aiSesliOkuButonunuGuncelle();
    if (!yeniDurum && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  });
}

/* --------------------------------------------------------------------
   SOHBET YAZI AYARLARI — yazı boyutu ve satır aralığı, sadece bu sohbet
   kutusuna uygulanır (disleksi.html'deki okuma ayarları deseniyle aynı mantık).
   -------------------------------------------------------------------- */
function sohbetGorunumAyarlariniBagla() {
  const yaziBoyutu = document.getElementById('sohbetYaziBoyutu');
  const satirAraligi = document.getElementById('sohbetSatirAraligi');
  const kutu = document.getElementById('aiSohbetGecmisi');

  function uygula() {
    kutu.style.setProperty('--sohbet-font-size', yaziBoyutu.value + 'px');
    kutu.style.setProperty('--sohbet-satir-araligi', satirAraligi.value / 100);
    localStorage.setItem('sohbetYaziBoyutu', yaziBoyutu.value);
    localStorage.setItem('sohbetSatirAraligi', satirAraligi.value);
  }

  const kayitliBoyut = localStorage.getItem('sohbetYaziBoyutu');
  const kayitliAralik = localStorage.getItem('sohbetSatirAraligi');
  if (kayitliBoyut) yaziBoyutu.value = kayitliBoyut;
  if (kayitliAralik) satirAraligi.value = kayitliAralik;

  [yaziBoyutu, satirAraligi].forEach(el => el.addEventListener('input', uygula));
  uygula();
}

function aiBalonEkle(rol, metin) {
  const kutu = document.getElementById('aiSohbetGecmisi');
  const bosDurum = kutu.querySelector('.ai-bos-durum');
  if (bosDurum) bosDurum.remove();

  const balon = document.createElement('div');
  const sinifHaritasi = { user: 'cocuk', hata: 'hata', sistem: 'sistem' };
  balon.className = 'ai-balon ' + (sinifHaritasi[rol] || 'asistan');
  balon.textContent = metin;
  kutu.appendChild(balon);
  kutu.scrollTop = kutu.scrollHeight;
}

// AI'ın yanıtındaki saatli plan satırlarını ayrıştırır.
// Model artık sadece NİHAİ planda ⏰ kullanıyor (netleştirici soru turlarında değil),
// bu yüzden sadece ⏰ içeren satırlar plan maddesi olarak kabul edilir — böylece
// ara sorularda geçebilecek bir saat ("okul 16:00'da bitiyor" gibi) yanlışlıkla
// plan maddesi olarak eklenmez.
function aiYanitindanPlanCikar(metin) {
  const sonuc = [];
  const satirlar = metin.split('\n');

  satirlar.forEach(satir => {
    if (!satir.includes('⏰')) return;

    const saatEslesme = satir.match(/\d{1,2}:\d{2}/);
    if (!saatEslesme) return;

    const saat = saatEslesme[0];
    const sureEslesme = satir.match(/\(([^)]*)\)/);
    const sure = sureEslesme ? sureEslesme[1].trim() : '';

    const etkinlik = satir
      .replace(/⏰/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\d{1,2}:\d{2}/g, '')
      .replace(/^[\s:.\-–—]+|[\s:.\-–—]+$/g, '')
      .trim();

    if (etkinlik.length >= 2 && etkinlik.length <= 80) {
      sonuc.push({ saat, etkinlik, sure });
    }
  });

  return sonuc;
}

async function aiMesajGonder(metin) {
  const temizMetin = metin.trim();
  if (temizMetin === '') return;

  aiBalonEkle('user', temizMetin);
  aiSohbetGecmisi.push({ rol: 'user', metin: temizMetin });

  const gonderBtn = document.getElementById('aiGonderBtn');
  gonderBtn.disabled = true;
  gonderBtn.textContent = 'Düşünüyorum...';

  const gorevler = await gorevleriYukle();

  const yanit = await fetch(API_URL + '/ai/gunum-sohbet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mesajlar: aiSohbetGecmisi, gorevler })
  }).then(r => r.json()).catch(() => null);

  gonderBtn.disabled = false;
  gonderBtn.textContent = 'Gönder';

  if (!yanit || yanit.hata) {
    aiBalonEkle('hata', '😊 AI şu an çalışmıyor. Bilgisayarında "ollama serve" komutunun çalıştığından emin ol.');
    return;
  }

  aiBalonEkle('assistant', yanit.yanit);
  aiSohbetGecmisi.push({ rol: 'assistant', metin: yanit.yanit });

  // Henüz okuma bilmeyen çocuklar için: açıksa AI'ın yanıtını sesli oku
  if (aiSesliOkumaAcikMi() && typeof metniSeslendir === 'function') {
    metniSeslendir(yanit.yanit);
  }

  // AI'ın önerdiği saatli maddeleri otomatik olarak Planlayıcım'a ekle
  const planMaddeleri = aiYanitindanPlanCikar(yanit.yanit);
  if (planMaddeleri.length > 0) {
    for (const madde of planMaddeleri) {
      await planlayiciyaEkle(madde.saat, madde.etkinlik, madde.sure);
    }
    aiBalonEkle('sistem', `✅ ${planMaddeleri.length} madde Planlayıcım'a eklendi!`);
    planlayiciyiCiz();
  }
}

function aiSesliGirisiBagla() {
  const mikBtn = document.getElementById('aiMikBtn');
  const SpeechRecognitionSinifi = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognitionSinifi) {
    mikBtn.style.display = 'none';
    return;
  }

  const tanima = new SpeechRecognitionSinifi();
  tanima.lang = 'tr-TR';
  tanima.interimResults = false;

  let dinliyorMu = false;

  mikBtn.addEventListener('click', () => {
    if (dinliyorMu) return;
    tanima.start();
  });

  tanima.addEventListener('start', () => {
    dinliyorMu = true;
    mikBtn.classList.add('dinliyor');
  });

  tanima.addEventListener('end', () => {
    dinliyorMu = false;
    mikBtn.classList.remove('dinliyor');
  });

  tanima.addEventListener('result', (e) => {
    const metin = e.results[0][0].transcript;
    document.getElementById('aiMesajInput').value = metin;
  });

  tanima.addEventListener('error', () => {
    dinliyorMu = false;
    mikBtn.classList.remove('dinliyor');
  });
}

function aiSohbetiBagla() {
  const input = document.getElementById('aiMesajInput');
  const gonderBtn = document.getElementById('aiGonderBtn');

  gonderBtn.addEventListener('click', () => {
    aiMesajGonder(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      aiMesajGonder(input.value);
      input.value = '';
    }
  });

  aiSesliGirisiBagla();
}

/* ==========================================================================
   ÖNEMLİ GÜNLER
   ========================================================================== */

const ONEMLI_GUN_ANAHTARI = 'onemliGunler';

function onemliGunleriLocalOku() {
  const veri = localStorage.getItem(ONEMLI_GUN_ANAHTARI);
  return veri ? JSON.parse(veri) : [];
}

function onemliGunleriLocalKaydet(gunler) {
  localStorage.setItem(ONEMLI_GUN_ANAHTARI, JSON.stringify(gunler));
}

async function onemliGunleriYukle() {
  const profilId = typeof profilIdGetir === 'function' ? profilIdGetir() : null;
  if (profilId) {
    const veriler = await apiIstegi(`/onemli-gunler/${profilId}`);
    if (veriler) {
      onemliGunleriLocalKaydet(veriler);
      return veriler;
    }
  }
  return onemliGunleriLocalOku().sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
}

function gunFarkiniHesapla(tarihStr) {
  const bugun = new Date(bugunTarihStr());
  const hedef = new Date(tarihStr);
  const fark = Math.round((hedef - bugun) / (1000 * 60 * 60 * 24));
  return fark;
}

async function onemliGunListesiniCiz() {
  const gunler = await onemliGunleriYukle();
  const liste = document.getElementById('onemliGunListesi');
  liste.innerHTML = '';

  if (gunler.length === 0) {
    liste.innerHTML = '<div class="bos-durum">Henüz önemli gün eklenmedi. 🎉</div>';
    return;
  }

  gunler.forEach((gun, index) => {
    const fark = gunFarkiniHesapla(gun.tarih);

    const satir = document.createElement('div');
    satir.className = 'onemli-gun-satiri';

    const bilgi = document.createElement('div');
    bilgi.className = 'onemli-gun-bilgi';

    const baslik = document.createElement('div');
    baslik.className = 'onemli-gun-baslik';
    baslik.textContent = gun.baslik;

    const tarih = document.createElement('div');
    tarih.className = 'onemli-gun-tarih';
    tarih.textContent = new Date(gun.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    bilgi.appendChild(baslik);
    bilgi.appendChild(tarih);
    satir.appendChild(bilgi);

    if (fark >= 0 && fark <= 7) {
      const rozet = document.createElement('span');
      rozet.className = 'onemli-gun-rozet';
      rozet.textContent = fark === 0 ? 'Bugün! 🎉' : `${fark} gün kaldı!`;
      satir.appendChild(rozet);
    }

    const silBtn = document.createElement('button');
    silBtn.className = 'onemli-gun-sil';
    silBtn.setAttribute('aria-label', 'Önemli günü sil');
    silBtn.textContent = '🗑️';
    silBtn.addEventListener('click', () => onemliGunSil(index, gun));

    satir.appendChild(silBtn);
    liste.appendChild(satir);
  });
}

async function onemliGunEkle(baslik, tarih) {
  const temizBaslik = baslik.trim();
  if (temizBaslik === '' || !tarih) return;

  const profilId = typeof profilIdGetir === 'function' ? profilIdGetir() : null;

  if (profilId) {
    await apiIstegi('/onemli-gunler', {
      method: 'POST',
      body: JSON.stringify({ profilId: Number(profilId), baslik: temizBaslik, tarih })
    });
  } else {
    const gunler = onemliGunleriLocalOku();
    gunler.push({ baslik: temizBaslik, tarih });
    onemliGunleriLocalKaydet(gunler);
  }

  onemliGunListesiniCiz();
}

async function onemliGunSil(index, gun) {
  if (gun.id && typeof apiIstegi === 'function') {
    await apiIstegi(`/onemli-gunler/${gun.id}`, { method: 'DELETE' });
  } else {
    const gunler = onemliGunleriLocalOku();
    gunler.splice(index, 1);
    onemliGunleriLocalKaydet(gunler);
  }

  onemliGunListesiniCiz();
}

/* ==========================================================================
   PLANLAYICIM
   AI'ın önerdiği saatli plan maddelerini tutar (günlük rutin görevlerden
   ayrı). "Bugün" ve "Bu Hafta" olmak üzere iki görünümü vardır.
   ========================================================================== */

const PLANLAYICI_ANAHTARI = 'planlayici';
const HAFTA_GUNLERI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

let planlayiciGorunumu = 'bugun'; // 'bugun' | 'hafta'

function planlayiciLocalOku() {
  const veri = localStorage.getItem(PLANLAYICI_ANAHTARI);
  return veri ? JSON.parse(veri) : [];
}

function planlayiciLocalKaydet(maddeler) {
  localStorage.setItem(PLANLAYICI_ANAHTARI, JSON.stringify(maddeler));
}

async function planlayiciyiYukle() {
  const profilId = typeof profilIdGetir === 'function' ? profilIdGetir() : null;
  if (profilId) {
    const veriler = await apiIstegi(`/planlayici/${profilId}`);
    if (veriler) {
      planlayiciLocalKaydet(veriler);
      return veriler;
    }
  }
  return planlayiciLocalOku();
}

async function planlayiciyaEkle(saat, etkinlik, sure) {
  const profilId = typeof profilIdGetir === 'function' ? profilIdGetir() : null;
  const tarih = bugunTarihStr();

  if (profilId) {
    await apiIstegi('/planlayici', {
      method: 'POST',
      body: JSON.stringify({ profilId: Number(profilId), tarih, saat, etkinlik, sure })
    });
  } else {
    const maddeler = planlayiciLocalOku();
    maddeler.push({ tarih, saat, etkinlik, sure });
    planlayiciLocalKaydet(maddeler);
  }
}

async function planlayiciMaddeSil(madde) {
  if (madde.id && typeof apiIstegi === 'function') {
    await apiIstegi(`/planlayici/${madde.id}`, { method: 'DELETE' });
  } else {
    const maddeler = planlayiciLocalOku();
    const index = maddeler.findIndex(m => m.tarih === madde.tarih && m.saat === madde.saat && m.etkinlik === madde.etkinlik);
    if (index !== -1) maddeler.splice(index, 1);
    planlayiciLocalKaydet(maddeler);
  }
  planlayiciyiCiz();
}

function planlayiciSatiriOlustur(madde) {
  const satir = document.createElement('div');
  satir.className = 'plan-satiri';

  const saat = document.createElement('span');
  saat.className = 'plan-saat';
  saat.textContent = madde.saat;

  const bilgi = document.createElement('div');
  bilgi.className = 'plan-bilgi';

  const etkinlik = document.createElement('div');
  etkinlik.className = 'plan-etkinlik';
  etkinlik.textContent = madde.etkinlik;
  bilgi.appendChild(etkinlik);

  if (madde.sure) {
    const sure = document.createElement('div');
    sure.className = 'plan-sure';
    sure.textContent = madde.sure;
    bilgi.appendChild(sure);
  }

  const silBtn = document.createElement('button');
  silBtn.className = 'plan-sil';
  silBtn.setAttribute('aria-label', 'Plan maddesini sil');
  silBtn.textContent = '🗑️';
  silBtn.addEventListener('click', () => planlayiciMaddeSil(madde));

  satir.appendChild(saat);
  satir.appendChild(bilgi);
  satir.appendChild(silBtn);
  return satir;
}

// Haftanın Pazartesi gününün tarihini (YYYY-MM-DD) döndürür
function haftaninPazartesiTarihi() {
  const bugun = new Date();
  const gun = bugun.getDay(); // 0=Pazar, 1=Pazartesi, ...
  const pazartesiyeFark = gun === 0 ? -6 : 1 - gun;
  const pazartesi = new Date(bugun);
  pazartesi.setDate(bugun.getDate() + pazartesiyeFark);
  return pazartesi;
}

async function planlayiciyiCiz() {
  const tumMaddeler = await planlayiciyiYukle();
  const liste = document.getElementById('planlayiciListesi');
  liste.innerHTML = '';

  if (planlayiciGorunumu === 'bugun') {
    const bugununMaddeleri = tumMaddeler
      .filter(m => m.tarih === bugunTarihStr())
      .sort((a, b) => a.saat.localeCompare(b.saat));

    if (bugununMaddeleri.length === 0) {
      liste.innerHTML = '<div class="bos-durum">Bugün için plan yok. Yukarıdan AI\'a sor! 🤖</div>';
      return;
    }

    bugununMaddeleri.forEach(m => liste.appendChild(planlayiciSatiriOlustur(m)));
    return;
  }

  // Hafta görünümü: Pazartesi'den Pazar'a 7 gün, her biri kendi başlığı altında
  const pazartesi = haftaninPazartesiTarihi();

  for (let i = 0; i < 7; i++) {
    const gun = new Date(pazartesi);
    gun.setDate(pazartesi.getDate() + i);
    const gunTarihStr = gun.toLocaleDateString('sv-SE');

    const gununMaddeleri = tumMaddeler
      .filter(m => m.tarih === gunTarihStr)
      .sort((a, b) => a.saat.localeCompare(b.saat));

    const gunBlogu = document.createElement('div');
    gunBlogu.className = 'plan-gun-blogu';

    const baslik = document.createElement('div');
    baslik.className = 'plan-gun-basligi';
    const bugunMu = gunTarihStr === bugunTarihStr();
    baslik.textContent = HAFTA_GUNLERI[i] + ' ' + gun.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) + (bugunMu ? ' (Bugün)' : '');
    gunBlogu.appendChild(baslik);

    if (gununMaddeleri.length === 0) {
      const bos = document.createElement('div');
      bos.className = 'plan-gun-bos';
      bos.textContent = 'Plan yok';
      gunBlogu.appendChild(bos);
    } else {
      gununMaddeleri.forEach(m => gunBlogu.appendChild(planlayiciSatiriOlustur(m)));
    }

    liste.appendChild(gunBlogu);
  }
}

function planlayiciyiBagla() {
  const bugunBtn = document.getElementById('planBugunBtn');
  const haftaBtn = document.getElementById('planHaftaBtn');

  bugunBtn.addEventListener('click', () => {
    planlayiciGorunumu = 'bugun';
    bugunBtn.classList.add('aktif');
    haftaBtn.classList.remove('aktif');
    planlayiciyiCiz();
  });

  haftaBtn.addEventListener('click', () => {
    planlayiciGorunumu = 'hafta';
    haftaBtn.classList.add('aktif');
    bugunBtn.classList.remove('aktif');
    planlayiciyiCiz();
  });
}

function onemliGunleriBagla() {
  const baslikInput = document.getElementById('onemliGunBaslikInput');
  const tarihInput = document.getElementById('onemliGunTarihInput');
  const ekleBtn = document.getElementById('onemliGunEkleBtn');

  ekleBtn.addEventListener('click', () => {
    onemliGunEkle(baslikInput.value, tarihInput.value);
    baslikInput.value = '';
    tarihInput.value = '';
  });

  baslikInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      onemliGunEkle(baslikInput.value, tarihInput.value);
      baslikInput.value = '';
      tarihInput.value = '';
    }
  });
}

/* ─── Sayfa başlatma ──────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  bugununTarihiniGoster();
  gorevListesiniCiz();
  onemliGunListesiniCiz();
  aiSohbetiBagla();
  aiSesliOkumayiBagla();
  sohbetGorunumAyarlariniBagla();
  onemliGunleriBagla();
  planlayiciyiBagla();
  planlayiciyiCiz();

  const input = document.getElementById('yeniGorevInput');
  const ekleBtn = document.getElementById('ekleBtn');

  ekleBtn.addEventListener('click', () => {
    gorevEkle(input.value);
    input.value = '';
    input.focus();
  });

  // Enter tuşuyla da görev eklenebilsin
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      gorevEkle(input.value);
      input.value = '';
    }
  });

  // Hazır öneri butonları (Diş fırçala, Kitap oku, vb.)
  document.querySelectorAll('.oneri-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      gorevEkle(btn.dataset.gorev);
    });
  });
});


