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

// Tarayıcının yerleşik sesli okuma özelliğini kullanarak kelimeyi seslendirir
function kelimeyiSeslendir(kelime) {
  if (!('speechSynthesis' in window)) {
    alert('Üzgünüz, tarayıcın sesli okumayı desteklemiyor.');
    return;
  }
  const konusma = new SpeechSynthesisUtterance(kelime);
  konusma.lang = 'tr-TR';
  konusma.rate = 0.85; // biraz yavaş, çocuklar için daha anlaşılır
  window.speechSynthesis.cancel(); // önceki konuşma varsa durdur
  window.speechSynthesis.speak(konusma);
}

function yeniKelimeYukle() {
  mevcutKelime = rastgeleKelimeSec();
  document.getElementById('kelimeInput').value = '';
  document.getElementById('yazmaGeriBildirim').textContent = '';
  document.getElementById('kelimeInput').disabled = false;
  document.getElementById('kontrolEtBtn').disabled = false;
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

  setTimeout(yeniKelimeYukle, 1800);
}

function yazmaAlistirmasiniBagla() {
  document.getElementById('dinleBtn').addEventListener('click', () => kelimeyiSeslendir(mevcutKelime));
  document.getElementById('kontrolEtBtn').addEventListener('click', yazilanKelimeyiKontrolEt);
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
   Sayfa yüklendiğinde her üç bölümü de başlat
   -------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  okumaAyarlariniBagla();
  yazmaAlistirmasiniBagla();
  harfOyunuYeniTurBaslat();
});
