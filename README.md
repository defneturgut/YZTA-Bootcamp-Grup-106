# 🌈 Benim Dünyam

**Takım:** Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak — YZTA Bootcamp Grup 106

**Benim Dünyam**, özel gereksinimli çocuklara (disleksi, diskalkuli vb.) yönelik olarak geliştirilmiş, eğlenceli ve erişilebilir bir eğitim ve günlük yaşam destek uygulamasıdır. Çocuklar için oyunlaştırılmış öğrenme aktiviteleri, duygu takibi ve yapay zekâ destekli bir sohbet arkadaşı (Catbot) sunarken; ebeveynlere de çocuklarının gelişimini takip edebilecekleri bir panel sağlar.

YZTA Bootcamp Grup 106 kapsamında geliştirilmiştir.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknolojiler](#-teknolojiler)
- [Proje Yapısı](#-proje-yapısı)
- [Kurulum](#-kurulum)
- [Çalıştırma](#-çalıştırma)
- [Ortam Değişkenleri (.env)](#-ortam-değişkenleri-env)
- [API Uç Noktaları](#-api-uç-noktaları)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Proje Geliştirme Süreci (Sprint Raporları)](#-proje-geliştirme-süreci-sprint-raporları)

---

## ✨ Özellikler

- **🐱 Catbot** — Ollama üzerinde çalışan yerel bir yapay zekâ modeliyle konuşan, çocuk-güvenli, kedi karakterli sohbet asistanı. Duygusal durumlara (üzüntü, korku, kaygı, kavga vb.) kural tabanlı, güvenli ve tutarlı yanıtlar; diğer konularda ise yapay zekâ destekli sohbet sunar.
- **😊 Duygu Kartları** — Çocuğun o anki duygusunu seçip kaydedebildiği, ebeveynin de takip edebildiği bir modül.
- **🍎 Sayı Bahçesi** — Diskalkuli (matematik güçlüğü) yaşayan çocuklar için meyvelerle toplama, çıkarma, çarpma ve bölme alıştırmaları.
- **✏️ Yazı Atölyesi** — Disleksi yaşayan çocuklar için dinle-yaz alıştırmaları ve harf ayırt etme oyunları.
- **📅 Günüm** — Günlük yapılacaklar listesi, planlayıcı ve yapay zekâ destekli gün planı sohbeti.
- **🌟 Oyunlaştırma** — Doğru cevaplar ve tamamlanan oturumlarla kazanılan XP, seviye ilerlemesi ve rozetler (🥉🥈🥇).
- **♿ Erişilebilirlik** — Yazı boyutu ayarı, yüksek kontrast modu, disleksi dostu font seçeneği ve sesli okuma (metinden sese).
- **🌿 Sakinleşme Molası** — Anksiyete anlarında kullanılabilecek nefes egzersizi ekranı.
- **⚙️ Ebeveyn Paneli** — PIN korumalı, çocuğun oyun istatistiklerini ve gelişimini görüntüleyebileceği panel.

## 🛠 Teknolojiler

**Backend**
- Node.js + Express
- Dosya tabanlı JSON veritabanı (harici veritabanı gerektirmez)
- [Ollama](https://ollama.com) ile yerel LLM entegrasyonu (Catbot ve gün planı asistanı için)

**Frontend**
- Saf HTML, CSS ve JavaScript (framework yok)
- Web Speech API (sesli okuma ve sesli komut)

## 📁 Proje Yapısı

```
benim_dunyam/
├── backend/
│   ├── server.js          # Express sunucusu, ana giriş noktası
│   ├── db.js               # JSON dosya tabanlı veritabanı katmanı
│   ├── ollama.js            # Ollama (yerel LLM) ile iletişim katmanı
│   ├── benim_dunyam.json    # Veritabanı dosyası (otomatik oluşturulur)
│   ├── .env                 # Ortam değişkenleri (kendin oluşturman gerekir)
│   └── routes/
│       ├── profil.js        # Çocuk profili CRUD işlemleri
│       ├── duygu.js         # Duygu kartı kayıtları
│       ├── gorevler.js      # Günlük yapılacaklar listesi
│       ├── skorlar.js       # Oyun skorları ve istatistikler
│       ├── onemliGunler.js  # Önemli günler / doğum günü vb.
│       ├── planlayici.js    # Gün planlayıcı
│       ├── ai.js            # Catbot ve AI destekli gün planı uç noktaları
│       └── ebeveyn.js       # Ebeveyn paneli PIN doğrulama
└── frontend/
    ├── ana-sayfa.html       # Ana sayfa / dashboard
    ├── profil.html          # Profil oluşturma ve düzenleme
    ├── index.html           # Duygu kartları
    ├── diskalkuli.html/js   # Sayı Bahçesi (matematik oyunu)
    ├── disleksi.html/js     # Yazı Atölyesi (dinle-yaz)
    ├── takvim.html/js       # Günüm (planlayıcı)
    ├── ebeveyn.html/js      # Ebeveyn paneli
    ├── ortak.js             # Ortak yardımcı fonksiyonlar (Catbot, erişilebilirlik, profil vb.)
    └── style.css            # Genel stil dosyası
```

## 🚀 Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org) (v18 veya üzeri önerilir)
- npm (Node.js ile birlikte gelir)
- [Ollama](https://ollama.com) — Catbot ve yapay zekâ destekli gün planı özelliklerinin çalışması için (opsiyonel, kurulmazsa uygulamanın geri kalanı normal çalışmaya devam eder)

### Adımlar

1. **Projeyi klonla / indir**

   ```bash
   git clone <repo-url>
   cd benim_dunyam
   ```

2. **Backend bağımlılıklarını kur**

   ```bash
   cd backend
   npm install
   ```

3. **`.env` dosyasını oluştur**

   `backend/` klasörü içine bir `.env` dosyası oluştur (aşağıdaki [Ortam Değişkenleri](#-ortam-değişkenleri-env) bölümüne bak).

4. **(Opsiyonel) Ollama'yı kur ve modeli indir**

   ```bash
   # Ollama'yı https://ollama.com adresinden indir, ardından:
   ollama pull qwen2.5:3b
   ollama serve
   ```

## ▶️ Çalıştırma

Backend klasöründeyken:

```bash
# Geliştirme modu (dosya değişikliklerinde otomatik yeniden başlar)
npm run dev

# veya production modu
npm start
```

Sunucu ayağa kalktığında terminalde şunu göreceksin:

```
🚀 Benim Dünyam API → http://localhost:3001
   Sağlık kontrolü  → http://localhost:3001/api/saglik
```

Backend, `frontend/` klasöründeki dosyaları da otomatik olarak sunar. Tarayıcında şu adresi aç:

```
http://localhost:3001
```

> 💡 Ayrıca `frontend/index.html` dosyasını doğrudan tarayıcıda `file://` protokolüyle de açabilirsin — backend CORS ayarları buna izin verecek şekilde yapılandırılmıştır.

## 🔧 Ortam Değişkenleri (.env)

`backend/.env` dosyası aşağıdaki değişkenleri içermelidir:

```env
PORT=3001
DB_PATH=./benim_dunyam.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
EBEVEYN_PIN=1234
```

| Değişken | Açıklama |
|---|---|
| `PORT` | Backend sunucusunun çalışacağı port |
| `DB_PATH` | JSON veritabanı dosyasının yolu |
| `OLLAMA_URL` | Ollama sunucusunun adresi (varsayılan: yerel) |
| `OLLAMA_MODEL` | Catbot ve gün planı asistanının kullanacağı model adı |
| `EBEVEYN_PIN` | Ebeveyn paneline erişim için 4 haneli PIN kodu |

## 🔌 API Uç Noktaları

| Yöntem | Uç Nokta | Açıklama |
|---|---|---|
| GET | `/api/saglik` | Sunucu sağlık kontrolü |
| GET/POST/PUT | `/api/profil` | Çocuk profili işlemleri |
| GET/POST | `/api/duygu` | Duygu kartı kayıtları |
| GET/POST | `/api/gorevler` | Günlük yapılacaklar listesi |
| GET/POST | `/api/skorlar` | Oyun skorları ve istatistikler |
| GET/POST | `/api/onemli-gunler` | Önemli günler |
| GET/POST | `/api/planlayici` | Gün planlayıcı |
| POST | `/api/ai/sohbet` | Catbot ile sohbet |
| POST | `/api/ai/gunum-sohbet` | AI destekli gün planı oluşturma |
| POST | `/api/ebeveyn/pin-dogrula` | Ebeveyn paneli PIN doğrulama |

---

## 📝 Proje Geliştirme Süreci (Sprint Raporları)

# YZTA-Bootcamp-Grup-106
# Güncel Ürün Ekran Görüntüleri
<img width="1468" height="807" alt="ana sayfa" src="https://github.com/user-attachments/assets/ac163009-5b09-427e-b419-11608d3be1e0" />
<img width="1372" height="735" alt="duygu kartları" src="https://github.com/user-attachments/assets/fd20d6d7-95cd-4961-95a3-4cc4060141d6" />
<img width="1318" height="614" alt="günüm" src="https://github.com/user-attachments/assets/d181145d-0839-468c-b7e3-125475eabbd0" />
<img width="1195" height="740" alt="sayı bahçesi" src="https://github.com/user-attachments/assets/fdc9fdca-8a5c-4c50-aa49-ffaf88c9c4b8" />
<img width="1204" height="783" alt="yazı atölyesii" src="https://github.com/user-attachments/assets/facc099f-a7c0-473e-8c4a-328c402ed3e3" />
# Sprint Board
<img width="1596" height="909" alt="Sprint Board" src="https://github.com/user-attachments/assets/dd25742c-7d47-4f13-9d09-71df82d73422" />
<img width="607" height="864" alt="Screenshot 2026-07-05 at 19 39 32" src="https://github.com/user-attachments/assets/a0eadfb5-d49f-44bb-b104-ab93aaa32d2f" />
<img width="602" height="818" alt="Screenshot 2026-07-05 at 19 39 23" src="https://github.com/user-attachments/assets/6884a5b9-b15b-4560-95f3-94ccbfa4a8a0" />
<img width="604" height="860" alt="Screenshot 2026-07-05 at 19 39 07" src="https://github.com/user-attachments/assets/d7f49c03-df67-4250-8dab-37b06a0f9c08" />
<img width="608" height="860" alt="Screenshot 2026-07-05 at 19 39 15" src="https://github.com/user-attachments/assets/173875eb-b285-4fcc-9783-4060a2c1da9f" />
<img width="604" height="861" alt="Screenshot 2026-07-05 at 19 34 39" src="https://github.com/user-attachments/assets/a8868aad-b1a6-4aae-a5ac-c41387347f34" />
<img width="605" height="850" alt="Screenshot 2026-07-05 at 19 34 59 1" src="https://github.com/user-attachments/assets/91719f01-0cbd-4f43-b96e-774bf1ca0a74" />
<img width="595" height="849" alt="Screenshot 2026-07-05 at 19 34 59" src="https://github.com/user-attachments/assets/c385f0c9-16aa-450f-bb01-c7a42b9b6631" />

# Sprint 2 – Daily Scrum
# Daily Scrum 1

Tarih: 13.07.2026

Katılımcılar: Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak

Neler yaptık?
Sprint 1 başarıyla tamamlandı.
Nihai frontend tasarımı belirlendi.
Proje klasör yapısı oluşturuldu.
Geliştirme ortamı hazırlandı.
Bugün neler yapacağız?
Kullanıcı giriş ekranı geliştirilecek.
Çocuk profili veri modeli oluşturulacak.
Dashboard bileşenleri geliştirilmeye başlanacak.
Karşılaşılan engeller
Rol bazlı yetkilendirme yapısının nasıl tasarlanacağı üzerinde araştırma devam ediyor.

# Daily Scrum 2

Tarih: 18.07.2026

Katılımcılar: Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak

Neler yaptık?
Login ve kayıt ekranlarının ilk taslağı tamamlandı.
Dashboard bileşenlerinin büyük bölümü geliştirildi.
Çocuk profili ekranının temel yapısı oluşturuldu.
Bugün neler yapacağız?
Öğretmen–veli eşleştirme altyapısı geliştirilecek.
Responsive düzenlemeler yapılacak.
Tamamlanan modüller test edilmeye başlanacak.
Karşılaşılan engeller
Frontend ile backend veri yapılarının uyumlu hale getirilmesi için küçük revizyonlara ihtiyaç duyuldu.

# Sprint 2 – Sprint Review
# Sprint Hedefi
Kullanıcı yönetimi altyapısını oluşturmak ve seçilen arayüz tasarımını çalışan bir prototipe dönüştürmek.

# Tamamlanan Çalışmalar
Kullanıcı kayıt ve giriş ekranlarının ilk sürümü geliştirildi.
Dashboard sayfasının temel yapısı oluşturuldu.
Çocuk profili ekranı tasarlandı ve veri giriş alanları eklendi.
Kullanıcı rollerine uygun temel veritabanı yapısı oluşturuldu.
Frontend template projeye entegre edildi.
Responsive tasarım çalışmalarına başlandı.
# Gösterilen Çıktılar
Login ekranı
Dashboard ekranı
Çocuk profili oluşturma ekranı
Menü ve navigasyon yapısı
Sprint Hedefi Gerçekleşme Durumu

Sprint hedeflerinin büyük bölümü başarıyla tamamlanmıştır. Rol bazlı yetkilendirme ve bazı responsive düzenlemeler bir sonraki sprintte tamamlanacaktır.

# Sprint 2 – Sprint Retrospective
# İyi Gidenler
Takım üyeleri arasındaki iletişim önceki sprinte göre daha düzenli ilerledi.
Frontend geliştirme süreci planlanan takvime uygun devam etti.
Seçilen tasarımın uygulanması beklenenden daha hızlı gerçekleşti.
Görev dağılımı dengeli şekilde yapıldı.
# Geliştirilebilecek Noktalar
Backend ve frontend geliştirmeleri daha senkron ilerlemeli.
Kod inceleme (Code Review) süreçleri daha sık yapılmalı.
Test senaryoları sprint boyunca hazırlanmalı, sprint sonuna bırakılmamalı.
# Sonraki Sprint İçin Alınan Kararlar
BEP ve eğitim modüllerinin geliştirilmesine başlanacak.
Öğretmen ve veli panelleri birbirinden ayrılacak.
Günlük gelişim kayıtları ve eğitim notları sisteme eklenecek.
API entegrasyonları tamamlanacak.
Birim testleri ve kullanıcı testleri sprint sürecine dahil edilecek.

# Scrum Board
<img width="1440" height="677" alt="Screenshot 2026-07-19 at 11 54 42" src="https://github.com/user-attachments/assets/2eaa3151-4332-4ccb-b4f7-b6fb328b2c85" />

# Güncel Güncel Ürün Ekran Görüntüleri
<img width="1499" height="949" alt="WhatsApp Image 2026-07-19 at 19 38 53" src="https://github.com/user-attachments/assets/a3fed64b-d426-4420-89af-db0b12c24886" />
<img width="1371" height="963" alt="WhatsApp Image 2026-07-19 at 19 38 53 (1)" src="https://github.com/user-attachments/assets/f03095d4-251e-4723-a8d7-c3367da660ff" />
<img width="1569" height="949" alt="WhatsApp Image 2026-07-19 at 19 38 53 (2)" src="https://github.com/user-attachments/assets/4c2e067d-917d-4b74-9312-75a0d79c6971" />
<img width="1460" height="794" alt="WhatsApp Image 2026-07-19 at 19 38 53 (3)" src="https://github.com/user-attachments/assets/f516b0a6-6dd9-4bf9-95f0-6b208a3fae29" />
<img width="1472" height="953" alt="WhatsApp Image 2026-07-19 at 19 38 54" src="https://github.com/user-attachments/assets/70856d7a-2e08-4705-8025-5c8fbe47a87a" />
<img width="1555" height="921" alt="WhatsApp Image 2026-07-19 at 19 38 54 (1)" src="https://github.com/user-attachments/assets/53b6b996-d873-4dec-8c80-cff83e5c7774" />

# Sprint 3

Platformun Minimum Viable Product (MVP) sürümünü tamamlamak, Ollama üzerinde çalışan Qwen modeli ile yapay zekâ destekli günlük rutin öneri sistemini geliştirmek ve uygulamaya entegre ederek projeyi teslim edilebilir hale getirmek.

# Sprint Backlog

# Sprint 3 - User Story 1
Yapay Zekâ Destekli Günlük Rutin Oluşturma

Açıklama:
Ebeveyn tarafından girilen çocuğun yaşı, özel gereksinim türü, ilgi alanları ve gelişim hedeflerine göre Ollama üzerinde çalışan Qwen modeli kullanılarak kişiselleştirilmiş günlük rutin önerileri oluşturulacaktır.

Alt Görevler:
Task 1.1 Ollama kurulumu ve Qwen modelinin hazırlanması
Task 1.2 Prompt tasarımının hazırlanması
Task 1.3 AI servisinin backend'e entegre edilmesi
Task 1.4 Günlük rutin önerilerinin kullanıcı arayüzünde gösterilmesi

# Sprint 3 - User Story 2
Eğitim ve Günlük Yaşam Modüllerinin Tamamlanması

Açıklama:
Sprint 2'de geliştirilen kullanıcı altyapısı üzerine eğitim ve günlük yaşam modülleri tamamlanacaktır.

Alt Görevler:
Task 2.1 Günlük rutin kayıt ekranı
Task 2.2 Eğitim aktivitesi giriş ekranı
Task 2.3 AI önerisinin rutin ekranına eklenmesi
Task 2.4 Dashboard özet kartlarının tamamlanması

# Sprint 3 - User Story 3
Sistem Testi ve Proje Teslimi

Açıklama:
Tüm modüllerin test edilmesi, hata düzeltmeleri ve proje sunumunun hazırlanması.

Alt Görevler:
Task 3.1 Entegrasyon testleri
Task 3.2 Hata düzeltmeleri
Task 3.3 Kullanıcı kabul testi
Task 3.4 Final sunumu ve demo hazırlanması

# Sprint Board

Ekran Görüntüsü:
<img width="1440" height="670" alt="Screenshot 2026-07-30 at 16 26 44" src="https://github.com/user-attachments/assets/c6ca381b-7538-4ac6-b5f6-d086ac5c3e74" />

Sprint Backlog

Sprint 3 - User Story 1
Sprint 3 - User Story 2
Sprint 3 - User Story 3

To Do

Sprint 3 - Task 1.4 AI rutinlerinin kullanıcı ekranında gösterilmesi
Sprint 3 - Task 2.4 Dashboard özet kartları
Sprint 3 - Task 3.3 Kullanıcı kabul testi
Sprint 3 - Task 3.4 Final sunumu hazırlanması

In Progress

Sprint 3 - Task 1.1 Ollama kurulumu ve Qwen modeli
Sprint 3 - Task 1.2 Prompt Engineering
Sprint 3 - Task 1.3 AI Backend Entegrasyonu
Sprint 3 - Task 2.1 Günlük rutin ekranı
Sprint 3 - Task 2.2 Eğitim aktivitesi ekranı
Sprint 3 - Task 2.3 AI önerilerinin entegrasyonu

Review

AI rutin önerilerinin doğruluğunun değerlendirilmesi
Kullanıcı deneyimi testleri
Sistem performans testi

Done
Sprint 2 tamamlandı
Kullanıcı yönetimi modülü tamamlandı
Çocuk profili modülü tamamlandı
Dashboard geliştirildi
Frontend template tamamen entegre edildi

# Daily Scrum

# Daily Scrum 1

Tarih: 20.07.2026

Katılımcılar: Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak

Dün neler yaptık?
Sprint 2 başarıyla tamamlandı.
AI entegrasyonu için Ollama ortamı hazırlandı.
Qwen modeli indirildi ve test edildi.

Bugün neler yapacağız?
Prompt yapısı oluşturulacak.
AI servisleri backend ile entegre edilecek.
Günlük rutin ekranı geliştirilecek.

Engeller
Prompt çıktılarının tutarlılığı için farklı istemler deneniyor.

# Daily Scrum 2

Tarih: 27.07.2026

Katılımcılar: Defne Turgut, Kadir Kızılyaprak, Ebrar Yumşak

Dün neler yaptık?
Yapay zekâ başarılı şekilde günlük rutin oluşturdu.
Dashboard AI önerilerini göstermeye başladı.
Eğitim ekranları tamamlandı.

Bugün neler yapacağız?
Son testler yapılacak.
Hatalar giderilecek.
Demo hazırlanacak.

Engeller
Önemli bir engel bulunmamaktadır.

# Sprint Review

Sprint Hedefi:
Yapay zekâ destekli günlük rutin oluşturma özelliğini tamamlayarak tüm modüllerin çalışır durumda olduğu MVP sürümünü oluşturmak.

Tamamlanan Çalışmalar:
Ollama kurulumu tamamlandı.
Qwen modeli sisteme entegre edildi.
Yapay zekâ destekli günlük rutin oluşturma başarıyla geliştirildi.
Günlük yaşam aktiviteleri modülü tamamlandı.
Eğitim aktiviteleri ekranları geliştirildi.
Dashboard üzerinde AI önerileri görüntülenmeye başlandı.
Sistem testleri gerçekleştirildi.
Projenin MVP sürümü başarıyla tamamlandı.

Demo:
Kullanıcı girişi
Çocuk profili oluşturma
Eğitim kayıt ekranı
Günlük rutin ekranı
Yapay zekâ tarafından oluşturulan kişiselleştirilmiş rutin önerisi
Dashboard üzerinden gelişim takibi

# Sprint Retrospective

İyi Gidenler:
Ollama ve Qwen modeli başarılı şekilde uygulamaya entegre edildi.
Takım içi görev paylaşımı verimli ilerledi.
Yapay zekâ çıktıları kullanıcı ihtiyaçlarını büyük ölçüde karşıladı.
Planlanan MVP kapsamı zamanında tamamlandı.

Geliştirilebilecek Noktalar:
Yapay zekâ önerileri daha fazla kullanıcı verisiyle kişiselleştirilebilir.
İlerleyen sürümlerde RAG desteği eklenebilir.
Mobil cihazlar için performans optimizasyonları yapılabilir.
AI çıktılarının doğruluğunu artırmak için daha kapsamlı prompt ve değerlendirme süreçleri geliştirilebilir.
