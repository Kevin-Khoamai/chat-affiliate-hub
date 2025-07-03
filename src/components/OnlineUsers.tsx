
import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, Circle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface OnlineUsersProps {
  roomId: string;
  currentUserId: string;
}

const OnlineUsers = ({ roomId, currentUserId }: OnlineUsersProps) => {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

  useEffect(() => {
    if (!roomId) return;

    // Create presence channel for the room
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    // Track user presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state).map(userId => {
          const presence = state[userId][0];
          return {
            id: userId,
            ...presence
          };
        });
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    setPresenceChannel(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomId, currentUserId]);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 text-white/70 text-sm">
      <Users className="w-4 h-4" />
      <span>{onlineUsers.length} online</span>
      <div className="flex space-x-1">
        {onlineUsers.slice(0, 3).map((user) => (
          <div key={user.id} className="flex items-center">
            <Circle className="w-2 h-2 fill-green-400 text-green-400" />
          </div>
        ))}
        {onlineUsers.length > 3 && (
          <Badge variant="outline" className="text-xs border-white/30 text-white/70">
            +{onlineUsers.length - 3}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;
