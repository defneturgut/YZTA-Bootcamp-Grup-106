/* ==========================================================================
   OLLAMA.JS
   Yerel LLM (Ollama) ile konuşan ince yardımcı katman.
   - Çocuklara yönelik olduğu için her istekte sıkı bir sistem promptu zorunludur
   - Ollama kapalı/yavaş/hatalıysa null döner, çağıran route dostane hata verir
   - Basit bir "yasaklı kelime" filtresi son savunma hattı olarak yanıtı süzer
   ========================================================================== */

require('dotenv').config();

const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const ZAMAN_ASIMI_MS = 30000;

// Çocuk güvenliği için son savunma hattı: yanıtta bu kelimelerden biri geçerse
// yanıt tamamen reddedilir (sistem promptu zaten bunları üretmemesi için talimatlandırır).
const YASAKLI_KELIMELER = [
  'seks', 'çıplak', 'silah', 'öldür', 'kan', 'şiddet', 'küfür',
  'sigara', 'alkol', 'uyuşturucu', 'korku', 'kabus', 'ölüm'
];

function yanitGuvenliMi(metin) {
  const kucukMetin = metin.toLocaleLowerCase('tr-TR');
  return !YASAKLI_KELIMELER.some(kelime => kucukMetin.includes(kelime));
}

/**
 * Ollama'nın /api/chat uç noktasına sohbet isteği gönderir.
 * @param {string} sistemPrompt - Modelin rolünü ve kısıtlarını tanımlar
 * @param {string} kullaniciMesaji - Kullanıcının (çocuğun) yeni mesajı
 * @param {Array<{rol: 'user'|'assistant', metin: string}>} gecmis - Önceki sohbet turları
 * @returns {Promise<string|null>} Model yanıtı, hata/güvensiz içerikte null
 */
async function ollamaSohbet(sistemPrompt, kullaniciMesaji, gecmis = [], sicaklik = 0.6, durdurmaDizileri = []) {
  const mesajlar = [
    { role: 'system', content: sistemPrompt },
    ...gecmis.map(m => ({ role: m.rol === 'assistant' ? 'assistant' : 'user', content: m.metin })),
    { role: 'user', content: kullaniciMesaji }
  ];

  const kontrolci = new AbortController();
  const zamanAsimi = setTimeout(() => kontrolci.abort(), ZAMAN_ASIMI_MS);

  try {
    const yanit = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: mesajlar,
        stream: false,
        options: durdurmaDizileri.length > 0
          ? { temperature: sicaklik, stop: durdurmaDizileri }
          : { temperature: sicaklik }
      }),
      signal: kontrolci.signal
    });

    if (!yanit.ok) {
      console.warn('⚠️ Ollama hata döndü:', yanit.status);
      return null;
    }

    const veri = await yanit.json();
    const icerik = veri?.message?.content?.trim();

    if (!icerik) return null;
    if (!yanitGuvenliMi(icerik)) {
      console.warn('⚠️ Ollama yanıtı güvenlik filtresine takıldı, reddedildi.');
      return null;
    }

    return icerik;
  } catch (hata) {
    console.warn('⚠️ Ollama erişilemiyor:', hata.message);
    return null;
  } finally {
    clearTimeout(zamanAsimi);
  }
}

module.exports = { ollamaSohbet };
