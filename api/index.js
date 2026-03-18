import axios from 'axios';

export default async function handler(req, res) {
  // 1. 立即回覆 LINE 200 OK，這是解決 500 錯誤的最關鍵一步
  if (req.method === 'GET') {
    return res.status(200).send('山城 AI 伺服器運行中！');
  }
  res.status(200).send('OK');

  if (req.method !== 'POST') return;

  try {
    const CONFIG = {
      LINE_TOKEN: 'exVu9fkC4DNhM3JTltui9/R7xMozMnunSK/ZlJ0BCXS4DiSy016baxEsVOJhQb1J+6ShanxwpO+LO/2favp/++vkfy13zYEGULSO5fDg4qvsyZpIUTWDvT11pKVjT7gdK5oTu1YAEPKeOVKI3gQA9QdB04t89/1O/w1cDnyilFU=',
      GEMINI_KEY: 'AIzaSyB3gGr3mBA3tnN-1OWRKQWK5CV-ZWYbYdg',
      // 已鎖定您的 ID，只有您傳訊息 AI 才會回覆
      ALLOWED_USERS: ['U4eccd9d2320aaf36fd1a72442612d860']
    };

    const events = req.body.events;
    if (!events || !events[0] || events[0].type !== 'message') return;

    const event = events[0];
    const userId = event.source.userId;
    const userMsg = event.message.text;

    // 身分驗證鎖：防止外人消耗您的 API 額度
    if (!CONFIG.ALLOWED_USERS.includes(userId)) {
      console.log("攔截未授權使用者:", userId);
      return;
    }

    // 2. 呼叫 Gemini AI
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;
    const aiRes = await axios.post(geminiUrl, {
      contents: [{ parts: [{ text: `你是山城 AI 股票分析師，請簡短分析：${userMsg}` }] }]
    });

    const replyText = aiRes.data.candidates[0].content.parts[0].text;

    // 3. 回傳訊息給您的 LINE
    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: replyText }]
    }, { 
      headers: { 'Authorization': `Bearer ${CONFIG.LINE_TOKEN}` } 
    });

  } catch (err) {
    console.error("系統出錯:", err.message);
  }
}
