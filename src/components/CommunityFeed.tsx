import React, { useState, useRef, useCallback } from 'react';
import { MessageSquare, Heart, RefreshCw, CheckCircle2, Share2, Send, Dumbbell, Award, Plus, X, Copy, Check, Trash2, Smile, BarChart2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Friend, FriendPost, UserProfile, LiftRecord, FriendComment, PostPoll } from '../types/fitness';
import { loadFromStorage } from '../utils/storage';
import { getStoredTheme } from '../utils/theme';

interface ReactionItem {
  key: string;
  emoji: string;
  label: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

const PRIMARY_REACTIONS: ReactionItem[] = [
  {
    key: 'fire',
    emoji: '🔥',
    label: 'Fire',
    activeBg: 'bg-amber-500/20 dark:bg-amber-500/25',
    activeBorder: 'border-amber-500/50',
    activeText: 'text-amber-600 dark:text-amber-300',
  },
  {
    key: 'trophy',
    emoji: '🏆',
    label: 'Trophy',
    activeBg: 'bg-yellow-500/20 dark:bg-yellow-500/25',
    activeBorder: 'border-yellow-500/50',
    activeText: 'text-yellow-600 dark:text-yellow-300',
  },
  {
    key: 'muscle',
    emoji: '💪',
    label: 'Muscle Flex',
    activeBg: 'bg-emerald-500/20 dark:bg-emerald-500/25',
    activeBorder: 'border-emerald-500/50',
    activeText: 'text-emerald-600 dark:text-emerald-300',
  },
];

const ADDITIONAL_REACTIONS: { key: string; emoji: string; label: string }[] = [
  { key: 'heart', emoji: '❤️', label: 'Love' },
  { key: 'bolt', emoji: '⚡', label: 'Energy' },
  { key: 'clap', emoji: '👏', label: 'Props' },
  { key: 'target', emoji: '🎯', label: 'Hit Target' },
];

const QUICK_DISCUSSION_CHIPS = [
  'Insane PR! 🔥',
  'Clean form 💪',
  'What was your rest time?',
  'Beast mode 🏆',
  'Great pacing! ⚡',
];

const WORKOUT_POLL_PRESETS = [
  {
    label: 'Leg Split Focus',
    question: 'Squad Split: Heavy Squats vs High-Volume Leg Press?',
    category: 'workout_type' as const,
    options: ['Heavy Back Squats (3-5 reps)', 'High-Volume Hack/Leg Press (10-15 reps)'],
  },
  {
    label: 'Upper Body Pump',
    question: 'Next Upper Split: Push/Pull vs Chest & Back Superset?',
    category: 'workout_type' as const,
    options: ['Strict Push / Pull Split', 'Chest & Back Superset Pump'],
  },
  {
    label: 'Cardio Protocol',
    question: 'Which Cardio Burn do you prefer today?',
    category: 'workout_type' as const,
    options: ['20-Min HIIT Interval Sprints', '45-Min Zone 2 Incline Walk'],
  },
  {
    label: 'Next PR Goal',
    question: 'Which PR milestone should our squad hit first?',
    category: 'achievement' as const,
    options: ['100kg (225lb) Bench Press', '140kg (315lb) Back Squat', '180kg (405lb) Deadlift'],
  },
  {
    label: 'RPE Intensity',
    question: 'Rate your intensity level from today\'s workout:',
    category: 'achievement' as const,
    options: ['10/10 Max Effort & PR 🔥', '8-9/10 Heavy Volume Grind 💪', '6-7/10 Smooth Recovery ⚡'],
  },
];

export interface CommunityFeedProps {
  profile: UserProfile;
  friendPosts: FriendPost[];
  onUpdateFriendPosts: (posts: FriendPost[]) => void;
  acceptedFriends?: Friend[];
  liftRecords?: LiftRecord[];
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onRefreshFeeds?: () => Promise<void> | void;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  profile,
  friendPosts = [],
  onUpdateFriendPosts,
  acceptedFriends = [],
  liftRecords = [],
  onClose,
  onNavigateTab,
  onRefreshFeeds,
}) => {
  const [feedFilter, setFeedFilter] = useState<'my' | 'friends' | 'global'>('global');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);
  const [collapsedComments, setCollapsedComments] = useState<Record<string, boolean>>({});

  const toggleComments = (postId: string) => {
    setCollapsedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Poll Creation state
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollCategory, setPollCategory] = useState<'workout_type' | 'achievement' | 'custom'>('workout_type');

  const [isSelectingWorkout, setIsSelectingWorkout] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<{ date: string; lifts: LiftRecord[]; title: string } | null>(null);

  const workoutsByDate = React.useMemo(() => {
    const groups: Record<string, LiftRecord[]> = {};
    (liftRecords || []).forEach((rec) => {
      if (!rec.date) return;
      if (!groups[rec.date]) {
        groups[rec.date] = [];
      }
      groups[rec.date].push(rec);
    });

    return Object.entries(groups).map(([date, items]) => {
      const uniqueExercises = Array.from(new Set(items.map((i) => i.exerciseName)));
      const title = uniqueExercises.join(', ');
      return {
        date,
        lifts: items,
        title,
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [liftRecords]);

  const theme = getStoredTheme();
  const isGlass = theme.liquidGlass !== false;
  const forcedGlassStyle = {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(22, 18, 36, 0.68) 100%)',
    backdropFilter: 'blur(24px) saturate(190%)',
    WebkitBackdropFilter: 'blur(24px) saturate(190%)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.22), 0 14px 36px rgba(0, 0, 0, 0.45)',
  };

  const glassStyle = isGlass
    ? (theme.mode === 'light'
        ? {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.62) 100%)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.95), 0 12px 32px rgba(15, 23, 42, 0.08)',
          }
        : forcedGlassStyle)
    : {
        background: theme.mode === 'light' ? '#ffffff' : '#161224',
        border: theme.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        boxShadow: 'none',
      };

  const containerStyle = isGlass
    ? {
        background: theme.mode === 'light' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(10, 8, 18, 0.55)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      }
    : {
        background: theme.mode === 'light' ? '#f8fafc' : '#08080C',
      };

  const handleAddComment = (postId: string, textOverride?: string) => {
    const text = (textOverride || commentInputs[postId] || '').trim();
    if (!text) return;
    const newComment: FriendComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromName: profile.name || 'You',
      fromAvatar: profile.photoUrl || '',
      message: text,
      timestamp: 'Just now',
      userId: profile.email || 'me',
    };
    const updated = friendPosts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...(p.comments || []), newComment],
        };
      }
      return p;
    });
    onUpdateFriendPosts(updated);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    confetti({ particleCount: 20, spread: 40, colors: ['#06b6d4', '#10b981'] });
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    const updated = friendPosts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: (p.comments || []).filter((c) => c.id !== commentId),
        };
      }
      return p;
    });
    onUpdateFriendPosts(updated);
  };

  const handleToggleReaction = (postId: string, reactionType: string) => {
    const updated = friendPosts.map((p) => {
      if (p.id !== postId) return p;

      const currentReactions: Record<string, number> = {
        fire: 0,
        trophy: 0,
        muscle: 0,
        ...(p.reactions || {}),
      };

      if (!p.reactions && (p.likes || 0) > 0) {
        currentReactions.fire = p.likes;
      }

      const currentUserReactions = Array.isArray(p.userReactions)
        ? [...p.userReactions]
        : p.userLiked
        ? ['fire']
        : [];
      const hasReacted = currentUserReactions.includes(reactionType);

      let nextUserReactions: string[];
      const nextCount = Math.max(0, (currentReactions[reactionType] || 0) + (hasReacted ? -1 : 1));

      if (hasReacted) {
        nextUserReactions = currentUserReactions.filter((r) => r !== reactionType);
      } else {
        nextUserReactions = [...currentUserReactions, reactionType];
        if (reactionType === 'fire') {
          confetti({ particleCount: 25, spread: 45, colors: ['#f97316', '#ef4444', '#fbbf24'] });
        } else if (reactionType === 'trophy') {
          confetti({ particleCount: 30, spread: 50, colors: ['#fbbf24', '#f59e0b', '#d97706'] });
        } else if (reactionType === 'muscle') {
          confetti({ particleCount: 25, spread: 45, colors: ['#10b981', '#34d399', '#059669'] });
        } else {
          confetti({ particleCount: 20, spread: 40 });
        }
      }

      const updatedReactions = {
        ...currentReactions,
        [reactionType]: nextCount,
      };

      const totalLikes = Object.values(updatedReactions).reduce((sum, count) => sum + count, 0);

      return {
        ...p,
        reactions: updatedReactions,
        userReactions: nextUserReactions,
        userLiked: nextUserReactions.length > 0,
        likes: totalLikes,
      };
    });

    onUpdateFriendPosts(updated);
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [...prev, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    setPollOptions((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleApplyPollPreset = (preset: typeof WORKOUT_POLL_PRESETS[number]) => {
    setPollQuestion(preset.question);
    setPollOptions([...preset.options]);
    setPollCategory(preset.category);
  };

  const handleVotePoll = (postId: string, optionId: string) => {
    const updated = friendPosts.map((p) => {
      if (p.id !== postId || !p.poll) return p;

      const currentPoll = p.poll;
      const previousVotedOptionId = currentPoll.userVotedOptionId;
      const isUnvoting = previousVotedOptionId === optionId;

      const newOptions = currentPoll.options.map((opt) => {
        let votes = opt.votes;
        let voterNames = [...(opt.voterNames || [])];

        if (opt.id === previousVotedOptionId) {
          votes = Math.max(0, votes - 1);
          voterNames = voterNames.filter((n) => n !== (profile.name || 'You'));
        }

        if (opt.id === optionId && !isUnvoting) {
          votes += 1;
          if (!voterNames.includes(profile.name || 'You')) {
            voterNames.push(profile.name || 'You');
          }
        }

        return {
          ...opt,
          votes,
          voterNames,
        };
      });

      const totalVotes = newOptions.reduce((acc, opt) => acc + opt.votes, 0);

      return {
        ...p,
        poll: {
          ...currentPoll,
          options: newOptions,
          totalVotes,
          userVotedOptionId: isUnvoting ? undefined : optionId,
        },
      };
    });

    onUpdateFriendPosts(updated);

    confetti({
      particleCount: 25,
      spread: 45,
      colors: ['#f59e0b', '#10b981', '#06b6d4'],
    });
  };

  const handleSharePost = async (post: FriendPost) => {
    const shareText = `🏋️‍♂️ ${post.friendName}'s Workout: ${post.title}\n"${post.description}"\nShared via Overhaul Health`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: shareText,
        });
      } catch (err) {
        console.warn('Share cancelled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        const { Toast } = await import('@capacitor/toast');
        Toast.show({ text: 'Workout copied to clipboard!', duration: 'short' }).catch(() => {});
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    }
  };

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const PULL_THRESHOLD = 70;

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshSuccess(false);

    try {
      if (onRefreshFeeds) {
        await onRefreshFeeds();
      } else {
        // Reload verified real user posts without injecting any fake posts
        await new Promise((resolve) => setTimeout(resolve, 600));
        const currentUid = profile?.email ? profile.email.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'anonymous';
        const storedPosts = loadFromStorage<FriendPost[]>('friend_posts', [], currentUid);

        const FAKE_POST_IDS = ['post-community-poll-1', 'post-1', 'post-2', 'post-3'];
        const MOCK_NAMES = ['Alex Rivera', 'Liam Carter', 'Sophia Martinez', 'Sarah Jenkins', 'Coach Marcus', 'David Goggins', 'John Doe', 'Jane Miller', 'Overhaul Squad'];

        // Strict filter: NO fake posts, NO synthetic auto-lift/auto-sport bots
        const realFreshPosts = (storedPosts || []).filter(
          (p) =>
            p &&
            !FAKE_POST_IDS.includes(p.id) &&
            !p.id.startsWith('auto-lift-') &&
            !p.id.startsWith('auto-sport-') &&
            !MOCK_NAMES.some((m) => (p.friendName || '').toLowerCase().includes(m.toLowerCase()))
        );

        onUpdateFriendPosts(realFreshPosts);
      }
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (err) {
      console.warn('Feed refresh failed:', err);
    } finally {
      setIsRefreshing(false);
      setPullY(0);
    }
  }, [isRefreshing, onRefreshFeeds, onUpdateFriendPosts, profile]);

  // Touch handlers for Pull-to-Refresh: purely for pulling downwards at the very top.
  // Scrolling down through posts (diff < 0) immediately cancels pull to allow 100% fluid native scrolling.
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRefreshing) return;
    const container = scrollContainerRef.current;
    if (container && container.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null || isRefreshing) return;
    const container = scrollContainerRef.current;
    if (container && container.scrollTop > 0) {
      touchStartY.current = null;
      setPullY(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    // Scrolling down (finger moves upwards) -> disarm pull-to-refresh completely so page scrolls down naturally
    if (diff <= 0) {
      touchStartY.current = null;
      setPullY(0);
      return;
    }

    // Pulling down at the top of the feed -> rubber band animation
    const dampedPull = Math.min(diff * 0.4, 90);
    setPullY(dampedPull);
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null || isRefreshing) return;
    touchStartY.current = null;

    if (pullY >= PULL_THRESHOLD) {
      handleRefresh();
    } else {
      setPullY(0);
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    const hasValidPoll = isCreatingPoll && pollQuestion.trim().length > 0 && cleanPollOptions.length >= 2;

    const contentText = newPostContent.trim() || (hasValidPoll ? pollQuestion.trim() : '');
    if (!contentText && !hasValidPoll) return;

    const newPost: FriendPost = {
      id: `post-${Date.now()}`,
      friendId: 'me',
      friendName: profile.name || 'Athlete',
      friendAvatar:
        profile.photoUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      type: hasValidPoll && pollCategory === 'achievement' ? 'pr' : 'workout_completed',
      title: hasValidPoll
        ? (pollCategory === 'achievement' ? 'Achievement Poll' : 'Workout Split Poll')
        : (selectedWorkout ? 'Shared a Workout Template' : 'Workout Logged'),
      description: contentText,
      timeAgo: 'Just now',
      likes: 0,
      userLiked: false,
      congrats: [],
      reactions: { fire: 0, trophy: 0, muscle: 0 },
      userReactions: [],
      comments: [],
      templateLifts: selectedWorkout ? selectedWorkout.lifts : undefined,
      poll: hasValidPoll
        ? {
            id: `poll-${Date.now()}`,
            question: pollQuestion.trim(),
            options: cleanPollOptions.map((text, idx) => ({
              id: `opt-${idx + 1}-${Date.now()}`,
              text,
              votes: 0,
              voterNames: [],
            })),
            totalVotes: 0,
            category: pollCategory,
          }
        : undefined,
    };

    onUpdateFriendPosts([newPost, ...friendPosts]);
    setNewPostContent('');
    setSelectedWorkout(null);
    setIsCreatingPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleCopyTemplate = async (lifts: LiftRecord[]) => {
    const exerciseGroups: Record<string, { weight: number; reps: number }[]> = {};
    lifts.forEach((l) => {
      if (!exerciseGroups[l.exerciseName]) {
        exerciseGroups[l.exerciseName] = [];
      }
      exerciseGroups[l.exerciseName].push({ weight: l.weightKg, reps: l.reps });
    });

    const lines = ['🏋️‍♂️ OVERHAUL WORKOUT TEMPLATE', ''];
    Object.entries(exerciseGroups).forEach(([name, sets]) => {
      lines.push(`💪 ${name}:`);
      sets.forEach((s, idx) => {
        lines.push(`   Set ${idx + 1}: ${s.weight}kg × ${s.reps} reps`);
      });
      lines.push('');
    });
    lines.push('Shared via Overhaul Health');

    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      confetti({ particleCount: 30, spread: 40 });
      const { Toast } = await import('@capacitor/toast');
      Toast.show({ text: 'Workout template copied to clipboard!', duration: 'short' }).catch(() => {});
    } catch {
      console.warn('Clipboard write failed');
    }
  };

  const myName = (profile.name || 'Christian Salameh').toLowerCase();
  const friendNames = acceptedFriends.map((f) => f.name.toLowerCase());

  // Strict filter: NO fake posts, NO synthetic auto-lift/auto-sport bots, NO fake squad accounts
  const realFriendPosts = React.useMemo(() => {
    const FAKE_POST_IDS = ['post-community-poll-1', 'post-1', 'post-2', 'post-3'];
    const MOCK_NAMES = ['Alex Rivera', 'Liam Carter', 'Sophia Martinez', 'Sarah Jenkins', 'Coach Marcus', 'David Goggins', 'John Doe', 'Jane Miller', 'Overhaul Squad'];
    return (friendPosts || []).filter(
      (p) =>
        p &&
        !FAKE_POST_IDS.includes(p.id) &&
        !p.id.startsWith('auto-lift-') &&
        !p.id.startsWith('auto-sport-') &&
        !MOCK_NAMES.some((m) => (p.friendName || '').toLowerCase().includes(m.toLowerCase()))
    );
  }, [friendPosts]);

  // If any fake or synthetic posts linger in state or storage, purge them immediately
  React.useEffect(() => {
    if (realFriendPosts.length !== (friendPosts || []).length) {
      onUpdateFriendPosts(realFriendPosts);
    }
  }, [realFriendPosts, friendPosts, onUpdateFriendPosts]);

  const filteredPosts = realFriendPosts.filter((post) => {
    if (!post) return false;
    if (feedFilter === 'my') {
      return (
        post.friendId === 'me' ||
        post.friendName.toLowerCase() === myName ||
        post.friendName.toLowerCase().includes('christian')
      );
    }
    if (feedFilter === 'friends') {
      return (
        post.friendId === 'me' ||
        post.friendName.toLowerCase() === myName ||
        post.friendName.toLowerCase().includes('christian') ||
        friendNames.some((fn) => post.friendName.toLowerCase().includes(fn))
      );
    }
    return true; // global
  });

  const sortedPosts = React.useMemo(() => {
    const posts = [...filteredPosts];
    if (sortBy === 'popular') {
      return posts.sort((a, b) => {
        const likesDiff = (b.likes || 0) - (a.likes || 0);
        if (likesDiff !== 0) return likesDiff;
        return (b.comments?.length || 0) - (a.comments?.length || 0);
      });
    } else {
      // Sort newest posts first by extracted numeric timestamp, falling back to natural newest-first order
      return posts.sort((a, b) => {
        const timeA = Number(a.id.match(/\d{10,}/)?.[0] || 0);
        const timeB = Number(b.id.match(/\d{10,}/)?.[0] || 0);
        if (timeA && timeB && timeA !== timeB) {
          return timeB - timeA;
        }
        return 0;
      });
    }
  }, [filteredPosts, sortBy]);

  const emptyStateContent = {
    my: {
      title: 'No Posts Yet',
      subtext: 'Share your first workout PR or training insight above.',
    },
    friends: {
      title: 'Squad Feed Quiet',
      subtext: 'Connect with workout partners via Athlete Passcodes to see their updates.',
    },
    global: {
      title: 'No Social Posts',
      subtext: 'Be the first to share a public achievement with the Overhaul squad!',
    },
  };

  return (
    <div
      role="region"
      aria-label="Community Feed"
      data-scrollable="true"
      className={`community-feed-container relative w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden ${isGlass ? 'liquid-glass-enabled' : 'solid-flat'}`}
      style={containerStyle}
    >
      {/* Background Luminous Liquid Glass Blur Orbs */}
      {isGlass && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
          <div className="absolute top-10 right-4 w-72 h-72 rounded-full bg-emerald-500/15 blur-[90px] dark:bg-emerald-500/20" />
          <div className="absolute top-1/2 left-2 w-72 h-72 rounded-full bg-cyan-500/15 blur-[90px] dark:bg-cyan-500/20" />
          <div className="absolute bottom-12 right-1/3 w-64 h-64 rounded-full bg-indigo-500/10 blur-[80px] dark:bg-indigo-500/15" />
        </div>
      )}

      {/* Top Header Row (.community-feed-header-row) */}
      <div
        className="community-feed-header-row community-feed-top-bar community-feed-header community-feed-nav-bar max-w-3xl mx-auto w-full shrink-0 py-2 sm:py-2.5 px-4 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <h2 className="header-title text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Social Feed</span>
          </h2>
          {/* Quick manual refresh button icon */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Refresh social feed"
            aria-label="Refresh social feed"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--accent-primary,#10b981)]' : ''}`}
            />
          </button>
        </div>

        {/* Sorting Toggle and Squad Hub Switch Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-200/50 dark:bg-white/5 border border-black/5 dark:border-white/10 p-0.5 sm:p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSortBy('recent')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                sortBy === 'recent'
                  ? 'text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={{
                background: sortBy === 'recent' ? 'var(--accent-primary, #10b981)' : 'transparent',
              }}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => setSortBy('popular')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                sortBy === 'popular'
                  ? 'text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              style={{
                background: sortBy === 'popular' ? 'var(--accent-primary, #10b981)' : 'transparent',
              }}
            >
              Popular
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof onClose === 'function') {
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300/60 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Switch to Squad Hub (Passcode, Leaderboard, Requests)"
            aria-label="Switch to Squad Hub"
          >
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Squad Hub</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs: 3 Distinct Feed Filters (My Posts, Friends, Global) with Animated Dynamic Accent Pill */}
      <div className="px-4 pt-2 pb-2 sm:px-6 max-w-3xl mx-auto w-full shrink-0">
        <div
          className="feed-filter-bar glass-card grid grid-cols-3 gap-1.5 p-1.5 rounded-[20px] relative"
          style={glassStyle}
        >
          {(
            [
              { id: 'my', label: 'My Posts' },
              { id: 'friends', label: 'Friends' },
              { id: 'global', label: 'Global' },
            ] as const
          ).map((tab) => {
            const isActive = feedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFeedFilter(tab.id)}
                className={`relative py-2 px-3 rounded-[16px] text-xs transition-colors cursor-pointer text-center z-10 font-bold ${
                  isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                style={{
                  color: isActive ? '#ffffff' : undefined,
                  fontWeight: 700,
                  background: 'transparent',
                  border: 'none',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSocialTab"
                    className="feed-tab-active absolute inset-0 rounded-[16px] shadow-md -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{
                      backgroundColor: 'var(--accent-primary, #10b981)',
                      color: '#ffffff',
                      fontWeight: 700,
                      border: 'none',
                    }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pull-To-Refresh Indicator Banner */}
      <AnimatePresence>
        {(pullY > 0 || isRefreshing || refreshSuccess) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              paddingTop: pullY > 0 ? `${Math.min(pullY * 0.2, 16)}px` : '4px',
              paddingBottom: '8px',
            }}
          >
            <div
              className="glass-card flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-md"
              style={{
                background: 'rgba(22, 18, 36, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                WebkitBackdropFilter: 'blur(20px)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {refreshSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-400">Feeds Updated</span>
                </>
              ) : (
                <>
                  <RefreshCw
                    className={`w-3.5 h-3.5 transition-transform ${
                      isRefreshing ? 'animate-spin text-[var(--accent-primary,#10b981)]' : ''
                    }`}
                    style={{
                      transform: !isRefreshing ? `rotate(${pullY * 3.5}deg)` : undefined,
                    }}
                  />
                  <span className="text-[11px]">
                    {isRefreshing
                      ? 'Fetching Latest Logs...'
                      : pullY >= PULL_THRESHOLD
                      ? 'Release to Refresh'
                      : 'Pull down to refresh'}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed Content Scroll Area with Pull-to-Refresh Gesture Listeners (Optimized for fluid scrolling) */}
      <div
        ref={scrollContainerRef}
        role="region"
        aria-label="Social Feed Scroll Container"
        data-scrollable="true"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="community-feed-scroll flex-1 overflow-y-auto px-4 py-2 sm:px-6 max-w-3xl mx-auto w-full space-y-3 overscroll-y-contain pb-28 sm:pb-36"
        style={{
          transform: pullY > 0 ? `translateY(${pullY * 0.35}px)` : undefined,
          transition: pullY === 0 ? 'transform 0.25s ease-out' : 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        {/* Post Composer */}
        <div
          className="feed-post-card feed-composer-card glass-card rounded-[20px] p-3.5 sm:p-4 space-y-3 transition-shadow duration-200 hover:shadow-lg"
          style={glassStyle}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-white/10 border border-black/10 dark:border-white/20 overflow-hidden shrink-0 flex items-center justify-center text-slate-900 dark:text-white text-xs font-black">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="You" className="w-full h-full object-cover" />
              ) : (
                profile.name ? profile.name.charAt(0).toUpperCase() : 'O'
              )}
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Share an update with your squad
            </span>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-2">
            <textarea
              placeholder="Share a PR, gym achievement, or training advice..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="feed-textarea glass-card w-full rounded-2xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white h-20 outline-none resize-none placeholder:text-slate-500 dark:placeholder:text-white/60"
            />

            {/* Attached workout template details */}
            {selectedWorkout && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 text-xs font-mono">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Dumbbell className="w-3.5 h-3.5 shrink-0 animate-pulse text-cyan-400" />
                  <span className="truncate font-bold">Attached: {selectedWorkout.date} ({selectedWorkout.lifts.length} Sets)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWorkout(null)}
                  className="p-1 rounded hover:bg-cyan-500/20 text-cyan-400 cursor-pointer"
                  title="Remove workout attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Poll Creation Builder Card */}
            {isCreatingPoll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/[0.05] dark:bg-amber-500/[0.04] border border-amber-500/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 dark:text-amber-400">
                    <BarChart2 className="w-4 h-4" />
                    <span>Create Workout / Achievement Poll</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingPoll(false);
                      setPollQuestion('');
                      setPollOptions(['', '']);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Cancel poll"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Poll Presets */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block">
                    Quick Poll Ideas:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {WORKOUT_POLL_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyPollPreset(preset)}
                        className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/20 transition-all cursor-pointer active:scale-95"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Poll Question Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    Poll Question
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Which training split should we crush today?"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full bg-slate-100/90 dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Poll Options (2 to 4) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    Voting Options (2 to 4)
                  </label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-4 text-center text-[10px] font-mono text-slate-400 font-bold">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        placeholder={`Option ${idx + 1} (e.g. Heavy Back Squats)`}
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                        className="flex-1 bg-slate-100/90 dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-amber-500/50"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove option"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddPollOption}
                      className="mt-1 text-[10px] font-bold text-amber-500 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Posting as{' '}
                  <span className="text-slate-900 dark:text-white font-bold">
                    {profile.name || 'Christian'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSelectingWorkout(true)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold text-slate-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  title="Attach workout from history"
                >
                  <Plus className="w-3 h-3 text-cyan-400" />
                  <span>Attach Past Workout</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingPoll(!isCreatingPoll)}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                    isCreatingPoll
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                  title="Add workout poll"
                >
                  <BarChart2 className="w-3 h-3 text-amber-400" />
                  <span>{isCreatingPoll ? 'Poll Active' : 'Add Poll'}</span>
                </button>
              </div>
              <button
                type="submit"
                className="post-update-btn keep-white px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer font-bold"
                style={{
                  backgroundColor: 'var(--accent-primary, #10b981)',
                  color: '#ffffff',
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                {isCreatingPoll ? 'Post Poll' : 'Post Update'}
              </button>
            </div>
          </form>
        </div>

        {/* Posts List Filtered */}
        {sortedPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="feed-empty-state-card glass-card text-center py-12 space-y-3 rounded-[20px] p-6"
            style={glassStyle}
          >
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {emptyStateContent[feedFilter].title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {emptyStateContent[feedFilter].subtext}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsCreatingPoll(true);
                handleApplyPollPreset(WORKOUT_POLL_PRESETS[0]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer active:scale-95"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Create Workout Poll</span>
            </button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedPosts.map((post, index) => {
              const isUserLiked = post.userLiked;
              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min(index * 0.05, 0.3),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="feed-post-card glass-card rounded-[20px] p-3.5 sm:p-4 space-y-2.5 transition-shadow duration-200 hover:shadow-lg"
                  style={glassStyle}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-white/10 border border-black/10 dark:border-white/20 overflow-hidden shrink-0 flex items-center justify-center text-slate-900 dark:text-white text-xs font-black">
                        {post.friendAvatar ? (
                          <img
                            src={post.friendAvatar}
                            alt={post.friendName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.friendName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {post.friendName}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {post.timeAgo}
                        </span>
                      </div>
                    </div>

                    <span className="pill text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border border-emerald-500/30">
                      {post.type === 'workout_completed' ? 'Workout Log' : 'Achievement'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 dark:text-white/90 leading-relaxed pl-1">
                    {post.description}
                  </p>

                  {/* Shared Workout Template Card */}
                  {post.templateLifts && post.templateLifts.length > 0 && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-slate-900 dark:text-white/95 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Dumbbell className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Workout Template</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyTemplate(post.templateLifts || [])}
                          className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-[10px] font-black tracking-wide text-cyan-600 dark:text-cyan-400 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          title="Copy template to clipboard"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Use Template</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                        {(() => {
                          const exerciseGroups: Record<string, { weight: number; reps: number }[]> = {};
                          (post.templateLifts || []).forEach((l) => {
                            if (!exerciseGroups[l.exerciseName]) {
                              exerciseGroups[l.exerciseName] = [];
                            }
                            exerciseGroups[l.exerciseName].push({ weight: l.weightKg, reps: l.reps });
                          });

                          return Object.entries(exerciseGroups).map(([name, sets]) => (
                            <div key={name} className="p-2 rounded-xl bg-black/10 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-1">
                              <span className="font-bold text-slate-800 dark:text-white block truncate">{name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                                {sets.length} Set(s) • Average: {Math.round(sets.reduce((sum, s) => sum + s.weight, 0) / sets.length)}kg
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE WORKOUT / ACHIEVEMENT POLL COMPONENT */}
                  {post.poll && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2.5 p-3 sm:p-3.5 rounded-2xl bg-amber-500/[0.04] dark:bg-amber-500/[0.03] border border-amber-500/25 space-y-2.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-amber-500 dark:text-amber-400">
                          <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-mono uppercase tracking-wider">
                            {post.poll.category === 'achievement' ? 'Achievement Poll' : 'Workout Split Poll'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <div className="overflow-hidden inline-flex">
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={post.poll.totalVotes}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.2 }}
                                className="inline-block tabular-nums font-bold"
                              >
                                {post.poll.totalVotes}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          <span>{post.poll.totalVotes === 1 ? 'vote' : 'votes'}</span>
                          <span className="text-slate-400 dark:text-slate-600">·</span>
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={post.poll.userVotedOptionId ? 'voted' : 'unvoted'}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.18 }}
                              className={post.poll.userVotedOptionId ? 'text-emerald-500 dark:text-emerald-400 font-bold' : ''}
                            >
                              {post.poll.userVotedOptionId ? 'Voted' : 'Tap to vote'}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {post.poll.question}
                      </h4>

                      <div className="space-y-1.5 pt-0.5">
                        {(() => {
                          const totalVotes = post.poll?.totalVotes || 0;
                          const maxVotes = Math.max(...(post.poll?.options || []).map((o) => o.votes), 0);

                          return post.poll.options.map((opt) => {
                            const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                            const isVoted = post.poll?.userVotedOptionId === opt.id;
                            const isLeading = totalVotes > 0 && maxVotes > 0 && opt.votes === maxVotes;

                            return (
                              <motion.button
                                key={opt.id}
                                layout
                                type="button"
                                whileHover={{ scale: 1.008 }}
                                whileTap={{ scale: 0.985 }}
                                onClick={() => handleVotePoll(post.id, opt.id)}
                                className={`group relative w-full overflow-hidden rounded-xl border text-left transition-colors cursor-pointer p-2.5 flex items-center justify-between gap-2 ${
                                  isVoted
                                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 shadow-sm'
                                    : 'border-black/5 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.02] hover:border-black/15 dark:hover:border-white/20 text-slate-800 dark:text-slate-200'
                                }`}
                                title={isVoted ? 'Click to unvote or switch to another option' : `Vote for "${opt.text}"`}
                              >
                                {/* Background Percentage Progress Fill */}
                                <motion.div
                                  initial={false}
                                  animate={{
                                    width: `${percentage}%`,
                                    opacity: totalVotes > 0 ? 1 : 0,
                                  }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 90,
                                    damping: 18,
                                    mass: 0.8,
                                  }}
                                  className={`absolute left-0 top-0 bottom-0 pointer-events-none rounded-xl -z-0 overflow-hidden ${
                                    isVoted
                                      ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/30 to-emerald-400/35 border-r border-emerald-400/50'
                                      : isLeading && totalVotes > 0
                                      ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 border-r border-amber-400/40'
                                      : 'bg-black/5 dark:bg-white/[0.06] border-r border-black/5 dark:border-white/10'
                                  }`}
                                >
                                  {isVoted && (
                                    <motion.div
                                      initial={{ x: '-100%' }}
                                      animate={{ x: '200%' }}
                                      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                                      className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12"
                                    />
                                  )}
                                </motion.div>

                                {/* Option Text & Checkmark */}
                                <div className="relative z-10 flex items-center gap-2 min-w-0 flex-1">
                                  <motion.div
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                      isVoted
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-slate-400/40 dark:border-white/30 group-hover:border-slate-400 dark:group-hover:border-white/60'
                                    }`}
                                    animate={isVoted ? { scale: [0.85, 1.2, 1] } : { scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                  >
                                    <AnimatePresence>
                                      {isVoted && (
                                        <motion.div
                                          initial={{ scale: 0, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          exit={{ scale: 0, opacity: 0 }}
                                          transition={{ type: 'spring', stiffness: 600, damping: 25 }}
                                        >
                                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </motion.div>

                                  <span className={`text-xs block truncate ${isVoted ? 'font-bold' : 'font-medium'}`}>
                                    {opt.text}
                                  </span>

                                  {isLeading && (
                                    <motion.span
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.2 }}
                                      className="text-[9px] font-mono font-bold text-amber-500 dark:text-amber-400 shrink-0 uppercase tracking-wider px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
                                      title="Top voted option"
                                    >
                                      Top
                                    </motion.span>
                                  )}
                                </div>

                                {/* Percentage & Vote Count with number transitions */}
                                <div className="relative z-10 flex items-center gap-1.5 shrink-0 text-right font-mono">
                                  <div className="overflow-hidden h-4 flex items-center justify-end">
                                    <AnimatePresence mode="popLayout" initial={false}>
                                      <motion.span
                                        key={percentage}
                                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                        transition={{ duration: 0.22, ease: 'easeOut' }}
                                        className={`text-xs font-bold tabular-nums block ${
                                          isVoted ? 'text-emerald-600 dark:text-emerald-400' : isLeading ? 'text-amber-600 dark:text-amber-400' : ''
                                        }`}
                                      >
                                        {percentage}%
                                      </motion.span>
                                    </AnimatePresence>
                                  </div>
                                  <div className="overflow-hidden h-3.5 flex items-center justify-end">
                                    <AnimatePresence mode="popLayout" initial={false}>
                                      <motion.span
                                        key={opt.votes}
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 4 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        className="text-[10px] text-slate-500 dark:text-slate-400 block tabular-nums"
                                      >
                                        ({opt.votes})
                                      </motion.span>
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          });
                        })()}
                      </div>

                      <AnimatePresence>
                        {post.poll.userVotedOptionId && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -3 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -3 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-1 overflow-hidden"
                          >
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                              >
                                ✓
                              </motion.span>
                              <span>Your vote is recorded</span>
                            </span>
                            <span className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer">
                              Tap any option to switch
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* INTERACTIVE REACTION & LIKE BAR (Fire 🔥, Trophy 🏆, Muscle Flex 💪) */}
                  <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {PRIMARY_REACTIONS.map(({ key, emoji, label, activeBg, activeBorder, activeText }) => {
                        const reactionsMap = post.reactions || {};
                        // Backwards compatibility with post.likes if reactions not set
                        const count = reactionsMap[key] ?? (key === 'fire' ? (post.likes || 0) : 0);
                        const userReactions = Array.isArray(post.userReactions)
                          ? post.userReactions
                          : post.userLiked && key === 'fire'
                          ? ['fire']
                          : [];
                        const isReacted = userReactions.includes(key);

                        return (
                          <motion.button
                            key={key}
                            type="button"
                            whileTap={{ scale: 0.88 }}
                            onClick={() => handleToggleReaction(post.id, key)}
                            className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isReacted
                                ? `${activeBg} ${activeBorder} ${activeText} border shadow-sm`
                                : 'bg-black/5 dark:bg-white/5 border border-transparent hover:border-black/10 dark:hover:border-white/15 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title={`React with ${label}`}
                            aria-label={`React with ${label}`}
                            aria-pressed={isReacted}
                          >
                            <motion.span
                              className="text-sm select-none"
                              animate={isReacted ? { scale: [1, 1.4, 1], rotate: [0, -12, 12, 0] } : { scale: 1 }}
                              transition={{ type: 'spring', damping: 12, stiffness: 260 }}
                            >
                              {emoji}
                            </motion.span>
                            {count > 0 && (
                              <span className="font-mono text-[11px] font-bold tabular-nums">
                                {count}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}

                      {/* Display any additional reactions if they have counts > 0 */}
                      {ADDITIONAL_REACTIONS.filter((r) => (post.reactions?.[r.key] || 0) > 0).map(({ key, emoji, label }) => {
                        const count = post.reactions?.[key] || 0;
                        const isReacted = (post.userReactions || []).includes(key);
                        return (
                          <motion.button
                            key={key}
                            type="button"
                            whileTap={{ scale: 0.88 }}
                            onClick={() => handleToggleReaction(post.id, key)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isReacted
                                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                                : 'bg-black/5 dark:bg-white/5 border border-transparent hover:border-white/10 text-slate-300'
                            }`}
                            title={label}
                          >
                            <span className="text-xs">{emoji}</span>
                            <span className="font-mono text-[10px] font-bold">{count}</span>
                          </motion.button>
                        );
                      })}

                      {/* Extra Reaction Picker Toggle (+) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveReactionPickerId(activeReactionPickerId === post.id ? null : post.id)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            activeReactionPickerId === post.id
                              ? 'bg-[var(--accent-primary,#10b981)] text-white'
                              : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="More reactions"
                          aria-label="Add extra reaction"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>

                        <AnimatePresence>
                          {activeReactionPickerId === post.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.85, y: 6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.85, y: 6 }}
                              transition={{ duration: 0.15 }}
                              className="absolute bottom-full left-0 mb-2 z-30 flex items-center gap-1 p-1.5 rounded-2xl shadow-2xl backdrop-blur-2xl bg-slate-900/95 dark:bg-black/95 border border-white/20"
                            >
                              {ADDITIONAL_REACTIONS.map(({ key, emoji, label }) => {
                                const isReacted = (post.userReactions || []).includes(key);
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                      handleToggleReaction(post.id, key);
                                      setActiveReactionPickerId(null);
                                    }}
                                    className={`p-1.5 rounded-xl hover:scale-125 transition-transform text-sm cursor-pointer ${
                                      isReacted ? 'bg-white/20' : 'hover:bg-white/10'
                                    }`}
                                    title={label}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Comment section toggle button */}
                      <button
                        type="button"
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          (post.comments?.length || 0) > 0
                            ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                        title="Toggle workout discussion"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-mono text-[11px] font-bold">
                          {post.comments?.length || 0}
                        </span>
                        <span className="text-[11px] hidden sm:inline">Discuss</span>
                      </button>

                      {/* Share workout button */}
                      <button
                        type="button"
                        onClick={() => handleSharePost(post)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer active:scale-95"
                        title="Share workout summary"
                        aria-label="Share workout summary"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* RICH COMMENT & WORKOUT DISCUSSION SECTION */}
                  <div className="pt-2.5 border-t border-black/5 dark:border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                        <MessageSquare className="w-3 h-3 text-cyan-400" />
                        <span>Workout Discussion ({post.comments?.length || 0})</span>
                      </div>
                      {(post.comments?.length || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleComments(post.id)}
                          className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline font-mono cursor-pointer"
                        >
                          {collapsedComments[post.id] ? 'Expand Discussion ▼' : 'Collapse ▲'}
                        </button>
                      )}
                    </div>

                    {!collapsedComments[post.id] && (
                      <div className="space-y-2.5">
                        {/* Comments List */}
                        {post.comments && post.comments.length > 0 ? (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {post.comments.map((cmt) => {
                              const isMe =
                                cmt.fromName === (profile.name || 'Christian') ||
                                cmt.userId === profile.email ||
                                cmt.fromName === 'You';
                              const isAuthor = cmt.fromName === post.friendName;

                              return (
                                <motion.div
                                  key={cmt.id}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="group relative text-xs flex gap-2.5 bg-slate-100/60 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl p-2.5 transition-all hover:border-black/10 dark:hover:border-white/10"
                                >
                                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 shrink-0 overflow-hidden flex items-center justify-center font-bold text-[10px] text-slate-800 dark:text-white">
                                    {cmt.fromAvatar ? (
                                      <img src={cmt.fromAvatar} alt={cmt.fromName} className="w-full h-full object-cover" />
                                    ) : (
                                      cmt.fromName.charAt(0).toUpperCase()
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                                          {cmt.fromName}
                                        </span>
                                        {isAuthor && (
                                          <span className="text-[9px] font-mono text-cyan-500 dark:text-cyan-400 font-bold uppercase">
                                            Author
                                          </span>
                                        )}
                                        {isMe && !isAuthor && (
                                          <span className="text-[9px] font-mono text-emerald-500 dark:text-emerald-400 font-bold uppercase">
                                            You
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {cmt.timestamp}
                                        </span>
                                        {isMe && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteComment(post.id, cmt.id)}
                                            className="opacity-60 hover:opacity-100 hover:text-rose-400 text-slate-400 p-0.5 transition-opacity cursor-pointer"
                                            title="Delete comment"
                                            aria-label="Delete comment"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-200/95 leading-relaxed text-xs break-words">
                                      {cmt.message}
                                    </p>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-2.5 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-dashed border-black/10 dark:border-white/10 text-center">
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              No comments yet. Start the workout discussion with your squad!
                            </p>
                          </div>
                        )}

                        {/* Quick Fitness Discussion Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
                          {QUICK_DISCUSSION_CHIPS.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                setCommentInputs((prev) => ({ ...prev, [post.id]: chip }));
                              }}
                              className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/10 border border-black/5 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer active:scale-95"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>

                        {/* Comment Input Composer */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddComment(post.id);
                          }}
                          className="flex items-center gap-2 pt-0.5"
                        >
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/10 border border-black/10 dark:border-white/15 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-black text-slate-900 dark:text-white">
                            {profile.photoUrl ? (
                              <img src={profile.photoUrl} alt="You" className="w-full h-full object-cover" />
                            ) : (
                              (profile.name || 'A').charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="flex-1 relative flex items-center">
                            <input
                              type="text"
                              placeholder="Discuss workout, reps, form, or celebrate PR..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              className="w-full bg-slate-100/90 dark:bg-black/30 border border-black/10 dark:border-white/15 rounded-xl pl-3 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                            />
                            <button
                              type="submit"
                              disabled={!(commentInputs[post.id] || '').trim()}
                              className="absolute right-1.5 p-1 rounded-lg bg-[var(--accent-primary,#10b981)] text-white hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer active:scale-95"
                              title="Post comment"
                              aria-label="Post comment"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {sortedPosts.length > 0 && (
          <div className="pt-4 pb-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            <p className="font-bold text-slate-500 dark:text-slate-400">You're all caught up</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Real athlete activity • No fake posts</span>
          </div>
        )}
      </div>

      {/* SELECT WORKOUT MODAL FOR TEMPLATE SHARING */}
      {isSelectingWorkout && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsSelectingWorkout(false)}
        >
          <div
            className="glass-card rounded-[24px] max-w-md w-full p-4 sm:p-5 space-y-4 text-slate-900 dark:text-white"
            style={glassStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base sm:text-lg font-black tracking-tight">Select Workout from History</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectingWorkout(false)}
                className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {workoutsByDate.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-bold text-slate-400">No past workouts found.</p>
                  <p>Log some workout sessions first to share them!</p>
                </div>
              ) : (
                workoutsByDate.map((session) => (
                  <div
                    key={session.date}
                    className="p-3 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono block">{session.date}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{session.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">{session.lifts.length} Sets Logged</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkout(session);
                        setIsSelectingWorkout(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-400 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSelectingWorkout(false)}
              className="w-full py-2.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
