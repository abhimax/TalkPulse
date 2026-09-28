import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  sender: string;
  text: string;
  timestamp: string;
};

const backendUrl = "ws://localhost:4000";

function App() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!joined || !username) return;

    const socket = new WebSocket(backendUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("Connected to TalkPulse backend");
    };

    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data as string) as {
        type: "chat";
        payload: ChatMessage;
      };

      if (parsed.type === "chat") {
        setMessages((current) => [...current, parsed.payload]);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [joined, username]);

  const handleJoin = () => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setJoined(true);
  };

  const handleSend = () => {
    const trimmed = message.trim();
    const socket = socketRef.current;

    if (!trimmed || !socket || socket.readyState !== WebSocket.OPEN) return;

    const payload: ChatMessage = {
      sender: username,
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    socket.send(JSON.stringify({ type: "chat", payload }));
    setMessage("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleJoin();
    }
  };

  const handleMessageKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  if (!joined) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>TalkPulse</h1>
          <p>Choose your name to enter the room</p>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Your username"
          />
          <button onClick={handleJoin}>Enter chat</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-shell">
      <div className="chat-card">
        <header>
          <div>
            <span className="eyebrow">Live room</span>
            <h2>TalkPulse</h2>
          </div>
          <span className="user-pill">{username}</span>
        </header>

        <main className="message-list">
          {messages.length === 0 ? (
            <p className="empty-state">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg, index) => (
              <div key={`${msg.timestamp}-${index}`} className="message-item">
                <div className="message-meta">
                  <strong>{msg.sender}</strong>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p>{msg.text}</p>
              </div>
            ))
          )}
        </main>

        <footer className="composer">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleMessageKeyDown}
            placeholder="Type a message"
          />
          <button onClick={handleSend}>Send</button>
        </footer>
      </div>
    </div>
  );
}

export default App;
