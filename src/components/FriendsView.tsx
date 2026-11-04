import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  QrCode, 
  Copy, 
  Check, 
  Trophy, 
  Flame, 
  MessageSquare, 
  ShieldCheck, 
  X, 
  Contact, 
  Crown, 
  Smartphone, 
  Globe,
  Calendar,
  ArrowLeft,
  Heart,
  Send,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Friend, FriendPost, UserProfile, LiftRecord, SportActivity, DailyStepLog } from '../types/fitness';
import { AIWorkoutAnalysisResult } from '../types/aiWorkout';
import { t } from '../utils/i18n';
import { generateUserPasscode, getAndUpdateDailyStreak } from '../utils/streak';
import { calculateAge, calculateBMI, calculateBodyComposition, calculateBPL } from '../utils/calculations';
import { CommunityFeed } from './CommunityFeed';
import { StreakModal } from './StreakModal';

interface FriendsViewProps {
  profile: UserProfile;
  friends: Friend[];
  onUpdateFriends: (friends: Friend[]) => void;
  friendPosts: FriendPost[];
  onUpdateFriendPosts: (posts: FriendPost[]) => void;
  liftRecords?: LiftRecord[];
  sportsHistory?: SportActivity[];
  stepsHistory?: DailyStepLog[];
  aiWorkoutAnalysis?: AIWorkoutAnalysisResult | null;
  onModalStateChange?: (isOpen: boolean) => void;
  onNavigateTab?: (tab: string) => void;
  language?: string;
}

const DISCOVERED_CONTACTS: Array<{
  name: string;
  phone: string;
  bplScore: number;
  streak: number;
  avatar: string;
  bench1RM: number;
  squat1RM: number;
  deadlift1RM: number;
  friendCode: string;
}> = [];

export const FriendsView: React.FC<FriendsViewProps> = ({
  profile,
  friends,
  onUpdateFriends,
  friendPosts,
  onUpdateFriendPosts,
  liftRecords = [],
  sportsHistory = [],
  stepsHistory = [],
  aiWorkoutAnalysis,
  onModalStateChange,
  onNavigateTab,
  language = 'en',
}) => {
  const [activeModal, setActiveModal] = useState<'requests' | 'add-code' | 'leaderboard' | 'my-code' | 'streaks' | null>(null);
  const [socialTab, setSocialTab] = useState<'hub' | 'feed'>('hub');
  const [feedFilter, setFeedFilter] = useState<'my' | 'friends' | 'global'>('global');

  React.useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(Boolean(activeModal));
    }
    return () => {
      if (onModalStateChange) {
        onModalStateChange(false);
      }
    };
  }, [activeModal, onModalStateChange]);
  const [podiumTab, setPodiumTab] = useState<'friends' | 'global'>('friends');
  const [requestsTab, setRequestsTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputFriendCode, setInputFriendCode] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // Device Contacts Sync State
  const [isSyncingContacts, setIsSyncingContacts] = useState(false);
  const [contactsSynced, setContactsSynced] = useState(false);
  const [addedContactCodes, setAddedContactCodes] = useState<string[]>([]);

  // Enforce default collapsed state on tab switch / mount
  React.useEffect(() => {
    setActiveModal(null);
    setSocialTab('hub');
  }, []);

  const MOCK_NAMES = [
    'Alex Rivera',
    'Liam Carter',
    'Sophia Martinez',
    'Sarah Jenkins',
    'Coach Marcus',
    'David Goggins',
    'John Doe',
    'Jane Miller'
  ];

  // Absolute purge of mock athletes AND raw unverified phonebook contact auto-fills from active state
  React.useEffect(() => {
    const hasInvalid = friends.some(
      (f) =>
        MOCK_NAMES.some((mockName) => f.name.toLowerCase().includes(mockName.toLowerCase())) ||
        ['ATHLETE-A3', 'ATHLETE-L1', 'ATHLETE-S2'].includes(f.friendCode) ||
        f.id.startsWith('friend-contact-') ||
        f.recentWorkout === 'Matched via Address Book'
    );
    if (hasInvalid) {
      onUpdateFriends(
        friends.filter(
          (f) =>
            !MOCK_NAMES.some((mockName) => f.name.toLowerCase().includes(mockName.toLowerCase())) &&
            !['ATHLETE-A3', 'ATHLETE-L1', 'ATHLETE-S2'].includes(f.friendCode) &&
            !f.id.startsWith('friend-contact-') &&
            f.recentWorkout !== 'Matched via Address Book'
        )
      );
    }
  }, [friends, onUpdateFriends]);

  const acceptedFriends = friends.filter(
    (f) =>
      f.status === 'accepted' &&
      !f.id.startsWith('friend-contact-') &&
      f.recentWorkout !== 'Matched via Address Book'
  );
  const incomingRequests = friends.filter((f) => f.status === 'pending_incoming');
  const outgoingRequests = friends.filter((f) => f.status === 'pending_outgoing');

  const myAthleteCode = generateUserPasscode(profile.name, profile.familyName, profile.personalFriendCode);
  const streakInfo = getAndUpdateDailyStreak();

  // Compute current user's real BPL score
  const getBest1RM = (exerciseId: string) => {
    const records = liftRecords.filter((r) => r.exerciseId === exerciseId);
    return records.reduce((max, r) => (r.calculated1RM > max ? r.calculated1RM : max), 0);
  };
  const myBench1RM = getBest1RM('bench-press');
  const mySquat1RM = getBest1RM('back-squat');
  const myDeadlift1RM = getBest1RM('deadlift');
  const weeklyStepsAvg = Math.round(
    stepsHistory.reduce((sum, s) => sum + s.steps, 0) / Math.max(1, stepsHistory.length)
  );
  const weeklyCardioMinutes = sportsHistory.reduce((sum, s) => sum + s.durationMinutes, 0);
  const bigThreeTotalKg = myBench1RM + mySquat1RM + myDeadlift1RM;
  const strengthRatio =
    profile.weightKg > 0 && bigThreeTotalKg > 0
      ? Number((bigThreeTotalKg / profile.weightKg).toFixed(2))
      : 0;
  const ageYears = calculateAge(profile.birthDate).years;
  const bmiVal = calculateBMI(profile.weightKg, profile.heightCm).bmi;
  const bodyFatVal = calculateBodyComposition(profile.weightKg, profile.heightCm, ageYears, profile.gender).bodyFatPct;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const recentSessionDates = new Set([
    ...liftRecords.filter((l) => l.date >= sevenDaysAgoStr).map((l) => l.date),
    ...sportsHistory.filter((s) => s.date >= sevenDaysAgoStr).map((s) => s.date),
  ]);
  const loggedSessionsThisWeek =
    recentSessionDates.size > 0
      ? recentSessionDates.size
      : liftRecords.length + sportsHistory.length > 0
      ? Math.min(5, liftRecords.length + sportsHistory.length)
      : 0;
  const myBplData = calculateBPL(
    strengthRatio,
    weeklyStepsAvg,
    weeklyCardioMinutes,
    bmiVal,
    bodyFatVal,
    loggedSessionsThisWeek,
    5
  );
  const myBplScore = myBplData.score;

  // Build verified Leaderboard entries: Current user + verified mutual passcode friends only
  const myLeaderboardEntry: Friend & { isMe?: boolean } = {
    id: 'current-user-me',
    name: profile.name ? `${profile.name}${profile.familyName ? ' ' + profile.familyName : ''}` : 'You',
    friendCode: myAthleteCode,
    status: 'accepted',
    streak: streakInfo.currentStreak,
    bplScore: myBplScore,
    avatar: profile.photoUrl || '',
    bench1RM: myBench1RM,
    squat1RM: mySquat1RM,
    deadlift1RM: myDeadlift1RM,
    lastActive: 'Online Now',
    recentWorkout: 'Active Athlete',
    overviewSnippet: `${myBplData.tier} · ${streakInfo.currentStreak}d Streak`,
    sleepHours: 8.0,
    isMe: true,
  };

  // Strictly real verified athletes sorted by BPL Score descending
  const sortedRealAthletes = [...acceptedFriends].sort((a, b) => (b.bplScore || 0) - (a.bplScore || 0));
  const combinedLeaderboard = [myLeaderboardEntry, ...acceptedFriends].sort(
    (a, b) => (b.bplScore || 0) - (a.bplScore || 0)
  );
  const myRank = Math.max(1, combinedLeaderboard.findIndex((a) => (a as any).isMe) + 1);
  const realTop3 = combinedLeaderboard.slice(0, 3);
  const realRest = combinedLeaderboard.slice(3);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(myAthleteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAcceptRequest = (id: string) => {
    const updated = friends.map((f) => (f.id === id ? { ...f, status: 'accepted' as const } : f));
    onUpdateFriends(updated);
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleDeclineRequest = (id: string) => {
    const updated = friends.filter((f) => f.id !== id);
    onUpdateFriends(updated);
  };

  const handleCancelOutgoingRequest = (id: string) => {
    const updated = friends.filter((f) => f.id !== id);
    onUpdateFriends(updated);
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputFriendCode.trim()) return;

    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      name: `Athlete (${inputFriendCode.toUpperCase()})`,
      friendCode: inputFriendCode.toUpperCase(),
      status: 'pending_outgoing',
      streak: 1,
      bplScore: 75,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bench1RM: 90,
      squat1RM: 130,
      deadlift1RM: 160,
      lastActive: 'Today',
      recentWorkout: 'Bench Press',
      overviewSnippet: 'Active training',
      sleepHours: 7.5,
    };

    onUpdateFriends([...friends, newFriend]);
    setInputFriendCode('');
    setActiveModal(null);
    confetti({ particleCount: 30, spread: 40 });
  };

  // Contacts Sync Handler - Strictly mutual passcode verification only (never auto-adds raw phonebook entries)
  const handleSyncContacts = async () => {
    setIsSyncingContacts(true);
    try {
      const mutualPasscodes = friends
        .filter((f) => f.status === 'pending_incoming' || f.status === 'accepted')
        .map((f) => f.friendCode);
      const { fetchDeviceContacts } = await import('../utils/contacts');
      const deviceContacts = await fetchDeviceContacts(mutualPasscodes);
      
      const cleanList = friends.filter(
        (f) =>
          f &&
          !MOCK_NAMES.some((mockName) => f.name.toLowerCase().includes(mockName.toLowerCase())) &&
          !['ATHLETE-A3', 'ATHLETE-L1', 'ATHLETE-S2'].includes(f.friendCode) &&
          !f.id.startsWith('friend-contact-') &&
          f.recentWorkout !== 'Matched via Address Book'
      );

      // Only match contacts that have a verified mutual friend passcode match
      const registeredMatches = deviceContacts.filter(
        (c) => c.isRegisteredUser && c.friendCode && mutualPasscodes.includes(c.friendCode)
      );

      onUpdateFriends(cleanList);
      setContactsSynced(true);

      const { Toast } = await import('@capacitor/toast');
      try {
        await Toast.show({
          text:
            registeredMatches.length > 0
              ? `Verified ${registeredMatches.length} mutual Overhaul passcode match!`
              : 'No mutual Overhaul passcodes found in contacts. Share your Passcode to link!',
          duration: 'short',
        });
      } catch {}
    } catch (err) {
      console.warn('Contacts sync non-fatal:', err);
      setContactsSynced(true);
    } finally {
      setIsSyncingContacts(false);
    }
  };

  const handleAddDiscoveredContact = (contact: typeof DISCOVERED_CONTACTS[0]) => {
    if (friends.some((f) => f.friendCode === contact.friendCode)) return;

    const newFriend: Friend = {
      id: `friend-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: contact.name,
      friendCode: contact.friendCode,
      status: 'accepted',
      streak: contact.streak,
      bplScore: contact.bplScore,
      avatar: contact.avatar,
      bench1RM: contact.bench1RM,
      squat1RM: contact.squat1RM,
      deadlift1RM: contact.deadlift1RM,
      lastActive: 'Today',
      recentWorkout: 'Heavy Lift Session',
      overviewSnippet: 'Cross-referenced via device address book',
      sleepHours: 7.8,
    };

    onUpdateFriends([...friends, newFriend]);
    setAddedContactCodes((prev) => [...prev, contact.friendCode]);
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: FriendPost = {
      id: `post-${Date.now()}`,
      friendId: 'me',
      friendName: profile.name || 'Athlete',
      friendAvatar: profile.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      type: 'workout_completed',
      title: 'Workout Logged',
      description: newPostContent.trim(),
      timeAgo: 'Just now',
      likes: 0,
      userLiked: false,
      congrats: [],
      reactions: { fire: 0, trophy: 0, muscle: 0 },
      userReactions: [],
      comments: [],
    };

    onUpdateFriendPosts([newPost, ...friendPosts]);
    setNewPostContent('');
    confetti({ particleCount: 40, spread: 50 });
  };

  // ==========================================
  // REAL-TIME CALENDAR STREAKS & 2-DAY SPLIT SYNC
  // ==========================================
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const mondayOffset = (dayOfWeek + 6) % 7; // Monday = 0, Tuesday = 1 ... Sunday = 6
  
  const mondayDate = new Date(now);
  mondayDate.setDate(now.getDate() - mondayOffset);
  mondayDate.setHours(0, 0, 0, 0);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Custom 2-Day Split definitions
  const parsedDays = aiWorkoutAnalysis?.parsedDays || [];
  const day1Title = parsedDays[0]?.focus || parsedDays[0]?.dayTitle || 'Upper / Push';
  const day2Title = parsedDays[1]?.focus || parsedDays[1]?.dayTitle || 'Lower / Pull';

  // 2-day alternating split schedule mapped across Mon-Sun
  const defaultSplitSchedule = [
    { dayAbbr: 'Mon', scheduledName: day1Title.split(':')[0].replace(/Day\s*\d+\s*-?\s*/i, '').trim() || 'Push' },
    { dayAbbr: 'Tue', scheduledName: day2Title.split(':')[0].replace(/Day\s*\d+\s*-?\s*/i, '').trim() || 'Pull' },
    { dayAbbr: 'Wed', scheduledName: 'Recovery' },
    { dayAbbr: 'Thu', scheduledName: day1Title.split(':')[0].replace(/Day\s*\d+\s*-?\s*/i, '').trim() || 'Upper' },
    { dayAbbr: 'Fri', scheduledName: day2Title.split(':')[0].replace(/Day\s*\d+\s*-?\s*/i, '').trim() || 'Legs' },
    { dayAbbr: 'Sat', scheduledName: 'Sports' },
    { dayAbbr: 'Sun', scheduledName: 'Rest' },
  ];

  const weekDaysActivity = dayNames.map((abbr, i) => {
    const curDate = new Date(mondayDate);
    curDate.setDate(mondayDate.getDate() + i);
    const dateStr = curDate.toISOString().split('T')[0];
    const isToday = curDate.toDateString() === now.toDateString();
    const isPast = curDate < now && !isToday;

    // Check if user logged a lift or sport or hit steps on this date
    const dayLifts = liftRecords.filter((l) => l.date === dateStr);
    const daySports = sportsHistory.filter((s) => s.date === dateStr);
    const dayStepLog = stepsHistory.find((st) => st.date === dateStr);
    const hasStepsHit = dayStepLog && dayStepLog.steps >= (profile.stepGoal || 8000);

    const hasWorkoutLogged = dayLifts.length > 0 || daySports.length > 0;
    const isRestDay = abbr === 'Wed' || abbr === 'Sun';

    let status: 'done' | 'today' | 'rest' | 'future' = 'future';
    let label = defaultSplitSchedule[i].scheduledName;

    if (hasWorkoutLogged) {
      status = 'done';
      if (dayLifts.length > 0) {
        label = dayLifts[0].exerciseName.split(' ')[0];
      } else if (daySports.length > 0) {
        label = daySports[0].title.split(' ')[0] || 'Sport';
      }
    } else if (isToday) {
      status = 'today';
      label = defaultSplitSchedule[i].scheduledName;
    } else if (isPast) {
      if (isRestDay || hasStepsHit) {
        status = 'rest';
        label = isRestDay ? 'Safeguard' : 'Active';
      } else {
        status = 'done';
        label = defaultSplitSchedule[i].scheduledName;
      }
    } else {
      status = 'future';
      label = defaultSplitSchedule[i].scheduledName;
    }

    return {
      day: abbr,
      dateStr,
      dateNum: curDate.getDate(),
      isToday,
      status,
      label,
    };
  });

  const targetsHitThisWeek = weekDaysActivity.filter((d) => d.status === 'done' || (d.status === 'today' && liftRecords.some(l => l.date === d.dateStr)) || d.status === 'rest').length;

  if (socialTab === 'feed') {
    return (
      <div className="relative w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden">
        <CommunityFeed
          profile={profile}
          friendPosts={friendPosts}
          onUpdateFriendPosts={onUpdateFriendPosts}
          acceptedFriends={acceptedFriends}
          liftRecords={liftRecords}
          onClose={() => setSocialTab('hub')}
          onNavigateTab={onNavigateTab}
        />
      </div>
    );
  }

  return (
    <div
      className="page-container social-page h-full max-h-full flex-1 min-h-0 overflow-hidden flex flex-col justify-start p-1.5 sm:p-2.5 pb-1 max-w-7xl mx-auto w-full select-none"
      style={{
        justifyContent: 'flex-start',
        gap: '0px',
      }}
    >
      {/* 1. TOP HEADER & COMMUNITY METADATA BAR (Compact) */}
      <div
        className="social-banner card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shrink-0"
        style={{ marginBottom: '8px' }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="pill w-8 h-8 rounded-xl flex items-center justify-center text-violet-500 dark:text-violet-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-inherit tracking-tight">{t('social.hub', language)}</h2>
              <span className="pill text-[10px] font-mono px-1.5 py-0.5 rounded-lg text-violet-600 dark:text-violet-300 font-bold uppercase">
                {acceptedFriends.length} Athletes
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5 break-words">
              Your Passcode: <span className="text-inherit font-mono font-bold">{myAthleteCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSocialTab('feed')}
            className="pill px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all text-white shadow-sm"
            style={{ backgroundColor: 'var(--accent-primary, #10b981)' }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Social Feed</span>
          </button>
          <button
            type="button"
            onClick={handleCopyCode}
            className="pill px-2.5 py-1.5 rounded-xl text-inherit text-[11px] font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 6-WIDGET BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[6px] shrink-0">
        {/* WIDGET 1: Athlete Share Code & QR */}
        <div
          onClick={() => setActiveModal('my-code')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span>Passcode</span>
            <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="my-1 flex flex-col items-center justify-center text-center gap-1">
            <span className="text-xs sm:text-sm font-black font-mono text-inherit tracking-wide break-all leading-tight">
              {myAthleteCode}
            </span>
            <span className="pill text-[10px] font-mono text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full inline-block">
              1-Tap Share
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Invite</span>
            <span className="text-amber-400 font-bold">QR & Share →</span>
          </div>
        </div>

        {/* WIDGET 2: Pending Requests & Approvals */}
        <div
          onClick={() => setActiveModal('requests')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 font-bold uppercase">
            <span>Friend Requests</span>
            <UserPlus className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          </div>
          <div className="my-1 flex flex-col items-center justify-center text-center gap-0.5">
            <div className="text-lg sm:text-xl font-black font-mono text-inherit tabular-nums leading-tight">
              {incomingRequests.length + outgoingRequests.length}
            </div>
            <span className="text-[10px] font-mono text-slate-300 leading-snug">
              {incomingRequests.length + outgoingRequests.length === 0
                ? 'No Pending Requests'
                : `${incomingRequests.length} In · ${outgoingRequests.length} Out`}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Approvals</span>
            <span className="text-rose-400 font-bold">Manage →</span>
          </div>
        </div>

        {/* WIDGET 3: Leaderboard (Shows user's own avatar, current rank, BPL score, and streak) */}
        <div
          onClick={() => setActiveModal('leaderboard')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-violet-400 font-bold uppercase">
            <span>Leaderboard</span>
            <Trophy className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          </div>
          <div className="my-1 flex items-center gap-2">
            {/* User's own avatar */}
            <div className="p-[1.5px] rounded-full ig-story-ring shrink-0 shadow-sm">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.name || 'You'}
                  className="w-8 h-8 rounded-full object-cover bg-slate-900"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'O'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black font-mono text-inherit leading-tight">
                  #{myRank}
                </span>
                <span className="pill text-[9px] font-mono text-violet-600 dark:text-violet-300 px-1.5 py-0.5 rounded-full font-bold">
                  BPL {myBplScore}
                </span>
              </div>
              <div className="text-[10px] font-mono text-amber-400 font-bold mt-0.5 flex items-center gap-1">
                <span>⚡ {streakInfo.currentStreak}d Streak</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>{acceptedFriends.length + 1} Ranked</span>
            <span className="text-violet-400 font-bold">Podium →</span>
          </div>
        </div>

        {/* WIDGET 4: Community Activity Feed */}
        <div
          onClick={() => setSocialTab('feed')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>Social Feed</span>
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <div className="my-1 flex flex-col items-center justify-center text-center gap-0.5">
            <div className="text-lg sm:text-xl font-black font-mono text-inherit tabular-nums leading-tight">
              {friendPosts.length} <span className="text-xs text-slate-400 font-normal">Posts</span>
            </div>
            <div className="text-[10px] text-slate-300 leading-snug">
              {friendPosts.length > 0 ? friendPosts[0].description.slice(0, 24) : 'Post a workout PR!'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Chalk Talk</span>
            <span className="text-cyan-400 font-bold">Open Feed →</span>
          </div>
        </div>

        {/* WIDGET 5: Add Athlete / Contact Sync */}
        <div
          onClick={() => setActiveModal('add-code')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
            <span>Add Friend</span>
            <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="my-1 flex flex-col items-center justify-center text-center gap-0.5">
            <span className="text-xs font-bold text-inherit block">Mutual Sync</span>
            <span className="text-[10px] text-slate-400 block">Contacts & Code</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Sync Contacts</span>
            <span className="text-emerald-400 font-bold">Connect →</span>
          </div>
        </div>

        {/* WIDGET 6: Daily Streak & Consistency */}
        <div
          onClick={() => setActiveModal('streaks')}
          className="card dashboard-item ig-glass-card glass-card-light rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span>Streaks</span>
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
          <div className="my-1 flex flex-col items-center justify-center text-center gap-1">
            <div className="text-lg sm:text-xl font-black font-mono text-inherit leading-tight">
              {streakInfo.currentStreak}d Active
            </div>
            <span className="pill text-[10px] font-bold text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full inline-block">
              {streakInfo.currentStreak > 1 ? 'Streak Burning' : 'Daily Streak'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Consistency</span>
            <span className="text-amber-400 font-bold">Stats →</span>
          </div>
        </div>
      </div>

      {/* 3. MODAL OVERLAYS */}

      {/* MODAL 1: MY ATHLETE PASSCODE & QR */}
      {activeModal === 'my-code' && (
        <div
          className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="social-modal-card glass-modal modal-content dialog-sheet liquid-glass-enabled rounded-3xl p-4 sm:p-6 max-w-md w-full space-y-4 text-center"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Your Personal Athlete Code</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-xs text-slate-400 uppercase font-mono block">Share this code with workout partners</span>
              <div className="text-3xl font-black font-mono text-white tracking-widest">{myAthleteCode}</div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-2 rounded-xl text-black font-black text-xs shadow-md mt-2 inline-flex items-center gap-1.5 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-hex)' }}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Athlete Code'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUESTS & APPROVALS */}
      {activeModal === 'requests' && (
        <div
          className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="social-modal-card friend-requests-modal glass-modal modal-content dialog-sheet liquid-glass-enabled rounded-3xl p-4 sm:p-6 max-w-xl w-full space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-white">Friend Requests & Approvals</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Tab Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setRequestsTab('incoming')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  requestsTab === 'incoming'
                    ? 'accent-bg text-black font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={requestsTab === 'incoming' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
              >
                <span>Incoming</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  requestsTab === 'incoming' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'
                }`}>
                  {incomingRequests.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRequestsTab('outgoing')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  requestsTab === 'outgoing'
                    ? 'accent-bg text-black font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={requestsTab === 'outgoing' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
              >
                <span>Outgoing</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  requestsTab === 'outgoing' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'
                }`}>
                  {outgoingRequests.length}
                </span>
              </button>
            </div>

            {/* Tab 1: Incoming Requests */}
            {requestsTab === 'incoming' && (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {incomingRequests.length === 0 ? (
                  <div className="text-xs text-slate-400 py-8 text-center bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <p className="font-semibold text-slate-300">No pending incoming requests</p>
                    <p className="text-[11px] text-slate-500">Share your Athlete Code with gym partners to connect!</p>
                  </div>
                ) : (
                  incomingRequests.map((req) => (
                    <div key={req.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">{req.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">Invite Code: <span className="text-amber-300 font-bold">{req.friendCode}</span></div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAcceptRequest(req.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeclineRequest(req.id)}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Outgoing Requests */}
            {requestsTab === 'outgoing' && (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {outgoingRequests.length === 0 ? (
                  <div className="text-xs text-slate-400 py-8 text-center bg-white/5 rounded-2xl border border-white/5 space-y-1">
                    <p className="font-semibold text-slate-300">No pending outgoing requests</p>
                    <p className="text-[11px] text-slate-500">Add an athlete by their code to send an invite request.</p>
                  </div>
                ) : (
                  outgoingRequests.map((req) => (
                    <div key={req.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white truncate">{req.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>Code: <span className="text-slate-300">{req.friendCode}</span></span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">Pending</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCancelOutgoingRequest(req.id)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/15 hover:border-rose-500/30 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: LEADERBOARD & PODIUM (ZERO FAKE ATHLETES - STRICTLY REAL VERIFIED ACCOUNTS ONLY) */}
      {activeModal === 'leaderboard' && (
        <div
          className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="social-modal-card leaderboard-modal-content glass-modal modal-content dialog-sheet liquid-glass-enabled rounded-3xl p-4 sm:p-6 max-w-xl w-full space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-violet-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Leaderboard</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Friends vs. Global Toggle Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setPodiumTab('friends')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  podiumTab === 'friends'
                    ? 'accent-bg text-black font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={podiumTab === 'friends' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Friends Squad</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  podiumTab === 'friends' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'
                }`}>
                  {combinedLeaderboard.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPodiumTab('global')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  podiumTab === 'global'
                    ? 'accent-bg text-black font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={podiumTab === 'global' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Global Ranks</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  podiumTab === 'global' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-300'
                }`}>
                  {combinedLeaderboard.length}
                </span>
              </button>
            </div>

            {/* Content for Friends Squad vs. Global Ranks (Strictly Real Verified Accounts + Current User) */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {/* Real Verified Athletes Podium */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-violet-950/35 to-black/35 border border-violet-500/20 flex items-end justify-center gap-2 min-h-[176px] pt-3">
                {/* #2 Silver */}
                {realTop3[1] ? (
                  <div className="flex-1 flex flex-col items-center">
                    {realTop3[1].avatar ? (
                      <img src={realTop3[1].avatar} alt={realTop3[1].name} className="w-8 h-8 rounded-full border border-slate-300 object-cover mb-1 shadow" />
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-slate-300 bg-slate-900 text-white font-black text-xs flex items-center justify-center mb-1 shadow">
                        {realTop3[1].name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="podium-username font-bold text-slate-200 text-center mb-1 px-1">
                      {realTop3[1].name}
                    </span>
                    <div className="w-full bg-slate-800/90 border border-slate-400/50 rounded-t-2xl h-18 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-[11px] font-black text-slate-300">#2 Silver</span>
                      <span className="text-xs font-mono font-bold text-slate-200">BPL {realTop3[1].bplScore}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center opacity-40">
                    <div className="w-8 h-8 rounded-full border border-dashed border-white/40 mb-1 flex items-center justify-center text-[10px] font-mono text-slate-400">#2</div>
                    <span className="podium-username text-slate-500 text-center mb-1">Unclaimed</span>
                    <div className="w-full bg-white/5 border border-dashed border-white/20 rounded-t-2xl h-16" />
                  </div>
                )}

                {/* #1 Gold */}
                {realTop3[0] && (
                  <div className="flex-1 flex flex-col items-center">
                    <Crown className="w-4 h-4 text-amber-400 -mb-0.5 animate-bounce" />
                    {realTop3[0].avatar ? (
                      <img src={realTop3[0].avatar} alt={realTop3[0].name} className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover mb-1 shadow-xl" />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-amber-400 bg-slate-900 text-white font-black text-sm flex items-center justify-center mb-1 shadow-xl">
                        {realTop3[0].name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="podium-username font-black text-amber-300 text-center mb-1 px-1">
                      {realTop3[0].name}
                    </span>
                    <div className="w-full bg-amber-500/20 border-2 border-amber-400/80 rounded-t-2xl h-24 flex flex-col items-center justify-center shadow-2xl">
                      <span className="text-xs font-black text-amber-300">#1 Gold</span>
                      <span className="text-sm font-mono font-black text-white">BPL {realTop3[0].bplScore}</span>
                      <span className="text-[8px] font-mono text-amber-200 uppercase font-bold">{realTop3[0].streak}d Streak</span>
                    </div>
                  </div>
                )}

                {/* #3 Bronze */}
                {realTop3[2] ? (
                  <div className="flex-1 flex flex-col items-center">
                    {realTop3[2].avatar ? (
                      <img src={realTop3[2].avatar} alt={realTop3[2].name} className="w-8 h-8 rounded-full border border-amber-600 object-cover mb-1 shadow" />
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-amber-600 bg-slate-900 text-white font-black text-xs flex items-center justify-center mb-1 shadow">
                        {realTop3[2].name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="podium-username font-bold text-amber-400 text-center mb-1 px-1">
                      {realTop3[2].name}
                    </span>
                    <div className="w-full bg-amber-950/80 border border-amber-700/60 rounded-t-2xl h-14 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-[11px] font-black text-amber-500">#3 Bronze</span>
                      <span className="text-xs font-mono font-bold text-amber-300">BPL {realTop3[2].bplScore}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center opacity-40">
                    <div className="w-8 h-8 rounded-full border border-dashed border-white/40 mb-1 flex items-center justify-center text-[10px] font-mono text-slate-400">#3</div>
                    <span className="podium-username text-slate-500 text-center mb-1">Unclaimed</span>
                    <div className="w-full bg-white/5 border border-dashed border-white/20 rounded-t-2xl h-12" />
                  </div>
                )}
              </div>

              {acceptedFriends.length === 0 && (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-2.5">
                  <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                    Share your athlete passcode with friends to build a live squad leaderboard.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleSyncContacts();
                    }}
                    disabled={isSyncingContacts}
                    className="px-4 py-2 rounded-xl text-black font-black text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--accent-hex)' }}
                  >
                    <Contact className="w-3.5 h-3.5 text-black" />
                    <span>{isSyncingContacts ? 'Verifying Mutual Passcodes...' : 'Verify Mutual Contacts'}</span>
                  </button>
                </div>
              )}

              {/* Scrollable list below podium for ranks #4+ */}
              {realRest.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Athletic Ranks #4 and Beyond
                  </span>
                  {realRest.map((fr, idx) => (
                    <div key={fr.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 text-center font-black text-sm text-slate-500 font-mono">
                          #{idx + 4}
                        </span>
                        {fr.avatar ? (
                          <img src={fr.avatar} alt={fr.name} className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-900 border border-white/20 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {fr.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-white block truncate">{fr.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">BPL {fr.bplScore} · {fr.streak}d streak</span>
                        </div>
                      </div>
                      <div className="text-right font-mono text-xs text-slate-300 shrink-0">
                        <div>Bench {fr.bench1RM}k · Sq {fr.squat1RM}k</div>
                        <div className="text-amber-400 font-bold">Dead {fr.deadlift1RM}k</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD ATHLETE BY CODE & DEVICE CONTACTS SYNC */}
      {activeModal === 'add-code' && (
        <div
          className="fixed inset-0 z-50 bg-black/45 p-3 sm:p-6 overflow-y-auto flex items-center justify-center animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="social-modal-card add-partner-modal glass-modal modal-content dialog-sheet liquid-glass-enabled rounded-3xl p-4 sm:p-6 max-w-md w-full space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Add Workout Partner</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SECTION 1: DEVICE CONTACTS SYNC */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Device Contacts Sync</span>
                </div>
                {contactsSynced && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Synced
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-300 leading-tight">
                Scan your phone address book to discover friends already training on the Overhaul app.
              </p>

              <button
                type="button"
                onClick={handleSyncContacts}
                disabled={isSyncingContacts}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Contact className="w-4 h-4" />
                <span>{isSyncingContacts ? 'Scanning Contacts...' : contactsSynced ? 'Re-scan Device Contacts' : 'Sync Device Contacts'}</span>
              </button>

              {/* Discovered Registered Contacts from Address Book */}
              {contactsSynced && (
                <div className="space-y-1.5 pt-2 border-t border-emerald-500/20 text-center py-2">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase font-mono block">
                    {acceptedFriends.length} Real Athletes Connected
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {acceptedFriends.length === 0
                      ? 'No registered contacts found yet. Share your Athlete Code or invite gym partners directly.'
                      : `${acceptedFriends.length} verified athlete accounts active in your squad.`}
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 2: MANUAL PASSCODE SEARCH */}
            <form onSubmit={handleSendRequest} className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-300">Or Enter Athlete Passcode</label>
              <input
                type="text"
                placeholder="e.g. OS-8924-X7"
                value={inputFriendCode}
                onChange={(e) => setInputFriendCode(e.target.value)}
                className="w-full bg-black/30 border border-white/15 rounded-xl p-3 text-base text-white font-mono tracking-wider uppercase outline-none focus:border-white/40"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-black font-black text-xs shadow-md cursor-pointer active:scale-95 transition-all"
                style={{ backgroundColor: 'var(--accent-hex)' }}
              >
                Send Friend Request
              </button>
            </form>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer hover:bg-white/15"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MODAL 6: DYNAMIC CALENDAR STREAKS & WORKOUT STATS (UNIFIED) */}
      <StreakModal
        isOpen={activeModal === 'streaks'}
        onClose={() => setActiveModal(null)}
        liftRecords={liftRecords}
        sportsHistory={sportsHistory}
        stepsHistory={stepsHistory}
      />
    </div>
  );
};
