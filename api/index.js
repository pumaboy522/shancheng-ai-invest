const axios = require('axios');

export default async function handler(req, res) {
  // 這是最重要的一行：無論發生什麼，都要先回覆 LINE 200 OK
  try {
    if (req.method === 'POST') {
      const CONFIG = {
        LINE_TOKEN: process.env.LINE_TOKEN,
        GEMINI_KEY: process.env.GEMINI_KEY
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

        // 回傳給使用者（修正：使用正確的 LINE API Header）
        await axios.post('https://api.line.me/v2/bot/message/reply', {
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: replyText }]
        }, { headers: { 'X-Line-ChannelAccessToken': CONFIG.LINE_TOKEN } });
      }
    }
    // 確保最後一定會送出 200
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    // 即使報錯也要送出 200，避免 LINE Webhook 報警
    res.status(200).send('OK');
  }
}