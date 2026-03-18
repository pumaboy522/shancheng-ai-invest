import axios from 'axios';

export default async function handler(req, res) {

  if (req.method === 'GET') {
    return res.status(200).send('山城 AI 運作中');
  }

  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  const CONFIG = {
    LINE_TOKEN: 'exVu9fkC4DNhM3JTltui9/R7xMozMnunSK/ZlJ0BCXS4DiSy016baxEsVOJhQb1J+6ShanxwpO+LO/2favp/++vkfy13zYEGULSO5fDg4qvsyZpIUTWDvT11pKVjT7gdK5oTu1YAEPKeOVKI3gQA9QdB04t89/1O/w1cDnyilFU=',
    GEMINI_KEY: 'AIzaSyB3gGr3mBA3tnN-1OWRKQWK5CV-ZWYbYdg',
    ALLOWED_USERS: ['U4eccd9d2320aaf36fd1a72442612d860']
  };

  try {
    const events = req.body?.events || [];

    // 👉 同時處理多筆事件（超重要）
    for (const event of events) {

      if (event.type !== 'message' || event.message.type !== 'text') {
        continue;
      }

      const userId = event.source.userId;
      const userMsg = event.message.text;

      if (!CONFIG.ALLOWED_USERS.includes(userId)) {
        console.log("未授權:", userId);
        continue;
      }

      let replyText = "⚠️ 系統分析中...";

      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;

        // ✅ 加 timeout（關鍵）
        const aiRes = await axios.post(
          geminiUrl,
          {
            contents: [
              {
                parts: [
                  {
                    text: `你是台股短線分析師，請用繁體中文給出精簡操作建議（含風險）：${userMsg}`
                  }
                ]
              }
            ]
          },
          {
            timeout: 5000 // 5秒內沒回就放棄
          }
        );

        replyText =
          aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "⚠️ AI 無回應";

      } catch (err) {
        console.log("Gemini錯誤:", err.message);
        replyText = "❌ AI 忙碌中，請稍後再試";
      }

      // ✅ 回 LINE（每個 event 都回）
      await axios.post(
        'https://api.line.me/v2/bot/message/reply',
        {
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: replyText }]
        },
        {
          headers: {
            Authorization: `Bearer ${CONFIG.LINE_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }

  } catch (err) {
    console.log("系統錯誤:", err.message);
  }

  return res.status(200).send('DONE');
}
