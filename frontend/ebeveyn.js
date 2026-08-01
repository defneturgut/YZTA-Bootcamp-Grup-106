document.addEventListener('DOMContentLoaded', () => {
  const pinEkrani = document.getElementById('pinEkrani');
  const panelIcerik = document.getElementById('panelIcerik');
  const pinGiris = document.getElementById('pinGiris');
  const pinOnaylaBtn = document.getElementById('pinOnaylaBtn');

  // 1. PIN Koruması — doğrulama backend'de yapılır, PIN frontend'de saklanmaz
  async function piniKontrolEt() {
    const pin = pinGiris.value.trim();
    if (!pin) return;

    // Butonu devre dışı bırak (çift tıklamayı önle)
    pinOnaylaBtn.disabled = true;
    pinOnaylaBtn.textContent = '...';

    let sonuc = null;
    try {
      // apiIstegi 401'de null döndürdüğü için fetch doğrudan kullanılıyor
      const cevap = await fetch('http://localhost:3001/api/ebeveyn/pin-dogrula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      sonuc = await cevap.json();
    } catch (hata) {
      console.warn('PIN doğrulama hatası:', hata.message);
    }

    pinOnaylaBtn.disabled = false;
    pinOnaylaBtn.textContent = 'Giriş Yap';

    if (sonuc && sonuc.basarili) {
      pinEkrani.style.display = 'none';
      panelIcerik.style.display = 'block';
      verileriYukle();
    } else {
      alert('Hatalı PIN kodu! Lütfen tekrar deneyin.');
      pinGiris.value = '';
      pinGiris.focus();
    }
  }

  pinOnaylaBtn.addEventListener('click', piniKontrolEt);
  pinGiris.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') piniKontrolEt();
  });

  // 2. Verileri Yükle
  async function verileriYukle() {
    let profilId = typeof profilIdGetir === 'function' ? profilIdGetir() : null;

    // profilId yoksa ama yerel profil varsa → backend'e kaydet ve ID al
    // (sunucu kapalıyken oluşturulan profillerde profilId boş kalıyor)
    if (!profilId && typeof profilGetir === 'function') {
      const yerelProfil = profilGetir();
      if (yerelProfil) {
        const yeni = await apiIstegi('/profil', {
          method: 'POST',
          body: JSON.stringify(yerelProfil)
        });
        if (yeni && yeni.id) {
          if (typeof profilIdKaydet === 'function') profilIdKaydet(yeni.id);
          profilId = String(yeni.id);
        }
      }
    }

    if (!profilId) {
      panelIcerik.innerHTML = '<p style="color: var(--text-soft); text-align: center; padding: 32px; font-size: 1.1rem;">⚠️ Henüz bir çocuk profili oluşturulmadı.<br>Lütfen önce <a href="profil.html">profil oluşturun</a>.</p>';
      return;
    }

    // Duyguları getir
    const duygular = await apiIstegi(`/duygu/${profilId}`);
    const duyguListesiEl = document.getElementById('duyguListesi');
    duyguListesiEl.innerHTML = '';

    if (duygular && duygular.length > 0) {
      // En yeniden eskiye sıralı geldiğini varsayarak
      // Spread ile kopya oluşturulup ters çevriliyor; orijinal dizi bozulmaz
      [...duygular].reverse().forEach(d => {
        const tarih = new Date(d.tarih).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
        duyguListesiEl.innerHTML += `
          <div class="duygu-item">
            <span style="font-size: 2rem;">${d.emoji}</span>
            <div>
              <strong>${d.metin}</strong>
              <div style="font-size: 0.8rem; color: #555;">${tarih}</div>
            </div>
          </div>
        `;
      });
    } else {
      duyguListesiEl.innerHTML = '<p style="color: var(--text-soft);">Henüz bir duygu kaydı bulunmuyor.</p>';
    }

    // İstatistikleri getir
    const statlar = await apiIstegi(`/skorlar/${profilId}`);
    const skorListesiEl = document.getElementById('skorListesi');
    skorListesiEl.innerHTML = '';

    if (statlar && statlar.length > 0) {
      statlar.forEach(s => {
        let oyunAdi = s.oyun === 'diskalkuli' ? 'Sayı Bahçesi' : (s.oyun === 'disleksi' ? 'Yazı Atölyesi' : s.oyun);
        skorListesiEl.innerHTML += `
          <div class="skor-item">
            <strong>${oyunAdi}</strong>
            <div style="text-align: right;">
              <span style="color: var(--success); font-weight: bold;">%${s.basari_yuzdesi} Başarı</span><br>
              <span style="font-size: 0.85rem; color: var(--text-soft);">${s.toplam_dogru} Doğru, ${s.toplam_yanlis} Yanlış (${s.oturum_sayisi} Oyun)</span>
            </div>
          </div>
        `;
      });
    } else {
      skorListesiEl.innerHTML = '<p style="color: var(--text-soft);">Henüz oyun oynanmadı.</p>';
    }

    // BEP Notlarını Yükle (Şimdilik LocalStorage)
    const bepAnahtar = `bepNotlari_${profilId}`;
    const bepNotlariEl = document.getElementById('bepNotlari');
    bepNotlariEl.value = localStorage.getItem(bepAnahtar) || '';

    document.getElementById('bepKaydetBtn').addEventListener('click', () => {
      localStorage.setItem(bepAnahtar, bepNotlariEl.value);
      const msj = document.getElementById('bepKayitMesaj');
      msj.style.display = 'inline';
      setTimeout(() => msj.style.display = 'none', 2000);
    });
  }
});
