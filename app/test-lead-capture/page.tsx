"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TestLeadCapturePage() {
  const [conversationId, setConversationId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Test scenarios
  const scenarios = [
    {
      name: "Contact Info Sharing",
      message:
        "Hi, my email is john@example.com and my phone is 555-123-4567. Can you send me more info?",
      expectedTriggers: ["contact_info"],
    },
    {
      name: "Purchase Intent",
      message:
        "I want to buy this laptop immediately. What's the total cost with shipping?",
      expectedTriggers: ["purchase_intent", "pricing_request"],
    },
    {
      name: "Business Inquiry",
      message:
        "Hi, I need a bulk quote for 50 laptops for our company. Can you help with enterprise pricing?",
      expectedTriggers: ["business_inquiry", "pricing_request"],
    },
    {
      name: "Pricing Request",
      message:
        "What's your best price on this? I have a budget of $1000, can you match that?",
      expectedTriggers: ["pricing_request"],
    },
    {
      name: "High Value Phrases",
      message:
        "I need this by next week. How can I purchase it? Do you accept credit cards?",
      expectedTriggers: ["purchase_intent"],
    },
    {
      name: "No Trigger (Low Intent)",
      message: "What are your store hours?",
      expectedTriggers: [],
    },
  ];

  const sendTestMessage = async (
    testMessage: string,
    scenarioName?: string
  ) => {
    if (!conversationId || !organizationId) {
      alert("Please set Conversation ID and Organization ID first");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: testMessage,
          conversation_id: conversationId,
          organization_id: organizationId,
          include_products: true,
          max_products: 3,
          similarity_threshold: 0.7,
        }),
      });

      const data = await response.json();

      // Add to results with timestamp
      const result = {
        timestamp: new Date().toLocaleTimeString(),
        scenario: scenarioName || "Custom Message",
        message: testMessage,
        success: data.success,
        leadCaptured: data.success && data.data?.lead_capture,
        leadDetails: data.data?.lead_capture,
        intentAnalysis: data.data?.intent_analysis,
        processingTime: data.data?.processing_time_ms,
        error: data.success ? null : data.error,
      };

      setResults((prev) => [result, ...prev]);
    } catch (error) {
      console.error("Test failed:", error);
      setResults((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          scenario: scenarioName || "Custom Message",
          message: testMessage,
          success: false,
          error: (error as Error).message,
          leadCaptured: false,
        },
        ...prev,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllScenarios = async () => {
    for (const scenario of scenarios) {
      await sendTestMessage(scenario.message, scenario.name);
      // Wait 500ms between tests to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-6xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          Phase E - Lead Capture Testing
        </h1>
        <p className="text-muted-foreground">
          Test the AI-powered lead capture and scoring system
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Conversation ID
              </label>
              <Input
                placeholder="Enter conversation UUID"
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Organization ID
              </label>
              <Input
                placeholder="Enter organization UUID"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setConversationId("550e8400-e29b-41d4-a716-446655440000");
                setOrganizationId("550e8400-e29b-41d4-a716-446655440001");
              }}
              variant="outline"
              size="sm"
            >
              Use Sample IDs
            </Button>
            <Button
              onClick={runAllScenarios}
              disabled={isLoading || !conversationId || !organizationId}
              variant="default"
            >
              Run All Test Scenarios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Test */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Message Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Test Message
            </label>
            <Input
              placeholder="Enter a test message to analyze for lead triggers..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && message.trim()) {
                  sendTestMessage(message);
                  setMessage("");
                }
              }}
            />
          </div>
          <Button
            onClick={() => {
              sendTestMessage(message);
              setMessage("");
            }}
            disabled={
              isLoading || !message.trim() || !conversationId || !organizationId
            }
          >
            {isLoading ? "Processing..." : "Send Test Message"}
          </Button>
        </CardContent>
      </Card>

      {/* Test Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Predefined Test Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario, index) => (
              <Card key={index} className="p-4">
                <h3 className="font-medium mb-2">{scenario.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {scenario.message}
                </p>
                <div className="text-xs text-muted-foreground mb-3">
                  Expected:{" "}
                  {scenario.expectedTriggers.join(", ") || "No triggers"}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    sendTestMessage(scenario.message, scenario.name)
                  }
                  disabled={isLoading || !conversationId || !organizationId}
                >
                  Test This Scenario
                </Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Test Results</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResults([])}
            disabled={results.length === 0}
          >
            Clear Results
          </Button>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No test results yet. Run some tests to see the lead capture
              analysis.
            </p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card
                  key={index}
                  className={`p-4 border-l-4 ${
                    result.leadCaptured
                      ? "border-l-green-500 bg-green-50/50"
                      : result.success
                      ? "border-l-yellow-500 bg-yellow-50/50"
                      : "border-l-red-500 bg-red-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{result.scenario}</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.timestamp}
                      </p>
                    </div>
                    <div className="text-right">
                      {result.leadCaptured && (
                        <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                          LEAD CAPTURED
                        </span>
                      )}
                      {result.success && !result.leadCaptured && (
                        <span className="text-sm font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                          NO LEAD
                        </span>
                      )}
                      {!result.success && (
                        <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                          ERROR
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-3">
                    <strong>Message:</strong> {result.message}
                  </div>

                  {result.success && (
                    <div className="space-y-2 text-sm">
                      {result.intentAnalysis && (
                        <div>
                          <strong>Intent Analysis:</strong>
                          <ul className="ml-4 space-y-1">
                            <li>Intent: {result.intentAnalysis.intent}</li>
                            <li>
                              Sentiment: {result.intentAnalysis.sentiment}
                            </li>
                            <li>
                              Confidence: {result.intentAnalysis.confidence}
                            </li>
                            <li>
                              Lead Signals:{" "}
                              {result.intentAnalysis.lead_signals?.join(", ") ||
                                "None"}
                            </li>
                          </ul>
                        </div>
                      )}

                      {result.leadDetails && (
                        <div>
                          <strong>Lead Capture Details:</strong>
                          <ul className="ml-4 space-y-1">
                            <li>Lead ID: {result.leadDetails.lead_id}</li>
                            <li>Score: {result.leadDetails.score}/100</li>
                            <li>
                              Triggers:{" "}
                              {result.leadDetails.triggers?.join(", ")}
                            </li>
                          </ul>
                        </div>
                      )}

                      {result.processingTime && (
                        <div>
                          <strong>Processing Time:</strong>{" "}
                          {result.processingTime}ms
                        </div>
                      )}
                    </div>
                  )}

                  {result.error && (
                    <div className="text-sm text-red-600">
                      <strong>Error:</strong> {JSON.stringify(result.error)}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
