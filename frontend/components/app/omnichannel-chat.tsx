'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Plus,
  Send,
  ShoppingCart,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CartItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
}

interface CartData {
  cart_id: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total_amount: number;
  items: CartItem[];
}

export function OmnichannelChat() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartData | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<Record<string, unknown> | null>(null);
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'agent'; text: string; actionType?: string }>
  >([
    {
      sender: 'agent',
      text: 'Namaste! Main DukanVaani AI hoon. Aap voice ya text kisi se bhi products dhoondh sakte hain, recommendations le sakte hain aur cart bana sakte hain.',
    },
  ]);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/commerce/cart');
      const data = await res.json();
      if (data.success && data.cart) {
        setCart(data.cart);
      }
    } catch {
      // Graceful
    }
  };

  React.useEffect(() => {
    fetchCart();
  }, []);

  const handleSendMessage = async (text?: string) => {
    const query = (text || input).trim();
    if (!query) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInput('');
    setLoading(true);

    const qLower = query.toLowerCase();

    try {
      // 1. Checkout / Payment
      if (
        qLower.includes('checkout') ||
        qLower.includes('pay') ||
        qLower.includes('payment') ||
        qLower.includes('kharidna')
      ) {
        const res = await fetch('/api/commerce/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'checkout' }),
        });
        const data = await res.json();
        if (data.success) {
          setCart(data.cart);
          setPaymentIntent(data.payment_intent);
          setMessages((prev) => [
            ...prev,
            {
              sender: 'agent',
              text: `✅ Payment Intent generated for ₹${data.cart.total_amount}! Aap UPI QR scan karke order confirm kar sakte hain.`,
              actionType: 'CHECKOUT',
            },
          ]);
          toast.success('Payment intent generated!');
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: 'agent', text: data.message || 'Cart empty hai. Pehle items add karein.' },
          ]);
        }
      }
      // 2. Add to Cart (e.g. "add rice", "2 kg rice add karo")
      else if (qLower.includes('add') || qLower.includes('chahiye') || qLower.includes('dalo')) {
        let product = 'Basmati Rice';
        let qty = 1.0;

        if (qLower.includes('oil') || qLower.includes('tel')) product = 'Fortune Sunflower Oil';
        else if (qLower.includes('mustard') || qLower.includes('sarson'))
          product = 'Dabur Mustard Oil';
        else if (qLower.includes('atta')) product = 'Aashirvaad Whole Wheat Atta';
        else if (qLower.includes('dal')) product = 'Toor Dal';
        else if (qLower.includes('mango') || qLower.includes('aam'))
          product = 'Fresh Alphonso Mangoes';
        else if (qLower.includes('apple') || qLower.includes('seb')) product = 'Shimla Apples';
        else if (qLower.includes('milk') || qLower.includes('doodh'))
          product = 'Amul Taaza Toned Milk';

        if (qLower.includes('2') || qLower.includes('do')) qty = 2.0;
        if (qLower.includes('5') || qLower.includes('panch')) qty = 5.0;

        const res = await fetch('/api/commerce/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', product_name: product, quantity: qty }),
        });
        const data = await res.json();
        if (data.success) {
          setCart(data.cart);
          setMessages((prev) => [
            ...prev,
            {
              sender: 'agent',
              text: `🛒 ${data.message}`,
              actionType: 'CART_ADD',
            },
          ]);
          toast.success(`Added ${product} to cart!`);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: 'agent', text: data.message || 'Product add nahi ho paya.' },
          ]);
        }
      }
      // 3. View Cart
      else if (qLower.includes('cart') || qLower.includes('total')) {
        const res = await fetch('/api/commerce/cart');
        const data = await res.json();
        if (data.success) {
          setCart(data.cart);
          setMessages((prev) => [
            ...prev,
            {
              sender: 'agent',
              text: `🛒 Cart Total: ₹${data.cart.total_amount} (${data.cart.items.length} items). Subtotal: ₹${data.cart.subtotal}, Delivery: ₹${data.cart.delivery_fee}.`,
              actionType: 'CART_VIEW',
            },
          ]);
        }
      }
      // 4. General Recommendations
      else {
        const res = await fetch('/api/commerce/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, budget: 1000 }),
        });
        const data = await res.json();
        if (data.success && data.recommendations?.length > 0) {
          const recNames = data.recommendations
            .map((r: { name: string; price: number }) => `${r.name} (₹${r.price})`)
            .join(', ');
          setMessages((prev) => [
            ...prev,
            {
              sender: 'agent',
              text: `✨ Aapke liye shortlisted products: ${recNames}. Inme se kya add karna chahenge?`,
              actionType: 'RECOMMENDATIONS',
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'agent',
              text: 'Main aapke liye catalogue search kar rahi hoon. Aap kisi specific product ya budget ke bare mein bata sakte hain.',
            },
          ]);
        }
      }
    } catch {
      toast.error('Network error processing message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      {/* Omnichannel Chat Box */}
      <Card className="flex h-[420px] flex-col justify-between border-zinc-800/80 bg-zinc-950/70 p-4 text-white shadow-xl backdrop-blur-md md:col-span-7">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <MessageSquare className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Omnichannel Text & Voice Assistant
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Conversational AI synced with your active session
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400"
            >
              Active Sync
            </Badge>
          </div>

          {/* Messages */}
          <div className="mt-3 h-64 space-y-2.5 overflow-y-auto pr-1">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-2.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 font-medium text-white'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-200 shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex animate-pulse items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-400">
                  <Sparkles className="size-3.5 animate-spin text-emerald-400" />
                  <span>Agent is processing intent & database tools...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex gap-2 border-t border-zinc-800/60 pt-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type '2 kg basmati rice add karo' or 'Checkout'..."
            className="border-zinc-800 bg-zinc-900 text-xs text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="bg-emerald-600 px-3 text-white hover:bg-emerald-500"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </Card>

      {/* Live Synchronized Cart Card */}
      <Card className="flex h-[420px] flex-col justify-between border-zinc-800/80 bg-zinc-950/70 p-4 text-white shadow-xl backdrop-blur-md md:col-span-5">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                <ShoppingCart className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Live Smart Cart</h3>
                <p className="text-[11px] text-zinc-400">Deterministic price calculations</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch('/api/commerce/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'clear' }),
                });
                fetchCart();
                setPaymentIntent(null);
                toast.info('Cart cleared');
              }}
              className="flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-red-400"
            >
              <Trash2 className="size-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Cart Items List */}
          <div className="mt-3 h-44 space-y-2 overflow-y-auto pr-1">
            {!cart?.items || cart.items.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Cart is empty. Speak or type to add items!
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-2 text-xs"
                >
                  <div>
                    <p className="font-semibold text-zinc-200">{item.product_name}</p>
                    <p className="text-[10px] text-zinc-400">
                      {item.quantity} {item.unit || 'unit'} × ₹{item.unit_price}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">₹{item.total_price}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cart Totals & Checkout Button */}
        <div className="space-y-2 border-t border-zinc-800/60 pt-3">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Subtotal:</span>
            <span className="font-mono text-zinc-200">₹{cart?.subtotal || 0}</span>
          </div>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Delivery Fee (Free &gt; ₹500):</span>
            <span className="font-mono text-zinc-200">₹{cart?.delivery_fee || 0}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-800/40 pt-1 text-xs font-bold text-white">
            <span>Total Payable:</span>
            <span className="font-mono text-sm text-emerald-400">₹{cart?.total_amount || 0}</span>
          </div>

          <Button
            onClick={() => handleSendMessage('checkout')}
            disabled={!cart?.items || cart.items.length === 0 || loading}
            className="flex w-full items-center justify-center gap-1.5 bg-cyan-600 text-xs font-semibold text-white hover:bg-cyan-500"
          >
            <CreditCard className="size-3.5" />
            <span>Generate Payment Intent (UPI / QR)</span>
          </Button>

          {paymentIntent && (
            <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2 text-center text-xs text-emerald-300">
              <CheckCircle2 className="mr-1 inline-block size-4 text-emerald-400" />
              <span>
                Payment Intent <strong>{paymentIntent.payment_id as string}</strong> Ready!
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
