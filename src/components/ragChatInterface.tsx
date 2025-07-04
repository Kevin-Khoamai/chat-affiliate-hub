
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Zap, Database, Brain, Activity } from 'lucide-react';
import { ragService } from '@/services/ragService';
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
  };
}

const RAGChatInterface = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<RAGMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [ragStatus, setRAGStatus] = useState<'inactive' | 'initializing' | 'active' | 'error'>('inactive');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeRAG();
    loadWelcomeMessage();
  }, []);

  const initializeRAG = async () => {
    try {
      setRAGStatus('initializing');
      await ragService.initialize();
      
      // Check health status
      const health = await ragService.healthCheck();
      setRAGStatus(health.status === 'healthy' ? 'active' : 'error');
      
      if (health.status !== 'healthy') {
        toast({
          title: "RAG System Status",
          description: "Running in limited mode. Some features may use fallback logic.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('RAG initialization failed:', error);
      setRAGStatus('error');
      toast({
        title: "RAG System Error",
        description: "Failed to initialize RAG system. Using fallback mode.",
        variant: "destructive",
      });
    }
  };

  const loadWelcomeMessage = () => {
    const welcomeMessage: RAGMessage = {
      id: '1',
      type: 'bot',
      content: `🚀 **RAG-Enhanced AI Assistant**

I'm your advanced AI assistant powered by Retrieval-Augmented Generation (RAG). I can now:

• **🔍 Semantic Search**: Find relevant information using meaning, not just keywords
• **🧠 Contextual Understanding**: Provide more accurate, context-aware responses  
• **📊 Source Attribution**: Show you exactly where my answers come from
• **⚡ Intelligent Retrieval**: Access the most relevant campaigns and academy content

**Try these enhanced queries:**
• "What are the best performing campaigns for beginners?"
• "How do I optimize conversion rates for fashion campaigns?"
• "Show me advanced affiliate marketing strategies"

*Note: RAG system is currently in development mode. Some features may use mock data.*`,
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
    setQuery('');
    setLoading(true);

    try {
      const startTime = Date.now();
      
      // Process query through RAG system
      const result = await ragService.processQuery(userMessage.content);
      
      const processingTime = Date.now() - startTime;

      const botMessage: RAGMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.response,
        timestamp: new Date().toISOString(),
        metadata: {
          sources: result.sources.map(s => s.document?.metadata?.title || s.name || 'Unknown').filter(Boolean),
          confidence: result.confidence,
          fallbackUsed: result.fallbackUsed,
          processingTime
        }
      };

      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);

      // Show toast for fallback usage
      if (result.fallbackUsed) {
        toast({
          title: "Fallback Mode Used",
          description: "RAG system encountered an issue. Response may be less accurate.",
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
          fallbackUsed: true
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

  return (
    <div className="max-w-full mx-auto">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-[calc(100vh-100px)] flex flex-col">
        <CardHeader className="border-b border-white/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              RAG-Enhanced AI Assistant
              <Badge 
                variant="outline" 
                className="ml-3 border-white/30 text-white/70 bg-gray-700/50"
              >
                {getRAGStatusIcon()}
                <span className="ml-1">{getRAGStatusText()}</span>
              </Badge>
            </CardTitle>
          </div>
          <p className="text-sm text-white/70">
            Advanced AI assistant with semantic search and contextual understanding
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
            RAG Status: {getRAGStatusText()} • 
            Enhanced with semantic search and contextual understanding
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RAGChatInterface;
