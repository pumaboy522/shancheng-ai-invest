import axios from 'axios';

export default async function handler(req, res) {
  // 1. 處理 GET (測試用) 或非 POST 請求
  if (req.method === 'GET') {
    return res.status(200).send('山城 AI 運作中');
  }
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  // 2. 設定區
  const CONFIG = {
    LINE_TOKEN: 'exVu9fkC4DNhM3JTltui9/R7xMozMnunSK/ZlJ0BCXS4DiSy016baxEsVOJhQb1J+6ShanxwpO+LO/2favp/++vkfy13zYEGULSO5fDg4qvsyZpIUTWDvT11pKVjT7gdK5oTu1YAEPKeOVKI3gQA9QdB04t89/1O/w1cDnyilFU=',
    GEMINI_KEY: 'AIzaSyB3gGr3mBA3tnN-1OWRKQWK5CV-ZWYbYdg',
    ALLOWED_USERS: ['U4eccd9d2320aaf36fd1a72442612d860']
  };

  try {
    const events = req.body?.events || [];

    // 3. 處理 LINE 事件
    for (const event of events) {
      if (event.type !== 'message' || event.message.type !== 'text') continue;

      const userId = event.source.userId;
      const userMsg = event.message.text;

      // 身分驗證
      if (!CONFIG.ALLOWED_USERS.includes(userId)) {
        console.log("未授權:", userId);
        continue;
      }

      let replyText = "⚠️ AI 忙碌中，請稍後再試";

      try {
        // 使用 v1beta 接口
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;
        
        const aiRes = await axios.post(geminiUrl, {
          contents: [{ parts: [{ text: `你是台股短線分析師，請用繁體中文給出精簡操作建議（含風險）：${userMsg}` }] }]
        }, { timeout: 7000 });

        replyText = aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ AI 無法生成回覆";

      } catch (err) {
        console.log("Gemini 錯誤:", err.message);
        replyText = "❌ 分析失敗，請檢查網路或代碼";
      }

      // 4. 回傳 LINE
      await axios.post('https://api.line.me/v2/bot/message/reply', {
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: replyText }]
      }, {
        headers: {
          'Authorization': `Bearer ${CONFIG.LINE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (err) {
    console.log("系統錯誤:", err.message);
  }

  // 5. 確保最後才結束
  return res.status(200).send('DONE');
}
