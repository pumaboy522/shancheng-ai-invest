import axios from 'axios';

export default async function handler(req, res) {
  // 1. 處理 GET 請求 (Vercel 預覽或 LINE Verify 時使用)
  if (req.method === 'GET') {
    return res.status(200).send('山城 AI 伺服器：運作中');
  }

  // 2. 只處理 POST (LINE Webhook)
  if (req.method !== 'POST') {
    return res.status(200).send('Method Not Allowed');
  }

  try {
    const CONFIG = {
      LINE_TOKEN: 'exVu9fkC4DNhM3JTltui9/R7xMozMnunSK/ZlJ0BCXS4DiSy016baxEsVOJhQb1J+6ShanxwpO+LO/2favp/++vkfy13zYEGULSO5fDg4qvsyZpIUTWDvT11pKVjT7gdK5oTu1YAEPKeOVKI3gQA9QdB04t89/1O/w1cDnyilFU=',
      GEMINI_KEY: 'AIzaSyB3gGr3mBA3tnN-1OWRKQWK5CV-ZWYbYdg',
      // 已鎖定您的 ID，通了之後再加先生的
      ALLOWED_USERS: ['U4eccd9d2320aaf36fd1a72442612d860']
    };

    const event = req.body?.events?.[0];
    if (!event || event.type !== 'message' || event.message.type !== 'text') {
      return res.status(200).send('OK');
    }

    const userId = event.source.userId;
    const userMsg = event.message.text;

    // 【身分鎖】
    if (!CONFIG.ALLOWED_USERS.includes(userId)) {
      console.log("未授權訪問:", userId);
      return res.status(200).send('BLOCKED');
    }

    let replyText = "⚠️ 系統分析中，請稍候...";

    // 3. 呼叫 Gemini AI (使用 v1beta 接口更穩定)
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;
      const aiRes = await axios.post(geminiUrl, {
        contents: [{ parts: [{ text: `你是山城 AI 股票分析師，請針對此訊息給予繁體中文短評（包含操作建議或風險提醒）：${userMsg}` }] }]
      });

      replyText = aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ AI 暫時沒有靈感";
    } catch (aiErr) {
      console.error("Gemini Error:", aiErr.message);
      replyText = "❌ AI 連線逾時，請再試一次";
    }

    // 4. 回傳訊息給 LINE (在 res.send 之前執行)
    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: replyText }]
    }, { 
      headers: { 
        'Authorization': `Bearer ${CONFIG.LINE_TOKEN}`,
        'Content-Type': 'application/json'
      } 
    });

    // 5. 【預留：寫入 Google 試算表】
    // 未來我們會在這裡加上：await axios.post(GAS_URL, { userId, userMsg, replyText });

    // 6. 最後才告訴 Vercel：事情做完了，你可以關機了
    return res.status(200).send('DONE');

  } catch (err) {
    console.error("Global Error:", err.message);
    return res.status(200).send('ERROR');
  }
}
