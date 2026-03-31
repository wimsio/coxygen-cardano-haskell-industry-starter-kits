import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy, Check, QrCode, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface EscrowQRShareProps {
  escrowId: string;
  amount: number;
  status: string;
}

export const EscrowQRShare: React.FC<EscrowQRShareProps> = ({
  escrowId,
  amount,
  status,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const escrowUrl = `${window.location.origin}/escrow/${escrowId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(escrowUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Escrow link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Escrow: ${amount.toLocaleString()} ₳`,
          text: `View this escrow contract on Cardano`,
          url: escrowUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Share Escrow
          </DialogTitle>
          <DialogDescription>
            Share this escrow contract with the counterparty
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {/* QR Code */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-white rounded-xl mb-4"
          >
            <QRCodeSVG
              value={escrowUrl}
              size={180}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </motion.div>

          {/* Escrow Info */}
          <div className="text-center mb-4">
            <p className="text-2xl font-bold gradient-text mb-1">
              {amount.toLocaleString()} ₳
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              Status: {status}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col w-full gap-2">
            <Button onClick={handleCopy} variant="outline" className="w-full gap-2">
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>

            <Button onClick={handleShare} className="w-full btn-gradient gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>

            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={() => window.open(escrowUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </div>

        {/* URL Display */}
        <div className="p-3 rounded-lg bg-muted/30 text-xs font-mono text-muted-foreground break-all">
          {escrowUrl}
        </div>
      </DialogContent>
    </Dialog>
  );
};
