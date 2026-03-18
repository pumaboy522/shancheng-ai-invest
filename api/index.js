import axios from 'axios';

export default async function handler(req, res) {

  if (req.method === 'GET') {
    return res.status(200).send('OK');
  }

  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    const CONFIG = {
      LINE_TOKEN: 'exVu9fkC4DNhM3JTltui9/R7xMozMnunSK/ZlJ0BCXS4DiSy016baxEsVOJhQb1J+6ShanxwpO+LO/2favp/++vkfy13zYEGULSO5fDg4qvsyZpIUTWDvT11pKVjT7gdK5oTu1YAEPKeOVKI3gQA9QdB04t89/1O/w1cDnyilFU=',
      GEMINI_KEY: 'AIzaSyB3gGr3mBA3tnN-1OWRKQWK5CV-ZWYbYdg',
      ALLOWED_USERS: ['U4eccd9d2320aaf36fd1a72442612d860']
    };

    const events = req.body.events;
    if (!events || !events.length) {
      return res.status(200).send('NO EVENT');
    }

    const event = events[0];

    if (event.type !== 'message' || event.message.type !== 'text') {
      return res.status(200).send('NOT TEXT');
    }

    const userId = event.source.userId;
    const userMsg = event.message.text;

    // 🔒 限制使用者
    if (!CONFIG.ALLOWED_USERS.includes(userId)) {
      return res.status(200).send('BLOCKED');
    }

    let replyText = "⚠️ 系統忙碌中";

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_KEY}`;

      const aiRes = await axios.post(geminiUrl, {
        contents: [
          {
            parts: [
              {
                text: `你是台股短線分析師，請簡短分析：${userMsg}`
              }
            ]
          }
        ]
      });

      replyText =
        aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ AI 無回應";

    } catch (err) {
      console.log("Gemini錯誤:", err.message);
      replyText = "❌ AI 分析失敗";
    }

    // ✅ 一定回 LINE（最重要）
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

  } catch (err) {
    console.log("系統錯誤:", err.message);
  }

  // ✅ 最後才回 200
  return res.status(200).send('DONE');
}
