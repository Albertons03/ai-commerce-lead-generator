import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Sparkles } from 'lucide-react'

export default function TrainingSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>AI Training & Context</CardTitle>
              <CardDescription>
                Coming in Phase 4 - Train your AI with product data and documents
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border-primary bg-bg-secondary p-8">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-gray-500" />
              <h3 className="text-xl font-semibold text-white">Phase 4 Feature</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                This feature will allow you to upload product documents, create embeddings,
                and enable context-aware AI responses in your chatbot.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20">
                  <Sparkles className="h-4 w-4 text-primary-400" />
                  <span className="text-sm text-primary-400 font-medium">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-white">Planned Features:</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                <span>Upload product catalogs, FAQs, and documentation</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                <span>Automatic text chunking and embedding generation</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                <span>Vector similarity search for relevant context</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                <span>RAG-powered AI responses with citations</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                <span>Web scraping for product pages</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
