import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, AlertCircle } from 'lucide-react';
import api from '../api';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  socket: any; // Passing the socket from BoardView so we don't open multiple connections
  myUserId: string;
}

export default function ChatSidebar({ isOpen, onClose, boardId, socket, myUserId }: ChatSidebarProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to auto-scroll to the bottom of the chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history when the sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      socket.emit('join_chat', boardId); // Tell server we entered this specific chat room
    }
  }, [isOpen, boardId, socket]);

  // Listen for incoming messages in real-time
  useEffect(() => {
    const handleReceiveMessage = (message: any) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => { socket.off('receive_message', handleReceiveMessage); };
  }, [socket]);

  // Auto-scroll whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/messages/${boardId}`);
      setMessages(res.data);
      setError(null);
    } catch (err) {
      setError("Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(''); // Clear input instantly for good UX
    setError(null);

    try {
      const res = await api.post('/messages', {
        content: messageText,
        boardId: boardId
      });
      
      const savedMessage = res.data;
      setMessages((prev) => [...prev, savedMessage]); // Add to my screen
      
      // Broadcast to everyone else
      socket.emit('send_message', { roomId: boardId, message: savedMessage });
    } catch (err) {
      setError("Failed to send message. Please try again.");
      setNewMessage(messageText); // Put the text back if it failed!
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dark overlay background */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      
      {/* Sliding Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200">
        
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" /> Team Chat
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {loading ? (
            <div className="text-center text-gray-400 mt-10 text-sm font-medium">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 text-sm font-medium">No messages yet. Say hello! 👋</div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender?._id === myUserId;
              const senderName = msg.sender?.username || 'Unknown User';
              const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={msg._id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-400 font-medium mb-1 px-1">
                    {isMe ? 'You' : senderName} • {time}
                  </span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} /> {/* Invisible div to scroll to */}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          {error && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded flex items-center gap-1 border border-red-100">
              <AlertCircle className="h-3 w-3" /> {error}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2 relative">
            <input 
              type="text" 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 p-3 pr-12 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl outline-none text-sm transition-all"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="absolute right-1 top-1 bottom-1 aspect-square flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}