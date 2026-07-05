/* ==========================================================================
   TAKVIM.JS
   Günlük yapılacaklar listesi (To-Do List).
   - Görevler tarayıcının localStorage'ında saklanır, sayfa kapansa bile kalır.
   - Görev ekleme, tamamlandı işaretleme, silme
   - Alttaki ilerleme çubuğu tamamlanan görev oranını gösterir
   ========================================================================== */

const GOREV_ANAHTARI = 'gunlukGorevler';

// Görevleri localStorage'dan oku (yoksa boş liste döndür)
function gorevleriOku() {
  const veri = localStorage.getItem(GOREV_ANAHTARI);
  return veri ? JSON.parse(veri) : [];
}

// Görev listesini localStorage'a kaydet
function gorevleriKaydet(gorevler) {
  localStorage.setItem(GOREV_ANAHTARI, JSON.stringify(gorevler));
}

// Bugünün tarihini Türkçe, okunaklı biçimde göster
function bugununTarihiniGoster() {
  const bugun = new Date();
  const secenekler = { weekday: 'long', day: 'numeric', month: 'long' };
  document.getElementById('bugununTarihi').textContent =
    'Bugün: ' + bugun.toLocaleDateString('tr-TR', secenekler);
}

// Ekrandaki görev listesini yeniden çizer
function gorevListesiniCiz() {
  const gorevler = gorevleriOku();
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
    checkbox.addEventListener('click', () => gorevDurumunuDegistir(index));

    const metin = document.createElement('span');
    metin.className = 'gorev-metin' + (gorev.tamam ? ' tamam' : '');
    metin.textContent = gorev.metin;

    const silBtn = document.createElement('button');
    silBtn.className = 'gorev-sil';
    silBtn.setAttribute('aria-label', 'Görevi sil');
    silBtn.textContent = '🗑️';
    silBtn.addEventListener('click', () => gorevSil(index));

    satir.appendChild(checkbox);
    satir.appendChild(metin);
    satir.appendChild(silBtn);
    liste.appendChild(satir);
  });

  ilerlemeCubugunuGuncelle(gorevler);
}

// Tamamlanan görev oranına göre ilerleme çubuğunu günceller
function ilerlemeCubugunuGuncelle(gorevler) {
  const toplam = gorevler.length;
  const tamamlanan = gorevler.filter(g => g.tamam).length;
  const yuzde = toplam === 0 ? 0 : Math.round((tamamlanan / toplam) * 100);

  document.getElementById('ilerlemeCubugu').style.width = yuzde + '%';
  document.getElementById('ilerlemeYuzde').textContent = yuzde + '%';
}

// Yeni görev ekler
function gorevEkle(metin) {
  const temizMetin = metin.trim();
  if (temizMetin === '') return;

  const gorevler = gorevleriOku();
  gorevler.push({ metin: temizMetin, tamam: false });
  gorevleriKaydet(gorevler);
  gorevListesiniCiz();
}

// Görevin tamamlanma durumunu tersine çevirir
function gorevDurumunuDegistir(index) {
  const gorevler = gorevleriOku();
  gorevler[index].tamam = !gorevler[index].tamam;
  gorevleriKaydet(gorevler);
  gorevListesiniCiz();
}

// Görevi listeden siler
function gorevSil(index) {
  const gorevler = gorevleriOku();
  gorevler.splice(index, 1);
  gorevleriKaydet(gorevler);
  gorevListesiniCiz();
}

// ------------------------------------------------------------------
// Sayfa yüklendiğinde: tarihi göster, listeyi çiz, buton olaylarını bağla
// ------------------------------------------------------------------
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
