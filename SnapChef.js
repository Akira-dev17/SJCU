const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
const port = 8080;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.static('public'));
const upload = multer({ dest: 'uploads/' });

function encodeImage(path) {
    const image = fs.readFileSync(path);
    return Buffer.from(image).toString('base64');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "이미지가 없습니다." });
        }

        const base64Image = encodeImage(req.file.path);
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "당신은 10년 경력의 한식 전문 요리사입니다. 사진 속 식재료를 분석해서, 만들 수 있는 맛있는 요리 레시피 1가지를 추천해주세요. 말투는 친절하고 전문적으로 해주세요."
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "이 재료들로 뭘 해먹으면 좋을까요? 레시피를 알려줘." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        });

        const result = response.choices[0].message.content;
        res.json({ reply: result });

    } catch (error) {
        console.error("에러 발생:", error);
        res.status(500).json({ reply: "OpenAI 요청 중 오류가 발생했습니다. (결제 상태를 확인해주세요)" });
    }
});

app.listen(port, () => {
    console.log(`OpenAI 서버 실행 중: http://localhost:${port}`);
});
