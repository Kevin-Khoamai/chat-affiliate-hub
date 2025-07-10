import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Zap, Database, Brain, Activity, Webhook, TestTube } from 'lucide-react';
import { ragService } from '@/services/ragService';
import { n8nWebhookService } from '@/services/n8nWebhookService';
import { useToast } from "@/components/ui/use-toast";

interface RAGMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
    fallbackUsed?: boolean;
    processingTime?: number;
    n8nIntegration?: {
      sent: boolean;
      success?: boolean;
      error?: string;
    };
  };
}

const RAGChatInterface = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<RAGMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [ragStatus, setRAGStatus] = useState<'inactive' | 'initializing' | 'active' | 'error'>('inactive');
  const [n8nStatus, setN8nStatus] = useState<'inactive' | 'healthy' | 'unhealthy'>('inactive');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substring(2)}`);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeServices();
    loadWelcomeMessage();
  }, []);

  const initializeServices = async () => {
    try {
      setRAGStatus('initializing');
      await ragService.initialize();
      
      // Check RAG health status
      const ragHealth = await ragService.healthCheck();
      setRAGStatus(ragHealth.status === 'healthy' ? 'active' : 'error');
      
      // Check n8n webhook health
      const n8nHealth = await n8nWebhookService.healthCheck();
      setN8nStatus(n8nHealth.status);
      
      if (ragHealth.status !== 'healthy') {
        toast({
          title: "RAG System Status",
          description: "Running in limited mode. Some features may use fallback logic.",
          variant: "default",
        });
      }

      if (n8nHealth.status === 'unhealthy') {
        toast({
          title: "n8n Webhook Status",
          description: "n8n webhook is not responding. Integration features may be limited.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Service initialization failed:', error);
      setRAGStatus('error');
      setN8nStatus('unhealthy');
      toast({
        title: "Service Initialization Error",
        description: "Failed to initialize services. Using fallback mode.",
        variant: "destructive",
      });
    }
  };

  const loadWelcomeMessage = () => {
    const welcomeMessage: RAGMessage = {
      id: '1',
      type: 'bot',
      content: `🚀 **RAG-Enhanced AI Assistant with n8n Integration**

I'm your advanced AI assistant powered by Retrieval-Augmented Generation (RAG) and integrated with n8n workflow automation. I can now:

• **🔍 Semantic Search**: Find relevant information using meaning, not just keywords
• **🧠 Contextual Understanding**: Provide more accurate, context-aware responses  
• **📊 Source Attribution**: Show you exactly where my answers come from
• **⚡ Intelligent Retrieval**: Access the most relevant campaigns and academy content
• **🔗 n8n Integration**: Automatically trigger workflows and external processes

**Try these enhanced queries:**
• "What are the best performing campaigns for beginners?"
• "How do I optimize conversion rates for fashion campaigns?"
• "Show me advanced affiliate marketing strategies"

*Note: Your session ID is \`${sessionId}\`. All messages are also sent to the n8n workflow for processing.*`,
      timestamp: new Date().toISOString(),
      metadata: {
        confidence: 1.0,
        fallbackUsed: false
      }
    };
    
    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: RAGMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentQuery = query;
    setQuery('');
    setLoading(true);

    try {
      const startTime = Date.now();
      
      // Process query through RAG system
      const result = await ragService.processQuery(currentQuery);
      
      // Prepare enhanced user context (you might want to get this from props or context)
      const userContext = {
        id: 'current-user-id', // Replace with actual user ID
        name: 'Current User', // Replace with actual user name
        email: 'user@example.com' // Replace with actual user email
      };

      // Send comprehensive message to n8n webhook
      const n8nPromise = n8nWebhookService.sendMessage(
        sessionId, 
        currentQuery,
        'rag-integration',
        userContext,
        {
          sources: result.sources,
          confidence: result.confidence,
          fallbackUsed: result.fallbackUsed
        }
      );
      
      const processingTime = Date.now() - startTime;

      // Wait for n8n webhook response
      const n8nResult = await n8nPromise;

      const botMessage: RAGMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.response,
        timestamp: new Date().toISOString(),
        metadata: {
          sources: result.sources.map(s => s.document?.metadata?.title || s.name || 'Unknown').filter(Boolean),
          confidence: result.confidence,
          fallbackUsed: result.fallbackUsed,
          processingTime,
          n8nIntegration: {
            sent: true,
            success: n8nResult.success,
            error: n8nResult.error
          }
        }
      };

      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);

      // Show enhanced feedback
      if (result.fallbackUsed) {
        toast({
          title: "Fallback Mode Used",
          description: "RAG system encountered an issue. Response may be less accurate.",
          variant: "default",
        });
      }

      if (n8nResult.success) {
        console.log('n8n webhook response data:', n8nResult.data);
        toast({
          title: "n8n Integration Success",
          description: "Message successfully sent to n8n workflow for processing.",
          variant: "default",
        });
      } else {
        toast({
          title: "n8n Integration Warning",
          description: `Failed to send message to n8n workflow: ${n8nResult.error}`,
          variant: "default",
        });
      }

    } catch (error: any) {
      console.error('RAG query processing error:', error);
      
      const errorMessage: RAGMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `❌ **Error Processing Query**\n\nI encountered an error while processing your request:\n\n${error.message}\n\nPlease try rephrasing your question or contact support if the issue persists.`,
        timestamp: new Date().toISOString(),
        metadata: {
          confidence: 0,
          fallbackUsed: true,
          n8nIntegration: {
            sent: false,
            success: false,
            error: 'Query processing failed'
          }
        }
      };
      
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);

      toast({
        title: "Query Processing Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testN8nWebhook = async () => {
    setTestingWebhook(true);
    try {
      const result = await n8nWebhookService.testWebhook();
      
      if (result.success) {
        toast({
          title: "Webhook Test Successful",
          description: "n8n webhook is working correctly with sample data.",
          variant: "default",
        });
        console.log('Webhook test result:', result.data);
      } else {
        toast({
          title: "Webhook Test Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Webhook Test Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const getRAGStatusIcon = () => {
    switch (ragStatus) {
      case 'active':
        return <Activity className="w-4 h-4 text-green-400" />;
      case 'initializing':
        return <Database className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'error':
        return <Zap className="w-4 h-4 text-red-400" />;
      default:
        return <Brain className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRAGStatusText = () => {
    switch (ragStatus) {
      case 'active':
        return 'RAG Active';
      case 'initializing':
        return 'Initializing...';
      case 'error':
        return 'Fallback Mode';
      default:
        return 'RAG Inactive';
    }
  };

  const getN8nStatusIcon = () => {
    switch (n8nStatus) {
      case 'healthy':
        return <Webhook className="w-4 h-4 text-green-400" />;
      case 'unhealthy':
        return <Webhook className="w-4 h-4 text-red-400" />;
      default:
        return <Webhook className="w-4 h-4 text-gray-400" />;
    }
  };

  const getN8nStatusText = () => {
    switch (n8nStatus) {
      case 'healthy':
        return 'n8n Connected';
      case 'unhealthy':
        return 'n8n Offline';
      default:
        return 'n8n Inactive';
    }
  };

  return (
    <div className="max-w-full mx-auto">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-[calc(100vh-100px)] flex flex-col">
        <CardHeader className="border-b border-white/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              RAG-Enhanced AI Assistant
              <div className="flex space-x-2 ml-3">
                <Badge 
                  variant="outline" 
                  className="border-white/30 text-white/70 bg-gray-700/50"
                >
                  {getRAGStatusIcon()}
                  <span className="ml-1">{getRAGStatusText()}</span>
                </Badge>
                <Badge 
                  variant="outline" 
                  className="border-white/30 text-white/70 bg-gray-700/50"
                >
                  {getN8nStatusIcon()}
                  <span className="ml-1">{getN8nStatusText()}</span>
                </Badge>
              </div>
            </CardTitle>
            <Button
              onClick={testN8nWebhook}
              disabled={testingWebhook}
              variant="outline"
              size="sm"
              className="border-white/30 text-white/70 hover:bg-white/10"
            >
              <TestTube className="w-4 h-4 mr-1" />
              {testingWebhook ? 'Testing...' : 'Test n8n'}
            </Button>
          </div>
          <p className="text-sm text-white/70">
            Advanced AI assistant with semantic search, contextual understanding, and enhanced n8n workflow integration
          </p>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl px-4 py-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}
                >
                  {message.type === 'bot' && (
                    <div className="flex items-center mb-2">
                      <Bot className="w-4 h-4 mr-2" />
                      <span className="text-xs text-white/50">RAG AI Assistant</span>
                      {message.metadata?.confidence && (
                        <Badge 
                          variant="outline" 
                          className="ml-2 text-xs border-white/30 text-white/60"
                        >
                          {Math.round(message.metadata.confidence * 100)}% confident
                        </Badge>
                      )}
                      {message.metadata?.n8nIntegration?.sent && (
                        <Badge 
                          variant="outline" 
                          className={`ml-2 text-xs border-white/30 ${
                            message.metadata.n8nIntegration.success 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}
                        >
                          <Webhook className="w-3 h-3 mr-1" />
                          {message.metadata.n8nIntegration.success ? 'n8n ✓' : 'n8n ✗'}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="text-sm whitespace-pre-line">{message.content}</div>
                  
                  {/* Message metadata */}
                  {message.metadata && message.type === 'bot' && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                      <div className="text-xs text-white/50 space-y-1">
                        {message.metadata.processingTime && (
                          <div>⚡ Processed in {message.metadata.processingTime}ms</div>
                        )}
                        {message.metadata.sources && message.metadata.sources.length > 0 && (
                          <div>
                            📚 Sources: {message.metadata.sources.slice(0, 3).join(', ')}
                            {message.metadata.sources.length > 3 && ` +${message.metadata.sources.length - 3} more`}
                          </div>
                        )}
                        {message.metadata.n8nIntegration?.sent && (
                          <div className={message.metadata.n8nIntegration.success ? 'text-green-400' : 'text-red-400'}>
                            🔗 n8n: {message.metadata.n8nIntegration.success ? 'Message sent successfully' : `Failed - ${message.metadata.n8nIntegration.error}`}
                          </div>
                        )}
                        {message.metadata.fallbackUsed && (
                          <div className="text-yellow-400">⚠️ Fallback mode used</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-white/50 mt-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white px-4 py-3 rounded-lg border border-white/20">
                  <div className="flex items-center">
                    <Bot className="w-4 h-4 mr-2" />
                    <span className="text-xs text-white/70 mr-2">RAG AI is thinking...</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Query Input */}
        <div className="p-4 border-t border-white/20">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about affiliate marketing..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              disabled={loading}
            />
            <Button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-xs text-white/40 mt-1">
            Session: {sessionId.split('-').pop()} • 
            RAG Status: {getRAGStatusText()} • 
            n8n Status: {getN8nStatusText()}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RAGChatInterface;
