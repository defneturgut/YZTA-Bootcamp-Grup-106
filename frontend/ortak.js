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
  // Profil gerektirmeyen sayfalar — bu sayfalarda profil yoksa yönlendirme yapılmaz
  const yonlendirmeSiz = ['profil.html', 'ebeveyn.html'];
  if (yonlendirmeSiz.includes(gecerliSayfaAdi())) return false;

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
   SESLİ OKUMA — en anlaşılır Türkçe sesi seçme (tüm sayfalarda ortak)
   Tarayıcılar/işletim sistemleri birden fazla Türkçe ses sunabilir; varsayılan
   çoğu zaman robotik/düşük kaliteli olabiliyor. Burada bilinen yüksek kaliteli
   seslere (Google, Microsoft, Yelda gibi doğal seslere) öncelik veriyoruz.
   -------------------------------------------------------------------- */
let turkceSesCache = null;

function enIyiTurkceSesiSec() {
  if (!('speechSynthesis' in window)) return null;

  const tumSesler = window.speechSynthesis.getVoices();
  const turkceSesler = tumSesler.filter(s => s.lang && s.lang.toLocaleLowerCase('tr-TR').startsWith('tr'));
  if (turkceSesler.length === 0) return null;

  // Bilinen doğal/kaliteli ses adları — bulunursa öncelikli kullanılır
  const ONCELIKLI_AD_PARCALARI = ['Google', 'Yelda', 'Microsoft', 'Enhanced', 'Premium', 'Natural'];
  for (const parca of ONCELIKLI_AD_PARCALARI) {
    const bulunan = turkceSesler.find(s => s.name.includes(parca));
    if (bulunan) return bulunan;
  }

  return turkceSesler[0];
}

// Ses listesi bazı tarayıcılarda asenkron yüklenir; hazır olduğunda önbelleği doldur
if ('speechSynthesis' in window) {
  turkceSesCache = enIyiTurkceSesiSec();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    turkceSesCache = enIyiTurkceSesiSec();
  });
}

// Emoji ve noktalama işaretlerini kaldırır — sesli okuma motoru bunları
// "gülen yüz emojisi" ya da "ünlem işareti" gibi tuhaf şekilde okuyabiliyor,
// bu yüzden konuşmadan önce metinden temizlenirler.
function seslendirmeIcinTemizle(metin) {
  return metin
    .replace(/[\u{1F1E6}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️‍]/gu, '')
    .replace(/[!?.,;:*_~`"'()\[\]{}<>|\\/#@%^&+=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tarayıcının yerleşik sesli okuma özelliğini kullanarak herhangi bir metni seslendirir.
// Not: cancel() çağrısının hemen ardından speak() çağrılması bazı tarayıcılarda
// (özellikle Chrome) sessizce hiçbir şey söylemeden başarısız oluyor — bilinen bir
// zamanlama sorunu. Bunu önlemek için speak() küçük bir gecikmeyle çağrılıyor.
function metniSeslendir(metin, hiz = 0.9) {
  if (!('speechSynthesis' in window)) return;

  const temizMetin = seslendirmeIcinTemizle(metin);
  if (!temizMetin) return;

  window.speechSynthesis.cancel(); // önceki konuşma varsa durdur

  setTimeout(() => {
    const konusma = new SpeechSynthesisUtterance(temizMetin);
    konusma.lang = 'tr-TR';
    if (turkceSesCache) konusma.voice = turkceSesCache;
    konusma.rate = hiz;
    konusma.pitch = 1;
    konusma.onerror = (e) => console.warn('⚠️ Sesli okuma hatası:', e.error);
    window.speechSynthesis.speak(konusma);
  }, 80);
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
  
  // Faz 1 - Gelişmiş Eklentiler (Catbot, Sakinleşme Molası, Tema)
  faz1EklentileriniBaslat();
  
  // Faz 2 - Oyunlaştırma (XP & Rozet)
  oyunlastirmaKartiniGoster();
});

/* ==========================================================================
   FAZ 1 - GELİŞMİŞ EKLENTİLER
   ========================================================================== */

function faz1EklentileriniBaslat() {
  ebeveynMenusuEkle();
  erisilebilirlikButonlariniEkle();
  temaVeFontuUygula();
  sakinlesmeArayuzuOlustur();
  catbotArayuzuOlustur();
}

function ebeveynMenusuEkle() {
  const menu = document.querySelector('.kenar-menu');
  if (!menu) return;
  if (menu.querySelector('a[href="ebeveyn.html"]')) return;

  const link = document.createElement('a');
  link.href = 'ebeveyn.html';
  link.className = 'menu-link';
  if (typeof gecerliSayfaAdi === 'function' && gecerliSayfaAdi() === 'ebeveyn.html') {
    link.classList.add('aktif');
  }
  link.innerHTML = '<span class="ikon">⚙️</span> Ebeveyn Paneli';

  // Profil kartından veya en alt XP kartından önce ekle
  const profilKarti = menu.querySelector('.profil-karti');
  if (profilKarti) {
    menu.insertBefore(link, profilKarti);
  } else {
    menu.appendChild(link);
  }
}

/* --- Erişilebilirlik ve Temalar --- */
function erisilebilirlikButonlariniEkle() {
  const cubuk = document.querySelector('.erisilebilirlik-cubugu');
  if (!cubuk) return;

  // Yüksek Kontrast Butonu
  const kontrastBtn = document.createElement('button');
  kontrastBtn.className = 'extra-btn';
  kontrastBtn.textContent = 'Kontrast';
  kontrastBtn.onclick = () => {
    const isHigh = document.body.classList.toggle('yuksek-kontrast');
    localStorage.setItem('temaKontrast', isHigh ? '1' : '0');
  };

  // Disleksi Fontu Butonu
  const fontBtn = document.createElement('button');
  fontBtn.className = 'extra-btn';
  fontBtn.textContent = 'Disleksi Font';
  fontBtn.onclick = () => {
    const isDys = document.body.classList.toggle('disleksi-font');
    localStorage.setItem('temaFont', isDys ? '1' : '0');
  };

  // Sakinleş Butonu
  const sakinlesBtn = document.createElement('button');
  sakinlesBtn.className = 'extra-btn sakinles';
  sakinlesBtn.textContent = '🌿 Sakinleş';
  sakinlesBtn.onclick = sakinlesmeyiBaslat;

  // Ebeveyn Paneli Butonu
  const ebeveynBtn = document.createElement('a');
  ebeveynBtn.className = 'extra-btn';
  ebeveynBtn.href = 'ebeveyn.html';
  ebeveynBtn.textContent = '⚙️ Ebeveyn';
  ebeveynBtn.style.textDecoration = 'none';
  ebeveynBtn.style.background = '#e2dfd8';

  cubuk.appendChild(kontrastBtn);
  cubuk.appendChild(fontBtn);
  cubuk.appendChild(sakinlesBtn);
  cubuk.appendChild(ebeveynBtn);
}

function temaVeFontuUygula() {
  if (localStorage.getItem('temaKontrast') === '1') document.body.classList.add('yuksek-kontrast');
  if (localStorage.getItem('temaFont') === '1') document.body.classList.add('disleksi-font');
}

/* --- Sakinleşme Molası --- */
let nefesSesi = null;
function sakinlesmeArayuzuOlustur() {
  const overlay = document.createElement('div');
  overlay.className = 'sakinlesme-overlay';
  overlay.id = 'sakinlesmeOverlay';
  
  const daire = document.createElement('div');
  daire.className = 'sakinlesme-daire';
  
  const metin = document.createElement('div');
  metin.className = 'sakinlesme-metin';
  metin.innerHTML = 'Derin nefes al...<br>Rahatla...';
  
  const kapatBtn = document.createElement('button');
  kapatBtn.className = 'sakinlesme-kapat';
  kapatBtn.textContent = 'Geri Dön';
  kapatBtn.onclick = sakinlesmeyiBitir;
  
  overlay.appendChild(daire);
  overlay.appendChild(metin);
  overlay.appendChild(kapatBtn);
  document.body.appendChild(overlay);
  
  // Basit bir sinüs dalgası veya pink noise çalmak için Web Audio API (isteğe bağlı)
  // Şimdilik sadece görsel.
}

function sakinlesmeyiBaslat() {
  document.getElementById('sakinlesmeOverlay').classList.add('aktif');
  metniSeslendir('Lütfen gözlerini kapat ve derin bir nefes al.', 0.8);
}

function sakinlesmeyiBitir() {
  document.getElementById('sakinlesmeOverlay').classList.remove('aktif');
  window.speechSynthesis.cancel();
}

/* --- CATBOT (Yapay Zeka Kedi) --- */
let catbotGecmis = [];
let catbotSesliOkumaAcik = localStorage.getItem('catbotSesliOkuma') !== 'kapali';

function catbotArayuzuOlustur() {
  // Yüzen Buton
  const bubble = document.createElement('div');
  bubble.className = 'catbot-bubble';
  bubble.innerHTML = '🐱';
  bubble.title = 'Catbot ile Konuş!';
  
  // Sohbet Penceresi
  const pencere = document.createElement('div');
  pencere.className = 'catbot-window';
  pencere.id = 'catbotWindow';
  
  const header = document.createElement('div');
  header.className = 'catbot-header';
  header.innerHTML = `
    <span>Catbot 🐱</span>
    <div class="catbot-header-buttons">
      <button class="catbot-ses-toggle" id="catbotSesToggle" title="${catbotSesliOkumaAcik ? 'Sesli okumayı kapat' : 'Sesli okumayı aç'}">${catbotSesliOkumaAcik ? '🔊' : '🔇'}</button>
      <button class="catbot-close" id="catbotClose">✖</button>
    </div>
  `;
  
  const messages = document.createElement('div');
  messages.className = 'catbot-messages';
  messages.id = 'catbotMessages';
  
  const inputArea = document.createElement('div');
  inputArea.className = 'catbot-input-area';
  
  const micBtn = document.createElement('button');
  micBtn.className = 'catbot-btn';
  micBtn.innerHTML = '🎤';
  micBtn.title = 'Sesli Yaz';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'catbot-input';
  input.id = 'catbotInput';
  input.placeholder = 'Bir şeyler yaz...';
  
  const sendBtn = document.createElement('button');
  sendBtn.className = 'catbot-btn';
  sendBtn.innerHTML = '➤';
  
  inputArea.appendChild(micBtn);
  inputArea.appendChild(input);
  inputArea.appendChild(sendBtn);
  
  pencere.appendChild(header);
  pencere.appendChild(messages);
  pencere.appendChild(inputArea);
  
  document.body.appendChild(bubble);
  document.body.appendChild(pencere);
  
  // Olay Dinleyicileri
  bubble.onclick = () => pencere.classList.add('acik');
  pencere.querySelector('#catbotClose').onclick = () => pencere.classList.remove('acik');

  const sesToggleBtn = pencere.querySelector('#catbotSesToggle');
  sesToggleBtn.onclick = () => {
    catbotSesliOkumaAcik = !catbotSesliOkumaAcik;
    localStorage.setItem('catbotSesliOkuma', catbotSesliOkumaAcik ? 'acik' : 'kapali');
    sesToggleBtn.textContent = catbotSesliOkumaAcik ? '🔊' : '🔇';
    sesToggleBtn.title = catbotSesliOkumaAcik ? 'Sesli okumayı kapat' : 'Sesli okumayı aç';
    if (!catbotSesliOkumaAcik) window.speechSynthesis.cancel();
  };
  
  const gonder = () => {
    const text = input.value.trim();
    if (text) {
      catbotMesajEkle(text, 'user');
      input.value = '';
      catbotYanitAl(text);
    }
  };
  
  sendBtn.onclick = gonder;
  input.onkeypress = (e) => { if (e.key === 'Enter') gonder(); };
  
  // Sesli Yazma (Web Speech API)
  if ('webkitSpeechRecognition' in window) {
    const reco = new webkitSpeechRecognition();
    reco.lang = 'tr-TR';
    reco.continuous = false;
    reco.interimResults = false;
    
    reco.onstart = () => { micBtn.style.background = '#f2a3a3'; };
    reco.onend = () => { micBtn.style.background = ''; };
    reco.onresult = (event) => {
      input.value = event.results[0][0].transcript;
      gonder();
    };
    micBtn.onclick = () => reco.start();
  } else {
    micBtn.style.display = 'none';
  }
  
  // İlk mesaj
  const profil = profilGetir();
  const isim = profil ? profil.isim : 'arkadaşım';
  const sessizMi = gecerliSayfaAdi() !== 'ana-sayfa.html';
  catbotMesajEkle(`Miyav! Merhaba ${isim}, ben Catbot! Sana nasıl yardım edebilirim?`, 'bot', sessizMi);
}

function catbotMesajEkle(metin, gonderen, sessiz = false) {
  const container = document.getElementById('catbotMessages');
  if (!container) return;
  
  const msg = document.createElement('div');
  msg.className = `catbot-message ${gonderen}`;
  msg.textContent = metin;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  
  if (gonderen === 'bot' && !sessiz && catbotSesliOkumaAcik) {
    metniSeslendir(metin, 1.0);
  }
}

async function catbotYanitAl(kullaniciMesaji) {
  catbotGecmis.push({ rol: 'user', metin: kullaniciMesaji });
  
  // Yükleniyor efekti
  const container = document.getElementById('catbotMessages');
  const loading = document.createElement('div');
  loading.className = 'catbot-message bot';
  loading.id = 'catbotLoading';
  loading.textContent = 'Miyav, düşünüyorum... 🐾';
  container.appendChild(loading);
  container.scrollTop = container.scrollHeight;

  const profil = profilGetir();
  const profilId = profilIdGetir();
  
  const bodyData = { 
    mesaj: kullaniciMesaji, 
    gecmis: catbotGecmis,
    cocukAdi: profil ? profil.isim : 'Arkadaşım'
  };
  if (profilId) bodyData.profilId = parseInt(profilId);

  const yanit = await apiIstegi('/ai/sohbet', {
    method: 'POST',
    body: JSON.stringify(bodyData)
  });
  
  const loadingEl = document.getElementById('catbotLoading');
  if (loadingEl) loadingEl.remove();

  if (yanit && yanit.yanit) {
    catbotMesajEkle(yanit.yanit, 'bot');
    catbotGecmis.push({ rol: 'assistant', metin: yanit.yanit });
  } else {
    catbotMesajEkle('Miyav... Bir sorun oluştu, bağlantımı kontrol eder misin? 😿', 'bot');
  }
}

/* ==========================================================================
   FAZ 2 - OYUNLAŞTIRMA (XP VE ROZETLER)
   ========================================================================== */
async function oyunlastirmaKartiniGoster() {
  const profilId = profilIdGetir();
  if (!profilId) return;

  const statlar = await apiIstegi(`/skorlar/${profilId}`);
  let toplamDogru = 0;
  let oturumSayisi = 0;
  
  if (statlar && Array.isArray(statlar)) {
    statlar.forEach(s => {
      toplamDogru += s.toplam_dogru;
      oturumSayisi += s.oturum_sayisi;
    });
  }

  // Örnek XP hesabı: Her doğru cevap 10 XP, her oyun seansı (oturum) 5 XP
  const xp = (toplamDogru * 10) + (oturumSayisi * 5);
  
  const menu = document.querySelector('.kenar-menu');
  if (!menu) return;

  const xpContainer = document.createElement('div');
  xpContainer.className = 'xp-karti';
  
  // İlerleme yüzdesi (Örn: Her 100 XP'de seviye atlama)
  const seviyeXp = xp % 100;
  
  xpContainer.innerHTML = `
    <div style="font-family: var(--font-heading); font-weight: 700; margin-bottom: 8px;">🌟 Başarıların</div>
    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-soft); margin-bottom: 4px;">
      <span>${xp} Toplam XP</span>
      <span>${seviyeXp}/100</span>
    </div>
    <div style="background: var(--green-soft-light); border-radius: 10px; height: 10px; overflow: hidden; margin-bottom: 12px;">
      <div style="background: var(--success); width: ${seviyeXp}%; height: 100%; transition: width 0.5s ease;"></div>
    </div>
    <div class="rozetler" style="display: flex; gap: 8px; justify-content: center; font-size: 1.8rem;">
      <span class="rozet" style="filter: ${xp >= 10 ? 'none' : 'grayscale(100%) opacity(0.3)'}" title="İlk Adım (10 XP)">🥉</span>
      <span class="rozet" style="filter: ${xp >= 50 ? 'none' : 'grayscale(100%) opacity(0.3)'}" title="Harika Başlangıç (50 XP)">🥈</span>
      <span class="rozet" style="filter: ${xp >= 100 ? 'none' : 'grayscale(100%) opacity(0.3)'}" title="Yıldız Öğrenci (100 XP)">🥇</span>
    </div>
  `;
  
  // Stili de hemen ekleyelim (zaten inline stillerle çoğunu çözdük)
  xpContainer.style.background = 'var(--white)';
  xpContainer.style.padding = '14px';
  xpContainer.style.borderRadius = 'var(--radius-md)';
  xpContainer.style.boxShadow = 'var(--shadow-soft)';
  xpContainer.style.marginTop = 'auto'; // Menünün en altına yapışması için

  menu.appendChild(xpContainer);
}
