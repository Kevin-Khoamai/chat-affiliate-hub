import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, BookOpen, TrendingUp } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const ChatbotInterface = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [academyContent, setAcademyContent] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Enhanced sample queries for quick access
  const sampleQueries = [
    "What campaigns have the highest commission rates?",
    "Show me Summer Fashion Sale campaign details",
    "Top performing campaigns this month",
    "Academy tutorials for affiliate marketing beginners",
    "How to optimize my conversion rates?",
    "Best practices for email marketing campaigns",
    "Social media promotion strategies",
    "What are the latest campaign trends?",
    "Commission structures and payment schedules",
    "Content creation tips for affiliates",
    "SEO optimization for affiliate websites",
    "How to track campaign performance metrics?"
  ];

  // Load chat history from localStorage on component mount
  useEffect(() => {
    loadChatHistory();
    loadData();
  }, []);

  const loadChatHistory = () => {
    try {
      const savedHistory = localStorage.getItem('ai-assistant-chat-history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setMessages(parsedHistory);
      } else {
        // Set welcome message only if no history exists
        const welcomeMessage = {
          id: '1',
          type: 'bot',
          content: 'Hello! I\'m your AI assistant for affiliate marketing. I can help you with campaign information, performance metrics, academy resources, and optimization strategies. What would you like to know?',
          timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        saveChatHistory([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      const welcomeMessage = {
        id: '1',
        type: 'bot',
        content: 'Hello! I\'m your AI assistant for affiliate marketing. I can help you with campaign information, performance metrics, academy resources, and optimization strategies. What would you like to know?',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  };

  const saveChatHistory = (chatHistory: any[]) => {
    try {
      localStorage.setItem('ai-assistant-chat-history', JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  // Save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  const loadData = async () => {
    try {
      // Load campaigns with proper error handling
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('commission_rate', { ascending: false });

      if (campaignsError) {
        console.error('Error loading campaigns:', campaignsError);
        toast({
          title: "Error loading campaigns",
          description: "Using sample data instead",
          variant: "destructive",
        });
        // Fallback to sample data
        setCampaigns([
          { 
            id: '1', 
            name: 'Summer Fashion Sale', 
            commission_rate: 15, 
            description: 'High-converting fashion campaign for summer season',
            performance_metrics: { conversion_rate: 3.2, clicks: 1250, sales: 40 }
          },
          { 
            id: '2', 
            name: 'Tech Gadgets Pro', 
            commission_rate: 12, 
            description: 'Latest technology and gadgets with premium commissions',
            performance_metrics: { conversion_rate: 2.8, clicks: 980, sales: 27 }
          },
          { 
            id: '3', 
            name: 'Health & Wellness Hub', 
            commission_rate: 18, 
            description: 'Premium health products with high-value commissions',
            performance_metrics: { conversion_rate: 4.1, clicks: 750, sales: 31 }
          }
        ]);
      } else {
        console.log('Campaigns loaded:', campaignsData);
        setCampaigns(campaignsData || []);
      }

      // Load academy content with proper error handling
      const { data: academyData, error: academyError } = await supabase
        .from('academy')
        .select('*')
        .order('created_at', { ascending: false });

      if (academyError) {
        console.error('Error loading academy:', academyError);
        toast({
          title: "Error loading academy content",
          description: "Using sample data instead",
          variant: "destructive",
        });
        // Fallback to sample data
        setAcademyContent([
          { 
            id: '1', 
            title: 'Affiliate Marketing Fundamentals', 
            content: 'Learn the core principles of affiliate marketing, including choosing profitable niches, understanding commission structures, and building your first affiliate website.',
            category: 'Beginner',
            url: '/academy/fundamentals'
          },
          { 
            id: '2', 
            title: 'Advanced Conversion Optimization', 
            content: 'Master advanced techniques for optimizing conversion rates, including A/B testing, landing page optimization, and psychological triggers that drive sales.',
            category: 'Advanced',
            url: '/academy/conversion-optimization'
          },
          { 
            id: '3', 
            title: 'SEO for Affiliate Marketers', 
            content: 'Complete guide to search engine optimization specifically for affiliate marketers, covering keyword research, content strategies, and link building.',
            category: 'SEO',
            url: '/academy/seo-guide'
          }
        ]);
      } else {
        console.log('Academy content loaded:', academyData);
        setAcademyContent(academyData || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Database connection error",
        description: "Using sample data for demonstration",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processQuery = async (userQuery: string) => {
    const lowerQuery = userQuery.toLowerCase();
    
    // Enhanced Campaign queries with real data
    if (lowerQuery.includes('commission') || lowerQuery.includes('campaign')) {
      if (lowerQuery.includes('highest') || lowerQuery.includes('best rates')) {
        const topCommissionCampaigns = campaigns
          .sort((a, b) => (b.commission_rate || 0) - (a.commission_rate || 0))
          .slice(0, 3);
        
        if (topCommissionCampaigns.length === 0) {
          return {
            type: 'error',
            data: null,
            response: `**⚠️ No campaign data available**\n\nI couldn't retrieve campaign information from the database. Please check your connection or contact support.`
          };
        }
        
        return {
          type: 'campaigns',
          data: topCommissionCampaigns,
          response: `**🏆 Highest Commission Rate Campaigns:**\n\n${topCommissionCampaigns.map((c, index) => `${index + 1}. **${c.name}**\n   💰 Commission: ${c.commission_rate}%\n   📋 ${c.description || 'Premium affiliate program'}\n   📊 Performance: ${c.performance_metrics?.conversion_rate || 'N/A'}% conversion rate\n   📈 Recent Stats: ${c.performance_metrics?.clicks || 'N/A'} clicks, ${c.performance_metrics?.sales || 'N/A'} sales`).join('\n\n')}\n\n💡 **Pro Tip:** Focus on campaigns with 15%+ commission rates for maximum earnings!`
        };
      } else if (lowerQuery.includes('summer') || lowerQuery.includes('fashion')) {
        const summerCampaign = campaigns.find(c => 
          c.name.toLowerCase().includes('summer') || 
          c.name.toLowerCase().includes('fashion')
        );
        
        if (summerCampaign) {
          return {
            type: 'campaign',
            data: summerCampaign,
            response: `**🌞 ${summerCampaign.name} Campaign Details:**\n\n💰 **Commission Rate:** ${summerCampaign.commission_rate}%\n📝 **Description:** ${summerCampaign.description}\n\n📊 **Performance Metrics:**\n• Conversion Rate: ${summerCampaign.performance_metrics?.conversion_rate || 'N/A'}%\n• Total Clicks: ${summerCampaign.performance_metrics?.clicks || 'N/A'}\n• Total Sales: ${summerCampaign.performance_metrics?.sales || 'N/A'}\n\n🎯 **Quick Tips for This Campaign:**\n• Target fashion enthusiasts aged 18-35\n• Use seasonal keywords like "summer trends"\n• Focus on social media promotion\n• Best performance times: 10 AM - 2 PM`
          };
        } else {
          return {
            type: 'campaigns',
            data: campaigns,
            response: `**🔍 No Summer/Fashion campaigns found**\n\nI couldn't find any summer or fashion-specific campaigns. Here are our available campaigns:\n\n${campaigns.map((c, index) => `**${index + 1}. ${c.name}**\n   💰 Commission: ${c.commission_rate}%\n   📋 ${c.description || 'Quality affiliate program'}`).join('\n\n')}`
          };
        }
      } else {
        if (campaigns.length === 0) {
          return {
            type: 'error',
            data: null,
            response: `**⚠️ No campaign data available**\n\nI couldn't retrieve campaign information from the database. Please check your connection or contact support.`
          };
        }
        
        return {
          type: 'campaigns',
          data: campaigns,
          response: `**🚀 Active Campaign Portfolio (${campaigns.length} campaigns):**\n\n${campaigns.map((c, index) => `**${index + 1}. ${c.name}**\n   💰 Commission: ${c.commission_rate}%\n   📋 ${c.description || 'Quality affiliate program'}\n   🎯 Status: Active & Ready for Promotion\n   📊 Performance: ${c.performance_metrics?.conversion_rate || 'N/A'}% conversion`).join('\n\n')}\n\n📈 **Campaign Selection Tips:**\n• Choose campaigns aligned with your audience\n• Higher commission doesn't always mean better ROI\n• Test multiple campaigns to find your best performers`
        };
      }
    }
    
    // Enhanced Academy queries with real data
    if (lowerQuery.includes('academy') || lowerQuery.includes('tutorial') || lowerQuery.includes('learn') || lowerQuery.includes('beginner')) {
      if (academyContent.length === 0) {
        return {
          type: 'error',
          data: null,
          response: `**⚠️ No academy content available**\n\nI couldn't retrieve academy information from the database. Please check your connection or contact support.`
        };
      }
      
      if (lowerQuery.includes('beginner') || lowerQuery.includes('start')) {
        const beginnerContent = academyContent.filter(a => 
          a.category?.toLowerCase().includes('beginner') || 
          a.title.toLowerCase().includes('fundamental') ||
          a.title.toLowerCase().includes('basic')
        );
        
        return {
          type: 'academy',
          data: beginnerContent.length > 0 ? beginnerContent : academyContent,
          response: `**🎓 Beginner's Guide to Affiliate Marketing:**\n\n**📚 Essential Learning Path:**\n\n${(beginnerContent.length > 0 ? beginnerContent : academyContent).map((a, index) => `**${index + 1}. ${a.title}**\n   📖 ${a.content}\n   🏷️ Category: ${a.category || 'General'}\n   ${a.url ? `🔗 Learn more: ${a.url}` : ''}`).join('\n\n')}\n\n**🏁 Getting Started Checklist:**\n✅ Choose your niche (passion + profit potential)\n✅ Research target audience demographics\n✅ Set up tracking and analytics\n✅ Create content calendar\n✅ Join 2-3 quality affiliate programs\n✅ Build email list from day one\n\n**⚡ Quick Win Tips:**\n• Start with products you actually use\n• Focus on solving real problems\n• Be transparent about affiliate links\n• Track everything from day one`
        };
      } else {
        return {
          type: 'academy',
          data: academyContent,
          response: `**🎓 Academy Resource Library (${academyContent.length} resources):**\n\n${academyContent.map((a, index) => `**${index + 1}. ${a.title}**\n📖 ${a.content}\n🏷️ Category: ${a.category || 'General'}\n${a.url ? `🔗 Resource: ${a.url}` : ''}`).join('\n\n')}\n\n**📈 Learning Categories Available:**\n${[...new Set(academyContent.map(a => a.category).filter(Boolean))].map(cat => `• **${cat}**`).join('\n')}\n\n💡 **Study Tip:** Implement one new strategy per week for sustainable growth!`
        };
      }
    }
    
    // Performance queries with real data
    if (lowerQuery.includes('performance') || lowerQuery.includes('top') || lowerQuery.includes('metrics')) {
      if (campaigns.length === 0) {
        return {
          type: 'error',
          data: null,
          response: `**⚠️ No performance data available**\n\nI couldn't retrieve campaign performance data from the database. Please check your connection or contact support.`
        };
      }
      
      const topCampaign = campaigns.reduce((prev, current) => {
        const prevPerf = prev.performance_metrics?.conversion_rate || 0;
        const currentPerf = current.performance_metrics?.conversion_rate || 0;
        return prevPerf > currentPerf ? prev : current;
      }, campaigns[0]);
      
      return {
        type: 'performance',
        data: topCampaign,
        response: `**📊 Performance Analytics Dashboard:**\n\n**🏆 Top Performer: ${topCampaign.name}**\n• 🎯 Conversion Rate: ${topCampaign.performance_metrics?.conversion_rate || 0}%\n• 💰 Commission Rate: ${topCampaign.commission_rate}%\n• 📈 Total Clicks: ${topCampaign.performance_metrics?.clicks || 'N/A'}\n• 💼 Total Sales: ${topCampaign.performance_metrics?.sales || 'N/A'}\n• 💵 Estimated Monthly Earnings: $${((topCampaign.performance_metrics?.conversion_rate || 0) * (topCampaign.commission_rate || 0) * 10).toFixed(2)}\n\n**📋 All Campaign Performance:**\n${campaigns.map((c, index) => `${index + 1}. **${c.name}**: ${c.performance_metrics?.conversion_rate || 0}% conversion, ${c.commission_rate}% commission`).join('\n')}\n\n**🎯 Performance Optimization Actions:**\n1. **A/B Test:** Headlines, CTAs, and landing pages\n2. **Traffic Quality:** Focus on high-intent keywords\n3. **Mobile Optimization:** 70% of traffic is mobile\n4. **Speed Optimization:** Every second counts`
      };
    }
    
    // Default response with data summary
    const campaignCount = campaigns.length;
    const academyCount = academyContent.length;
    const avgCommission = campaigns.length > 0 
      ? (campaigns.reduce((sum, c) => sum + (c.commission_rate || 0), 0) / campaigns.length).toFixed(1)
      : 'N/A';
    
    return {
      type: 'general',
      data: { campaigns, academyContent },
      response: `**🤖 How can I help you today?**\n\n**📊 Current Database Status:**\n• **${campaignCount}** active campaigns available\n• **${academyCount}** academy resources loaded\n• **${avgCommission}%** average commission rate\n\nI'm your AI assistant specializing in affiliate marketing. I can provide detailed guidance on:\n\n**🎯 Campaigns & Commissions:**\n• Campaign details and commission rates\n• Performance comparisons\n• Payment structures and schedules\n\n**📚 Academy & Learning:**\n• Beginner tutorials and guides\n• Advanced strategies\n• Best practices and case studies\n\n**📊 Performance Analytics:**\n• Campaign performance metrics\n• Conversion optimization\n• ROI analysis and reporting\n\n**🚀 Optimization Strategies:**\n• SEO and content marketing\n• Email marketing automation\n• Social media promotion\n• Conversion rate optimization\n\n**💡 Quick Start Options:**\n• Try one of the suggested queries below\n• Ask about specific campaigns or topics\n• Request step-by-step tutorials\n• Get personalized optimization advice\n\n*What would you like to explore first?*`
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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setQuery('');
    setLoading(true);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = await processQuery(userMessage.content);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.response,
        data: result.data,
        dataType: result.type,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...newMessages, botMessage];
      setMessages(updatedMessages);
    } catch (error: any) {
      console.error('Query processing error:', error);
      toast({
        title: "Error processing query",
        description: error.message,
        variant: "destructive",
      });
      
      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `**❌ Error processing your query**\n\nI encountered an error while processing your request. Please try again or rephrase your question.\n\nError details: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  // Add function to clear chat history
  const clearChatHistory = () => {
    const welcomeMessage = {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your AI assistant for affiliate marketing. I can help you with campaign information, performance metrics, academy resources, and optimization strategies. What would you like to know?',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    localStorage.removeItem('ai-assistant-chat-history');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-[calc(100vh-200px)] flex flex-col">
        <CardHeader className="border-b border-white/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bot className="w-5 h-5 mr-2" />
              AI Assistant - Campaign & Academy Knowledge
            </CardTitle>
            <Button
              onClick={clearChatHistory}
              variant="outline"
              size="sm"
              className="text-xs border-white/30 text-white/70 bg-gray-700/50 hover:bg-gray-600/50"
            >
              Clear History
            </Button>
          </div>
          <p className="text-sm text-white/70">
            Ask me about campaigns, commissions, performance metrics, academy resources, or optimization strategies
          </p>
          <div className="flex items-center space-x-4 text-xs text-white/60">
            <span>📊 {campaigns.length} campaigns loaded</span>
            <span>📚 {academyContent.length} academy resources</span>
            <span>💬 {messages.length} messages in history</span>
          </div>
        </CardHeader>

        {/* Enhanced Sample Queries */}
        <div className="p-4 border-b border-white/20 bg-gray-800/50">
          <p className="text-sm text-white/70 mb-3">💡 Try asking:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {sampleQueries.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSampleQuery(sample)}
                className="text-xs border-white/30 text-white/70 bg-gray-700/50 hover:bg-gray-600/50 justify-start text-left h-auto py-2 px-3"
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
                      : 'bg-white/10 text-white border border-white/20'
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
                    <div className="mt-3 p-3 bg-white/10 rounded-lg border border-white/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{message.data.name}</h4>
                        <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                          {message.data.commission_rate}%
                        </Badge>
                      </div>
                      <p className="text-sm text-white/70">{message.data.description}</p>
                      {message.data.performance_metrics && (
                        <div className="mt-2 text-xs text-white/60">
                          Performance: {message.data.performance_metrics.conversion_rate}% conversion • 
                          {message.data.performance_metrics.clicks} clicks • 
                          {message.data.performance_metrics.sales} sales
                        </div>
                      )}
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
              placeholder="Ask about campaigns, commissions, academy resources, optimization strategies..."
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
