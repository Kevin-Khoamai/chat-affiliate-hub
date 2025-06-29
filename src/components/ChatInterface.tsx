
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Lock, Hash } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { encryptMessage, decryptMessage, generateContentHash } from '@/lib/crypto';

interface ChatInterfaceProps {
  user: any;
}

const ChatInterface = ({ user }: ChatInterfaceProps) => {
  const [activeRoom, setActiveRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load chat rooms and join user to default groups
  useEffect(() => {
    loadChatRooms();
  }, []);

  // Load messages when active room changes
  useEffect(() => {
    if (activeRoom) {
      loadMessages();
      subscribeToMessages();
    }
  }, [activeRoom]);

  const loadChatRooms = async () => {
    try {
      // First, get all available groups
      const { data: groups, error: groupsError } = await supabase
        .from('chat_groups')
        .select('*')
        .order('created_at');

      if (groupsError) throw groupsError;

      // Check which groups the user is a member of
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (membershipsError) throw membershipsError;

      const memberGroupIds = memberships?.map(m => m.group_id) || [];

      // If user is not a member of any groups, add them to "General Discussion"
      if (memberGroupIds.length === 0 && groups && groups.length > 0) {
        const generalGroup = groups.find(g => g.name === 'General Discussion');
        if (generalGroup) {
          await supabase
            .from('group_members')
            .insert({ group_id: generalGroup.id, user_id: user.id });
          memberGroupIds.push(generalGroup.id);
        }
      }

      // Filter groups to show only those the user is a member of
      const userGroups = groups?.filter(g => memberGroupIds.includes(g.id)) || [];
      
      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        userGroups.map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          return {
            ...group,
            participants: count || 0,
            type: 'group'
          };
        })
      );

      setChatRooms(groupsWithCounts);
      
      if (groupsWithCounts.length > 0 && !activeRoom) {
        setActiveRoom(groupsWithCounts[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error loading chat rooms",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (
            name,
            email
          )
        `)
        .eq('group_id', activeRoom)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const decryptedMessages = data?.map(msg => ({
        ...msg,
        sender_name: msg.profiles?.name || msg.profiles?.email?.split('@')[0] || 'Unknown',
        content: msg.encrypted ? decryptMessage(msg.content, user.id) : msg.content
      })) || [];

      setMessages(decryptedMessages);
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${activeRoom}`
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Get sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', newMessage.sender_id)
            .single();

          const messageWithProfile = {
            ...newMessage,
            sender_name: profile?.name || profile?.email?.split('@')[0] || 'Unknown',
            content: newMessage.encrypted ? decryptMessage(newMessage.content, user.id) : newMessage.content
          };

          setMessages(prev => [...prev, messageWithProfile]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeRoom) return;

    try {
      const shouldEncrypt = true; // You can make this configurable
      const content = shouldEncrypt ? encryptMessage(message, user.id) : message;
      const contentHash = generateContentHash(message);

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          group_id: activeRoom,
          content,
          content_hash: contentHash,
          encrypted: shouldEncrypt
        });

      if (error) throw error;
      
      setMessage('');
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activeRoomData = chatRooms.find(room => room.id === activeRoom);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-white">Loading chat rooms...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      {/* Chat Rooms Sidebar */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Chat Rooms
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1">
            {chatRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`w-full p-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between ${
                  activeRoom === room.id ? 'bg-white/20' : ''
                }`}
              >
                <div className="flex items-center">
                  <Hash className="w-4 h-4 mr-2 text-white/70" />
                  <span className="font-medium">{room.name}</span>
                </div>
                <Badge variant="outline" className="text-xs border-white/30 text-white/70">
                  {room.participants}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white lg:col-span-3 flex flex-col">
        <CardHeader className="border-b border-white/20">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Hash className="w-5 h-5 mr-2" />
              {activeRoomData?.name}
            </div>
            <Badge variant="outline" className="border-white/30 text-white/70">
              {activeRoomData?.participants} participants
            </Badge>
          </CardTitle>
        </CardHeader>
        
        {/* Messages Container */}
        <CardContent className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender_id === user.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {msg.sender_id !== user.id && (
                    <p className="text-xs text-white/70 mb-1">{msg.sender_name}</p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-white/50">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                    {msg.encrypted && (
                      <Lock className="w-3 h-3 text-white/50" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Message Input */}
        <div className="p-4 border-t border-white/20">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
            <Button type="submit" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ChatInterface;
