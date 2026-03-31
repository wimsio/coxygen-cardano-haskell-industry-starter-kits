import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Message {
  id: string;
  escrow_id: string;
  sender_address: string;
  content: string;
  created_at: string;
  // local flag for optimistic UI
  pending?: boolean;
}

interface EscrowChatProps {
  escrowId: string;
  userAddress: string;
  buyerAddress: string;
  sellerAddress: string;
}

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const EscrowChat: React.FC<EscrowChatProps> = ({
  escrowId,
  userAddress,
  buyerAddress,
  sellerAddress,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const { wallet, signData } = useWallet();
  const navigate = useNavigate();

  const isParticipant = userAddress === buyerAddress || userAddress === sellerAddress;

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('escrow_messages')
          .select('*')
          .eq('escrow_id', escrowId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        const msg = error instanceof Error ? error.message : String(error);
        // If permission issue, show a helpful toast
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('row level')) {
          toast({
            title: 'Chat unavailable',
            description: 'Please sign in (Auth) to view messages for this escrow.',
            variant: 'default',
          });
        } else {
          toast({
            title: 'Failed to load messages',
            description: msg || 'Unknown error',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [escrowId, toast]);

  // Subscribe to realtime messages
  useEffect(() => {
    const channel = supabase
      .channel(`escrow-messages-${escrowId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'escrow_messages',
          filter: `escrow_id=eq.${escrowId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [escrowId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isParticipant) return;

    const trimmed = newMessage.trim();
    setSending(true);

    // Optimistic UI: add a pending message so sender sees it immediately
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      escrow_id: escrowId,
      sender_address: userAddress,
      content: trimmed,
      created_at: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage('');

    try {
      // 1) Authenticated user (existing path)
      if (authUser) {
        const { data: insertedRows, error } = await supabase.from('escrow_messages').insert({
          escrow_id: escrowId,
          sender_address: userAddress,
          content: trimmed,
        }).select();

        if (error) throw new Error(error.message || JSON.stringify(error));

        if (insertedRows && insertedRows.length > 0) {
          const inserted = insertedRows[0] as Message;
          setMessages((prev) => prev.map((m) => (m.id === tempId ? inserted : m)));
        }

        // Trigger email notification for the other participant (fire-and-forget)
        try {
          const recipientAddress = userAddress === buyerAddress ? sellerAddress : buyerAddress;
          const notifyResp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              type: 'message_received',
              escrow_id: escrowId,
              recipient_address: recipientAddress,
              data: {
                message: trimmed,
                base_url: window.location.origin,
              },
            }),
          });

          if (!notifyResp.ok) {
            const txt = await notifyResp.text();
            console.warn('Notification function returned non-OK:', notifyResp.status, txt);
          }
        } catch (notifyErr) {
          console.error('Failed to trigger notification:', notifyErr);
        }

        return;
      }

      // 2) Wallet-only user (no supabase auth) — use wallet sign + Edge Function
      if (!authUser && wallet && signData && wallet.address === userAddress) {
        // Payload must include escrow and timestamp to prevent replay
        const payload = JSON.stringify({ escrow_id: escrowId, content: trimmed, ts: Date.now(), address: wallet.address });
        const { signature, key } = await signData(payload);

        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-wallet-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ escrow_id: escrowId, content: trimmed, sender_address: wallet.address, payload, signature, key }),
        });

        if (!resp.ok) {
          // try to parse structured error from function
          let serverMsg = `${resp.status} ${resp.statusText}`;
          try {
            const j = await resp.json();
            serverMsg = j?.error || JSON.stringify(j);
          } catch {
            const txt = await resp.text();
            serverMsg = txt || serverMsg;
          }
          throw new Error(serverMsg);
        }

        const result = await resp.json();
        // Expect { success: true, message: <inserted row> }
        if (result?.message) {
          setMessages((prev) => prev.map((m) => (m.id === tempId ? result.message : m)));
          setSendError(null);
        }

        return;
      }

      // Otherwise, user is not allowed to send
      toast({
        title: 'Sign in required',
        description: 'Please sign in to your account to send messages.',
        variant: 'destructive',
      });

      // Remove optimistic temp message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));

    } catch (error) {
      console.error('Error sending message:', error);
      const errMsg =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : (error && typeof error === 'object' && 'message' in error)
          ? String((error as any).message)
          : JSON.stringify(error);

      // Remove optimistic temp message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));

      const lower = (errMsg || '').toLowerCase();
      const signatureIssue = lower.includes('invalid signature') || lower.includes('signature');
      const keyMismatch = lower.includes('public key') || lower.includes('does not match address') || lower.includes('payment key');

      if (signatureIssue) {
        setSendError('Signature verification failed — please reconnect the sending wallet and try again.');
        toast({
          variant: 'destructive',
          title: 'Signature verification failed',
          description: 'Wallet signature could not be verified for this message. Reconnect/authorize your wallet and resend.',
        });
      } else if (keyMismatch) {
        setSendError('Wallet public key does not match the sender address — ensure you are using the correct wallet.');
        toast({
          variant: 'destructive',
          title: 'Wallet/address mismatch',
          description: 'The connected wallet does not control the claimed sender address.',
        });
      } else {
        setSendError(null);
        const permissionIssue = lower.includes('permission') || lower.includes('row level') || lower.includes('not authenticated');
        toast({
          variant: 'destructive',
          title: 'Failed to send message',
          description: permissionIssue
            ? 'You need to sign in and link your wallet to send messages. Go to Profile → Link Wallet.'
            : errMsg || 'Unknown error',
        });
      }
    } finally {
      setSending(false);
    }
  };

  const getSenderLabel = (senderAddress: string) => {
    if (senderAddress === buyerAddress) return 'Buyer';
    if (senderAddress === sellerAddress) return 'Seller';
    return 'Unknown';
  };

  if (!isParticipant) {
    return null;
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        Messages
      </h3>

      {!authUser && (
        <div className="mb-4 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 flex items-center justify-between">
          <div>
            <strong>Sign in to chat</strong>
            <div className="text-xs text-muted-foreground">Connect your account to send and receive messages and enable email notifications.</div>
          </div>
          <div>
            <button
              onClick={() => navigate('/auth')}
              className="ml-4 inline-flex items-center rounded-md bg-yellow-100 px-3 py-1 text-xs font-medium"
            >
              Sign in
            </button>
          </div>
        </div>
      )}

      <ScrollArea className="h-64 pr-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isOwn = msg.sender_address === userAddress;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {getSenderLabel(msg.sender_address)}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSend} className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {sendError && (
          <p className="text-xs text-destructive mt-1">{sendError}</p>
        )}
      </form>
    </div>
  );
};
