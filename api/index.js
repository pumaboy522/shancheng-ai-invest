const axios = require('axios');

export default async function handler(req, res) {
  // 這是最重要的一行：無論發生什麼，都要先回覆 LINE 200 OK
  try {
    if (req.method === 'POST') {
      const CONFIG = {
        LINE_TOKEN: 'exVu9fkC4DNhM3JTltui9/R7xMozMnunSK/ZlJ0BCXS4DiSy016baxEsVOJhQb1J+6ShanxwpO+LO/2favp/++vkfy13zYEGULSO5fDg4qvsyZpIUTWDvT11pKVjT7gdK5oTu1YAEPKeOVKI3gQA9QdB04t89/1O/w1cDnyilFU=',
        GEMINI_KEY: 'AIzaSyB3gGr3mBA3tnN-1OWRKQWK5CV-ZWYbYdg'
      };

      const events = req.body.events;
      if (events && events.length > 0 && events[0].message) {
        const event = events[0];
        const userMsg = event.message.text;

        // 呼叫 Gemini AI
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;
        const aiRes = await axios.post(geminiUrl, {
          contents: [{ parts: [{ text: `你是山城 AI 股票經理人，請用繁體中文分析：${userMsg}` }] }]
        });

        const replyText = aiRes.data.candidates[0].content.parts[0].text;

        // 回傳給使用者
        await axios.post('https://api.line.me/v2/bot/message/reply', {
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: replyText }]
        }, { headers: { Authorization: `Bearer ${CONFIG.LINE_TOKEN}` } });
      }
    }
    // 確保最後一定會送出 200
    res.status(200).send('OK');
  } catch (error) {
    console.error(error);
    // 即使報錯也要送出 200，避免 LINE Webhook 報警
    res.status(200).send('OK');
  }
}
