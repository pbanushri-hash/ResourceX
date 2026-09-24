import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Message } from '../../types';
import { MessageSquare, Send, Building2, User as UserIcon, Clock, Check } from 'lucide-react';
import { EmptyState } from '../../components/common/EmptyState';

export const MessagesPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await api.getMessages();
      setMessages(data);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    try {
      setSending(true);
      const targetReceiverId = selectedMessage.senderId === user?.id 
        ? selectedMessage.receiverId 
        : selectedMessage.senderId;

      await api.sendMessage({
        receiverId: targetReceiverId,
        resourceId: selectedMessage.resourceId,
        resourceName: selectedMessage.resourceName,
        content: replyText
      });

      setReplyText('');
      alert('Reply transmitted successfully.');
      await fetchMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Commercial Inquiries & B2B Messaging
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Communicate directly with verified suppliers and procurement managers regarding surplus specifications and terms.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading communications...</div>
      ) : messages.length === 0 ? (
        <EmptyState
          title="No messages found."
          description="You have no commercial messages or resource inquiries yet. When you contact a seller or a buyer inquiries about your surplus, conversations will appear here."
          icon={MessageSquare}
          actionLabel="Browse Marketplace"
          onAction={() => navigate('/marketplace')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden min-h-[480px]">
          
          {/* Thread list (5 cols) */}
          <div className="md:col-span-5 border-r border-slate-100 divide-y divide-slate-100 overflow-y-auto max-h-[550px]">
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedMessage?.id === msg.id ? 'bg-emerald-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 truncate">
                    {msg.senderCompanyName || msg.senderName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {msg.resourceName && (
                  <p className="text-[11px] font-semibold text-emerald-800 line-clamp-1 mb-1">
                    Re: {msg.resourceName}
                  </p>
                )}
                <p className="text-xs text-slate-500 line-clamp-2 leading-tight">
                  {msg.content || msg.message}
                </p>
              </div>
            ))}
          </div>

          {/* Conversation view (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between p-6">
            {selectedMessage ? (
              <div className="flex flex-col h-full justify-between space-y-4">
                
                {/* Header */}
                <div className="pb-3 border-b border-slate-100 space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {selectedMessage.senderCompanyName || selectedMessage.senderName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Signatory: {selectedMessage.senderName}
                    {selectedMessage.resourceName && ` • Regarding: ${selectedMessage.resourceName}`}
                  </p>
                </div>

                {/* Message bubble */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed max-w-xl">
                    <p>{selectedMessage.content || selectedMessage.message}</p>
                    <span className="block text-[10px] text-slate-400 mt-2 text-right">
                      {new Date(selectedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Reply composer */}
                <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type commercial clarification, delivery queries, or MOQ terms..."
                    className="flex-1 text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>

              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Select an inquiry to view conversation history.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
