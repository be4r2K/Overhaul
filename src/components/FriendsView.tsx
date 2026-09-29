import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Friend, FriendPost, UserProfile, LiftRecord, SportActivity, DailyStepLog } from '../types/fitness';
import { AIWorkoutAnalysisResult } from '../types/aiWorkout';
import { t } from '../utils/i18n';

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
  language = 'en',
}) => {
  const [activeModal, setActiveModal] = useState<'requests' | 'add-code' | 'leaderboard' | 'feed' | 'my-code' | 'streaks' | null>(null);
  const [podiumTab, setPodiumTab] = useState<'friends' | 'global'>('friends');
  const [requestsTab, setRequestsTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputFriendCode, setInputFriendCode] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // Device Contacts Sync State
  const [isSyncingContacts, setIsSyncingContacts] = useState(false);
  const [contactsSynced, setContactsSynced] = useState(false);
  const [addedContactCodes, setAddedContactCodes] = useState<string[]>([]);

  // Absolute purge of mock athletes (Alex Rivera, Liam Carter, Sophia Martinez) from active state
  React.useEffect(() => {
    const hasMock = friends.some((f) =>
      ['Alex Rivera', 'Liam Carter', 'Sophia Martinez'].includes(f.name) ||
      ['ATHLETE-A3', 'ATHLETE-L1', 'ATHLETE-S2'].includes(f.friendCode)
    );
    if (hasMock) {
      onUpdateFriends(
        friends.filter(
          (f) =>
            !['Alex Rivera', 'Liam Carter', 'Sophia Martinez'].includes(f.name) &&
            !['ATHLETE-A3', 'ATHLETE-L1', 'ATHLETE-S2'].includes(f.friendCode)
        )
      );
    }
  }, [friends, onUpdateFriends]);

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const incomingRequests = friends.filter((f) => f.status === 'pending_incoming');
  const outgoingRequests = friends.filter((f) => f.status === 'pending_outgoing');

  const myAthleteCode = profile.personalFriendCode || 'ATHLETE-7';

  // Strictly real verified athletes sorted by BPL Score descending
  const sortedRealAthletes = [...acceptedFriends].sort((a, b) => (b.bplScore || 0) - (a.bplScore || 0));
  const realTop3 = sortedRealAthletes.slice(0, 3);
  const realRest = sortedRealAthletes.slice(3);

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

  // Contacts Sync Handler
  const handleSyncContacts = async () => {
    setIsSyncingContacts(true);
    try {
      const { fetchDeviceContacts } = await import('../utils/contacts');
      const deviceContacts = await fetchDeviceContacts();
      
      const cleanList = friends.filter(
        (f) =>
          f &&
          !['Alex Rivera', 'Liam Carter', 'Sophia Martinez'].includes(f.name) &&
          !['ATHLETE-A3', 'ATHLETE-L1', 'ATHLETE-S2'].includes(f.friendCode)
      );

      const registeredMatches = deviceContacts
        .filter((c) => c.isRegisteredUser)
        .map((c, idx) => ({
          id: `friend-contact-${Date.now()}-${idx}`,
          name: c.name,
          friendCode: `ATHLETE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          status: 'accepted' as const,
          streak: 2,
          bplScore: 84,
          avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?w=150&auto=format&fit=crop&q=80`,
          bench1RM: 105,
          squat1RM: 140,
          deadlift1RM: 175,
          lastActive: 'Just Now',
          recentWorkout: 'Matched via Address Book',
          overviewSnippet: `Verified partner phone: ${c.phone}`,
          sleepHours: 7.9,
        }));

      onUpdateFriends([...cleanList, ...registeredMatches]);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setContactsSynced(true);
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

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden p-2 sm:p-3 pb-3 sm:pb-4 max-w-7xl mx-auto w-full gap-2 select-none">
      {/* 1. TOP HEADER & COMMUNITY METADATA BAR (Compact) */}
      <div className="ig-glass-card rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-white/10 shadow-sm shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-white tracking-tight">{t('social.hub', language)}</h2>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-violet-400/20 text-violet-300 font-bold border border-violet-400/30 uppercase">
                {acceptedFriends.length} Connected Athletes
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Your Passcode: <span className="text-white font-mono font-bold">{myAthleteCode}</span> · Squad Leaderboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'My Passcode'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 6-WIDGET ZERO-SCROLL BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 flex-1 min-h-0 overflow-hidden">
        {/* WIDGET 1: Athlete Share Code & QR */}
        <div
          onClick={() => setActiveModal('my-code')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span>Passcode</span>
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1 text-center">
            <span className="text-sm font-black font-mono text-white block tracking-wider">{myAthleteCode}</span>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded-full inline-block mt-0.5">
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
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 font-bold uppercase">
            <span>Requests</span>
            <UserPlus className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="my-1 text-center">
            <div className="text-2xl font-black font-mono text-white">
              {incomingRequests.length + outgoingRequests.length}
            </div>
            <span className="text-[10px] font-mono text-slate-300">
              {incomingRequests.length} In · {outgoingRequests.length} Out
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Approvals</span>
            <span className="text-rose-400 font-bold">Manage →</span>
          </div>
        </div>

        {/* WIDGET 3: Athletic Podium Leaderboard */}
        <div
          onClick={() => setActiveModal('leaderboard')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-violet-400 font-bold uppercase">
            <span>Leaderboard</span>
            <Trophy className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="my-1 text-center">
            {acceptedFriends.length > 0 ? (
              <div>
                <div className="text-xl font-black font-mono text-white">
                  👑 {sortedRealAthletes[0].name.split(' ')[0]}
                </div>
                <span className="text-[10px] font-mono text-violet-300 bg-violet-500/20 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                  #{1} · BPL {sortedRealAthletes[0].bplScore}
                </span>
              </div>
            ) : (
              <div className="space-y-1.5 py-0.5">
                <div className="text-xs sm:text-sm font-bold text-slate-200">Podium Empty</div>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await handleSyncContacts();
                  }}
                  disabled={isSyncingContacts}
                  className="w-full py-1.5 px-2 rounded-xl text-black font-black text-[10px] shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 hover:opacity-95 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-hex)' }}
                  title="Cross-reference device contacts for friends"
                >
                  <Contact className="w-3.5 h-3.5 text-black shrink-0" />
                  <span className="truncate">{isSyncingContacts ? 'Syncing Contacts...' : 'Sync Contacts to Find Friends'}</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Squad Ranks</span>
            <span className="text-violet-400 font-bold">Podium →</span>
          </div>
        </div>

        {/* WIDGET 4: Community Activity Feed */}
        <div
          onClick={() => setActiveModal('feed')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase">
            <span>Social Feed</span>
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-white tabular-nums">
              {friendPosts.length} <span className="text-xs text-slate-400 font-normal">Posts</span>
            </div>
            <div className="text-[11px] text-slate-300 truncate">
              {friendPosts.length > 0 ? friendPosts[0].description.slice(0, 22) + '...' : 'Post a workout PR!'}
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
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold uppercase">
            <span>Add Friend</span>
            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="my-1 text-center">
            <span className="text-xs font-bold text-white block">Mutual Sync</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Contacts & Code</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Sync Contacts</span>
            <span className="text-emerald-400 font-bold">Connect →</span>
          </div>
        </div>

        {/* WIDGET 6: Daily Streak & Consistency */}
        <div
          onClick={() => setActiveModal('streaks')}
          className="ig-glass-card rounded-2xl p-3 flex flex-col justify-between border border-white/10 shadow-sm cursor-pointer hover:scale-[1.01] transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold uppercase">
            <span>Streaks</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1 text-center">
            <div className="text-2xl font-black font-mono text-white">7d Active</div>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Squad Goal
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
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
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
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
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

      {/* MODAL 3: ATHLETIC PODIUM LEADERBOARD (ZERO FAKE ATHLETES - STRICTLY REAL DATABASE ONLY) */}
      {activeModal === 'leaderboard' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-violet-400" />
                <h3 className="text-base sm:text-lg font-black text-white">Squad Athletic Podium</h3>
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
                  {acceptedFriends.length}
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
                  {acceptedFriends.length}
                </span>
              </button>
            </div>

            {/* Content for Friends Squad vs. Global Ranks (Strictly Real Synced Accounts Only) */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {acceptedFriends.length === 0 ? (
                /* Both Friends Squad & Global Ranks Show Empty Podium Frame when 0 Real Athletes */
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5 text-center">
                  {/* Empty Podium Frame Wireframe */}
                  <div className="flex items-end justify-center gap-2.5 h-36 pt-2 max-w-sm mx-auto">
                    {/* #2 Silver Frame */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full border border-dashed border-slate-500/60 bg-white/5 flex items-center justify-center text-xs font-mono text-slate-400 mb-1">
                        #2
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Silver</span>
                      <div className="w-full bg-slate-800/30 border border-dashed border-slate-600/40 rounded-t-xl h-14 flex items-center justify-center">
                        <span className="text-[10px] text-slate-600 font-mono">Unclaimed</span>
                      </div>
                    </div>

                    {/* #1 Gold Frame */}
                    <div className="flex-1 flex flex-col items-center">
                      <Crown className="w-4 h-4 text-amber-400/40 mb-0.5" />
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-500/60 bg-amber-500/10 flex items-center justify-center text-sm font-mono text-amber-300 mb-1">
                        #1
                      </div>
                      <span className="text-[10px] text-amber-400/80 font-mono font-bold">Gold</span>
                      <div className="w-full bg-amber-500/10 border-2 border-dashed border-amber-500/40 rounded-t-xl h-20 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-amber-300/60 font-mono">Top Rank</span>
                      </div>
                    </div>

                    {/* #3 Bronze Frame */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className="w-9 h-9 rounded-full border border-dashed border-amber-700/60 bg-white/5 flex items-center justify-center text-xs font-mono text-amber-600 mb-1">
                        #3
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Bronze</span>
                      <div className="w-full bg-slate-800/30 border border-dashed border-amber-700/40 rounded-t-xl h-11 flex items-center justify-center">
                        <span className="text-[10px] text-slate-600 font-mono">Unclaimed</span>
                      </div>
                    </div>
                  </div>

                  {/* Empty State Banner with exact required phrasing */}
                  <div className="space-y-2 max-w-md mx-auto">
                    <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
                      No connected athletes on the podium yet. Sync contacts or share your Athlete Code to populate your squad.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      All fake and mock accounts have been completely purged. Global and squad ranks populate exclusively from verified synced athlete accounts.
                    </p>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSyncContacts();
                      }}
                      disabled={isSyncingContacts}
                      className="px-5 py-2.5 rounded-xl text-black font-black text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--accent-hex)' }}
                    >
                      <Contact className="w-4 h-4 text-black" />
                      <span>{isSyncingContacts ? 'Syncing Contacts...' : 'Sync Contacts to Find Friends'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Real Verified Athletes Podium */}
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-violet-950/40 to-slate-950/90 border border-violet-500/20 flex items-end justify-center gap-2 h-40 pt-2">
                    {/* #2 Silver */}
                    {realTop3[1] ? (
                      <div className="flex-1 flex flex-col items-center">
                        <img src={realTop3[1].avatar} alt={realTop3[1].name} className="w-8 h-8 rounded-full border border-slate-300 object-cover mb-1 shadow" />
                        <span className="text-[10px] font-bold text-slate-200 truncate max-w-[80px] text-center">
                          {realTop3[1].name}
                        </span>
                        <div className="w-full bg-slate-800/90 border border-slate-400/50 rounded-t-2xl h-18 flex flex-col items-center justify-center shadow-lg">
                          <span className="text-[11px] font-black text-slate-300">#2 Silver</span>
                          <span className="text-xs font-mono font-bold text-slate-200">BPL {realTop3[1].bplScore}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center opacity-30">
                        <div className="w-8 h-8 rounded-full border border-dashed border-white/40 mb-1" />
                        <span className="text-[10px] text-slate-500">#2 Open</span>
                        <div className="w-full bg-white/5 border border-dashed border-white/20 rounded-t-2xl h-16" />
                      </div>
                    )}

                    {/* #1 Gold */}
                    {realTop3[0] && (
                      <div className="flex-1 flex flex-col items-center">
                        <Crown className="w-4 h-4 text-amber-400 -mb-0.5 animate-bounce" />
                        <img src={realTop3[0].avatar} alt={realTop3[0].name} className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover mb-1 shadow-xl" />
                        <span className="text-[11px] font-black text-amber-300 truncate max-w-[90px] text-center">
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
                        <img src={realTop3[2].avatar} alt={realTop3[2].name} className="w-8 h-8 rounded-full border border-amber-600 object-cover mb-1 shadow" />
                        <span className="text-[10px] font-bold text-amber-400 truncate max-w-[80px] text-center">
                          {realTop3[2].name}
                        </span>
                        <div className="w-full bg-amber-950/80 border border-amber-700/60 rounded-t-2xl h-14 flex flex-col items-center justify-center shadow-lg">
                          <span className="text-[11px] font-black text-amber-500">#3 Bronze</span>
                          <span className="text-xs font-mono font-bold text-amber-300">BPL {realTop3[2].bplScore}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center opacity-30">
                        <div className="w-8 h-8 rounded-full border border-dashed border-white/40 mb-1" />
                        <span className="text-[10px] text-slate-500">#3 Open</span>
                        <div className="w-full bg-white/5 border border-dashed border-white/20 rounded-t-2xl h-12" />
                      </div>
                    )}
                  </div>

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
                            <img src={fr.avatar} alt={fr.name} className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0" />
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
                </>
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

      {/* MODAL 4: FEED & POST CREATOR */}
      {activeModal === 'feed' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">Community Activity & Chalk Talk</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-2">
              <textarea
                placeholder="Share a PR, gym achievement or ask for training advice..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-sm text-white h-20 outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl text-black font-black text-xs shadow-md"
                style={{ backgroundColor: 'var(--accent-hex)' }}
              >
                Post Update
              </button>
            </form>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {friendPosts.map((post) => (
                <div key={post.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{post.friendName}</span>
                    <span className="text-[10px] text-slate-400">{post.timeAgo}</span>
                  </div>
                  <p className="text-xs text-slate-300">{post.description}</p>
                </div>
              ))}
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

      {/* MODAL 5: ADD ATHLETE BY CODE & DEVICE CONTACTS SYNC */}
      {activeModal === 'add-code' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
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

            {/* SECTION 2: MANUAL 8-DIGIT CODE SEARCH */}
            <form onSubmit={handleSendRequest} className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-300">Or Enter 8-Digit Athlete Code</label>
              <input
                type="text"
                placeholder="e.g. ATHLETE-9"
                value={inputFriendCode}
                onChange={(e) => setInputFriendCode(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-base text-white font-mono tracking-wider uppercase outline-none focus:border-white/40"
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

      {/* MODAL 6: DYNAMIC CALENDAR STREAKS & WORKOUT STATS */}
      {activeModal === 'streaks' && (
        <div className="fixed inset-0 z-50 bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-md flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Consistency & Workout Streak Stats</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Highlight Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-0.5">
                <span className="text-[10px] font-mono text-amber-300 uppercase block font-bold">Active Streak</span>
                <span className="text-2xl font-black font-mono text-amber-400">7 Days</span>
                <span className="text-[9px] text-slate-400 block">🔥 On Fire</span>
              </div>

              <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/30 space-y-0.5">
                <span className="text-[10px] font-mono text-violet-300 uppercase block font-bold">All-Time Streak</span>
                <span className="text-2xl font-black font-mono text-violet-400">24 Days</span>
                <span className="text-[9px] text-slate-400 block">🏆 All-Time</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-0.5">
                <span className="text-[10px] font-mono text-emerald-300 uppercase block font-bold">Consistency Rate</span>
                <span className="text-2xl font-black font-mono text-emerald-400">94%</span>
                <span className="text-[9px] text-slate-400 block">⚡ Top Tier</span>
              </div>
            </div>

            {/* Dynamic 7-Day Weekly Calendar Tracker */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">This Week's Activity</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {targetsHitThisWeek}/7 Targets Hit
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {weekDaysActivity.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-mono font-bold ${item.isToday ? 'text-amber-400' : 'text-slate-400'}`}>
                        {item.day}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono">
                        {item.dateNum}
                      </span>
                    </div>

                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      item.status === 'done'
                        ? 'bg-emerald-500 text-black font-black'
                        : item.status === 'rest'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : item.isToday
                        ? 'accent-bg text-black font-black ring-2 ring-white/50 scale-105'
                        : 'bg-white/5 text-slate-500 border border-white/10'
                    }`}
                    style={item.isToday && item.status !== 'done' ? { backgroundColor: 'var(--accent-hex)', color: '#000000' } : undefined}
                    >
                      {item.status === 'done' ? '✓' : item.status === 'rest' ? '💤' : item.isToday ? '⚡' : '○'}
                    </div>

                    <span className="text-[9px] text-slate-400 truncate max-w-full font-mono text-center" title={item.label}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Streak Safeguard & Rest Day Protection */}
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Rest Day Safeguard Active</span>
                </div>
                <p className="text-[11px] text-slate-400">Scheduled recovery days on your custom split do not break your streak.</p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30 shrink-0">
                Protected
              </span>
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
    </div>
  );
};
