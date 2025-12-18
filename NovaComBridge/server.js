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
const BACKEND_DIR = path.join(__dirname, '../backend'); 
const EXECUTABLE = path.join(BACKEND_DIR, 'backend.exe'); 
const DATA_DIR = path.join(BACKEND_DIR, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.post('/api', (req, res) => {
    let { action, params } = req.body;
    let tempFilePath = null;

    // --- FIX FOR LARGE IMAGES ---
    // Command: send_dm <sender> <receiver> <replyTo> <type> <mediaUrl> <content>
    if (action === 'send_dm' && params && params.length >= 5) {
        const mediaUrl = params[4];
        
        // If data is large (Base64 image), save to file
        if (mediaUrl && mediaUrl.length > 1000) {
            const fileName = `temp_img_${Date.now()}.txt`;
            // USE ABSOLUTE PATH to ensure C++ finds it
            tempFilePath = path.join(DATA_DIR, fileName);
            
            try {
                fs.writeFileSync(tempFilePath, mediaUrl);
                // Send "FILE:" + Absolute Path
                params[4] = `FILE:${tempFilePath}`;
                console.log(`[Bridge] Image buffered to: ${tempFilePath}`);
            } catch (err) {
                console.error("Failed to write temp file:", err);
                return res.status(500).json({ error: "Failed to process image upload." });
            }
        }
    }
    // -----------------------------

    const args = [action, ...params.map(String)];

    execFile(EXECUTABLE, args, { cwd: BACKEND_DIR, maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        
        // Cleanup temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch(e) {}
        }

        if (error) {
            console.error("Execution Error:", stderr);
            return res.status(500).json({ error: "Backend failed", details: stderr });
        }

        try {
            if (!stdout.trim()) {
                return res.json({ status: "success" });
            }
            const jsonResponse = JSON.parse(stdout.trim());
            res.json(jsonResponse);
        } catch (e) {
            // Filter out debug warnings if any
            console.error("JSON Parse Error. Raw:", stdout);
            res.send(stdout); 
        }
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`NovaCom Bridge running on http://localhost:${PORT}`);
});