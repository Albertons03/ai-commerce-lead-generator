"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface ProductMatch {
  product_id: string;
  product_name: string;
  product_description?: string;
  product_price?: number;
  product_category?: string;
  product_url?: string;
  similarity_score: number;
}

export default function TestChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastProducts, setLastProducts] = useState<ProductMatch[]>([]);
  const [lastMetadata, setLastMetadata] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const organizationId = "9677edeb-0ac8-45e8-b2bc-c389cc99fac0";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize conversation on component mount
  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organization_id: organizationId,
          visitor_metadata: {
            test: true,
            page: "test-chat",
            user_agent: navigator.userAgent,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConversationId(data.data.conversation_id);
        console.log("Conversation initialized:", data.data.conversation_id);
      } else {
        setError("Failed to initialize conversation: " + data.error?.message);
      }
    } catch (err) {
      setError(
        "Failed to initialize conversation: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !conversationId || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          conversation_id: conversationId,
          organization_id: organizationId,
          include_products: true,
          max_products: 5,
          similarity_threshold: 0.75,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.data.assistant_message,
          timestamp: new Date(),
          metadata: data.data.metadata,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setLastProducts(data.data.products_found || []);
        setLastMetadata(data.data);

        console.log("Chat response:", data.data);
      } else {
        setError("Chat failed: " + data.error?.message);
      }
    } catch (err) {
      setError(
        "Chat failed: " + (err instanceof Error ? err.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setLastProducts([]);
    setLastMetadata(null);
    setError(null);
    initializeConversation();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🤖 Phase 3D: RAG Chat API Test
          </h1>
          <p className="text-gray-400">
            Test the complete RAG pipeline: Vector Search → Prompt Building →
            GPT-4 → Response
          </p>
          {conversationId && (
            <p className="text-sm text-gray-500 mt-2">
              Conversation ID: {conversationId}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
                <h2 className="font-semibold text-white">Chat Interface</h2>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={clearConversation}
                    className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-white"
                  >
                    New Conversation
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>Start a conversation! Try asking about products...</p>
                    <div className="mt-4 text-sm space-y-1">
                      <p>💡 Example queries:</p>
                      <p>• "Show me some electronics"</p>
                      <p>• "I need a laptop under $1000"</p>
                      <p>• "What headphones do you recommend?"</p>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                      {message.metadata && (
                        <div className="text-xs text-gray-300 mt-1">
                          {message.metadata.total_tokens} tokens • $
                          {message.metadata.cost_estimate?.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-600 p-4">
                {error && (
                  <div className="mb-3 p-2 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-2">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
                    rows={2}
                    disabled={loading || !conversationId}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={
                      loading || !conversationId || !currentMessage.trim()
                    }
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Products Found */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
                <h3 className="font-semibold text-white">Products Found</h3>
              </div>
              <div className="p-4">
                {lastProducts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No products found yet</p>
                ) : (
                  <div className="space-y-3">
                    {lastProducts.map((product, index) => (
                      <div
                        key={index}
                        className="border border-gray-700 rounded p-3"
                      >
                        <h4 className="font-medium text-white text-sm">
                          {product.product_name}
                        </h4>
                        {product.product_description && (
                          <p className="text-gray-400 text-xs mt-1">
                            {product.product_description.substring(0, 100)}...
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-green-400 text-sm font-medium">
                            ${product.product_price}
                          </span>
                          <span className="text-blue-400 text-xs">
                            {(product.similarity_score * 100).toFixed(1)}% match
                          </span>
                        </div>
                        {product.product_category && (
                          <span className="inline-block bg-gray-700 text-xs px-2 py-1 rounded mt-2">
                            {product.product_category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            {lastMetadata && (
              <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
                  <h3 className="font-semibold text-white">
                    Response Metadata
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vector Search:</span>
                      <span className="text-white">
                        {lastMetadata.metadata?.vector_search_ms}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prompt Building:</span>
                      <span className="text-white">
                        {lastMetadata.metadata?.prompt_building_ms}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">AI Generation:</span>
                      <span className="text-white">
                        {lastMetadata.metadata?.ai_generation_ms}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Tokens:</span>
                      <span className="text-white">
                        {lastMetadata.metadata?.total_tokens}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cost Estimate:</span>
                      <span className="text-green-400">
                        ${lastMetadata.metadata?.cost_estimate?.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Processing Time:</span>
                      <span className="text-white">
                        {lastMetadata.processing_time_ms}ms
                      </span>
                    </div>
                  </div>

                  {lastMetadata.intent_analysis && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <h4 className="text-sm font-medium text-white mb-2">
                        Intent Analysis
                      </h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Intent:</span>
                          <span className="text-white">
                            {lastMetadata.intent_analysis.intent}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Sentiment:</span>
                          <span className="text-white">
                            {lastMetadata.intent_analysis.sentiment}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Confidence:</span>
                          <span className="text-white">
                            {(
                              lastMetadata.intent_analysis.confidence * 100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        {lastMetadata.intent_analysis.lead_signals?.length >
                          0 && (
                          <div className="mt-2">
                            <span className="text-gray-400">Lead Signals:</span>
                            <div className="mt-1 space-y-1">
                              {lastMetadata.intent_analysis.lead_signals.map(
                                (signal: string, index: number) => (
                                  <span
                                    key={index}
                                    className="inline-block bg-yellow-900 text-yellow-200 text-xs px-2 py-1 rounded mr-1"
                                  >
                                    {signal}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System Status */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
                <h3 className="font-semibold text-white">System Status</h3>
              </div>
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Conversation:</span>
                    <span
                      className={
                        conversationId ? "text-green-400" : "text-red-400"
                      }
                    >
                      {conversationId ? "✓ Active" : "✗ Not initialized"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Messages:</span>
                    <span className="text-white">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">API Status:</span>
                    <span className={error ? "text-red-400" : "text-green-400"}>
                      {error ? "✗ Error" : "✓ Ready"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
