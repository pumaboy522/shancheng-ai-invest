const axios = require('axios');

export default async function handler(req, res) {
  // 一進來先回傳 OK，讓 LINE Verify 秒過
  res.status(200).send('OK');

  if (req.method !== 'POST') return;

  const CONFIG = {
    LINE_TOKEN: 'exVu9fkC4DNhM3JTltui9/R7xMozMnunSK/ZlJ0BCXS4DiSy016baxEsVOJhQb1J+6ShanxwpO+LO/2favp/++vkfy13zYEGULSO5fDg4qvsyZpIUTWDvT11pKVjT7gdK5oTu1YAEPKeOVKI3gQA9QdB04t89/1O/w1cDnyilFU=',
    GEMINI_KEY: 'AIzaSyB3gGr3mBA3tnN-1OWRKQWK5CV-ZWYbYdg'
  };

  const events = req.body.events;
  if (!events || events.length === 0) return;

  for (let event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMsg = event.message.text.trim();
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;
        const aiRes = await axios.post(geminiUrl, {
          contents: [{ parts: [{ text: `你是山城 AI 股票經理人，請分析：${userMsg}` }] }]
        });

        const replyText = aiRes.data.candidates[0].content.parts[0].text;

        // 推播分析結果回傳
        await axios.post('https://api.line.me/v2/bot/message/push', {
          to: event.source.userId,
          messages: [{ type: 'text', text: `📊 【山城投顧分析】\n\n${replyText}` }]
        }, { headers: { Authorization: `Bearer ${CONFIG.LINE_TOKEN}` } });

      } catch (err) { console.error("AI Error"); }
    }
  }
}
