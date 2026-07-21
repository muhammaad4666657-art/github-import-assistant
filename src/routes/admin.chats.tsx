import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageSquare, Trash2, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/chats")({
  component: AdminChats,
});

type Conv = {
  id: string; visitor_name: string | null; visitor_email: string | null;
  last_message_at: string; unread_admin: number; created_at: string;
  user_id: string | null;
};
type Msg = { id: string; conversation_id: string; sender: "user" | "bot" | "admin"; body: string; created_at: string };

function AdminChats() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConvs = async () => {
    const { data } = await supabase.from("chat_conversations")
      .select("*").order("last_message_at", { ascending: false }).limit(200);
    setConvs((data ?? []) as Conv[]);
  };

  useEffect(() => { loadConvs(); }, []);

  // Realtime new convs / messages
  useEffect(() => {
    const ch = supabase.channel("admin_chats_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => loadConvs())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as Msg;
        if (m.conversation_id === activeId) {
          setMsgs((prev) => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        }
        loadConvs();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  // Load messages when conv changes
  useEffect(() => {
    if (!activeId) { setMsgs([]); return; }
    supabase.from("chat_messages").select("*").eq("conversation_id", activeId)
      .order("created_at").then(({ data }) => setMsgs((data ?? []) as Msg[]));
    supabase.from("chat_conversations").update({ unread_admin: 0 }).eq("id", activeId).then(() => loadConvs());
  }, [activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeId || sending) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: activeId, sender: "admin", body: reply.trim(),
    });
    if (error) { toast.error(error.message); setSending(false); return; }
    await supabase.from("chat_conversations").update({
      last_message_at: new Date().toISOString(),
      unread_user: (msgs.length || 0) + 1,
    }).eq("id", activeId);
    setReply("");
    setSending(false);
  };

  const deleteConv = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    const { error } = await supabase.from("chat_conversations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Conversation deleted");
      if (activeId === id) setActiveId(null);
      loadConvs();
    }
  };

  const active = convs.find((c) => c.id === activeId);

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-serif flex items-center gap-2"><MessageSquare className="h-5 w-5 text-gold" /> Customer Chats</h1>
        <p className="text-sm text-muted-foreground mt-1">Live conversations with visitors. New messages arrive instantly.</p>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="w-80 border-r border-border overflow-y-auto bg-card">
          {convs.length === 0 && <p className="p-6 text-sm text-muted-foreground">No conversations yet.</p>}
          {convs.map((c) => (
            <button key={c.id} onClick={() => setActiveId(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-border hover:bg-secondary transition-colors flex items-start gap-3 ${activeId === c.id ? "bg-secondary" : ""}`}>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium truncate">{c.visitor_name || c.visitor_email || "Guest visitor"}</div>
                  {c.unread_admin > 0 && (
                    <span className="text-[10px] bg-destructive text-destructive-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{c.unread_admin}</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</div>
                {c.visitor_email && <div className="text-[11px] text-muted-foreground truncate">{c.visitor_email}</div>}
              </div>
            </button>
          ))}
        </div>

        {/* Active conversation */}
        <div className="flex-1 flex flex-col bg-secondary/20">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a conversation to start replying.
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between">
                <div>
                  <div className="font-medium">{active.visitor_name || active.visitor_email || "Guest visitor"}</div>
                  <div className="text-xs text-muted-foreground">{active.visitor_email || (active.user_id ? "Registered user" : "Guest")}</div>
                </div>
                <button onClick={() => deleteConv(active.id)} className="h-9 w-9 rounded-lg hover:bg-destructive/10 text-destructive flex items-center justify-center" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3">
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      m.sender === "admin" ? "bg-primary text-primary-foreground rounded-br-sm"
                      : m.sender === "bot" ? "bg-card border border-border text-foreground/80 rounded-bl-sm italic"
                      : "bg-card border border-border rounded-bl-sm"
                    }`}>
                      <div className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">
                        {m.sender === "admin" ? "You" : m.sender === "bot" ? "Auto-reply" : "Customer"}
                      </div>
                      {m.body}
                      <div className="text-[10px] opacity-50 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="p-4 bg-card border-t border-border flex items-center gap-2">
                <input value={reply} onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 h-11 px-4 rounded-full bg-secondary border border-transparent focus:border-accent focus:outline-none text-sm" />
                <button type="submit" disabled={!reply.trim() || sending}
                  className="h-11 px-5 rounded-full bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 flex items-center gap-2 text-sm">
                  <Send className="h-4 w-4" /> Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
