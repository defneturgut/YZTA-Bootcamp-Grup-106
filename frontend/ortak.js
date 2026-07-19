/* ==========================================================================
   ORTAK.JS
   Tüm sayfalarda kullanılan paylaşılan fonksiyonlar burada.
   - Çocuk profili (isim / avatar / renk) oluşturma, okuma
   - İlk girişte profil oluşturma sayfasına yönlendirme
   - Kenar menüde profil kartını gösterme
   - Yazı boyutu ayarı (Disleksi / Disgrafi erişilebilirliği)
   - Seçilen duygunun okunması / kaydedilmesi
   - Backend API entegrasyonu (localStorage fallback ile)
   ========================================================================== */

/* --------------------------------------------------------------------
   BACKEND API AYARLARI
   -------------------------------------------------------------------- */
const API_URL = 'http://localhost:3001/api';

/**
 * Genel amaçlı API yardımcısı.
 * Ağ/sunucu hatası durumunda null döner (offline toleranslı).
 */
async function apiIstegi(yol, secenekler = {}) {
  try {
    const yanit = await fetch(API_URL + yol, {
      headers: { 'Content-Type': 'application/json' },
      ...secenekler
    });
    if (!yanit.ok) {
      console.warn(`API hatası [${yanit.status}]:`, yol);
      return null;
    }
    return await yanit.json();
  } catch (hata) {
    // Sunucu çalışmıyorsa sessizce null döner — uygulama localStorage ile devam eder
    console.warn('API erişilemiyor, localStorage kullanılıyor:', hata.message);
    return null;
  }
}

/**
 * Backend'deki profil ID'sini localStorage'da saklar.
 * Profil oluşturulduğunda veya güncellendiğinde çağrılır.
 */
function profilIdKaydet(id) {
  localStorage.setItem('profilId', String(id));
}

function profilIdGetir() {
  return localStorage.getItem('profilId');
}

/* --------------------------------------------------------------------
   ÇOCUK PROFİLİ
   -------------------------------------------------------------------- */
const PROFIL_ANAHTARI = 'cocukProfili';

// Profili kaydeder: { isim, avatar, renk }
// Aynı zamanda backend API'ye de senkronize eder (mümkünse)
async function profilKaydet(profil) {
  // 1) Hemen localStorage'a yaz (anında UI güncellemesi için)
  localStorage.setItem(PROFIL_ANAHTARI, JSON.stringify(profil));

  // 2) Backend'e gönder (yoksa sessizce geç)
  const mevcutId = profilIdGetir();
  if (mevcutId) {
    // Güncelleme
    const guncel = await apiIstegi(`/profil/${mevcutId}`, {
      method: 'PUT',
      body: JSON.stringify(profil)
    });
    if (guncel) profilIdKaydet(guncel.id);
  } else {
    // Yeni profil oluştur
    const yeni = await apiIstegi('/profil', {
      method: 'POST',
      body: JSON.stringify(profil)
    });
    if (yeni) profilIdKaydet(yeni.id);
  }
}

// Kayıtlı profili okur, yoksa null döner
function profilGetir() {
  const veri = localStorage.getItem(PROFIL_ANAHTARI);
  return veri ? JSON.parse(veri) : null;
}

// Şu anki dosya adını döndürür (yönlendirme kararları için)
function gecerliSayfaAdi() {
  const yol = window.location.pathname;
  const parca = yol.substring(yol.lastIndexOf('/') + 1);
  return parca || 'ana-sayfa.html';
}

// Henüz profil oluşturulmadıysa kullanıcıyı profil sayfasına yönlendirir.
// Yönlendirme yapıldıysa true döner (çağıran fonksiyon devam etmesin diye).
function ilkGirisKontrolEt() {
  if (gecerliSayfaAdi() === 'profil.html') return false;

  if (!profilGetir()) {
    window.location.href = 'profil.html';
    return true;
  }
  return false;
}

// Kenar menüdeki logonun altına küçük bir "profil kartı" ekler.
// Karta tıklayınca profil düzenleme sayfasına gidilir.
function profilKartiniGoster() {
  const menu = document.querySelector('.kenar-menu');
  if (!menu) return;

  const profil = profilGetir();
  if (!profil) return;

  const eskiKart = menu.querySelector('.profil-karti');
  if (eskiKart) eskiKart.remove();

  const kart = document.createElement('a');
  kart.href = 'profil.html';
  kart.className = 'profil-karti';
  kart.style.setProperty('--profil-renk', profil.renk || '#d7ede4');
  kart.title = 'Profilini düzenlemek için tıkla';

  const avatarSpan = document.createElement('span');
  avatarSpan.className = 'profil-avatar';
  avatarSpan.textContent = profil.avatar || '🙂';

  const bilgiDiv = document.createElement('span');
  bilgiDiv.className = 'profil-bilgi';

  const isimSpan = document.createElement('span');
  isimSpan.className = 'profil-isim';
  isimSpan.textContent = profil.isim || '';

  const duzenleSpan = document.createElement('span');
  duzenleSpan.className = 'profil-duzenle';
  duzenleSpan.textContent = '✏️ Profili düzenle';

  bilgiDiv.appendChild(isimSpan);
  bilgiDiv.appendChild(duzenleSpan);
  kart.appendChild(avatarSpan);
  kart.appendChild(bilgiDiv);

  const logo = menu.querySelector('.logo');
  if (logo) {
    logo.insertAdjacentElement('afterend', kart);
  } else {
    menu.insertBefore(kart, menu.firstChild);
  }
}

// Sayfa başlığının (h1) altına küçük, sıcak bir karşılama mesajı ekler.
// Sadece ".ust-bar" içinde düz bir <h1> olan sayfalarda çalışır
// (ana sayfa kendi karşılama alanını zaten ayrı yönetiyor).
function kisiselMesajEkle() {
  const h1 = document.querySelector('.ust-bar h1');
  if (!h1 || h1.dataset.kisisellestirildi) return;

  const profil = profilGetir();
  if (!profil) return;

  h1.dataset.kisisellestirildi = '1';

  const mesaj = document.createElement('div');
  mesaj.className = 'kisisel-karsilama-mesaji';
  mesaj.textContent = `Hoş geldin, ${profil.isim}! ${profil.avatar}`;

  const sarmalayici = document.createElement('div');
  h1.parentNode.insertBefore(sarmalayici, h1);
  sarmalayici.appendChild(h1);
  sarmalayici.appendChild(mesaj);
}

/* --------------------------------------------------------------------
   YAZI BOYUTU (Erişilebilirlik)
   -------------------------------------------------------------------- */

// Yazı boyutu kademeleri (px). JS bunlar arasında gezinir.
const YAZI_BOYUTLARI = [16, 18, 20, 22, 25, 28];

// Sayfa yüklendiğinde, daha önce kaydedilmiş yazı boyutunu geri getir.
function yaziBoyutunuUygula() {
  const kayitliBoyut = localStorage.getItem('yaziBoyutu');
  const boyut = kayitliBoyut ? parseInt(kayitliBoyut, 10) : 18;
  document.documentElement.style.setProperty('--base-font-size', boyut + 'px');
}

// "A+" butonuna basınca çağrılır
function yaziyiBuyut() {
  const mevcut = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size'), 10) || 18;
  const suankiIndex = YAZI_BOYUTLARI.indexOf(mevcut);
  const yeniIndex = Math.min(suankiIndex + 1, YAZI_BOYUTLARI.length - 1);
  const yeniBoyut = suankiIndex === -1 ? 20 : YAZI_BOYUTLARI[yeniIndex];
  document.documentElement.style.setProperty('--base-font-size', yeniBoyut + 'px');
  localStorage.setItem('yaziBoyutu', yeniBoyut);
}

// "A-" butonuna basınca çağrılır
function yaziyiKucult() {
  const mevcut = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--base-font-size'), 10) || 18;
  const suankiIndex = YAZI_BOYUTLARI.indexOf(mevcut);
  const yeniIndex = Math.max(suankiIndex - 1, 0);
  const yeniBoyut = suankiIndex === -1 ? 16 : YAZI_BOYUTLARI[yeniIndex];
  document.documentElement.style.setProperty('--base-font-size', yeniBoyut + 'px');
  localStorage.setItem('yaziBoyutu', yeniBoyut);
}

// Yazı boyutunu varsayılana döndürür
function yaziBoyutunuSifirla() {
  document.documentElement.style.setProperty('--base-font-size', '18px');
  localStorage.setItem('yaziBoyutu', 18);
}

/* --------------------------------------------------------------------
   DUYGU KARTI
   -------------------------------------------------------------------- */

// Çocuğun seçtiği duyguyu okumak için (dashboard'da "merhaba" mesajında kullanılır)
function secilenDuyguyuGetir() {
  const emoji = localStorage.getItem('duyguEmoji');
  const metin = localStorage.getItem('duyguMetin');
  if (!emoji || !metin) return null;
  return { emoji, metin };
}

// Seçilen duyguyu hem localStorage'a hem backend'e kaydeder
async function duyguKaydet(emoji, metin) {
  // localStorage'a yaz
  localStorage.setItem('duyguEmoji', emoji);
  localStorage.setItem('duyguMetin', metin);
  localStorage.setItem('duyguZamani', new Date().toISOString());

  // Backend'e gönder (arka planda)
  const profilId = profilIdGetir();
  if (profilId) {
    await apiIstegi('/duygu', {
      method: 'POST',
      body: JSON.stringify({ profilId: Number(profilId), emoji, metin })
    });
  }
}

// Oyun skorunu backend'e kaydeder
async function skorKaydet(oyun, dogru, yanlis) {
  const profilId = profilIdGetir();
  if (!profilId) return;
  await apiIstegi('/skorlar', {
    method: 'POST',
    body: JSON.stringify({ profilId: Number(profilId), oyun, dogru, yanlis })
  });
}

/* --------------------------------------------------------------------
   Sayfa her açıldığında otomatik çalışsın diye:
   -------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Profil yoksa her şeyden önce profil oluşturma sayfasına yönlendir
  if (ilkGirisKontrolEt()) return;

  yaziBoyutunuUygula();
  profilKartiniGoster();
  kisiselMesajEkle();

  // Erişilebilirlik çubuğundaki butonları otomatik bağla (varsa)
  const buyutBtn = document.querySelector('[data-aksiyon="buyut"]');
  const kucultBtn = document.querySelector('[data-aksiyon="kucult"]');
  const sifirlaBtn = document.querySelector('[data-aksiyon="sifirla"]');

  if (buyutBtn) buyutBtn.addEventListener('click', yaziyiBuyut);
  if (kucultBtn) kucultBtn.addEventListener('click', yaziyiKucult);
  if (sifirlaBtn) sifirlaBtn.addEventListener('click', yaziBoyutunuSifirla);
});
