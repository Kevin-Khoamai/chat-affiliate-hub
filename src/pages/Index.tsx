
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Bot, Wallet, Settings, LogOut, Link as LinkIcon } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import ChatbotInterface from '@/components/ChatbotInterface';
import BlockchainPlaceholder from '@/components/BlockchainPlaceholder';
import AuthModal from '@/components/AuthModal';

const Index = () => {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  // Mock user for development - replace with Supabase auth
  useEffect(() => {
    // TODO: Replace with actual Supabase authentication check
    const mockUser = {
      id: '1',
      email: 'affiliate@example.com',
      name: 'John Affiliate',
      created_at: new Date().toISOString()
    };
    setUser(mockUser);
  }, []);

  const handleLogout = () => {
    // TODO: Implement Supabase logout
    setUser(null);
    setShowAuthModal(true);
  };

  // Mock data for development
  const chatRooms = [
    { id: '1', name: 'General Discussion', participants: 8, lastMessage: 'New campaign launched!', unread: 2 },
    { id: '2', name: 'High Performers', participants: 5, lastMessage: 'Great results this month', unread: 0 },
    { id: '3', name: 'Beginners Hub', participants: 12, lastMessage: 'Tips for getting started', unread: 1 }
  ];

  const campaigns = [
    { id: '1', name: 'Summer Fashion Sale', commission: '15%', performance: '+23%' },
    { id: '2', name: 'Tech Gadgets Promo', commission: '12%', performance: '+18%' },
    { id: '3', name: 'Home & Garden', commission: '10%', performance: '+8%' }
  ];

  if (!user && !showAuthModal) {
    setShowAuthModal(true);
  }

  if (showAuthModal) {
    return <AuthModal onAuthenticated={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Affiliate Chat DApp</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-white border-white/30">
              {user?.email}
            </Badge>
            {/* Blockchain Placeholder - Future MetaMask Integration */}
            <Button 
              variant="outline" 
              size="sm" 
              disabled 
              className="border-white/30 text-white/50 cursor-not-allowed"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveView('dashboard')}
            className="text-white border-white/30"
          >
            Dashboard
          </Button>
          <Button
            variant={activeView === 'chat' ? 'default' : 'outline'}
            onClick={() => setActiveView('chat')}
            className="text-white border-white/30"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Button
            variant={activeView === 'chatbot' ? 'default' : 'outline'}
            onClick={() => setActiveView('chatbot')}
            className="text-white border-white/30"
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button
            variant={activeView === 'blockchain' ? 'default' : 'outline'}
            onClick={() => setActiveView('blockchain')}
            className="text-white border-white/30"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Blockchain
          </Button>
        </div>

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-white/70">{user?.email}</p>
                  <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Chat Rooms */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chatRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setActiveView('chat')}
                    >
                      <div>
                        <h4 className="font-medium">{room.name}</h4>
                        <p className="text-sm text-white/70">{room.lastMessage}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs border-white/30 text-white/70 mb-1">
                          {room.participants} users
                        </Badge>
                        {room.unread > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {room.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Campaign Performance */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white lg:col-span-3">
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 bg-white/5 rounded-lg">
                      <h4 className="font-medium mb-2">{campaign.name}</h4>
                      <div className="flex justify-between items-center">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                          {campaign.commission}
                        </Badge>
                        <span className="text-green-400 font-medium">{campaign.performance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat View */}
        {activeView === 'chat' && <ChatInterface user={user} />}

        {/* Chatbot View */}
        {activeView === 'chatbot' && <ChatbotInterface />}

        {/* Blockchain View */}
        {activeView === 'blockchain' && <BlockchainPlaceholder />}
      </div>
    </div>
  );
};

export default Index;
