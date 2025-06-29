
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, BookOpen, TrendingUp } from 'lucide-react';

const ChatbotInterface = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sample queries for quick access
  const sampleQueries = [
    "What is the commission for Summer Fashion Sale?",
    "Show me top performing campaigns",
    "Academy tutorials for beginners",
    "How to optimize conversion rates?"
  ];

  // Mock knowledge base - TODO: Replace with actual RAG implementation
  const knowledgeBase = {
    campaigns: [
      { id: '1', name: 'Summer Fashion Sale', commission: '15%', performance: '+23%', description: 'High-converting fashion campaign targeting summer trends' },
      { id: '2', name: 'Tech Gadgets Promo', commission: '12%', performance: '+18%', description: 'Electronics and gadgets with excellent conversion rates' },
      { id: '3', name: 'Home & Garden', commission: '10%', performance: '+8%', description: 'Home improvement and gardening products' }
    ],
    academy: [
      { id: '1', title: 'Affiliate Marketing Basics', content: 'Learn the fundamentals of affiliate marketing', url: '/academy/basics' },
      { id: '2', title: 'Conversion Optimization', content: 'Advanced techniques to boost your conversion rates', url: '/academy/optimization' },
      { id: '3', title: 'Traffic Generation', content: 'Proven methods to drive quality traffic to your offers', url: '/academy/traffic' }
    ]
  };

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: 'Hello! I\'m your AI assistant for affiliate marketing. I can help you with campaign information, performance metrics, and academy resources. What would you like to know?',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processQuery = async (userQuery: string) => {
    const lowerQuery = userQuery.toLowerCase();
    
    // Simple keyword matching - TODO: Replace with actual RAG implementation
    if (lowerQuery.includes('commission') || lowerQuery.includes('campaign')) {
      if (lowerQuery.includes('summer') || lowerQuery.includes('fashion')) {
        return {
          type: 'campaign',
          data: knowledgeBase.campaigns[0],
          response: `The Summer Fashion Sale campaign offers a **15% commission rate** with a performance increase of **+23%** this month. This high-converting fashion campaign targets summer trends and has been performing excellently.`
        };
      } else {
        return {
          type: 'campaigns',
          data: knowledgeBase.campaigns,
          response: `Here are our current active campaigns:\n\n${knowledgeBase.campaigns.map(c => `**${c.name}**\n- Commission: ${c.commission}\n- Performance: ${c.performance}\n- ${c.description}`).join('\n\n')}`
        };
      }
    }
    
    if (lowerQuery.includes('academy') || lowerQuery.includes('tutorial') || lowerQuery.includes('learn')) {
      return {
        type: 'academy',
        data: knowledgeBase.academy,
        response: `Here are some helpful academy resources:\n\n${knowledgeBase.academy.map(a => `**${a.title}**\n${a.content}\nLearn more: ${a.url}`).join('\n\n')}`
      };
    }
    
    if (lowerQuery.includes('performance') || lowerQuery.includes('top')) {
      const topCampaign = knowledgeBase.campaigns.reduce((prev, current) => 
        parseInt(prev.performance.replace('%', '').replace('+', '')) > parseInt(current.performance.replace('%', '').replace('+', '')) ? prev : current
      );
      return {
        type: 'performance',
        data: topCampaign,
        response: `The top performing campaign right now is **${topCampaign.name}** with a **${topCampaign.performance}** increase in performance. It offers a **${topCampaign.commission}** commission rate.`
      };
    }
    
    if (lowerQuery.includes('optimization') || lowerQuery.includes('convert')) {
      return {
        type: 'tips',
        data: null,
        response: `Here are some conversion optimization tips:\n\n• **Target the right audience** - Use detailed demographics and interests\n• **Test your headlines** - A/B test different approaches\n• **Optimize landing pages** - Ensure fast loading and mobile-friendly design\n• **Use compelling CTAs** - Clear, action-oriented buttons\n• **Build trust** - Include testimonials and reviews\n\nFor more detailed guidance, check out our Conversion Optimization course in the academy!`
      };
    }
    
    // Default response
    return {
      type: 'general',
      data: null,
      response: `I can help you with information about campaigns, commissions, performance metrics, and academy resources. Try asking about:\n\n• Campaign commission rates\n• Performance statistics\n• Academy tutorials\n• Optimization tips\n\nOr use one of the suggested queries below!`
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    // Simulate processing time
    setTimeout(async () => {
      const result = await processQuery(userMessage.content);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.response,
        data: result.data,
        dataType: result.type,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
    }, 1000);
  };

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-[calc(100vh-200px)] flex flex-col">
        <CardHeader className="border-b border-white/20">
          <CardTitle className="flex items-center">
            <Bot className="w-5 h-5 mr-2" />
            AI Assistant - Campaign & Academy Knowledge
          </CardTitle>
          <p className="text-sm text-white/70">
            Ask me about campaigns, commissions, performance metrics, or academy resources
          </p>
        </CardHeader>

        {/* Sample Queries */}
        <div className="p-4 border-b border-white/20">
          <p className="text-sm text-white/70 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSampleQuery(sample)}
                className="text-xs border-white/30 text-white/70 hover:bg-white/10"
              >
                {sample}
              </Button>
            ))}
          </div>
        </div>

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
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {message.type === 'bot' && (
                    <div className="flex items-center mb-2">
                      <Bot className="w-4 h-4 mr-2" />
                      <span className="text-xs text-white/70">AI Assistant</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-line">{message.content}</div>
                  
                  {/* Display structured data for campaigns */}
                  {message.dataType === 'campaign' && message.data && (
                    <div className="mt-3 p-3 bg-white/10 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{message.data.name}</h4>
                        <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                          {message.data.performance}
                        </Badge>
                      </div>
                      <p className="text-sm text-white/70">{message.data.description}</p>
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
                <div className="bg-white/10 text-white px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <Bot className="w-4 h-4 mr-2" />
                    <span className="text-xs text-white/70 mr-2">AI Assistant is thinking...</span>
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
              placeholder="Ask about campaigns, commissions, academy resources..."
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
        </div>
      </Card>
    </div>
  );
};

export default ChatbotInterface;
