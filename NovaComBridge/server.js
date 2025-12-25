const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CONFIGURATION
// Adjust these paths if your folder structure is different
const BACKEND_DIR = path.join(__dirname, '../backend'); 
const EXECUTABLE = path.join(BACKEND_DIR, 'backend.exe'); 
const DATA_DIR = path.join(BACKEND_DIR, 'data');

// Ensure data directory exists so C++ doesn't crash on file write
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.post('/api', (req, res) => {
    let { action, params } = req.body;
    let tempFilePath = null;

    console.log(`[Request] Action: ${action}`);

    // Image Buffering Logic
    if ((action === 'send_dm' || action === 'send_message') && params && params.length >= 5) {
        const mediaUrl = params[4];
        if (mediaUrl && mediaUrl.length > 1000) {
            const fileName = `temp_img_${Date.now()}.txt`;
            tempFilePath = path.join(DATA_DIR, fileName);
            try {
                fs.writeFileSync(tempFilePath, mediaUrl);
                params[4] = `FILE:${tempFilePath}`;
            } catch (err) {
                console.error("Failed to write temp file:", err);
                return res.status(500).json({ error: "Failed to process image upload." });
            }
        }
    }

    const args = [action, ...params.map(String)];

    execFile(EXECUTABLE, args, { cwd: BACKEND_DIR, maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        // Cleanup temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch(e) {}
        }

        if (error) {
            console.error("C++ Execution Error:", stderr || error.message);
            return res.status(500).json({ error: "Backend failed", details: stderr || error.message });
        }

        try {
            if (!stdout.trim()) return res.json({ status: "success" });
            const jsonResponse = JSON.parse(stdout.trim());
            res.json(jsonResponse);
        } catch (e) {
            console.error("JSON Parse Error. Raw Output from C++:", stdout);
            res.status(500).json({ error: "C++ returned invalid JSON", raw: stdout }); 
        }
    });
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`NovaCom Bridge running on http://localhost:${PORT}`);
    console.log(`Executable Path: ${EXECUTABLE}`);
}).on('error', (err) => {
    console.error("Server failed to start:", err.message);
});