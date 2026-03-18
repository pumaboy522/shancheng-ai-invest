const axios = require('axios');

export default async function handler(req, res) {
  // 1. 這是解決 500 錯誤的關鍵：無論發生什麼，先給 LINE 200 OK
  res.status(200).send('OK');

  if (req.method !== 'POST') return;

  const CONFIG = {
    LINE_TOKEN: 'exVu9fkC4DNhM3JTltui9/R7xMozMnunSK/ZlJ0BCXS4DiSy016baxEsVOJhQb1J+6ShanxwpO+LO/2favp/++vkfy13zYEGULSO5fDg4qvsyZpIUTWDvT11pKVjT7gdK5oTu1YAEPKeOVKI3gQA9QdB04t89/1O/w1cDnyilFU=',
    GEMINI_KEY: 'AIzaSyB3gGr3mBA3tnN-1OWRKQWK5CV-ZWYbYdg'
  };

  const events = req.body.events;
  if (!events || !events[0]) return;

  const event = events[0];
  if (event.type === 'message' && event.message.type === 'text') {
    try {
      const userMsg = event.message.text;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;
      
      const aiRes = await axios.post(geminiUrl, {
        contents: [{ parts: [{ text: `你是山城 AI 經理人，請用繁體中文簡短分析這檔股票或回覆：${userMsg}` }] }]
      });

      const replyText = aiRes.data.candidates[0].content.parts[0].text;

      // 推播訊息回傳
      await axios.post('https://api.line.me/v2/bot/message/push', {
        to: event.source.userId,
        messages: [{ type: 'text', text: replyText }]
      }, { 
        headers: { 
          'Authorization': `Bearer ${CONFIG.LINE_TOKEN}`,
          'Content-Type': 'application/json'
        } 
      });

    } catch (err) {
      console.error("AI Error:", err.message);
    }
  }
}
