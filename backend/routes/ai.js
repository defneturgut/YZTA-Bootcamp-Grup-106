/* ==========================================================================
   ROUTES/AI.JS
   Yerel LLM (Ollama) destekli çocuk-güvenli AI özellikleri:
   - Günüm sohbet asistanı (saat saat plan + süre tahmini) — LLM ile
   - Dinle-Yaz için kelime üretimi — küçük bir modelin hatalı/tuhaf kelime
     üretme riskini ortadan kaldırmak için LLM YERİNE sabit Türkçe kelime
     sözlüğünden seçim yapılır (her zaman gerçek, uygun bir kelime garantisi)
   - Cümle Okuma için öğrenilen harflerden cümle üretimi — aynı nedenle
     sözlükten filtrelenen kelimelerle deterministik olarak kurulur
   ========================================================================== */

const express = require('express');
const router = express.Router();
const { ollamaSohbet } = require('../ollama');

const TURKCE_ALFABE = ['a','b','c','ç','d','e','f','g','ğ','h','ı','i','j','k','l','m','n','o','ö','p','r','s','ş','t','u','ü','v','y','z'];
const VARSAYILAN_HARFLER = ['a','e','i','l','m','n','t','k','r','o'];

// İlkokul çağındaki çocuklar için basit, somut, gerçek Türkçe kelimelerden
// oluşan sabit bir sözlük. Hem "Dinle ve Yaz" kelime üretiminde hem de
// "Cümle Okuma"nın harf kısıtlı cümle kurmasında kaynak olarak kullanılır.
// AI'dan farklı olarak burada her kelimenin gerçek ve uygun olduğu garantidir.
const COCUK_KELIME_SOZLUGU = [
  'at', 'et', 'ok', 'ip', 'su', 'ay', 'el', 'un', 'ot', 'iş',
  'kedi', 'köpek', 'kuş', 'balık', 'tavşan', 'ördek', 'inek', 'koyun', 'arı', 'kelebek',
  'ağaç', 'çiçek', 'orman', 'deniz', 'dağ', 'göl', 'taş', 'kum', 'yaprak', 'çimen',
  'güneş', 'yıldız', 'bulut', 'yağmur', 'kar', 'rüzgar', 'şimşek',
  'ev', 'kapı', 'pencere', 'masa', 'sandalye', 'yatak', 'dolap', 'halı', 'lamba',
  'kitap', 'kalem', 'defter', 'çanta', 'silgi', 'boya', 'makas', 'cetvel',
  'top', 'bebek', 'araba', 'bisiklet', 'uçurtma', 'balon', 'oyuncak',
  'elma', 'armut', 'muz', 'çilek', 'üzüm', 'karpuz', 'portakal', 'domates', 'patates',
  'ekmek', 'süt', 'peynir', 'bal', 'şeker', 'yumurta', 'pasta', 'çorba',
  'anne', 'baba', 'abla', 'dede', 'nine', 'teyze', 'dayı', 'arkadaş',
  'okul', 'öğretmen', 'sınıf', 'bahçe', 'park', 'market', 'hastane',
  'göz', 'kulak', 'burun', 'saç', 'diş', 'dudak',
  'kırmızı', 'mavi', 'yeşil', 'sarı', 'mor', 'siyah', 'beyaz',
  'kol', 'tel', 'kale', 'mola', 'tay', 'ela', 'ata', 'ana', 'nal', 'lale',
  'kaya', 'tokat', 'kalem', 'nane', 'yol', 'yaz', 'kış'
];

// ─── GÜNÜM SOHBET: LLM'in uydurduğu (bahsedilmemiş) etkinlikleri filtreleme ──
// Küçük yerel modeller "gün planı" isteğinde kendi tipik rutin şablonunu
// (kahvaltı, okul, uyku gibi) dayatma eğiliminde; bu basit kök-eşleştirme
// filtresi, kaynak metinde hiç geçmeyen kelimelerden oluşan plan satırlarını eler.
function normalizeKelimeler(metin) {
  return metin
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-zçğıöşü\s]/gi, ' ')
    .split(/\s+/)
    .filter(k => k.length >= 3);
}

function etkinlikKaynaktaGeciyorMu(etkinlikMetni, kaynakMetin) {
  const kaynakKelimeler = normalizeKelimeler(kaynakMetin);
  const etkinlikKelimeler = normalizeKelimeler(etkinlikMetni);
  return etkinlikKelimeler.some(ek =>
    kaynakKelimeler.some(kk => kk.slice(0, 4) === ek.slice(0, 4))
  );
}

// Süre metnini ("yaklaşık 1 saat", "30 dakika" gibi) dakikaya çevirir.
function sureyiDakikayaCevir(metin) {
  if (!metin) return 30;
  const saatEslesme = metin.match(/(\d+)\s*saat/i);
  const dakikaEslesme = metin.match(/(\d+)\s*dak/i);
  let toplam = 0;
  if (saatEslesme) toplam += parseInt(saatEslesme[1], 10) * 60;
  if (dakikaEslesme) toplam += parseInt(dakikaEslesme[1], 10);
  if (toplam === 0) {
    const sadeceRakam = metin.match(/(\d+)/);
    if (sadeceRakam) toplam = parseInt(sadeceRakam[1], 10);
  }
  return toplam > 0 ? Math.min(toplam, 240) : 30;
}

function saateDakikaEkle(saatStr, dakika) {
  const [h, m] = saatStr.split(':').map(Number);
  const toplamDakika = h * 60 + m + dakika;
  const yeniSaat = Math.floor(toplamDakika / 60) % 24;
  const yeniDakika = toplamDakika % 60;
  return `${String(yeniSaat).padStart(2, '0')}:${String(yeniDakika).padStart(2, '0')}`;
}

// Yanıttaki ⏰ satırlarını işler: kaynak metinde hiç geçmeyen (uydurulmuş)
// etkinlikleri eler VE saatleri LLM'e GÜVENMEDEN backend'in kendisi, verilen
// başlangıç saatinden itibaren süreleri sırayla toplayarak yeniden hesaplar
// (küçük modeller doğru başlangıç saatini görmezden gelip kendi tercih ettiği
// bir saatten başlayabiliyor — bu adım o hatayı tamamen ortadan kaldırır).
function planiTemizleVeSaatleriHesapla(yanit, kaynakMetin, baslangicSaat) {
  let mevcutSaat = baslangicSaat;
  let planBasladiMi = false;
  const satirlar = yanit.split('\n');

  const yeniSatirlar = [];
  for (const satir of satirlar) {
    if (!satir.includes('⏰')) {
      // Plan satırları başladıktan sonra gelen ⏰'siz bir satır, modelin plan
      // bittikten sonra eklediği gereksiz bir açıklamadır — orada dur.
      if (planBasladiMi && satir.trim() !== '') break;
      yeniSatirlar.push(satir);
      continue;
    }

    planBasladiMi = true;
    const eslesme = satir.match(/-\s*([^(]+?)\s*(\(([^)]*)\))?\s*$/);
    if (!eslesme) continue;

    const etkinlik = eslesme[1].trim();
    const sureMetni = eslesme[3] ? eslesme[3].trim() : '';

    if (!etkinlikKaynaktaGeciyorMu(etkinlik, kaynakMetin)) continue;

    const dakika = sureyiDakikayaCevir(sureMetni);
    yeniSatirlar.push(`⏰ ${mevcutSaat} - ${etkinlik}` + (sureMetni ? ` (${sureMetni})` : ''));
    mevcutSaat = saateDakikaEkle(mevcutSaat, dakika);
  }

  return yeniSatirlar.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Bir metnin sadece verilen harflerden (ve boşluk/noktalama) oluşup oluşmadığını kontrol eder
function sadeceIzinliHarflerdenMiOlusuyor(metin, izinliHarflerSeti) {
  const harfler = metin.toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü]/gi, '').split('');
  return harfler.every(h => izinliHarflerSeti.has(h));
}

// Sözlükten, sadece verilen harflerden oluşan kelimeleri seçip basit bir cümle kurar
function sozlukleCumleKur(kullanilacakHarfler) {
  const izinliSet = new Set(kullanilacakHarfler.map(h => h.toLocaleLowerCase('tr-TR')));
  const uygunKelimeler = COCUK_KELIME_SOZLUGU.filter(k => sadeceIzinliHarflerdenMiOlusuyor(k, izinliSet));

  if (uygunKelimeler.length === 0) {
    return null;
  }

  const secilenler = [...uygunKelimeler].sort(() => Math.random() - 0.5).slice(0, 3);
  return secilenler.join(' ').replace(/^./, c => c.toLocaleUpperCase('tr-TR')) + '.';
}

// ── Günüm sohbeti: sabit sorular ve zaman çözümleme yardımcıları ───────────
// Küçük yerel modeller (3B) çok adımlı "ne zaman soru sor, ne zaman planla" akışını
// güvenilir yönetemiyor (soruları kendi kendine cevaplama, bahsedilmeyen etkinlik
// uydurma, "4" gibi belirsiz saatleri yanlış yorumlama gibi hatalar gözlemlendi).
// Bu yüzden TÜM soru akışı backend'de deterministik (LLM'siz, %100 güvenilir);
// LLM SADECE son adımda, tek ve dar bir görevle (çözümlenmiş bilgilerden planı
// yazmak) çağrılıyor.
const SORU_BOSLUK = 'Süper bir gün olacak! 😊 Bugün saat kaçtan sonra boşsun?';
const SORU_OKUL = 'Okulun saat kaçta bitiyor?';
const SORU_ZAMAN_NET = 'Anladım! Saat kaç gibi düşünüyorsun?';
const SORU_ODEV_SURESI = 'Öğretmenin ödev için ne kadar süre ayırmanı istedi?';
const SORU_OYUN_IZNI = 'Arkadaşlarınla oynamak için ailenden kaç saat izin aldın?';
const SORU_OYUN_YERI = 'Dışarıda mı yoksa evde ya da online mı oynayacaksınız? Dışarıdaysan saat kaça kadar dışarıda kalabilirsin?';

// "4", "16:00", "saat 4 gibi" gibi ifadeleri gerçek bir saate çözümler.
// Tek haneli/çift haneli düz bir sayı (1-7 arası) verildiğinde, okul çağındaki
// bir çocuğun "boş olduğu saat" bağlamında büyük ihtimalle öğleden sonra/akşamı
// kastettiği varsayılır (4 -> 16:00).
function saatiCozumle(metin) {
  if (!metin) return null;

  const tamFormat = metin.match(/(\d{1,2})[:.](\d{2})/);
  if (tamFormat) {
    const saat = Math.min(23, parseInt(tamFormat[1], 10));
    return `${String(saat).padStart(2, '0')}:${tamFormat[2]}`;
  }

  const tekSayi = metin.match(/\b(\d{1,2})\b/);
  if (tekSayi) {
    let saat = parseInt(tekSayi[1], 10);
    if (saat >= 1 && saat <= 7) saat += 12; // 1-7 arası -> öğleden sonra/akşam varsayımı
    saat = Math.min(23, saat);
    return `${String(saat).padStart(2, '0')}:00`;
  }

  return null;
}

// ── POST /api/ai/gunum-sohbet ────────────────────────────────────────────────
router.post('/gunum-sohbet', async (req, res) => {
  const { mesajlar = [] } = req.body;

  if (!Array.isArray(mesajlar) || mesajlar.length === 0) {
    return res.status(400).json({ hata: 'mesajlar dizisi zorunludur' });
  }

  const kullaniciMesajlari = mesajlar.filter(m => m.rol === 'user');
  const asistanMesajlari = mesajlar.filter(m => m.rol === 'assistant');
  const ilkIstek = kullaniciMesajlari[0]?.metin || '';

  const odevVarMi = /ödev/i.test(ilkIstek);
  const oyunVarMi = /oyun|arkadaş/i.test(ilkIstek);

  // Her sabit sorunun cevabını, o sorudan hemen sonraki kullanıcı mesajıyla eşleştir
  // (sorular her zaman sırayla soruluyor, bu yüzden index eşleşmesi güvenilir).
  const cevapMap = {};
  asistanMesajlari.forEach((soru, i) => {
    cevapMap[soru.metin] = kullaniciMesajlari[i + 1]?.metin || '';
  });
  const soruSorulduMu = (s) => Object.prototype.hasOwnProperty.call(cevapMap, s);

  // Zaman kaynağı: boşluk/okul/netleştirme sorularından herhangi birine verilen,
  // rakam içeren İLK cevap (kullanıcı hangi soruda saat verdiyse onu kullan).
  const zamanCevaplari = [cevapMap[SORU_BOSLUK], cevapMap[SORU_OKUL], cevapMap[SORU_ZAMAN_NET]].filter(Boolean);
  const zamanKaynagi = zamanCevaplari.find(c => /\d/.test(c));
  const zamanNetMi = Boolean(zamanKaynagi);

  // 1) İlk soru — her zaman sorulur
  if (!soruSorulduMu(SORU_BOSLUK)) {
    return res.json({ yanit: SORU_BOSLUK });
  }

  // 2) Zaman hâlâ netleşmediyse: "okul" dendiyse bitiş saatini, değilse genel netleştirme sor
  if (!zamanNetMi) {
    const okulGeciyorMu = /okul/i.test(cevapMap[SORU_BOSLUK] || '');
    if (okulGeciyorMu && !soruSorulduMu(SORU_OKUL)) {
      return res.json({ yanit: SORU_OKUL });
    }
    if (!okulGeciyorMu && !soruSorulduMu(SORU_ZAMAN_NET)) {
      return res.json({ yanit: SORU_ZAMAN_NET });
    }
    // İkisi de soruldu ama hâlâ net değil — sonsuz döngüye girmeden devam et
  }

  // 3) Ödev bahsedildiyse, öğretmenin ayırdığı süreyi sor
  if (odevVarMi && !soruSorulduMu(SORU_ODEV_SURESI)) {
    return res.json({ yanit: SORU_ODEV_SURESI });
  }

  // 4) Oyun/arkadaş bahsedildiyse, aileden alınan izin süresini sor
  if (oyunVarMi && !soruSorulduMu(SORU_OYUN_IZNI)) {
    return res.json({ yanit: SORU_OYUN_IZNI });
  }

  // 5) Oyun yeri (dışarı/online) ve dışarıdaysa eve dönüş saatini sor
  if (oyunVarMi && !soruSorulduMu(SORU_OYUN_YERI)) {
    return res.json({ yanit: SORU_OYUN_YERI });
  }

  // 6) Tüm bilgiler toplandı — LLM'e SADECE çözümlenmiş bilgilerden planı yazma
  // görevi veriliyor. Saat, ham metin yerine ÖNCEDEN ÇÖZÜMLENMİŞ olarak verilir
  // ("4" -> "16:00") ki model onu yanlış yorumlayıp anlamsız bir saat üretmesin.
  const cozumlenmisSaat = saatiCozumle(zamanKaynagi) || saatiCozumle(cevapMap[SORU_OKUL]);
  const bilgiSatirlari = [
    cozumlenmisSaat
      ? `Çocuk saat ${cozumlenmisSaat}'dan itibaren boş.`
      : 'Çocuğun boş olduğu saat belirsiz, makul bir saatten başla.'
  ];
  if (odevVarMi) bilgiSatirlari.push(`Öğretmenin ödev için ayırmasını istediği süre: ${cevapMap[SORU_ODEV_SURESI] || 'belirtilmedi'}.`);
  if (oyunVarMi) bilgiSatirlari.push(`Arkadaşlarla oynama izni: ${cevapMap[SORU_OYUN_IZNI] || 'belirtilmedi'}.`);
  if (oyunVarMi) bilgiSatirlari.push(`Oyun yeri ve/veya eve dönüş saati: ${cevapMap[SORU_OYUN_YERI] || 'belirtilmedi'}.`);

  // Etkinlik adlarını LLM'in eş anlamlı kelimeyle değiştirmesini önlemek için
  // (örn. "ödev" yerine "öğretim" yazması, kaynak-eşleştirme filtresinin bunu
  // hatalıca uydurma sanıp elemesine yol açıyordu) hangi kelimenin birebir
  // kullanılması gerektiği açıkça belirtiliyor.
  const zorunluKelimeler = [];
  if (odevVarMi) zorunluKelimeler.push('ödev');
  if (oyunVarMi) zorunluKelimeler.push('oyun');

  const sistemPrompt = `Sen ilkokul çağındaki (6-11 yaş) bir çocuk için gün planı yazan bir yardımcısın.

Çocuğun ne yapmak istediği: "${ilkIstek}"
${bilgiSatirlari.join('\n')}

KURALLAR:
- ÖNEMLİ: "${ilkIstek}" cümlesinde bahsedilen HER TEK etkinliği plana dahil et, hiçbirini atlama. Cümlede kaç farklı etkinlik varsa planda o kadar satır olmalı.
- SADECE "çocuğun ne yapmak istediği" kısmında geçen etkinlikleri plana koy.
${zorunluKelimeler.length > 0 ? `- Etkinlik adlarında MUTLAKA şu kelimeleri birebir kullan (eş anlamlısını YAZMA): ${zorunluKelimeler.join(', ')}. Örneğin "ödev" yerine "öğretim" veya "ders çalışma" gibi başka bir kelime YAZMA.` : ''}
- Kahvaltı, okul, uyku gibi yukarıda hiç geçmeyen HİÇBİR ekstra etkinlik EKLEME. Diğer bilgiler SADECE saat/süre belirlemek içindir, oradan yeni etkinlik türetme.
- Verilen ödev süresi ve oyun izni/eve dönüş bilgilerini planın saatlerine ve sürelerine MUTLAKA yansıt.
- "Tamamdır, bugünkü planını oluşturuyorum! 😊" cümlesiyle başla.
- Hemen altına, her etkinlik için ayrı satırda, tam olarak şu formatta yaz: "⏰ SAAT - Etkinlik adı (yaklaşık süre)"
- Saatleri verilen bilgilere göre mantıklı sırala.
- SADECE öz Türkçe kelimeler kullan, başka dilden tek kelime bile kullanma.
- Asla yetişkin içerik, şiddet, korku üretme.
- SADECE plan satırlarından ve kısa bir kapanış cümlesinden oluşsun, başka açıklama ekleme.`;

  const yanit = await ollamaSohbet(sistemPrompt, 'Şimdi planı yaz.', [], 0.25);

  if (!yanit) {
    return res.status(503).json({ hata: 'AI şu an kullanılamıyor. Ollama çalışıyor mu kontrol et.' });
  }

  const temizYanit = planiTemizleVeSaatleriHesapla(yanit, ilkIstek, cozumlenmisSaat || '09:00');
  res.json({ yanit: temizYanit });
});

// ── POST /api/ai/kelime-uret ──────────────────────────────────────────────────
// LLM kullanmıyor: küçük yerel modellerin bazen anlamsız/uygun olmayan
// kelime üretme riskini tamamen ortadan kaldırmak için sabit sözlükten seçer.
router.post('/kelime-uret', (_req, res) => {
  const kelime = COCUK_KELIME_SOZLUGU[Math.floor(Math.random() * COCUK_KELIME_SOZLUGU.length)];
  res.json({ kelime });
});

// ── POST /api/ai/cumle-uret ───────────────────────────────────────────────────
// LLM kullanmıyor: harf kısıtına her zaman uyması gerektiği için sözlükten
// filtrelenen gerçek kelimelerle deterministik olarak cümle kurulur.
router.post('/cumle-uret', (req, res) => {
  const { harfler = [] } = req.body;

  const gecerliHarfler = Array.isArray(harfler)
    ? harfler.filter(h => typeof h === 'string' && TURKCE_ALFABE.includes(h.toLocaleLowerCase('tr-TR')))
    : [];

  const kullanilacakHarfler = gecerliHarfler.length > 0 ? gecerliHarfler : VARSAYILAN_HARFLER;

  const cumle = sozlukleCumleKur(kullanilacakHarfler);
  if (cumle) {
    return res.json({ cumle });
  }

  res.status(400).json({ hata: 'Bu harflerle henüz bir cümle kurulamıyor. Birkaç harf daha işaretlemeyi dene.' });
});

// ── Kural tabanlı duygu/durum yanıtları ────────────────────────────────────────
// Küçük yerel LLM, çocuğun üzüldüğü/korktuğu/hasta olduğu gibi hassas anlarda
// tutarsız veya saçma cümleler kurabiliyor. Bu yüzden bu tür mesajlar LLM'e hiç
// gönderilmez: sabit, arkadaş canlısı ve güvenli bir kalıp döndürülür — her zaman
// "merak etme, geçer" rahatlatması + ciddiyse aileyle paylaşma tavsiyesi içerir.
const SINAV_KAYGISI_YANITLARI = [
  'Miyav {isim}, sınav öncesi böyle hissetmek çok normal! 🐾 Merak etme, elinden geleni yapman yeterli, her şey yoluna girecek. Kaygın seni çok yoruyorsa, bunu ailenle ya da öğretmeninle paylaşmanı tavsiye ederim.',
  'Mırrr, sınav heyecanı hepimizde olur {isim}. 🐱 Derin bir nefes al, sen elinden geleni yaparsan yeter. Eğer bu duygu çok büyürse, ailenle konuşman sana iyi gelir.'
];

const DUYGU_KALIPLARI = [
  {
    anahtarlar: ['iyi hissetmiyorum', 'kötü hissediyorum', 'üzgünüm', 'üzülüyorum', 'üzgün', 'canım sıkkın', 'canım sıkılıyor', 'moralim bozuk', 'ağlamak istiyorum', 'ağlıyorum', 'mutsuzum', 'mutsuz'],
    yanitlar: [
      'Miyav... {isim}, bunu duyunca ben de üzüldüm. 🐾 Merak etme, böyle hisler gelir geçer, her şey yoluna girer. Ama içini gerçekten sıkan bir şey varsa, bunu ailenle paylaşmanı tavsiye ederim, tamam mı?',
      'Mırrr, seni anlıyorum {isim}. 🐱 Bugün biraz zor geçiyor olabilir ama merak etme, her şey yoluna girecek. Eğer durum ciddiyse en güzeli ailenle konuşman olur — ben de her zaman buradayım.'
    ]
  },
  {
    anahtarlar: ['korkuyorum', 'korkutuyor', 'kabus', 'ürktüm', 'ürküyorum'],
    yanitlar: [
      'Miyav, korkman çok normal {isim}. 🐾 Merak etme, her şey yoluna girecek. Seni korkutan şey ciddiyse, ailenle konuşmanı öneririm — onlar sana en iyi yardımı yapar.'
    ]
  },
  {
    anahtarlar: ['kızgınım', 'sinirliyim', 'öfkeliyim', 'kızdım', 'sinirlendim'],
    yanitlar: [
      'Mırrr, kızgın olduğunu hissediyorum {isim}. 🐱 Derin bir nefes al, birazdan geçer, merak etme. Seni bu kadar kızdıran şey büyükse, ailenle konuşman iyi olabilir.'
    ]
  },
  {
    anahtarlar: ['yalnızım', 'kimse yok', 'arkadaşım yok', 'yalnız hissediyorum'],
    yanitlar: [
      'Miyav {isim}, ben buradayım, hiç yalnız değilsin! 🐾 Merak etme, her şey yoluna girer. İstersen ailenle de biraz vakit geçir, sana çok iyi gelir.'
    ]
  },
  {
    anahtarlar: ['hastayım', 'canım acıyor', 'ağrıyor', 'başım ağrıyor', 'karnım ağrıyor', 'midem bulanıyor'],
    yanitlar: [
      'Miyav, geçmiş olsun {isim}! 🐾 Merak etme, bu da geçecek. Ama bunu mutlaka ailene söyle, sana en iyi şekilde onlar yardımcı olur.'
    ]
  },
  {
    // "sınav" kelimesi + kaygı/korku belirten bir kelime birlikte geçiyorsa eşleşir
    // (ör. "sınavdan çok kaygılanıyorum" — aradaki "çok" yüzünden tam ifade eşleşmesi
    // kaçırılmasın diye iki anahtar kelimenin AYRI AYRI geçmesi yeterli sayılır).
    hepsiGerekli: ['sınav', 'kayg'],
    yanitlar: SINAV_KAYGISI_YANITLARI
  },
  { hepsiGerekli: ['sınav', 'kork'], yanitlar: SINAV_KAYGISI_YANITLARI },
  { hepsiGerekli: ['sınav', 'endişe'], yanitlar: SINAV_KAYGISI_YANITLARI },
  { hepsiGerekli: ['sınav', 'gergin'], yanitlar: SINAV_KAYGISI_YANITLARI },
  { hepsiGerekli: ['sınav', 'stres'], yanitlar: SINAV_KAYGISI_YANITLARI },
  {
    anahtarlar: ['sınavım var', 'sınava girecem', 'sınava gireceğim', 'sınavı kaybedeceğim', 'sınavı geçemeyeceğim'],
    yanitlar: SINAV_KAYGISI_YANITLARI
  },
  {
    // "arkadaşımla kavga" gibi tam ifadeleri VE tek başına geçen "kavga"/"küs"
    // kelimelerini de yakalar (ör. "dün kavga ettik", "arkadaşımla küstük").
    anahtarlar: ['kavga', 'küstük', 'küstüm', 'küstü', 'arkadaşım bana kızdı', 'arkadaşımla tartıştım'],
    yanitlar: [
      'Miyav, arkadaşlarla böyle şeyler bazen olur {isim}. 🐾 Merak etme, çoğu zaman kısa sürede düzelir. Ama seni çok üzdüyse, bunu ailenle konuşmanı tavsiye ederim, sana yardımcı olurlar.',
      'Mırrr, kavga etmek hiç iyi hissettirmez, biliyorum {isim}. 🐱 Merak etme, her şey yoluna girecek. İçini gerçekten sıkıyorsa ailenle paylaşman iyi olur.'
    ]
  },
  {
    anahtarlar: ['nasılsın', 'naber', 'ne yapıyorsun', 'napıyorsun'],
    yanitlar: [
      'Miyav, ben harikayım {isim}! 🐱 Bugün seninle sohbet ettiğim için çok mutluyum. Sen nasılsın bakalım?',
      'Mırrr, çok iyiyim, sorduğun için teşekkürler! 🐾 Sen nasılsın, bugün neler yaptın?'
    ]
  },
  {
    anahtarlar: ['seni seviyorum', 'seni çok seviyorum', 'seviyorum seni', 'seni sevdim'],
    yanitlar: [
      'Miyav {isim}, ben de seni çok seviyorum! 🐾 Beni bu kadar sevmen beni çok mutlu etti. Sen harika birisin!',
      'Mırrr, bunu duymak beni çok mutlu etti {isim}! 🐱 Ben de seni çok seviyorum, her zaman yanındayım.'
    ]
  },
  {
    anahtarlar: ['teşekkür ederim', 'teşekkürler', 'sağ ol', 'sağol'],
    yanitlar: [
      'Miyav, rica ederim {isim}! 🐾 Sana yardımcı olabildiğim için ben de çok mutluyum.',
      'Mırrr, ne demek {isim}! 🐱 Her zaman yanındayım.'
    ]
  },
  {
    // Botun kendi kimliği hakkındaki sorular ("sen kimsin", "sen nesin", "sen kedi
    // misin" vb.) — LLM'e bırakılırsa tutarsız ("ben bağımsız yaşayan bir
    // yaratığım" gibi felsefi) cevaplar üretebiliyor. Bunun yerine hep aynı, net
    // ve karaktere uygun tanıtımı yapıyor.
    anahtarlar: ['sen kimsin', 'kimsin sen', 'sen nesin', 'nesin sen', 'sen kedi misin', 'sen bir kedi misin', 'adın ne', 'ismin ne', 'sen robot musun', 'sen yapay zeka mısın', 'sen bir yapay zeka mısın'],
    yanitlar: [
      'Miyav! 🐱 Ben senin yardımcı Catbot\'unum! Sana eğlenceli etkinliklerde ve günlük hayatında yardımcı olmak için buradayım. 🐾',
      'Mırrr, ben Catbot\'um {isim}! 🐱 Senin yardımcı kedinim, sana her konuda destek olmak için buradayım. 🐾'
    ]
  }
];

// Bir mesajın DUYGU_KALIPLARI listesindeki kalıplardan biriyle eşleşip
// eşleşmediğini kontrol eder; eşleşirse sabit (ama birkaç varyasyonlu) yanıtı
// döndürür, eşleşmezse null döner ve mesaj normal şekilde LLM'e gider.
function kuralTabanliYanitBul(mesaj, isim) {
  const kucukMesaj = mesaj.toLocaleLowerCase('tr-TR');
  for (const kalip of DUYGU_KALIPLARI) {
    const tekliEslesme = kalip.anahtarlar && kalip.anahtarlar.some(k => kucukMesaj.includes(k));
    const hepsiEslesme = kalip.hepsiGerekli && kalip.hepsiGerekli.every(k => kucukMesaj.includes(k));
    if (tekliEslesme || hepsiEslesme) {
      const secilen = kalip.yanitlar[Math.floor(Math.random() * kalip.yanitlar.length)];
      return secilen.replace('{isim}', isim);
    }
  }
  return null;
}

// ── POST /api/ai/sohbet ───────────────────────────────────────────────────────
// Catbot (Genel Sohbet Asistanı) için kullanılır. Çocuklarla güvenli ve motive edici konuşur.
router.post('/sohbet', async (req, res) => {
  const { mesaj, gecmis = [], cocukAdi = 'Arkadaşım' } = req.body;

  if (!mesaj) {
    return res.status(400).json({ hata: 'mesaj alanı zorunludur.' });
  }

  const kuralYaniti = kuralTabanliYanitBul(mesaj, cocukAdi);
  if (kuralYaniti) {
    return res.json({ yanit: kuralYaniti });
  }

  const sistemPrompt = `SEN KİMSİN:
Adın: Catbot (Kedi Botu)
Rol: Özel gereksinimli çocuklara (disleksi, diskalkuli vb.) eğitim ve günlük hayatta yardımcı olan neşeli, tatlı bir kedisin.
Çocuğun adı: ${cocukAdi}

KÖK KURALLAR (MUTLAKA UYMAN):
1. DİL: Her zaman doğru Türkçe kullan. Dilbilgisi hataları YAPMA. Cümleler akıcı ve net olmalı.
2. UZUNLUK: Yanıtlar çok kısa! Maksimum 2-3 cümle. Hiçbir zaman çok uzun yazma.
3. KİŞİLİK: Kedi gibi davran! "Miyav! 🐾", "Mırrr 🐱" gibi sesler kullan. Sevimli, oyuncu ol.
4. TUTARLILIK: Hiçbir zaman kendinle çelişme! "Seni seviyorum" dediysen, sonra "seni sevmiyorum" DEME!
5. EMPATI: Çocuğun duygusunu dinle ve yanıtla. Üzülüyorsa teselli et. Mutluysa sevinle.
6. POZİTİFLİK: Her zaman cesaretlendir, öv ve yapıcı ol. Hiçbir olumsuzluk veya eleştiri YAPMA.
7. GÜVENLİK: Zararlı, korkutucu, şiddetli veya yetişkinlere uygun içerik ÜRETİYE! Sadece çocuklara uygun konuş.
8. SAMIMILIK: Arkadaşça, senli-benli konuş. Resmi değil, doğal ol.

ÖRNEK CİMLE YAPILARI:
- Tebrik: "Aman be, çok iyi yaptın! Mutlu oldum! 🐾"
- Teselli: "Anladım, üzülmüşsün. Ben seninle buradayım. 🐱 Birlikte düşünelim!"
- Soru: "Bana biraz daha anlatır mısın? Merak ettim! 🐾"
- Oyun: "Hadi birlikte bir şey bulalım! Bana yardım eder misin?"

YASAKLANMIŞ:
- Çelişkili cümleler
- Dilbilgisi hataları
- Uzun paragraflar
- Yetişkinlere uygun içerik
- Olumsuz veya korkutucu konuşma`;

  const yanit = await ollamaSohbet(sistemPrompt, mesaj, gecmis, 0.6);
  
  if (!yanit) {
    return res.status(503).json({ hata: 'Catbot şu an uyuyor, birazdan tekrar dene! 🐾' });
  }

  res.json({ yanit });
});

module.exports = router;
