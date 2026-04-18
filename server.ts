import express from "express";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import path from "path";
import stream from "stream";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Configuration from environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn("ADVERTÊNCIA: As credenciais GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não estão configuradas no ambiente.");
}

const TOKEN_PATH = path.join(process.cwd(), "drive-token.json");
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

let isAuthenticated = false; 

// Load saved token if it exists to persist connection
try {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokenData = fs.readFileSync(TOKEN_PATH, 'utf8');
    const parsedTokens = JSON.parse(tokenData);
    oauth2Client.setCredentials(parsedTokens);
    isAuthenticated = true;
    console.log("Drive token loaded successfully from memory.");
  }
} catch (err) {
  console.error("No saved token found or failed to load:", err);
}

app.get("/api/auth/url", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    prompt: "consent"
  });
  res.json({ url });
});

app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Código não fornecido");
  }
  
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    isAuthenticated = true;
    
    // Save to disk so we survive server restarts
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    
    res.send(`
      <html>
        <head><title>Autenticado</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <h2>Google Drive conectado com sucesso!</h2>
          <p>O aplicativo agora tem permissão para salvar arquivos. Esta janela se fechará automaticamente.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Erro na autenticação com o Google: " + (error as Error).message);
  }
});

app.get("/api/auth/status", (req, res) => {
  res.json({ authenticated: isAuthenticated });
});

app.post("/api/auth/disconnect", (req, res) => {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
    isAuthenticated = false;
    oauth2Client.revokeCredentials();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/upload", async (req, res) => {
  if (!isAuthenticated) return res.status(401).json({ error: "O Google Drive não está autenticado no servidor." });
  
  try {
    const { photos, item, reporter } = req.body;
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    const uploadedLinks = [];
    
    for (const photoBase64 of photos) {
       const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
       const buffer = Buffer.from(base64Data, 'base64');
       
       const bufferStream = new stream.PassThrough();
       bufferStream.end(buffer);

       const { data } = await drive.files.create({
         requestBody: {
           name: `[Ocorrencia] ${item.substring(0, 30)} - ${reporter.split(' ')[0]} - ${Date.now()}.jpg`,
           mimeType: 'image/jpeg',
         },
         media: {
           mimeType: 'image/jpeg',
           body: bufferStream,
         }
       });
       uploadedLinks.push(data.id);
    }
    
    res.json({ success: true, files: uploadedLinks });
  } catch (error) {
    console.error("Upload error", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
