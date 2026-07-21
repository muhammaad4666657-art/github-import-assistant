import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Package, Tag, Briefcase, FlaskConical, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { aiSupportReply } from "@/lib/support-ai.functions";
import { toast } from "sonner";

type Msg = { id: string; sender: "user" | "bot" | "admin"; body: string; created_at: string };
type View = "chat" | "track" | "quiz" | "lead";

const ANON_KEY = "alm_chat_anon_id";
const CONV_KEY = "alm_chat_conv_id";

function getAnonId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = "anon_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

const GREETING =
  "Assalamualaikum! ✨ Mera naam **Abdullah** hai — ALM International ka AI Virtual Assistant. Skincare, products, orders, distributorship ya company information — aap kya jaanna chahenge?";

const QUICK_ACTIONS = [
  { id: "track", label: "Track My Order", icon: Package, emoji: "📦" },
  { id: "quiz", label: "Product Recommendation", icon: FlaskConical, emoji: "🧴" },
  { id: "distributor", label: "Become a Distributor", icon: Briefcase, emoji: "💼" },
  { id: "offers", label: "Current Discount Offers", icon: Tag, emoji: "🏷️" },
] as const;

export function SupportChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("chat");
  const [conversationId, setConversationId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(CONV_KEY) : null,
  );
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [skinType, setSkinType] = useState<string | null>(null);

  // Track form
  const [trackOrderNo, setTrackOrderNo] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackResult, setTrackResult] = useState<string | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // Lead form
  const [leadName, setLeadName] = useState(user?.user_metadata?.full_name || "");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadMsg, setLeadMsg] = useState("");
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages when opened
  useEffect(() => {
    if (!open || !conversationId) return;
    supabase.from("chat_messages").select("*").eq("conversation_id", conversationId)
      .order("created_at").then(({ data }) => {
        const rows = (data ?? []) as Msg[];
        setMessages((prev) => {
          const map = new Map<string, Msg>();
          for (const m of [...rows, ...prev]) map.set(m.id, m);
          return Array.from(map.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));
        });
      });
    setUnread(0);
    supabase.from("chat_conversations").update({ unread_user: 0 }).eq("id", conversationId).then(() => {});
  }, [open, conversationId]);

  // Realtime — admin replies
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`chat_${conversationId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
          if (m.sender === "admin" && !open) setUnread((u) => u + 1);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open, aiTyping, view]);

  const ensureConversation = async (): Promise<string | null> => {
    if (conversationId) return conversationId;
    const { data, error } = await supabase.from("chat_conversations").insert({
      user_id: user?.id ?? null,
      anon_id: user ? null : getAnonId(),
      visitor_name: user?.email ?? null,
      visitor_email: user?.email ?? null,
    }).select("id").single();
    if (error || !data) return null;
    localStorage.setItem(CONV_KEY, data.id);
    setConversationId(data.id);
    await supabase.from("chat_messages").insert({
      conversation_id: data.id, sender: "bot", body: GREETING,
    });
    return data.id;
  };

  const sendUserText = async (text: string) => {
    const convId = await ensureConversation();
    if (!convId) return;

    // Save user msg
    await supabase.from("chat_messages").insert({ conversation_id: convId, sender: "user", body: text });
    const { data: cur } = await supabase.from("chat_conversations").select("unread_admin").eq("id", convId).single();
    await supabase.from("chat_conversations").update({
      last_message_at: new Date().toISOString(),
      unread_admin: (cur?.unread_admin ?? 0) + 1,
    }).eq("id", convId);

    setAiTyping(true);
    try {
      // Build short history for AI
      const recent = [...messages.filter((m) => m.sender !== "admin"), { sender: "user", body: text } as Msg]
        .slice(-10)
        .map((m) => ({
          role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.body,
        }));

      const { reply } = await aiSupportReply({ data: { messages: recent, skinType: skinType ?? undefined } });
      const cleaned = reply.replace("[REQUEST_CALLBACK]", "").trim();
      await supabase.from("chat_messages").insert({ conversation_id: convId, sender: "bot", body: cleaned });

      if (reply.includes("[REQUEST_CALLBACK]")) {
        setTimeout(() => setView("lead"), 600);
      }
    } catch (e) {
      console.error(e);
      await supabase.from("chat_messages").insert({
        conversation_id: convId, sender: "bot",
        body: "Sorry, ek technical issue aaya. Aap apna naam aur phone share karein — hamari team rabta karegi.",
      });
      setView("lead");
    } finally {
      setAiTyping(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || aiTyping) return;
    setInput("");
    await sendUserText(text);
  };

  const handleQuickAction = async (id: string) => {
    if (id === "track") { setView("track"); return; }
    if (id === "quiz") { setView("quiz"); return; }
    if (id === "distributor") {
      await ensureConversation();
      window.location.href = "/distributor/login";
      return;
    }
    if (id === "offers") {
      await ensureConversation();
      await sendUserText("Aap ke current discount offers aur active promo codes kya hain?");
    }
  };

  const handleSkinChoice = async (type: string) => {
    setSkinType(type);
    setView("chat");
    await sendUserText(`Meri skin type ${type} hai — please mere liye best products recommend karein.`);
  };

  const submitTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderNo.trim() || !trackPhone.trim()) return;
    setTrackLoading(true);
    setTrackResult(null);
    const { data, error } = await supabase.rpc("track_order", {
      _order_number: trackOrderNo.trim(),
      _phone: trackPhone.trim(),
    });
    setTrackLoading(false);
    if (error || !data || (data as any[]).length === 0) {
      setTrackResult("Order nahi mila. Order number aur phone number check karein.");
      return;
    }
    const o: any = (data as any[])[0];
    setTrackResult(
      `✅ Order **${o.order_number}** — Status: **${o.status}**\nName: ${o.customer_name}\nCity: ${o.shipping_city}\nTotal: Rs. ${Number(o.total).toLocaleString()}`,
    );
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim() || !leadMsg.trim()) return;
    setLeadSubmitting(true);
    const { error } = await (supabase.from as any)("customer_leads").insert({
      name: leadName.trim(),
      phone: leadPhone.trim(),
      message: leadMsg.trim(),
      source: "chat",
    });
    setLeadSubmitting(false);
    if (error) { toast.error("Submit nahi ho saka. Dubara try karein."); return; }
    toast.success("Shukriya! Hamari team jaldi rabta karegi.");
    setLeadMsg(""); setLeadPhone("");
    setView("chat");
    const convId = await ensureConversation();
    if (convId) {
      await supabase.from("chat_messages").insert({
        conversation_id: convId, sender: "bot",
        body: `Shukriya **${leadName}** — aap ki request hum tak pohnch gayi hai. Hamari team 24 hours ke andar ${leadPhone} par rabta karegi. 🌸`,
      });
    }
  };

  const showQuickActions = useMemo(
    () => view === "chat" && messages.filter((m) => m.sender === "user").length === 0,
    [view, messages],
  );

  // Dedup messages by ID and collapse consecutive identical bubbles
  const renderedMessages = useMemo(() => {
    const seen = new Set<string>();
    const out: Msg[] = [];
    for (const m of messages) {
      if (m.id && seen.has(m.id)) continue;
      const prev = out[out.length - 1];
      if (prev && prev.sender === m.sender && prev.body.trim() === m.body.trim()) continue;
      if (m.id) seen.add(m.id);
      out.push(m);
    }
    return out;
  }, [messages]);

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open ALM Virtual Assistant"
          className="fixed bottom-6 right-6 z-50 group"
        >
          <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
          <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-md opacity-70" />
          <span className="relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl hover:scale-110 transition-transform">
            <Sparkles className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground h-5 min-w-5 px-1 rounded-full text-[10px] font-semibold flex items-center justify-center animate-pulse">
                {unread}
              </span>
            )}
          </span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[94vw] max-w-md rounded-2xl bg-card border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center backdrop-blur ring-2 ring-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-serif text-base tracking-wide">Abdullah · ALM Assistant ✨</div>
              <div className="text-[11px] opacity-90 flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400 ring-2 ring-green-400/30 animate-pulse" />
                Online · AI-powered consultant
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/30 min-h-[340px] max-h-[60vh]">
            {/* Greeting bubble */}
            {messages.length === 0 && view === "chat" && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-card border border-border text-sm leading-relaxed shadow-sm">
                  {GREETING}
                </div>
              </div>
            )}

            {view === "chat" && renderedMessages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.sender === "user" ? "bg-primary text-primary-foreground rounded-br-sm"
                  : m.sender === "admin" ? "bg-accent text-accent-foreground rounded-bl-sm"
                  : "bg-card border border-border rounded-bl-sm"
                }`}>
                  {m.sender === "admin" && <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">Support team</div>}
                  {m.sender === "bot" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-a:text-primary prose-a:underline prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} onClick={() => setOpen(false)} className="text-primary underline font-medium">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {m.body}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  )}
                </div>
              </div>
            ))}

            {view === "chat" && aiTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-card border border-border shadow-sm">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            {showQuickActions && (
              <div className="pt-2">
                <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">Quick Help</div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((q) => (
                    <button key={q.id} onClick={() => handleQuickAction(q.id)}
                      className="text-left p-3 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-xs font-medium flex flex-col gap-1">
                      <span className="text-lg">{q.emoji}</span>
                      <span>{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Track view */}
            {view === "track" && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <button onClick={() => { setView("chat"); setTrackResult(null); }} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <div className="font-medium text-sm flex items-center gap-2">📦 Track Your Order</div>
                <form onSubmit={submitTrack} className="space-y-2">
                  <input value={trackOrderNo} onChange={(e) => setTrackOrderNo(e.target.value)}
                    placeholder="Order number (e.g. ALM-123456)"
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm" />
                  <input value={trackPhone} onChange={(e) => setTrackPhone(e.target.value)}
                    placeholder="Phone number used at checkout"
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm" />
                  <button type="submit" disabled={trackLoading}
                    className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
                    {trackLoading ? "Checking..." : "Track Order"}
                  </button>
                </form>
                {trackResult && (
                  <div className="text-sm bg-secondary/60 rounded-lg p-3 whitespace-pre-wrap">
                    <ReactMarkdown>{trackResult}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* Quiz view */}
            {view === "quiz" && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <button onClick={() => setView("chat")} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
                  <ArrowLeft className="h-3 w-3" /> Back
                </button>
                <div className="font-medium text-sm">🧴 Aap ki skin type kya hai?</div>
                <p className="text-xs text-muted-foreground">Best personalised recommendations ke liye select karein:</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Oily", "Dry", "Combination", "Sensitive"].map((t) => (
                    <button key={t} onClick={() => handleSkinChoice(t)}
                      className="p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-sm font-medium transition-all">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lead view */}
            {view === "lead" && (
              <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <button onClick={() => setView("chat")} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
                  <ArrowLeft className="h-3 w-3" /> Back to chat
                </button>
                <div className="font-medium text-sm">💬 Request a callback</div>
                <p className="text-xs text-muted-foreground">Hamari team aap se rabta karegi. Apni details share karein:</p>
                <form onSubmit={submitLead} className="space-y-2">
                  <input value={leadName} onChange={(e) => setLeadName(e.target.value)} required maxLength={100}
                    placeholder="Your name" className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm" />
                  <input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} required maxLength={20}
                    placeholder="Phone / WhatsApp number" className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm" />
                  <textarea value={leadMsg} onChange={(e) => setLeadMsg(e.target.value)} required maxLength={500} rows={3}
                    placeholder="How can we help?" className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none" />
                  <button type="submit" disabled={leadSubmitting}
                    className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
                    {leadSubmitting ? "Sending..." : "Submit Request"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Input */}
          {view === "chat" && (
            <form onSubmit={handleSend} className="p-3 bg-card border-t border-border flex items-center gap-2">
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                maxLength={1000}
                disabled={aiTyping}
                className="flex-1 h-10 px-4 rounded-full bg-secondary border border-transparent focus:border-accent focus:outline-none text-sm disabled:opacity-50"
              />
              <button type="submit" disabled={!input.trim() || aiTyping}
                className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
