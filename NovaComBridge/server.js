const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURATION
const BACKEND_DIR = path.join(__dirname, '../backend'); // Point to C++ folder
const EXECUTABLE = path.join(BACKEND_DIR, 'backend.exe'); // The .exe file

app.post('/api', (req, res) => {
    const { action, params } = req.body;

    console.log(`[Request] Action: ${action}, Params: ${params}`);

    // Prepare arguments: e.g., ["get_friends", "1"]
    const args = [action, ...params.map(String)];

    // Execute C++ Program
    execFile(EXECUTABLE, args, { cwd: BACKEND_DIR }, (error, stdout, stderr) => {
        if (error) {
            console.error("Execution Error:", stderr);
            return res.status(500).json({ error: "Backend failed", details: stderr });
        }

        try {
            // The C++ program outputs JSON string, we parse it here
            const jsonResponse = JSON.parse(stdout.trim());
            res.json(jsonResponse);
        } catch (e) {
            console.error("JSON Parse Error. Raw Output:", stdout);
            res.status(500).send("Invalid JSON from C++ Backend: " + stdout);
        }
    });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`NovaCom Bridge running on http://localhost:${PORT}`);
    console.log(`Looking for C++ Backend at: ${EXECUTABLE}`);
});