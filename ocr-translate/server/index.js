require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { Translate } = require('@google-cloud/translate').v2;
const vision = require('@google-cloud/vision');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_CLOUD_KEYFILE
});
const translateClient = new Translate({
    keyFilename: process.env.GOOGLE_CLOUD_KEYFILE
});

app.post('/translate-image', upload.single('image'), async (req, res) => {
    try {
        const [result] = await visionClient.textDetection(req.file.path);
        const detectedText = result.textAnnotations[0]?.description || '텍스트 없음';

        const [translation] = await translateClient.translate(detectedText, 'ko');
        fs.unlinkSync(req.file.path); // 임시 이미지 삭제

        res.json({ originalText: detectedText, translatedText: translation });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '처리 중 오류 발생' });
    }
});

app.listen(3000, () => {
    console.log('서버 실행 중: http://localhost:3000');
});
