import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  MessageCircle, 
  Loader2, 
  Reply, 
  Send 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FeedbackReply {
  id: string;
  feedback_id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  userName?: string;
  userEmail?: string;
  replies?: FeedbackReply[];
}

interface FeedbackTabProps {
  feedbackList: FeedbackItem[];
  setFeedbackList: React.Dispatch<React.SetStateAction<FeedbackItem[]>>;
  fetchAllFeedback: () => Promise<void>;
  logAdminAction: (
    actionType: string,
    targetUserId: string,
    targetUserEmail: string,
    details?: Record<string, any>
  ) => Promise<void>;
}

const categoryIcons: Record<string, React.ReactNode> = {
  bug: <Bug className="h-4 w-4" />,
  feature: <Lightbulb className="h-4 w-4" />,
  general: <MessageCircle className="h-4 w-4" />,
  question: <HelpCircle className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  general: 'General Feedback',
  question: 'Question',
};

const statusColors: Record<string, string> = {
  new: 'bg-info/10 text-info border-info/30',
  reviewed: 'bg-warning/10 text-warning border-warning/30',
  in_progress: 'bg-accent/10 text-accent-foreground border-accent/30',
  resolved: 'bg-success/10 text-success border-success/30',
  closed: 'bg-muted text-muted-foreground border-border',
};

export function FeedbackTab({
  feedbackList,
  setFeedbackList,
  fetchAllFeedback,
  logAdminAction,
}: FeedbackTabProps) {
  const { toast } = useToast();
  const [updatingFeedback, setUpdatingFeedback] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    setUpdatingFeedback(feedbackId);
    try {
      const feedbackItem = feedbackList.find(fb => fb.id === feedbackId);
      const oldStatus = feedbackItem?.status || 'unknown';

      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;

      if (feedbackItem) {
        await supabase.from('user_notifications').insert({
          user_id: feedbackItem.user_id,
          type: 'feedback_status_change',
          title: 'Feedback status updated',
          message: `Your feedback "${feedbackItem.subject}" has been marked as ${newStatus.replace('_', ' ')}.`,
          reference_id: feedbackId,
          reference_type: 'feedback',
        });

        await logAdminAction(
          'feedback_status_changed',
          feedbackItem.user_id,
          feedbackItem.userEmail || 'Unknown',
          { old_status: oldStatus, new_status: newStatus, subject: feedbackItem.subject }
        );
      }

      setFeedbackList(prev => prev.map(fb => 
        fb.id === feedbackId ? { ...fb, status: newStatus } : fb
      ));

      toast({
        title: 'Status updated',
        description: `Feedback marked as ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingFeedback(null);
    }
  };

  const sendAdminReply = async (feedbackId: string, feedbackUserId: string, feedbackSubject: string) => {
    const message = replyText[feedbackId]?.trim();
    if (!message) return;

    setSendingReply(feedbackId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const feedbackItem = feedbackList.find(fb => fb.id === feedbackId);

      const { data: reply, error } = await supabase
        .from('feedback_replies')
        .insert({
          feedback_id: feedbackId,
          user_id: user.id,
          message,
          is_admin_reply: true,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('user_notifications').insert({
        user_id: feedbackUserId,
        type: 'feedback_reply',
        title: 'New reply to your feedback',
        message: `Admin replied to "${feedbackSubject}": ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        reference_id: feedbackId,
        reference_type: 'feedback',
      });

      await logAdminAction(
        'admin_reply_sent',
        feedbackUserId,
        feedbackItem?.userEmail || 'Unknown',
        { 
          feedback_subject: feedbackSubject,
          reply_preview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        }
      );

      setFeedbackList(prev => prev.map(fb => 
        fb.id === feedbackId 
          ? { ...fb, replies: [...(fb.replies || []), reply] }
          : fb
      ));

      setReplyText(prev => ({ ...prev, [feedbackId]: '' }));

      toast({
        title: 'Reply sent',
        description: 'The user will be notified of your response.',
      });
    } catch (error: any) {
      toast({
        title: 'Error sending reply',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSendingReply(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          User Feedback
        </CardTitle>
        <CardDescription>Review, manage, and reply to feedback from users</CardDescription>
      </CardHeader>
      <CardContent>
        {feedbackList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No feedback submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                {/* Main feedback card */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {categoryIcons[item.category]}
                      <span className="font-medium">{item.subject}</span>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[item.category]}
                      </Badge>
                      {(item.replies?.length ?? 0) > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {item.replies?.length} {item.replies?.length === 1 ? 'reply' : 'replies'}
                        </Badge>
                      )}
                    </div>
                    <Select
                      value={item.status}
                      onValueChange={(value) => updateFeedbackStatus(item.id, value)}
                      disabled={updatingFeedback === item.id}
                    >
                      <SelectTrigger className={`w-32 h-8 text-xs ${statusColors[item.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{item.userName}</span>
                      <span>•</span>
                      <span>{format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => setExpandedFeedback(expandedFeedback === item.id ? null : item.id)}
                    >
                      <Reply className="h-3 w-3" />
                      {expandedFeedback === item.id ? 'Hide' : 'Reply'}
                    </Button>
                  </div>
                </div>

                {/* Expanded reply section */}
                {expandedFeedback === item.id && (
                  <div className="border-t bg-muted/30 p-4 space-y-4">
                    {/* Conversation thread */}
                    {(item.replies?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <span className="text-xs font-medium text-muted-foreground">Conversation</span>
                        {item.replies?.map((reply) => (
                          <div
                            key={reply.id}
                            className={`p-3 rounded-lg text-sm ${
                              reply.is_admin_reply
                                ? 'bg-primary/10 border border-primary/20 ml-4'
                                : 'bg-background border mr-4'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${reply.is_admin_reply ? 'text-primary' : 'text-foreground'}`}>
                                {reply.is_admin_reply ? 'Admin' : item.userName}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-muted-foreground">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={replyText[item.id] || ''}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendAdminReply(item.id, item.user_id, item.subject);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => sendAdminReply(item.id, item.user_id, item.subject)}
                        disabled={sendingReply === item.id || !replyText[item.id]?.trim()}
                      >
                        {sendingReply === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Button variant="outline" className="mt-4" onClick={fetchAllFeedback}>
          Refresh Feedback
        </Button>
      </CardContent>
    </Card>
  );
}
