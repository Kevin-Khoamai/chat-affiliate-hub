
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Bot, Users, BookOpen } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import ChatInterface from "@/components/ChatInterface";
import ChatbotInterface from "@/components/ChatbotInterface";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email,
          name: profile?.name || session.user.email?.split('@')[0],
          ...profile
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email,
          name: profile?.name || session.user.email?.split('@')[0],
          ...profile
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal onAuthenticated={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ChatAffHub</h1>
              <p className="text-sm text-white/70">Decentralized Affiliate Marketing Community</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-white/70">Welcome, {user.name}!</span>
            <button
              onClick={handleSignOut}
              className="text-white/70 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border-white/20">
            <TabsTrigger value="chat" className="flex items-center space-x-2 text-white data-[state=active]:bg-white/20">
              <Users className="w-4 h-4" />
              <span>Community Chat</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center space-x-2 text-white data-[state=active]:bg-white/20">
              <Bot className="w-4 h-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="mt-6">
            <ChatInterface user={user} />
          </TabsContent>
          
          <TabsContent value="ai" className="mt-6">
            <ChatbotInterface />
          </TabsContent>
        </Tabs>
      </main>
      
      <Toaster />
    </div>
  );
};

export default Index;
