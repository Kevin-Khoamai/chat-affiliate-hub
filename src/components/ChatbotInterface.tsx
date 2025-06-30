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

  useEffect(() => {
    loadData();
    // Welcome message
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: 'Hello! I\'m your AI assistant for affiliate marketing. I can help you with campaign information, performance metrics, academy resources, and optimization strategies. What would you like to know?',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const loadData = async () => {
    try {
      // Load campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('commission_rate', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Load academy content
      const { data: academyData, error: academyError } = await supabase
        .from('academy')
        .select('*')
        .order('created_at');

      if (academyError) throw academyError;
      setAcademyContent(academyData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
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
    
    // Enhanced Campaign queries
    if (lowerQuery.includes('commission') || lowerQuery.includes('campaign')) {
      if (lowerQuery.includes('highest') || lowerQuery.includes('best rates')) {
        const topCommissionCampaigns = campaigns.sort((a, b) => b.commission_rate - a.commission_rate).slice(0, 3);
        return {
          type: 'campaigns',
          data: topCommissionCampaigns,
          response: `**🏆 Highest Commission Rate Campaigns:**\n\n${topCommissionCampaigns.map((c, index) => `${index + 1}. **${c.name}**\n   💰 Commission: ${c.commission_rate}%\n   📋 ${c.description || 'Premium affiliate program'}\n   📊 Performance: ${c.performance_metrics?.conversion_rate || 'N/A'}% conversion rate`).join('\n\n')}\n\n💡 **Pro Tip:** Focus on campaigns with 15%+ commission rates for maximum earnings!`
        };
      } else if (lowerQuery.includes('summer') || lowerQuery.includes('fashion')) {
        const summerCampaign = campaigns.find(c => c.name.toLowerCase().includes('summer') || c.name.toLowerCase().includes('fashion'));
        if (summerCampaign) {
          return {
            type: 'campaign',
            data: summerCampaign,
            response: `**🌞 ${summerCampaign.name} Campaign Details:**\n\n💰 **Commission Rate:** ${summerCampaign.commission_rate}%\n📝 **Description:** ${summerCampaign.description}\n\n📊 **Performance Metrics:**\n${JSON.stringify(summerCampaign.performance_metrics, null, 2)}\n\n🎯 **Quick Tips for This Campaign:**\n• Target fashion enthusiasts aged 18-35\n• Use seasonal keywords like "summer trends"\n• Focus on social media promotion\n• Best performance times: 10 AM - 2 PM`
          };
        }
      } else if (lowerQuery.includes('trends') || lowerQuery.includes('latest')) {
        return {
          type: 'trends',
          data: campaigns,
          response: `**📈 Latest Campaign Trends & Insights:**\n\n🔥 **Hot Sectors:**\n• Fashion & Beauty: 25%+ commission rates\n• Tech & Electronics: High conversion rates\n• Health & Wellness: Growing market demand\n\n📊 **Performance Insights:**\n• Mobile traffic accounts for 70% of conversions\n• Video content increases engagement by 80%\n• Email marketing has 4x higher ROI than social media\n\n💡 **Emerging Opportunities:**\n• Sustainable products campaigns\n• AI-powered tools and services\n• Subscription-based services`
        };
      } else {
        return {
          type: 'campaigns',
          data: campaigns,
          response: `**🚀 Active Campaign Portfolio:**\n\n${campaigns.map((c, index) => `**${index + 1}. ${c.name}**\n   💰 Commission: ${c.commission_rate}%\n   📋 ${c.description || 'Quality affiliate program'}\n   🎯 Status: Active & Ready for Promotion`).join('\n\n')}\n\n📈 **Campaign Selection Tips:**\n• Choose campaigns aligned with your audience\n• Higher commission doesn't always mean better ROI\n• Test multiple campaigns to find your best performers`
        };
      }
    }
    
    // Enhanced Academy queries
    if (lowerQuery.includes('academy') || lowerQuery.includes('tutorial') || lowerQuery.includes('learn') || lowerQuery.includes('beginner')) {
      if (lowerQuery.includes('beginner') || lowerQuery.includes('start')) {
        return {
          type: 'academy',
          data: academyContent,
          response: `**🎓 Beginner's Guide to Affiliate Marketing:**\n\n**📚 Essential Learning Path:**\n\n${academyContent.map((a, index) => `**${index + 1}. ${a.title}**\n   📖 ${a.content}\n   ${a.url ? `🔗 Learn more: ${a.url}` : ''}`).join('\n\n')}\n\n**🏁 Getting Started Checklist:**\n✅ Choose your niche (passion + profit potential)\n✅ Research target audience demographics\n✅ Set up tracking and analytics\n✅ Create content calendar\n✅ Join 2-3 quality affiliate programs\n✅ Build email list from day one\n\n**⚡ Quick Win Tips:**\n• Start with products you actually use\n• Focus on solving real problems\n• Be transparent about affiliate links\n• Track everything from day one`
        };
      } else if (lowerQuery.includes('content') || lowerQuery.includes('creation')) {
        return {
          type: 'academy',
          data: null,
          response: `**✍️ Content Creation Mastery for Affiliates:**\n\n**📝 Content Types That Convert:**\n• Product Reviews & Comparisons (High intent traffic)\n• Tutorial & How-to Content (Educational value)\n• Case Studies & Success Stories (Social proof)\n• "Best of" Lists & Roundups (Decision support)\n\n**🎯 Content Strategy Framework:**\n1. **Research Phase:** Keyword research + competitor analysis\n2. **Creation Phase:** Focus on value first, promotion second\n3. **Optimization Phase:** A/B test headlines and CTAs\n4. **Distribution Phase:** Multi-channel promotion strategy\n\n**📊 Content Performance Metrics:**\n• **Click-through Rate (CTR):** Industry avg 2-5%\n• **Conversion Rate:** Industry avg 1-3%\n• **Average Order Value (AOV):** Varies by niche\n• **Customer Lifetime Value (CLV):** Long-term metric\n\n💡 **Pro Content Tips:**\n• Use personal stories and experiences\n• Include honest pros and cons\n• Add value beyond just promotion\n• Update content regularly for freshness`
        };
      } else {
        return {
          type: 'academy',
          data: academyContent,
          response: `**🎓 Academy Resource Library:**\n\n${academyContent.map((a, index) => `**${a.title}**\n📖 ${a.content}\n${a.url ? `🔗 Resource: ${a.url}` : ''}`).join('\n\n')}\n\n**📈 Advanced Learning Tracks:**\n• **SEO Mastery:** Organic traffic generation\n• **Paid Advertising:** PPC and social ads\n• **Email Marketing:** List building and nurturing\n• **Analytics & Tracking:** Data-driven decisions\n\n💡 **Study Tip:** Implement one new strategy per week for sustainable growth!`
        };
      }
    }
    
    // Enhanced Performance queries
    if (lowerQuery.includes('performance') || lowerQuery.includes('top') || lowerQuery.includes('metrics')) {
      const topCampaign = campaigns.reduce((prev, current) => {
        const prevPerf = prev.performance_metrics?.conversion_rate || 0;
        const currentPerf = current.performance_metrics?.conversion_rate || 0;
        return prevPerf > currentPerf ? prev : current;
      }, campaigns[0]);
      
      if (topCampaign) {
        return {
          type: 'performance',
          data: topCampaign,
          response: `**📊 Performance Analytics Dashboard:**\n\n**🏆 Top Performer: ${topCampaign.name}**\n• 🎯 Conversion Rate: ${topCampaign.performance_metrics?.conversion_rate || 0}%\n• 💰 Commission Rate: ${topCampaign.commission_rate}%\n• 📈 Estimated Monthly Earnings: $${((topCampaign.performance_metrics?.conversion_rate || 0) * topCampaign.commission_rate * 10).toFixed(2)}\n\n**📋 Key Performance Indicators (KPIs):**\n• **Click-Through Rate (CTR):** Industry avg 2-3%\n• **Conversion Rate:** Industry avg 1-3%\n• **Average Order Value (AOV):** Varies by niche\n• **Customer Lifetime Value (CLV):** Long-term metric\n\n**🎯 Performance Optimization Actions:**\n1. **A/B Test:** Headlines, CTAs, and landing pages\n2. **Traffic Quality:** Focus on high-intent keywords\n3. **Mobile Optimization:** 70% of traffic is mobile\n4. **Speed Optimization:** Every second counts\n\n**💡 Performance Insights:**\n• Best performing hours: 10 AM - 2 PM, 7 PM - 9 PM\n• Highest converting days: Tuesday - Thursday\n• Mobile vs Desktop: Test both experiences\n• Geographic performance: Track by location`
        };
      }
    }
    
    // Enhanced Optimization queries
    if (lowerQuery.includes('optimization') || lowerQuery.includes('convert') || lowerQuery.includes('improve') || lowerQuery.includes('seo') || lowerQuery.includes('email') || lowerQuery.includes('social')) {
      if (lowerQuery.includes('seo')) {
        return {
          type: 'optimization',
          data: null,
          response: `**🔍 SEO Optimization for Affiliates:**\n\n**🎯 Keyword Strategy:**\n• **Buyer Intent Keywords:** "best [product]", "buy [product]", "[product] review"\n• **Long-tail Keywords:** Less competition, higher conversion\n• **Local SEO:** "[product] near me", "local [service]"\n\n**📝 On-Page SEO Checklist:**\n✅ Optimized title tags (50-60 characters)\n✅ Meta descriptions (150-160 characters)\n✅ Header tags (H1, H2, H3) structure\n✅ Image alt text and optimization\n✅ Internal linking strategy\n✅ Schema markup for reviews\n\n**🔗 Link Building Strategies:**\n• Guest posting on relevant blogs\n• Resource page link building\n• Broken link building opportunities\n• HARO (Help A Reporter Out) responses\n\n**📊 SEO Metrics to Track:**\n• Organic traffic growth\n• Keyword ranking positions\n• Click-through rates from SERPs\n• Time on page and bounce rate\n\n💡 **SEO Pro Tips:**\n• Focus on user intent, not just keywords\n• Create topic clusters, not isolated pages\n• Optimize for featured snippets\n• Build E-A-T (Expertise, Authority, Trust)`
        };
      } else if (lowerQuery.includes('email')) {
        return {
          type: 'optimization',
          data: null,
          response: `**📧 Email Marketing Optimization:**\n\n**📈 Email Funnel Strategy:**\n1. **Lead Magnet:** Free guide/course/tool\n2. **Welcome Series:** 5-7 emails introducing value\n3. **Nurture Sequence:** Regular valuable content\n4. **Promotional Emails:** Strategic affiliate promotions\n\n**✍️ High-Converting Email Elements:**\n• **Subject Lines:** Keep under 50 characters, create curiosity\n• **Personalization:** Use subscriber's name and preferences\n• **Value First:** 80% value, 20% promotion ratio\n• **Clear CTAs:** One primary action per email\n\n**📊 Email Performance Metrics:**\n• **Open Rate:** Industry avg 20-25%\n• **Click Rate:** Industry avg 2-5%\n• **Conversion Rate:** Track sales from emails\n• **List Growth Rate:** Monthly subscriber increase\n\n**🎯 Optimization Tactics:**\n• A/B test subject lines and send times\n• Segment lists by interests/behavior\n• Use automation for consistent nurturing\n• Clean inactive subscribers quarterly\n\n💡 **Email Pro Tips:**\n• Best send times: Tuesday-Thursday, 10 AM or 2 PM\n• Mobile-first design (60%+ open on mobile)\n• Personal stories increase engagement\n• Include social proof and testimonials`
        };
      } else if (lowerQuery.includes('social')) {
        return {
          type: 'optimization',
          data: null,
          response: `**📱 Social Media Marketing Optimization:**\n\n**🎯 Platform-Specific Strategies:**\n\n**Instagram:**\n• Stories with swipe-up/link stickers\n• Reels for product demonstrations\n• IGTV for longer tutorials\n• User-generated content campaigns\n\n**TikTok:**\n• Trending hashtags and sounds\n• Quick product reviews (15-30 seconds)\n• Behind-the-scenes content\n• Duets and responses\n\n**YouTube:**\n• In-depth product reviews\n• Comparison videos\n• Tutorial content\n• Optimized titles and thumbnails\n\n**Facebook:**\n• Facebook Groups engagement\n• Live streaming demos\n• Carousel ads for products\n• Community building\n\n**📊 Social Media Metrics:**\n• **Engagement Rate:** Likes, comments, shares\n• **Reach:** Unique accounts reached\n• **Click-Through Rate:** Link clicks\n• **Conversion Rate:** Sales from social traffic\n\n**🚀 Growth Hacking Tips:**\n• Post consistently (1-2x daily)\n• Engage within first hour of posting\n• Use platform-native features\n• Collaborate with micro-influencers\n• Cross-promote across platforms\n\n💡 **Content Ideas:**\n• Before/after transformations\n• "Day in the life" content\n• Quick tips and hacks\n• Product unboxing videos\n• FAQ sessions and Q&As`
        };
      } else {
        return {
          type: 'optimization',
          data: null,
          response: `**🚀 Conversion Rate Optimization (CRO) Masterclass:**\n\n**🎯 CRO Fundamentals:**\n• **Hypothesis-Driven Testing:** Always test with purpose\n• **Statistical Significance:** Don't stop tests too early\n• **User Experience Focus:** Remove friction points\n• **Mobile-First Approach:** Optimize for all devices\n\n**🔧 Optimization Areas:**\n\n**1. Landing Page Optimization:**\n• Clear, compelling headlines\n• Benefit-focused copy (not feature-focused)\n• Strong, contrasting CTA buttons\n• Social proof and testimonials\n• Fast loading speed (under 3 seconds)\n\n**2. Trust Building Elements:**\n• Security badges and SSL certificates\n• Customer reviews and ratings\n• Money-back guarantees\n• Clear contact information\n• Professional design and branding\n\n**3. Call-to-Action (CTA) Optimization:**\n• Action-oriented text ("Get," "Start," "Discover")\n• Create urgency ("Limited time," "Only 3 left")\n• Use contrasting colors\n• Test button size and placement\n• A/B test button text\n\n**📊 Testing Framework:**\n1. **Identify:** Find conversion bottlenecks\n2. **Hypothesize:** Create testable theories\n3. **Design:** Create test variations\n4. **Run:** Execute with proper sample size\n5. **Analyze:** Make data-driven decisions\n6. **Implement:** Apply winning variations\n\n**💡 Quick Win Optimizations:**\n• Add countdown timers for urgency\n• Include customer photos/videos\n• Simplify checkout process\n• Add live chat support\n• Optimize for local search\n• Use exit-intent popups strategically\n\n**🔍 Tools for Optimization:**\n• Google Analytics for behavior tracking\n• Hotjar for heatmaps and recordings\n• Google Optimize for A/B testing\n• PageSpeed Insights for performance\n• GTmetrix for technical analysis`
        };
      }
    }
    
    // Payment and commission structure queries
    if (lowerQuery.includes('payment') || lowerQuery.includes('schedule') || lowerQuery.includes('structure')) {
      return {
        type: 'payments',
        data: campaigns,
        response: `**💰 Commission Structure & Payment Information:**\n\n**📊 Commission Tiers:**\n${campaigns.map(c => `• **${c.name}:** ${c.commission_rate}% commission`).join('\n')}\n\n**💳 Payment Schedule:**\n• **Monthly Payments:** 1st of each month\n• **Minimum Threshold:** $50 USD\n• **Payment Methods:** PayPal, Bank Transfer, Wise\n• **Payment Timeline:** 30-45 days after month end\n\n**📈 Bonus Structure:**\n• **Volume Bonuses:** 5-10% extra for $1000+ monthly sales\n• **Performance Bonuses:** Additional 2% for top performers\n• **Loyalty Bonuses:** Increased rates after 6 months\n\n**🔍 Tracking & Reporting:**\n• Real-time dashboard access\n• Monthly performance reports\n• Detailed conversion analytics\n• Custom tracking links\n\n💡 **Payment Optimization Tips:**\n• Reach minimum threshold consistently\n• Track all metrics for better forecasting\n• Diversify across multiple campaigns\n• Focus on recurring commission products`
      };
    }
    
    // Default response with enhanced suggestions
    return {
      type: 'general',
      data: null,
      response: `**🤖 How can I help you today?**\n\nI'm your AI assistant specializing in affiliate marketing. I can provide detailed guidance on:\n\n**🎯 Campaigns & Commissions:**\n• Campaign details and commission rates\n• Performance comparisons\n• Payment structures and schedules\n\n**📚 Academy & Learning:**\n• Beginner tutorials and guides\n• Advanced strategies\n• Best practices and case studies\n\n**📊 Performance Analytics:**\n• Campaign performance metrics\n• Conversion optimization\n• ROI analysis and reporting\n\n**🚀 Optimization Strategies:**\n• SEO and content marketing\n• Email marketing automation\n• Social media promotion\n• Conversion rate optimization\n\n**💡 Quick Start Options:**\n• Try one of the suggested queries below\n• Ask about specific campaigns or topics\n• Request step-by-step tutorials\n• Get personalized optimization advice\n\n*What would you like to explore first?*`
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

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      toast({
        title: "Error processing query",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            Ask me about campaigns, commissions, performance metrics, academy resources, or optimization strategies
          </p>
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
