'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  Database,
  CheckCircle2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface MerchantCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MerchantCopilotModal({ isOpen, onClose }: MerchantCopilotModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'copilot'; text: string; data?: Record<string, unknown> }>
  >([
    {
      sender: 'copilot',
      text: 'Namaste! Main aapka Merchant Copilot hoon. Aap mujhse dukan ki sales, revenue, low stock items, ya customer demand ke bare mein pooch sakte hain.',
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    'Kaunsa product low stock mein hai?',
    'Aaj kitna revenue generate hua?',
    'Kaunse abandoned carts recover karne chahiye?',
    'Store sales and orders overview',
  ];

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || query).trim();
    if (!q) return;

    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/commerce/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { sender: 'copilot', text: data.answer, data: data.data },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'copilot', text: 'Sorry, data retrieve karne mein error aaya.' },
        ]);
      }
    } catch {
      toast.error('Copilot service connection failed');
      setMessages((prev) => [
        ...prev,
        { sender: 'copilot', text: 'Database service is temporarily unreachable.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Bot className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Merchant Copilot</h2>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
                  Live SQLite DB Backed
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Ask real-time business intelligence questions in Hindi, English, or Hinglish.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 py-1">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 hover:border-indigo-500/50 hover:bg-indigo-950/30 hover:text-indigo-200 transition-colors duration-200"
            >
              💡 {prompt}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="h-64 overflow-y-auto space-y-3 rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-3.5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 shadow-sm'
                }`}
              >
                {msg.sender === 'copilot' && (
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-400 mb-1">
                    <Sparkles className="size-3.5" />
                    <span>Merchant AI Copilot</span>
                  </div>
                )}
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-zinc-800/80 p-3 text-xs text-zinc-400 border border-zinc-700/50 animate-pulse flex items-center gap-2">
                <Database className="size-3.5 text-indigo-400 animate-spin" />
                <span>Querying live SQLite database tables...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex gap-2 pt-1 border-t border-zinc-800/60">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a business question in Hinglish (e.g. 'Kaunse products low stock hain?')..."
            className="border-zinc-800 bg-zinc-900 text-xs text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500"
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || !query.trim()}
            className="bg-indigo-600 text-white hover:bg-indigo-500 px-4"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
