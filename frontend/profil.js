/* ==========================================================================
   PROFIL.JS
   Çocuğun kendi profilini oluşturması / düzenlemesi:
   - Adını yazması
   - Kendine bir avatar (emoji) seçmesi
   - En sevdiği rengi seçmesi
   Kaydedilen profil tüm sayfalarda kenar menüde gösterilir.

   Not: profilKaydet / profilGetir fonksiyonları ortak.js içinde tanımlıdır.
   ========================================================================== */

const AVATAR_SECENEKLERI = ['🐻', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🐵', '🐶', '🐱', '🦄'];

const RENK_SECENEKLERI = [
  { ad: 'Yeşil', deger: '#a8d8c8' },
  { ad: 'Mavi', deger: '#aee1f5' },
  { ad: 'Şeftali', deger: '#ffe4c4' },
  { ad: 'Lila', deger: '#d9c2f0' },
  { ad: 'Sarı', deger: '#ffe08a' },
  { ad: 'Pembe', deger: '#f2b0a8' }
];

let seciliAvatar = '';
let seciliRenk = '';

// Avatar seçim ızgarasını oluşturur; mevcutAvatar varsa onu baştan seçili gösterir
function avatarIzgarasiniOlustur(mevcutAvatar) {
  const grid = document.getElementById('avatarGrid');
  grid.innerHTML = '';

  AVATAR_SECENEKLERI.forEach(avatar => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'avatar-secenek';
    btn.textContent = avatar;
    btn.setAttribute('aria-label', avatar + ' avatarını seç');

    if (avatar === mevcutAvatar) {
      btn.classList.add('secili');
      seciliAvatar = avatar;
    }

    btn.addEventListener('click', () => {
      grid.querySelectorAll('.avatar-secenek').forEach(b => b.classList.remove('secili'));
      btn.classList.add('secili');
      seciliAvatar = avatar;
    });

    grid.appendChild(btn);
  });
}

// Renk seçim ızgarasını oluşturur; mevcutRenk varsa onu baştan seçili gösterir
function renkIzgarasiniOlustur(mevcutRenk) {
  const grid = document.getElementById('renkGrid');
  grid.innerHTML = '';

  RENK_SECENEKLERI.forEach(renk => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'renk-secenek';
    btn.style.background = renk.deger;
    btn.setAttribute('aria-label', renk.ad + ' rengini seç');

    if (renk.deger === mevcutRenk) {
      btn.classList.add('secili');
      seciliRenk = renk.deger;
    }

    btn.addEventListener('click', () => {
      grid.querySelectorAll('.renk-secenek').forEach(b => b.classList.remove('secili'));
      btn.classList.add('secili');
      seciliRenk = renk.deger;
    });

    grid.appendChild(btn);
  });
}

// Formu doğrular, kaydeder ve uygun sayfaya yönlendirir
function formuKaydet() {
  const isimInput = document.getElementById('isimInput');
  const geriBildirim = document.getElementById('formGeriBildirim');
  const isim = isimInput.value.trim();

  if (isim === '') {
    geriBildirim.textContent = 'Lütfen önce adını yaz 😊';
    isimInput.focus();
    return;
  }
  if (!seciliAvatar) {
    geriBildirim.textContent = 'Bir avatar seçer misin? 🐻';
    return;
  }
  if (!seciliRenk) {
    geriBildirim.textContent = 'Bir renk de seçelim mi? 🎨';
    return;
  }

  geriBildirim.textContent = '';

  // Profil zaten var mıydı? (yönlendirme kararı için kaydetmeden önce bak)
  const ilkKurulumMu = !profilGetir();

  profilKaydet({ isim, avatar: seciliAvatar, renk: seciliRenk });

  // İlk kurulumsa duygu seçim sayfasına, düzenlemeyse ana sayfaya dön
  window.location.href = ilkKurulumMu ? 'index.html' : 'ana-sayfa.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  const mevcutProfil = profilGetir();

  if (mevcutProfil) {
    document.getElementById('isimInput').value = mevcutProfil.isim;
    document.getElementById('baslikEmoji').textContent = mevcutProfil.avatar;
    document.getElementById('baslikMetni').textContent = `Merhaba, ${mevcutProfil.isim}!`;
    document.getElementById('altBaslikMetni').textContent = 'İstersen bilgilerini burada güncelleyebilirsin.';
    document.getElementById('kaydetBtn').textContent = 'Kaydet →';
  }

  avatarIzgarasiniOlustur(mevcutProfil ? mevcutProfil.avatar : '');
  renkIzgarasiniOlustur(mevcutProfil ? mevcutProfil.renk : '');

  document.getElementById('kaydetBtn').addEventListener('click', formuKaydet);
  document.getElementById('isimInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') formuKaydet();
  });
});
