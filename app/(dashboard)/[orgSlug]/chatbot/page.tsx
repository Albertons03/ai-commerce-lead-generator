"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Code2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  leadCaptured?: boolean;
  leadScore?: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export default function ChatbotPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [totalLeads, setTotalLeads] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    messages: 0,
    leadsGenerated: 0,
    avgScore: 0,
  });

  // Embed kód szekció állapota
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key_display: string }[]>([]);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Initialize conversation
  useEffect(() => {
    initializeChat();
  }, [orgSlug]);

  const initializeChat = async () => {
    setConnectionStatus("connecting");

    try {
      // First, get organization info
      const orgResponse = await fetch(`/api/organizations?slug=${orgSlug}`);
      if (!orgResponse.ok) {
        throw new Error("Organization not found");
      }

      const orgData = await orgResponse.json();
      if (!orgData.data?.length) {
        throw new Error("Organization not found");
      }

      const org = orgData.data[0];
      setOrganization(org);

      // API kulcsok betöltése az embed kód generálásához
      const keysRes = await fetch(`/api/api-keys?organization_id=${org.id}`);
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        if (keysData.success) setApiKeys(keysData.data || []);
      }

      // Create or resume conversation
      const convResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: org.id,
          visitor_metadata: {
            user_agent: navigator.userAgent,
            page_url: window.location.href,
            referrer: document.referrer || null,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!convResponse.ok) {
        throw new Error("Failed to create conversation");
      }

      const convData = await convResponse.json();
      setConversationId(convData.data.conversation_id);
      setConnectionStatus("connected");

      // Load existing messages if any
      if (convData.data.messages?.length > 0) {
        setMessages(
          convData.data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setConnectionStatus("disconnected");
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !conversationId || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    // Placeholder assistant üzenet - streaming közben folyamatosan frissül
    const assistantPlaceholder: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setCurrentMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentMessage,
          conversation_id: conversationId,
          organization_id: organization?.id,
          stream: true, // SSE streaming kérése
          include_products: true,
          max_products: 5,
          similarity_threshold: 0.7,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // SSE stream olvasás ReadableStream reader-rel
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "chunk" && event.content) {
              // Chunk érkezés: frissítjük az utolsó üzenetet (az assistant placeholder-t)
              streamedContent += event.content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: streamedContent,
                };
                return updated;
              });
            } else if (event.type === "done") {
              // Stream vége: végleges tartalom + lead capture metadata
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: event.assistant_message || streamedContent,
                  leadCaptured: !!event.lead_capture,
                  leadScore: event.lead_capture?.score,
                };
                return updated;
              });

              // Session stats frissítése
              if (event.lead_capture) {
                setTotalLeads((prev) => prev + 1);
                setSessionStats((prev) => ({
                  messages: prev.messages + 1,
                  leadsGenerated: prev.leadsGenerated + 1,
                  avgScore:
                    (prev.avgScore * prev.leadsGenerated + event.lead_capture.score) /
                    (prev.leadsGenerated + 1),
                }));
              } else {
                setSessionStats((prev) => ({
                  ...prev,
                  messages: prev.messages + 1,
                }));
              }
            }
          } catch {
            // Nem valid JSON sor - kihagyjuk
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Sorry, I encountered an error. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionStats({ messages: 0, leadsGenerated: 0, avgScore: 0 });
    initializeChat();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Chatbot</h1>
          <p className="text-muted-foreground">
            {organization
              ? `Testing chatbot for ${organization.name}`
              : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}
            </span>
          </div>
          {conversationId && (
            <Badge variant="outline" className="text-xs">
              ID: {conversationId.slice(0, 8)}...
            </Badge>
          )}
        </div>
      </div>

      {/* ── EMBED KÓD GENERATOR ── */}
      {organization && (
        <EmbedCodeCard
          orgId={organization.id}
          apiKeys={apiKeys}
          copiedEmbed={copiedEmbed}
          setCopiedEmbed={setCopiedEmbed}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg">Chat Interface</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                disabled={messages.length === 0}
              >
                Clear Chat
              </Button>
            </CardHeader>
            <Separator />

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="mb-2">No messages yet</p>
                    <p className="text-sm">
                      Start a conversation to test the AI chatbot and lead
                      capture system
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-4"
                            : "bg-muted mr-4"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                          {message.leadCaptured && (
                            <Badge variant="secondary" className="text-xs">
                              Lead: {message.leadScore}/100
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading || connectionStatus !== "connected"}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={
                    !currentMessage.trim() ||
                    isLoading ||
                    connectionStatus !== "connected"
                  }
                >
                  {isLoading ? "Sending..." : "Send"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • Test lead capture with contact info or
                purchase intent
              </p>
            </div>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          {/* Session Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Session Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Messages
                  </span>
                  <span className="font-medium">{sessionStats.messages}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Leads Generated
                  </span>
                  <span className="font-medium text-green-600">
                    {sessionStats.leadsGenerated}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Lead Score
                  </span>
                  <span className="font-medium">
                    {sessionStats.avgScore > 0
                      ? `${sessionStats.avgScore.toFixed(0)}/100`
                      : "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Test Lead Triggers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-xs space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-2 px-3"
                  onClick={() =>
                    setCurrentMessage("I need a laptop under $1000")
                  }
                >
                  💻 Product inquiry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-2 px-3"
                  onClick={() =>
                    setCurrentMessage(
                      "My email is test@example.com, can you send me info?"
                    )
                  }
                >
                  📧 Contact sharing
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-2 px-3"
                  onClick={() =>
                    setCurrentMessage(
                      "I want to buy this immediately. What's the total cost?"
                    )
                  }
                >
                  🛒 Purchase intent
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-2 px-3"
                  onClick={() =>
                    setCurrentMessage(
                      "I need bulk pricing for 50 units for our company"
                    )
                  }
                >
                  🏢 Business inquiry
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open(`/${orgSlug}/leads`, "_blank")}
              >
                📋 View Leads
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open("/test-lead-capture", "_blank")}
              >
                🧪 Advanced Testing
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => window.open("/test-chat", "_blank")}
              >
                💬 RAG Chat Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// EMBED KÓD GENERATOR KOMPONENS
// =====================================================
// Külön komponensként van kiszervezve, hogy a ChatbotPage
// ne legyen túl hosszú (single responsibility elv).
// Props-on keresztül kapja az adatokat a szülő komponenstől.

interface EmbedCodeCardProps {
  orgId: string;
  apiKeys: { id: string; name: string; key_display: string }[];
  copiedEmbed: boolean;
  setCopiedEmbed: (v: boolean) => void;
}

function EmbedCodeCard({ orgId, apiKeys, copiedEmbed, setCopiedEmbed }: EmbedCodeCardProps) {
  // Az első aktív API kulcsot használjuk az embed kódban
  // key_display = a maskolt kulcs prefix (pl. sk_live_KF8J...)
  const firstKey = apiKeys[0];
  const displayKey = firstKey ? firstKey.key_display : "YOUR_API_KEY";

  // Az embed script tag amit a felhasználó a saját oldalára másol
  // window.location.origin = pl. "https://app.leadgen.com"
  const embedCode = `<script
  src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"
  data-api-key="${displayKey}"
  data-org-id="${orgId}"
  data-title="Chat with us"
  data-theme="#6366f1"
></script>`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopiedEmbed(true);
      // 2 másodperc után visszaáll a "Copy" felirat
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch {
      // Clipboard API nem elérhető (pl. nem HTTPS) - fallback
      console.error("Clipboard copy failed");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-base">Embed on Your Website</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Copy this snippet and paste it before the{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code>{" "}
              tag on any page where you want the chatbot to appear.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Figyelmeztetés ha nincs még API kulcs */}
        {apiKeys.length === 0 && (
          <div className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
            No API key found. Generate one in{" "}
            <a
              href="settings/api-keys"
              className="underline font-medium"
            >
              Settings → API Keys
            </a>{" "}
            to get a real embed code.
          </div>
        )}

        {/* Kód blokk + másolás gomb */}
        <div className="relative">
          <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto leading-relaxed">
            <code>{embedCode}</code>
          </pre>
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2"
            onClick={handleCopy}
            disabled={apiKeys.length === 0}
          >
            {copiedEmbed ? (
              <><Check className="h-3 w-3 mr-1" /> Copied!</>
            ) : (
              <><Copy className="h-3 w-3 mr-1" /> Copy</>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          The widget loads asynchronously and will not slow down your page.
          Theme color and title can be customized via the <code>data-*</code> attributes.
        </p>
      </CardContent>
    </Card>
  );
}
