'use client';

import { useState } from 'react';

export default function TestTrainingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const organizationId = '9677edeb-0ac8-45e8-b2bc-c389cc99fac0';

  const testProducts = [
    {
      product_id: 'TEST-001',
      product_name: 'Wireless Headphones',
      product_description:
        'Premium noise-cancelling wireless headphones with 30-hour battery life',
      category: 'Electronics',
      price: 199.99,
    },
    {
      product_id: 'TEST-002',
      product_name: 'Smart Watch',
      product_description:
        'Fitness tracking smartwatch with heart rate monitor and GPS',
      category: 'Electronics',
      price: 299.99,
    },
    {
      product_id: 'TEST-003',
      product_name: 'Bluetooth Speaker',
      product_description:
        'Portable waterproof speaker with 360-degree sound and 12-hour battery',
      category: 'Electronics',
      price: 79.99,
    },
  ];

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/train-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
          products: testProducts,
          batch_size: 10,
          overwrite_existing: false,
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

  const handleTestOverwrite = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/train-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: organizationId,
          products: [
            {
              product_id: 'TEST-001',
              product_name: 'Wireless Headphones UPDATED',
              product_description:
                'Premium noise-cancelling wireless headphones with 40-hour battery life and improved sound quality',
              category: 'Electronics',
              price: 249.99,
            },
          ],
          batch_size: 10,
          overwrite_existing: true,
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Training API Test
          </h1>
          <p className="text-gray-600 mb-6">
            Test the product embedding generation endpoint
          </p>

          {/* Organization Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Organization:</strong> alibabaa
            </p>
            <p className="text-sm text-gray-600 font-mono">
              {organizationId}
            </p>
          </div>

          {/* Test Products */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Test Products ({testProducts.length})
            </h2>
            <div className="space-y-2">
              {testProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <p className="font-semibold text-gray-900">
                    {product.product_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {product.product_description}
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>ID: {product.product_id}</span>
                    <span>Category: {product.category}</span>
                    <span>Price: ${product.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleTest}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : 'Train with Test Products'}
            </button>

            <button
              onClick={handleTestOverwrite}
              disabled={loading}
              className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Processing...' : 'Test Overwrite Mode'}
            </button>
          </div>

          {/* Result Display */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                ✓ Success!
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Processed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.data.processed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Inserted</p>
                  <p className="text-2xl font-bold text-green-600">
                    {result.data.inserted}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Updated</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {result.data.updated}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {result.data.failed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Tokens</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {result.data.totalTokens}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Cost</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${result.data.estimatedCost.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.data.duration}ms
                  </p>
                </div>
              </div>
              {result.message && (
                <p className="text-sm text-gray-600">{result.message}</p>
              )}

              {/* Raw JSON */}
              <details className="mt-4">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                  View Raw Response
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
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
              Next Steps:
            </h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Make sure you're logged in</li>
              <li>Click "Train with Test Products" to generate embeddings</li>
              <li>Check the results above</li>
              <li>
                Verify in Supabase:{' '}
                <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">
                  SELECT * FROM product_embeddings
                </code>
              </li>
              <li>Click "Test Overwrite Mode" to update existing embeddings</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
