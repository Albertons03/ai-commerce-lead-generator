'use client';

import { useState } from 'react';

export default function TestConversationsPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [sessionId, setSessionId] = useState('');

  const organizationId = '9677edeb-0ac8-45e8-b2bc-c389cc99fac0';

  // Test 1: Create new conversation
  const handleCreateConversation = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
          visitor_metadata: {
            test: true,
            page: '/test-conversations',
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      setResult(data);
      setConversationId(data.data.conversation_id);
      setSessionId(data.data.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Resume conversation
  const handleResumeConversation = async () => {
    if (!sessionId) {
      setError('No session ID available. Create a conversation first.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
          session_id: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Get conversation details
  const handleGetConversation = async () => {
    if (!conversationId) {
      setError('No conversation ID available. Create a conversation first.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Test 4: List conversations (admin)
  const handleListConversations = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/conversations?organization_id=${organizationId}&limit=10`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conversations API Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test conversation and message persistence
          </p>

          {/* Organization Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Organization:</strong> alibabaa
            </p>
            <p className="text-sm text-gray-600 font-mono">{organizationId}</p>
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Session ID:</strong>
              </p>
              <p className="text-xs text-gray-600 font-mono break-all">
                {sessionId}
              </p>
              {conversationId && (
                <>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Conversation ID:</strong>
                  </p>
                  <p className="text-xs text-gray-600 font-mono break-all">
                    {conversationId}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Test Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleCreateConversation}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Loading...' : '1. Create Conversation'}
            </button>

            <button
              onClick={handleResumeConversation}
              disabled={loading || !sessionId}
              className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Loading...' : '2. Resume Conversation'}
            </button>

            <button
              onClick={handleGetConversation}
              disabled={loading || !conversationId}
              className="bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Loading...' : '3. Get Conversation'}
            </button>

            <button
              onClick={handleListConversations}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Loading...' : '4. List Conversations'}
            </button>
          </div>

          {/* Result Display */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                ✓ Success!
              </h3>

              {result.message && (
                <p className="text-sm text-gray-600 mb-4">{result.message}</p>
              )}

              {/* Show key data points */}
              {result.data && (
                <div className="space-y-2 mb-4">
                  {result.data.conversation_id && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Conversation ID:
                      </span>
                      <p className="text-xs font-mono text-gray-600 break-all">
                        {result.data.conversation_id}
                      </p>
                    </div>
                  )}
                  {result.data.session_id && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Session ID:
                      </span>
                      <p className="text-xs font-mono text-gray-600 break-all">
                        {result.data.session_id}
                      </p>
                    </div>
                  )}
                  {result.data.status && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Status:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {result.data.status}
                      </span>
                    </div>
                  )}
                  {result.data.message_count !== undefined && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Message Count:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {result.data.message_count}
                      </span>
                    </div>
                  )}
                  {result.data.is_new !== undefined && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Is New:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {result.data.is_new ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )}
                  {result.data.conversations && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Total Conversations:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {result.data.conversations.length} of {result.data.total}
                      </span>
                    </div>
                  )}
                  {result.data.messages && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        Messages:
                      </span>
                      <span className="ml-2 text-sm text-gray-600">
                        {result.data.messages.length}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Raw JSON */}
              <details className="mt-4">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                  View Raw Response
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                ✗ Error
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Test Flow:
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Click "Create Conversation" to start a new conversation</li>
              <li>Click "Resume Conversation" to test resuming with same session ID</li>
              <li>Click "Get Conversation" to fetch conversation details</li>
              <li>Click "List Conversations" to see all conversations (admin)</li>
              <li>
                Verify in Supabase:{' '}
                <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">
                  SELECT * FROM conversations ORDER BY created_at DESC
                </code>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
