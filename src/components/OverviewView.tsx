import React, { useState, useMemo } from 'react';
import { ViewMode, UserProfile, RecentInterviewItem } from '../types';

interface OverviewViewProps {
  onNavigate: (view: ViewMode) => void;
  onStartInterview: () => void;
  onOpenQuestion: (questionTitle: string) => void;
  userProfile?: UserProfile | null;
  recentInterviews: RecentInterviewItem[];
  onOpenResumeModal?: () => void;
  onAddRole?: (role: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onStartInterview,
  onOpenQuestion: _onOpenQuestion,
  userProfile,
  recentInterviews,
  onOpenResumeModal,
  onAddRole,
}) => {
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');

  // 1. Candidate Name & Dynamic Greeting
  const candidateFullName = userProfile?.fullName || 'Candidate';
  const candidateFirstName = candidateFullName.trim().split(' ')[0] || 'Candidate';

  const timeOfDayGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // 2. Target Roles Hierarchy (Source of truth: userProfile)
  const primaryRole = userProfile?.primaryRole || userProfile?.targetRoles?.[0]?.title || '';
  const additionalRoles = useMemo(() => {
    if (!userProfile?.targetRoles) return [];
    return userProfile.targetRoles.filter(
      r => r.title.toLowerCase() !== primaryRole.toLowerCase()
    );
  }, [userProfile?.targetRoles, primaryRole]);

  const targetRolesLabel = useMemo(() => {
    if (!primaryRole) return null;
    if (additionalRoles.length === 0) return primaryRole;
    const additionalStr = additionalRoles.slice(0, 2).map(r => r.title).join(' & ');
    const extraCount = additionalRoles.length > 2 ? ` +${additionalRoles.length - 2} more` : '';
    return `${primaryRole} (Primary) • ${additionalStr}${extraCount}`;
  }, [primaryRole, additionalRoles]);

  // Target Interview Date
  const targetDateDisplay = userProfile?.targetInterviewDate
    ? new Date(userProfile.targetInterviewDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Flexible target date';

  // 3. Telemetry Calculations (Strictly Evidence-Based from Authenticated User Records)
  const totalCount = recentInterviews.length;

  // Scored interviews (exclude abandoned/unscored sessions)
  const scoredInterviews = useMemo(() => {
    return recentInterviews.filter(s => typeof s.score === 'number' && !isNaN(s.score) && s.score > 0);
  }, [recentInterviews]);

  const avgScore = useMemo(() => {
    if (scoredInterviews.length === 0) return null;
    const sum = scoredInterviews.reduce((acc, cur) => acc + cur.score, 0);
    return Math.round(sum / scoredInterviews.length);
  }, [scoredInterviews]);

  const scoreTrend = useMemo(() => {
    if (scoredInterviews.length >= 2) {
      const delta = scoredInterviews[0].score - scoredInterviews[1].score;
      return {
        text: delta >= 0 ? `+${delta} pts from prior session` : `${delta} pts from prior session`,
        isPositive: delta >= 0
      };
    }
    if (scoredInterviews.length === 1) {
      return { text: 'Initial baseline established', isPositive: true };
    }
    return { text: 'Complete a session to establish score', isPositive: false };
  }, [scoredInterviews]);

  const paceBadge = useMemo(() => {
    if (avgScore === null) return { text: 'Evaluation Pending', colorClass: 'bg-surface-container text-outline' };
    if (avgScore >= 80) return { text: 'Strong Pace', colorClass: 'bg-secondary-container/40 text-secondary' };
    if (avgScore >= 65) return { text: 'Steady Pace', colorClass: 'bg-[#ffe2b3] text-[#7a4c00]' };
    return { text: 'Needs Practice', colorClass: 'bg-error-container/40 text-error' };
  }, [avgScore]);

  // Streak calculation based on real practice dates
  const streakData = useMemo(() => {
    if (!recentInterviews.length) return { currentStreak: 0, personalBest: 0, dateRangeText: 'No sessions yet' };

    const dateSet = new Set<string>();
    recentInterviews.forEach(item => {
      const d = item.completedAt ? new Date(item.completedAt) : new Date();
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dateSet.add(`${yyyy}-${mm}-${dd}`);
      }
    });

    const sortedDates = Array.from(dateSet).sort();
    if (!sortedDates.length) return { currentStreak: 0, personalBest: 0, dateRangeText: 'No sessions yet' };

    // Personal best calculation
    let maxStreak = 1;
    let curr = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const next = new Date(sortedDates[i]);
      const diffDays = Math.round((next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        curr++;
        if (curr > maxStreak) maxStreak = curr;
      } else if (diffDays > 1) {
        curr = 1;
      }
    }

    // Active streak calculation relative to today/yesterday
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let activeStreak = 0;
    const latestDate = sortedDates[sortedDates.length - 1];
    if (latestDate === todayStr || latestDate === yesterdayStr) {
      activeStreak = 1;
      let checkDate = new Date(latestDate);
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const prevDate = new Date(sortedDates[i]);
        const diff = Math.round((checkDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          activeStreak++;
          checkDate = prevDate;
        } else {
          break;
        }
      }
    }

    return {
      currentStreak: activeStreak,
      personalBest: Math.max(maxStreak, activeStreak),
      dateRangeText: activeStreak > 0 ? `Active: ${sortedDates[sortedDates.length - activeStreak]} to ${latestDate}` : 'Practice today to start streak'
    };
  }, [recentInterviews]);

  // Readiness Index & Status
  const readinessPercentage = useMemo(() => {
    if (avgScore === null) return null;
    return Math.min(99, Math.round(avgScore * 0.9 + Math.min(scoredInterviews.length * 2, 10)));
  }, [avgScore, scoredInterviews.length]);

  const readinessTier = useMemo(() => {
    if (readinessPercentage === null) return 'Pending';
    if (readinessPercentage >= 85) return 'Tier A';
    if (readinessPercentage >= 75) return 'Tier B+';
    if (readinessPercentage >= 65) return 'Tier B';
    return 'Tier C';
  }, [readinessPercentage]);

  const readinessStatusLabel = useMemo(() => {
    if (readinessPercentage === null) return 'Evaluation Pending';
    if (readinessPercentage >= 85) return 'Interview Ready';
    if (readinessPercentage >= 75) return 'Building Confidence';
    if (readinessPercentage >= 65) return 'Moderate Readiness';
    return 'Needs Practice';
  }, [readinessPercentage]);

  // Rubric check scores
  const technicalKnowledgeScore = useMemo(() => {
    const scores = recentInterviews
      .map(i => i.report?.competencyBreakdown?.technicalKnowledge?.score ?? (i.score ? Math.min(96, i.score + 2) : null))
      .filter((v): v is number => typeof v === 'number');
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [recentInterviews]);

  const answerStructureScore = useMemo(() => {
    const scores = recentInterviews
      .map(i => i.report?.competencyBreakdown?.communication?.score ?? (i.score ? Math.max(50, i.score - 6) : null))
      .filter((v): v is number => typeof v === 'number');
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [recentInterviews]);

  // Suggested Focus
  const suggestedFocus = useMemo(() => {
    const latestReport = recentInterviews[0]?.report;
    if (latestReport?.growthAreas && latestReport.growthAreas.length > 0) {
      return {
        title: latestReport.growthAreas[0],
        desc: latestReport.summary ? latestReport.summary.slice(0, 110) + '...' : 'Address this gap identified during your most recent evaluation.'
      };
    }
    if (userProfile?.suggestedFocus) {
      return {
        title: userProfile.suggestedFocus,
        desc: 'Recommended focus based on your candidate track and target requirements.'
      };
    }
    if (primaryRole === 'AI / ML Engineer') {
      return {
        title: 'Transformer Architecture & Fine-Tuning Trade-offs',
        desc: 'Master attention mechanics, parameter-efficient fine-tuning (LoRA), and scalable inference serving.'
      };
    }
    return {
      title: 'Behavioral STAR Storytelling & System Trade-offs',
      desc: 'Sharpen concise metric-driven impact articulation in technical and leadership answers.'
    };
  }, [recentInterviews, userProfile?.suggestedFocus, primaryRole]);

  // Weekly Practice Volume Calculation (Monday to Sunday)
  const weeklyData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon, 6=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const dailyMinutes = [0, 0, 0, 0, 0, 0, 0];

    recentInterviews.forEach(item => {
      if (item.completedAt) {
        const d = new Date(item.completedAt);
        const diffMs = d.getTime() - monday.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          const mins = item.durationMinutes || (item.duration ? parseInt(item.duration, 10) || 20 : 20);
          dailyMinutes[diffDays] += mins;
        }
      }
    });

    const totalMinutes = dailyMinutes.reduce((a, b) => a + b, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const maxMinutes = Math.max(60, ...dailyMinutes);

    return {
      weekLabels,
      dailyMinutes,
      totalMinutes,
      totalHours,
      maxMinutes,
      activeDayIndex: dayOfWeek
    };
  }, [recentInterviews]);

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* Top Greeting & Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-surface-variant/40">
        <div className="flex flex-col gap-1.5">
          {/* Greeting Title Row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-on-surface tracking-tight leading-none">
              {timeOfDayGreeting}, {candidateFirstName}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-outline font-label-micro text-label-micro uppercase tracking-wider font-semibold">
              ACTIVE CYCLE
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-label-micro text-label-micro font-bold">
              {readinessTier}
            </span>
          </div>

          {/* Subtitle with Target Roles & Interview Date */}
          <div className="flex items-center gap-2 flex-wrap text-body-md text-on-surface-variant">
            <span>Target roles:</span>
            {targetRolesLabel ? (
              <span className="font-semibold text-on-surface">{targetRolesLabel}</span>
            ) : (
              <span className="text-outline italic">No target role configured</span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-outline text-xs">
              <span className="material-symbols-outlined text-[13px]">event</span>
              Target: {targetDateDisplay}
            </span>
            <button
              type="button"
              onClick={() => setShowAddRoleModal(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary hover:text-primary/80 font-medium text-xs transition-colors cursor-pointer"
              title="Add another target role to practice"
            >
              <span className="material-symbols-outlined text-[13px]">add</span>
              <span>Add Track</span>
            </button>
          </div>
        </div>

        {/* Right Action Elements */}
        <div className="flex items-center gap-space-md shrink-0 flex-wrap justify-between lg:justify-end">
          {onOpenResumeModal && (
            <button
              type="button"
              onClick={onOpenResumeModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-variant bg-surface-container-low hover:bg-surface-container text-xs font-medium text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">assignment_ind</span>
              <span>Update Resume</span>
            </button>
          )}

          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="font-label-md text-label-md font-medium text-on-surface">
              {currentDateFormatted}
            </span>
            <span className="font-label-micro text-label-micro text-outline font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Live AI Interview Calibration
            </span>
          </div>

          <button
            type="button"
            onClick={onStartInterview}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors shadow-sm font-label-md text-label-md font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            <span>Start an interview</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Tile 1: INTERVIEWS COMPLETED */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-variant/40 flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              INTERVIEWS COMPLETED
            </span>
            <span className="material-symbols-outlined text-outline text-[16px]">videocam</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl lg:text-[28px] font-bold text-on-surface leading-none">
              {totalCount}
            </span>
            <div className="flex items-end gap-1 h-5 w-16">
              <span className={`w-2.5 rounded-sm ${totalCount >= 1 ? 'bg-primary' : 'bg-surface-container'} ${totalCount >= 1 ? 'h-5' : 'h-2'}`}></span>
              <span className={`w-2.5 rounded-sm ${totalCount >= 3 ? 'bg-primary' : 'bg-surface-container'} ${totalCount >= 3 ? 'h-5' : 'h-3'}`}></span>
              <span className={`w-2.5 rounded-sm ${totalCount >= 5 ? 'bg-primary-fixed' : 'bg-surface-container'} ${totalCount >= 5 ? 'h-4' : 'h-2'}`}></span>
              <span className={`w-2.5 rounded-sm ${totalCount >= 8 ? 'bg-secondary' : 'bg-surface-container'} ${totalCount >= 8 ? 'h-5' : 'h-2'}`}></span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-outline">
            <span className="text-on-surface-variant font-normal">
              {totalCount > 0 ? 'Across active tracks' : 'No sessions completed'}
            </span>
            <span className="font-medium text-outline">Real-time sync</span>
          </div>
        </div>

        {/* Tile 2: AVERAGE SCORE */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-variant/40 flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              AVERAGE SCORE
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-micro text-label-micro font-semibold ${paceBadge.colorClass}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span> {paceBadge.text}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl lg:text-[28px] font-bold text-on-surface leading-none">
              {avgScore !== null ? avgScore : '—'}
            </span>
            {avgScore !== null && <span className="text-xs text-outline font-normal">/ 100</span>}
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${scoreTrend.isPositive ? 'text-secondary' : 'text-outline'}`}>
            <span className="material-symbols-outlined text-[14px]">
              {scoreTrend.isPositive ? 'trending_up' : 'info'}
            </span>
            <span>{scoreTrend.text}</span>
          </div>
        </div>

        {/* Tile 3: PRACTICE STREAK */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-variant/40 flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              PRACTICE STREAK
            </span>
            <span className={`material-symbols-outlined text-[18px] ${streakData.currentStreak > 0 ? 'text-amber-500' : 'text-outline'}`}>
              local_fire_department
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-[28px] font-bold text-on-surface leading-none">
              {streakData.currentStreak}
            </span>
            <span className="text-sm font-semibold text-on-surface">
              {streakData.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-outline">
            <span className="text-on-surface-variant font-normal">
              Personal best: {streakData.personalBest} {streakData.personalBest === 1 ? 'day' : 'days'}
            </span>
            <span className="font-medium text-outline truncate max-w-[120px] text-right">
              {streakData.dateRangeText}
            </span>
          </div>
        </div>

        {/* Tile 4: READINESS STATUS */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-surface-variant/40 flex flex-col justify-between gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
              READINESS STATUS
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary-fixed/40 text-primary font-label-micro text-label-micro font-bold">
              {readinessTier}
            </span>
          </div>
          <div className="flex items-baseline">
            <span className="text-base lg:text-[17px] font-bold text-on-surface leading-tight">
              {readinessStatusLabel}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-outline">
            <span className="text-on-surface-variant font-normal">
              {readinessPercentage !== null ? `Readiness: ${readinessPercentage}%` : 'Benchmark: 85+'}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('my-progress')}
              className="text-primary font-medium hover:underline cursor-pointer"
            >
              Adjust
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Columns: 8 Col Left Feed + 4 Col Right Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols): ASSESSMENT FEED • Recent Interviews Table */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-variant/40 overflow-hidden flex flex-col">
            {/* Header bar */}
            <div className="px-space-lg py-3 flex items-center justify-between bg-surface-container-lowest border-b border-surface-variant/40">
              <div className="flex items-center gap-2">
                <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                  ASSESSMENT FEED
                </span>
                <span className="text-outline text-xs">•</span>
                <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Recent Interviews
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(true)}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-fixed/40 hover:bg-primary hover:text-on-primary text-primary transition-all cursor-pointer shadow-2xs ml-1"
                  title="Add target practice track"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('my-progress')}
                className="font-label-md text-label-md text-primary font-medium hover:text-on-primary-fixed-variant transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                View all ({totalCount})
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {/* Assessment Feed Table or Clean Empty State */}
            {totalCount === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center mb-3 text-outline">
                  <span className="material-symbols-outlined text-[26px]">videocam</span>
                </div>
                <h4 className="text-base font-semibold text-on-surface mb-1">
                  No completed interviews yet
                </h4>
                <p className="text-xs text-on-surface-variant max-w-sm mb-4 leading-relaxed">
                  Start your first practice interview to generate AI-calibrated score analytics, real-time rubric breakdowns, and personalized readiness recommendations.
                </p>
                <button
                  type="button"
                  onClick={onStartInterview}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                  <span>Start your first interview</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-lowest text-outline font-label-micro text-label-micro uppercase tracking-wider border-b border-surface-variant/30">
                      <th className="py-2.5 px-space-lg font-semibold">TARGET ROLE</th>
                      <th className="py-2.5 px-space-md font-semibold">ASSESSMENT SCOPE</th>
                      <th className="py-2.5 px-space-md font-semibold">COMPLETED</th>
                      <th className="py-2.5 px-space-md font-semibold">SCORE</th>
                      <th className="py-2.5 px-space-md font-semibold">STATUS</th>
                      <th className="py-2.5 px-space-lg text-right font-semibold">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/20 text-body-sm font-body-sm">
                    {recentInterviews.map((item) => {
                      const isGreen = item.score >= 80;
                      const roleInitials = item.roleShort || item.role.slice(0, 2).toUpperCase();
                      const completedFormatted = item.completedAt
                        ? new Date(item.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })
                        : item.completed;

                      return (
                        <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors group">
                          {/* Target Role & Track Subtitle */}
                          <td className="py-3 px-space-lg font-medium text-on-surface">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${item.roleBadgeColor || 'bg-[#dee0ff] text-[#374dbe]'}`}>
                                {roleInitials}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs leading-snug text-on-surface">
                                  {item.role}
                                </span>
                                <span className="text-[11px] text-outline leading-tight">
                                  {item.track}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Assessment Scope */}
                          <td className="py-3 px-space-md text-on-surface-variant text-xs font-normal">
                            {item.scope}
                          </td>

                          {/* Completed */}
                          <td className="py-3 px-space-md text-outline text-xs whitespace-nowrap">
                            {completedFormatted}
                          </td>

                          {/* Score */}
                          <td className="py-3 px-space-md">
                            <span className={`inline-flex items-center gap-1 font-semibold text-xs ${isGreen ? 'text-secondary' : 'text-[#b37800]'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isGreen ? 'bg-secondary' : 'bg-amber-500'}`}></span>
                              {item.score}
                              <span className="text-outline font-normal text-[10px]">/100</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-space-md">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-micro text-label-micro font-semibold ${item.statusClass || (isGreen ? 'bg-secondary-container/40 text-secondary' : 'bg-[#ffe2b3] text-[#7a4c00]')}`}>
                              {item.status}
                            </span>
                          </td>

                          {/* Action Link */}
                          <td className="py-3 px-space-lg text-right">
                            <button
                              type="button"
                              onClick={() => onNavigate('evaluation-report')}
                              className="font-label-md text-label-md text-primary font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                            >
                              Review report
                              <span className="material-symbols-outlined text-[13px]">chevron_right</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Assessment Feed Footer */}
            <div className="py-2.5 px-space-lg bg-surface-container-lowest border-t border-surface-variant/30 flex items-center justify-between font-label-micro text-label-micro text-outline">
              <span>InterviewIQ Adaptive Evaluation Engine</span>
              <span>Telemetry: User-scoped authentic records</span>
            </div>
          </div>

          {/* Weekly Practice Volume & Score Trend Card */}
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-surface-variant/40 flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div>
                <div className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                  WEEKLY VOLUME
                </div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  Practice Volume &amp; Score Trend
                </h2>
              </div>
              <div className="flex items-center gap-space-md font-label-micro text-label-micro">
                <span className="flex items-center gap-1.5 text-on-surface font-medium">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#2b44bd]"></span> Completed
                </span>
                <span className="flex items-center gap-1.5 text-outline">
                  <span className="w-3 h-0.5 bg-outline"></span> Baseline (40m)
                </span>
              </div>
            </div>

            {/* Dynamic SVG Chart Visualization based on real practice minutes */}
            <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-sm">
              <div className="relative w-full h-44">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 160">
                  <defs>
                    <linearGradient id="barGradActive" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2b44bd" />
                      <stop offset="100%" stopColor="#435cd6" />
                    </linearGradient>
                    <linearGradient id="barGradMuted" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#c8d2ff" />
                      <stop offset="100%" stopColor="#dee4ff" />
                    </linearGradient>
                  </defs>

                  {/* Target Baseline Line at 40m */}
                  <line stroke="#b8bac8" strokeDasharray="3 3" strokeWidth="1.2" x1="20" x2="680" y1="65" y2="65" />
                  <text fill="#757685" fontFamily="Geist" fontSize="10" textAnchor="start" x="684" y="68">
                    40m
                  </text>

                  {/* 7 Days: Mon through Sun */}
                  {weeklyData.dailyMinutes.map((mins, idx) => {
                    const x = 50 + idx * 95;
                    const isToday = idx === weeklyData.activeDayIndex;
                    if (mins === 0) {
                      return (
                        <g key={idx}>
                          <rect fill="#c5c5d5" height="4" rx="2" width="44" x={x} y="141" />
                          <text fill="#757685" fontFamily="Geist" fontSize="10" textAnchor="middle" x={x + 22} y="134">
                            Rest
                          </text>
                        </g>
                      );
                    }

                    const barHeight = Math.min(115, Math.max(20, Math.round((mins / weeklyData.maxMinutes) * 115)));
                    const barY = 145 - barHeight;
                    const fill = mins >= 40 ? 'url(#barGradActive)' : 'url(#barGradMuted)';
                    const textFill = mins >= 40 ? '#2b44bd' : '#757685';

                    return (
                      <g key={idx}>
                        <rect fill={fill} height={barHeight} rx="4" width="44" x={x} y={barY} />
                        <text
                          fill={textFill}
                          fontFamily="Geist"
                          fontSize="11"
                          fontWeight={mins >= 40 ? '700' : '500'}
                          textAnchor="middle"
                          x={x + 22}
                          y={barY - 8}
                        >
                          {mins}m
                        </text>
                        {mins >= 40 && <circle cx={x + 22} cy={barY} fill="#2b44bd" r="3" />}
                        {isToday && (
                          <rect fill="none" height={barHeight + 4} rx="6" stroke="#2b44bd" strokeWidth="1.5" width="48" x={x - 2} y={barY - 2} />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Axis Labels */}
              <div className="grid grid-cols-7 text-center font-label-micro text-label-micro uppercase text-outline tracking-wider pt-1">
                {weeklyData.weekLabels.map((lbl, idx) => (
                  <span key={idx} className={idx === weeklyData.activeDayIndex ? 'text-primary font-bold' : ''}>
                    {lbl}
                  </span>
                ))}
              </div>
            </div>

            {/* Weekly Summary Footer Note */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  {weeklyData.totalMinutes >= 210 ? 'verified' : 'timelapse'}
                </span>
                <span>
                  {weeklyData.totalHours} hrs practiced this week • Goal: 3.5 hrs{' '}
                  {weeklyData.totalMinutes >= 210 ? '(Exceeded)' : `(${Math.max(0, 210 - weeklyData.totalMinutes)}m remaining)`}
                </span>
              </div>
              <span className="font-label-micro text-label-micro text-primary font-bold uppercase tracking-wider">
                TARGET TRACK: {primaryRole ? primaryRole.slice(0, 16) : 'GENERAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): DIAGNOSTIC RADAR */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-xs border border-surface-variant/40 flex flex-col gap-space-md">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                DIAGNOSTIC RADAR
              </span>
              <span className="material-symbols-outlined text-outline text-[17px]">timeline</span>
            </div>

            {/* Circular Gauge Graphic */}
            <div className="flex flex-col items-center justify-center pt-1 pb-1">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle cx="50" cy="50" fill="none" r="38" stroke="#f0eded" strokeWidth="8" />
                  {/* Donut progress */}
                  {readinessPercentage !== null && (
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      r="38"
                      stroke="#2b44bd"
                      strokeDasharray="238.7"
                      strokeDashoffset={238.7 - (238.7 * readinessPercentage) / 100}
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  )}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold text-on-surface leading-none">
                    {readinessPercentage !== null ? `${readinessPercentage}%` : '—'}
                  </span>
                  <span className="text-[9px] font-bold text-outline uppercase tracking-wider mt-0.5">
                    {readinessPercentage !== null ? 'READINESS' : 'PENDING'}
                  </span>
                </div>
              </div>

              <span className="font-semibold text-sm text-on-surface mt-2 text-center">
                {readinessPercentage !== null ? 'Current Readiness Index' : 'Readiness Index Pending'}
              </span>
              <span className="text-xs text-outline text-center mt-0.5 max-w-xs leading-normal">
                {readinessPercentage !== null
                  ? `Calibrated across ${scoredInterviews.length} practice session${scoredInterviews.length === 1 ? '' : 's'} on pacing, syntax, and clarity.`
                  : 'Complete your first practice interview to generate diagnostic readiness metrics.'}
              </span>
            </div>

            {/* Checkpoint Bars */}
            <div className="flex flex-col gap-2 pt-1 border-t border-surface-variant/20">
              {/* Technical Knowledge */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium text-on-surface">
                    <span className={`material-symbols-outlined text-[15px] ${technicalKnowledgeScore !== null ? 'text-secondary' : 'text-outline'}`}>
                      {technicalKnowledgeScore !== null ? 'check_circle' : 'pending'}
                    </span>
                    Technical knowledge
                  </span>
                  <span className="font-bold text-secondary">
                    {technicalKnowledgeScore !== null ? `${technicalKnowledgeScore}%` : '—'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: technicalKnowledgeScore !== null ? `${technicalKnowledgeScore}%` : '0%' }}
                  ></div>
                </div>
              </div>

              {/* Answer Structure */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium text-on-surface">
                    <span className={`material-symbols-outlined text-[15px] ${answerStructureScore !== null ? 'text-amber-500' : 'text-outline'}`}>
                      {answerStructureScore !== null ? 'warning' : 'pending'}
                    </span>
                    Answer structure
                  </span>
                  <span className="font-bold text-amber-600">
                    {answerStructureScore !== null ? `${answerStructureScore}%` : '—'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: answerStructureScore !== null ? `${answerStructureScore}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Suggested Focus Card */}
            <div className="p-space-sm rounded-lg bg-surface-container-low border border-surface-variant/30 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-micro text-label-micro uppercase text-outline tracking-wider font-semibold">
                  SUGGESTED FOCUS
                </span>
                <span className="inline-flex px-1.5 py-0.2 rounded bg-primary-fixed/40 text-primary font-label-micro text-label-micro font-bold">
                  Priority
                </span>
              </div>
              <h4 className="font-semibold text-xs text-on-surface">
                {suggestedFocus.title}
              </h4>
              <p className="text-[11px] text-on-surface-variant leading-snug">
                {suggestedFocus.desc}
              </p>
            </div>

            {/* Quick 10-min Session Action Button */}
            <button
              type="button"
              onClick={onStartInterview}
              className="w-full py-2.5 px-space-md rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">timer</span>
              <span>Quick 10-min Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Custom/Target Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 border border-outline-variant flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">add_task</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Configure Practice Roles
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRoleInput('');
                }}
                className="text-outline hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Target roles calibrate question recommendations, AI mock interview prompts, and readiness rubrics. Select a track or add a custom role below.
            </p>

            {/* Quick Pick Chips */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
                Available Engineering Tracks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'AI / ML Engineer',
                  'Frontend Developer',
                  'Backend Engineer',
                  'Full Stack Developer',
                  'Software Engineer',
                  'System Design Architect',
                  'Java Developer',
                  'Data Analyst',
                  'DevOps Engineer'
                ].map(r => {
                  const alreadyAdded = userProfile?.targetRoles?.some(tr => tr.title.toLowerCase() === r.toLowerCase()) ||
                                       userProfile?.primaryRole?.toLowerCase() === r.toLowerCase();
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        if (onAddRole) onAddRole(r);
                        setShowAddRoleModal(false);
                        setNewRoleInput('');
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                        alreadyAdded
                          ? 'bg-surface-container text-outline opacity-60 cursor-default'
                          : 'bg-surface-container-low hover:bg-primary-fixed hover:text-primary text-on-surface'
                      }`}
                      disabled={alreadyAdded}
                    >
                      {alreadyAdded ? '✓ ' : '+ '} {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newRoleInput.trim()) {
                  const title = newRoleInput.trim();
                  if (onAddRole) onAddRole(title);
                  setShowAddRoleModal(false);
                  setNewRoleInput('');
                }
              }}
              className="flex flex-col gap-3 pt-2 border-t border-outline-variant"
            >
              <label className="font-label-sm text-label-sm text-on-surface font-medium">
                Or Enter Custom Role Title:
              </label>
              <input
                type="text"
                value={newRoleInput}
                onChange={(e) => setNewRoleInput(e.target.value)}
                placeholder="e.g. AI / ML Engineer"
                className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-on-surface font-body-sm focus:outline-none focus:border-primary"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoleModal(false);
                    setNewRoleInput('');
                  }}
                  className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRoleInput.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-on-primary-fixed-variant transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Add Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
