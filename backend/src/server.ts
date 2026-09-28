import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import type { Server } from "http";
import type { ChatMessage, ServerMessage } from "./types.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "TalkPulse backend" });
});

const server: Server = app.listen(PORT, () => {
  console.log(`TalkPulse backend running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

const broadcastMessage = (message: ChatMessage) => {
  const payload: ServerMessage = {
    type: "chat",
    payload: message,
  };

  const data = JSON.stringify(payload);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
};

wss.on("connection", (ws) => {
  console.log("A client connected");

  ws.on("message", (raw) => {
    try {
      const parsed = JSON.parse(raw.toString()) as ServerMessage;

      if (parsed.type === "chat" && parsed.payload) {
        const message: ChatMessage = {
          sender: parsed.payload.sender,
          text: parsed.payload.text,
          timestamp: parsed.payload.timestamp,
        };

        broadcastMessage(message);
      }
    } catch (error) {
      console.error("Invalid message received:", error);
    }
  });

  ws.on("close", () => {
    console.log("A client disconnected");
  });
});
