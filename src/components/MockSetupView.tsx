import React, { useState } from 'react';
import { InterviewConfig, UserProfile } from '../types';
import { InterviewSetupConfirmationModal } from './InterviewSetupConfirmationModal';

interface MockSetupViewProps {
  config: InterviewConfig;
  onConfigChange: (newConfig: InterviewConfig) => void;
  onStartSession: () => void;
  userProfile?: UserProfile | null;
  onOpenResumeModal?: () => void;
  onAddRole?: (role: string) => void;
}

export const MockSetupView: React.FC<MockSetupViewProps> = ({
  config,
  onConfigChange,
  onStartSession,
  userProfile,
  onOpenResumeModal,
  onAddRole,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');

  // Standard fallback roles if profile is not present
  const defaultRoles = [
    {
      title: 'Frontend Developer',
      desc: 'UI Architecture, React, CSS, Web Vitals & Hydration',
      icon: 'code'
    },
    {
      title: 'Backend Developer',
      desc: 'APIs, Distributed Databases, Scalability & Queues',
      icon: 'database'
    },
    {
      title: 'Full Stack Developer',
      desc: 'End-to-end Systems, Integrations, Auth & State',
      icon: 'layers'
    },
    {
      title: 'Java Developer',
      desc: 'OOP Principles, JVM Internals, Spring Boot, Threads',
      icon: 'coffee'
    },
    {
      title: 'Data Analyst',
      desc: 'SQL Performance, Metrics Modeling, Python & Cohorts',
      icon: 'query_stats'
    },
    {
      title: 'Software Engineer',
      desc: 'Algorithms, Data Structures, Complexity Analysis',
      icon: 'terminal'
    },
    {
      title: 'AI / ML Engineer',
      desc: 'LLMs, Transformers, Fine-Tuning, RAG & MLOps Pipelines',
      icon: 'psychology'
    }
  ];

  // ONLY show roles that are in candidate's resume (or configured tracks). Do NOT mix unwanted default roles.
  const rawTargetRoles = userProfile?.targetRoles || [];
  const primaryRoleTitle = userProfile?.primaryRole || rawTargetRoles[0]?.title || config.role;
  const analyzedRoles = [...rawTargetRoles];
  if (userProfile?.primaryRole) {
    const pRole = userProfile.primaryRole;
    if (!analyzedRoles.some(r => r.title.toLowerCase() === pRole.toLowerCase())) {
      analyzedRoles.unshift({
        title: pRole,
        desc: `${pRole} Architecture, Models, and Systems`,
        match: 95,
        reason: 'Primary target role configured in profile'
      });
    }
  }

  const roles = analyzedRoles.length > 0 
    ? analyzedRoles.map((ar, idx) => ({
        title: ar.title,
        desc: ar.desc || `${ar.title} Systems & Practice`,
        icon: 'stars',
        isAnalyzed: true,
        isPrimary: ar.title === primaryRoleTitle || idx === 0,
        match: ar.match || 92,
        reason: ar.reason
      }))
    : defaultRoles.map((dr, idx) => ({ ...dr, isPrimary: idx === 0, isAnalyzed: false }));

  const levels = ['Beginner', 'Entry Level', 'Intermediate', 'Experienced'];

  const types = [
    {
      type: 'Technical',
      sub: 'Coding, Systems & Core',
      icon: 'terminal'
    },
    {
      type: 'Behavioral',
      sub: 'STAR Method & Conflict',
      icon: 'psychology'
    },
    {
      type: 'HR',
      displayTitle: 'HR Screening',
      sub: 'Culture Fit & Goals',
      icon: 'badge'
    },
    {
      type: 'Mixed',
      sub: 'Balanced Assessment',
      icon: 'tune'
    }
  ];

  const difficulties = [
    { name: 'Easy', sub: 'Foundations', color: 'bg-secondary' },
    { name: 'Medium', sub: 'Standard', color: 'bg-tertiary-container' },
    { name: 'Hard', sub: 'Edge-cases', color: 'bg-error' }
  ];

  const durations = [
    { time: '10 min', sub: '3 questions', value: '10 min (3 questions)' },
    { time: '20 min', sub: '5 questions', value: '20 min (5 questions)' },
    { time: '30 min', sub: '8 questions', value: '30 min (8 questions)' }
  ];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Context Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-label-micro text-label-micro text-outline uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Mock Interviews</span>
            <span>/</span>
            <span className="text-primary font-semibold">Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-on-surface tracking-tight leading-tight">
            Prepare for an interview
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1.5 font-normal">
            Configure a tailored AI practice simulation calibrated to your resume and career track.
          </p>
        </div>

        {/* Telemetry status indicator pill */}
        <div className="flex items-center gap-space-sm bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm self-start md:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span className="font-label-sm text-label-sm text-on-surface font-medium">NVIDIA Nemotron 3.5 Active</span>
          <span className="font-label-micro text-label-micro text-outline px-1.5 py-0.5 rounded bg-surface-container">
            Live AI
          </span>
        </div>
      </div>

      {/* Prominent Resume-Calibrated Major Role Banner */}
      {userProfile && (
        <div className="mb-space-lg bg-surface-container-lowest border-2 border-primary/30 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">assignment_turned_in</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  Resume Calibrated Track:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-bold text-xs tracking-wide shadow-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">stars</span>
                  {primaryRoleTitle}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold">
                  {userProfile.experienceLevel || config.level} Level
                </span>
                <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[11px] font-semibold">
                  {userProfile.targetRoles?.[0]?.match || 96}% Alignment
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant mt-1">
                Candidate resume was analyzed: mock questions, interview rubrics, and bar-raiser evaluations are dynamically calibrated for <strong className="text-on-surface">{primaryRoleTitle}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenResumeModal && (
              <button
                type="button"
                onClick={onOpenResumeModal}
                className="font-label-sm text-label-sm text-primary hover:text-on-primary-fixed-variant flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                <span>Update Resume</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-1.5 bg-primary hover:bg-on-primary-fixed-variant text-on-primary rounded-lg font-label-md text-label-md font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span>Launch Mock Interview</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Main 2-Column Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
        {/* Left Column: Interview Configuration (~64% -> lg:col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* SECTION 1: Target Role */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-on-surface font-label-micro text-label-micro font-semibold">
                  01
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Target Role
                </h2>
                {userProfile && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed/30 text-primary font-label-micro text-label-micro font-medium">
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                    Resume Calibrated
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(true)}
                  className="font-label-micro text-label-micro text-primary hover:text-on-primary-fixed-variant flex items-center gap-1 font-semibold px-2 py-1 rounded bg-primary-fixed/20 hover:bg-primary-fixed/30 cursor-pointer transition-colors shadow-xs"
                  title="Add target role to practice"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Add Role</span>
                </button>
                {onOpenResumeModal && (
                  <button
                    type="button"
                    onClick={onOpenResumeModal}
                    className="font-label-micro text-label-micro text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">assignment_ind</span>
                    {userProfile ? 'Update Resume' : 'Analyze Resume'}
                  </button>
                )}
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline">
                  Select one primary track
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
              {roles.map((r: any) => {
                const isSelected = config.role === r.title;
                return (
                  <button
                    key={r.title}
                    type="button"
                    onClick={() => onConfigChange({ ...config, role: r.title })}
                    className={`text-left p-space-md rounded-lg transition-all duration-150 flex items-start justify-between cursor-pointer group shadow-sm ${
                      isSelected
                        ? 'bg-primary-fixed/25 ring-2 ring-primary'
                        : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex flex-col pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-label-md text-label-md font-semibold transition-colors ${isSelected ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>
                          {r.title}
                        </span>
                        {r.isPrimary && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                            ⭐ Primary Role
                          </span>
                        )}
                        {r.isAnalyzed && r.match && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-semibold">
                            <span className="w-1 h-1 rounded-full bg-secondary"></span>
                            {r.match}% Resume Match
                          </span>
                        )}
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        {r.desc}
                      </span>
                    </div>
                    <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-outline'}`}>
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}

              {/* Add Custom / Extra Role Card */}
              <button
                type="button"
                onClick={() => setShowAddRoleModal(true)}
                className="p-space-md rounded-lg border-2 border-dashed border-outline-variant/60 hover:border-primary hover:bg-primary-fixed/10 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer group text-on-surface-variant hover:text-primary min-h-[72px]"
              >
                <span className="material-symbols-outlined text-[20px] text-primary group-hover:scale-110 transition-transform">add_circle</span>
                <span className="font-label-md text-label-md font-semibold">Add Target Role to Practice</span>
              </button>
            </div>
          </section>

          {/* SECTION 2: Experience Level */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-on-surface font-label-micro text-label-micro font-semibold">
                  02
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Experience Level
                </h2>
              </div>
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline">
                Adjusts question nuance
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-surface-container-low rounded-lg">
              {levels.map((lvl) => {
                const isSelected = config.level === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onConfigChange({ ...config, level: lvl })}
                    className={`py-2 px-3 rounded font-label-md text-label-md transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface font-medium'
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 3: Interview Type */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-on-surface font-label-micro text-label-micro font-semibold">
                  03
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Interview Type
                </h2>
              </div>
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline">
                Evaluation modality
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
              {types.map((t) => {
                const isSelected = config.type === t.type || (t.type === 'HR' && config.type.startsWith('HR'));
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => onConfigChange({ ...config, type: t.type === 'HR' ? 'HR Screening' : t.type })}
                    className={`p-3 rounded-lg text-left flex flex-col justify-between h-28 cursor-pointer transition-all shadow-sm ${
                      isSelected
                        ? 'bg-primary-fixed/25 ring-1 ring-primary'
                        : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-primary' : 'text-outline'}`}>
                        {t.icon}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-transparent'}`}></span>
                    </div>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface font-semibold block">
                        {t.displayTitle || t.type}
                      </span>
                      <span className="font-label-micro text-label-micro text-on-surface-variant">
                        {t.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 4 & 5: Difficulty & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            {/* Difficulty */}
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-on-surface font-label-micro text-label-micro font-semibold">
                    04
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Difficulty
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {difficulties.map((d) => {
                  const isSelected = config.difficulty === d.name;
                  return (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => onConfigChange({ ...config, difficulty: d.name })}
                      className={`py-2.5 px-2 rounded-lg text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary-fixed/25 ring-1 ring-primary shadow-sm'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${d.color}`}></span>
                        <span className={`font-label-md text-label-md ${isSelected ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>
                          {d.name}
                        </span>
                      </div>
                      <span className={`font-label-micro text-label-micro ${isSelected ? 'text-primary font-medium' : 'text-outline'}`}>
                        {d.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Duration */}
            <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-on-surface font-label-micro text-label-micro font-semibold">
                    05
                  </span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Duration
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {durations.map((dur) => {
                  const isSelected = config.duration.includes(dur.time);
                  return (
                    <button
                      key={dur.time}
                      type="button"
                      onClick={() => onConfigChange({ ...config, duration: dur.value })}
                      className={`py-2.5 px-2 rounded-lg text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary-fixed/25 ring-1 ring-primary shadow-sm'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <span className={`font-label-md text-label-md ${isSelected ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>
                        {dur.time}
                      </span>
                      <span className={`font-label-micro text-label-micro ${isSelected ? 'text-primary font-medium' : 'text-outline'}`}>
                        {dur.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* SECTION 6: Optional Job Description */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-surface-container text-on-surface font-label-micro text-label-micro font-semibold">
                  06
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Job Description
                </h2>
              </div>
              <span className="font-label-micro text-label-micro px-2 py-0.5 rounded bg-surface-container text-outline uppercase tracking-wider font-medium">
                Optional
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Paste the job description you are preparing for. Our AI will analyze requirements to synthesize realistic company-specific scenarios.
            </p>
            <div className="relative mt-1">
              <textarea
                rows={4}
                value={config.jobDescription}
                onChange={(e) => onConfigChange({ ...config, jobDescription: e.target.value })}
                placeholder="Paste requirements, tech stack details, or responsibilities here..."
                className="w-full p-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-all resize-none border border-transparent focus:border-surface-variant"
              />
              <div className="absolute bottom-2.5 right-3 font-label-micro text-label-micro text-outline pointer-events-none">
                {config.jobDescription.length} chars
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Session Summary (~36% -> lg:col-span-4) */}
        <div className="lg:col-span-4 lg:sticky lg:top-[68px] flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Card Header */}
            <div className="p-space-md bg-surface-container-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">Session Summary</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span className="font-label-micro text-label-micro font-medium uppercase tracking-wider">Configured</span>
              </div>
            </div>

            {/* Metric Tile List */}
            <div className="p-space-lg flex flex-col gap-3">
              <div className="flex items-center justify-between py-1 bg-surface-container-low/50 px-2.5 rounded">
                <span className="font-label-sm text-label-sm text-outline">Target Role</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">{config.role}</span>
              </div>

              <div className="flex items-center justify-between py-1 bg-surface-container-low/50 px-2.5 rounded">
                <span className="font-label-sm text-label-sm text-outline">Experience Level</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">{config.level}</span>
              </div>

              <div className="flex items-center justify-between py-1 bg-surface-container-low/50 px-2.5 rounded">
                <span className="font-label-sm text-label-sm text-outline">Interview Type</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">{config.type}</span>
              </div>

              <div className="flex items-center justify-between py-1 bg-surface-container-low/50 px-2.5 rounded">
                <span className="font-label-sm text-label-sm text-outline">Difficulty</span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    config.difficulty === 'Easy' ? 'bg-secondary' :
                    config.difficulty === 'Medium' ? 'bg-tertiary-container' : 'bg-error'
                  }`}></span>
                  <span className="font-label-md text-label-md text-on-surface font-semibold">{config.difficulty}</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 bg-surface-container-low/50 px-2.5 rounded">
                <span className="font-label-sm text-label-sm text-outline">Est. Duration</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">{config.duration}</span>
              </div>

              <div className="flex items-center justify-between py-1 bg-surface-container-low/50 px-2.5 rounded">
                <span className="font-label-sm text-label-sm text-outline">Job Description</span>
                <span className={`font-label-sm text-label-sm font-medium ${
                  config.jobDescription ? 'text-secondary font-semibold' : 'text-outline'
                }`}>
                  {config.jobDescription ? `Provided (${config.jobDescription.length} chars)` : 'Not provided'}
                </span>
              </div>

              {/* Callout Note */}
              <div className="mt-2 p-3 rounded-lg bg-surface-container-low flex gap-2.5 items-start">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">auto_awesome</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold leading-tight">
                    Dynamic AI Calibration
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                    AI Coach adapts conversational pacing, follow-ups, and grading criteria to your chosen level.
                  </span>
                </div>
              </div>

              {/* Start Interview Primary CTA */}
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="mt-2 w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-medium transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Start Interview</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
                Session Protocol
              </span>
              <span className="font-label-micro text-label-micro text-secondary font-semibold">
                Audio &amp; Video Ready
              </span>
            </div>
            <ul className="flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[16px]">mic</span>
                <span>Microphone access will be requested on launch.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[16px]">timer</span>
                <span>Pacing indicators show speech rate in real time.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[16px]">analytics</span>
                <span>Comprehensive score matrix generated instantly.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Role-Calibrated Confirmation & Preflight Diagnostics Modal */}
      <InterviewSetupConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirmLaunch={() => {
          setShowModal(false);
          onStartSession();
        }}
        config={config}
        userProfile={userProfile}
        onConfigChange={onConfigChange}
      />

      {/* Add Custom/Target Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl max-w-md w-full p-6 border border-outline-variant flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">add_task</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Add Target Practice Role
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddRoleModal(false);
                  setNewRoleInput('');
                }}
                className="text-outline hover:text-on-surface p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Want to practice interviews outside your primary resume roles? Select a standard track or enter a custom role title below.
            </p>

            {/* Quick Pick Chips */}
            <div className="flex flex-col gap-1.5">
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
                Quick Select Tracks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Frontend Developer',
                  'Backend Developer',
                  'Full Stack Developer',
                  'Java Developer',
                  'Data Analyst',
                  'Software Engineer',
                  'DevOps Engineer',
                  'Machine Learning Engineer'
                ].map(r => {
                  const alreadyAdded = roles.some((ex: any) => ex.title.toLowerCase() === r.toLowerCase());
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        if (onAddRole) onAddRole(r);
                        onConfigChange({ ...config, role: r });
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
                  onConfigChange({ ...config, role: title });
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
                placeholder="e.g. Distributed Systems Architect"
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
                  Add &amp; Configure Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
