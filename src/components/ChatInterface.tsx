
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Lock, Hash } from 'lucide-react';

interface ChatInterfaceProps {
  user: any;
}

const ChatInterface = ({ user }: ChatInterfaceProps) => {
  const [activeRoom, setActiveRoom] = useState('1');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock chat rooms
  const chatRooms = [
    { id: '1', name: 'General Discussion', type: 'group', participants: 8 },
    { id: '2', name: 'High Performers', type: 'group', participants: 5 },
    { id: '3', name: 'Sarah Wilson', type: 'private', participants: 2 },
    { id: '4', name: 'Marketing Team', type: 'group', participants: 12 }
  ];

  // Mock messages - TODO: Replace with Supabase real-time subscription
  useEffect(() => {
    const mockMessages = [
      {
        id: '1',
        sender_id: '2',
        sender_name: 'Alice Johnson',
        content: 'Hey everyone! Just launched a new campaign for summer fashion. Commission rates are looking great!',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        group_id: activeRoom === '1' ? '1' : null,
        recipient_id: activeRoom !== '1' ? user.id : null
      },
      {
        id: '2',
        sender_id: user.id,
        sender_name: user.name,
        content: 'That sounds awesome! What\'s the commission percentage?',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        group_id: activeRoom === '1' ? '1' : null,
        recipient_id: activeRoom !== '1' ? '2' : null
      },
      {
        id: '3',
        sender_id: '3',
        sender_name: 'Bob Smith',
        content: 'I\'ve been seeing great results with the tech gadgets campaign. Performance is up 18% this month!',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        group_id: activeRoom === '1' ? '1' : null,
        recipient_id: activeRoom !== '1' ? user.id : null
      }
    ];
    setMessages(mockMessages);
  }, [activeRoom, user.id, user.name]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Create new message
    const newMessage = {
      id: Date.now().toString(),
      sender_id: user.id,
      sender_name: user.name,
      content: message,
      timestamp: new Date().toISOString(),
      group_id: chatRooms.find(r => r.id === activeRoom)?.type === 'group' ? activeRoom : null,
      recipient_id: chatRooms.find(r => r.id === activeRoom)?.type === 'private' ? '2' : null
    };

    // TODO: Encrypt message with crypto-js before sending
    // TODO: Send to Supabase via Edge Function
    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate real-time response for demo
    setTimeout(() => {
      const responseMessage = {
        id: (Date.now() + 1).toString(),
        sender_id: '2',
        sender_name: 'Alice Johnson',
        content: 'Great question! Let me check the latest rates for you.',
        timestamp: new Date().toISOString(),
        group_id: chatRooms.find(r => r.id === activeRoom)?.type === 'group' ? activeRoom : null,
        recipient_id: chatRooms.find(r => r.id === activeRoom)?.type === 'private' ? user.id : null
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 2000);
  };

  const activeRoomData = chatRooms.find(room => room.id === activeRoom);

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
                  {room.type === 'group' ? (
                    <Hash className="w-4 h-4 mr-2 text-white/70" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2 text-white/70" />
                  )}
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
              {activeRoomData?.type === 'group' ? (
                <Hash className="w-5 h-5 mr-2" />
              ) : (
                <Lock className="w-5 h-5 mr-2" />
              )}
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
                  <p className="text-xs text-white/50 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
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
