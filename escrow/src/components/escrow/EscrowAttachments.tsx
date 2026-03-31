import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Trash2, 
  Download,
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Attachment {
  id: string;
  escrow_id: string;
  uploader_address: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface EscrowAttachmentsProps {
  escrowId: string;
  userAddress: string;
  buyerAddress: string;
  sellerAddress: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return ImageIcon;
  if (fileType.includes('pdf')) return FileText;
  return File;
};

export const EscrowAttachments: React.FC<EscrowAttachmentsProps> = ({
  escrowId,
  userAddress,
  buyerAddress,
  sellerAddress,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isParticipant = userAddress === buyerAddress || userAddress === sellerAddress;

  // Fetch attachments
  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const { data, error } = await supabase
          .from('escrow_attachments')
          .select('*')
          .eq('escrow_id', escrowId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAttachments(data || []);
      } catch (error) {
        console.error('Failed to fetch attachments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [escrowId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isParticipant) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 10MB',
      });
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const filePath = `${escrowId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('escrow-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { data, error: insertError } = await supabase
        .from('escrow_attachments')
        .insert({
          escrow_id: escrowId,
          uploader_address: userAddress,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAttachments(prev => [data, ...prev]);
      toast({
        title: 'File uploaded',
        description: file.name,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('escrow-documents')
        .download(attachment.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    setDeleting(attachment.id);
    try {
      // Delete from storage
      await supabase.storage
        .from('escrow-documents')
        .remove([attachment.file_path]);

      // Delete record
      const { error } = await supabase
        .from('escrow_attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;

      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      toast({
        title: 'File deleted',
        description: attachment.file_name,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDeleting(null);
    }
  };

  if (!isParticipant) {
    return null;
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          Documents
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No documents yet</p>
          <p className="text-xs">Upload contracts, receipts, or proofs</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.file_type);
              const isOwn = attachment.uploader_address === userAddress;

              return (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)} • {format(new Date(attachment.created_at), 'MMM d')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isOwn && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleting === attachment.id}
                          >
                            {deleting === attachment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete document?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{attachment.file_name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(attachment)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
