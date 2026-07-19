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
    metin.textContent = gorev.metin;

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

/* ─── Sayfa başlatma ──────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  bugununTarihiniGoster();
  gorevListesiniCiz();

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


