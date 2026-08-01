/* ==========================================================================
   DISLEKSI.JS
   Üç bağımsız bölüm:
   1) Okuma ayarları  -> harf/satır/kelime aralığını canlı önizleme ile ayarlama
   2) Dinle ve Yaz     -> Web Speech API ile kelimeyi seslendirip yazdırma
   3) Aynı Harfi Bul   -> b/d/p/q gibi karıştırılan harfleri ayırt etme oyunu
   ========================================================================== */

/* --------------------------------------------------------------------
   1) OKUMA AYARLARI
   -------------------------------------------------------------------- */
function okumaAyarlariniBagla() {
  const harfAraligi = document.getElementById('harfAraligi');
  const satirAraligi = document.getElementById('satirAraligi');
  const kelimeAraligi = document.getElementById('kelimeAraligi');
  const ornekMetin = document.getElementById('ornekMetin');

  function guncelle() {
    // Kaydırıcı 0-10 -> 0-5px harf aralığı
    ornekMetin.style.letterSpacing = (harfAraligi.value * 0.5) + 'px';
    // Kaydırıcı 100-260 -> 1.0-2.6 satır yüksekliği
    ornekMetin.style.lineHeight = (satirAraligi.value / 100);
    // Kaydırıcı 0-20 -> 0-20px kelime aralığı
    ornekMetin.style.wordSpacing = kelimeAraligi.value + 'px';
  }

  [harfAraligi, satirAraligi, kelimeAraligi].forEach(el => {
    el.addEventListener('input', guncelle);
  });

  guncelle(); // sayfa açılır açılmaz başlangıç değerleriyle uygula
}

/* --------------------------------------------------------------------
   2) DİNLE VE YAZ
   -------------------------------------------------------------------- */
const ALISTIRMA_KELIMELERI = [
  'kedi', 'kapı', 'deniz', 'kitap', 'bardak', 'çiçek', 'balon',
  'tavşan', 'orman', 'güneş', 'yıldız', 'masa', 'sandalye', 'ekmek'
];

let mevcutKelime = '';

function rastgeleKelimeSec() {
  return ALISTIRMA_KELIMELERI[Math.floor(Math.random() * ALISTIRMA_KELIMELERI.length)];
}

// Backend'deki sabit Türkçe kelime sözlüğünden bir kelime ister (her zaman gerçek
// bir kelime döner); backend'e ulaşılamazsa sessizce statik listeye düşer.
async function kelimeGetir() {
  if (typeof apiIstegi === 'function') {
    const yanit = await apiIstegi('/ai/kelime-uret', { method: 'POST' });
    if (yanit && yanit.kelime) return yanit.kelime;
  }
  return rastgeleKelimeSec();
}

// Sesli okuma artık ortak.js'deki paylaşılan metniSeslendir() ile yapılıyor
// (ses seçimi Günüm sayfasındaki AI sohbetiyle de ortak kullanılabilsin diye taşındı)
function kelimeyiSeslendir(metin) {
  if (!('speechSynthesis' in window)) {
    alert('Üzgünüz, tarayıcın sesli okumayı desteklemiyor.');
    return;
  }
  metniSeslendir(metin);
}

async function yeniKelimeYukle() {
  const yeniKelimeBtn = document.getElementById('yeniKelimeBtn');
  yeniKelimeBtn.disabled = true;

  mevcutKelime = await kelimeGetir();

  document.getElementById('kelimeInput').value = '';
  document.getElementById('yazmaGeriBildirim').textContent = '';
  document.getElementById('kelimeInput').disabled = false;
  document.getElementById('kontrolEtBtn').disabled = false;
  yeniKelimeBtn.disabled = false;
  yeniKelimeBtn.style.display = 'none';
  // Kelime yüklenir yüklenmez otomatik olarak bir kez seslendir
  kelimeyiSeslendir(mevcutKelime);
}

function yazilanKelimeyiKontrolEt() {
  const input = document.getElementById('kelimeInput');
  const geriBildirim = document.getElementById('yazmaGeriBildirim');
  const yazilan = input.value.trim().toLocaleLowerCase('tr-TR');
  const dogruMu = yazilan === mevcutKelime.toLocaleLowerCase('tr-TR');

  input.disabled = true;
  document.getElementById('kontrolEtBtn').disabled = true;

  if (dogruMu) {
    geriBildirim.textContent = '🎉 Harika, doğru yazdın!';
    geriBildirim.style.color = '#4f9c72';
  } else {
    geriBildirim.textContent = `😊 Sorun değil! Doğrusu: "${mevcutKelime}"`;
    geriBildirim.style.color = '#c96f6f';
  }

  // Otomatik geçiş yok — çocuk hazır olduğunda "Yeni Kelime" butonuna basar
  document.getElementById('yeniKelimeBtn').style.display = 'inline-block';
}

function yazmaAlistirmasiniBagla() {
  document.getElementById('dinleBtn').addEventListener('click', () => kelimeyiSeslendir(mevcutKelime));
  document.getElementById('kontrolEtBtn').addEventListener('click', yazilanKelimeyiKontrolEt);
  document.getElementById('yeniKelimeBtn').addEventListener('click', yeniKelimeYukle);
  document.getElementById('kelimeInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') yazilanKelimeyiKontrolEt();
  });
  yeniKelimeYukle();
}

/* --------------------------------------------------------------------
   3) AYNI HARFİ BUL (b / d / p / q ayırt etme)
   -------------------------------------------------------------------- */
const KARISTIRILAN_HARFLER = ['b', 'd', 'p', 'q'];
let harfDogruSayac = 0;
let harfYanlisSayac = 0;

function harfOyunuYeniTurBaslat() {
  const hedef = KARISTIRILAN_HARFLER[Math.floor(Math.random() * KARISTIRILAN_HARFLER.length)];
  document.getElementById('hedefHarf').textContent = hedef;

  // Seçenekleri karıştır (tüm 4 harf her zaman gösterilsin, sırası değişsin)
  const secenekler = [...KARISTIRILAN_HARFLER].sort(() => Math.random() - 0.5);

  const alan = document.getElementById('harfSecenekleri');
  alan.innerHTML = '';

  secenekler.forEach(harf => {
    const btn = document.createElement('button');
    btn.className = 'harf-btn';
    btn.textContent = harf;
    btn.addEventListener('click', () => harfSecildi(harf, hedef, btn));
    alan.appendChild(btn);
  });
}

function harfSecildi(secilenHarf, hedefHarf, tiklananBtn) {
  const tumButonlar = document.querySelectorAll('.harf-btn');
  tumButonlar.forEach(b => b.disabled = true);

  const dogruMu = secilenHarf === hedefHarf;

  if (dogruMu) {
    tiklananBtn.classList.add('dogru');
    harfDogruSayac++;
  } else {
    tiklananBtn.classList.add('yanlis');
    harfYanlisSayac++;
    // Doğru harfi de göster ki çocuk farkı görsün
    tumButonlar.forEach(b => {
      if (b.textContent === hedefHarf) b.classList.add('dogru');
    });
  }

  document.getElementById('harfSkor').textContent =
    `Doğru: ${harfDogruSayac} · Yanlış: ${harfYanlisSayac}`;

  setTimeout(harfOyunuYeniTurBaslat, 1200);
}

/* --------------------------------------------------------------------
   4) CÜMLE OKUMA (öğrenilen harflerle AI destekli basit cümleler)
   -------------------------------------------------------------------- */
const TURKCE_ALFABE = ['a','b','c','ç','d','e','f','g','ğ','h','ı','i','j','k','l','m','n','o','ö','p','r','s','ş','t','u','ü','v','y','z'];
const OGRENILEN_HARF_ANAHTARI = 'ogrenilenHarfler';

function ogrenilenHarfleriOku() {
  const veri = localStorage.getItem(OGRENILEN_HARF_ANAHTARI);
  return veri ? JSON.parse(veri) : [];
}

function ogrenilenHarfleriKaydet(harfler) {
  localStorage.setItem(OGRENILEN_HARF_ANAHTARI, JSON.stringify(harfler));
}

function harfIzgarasiniCiz() {
  const ogrenilenler = ogrenilenHarfleriOku();
  const izgara = document.getElementById('harfIzgara');
  izgara.innerHTML = '';

  TURKCE_ALFABE.forEach(harf => {
    const btn = document.createElement('button');
    btn.className = 'izgara-harf-btn' + (ogrenilenler.includes(harf) ? ' ogrenildi' : '');
    btn.textContent = harf;
    btn.setAttribute('aria-pressed', ogrenilenler.includes(harf) ? 'true' : 'false');
    btn.addEventListener('click', () => {
      const guncelListe = ogrenilenHarfleriOku();
      const index = guncelListe.indexOf(harf);
      if (index === -1) {
        guncelListe.push(harf);
      } else {
        guncelListe.splice(index, 1);
      }
      ogrenilenHarfleriKaydet(guncelListe);
      harfIzgarasiniCiz();
    });
    izgara.appendChild(btn);
  });

  document.getElementById('cumleUyari').style.display = ogrenilenler.length === 0 ? 'block' : 'none';
}

let mevcutCumle = '';

async function cumleGetir() {
  const cumleGetirBtn = document.getElementById('cumleGetirBtn');
  const cumleKutusu = document.getElementById('cumleKutusu');
  const dinleBtn = document.getElementById('cumleDinleBtn');

  cumleGetirBtn.disabled = true;
  cumleKutusu.textContent = 'Cümle hazırlanıyor... ⏳';
  dinleBtn.style.display = 'none';

  const harfler = ogrenilenHarfleriOku();
  const yanit = typeof apiIstegi === 'function'
    ? await apiIstegi('/ai/cumle-uret', { method: 'POST', body: JSON.stringify({ harfler }) })
    : null;

  cumleGetirBtn.disabled = false;

  if (!yanit || !yanit.cumle) {
    cumleKutusu.textContent = '😊 AI şu an cümle üretemiyor, birazdan tekrar dene.';
    return;
  }

  mevcutCumle = yanit.cumle;
  cumleKutusu.textContent = mevcutCumle;
  dinleBtn.style.display = 'inline-flex';
}

function cumleOkumayiBagla() {
  harfIzgarasiniCiz();
  document.getElementById('cumleGetirBtn').addEventListener('click', cumleGetir);
  document.getElementById('cumleDinleBtn').addEventListener('click', () => kelimeyiSeslendir(mevcutCumle));
}

/* --------------------------------------------------------------------
   Sayfa her açıldığında tüm bölümleri başlat
   -------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  okumaAyarlariniBagla();
  yazmaAlistirmasiniBagla();
  harfOyunuYeniTurBaslat();
  cumleOkumayiBagla();
});

// Sayfa kapatılırken disleksi skorunu backend'e gönder.
// navigator.sendBeacon() kullanılıyor — fetch'in aksine tarayıcı sayfayı
// kapatırken bu isteği garantili olarak tamamlar (veri kaybı olmaz).
window.addEventListener('pagehide', () => {
  const toplamDogru  = harfDogruSayac;
  const toplamYanlis = harfYanlisSayac;
  if ((toplamDogru + toplamYanlis) === 0) return;

  const profilId = typeof profilIdGetir === 'function' ? profilIdGetir() : null;
  if (!profilId) return;

  const veri = JSON.stringify({
    profilId: Number(profilId),
    oyun: 'disleksi',
    dogru: toplamDogru,
    yanlis: toplamYanlis
  });

  // sendBeacon tercih edilir; desteklenmiyorsa fetch'e geri düş
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      `${API_URL}/skorlar`,
      new Blob([veri], { type: 'application/json' })
    );
  } else if (typeof skorKaydet === 'function') {
    skorKaydet('disleksi', toplamDogru, toplamYanlis);
  }
});

