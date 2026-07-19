/* ==========================================================================
   DİSKALKULİ.JS
   Meyve görselleriyle toplama / çıkarma / çarpma / bölme soruları üretir.
   Her cevaptan sonra (doğru ya da yanlış) otomatik olarak yeni bir soru gelir.
   ========================================================================== */

// Kullanılabilecek meyve emojileri - her soruda rastgele biri seçilir
const MEYVELER = ['🍎', '🍌', '🍊', '🍓', '🍇'];

// Skor sayaçları (sayfa yenilenince sıfırlanır - basit tutuyoruz)
let dogruSayac = 0;
let yanlisSayac = 0;

// DOM elemanları
const soruMetniEl = document.getElementById('soruMetni');
const meyveAlaniEl = document.getElementById('meyveAlani');
const seceneklerEl = document.getElementById('secenekler');
const geriBildirimEl = document.getElementById('geriBildirim');
const dogruSayisiEl = document.getElementById('dogruSayisi');
const yanlisSayisiEl = document.getElementById('yanlisSayisi');

// Yardımcı: a ile b arasında (dahil) rastgele tam sayı
function rastgeleSayi(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

// Meyve grubunu (kutu içinde N tane emoji) oluşturan HTML üretir
function grupKutusuOlustur(adet, meyve) {
  let ic = '';
  for (let i = 0; i < adet; i++) {
    ic += `<span class="meyve-emoji">${meyve}</span>`;
  }
  return `<div class="grup-kutusu">${ic}</div>`;
}

// Şu anki doğru cevabı ve soruyu tutan global obje
let mevcutSoru = null;

// ------------------------------------------------------------------
// SORU ÜRETİCİ: rastgele bir işlem türü seçip soru objesi oluşturur
// ------------------------------------------------------------------
function yeniSoruUret() {
  const islemler = ['toplama', 'cikarma', 'carpma', 'bolme'];
  const islem = islemler[rastgeleSayi(0, islemler.length - 1)];
  const meyve = MEYVELER[rastgeleSayi(0, MEYVELER.length - 1)];

  let soru = { islem, meyve };

  if (islem === 'toplama') {
    const a = rastgeleSayi(1, 5);
    const b = rastgeleSayi(1, 5);
    soru.a = a;
    soru.b = b;
    soru.cevap = a + b;
    soru.metin = `${a} + ${b} kaç eder?`;
    soru.gorsel = `
      ${grupKutusuOlustur(a, meyve)}
      <span class="islem-isareti">+</span>
      ${grupKutusuOlustur(b, meyve)}`;

  } else if (islem === 'cikarma') {
    const a = rastgeleSayi(3, 7);
    const b = rastgeleSayi(1, a - 1); // b, a'dan büyük olamaz
    soru.a = a;
    soru.b = b;
    soru.cevap = a - b;
    soru.metin = `${a} - ${b} kaç eder?`;
    // Çıkarılacak meyveleri soluk/çarpı işaretli göster
    let ic = '';
    for (let i = 0; i < a; i++) {
      if (i < a - b) {
        ic += `<span class="meyve-emoji">${meyve}</span>`;
      } else {
        ic += `<span class="meyve-emoji" style="opacity:0.3;">${meyve}</span>`;
      }
    }
    soru.gorsel = `<div class="grup-kutusu">${ic}</div>`;

  } else if (islem === 'carpma') {
    const grupSayisi = rastgeleSayi(2, 4);
    const grupIci = rastgeleSayi(2, 4);
    soru.a = grupSayisi;
    soru.b = grupIci;
    soru.cevap = grupSayisi * grupIci;
    soru.metin = `${grupSayisi} grup, her grupta ${grupIci} ${meyveAdiVer(meyve)} var. Toplam kaç eder?`;
    let gruplar = '';
    for (let i = 0; i < grupSayisi; i++) {
      gruplar += grupKutusuOlustur(grupIci, meyve);
    }
    soru.gorsel = `<div class="meyve-grubu">${gruplar}</div>`;

  } else { // bolme
    const bolen = rastgeleSayi(2, 4);
    const sonuc = rastgeleSayi(2, 5);
    const toplam = bolen * sonuc;
    soru.a = toplam;
    soru.b = bolen;
    soru.cevap = sonuc;
    soru.metin = `${toplam} ${meyveAdiVer(meyve)}, ${bolen} arkadaşa eşit paylaştırılıyor. Her birine kaç tane düşer?`;
    let gruplar = '';
    for (let i = 0; i < bolen; i++) {
      gruplar += grupKutusuOlustur(sonuc, meyve);
    }
    soru.gorsel = `<div class="meyve-grubu">${gruplar}</div>`;
  }

  return soru;
}

// Meyve emojisine göre basit Türkçe ad döndürür (soru metnini daha doğal yapmak için)
function meyveAdiVer(meyve) {
  const adlar = { '🍎': 'elma', '🍌': 'muz', '🍊': 'portakal', '🍓': 'çilek', '🍇': 'üzüm' };
  return adlar[meyve] || 'meyve';
}

// ------------------------------------------------------------------
// 4 seçenek üretir: 1 doğru + 3 farklı yanlış (mantıklı, negatif olmayan)
// ------------------------------------------------------------------
function secenekleriUret(dogruCevap) {
  const secenekSeti = new Set([dogruCevap]);
  while (secenekSeti.size < 4) {
    // Doğru cevaba yakın rastgele sapmalar ekleyerek makul yanlış seçenekler üret
    const sapma = rastgeleSayi(-4, 4);
    const aday = dogruCevap + sapma;
    if (aday >= 0 && aday !== dogruCevap) {
      secenekSeti.add(aday);
    }
  }
  // Seçenekleri karıştır
  return Array.from(secenekSeti).sort(() => Math.random() - 0.5);
}

// ------------------------------------------------------------------
// Soruyu ekrana çizer
// ------------------------------------------------------------------
function soruyuGoster() {
  mevcutSoru = yeniSoruUret();

  soruMetniEl.textContent = mevcutSoru.metin;
  meyveAlaniEl.innerHTML = mevcutSoru.gorsel;
  geriBildirimEl.textContent = '';

  const secenekler = secenekleriUret(mevcutSoru.cevap);
  seceneklerEl.innerHTML = '';

  secenekler.forEach(deger => {
    const btn = document.createElement('button');
    btn.className = 'secenek-btn';
    btn.textContent = deger;
    btn.addEventListener('click', () => cevapVerildi(deger, btn));
    seceneklerEl.appendChild(btn);
  });
}

// ------------------------------------------------------------------
// Çocuk bir seçeneğe tıkladığında çalışır
// ------------------------------------------------------------------
function cevapVerildi(secilenDeger, tiklananBtn) {
  const tumButonlar = seceneklerEl.querySelectorAll('.secenek-btn');
  // Tekrar tıklamayı önlemek için tüm butonları devre dışı bırak
  tumButonlar.forEach(b => b.disabled = true);

  const dogruMu = secilenDeger === mevcutSoru.cevap;

  if (dogruMu) {
    tiklananBtn.classList.add('dogru');
    geriBildirimEl.textContent = '🎉 Harika, doğru cevap!';
    geriBildirimEl.style.color = '#4f9c72';
    dogruSayac++;
  } else {
    tiklananBtn.classList.add('yanlis');
    geriBildirimEl.textContent = `😊 Sorun değil! Doğru cevap: ${mevcutSoru.cevap}`;
    geriBildirimEl.style.color = '#c96f6f';
    yanlisSayac++;

    // Doğru cevabı da yeşille göster ki çocuk öğrensin
    tumButonlar.forEach(b => {
      if (parseInt(b.textContent, 10) === mevcutSoru.cevap) {
        b.classList.add('dogru');
      }
    });
  }

  dogruSayisiEl.textContent = dogruSayac;
  yanlisSayisiEl.textContent = yanlisSayac;

  // 1.4 saniye sonra otomatik olarak yeni soru getir
  setTimeout(soruyuGoster, 1400);
}

// Sayfa açılır açılmaz ilk soruyu göster
document.addEventListener('DOMContentLoaded', soruyuGoster);

// Her 10 soruda bir skoru backend'e kaydet
function skoruGonderGerekiyorMu() {
  return (dogruSayac + yanlisSayac) > 0 && (dogruSayac + yanlisSayac) % 10 === 0;
}

// Sayfa kapatılırken veya ayrılırken skoru backend'e gönder
window.addEventListener('beforeunload', () => {
  if (typeof skorKaydet === 'function' && (dogruSayac + yanlisSayac) > 0) {
    skorKaydet('diskalkuli', dogruSayac, yanlisSayac);
  }
});

