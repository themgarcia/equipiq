import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare, Send, CheckCircle2, Bug, Lightbulb, HelpCircle, MessageCircle, ChevronDown, Reply, Image, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FeedbackReply {
  id: string;
  feedback_id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

interface FeedbackItem {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  screenshot_url?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  replies?: FeedbackReply[];
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
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  reviewed: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  in_progress: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  resolved: 'bg-green-500/10 text-green-600 dark:text-green-400',
  closed: 'bg-muted text-muted-foreground',
};

export default function Feedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  useEffect(() => {
    fetchUserFeedback();
  }, [user]);

  const fetchUserFeedback = async () => {
    if (!user) return;
    
    try {
      const { data: feedback, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch replies for user's feedback
      const feedbackIds = feedback?.map(f => f.id) || [];
      if (feedbackIds.length > 0) {
        const { data: replies, error: repliesError } = await supabase
          .from('feedback_replies')
          .select('*')
          .in('feedback_id', feedbackIds)
          .order('created_at', { ascending: true });

        if (repliesError) throw repliesError;

        const feedbackWithReplies = feedback?.map(fb => ({
          ...fb,
          replies: replies?.filter(r => r.feedback_id === fb.id) || [],
        })) || [];

        setFeedbackList(feedbackWithReplies);
      } else {
        setFeedbackList(feedback || []);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !category || !description.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please select a category and provide a description.',
        variant: 'destructive',
      });
      return;
    }

    // Auto-generate subject from description
    const autoSubject = description.trim().substring(0, 50) + (description.length > 50 ? '...' : '');

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        category,
        subject: autoSubject,
        description: description.trim(),
      });

      if (error) throw error;

      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback! We appreciate your input.',
      });

      // Reset form and show success
      setCategory('');
      setDescription('');
      setShowSuccess(true);
      
      // Refresh the list
      fetchUserFeedback();
      
      // Hide success after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendUserReply = async (feedbackId: string) => {
    const message = replyText[feedbackId]?.trim();
    if (!message || !user) return;

    setSendingReply(feedbackId);
    try {
      const { data: reply, error } = await supabase
        .from('feedback_replies')
        .insert({
          feedback_id: feedbackId,
          user_id: user.id,
          message,
          is_admin_reply: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setFeedbackList(prev => prev.map(fb => 
        fb.id === feedbackId 
          ? { ...fb, replies: [...(fb.replies || []), reply] }
          : fb
      ));

      // Clear the reply text
      setReplyText(prev => ({ ...prev, [feedbackId]: '' }));

      toast({
        title: 'Reply sent',
        description: 'Your follow-up has been added.',
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

  const hasUnreadAdminReplies = (item: FeedbackItem) => {
    return item.replies?.some(r => r.is_admin_reply) ?? false;
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-primary" />
              Feedback
            </h1>
            <p className="text-muted-foreground mt-1">
              Help us improve equipIQ by sharing your thoughts, reporting issues, or requesting features.
            </p>
          </div>

          {/* Submit Feedback Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Feedback</CardTitle>
              <CardDescription>
                Your feedback directly shapes the future of equipIQ. We read every submission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Thank you!</h3>
                  <p className="text-muted-foreground">
                    Your feedback has been submitted. We appreciate you taking the time to help us improve.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="What type of feedback is this?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bug">
                          <div className="flex items-center gap-2">
                            <Bug className="h-4 w-4" />
                            Bug Report
                          </div>
                        </SelectItem>
                        <SelectItem value="feature">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Feature Request
                          </div>
                        </SelectItem>
                        <SelectItem value="general">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            General Feedback
                          </div>
                        </SelectItem>
                        <SelectItem value="question">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Question
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">What's on your mind? *</Label>
                    <Textarea
                      id="description"
                      placeholder="Please provide as much detail as possible..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Previous Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Your Feedback History</CardTitle>
              <CardDescription>
                Track the status of your previous submissions and continue conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFeedback ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't submitted any feedback yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbackList.map((item) => (
                    <Collapsible
                      key={item.id}
                      open={expandedFeedback === item.id}
                      onOpenChange={(open) => setExpandedFeedback(open ? item.id : null)}
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {categoryIcons[item.category]}
                              <span className="font-medium">{item.subject}</span>
                              {hasUnreadAdminReplies(item) && (
                                <Badge variant="default" className="text-xs">
                                  Admin replied
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant="outline" className={statusColors[item.status]}>
                                {item.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{categoryLabels[item.category]}</span>
                              <span>•</span>
                              <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                              {(item.replies?.length ?? 0) > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{item.replies?.length} {item.replies?.length === 1 ? 'reply' : 'replies'}</span>
                                </>
                              )}
                            </div>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                <Reply className="h-3 w-3" />
                                {expandedFeedback === item.id ? 'Hide' : 'View / Reply'}
                                <ChevronDown className={`h-3 w-3 transition-transform ${expandedFeedback === item.id ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="border-t bg-muted/30 p-4 space-y-4">
                            {/* Page context */}
                            {item.page_url && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ExternalLink className="h-3 w-3" />
                                <span>Submitted from: <code className="bg-muted px-1 rounded">{item.page_url}</code></span>
                              </div>
                            )}

                            {/* Screenshot preview */}
                            {item.screenshot_url && (
                              <div className="space-y-2">
                                <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
                                  <Image className="h-3 w-3" />
                                  Screenshot
                                </span>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button className="block w-full max-w-xs cursor-pointer hover:opacity-90 transition-opacity">
                                      <img 
                                        src={item.screenshot_url} 
                                        alt="Feedback screenshot" 
                                        className="rounded-lg border shadow-sm w-full h-24 object-cover"
                                      />
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl p-2">
                                    <img 
                                      src={item.screenshot_url} 
                                      alt="Feedback screenshot" 
                                      className="w-full h-auto rounded-lg"
                                    />
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}

                            {/* Full description */}
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-muted-foreground uppercase">Your original message</span>
                              <p className="text-sm bg-background border rounded-lg p-3">{item.description}</p>
                            </div>

                            {/* Conversation thread */}
                            {(item.replies?.length ?? 0) > 0 && (
                              <div className="space-y-3">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Conversation</span>
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
                                        {reply.is_admin_reply ? 'equipIQ Team' : 'You'}
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
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-muted-foreground uppercase">Add a follow-up</span>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Add more information or ask a question..."
                                  value={replyText[item.id] || ''}
                                  onChange={(e) => setReplyText(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      sendUserReply(item.id);
                                    }
                                  }}
                                />
                                <Button
                                  size="icon"
                                  onClick={() => sendUserReply(item.id)}
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
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
