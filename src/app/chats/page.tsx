"use client"
import { useEffect, useState, useRef } from "react";
import { auth } from "@/lib/firebase";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { Avatar } from "@/src/components/ui/avatar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatsPage() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [lastMessages, setLastMessages] = useState({});
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Get current user and token
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        const t = await u.getIdToken();
        setToken(t);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch users
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/chats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setUsers);
  }, [token]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!token || !selected) return;
    setMsgLoading(true);
    fetch(`${API_URL}/api/chats/${selected.id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((msgs) => {
        setMessages(msgs);
        // Update last message for preview
        setLastMessages((prev) => ({ ...prev, [selected.id]: msgs[msgs.length - 1] }));
      })
      .finally(() => setMsgLoading(false));
  }, [token, selected]);

  // Fetch last message for each user for preview
  useEffect(() => {
    if (!token || users.length === 0) return;
    users.forEach((u) => {
      if (u.id === user?.uid) return;
      fetch(`${API_URL}/api/chats/${u.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((msgs) => {
          setLastMessages((prev) => ({ ...prev, [u.id]: msgs[msgs.length - 1] }));
        });
    });
  }, [token, users, user]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket("ws://localhost:4000");
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message" && selected && data.chatId === getChatId(user.uid, selected.id)) {
        setMessages((prev) => [...prev, data.message]);
        setLastMessages((prev) => ({ ...prev, [selected.id]: data.message }));
        scrollToBottom();
      }
    };
    return () => ws.close();
  }, [token, selected, user]);

  // Helper to get chatId (same as backend)
  function getChatId(uid1, uid2) {
    return [uid1, uid2].sort().join("_");
  }

  // Auto-scroll to bottom
  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !selected) return;
    setLoading(true);
    // Send via WebSocket for real-time
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          to: selected.id,
          text: input,
          token,
        })
      );
      setInput("");
    } else {
      // fallback to HTTP
      const res = await fetch(`${API_URL}/api/chats/${selected.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: input }),
      });
      if (res.ok) {
        setInput("");
      }
    }
    setLoading(false);
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please sign in.</div>;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-100 via-slate-100 to-slate-200 dark:from-[#18181b] dark:to-[#23272f]">
      {/* Chat List Sidebar */}
      <aside className="w-80 border-r bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-md p-0 flex flex-col h-screen overflow-y-auto shadow-md">
        <div className="p-4 border-b flex items-center gap-2">
          <span className="font-semibold text-lg">{user.displayName || user.email} <span className="text-xs text-muted-foreground">(You)</span></span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {users.filter(u => u.id !== user.uid).map((u) => {
            const lastMsg = lastMessages[u.id];
            return (
              <button
                key={u.id}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#23272f] transition text-left ${selected?.id === u.id ? "bg-slate-200 dark:bg-[#23272f]" : ""}`}
                onClick={() => setSelected(u)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.name || u.email}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {lastMsg ? (lastMsg.text.length > 30 ? lastMsg.text.slice(0, 30) + "..." : lastMsg.text) : "No messages yet."}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {lastMsg && formatTime(lastMsg.id)}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
      {/* Chat Window */}
      <main className="flex-1 flex flex-col h-screen">
        {selected ? (
          <Card className="w-full h-full flex flex-col shadow-none rounded-none bg-white/80 dark:bg-[#1a1d23]/80">
            {/* Header */}
            <div className="flex items-center gap-3 border-b px-6 py-4 bg-white/90 dark:bg-[#23272f]/90 sticky top-0 z-10">
              <div className="flex flex-col">
                <span className="font-semibold text-lg">{selected.name || selected.email}</span>
                {/* <span className="text-xs text-muted-foreground">online</span> */}
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
              {msgLoading ? (
                <div>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-muted-foreground">No messages yet.</div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.from === user.uid;
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[70%]` + (isMe ? " flex-row-reverse" : "") }>
                        <div className={`rounded-2xl px-4 py-2 shadow-sm text-sm break-words ${isMe ? "bg-primary text-primary-foreground" : "bg-slate-100 dark:bg-[#23272f]"}`}>
                          {msg.text}
                          <span className="block text-[10px] text-right text-muted-foreground mt-1">{formatTime(msg.id)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Input Bar */}
            <form onSubmit={sendMessage} className="flex gap-2 px-6 py-4 border-t bg-white/90 dark:bg-[#23272f]/90 sticky bottom-0 z-10">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                disabled={loading}
                className="rounded-full bg-slate-100 dark:bg-[#23272f] border-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" disabled={loading || !input.trim()} className="rounded-full px-6">Send</Button>
            </form>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground">
            <img src="/window.svg" alt="Chat" className="w-32 h-32 opacity-30 mb-4" />
            <div className="text-lg">Select a chat to start messaging.</div>
          </div>
        )}
      </main>
    </div>
  );
} 