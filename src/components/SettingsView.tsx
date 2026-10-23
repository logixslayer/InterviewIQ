import React, { useState } from 'react';

const SETTINGS_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCjjxolxnff2-9s14RCmPG3ueg30WrwDybKqFNnE1UvPL3k1HN94Rd2FC6riNujEzSWC38cUUKaNmqTieBNIPs5bvFrmnz-lKEbmPj5y0s7neS0L72ofWH5R-d9nUanjfOkEJbzBcQ3gulOGw7N2O-0QgbtQiHNCuDRBGarnADKM2JfyTNHj--imBtE6nRMRYjvtr4Cp-9K8J9A5kSgAT1W2HArG_MIA_tSFTQnGv3dH1zGUyMMrcJYRQ";

export const SettingsView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'profile' | 'coach' | 'hardware' | 'notifications' | 'privacy'>('profile');
  const [showToast, setShowToast] = useState(false);
  const [voicePersona, setVoicePersona] = useState<'Nova' | 'Alloy' | 'Echo'>('Nova');
  const [strictness, setStrictness] = useState<'Lenient' | 'Calibrated' | 'Rigorous'>('Calibrated');
  const [dynamicProbing, setDynamicProbing] = useState(true);
  const [realtimeTelemetry, setRealtimeTelemetry] = useState(true);
  const [eyeContactCoaching, setEyeContactCoaching] = useState(true);
  const [modelTrainingOptOut, setModelTrainingOptOut] = useState(true);
  const [retentionPeriod, setRetentionPeriod] = useState('30 days');
  const [companies, setCompanies] = useState(['Meta', 'Google', 'Stripe', 'Vercel']);
  const [newCompanyInput, setNewCompanyInput] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2400);
  };

  const removeCompany = (name: string) => {
    setCompanies(companies.filter(c => c !== name));
  };

  const addCompany = () => {
    if (newCompanyInput.trim() && !companies.includes(newCompanyInput.trim())) {
      setCompanies([...companies, newCompanyInput.trim()]);
      setNewCompanyInput('');
      setShowAddCompany(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Content Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-on-surface tracking-tight leading-tight">Settings</h1>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary mr-1.5 animate-pulse"></span>
              Auto-sync active
            </span>
          </div>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1 font-normal max-w-2xl">
            Configure your interview simulation parameters, AI evaluation feedback rigor, hardware telemetry, and profile credentials.
          </p>
        </div>

        <div className="flex items-center gap-space-sm shrink-0">
          <button 
            type="button"
            onClick={handleSave}
            className="px-space-md h-[34px] rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-label-md shadow-sm cursor-pointer"
          >
            Discard Changes
          </button>
          <button 
            type="button"
            onClick={handleSave}
            className="px-space-md h-[34px] rounded bg-primary-container text-on-primary hover:bg-primary transition-all font-label-md text-label-md shadow-sm flex items-center gap-1.5 font-semibold cursor-pointer active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
            Save Preferences
          </button>
        </div>
      </div>

      {/* Main Settings Workspace Grid */}
      <div className="grid grid-cols-12 gap-space-lg">
        {/* Sub-navigation Sidebar Column (3 cols) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-space-sm">
          <nav className="bg-surface-container-lowest rounded-lg p-space-xs shadow-sm flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className={`flex items-center justify-between px-space-md py-2.5 rounded font-label-md text-label-md transition-colors text-left w-full cursor-pointer ${
                activeSection === 'profile'
                  ? 'bg-surface-container-low text-primary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[17px]">person</span>
                <span>Profile &amp; Career Goals</span>
              </div>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('coach')}
              className={`flex items-center justify-between px-space-md py-2.5 rounded font-label-md text-label-md transition-colors text-left w-full cursor-pointer ${
                activeSection === 'coach'
                  ? 'bg-surface-container-low text-primary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[17px]">smart_toy</span>
                <span>AI Coach &amp; Evaluation</span>
              </div>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('hardware')}
              className={`flex items-center justify-between px-space-md py-2.5 rounded font-label-md text-label-md transition-colors text-left w-full cursor-pointer ${
                activeSection === 'hardware'
                  ? 'bg-surface-container-low text-primary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[17px]">videocam</span>
                <span>Audio &amp; Hardware</span>
              </div>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('notifications')}
              className={`flex items-center justify-between px-space-md py-2.5 rounded font-label-md text-label-md transition-colors text-left w-full cursor-pointer ${
                activeSection === 'notifications'
                  ? 'bg-surface-container-low text-primary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[17px]">notifications</span>
                <span>Notifications</span>
              </div>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('privacy')}
              className={`flex items-center justify-between px-space-md py-2.5 rounded font-label-md text-label-md transition-colors text-left w-full cursor-pointer ${
                activeSection === 'privacy'
                  ? 'bg-surface-container-low text-primary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[17px]">security</span>
                <span>Data &amp; Privacy</span>
              </div>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </nav>

          {/* Coach Status Card */}
          <div className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                Coach Engine
              </span>
              <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-micro text-label-micro font-medium">
                v4.2 Neural
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface">
              Current strictness level is calibrated to <strong className="font-semibold text-primary">Senior Frontend L5</strong>.
            </p>
            <div className="bg-surface-container-low rounded p-space-xs flex items-center justify-between font-label-micro text-label-micro text-outline font-medium">
              <span>Latency: ~210ms</span>
              <span>STT: Whisper Large v3</span>
            </div>
          </div>
        </div>

        {/* Main Configuration Stream (9 cols) */}
        <div className="col-span-12 lg:col-span-9 flex flex-col gap-space-lg">
          {/* Section 1: Profile & Target Roles */}
          <section className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[19px]">badge</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Profile &amp; Target Roles
                </h2>
              </div>
              <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                Core Parameters
              </span>
            </div>

            {/* Avatar & Identity Quick Strip */}
            <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <img
                  className="w-14 h-14 rounded-full object-cover shrink-0 shadow-sm ring-2 ring-surface-container-lowest"
                  alt="Alex Morgan"
                  src={SETTINGS_AVATAR_URL}
                />
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Alex Morgan</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">alex.morgan@university.edu</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-[13px] text-secondary">verified</span>
                    <span className="font-label-micro text-label-micro text-secondary font-medium">
                      Verified University Account
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-space-sm shrink-0">
                <button
                  type="button"
                  className="px-space-md h-[30px] rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md shadow-sm transition-colors cursor-pointer"
                >
                  Change avatar
                </button>
                <button
                  type="button"
                  className="px-space-sm h-[30px] rounded text-error hover:bg-error-container/20 font-label-md text-label-md transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-medium">Full Name</label>
                <input
                  type="text"
                  defaultValue="Alex Morgan"
                  className="h-[34px] px-3 rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-surface-variant transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-medium">Current Career Stage</label>
                <select className="h-[34px] px-3 rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-surface-variant transition-colors">
                  <option>Senior Undergrad / Active Job Hunter</option>
                  <option>Early Career Professional (1-2 yrs)</option>
                  <option>Mid-Level Engineer (3-5 yrs)</option>
                  <option>Senior Engineer (6+ yrs)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-medium">Primary Target Role</label>
                <select className="h-[34px] px-3 rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-surface-variant transition-colors">
                  <option>Frontend Engineer L4/L5</option>
                  <option>Full-Stack Software Engineer</option>
                  <option>UI/UX Product Designer</option>
                  <option>Engineering Manager</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-medium">Target Interview Date</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    defaultValue="October 28, 2026"
                    className="w-full h-[34px] pl-3 pr-8 rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-surface-variant transition-colors"
                  />
                  <span className="material-symbols-outlined text-[16px] text-outline absolute right-2.5 pointer-events-none">
                    calendar_today
                  </span>
                </div>
              </div>
            </div>

            {/* Target Companies Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-medium">Target Company Archetypes</label>
              <div className="flex flex-wrap items-center gap-space-xs p-2 rounded bg-surface-container-low">
                {companies.map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm">
                    <span>{c}</span>
                    <button
                      type="button"
                      onClick={() => removeCompany(c)}
                      className="text-outline hover:text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </span>
                ))}

                {showAddCompany ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={newCompanyInput}
                      onChange={(e) => setNewCompanyInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addCompany(); }}
                      placeholder="Company name..."
                      className="h-6 px-2 text-xs rounded bg-surface-container-lowest text-on-surface focus:outline-none"
                    />
                    <button type="button" onClick={addCompany} className="text-xs px-1.5 py-0.5 rounded bg-primary text-on-primary">
                      Add
                    </button>
                    <button type="button" onClick={() => setShowAddCompany(false)} className="text-xs text-outline">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCompany(true)}
                    className="h-6 px-2 rounded text-outline hover:text-on-surface font-label-sm text-label-sm flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add target
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: AI Coach Persona & Evaluation Rigor */}
          <section className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[19px]">psychology</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  AI Coach &amp; Simulation Persona
                </h2>
              </div>
              <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                Simulation Logic
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-on-surface font-medium">Interviewer Voice &amp; Attitude</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                {/* Nova */}
                <div
                  onClick={() => setVoicePersona('Nova')}
                  className={`relative flex flex-col gap-1.5 p-space-md rounded-lg cursor-pointer transition-all ${
                    voicePersona === 'Nova'
                      ? 'bg-surface-container-low ring-1 ring-primary'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[16px]">record_voice_over</span>
                      Nova
                    </span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      voicePersona === 'Nova' ? 'bg-primary text-on-primary' : 'bg-surface-container'
                    }`}>
                      {voicePersona === 'Nova' && <span className="material-symbols-outlined text-[12px]">check</span>}
                    </span>
                  </div>
                  <span className="font-label-micro text-label-micro text-primary font-medium">
                    Direct &amp; Technical (Default)
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-tight mt-1">
                    Concise cadence. Prioritizes architecture depth, algorithmic trade-offs, and edge cases.
                  </p>
                </div>

                {/* Alloy */}
                <div
                  onClick={() => setVoicePersona('Alloy')}
                  className={`relative flex flex-col gap-1.5 p-space-md rounded-lg cursor-pointer transition-all ${
                    voicePersona === 'Alloy'
                      ? 'bg-surface-container-low ring-1 ring-primary'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-outline text-[16px]">record_voice_over</span>
                      Alloy
                    </span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      voicePersona === 'Alloy' ? 'bg-primary text-on-primary' : 'bg-surface-container'
                    }`}>
                      {voicePersona === 'Alloy' && <span className="material-symbols-outlined text-[12px]">check</span>}
                    </span>
                  </div>
                  <span className="font-label-micro text-label-micro text-outline font-medium">
                    Supportive &amp; Encouraging
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-tight mt-1">
                    Collaborative tone with constructive hints when you face roadblocks during coding.
                  </p>
                </div>

                {/* Echo */}
                <div
                  onClick={() => setVoicePersona('Echo')}
                  className={`relative flex flex-col gap-1.5 p-space-md rounded-lg cursor-pointer transition-all ${
                    voicePersona === 'Echo'
                      ? 'bg-surface-container-low ring-1 ring-primary'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-outline text-[16px]">record_voice_over</span>
                      Echo
                    </span>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      voicePersona === 'Echo' ? 'bg-primary text-on-primary' : 'bg-surface-container'
                    }`}>
                      {voicePersona === 'Echo' && <span className="material-symbols-outlined text-[12px]">check</span>}
                    </span>
                  </div>
                  <span className="font-label-micro text-label-micro text-outline font-medium">
                    Executive &amp; Challenging
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-tight mt-1">
                    Drills into business impact, scale thresholds, and behavioral ownership tradeoffs.
                  </p>
                </div>
              </div>
            </div>

            {/* Evaluation Strictness Level */}
            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-surface font-medium">Evaluation Strictness Level</label>
                <span className="font-label-micro text-label-micro text-primary font-medium">
                  Calibrated for L5 Frontend
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-1.5 rounded-lg">
                {(['Lenient', 'Calibrated', 'Rigorous'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setStrictness(mode)}
                    className={`py-2 px-3 rounded text-center font-label-md text-label-md transition-all cursor-pointer ${
                      strictness === mode
                        ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface font-medium'
                    }`}
                  >
                    {mode === 'Lenient' ? 'Lenient (Entry L3)' : mode === 'Calibrated' ? 'Calibrated (Mid-Senior L5)' : 'Rigorous (Staff L6+)'}
                  </button>
                ))}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                In Mid-Senior mode, answers that do not mention scalability metrics or maintainability patterns will trigger automated follow-up queries.
              </p>
            </div>

            {/* Interruption Behavior & Cadence Toggles */}
            <div className="flex flex-col gap-space-sm pt-2">
              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex flex-col pr-4">
                  <span className="font-label-md text-label-md text-on-surface font-medium">Dynamic Probing Interjection</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                    Allow AI Coach to politely interject when answers wander or lack concrete operational metrics.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDynamicProbing(!dynamicProbing)}
                  className={`w-10 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer ${
                    dynamicProbing ? 'bg-primary-container' : 'bg-surface-container-high'
                  }`}
                >
                  <span className={`block w-3.5 h-3.5 bg-surface-container-lowest rounded-full absolute top-0.75 transition-all ${
                    dynamicProbing ? 'right-1' : 'left-1'
                  }`}></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex flex-col pr-4">
                  <span className="font-label-md text-label-md text-on-surface font-medium">Real-Time Cadence Telemetry</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                    Display subtle pacing indicators (words-per-minute meter) at the bottom corner of active mocks.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRealtimeTelemetry(!realtimeTelemetry)}
                  className={`w-10 h-5 rounded-full relative transition-colors shrink-0 cursor-pointer ${
                    realtimeTelemetry ? 'bg-primary-container' : 'bg-surface-container-high'
                  }`}
                >
                  <span className={`block w-3.5 h-3.5 bg-surface-container-lowest rounded-full absolute top-0.75 transition-all ${
                    realtimeTelemetry ? 'right-1' : 'left-1'
                  }`}></span>
                </button>
              </div>
            </div>
          </section>

          {/* Section 3: Audio, Video & Hardware Telemetry */}
          <section className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[19px]">tune</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Audio, Video &amp; Hardware Telemetry
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 font-label-micro text-label-micro text-secondary font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Hardware Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface font-medium">Primary Microphone</label>
                <div className="flex items-center justify-between p-space-sm rounded bg-surface-container-low">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-outline text-[18px]">mic</span>
                    <span className="font-body-sm text-body-sm text-on-surface truncate">MacBook Pro Microphone (Built-in)</span>
                  </div>
                  <span className="font-label-micro text-label-micro text-secondary font-medium shrink-0">Level: Normal</span>
                </div>
                <div className="flex items-center gap-1.5 px-1 py-1">
                  <div className="w-2 h-3 rounded-xs bg-secondary"></div>
                  <div className="w-2 h-3 rounded-xs bg-secondary"></div>
                  <div className="w-2 h-3 rounded-xs bg-secondary"></div>
                  <div className="w-2 h-3 rounded-xs bg-secondary"></div>
                  <div className="w-2 h-3 rounded-xs bg-secondary"></div>
                  <div className="w-2 h-3 rounded-xs bg-secondary-container"></div>
                  <div className="w-2 h-3 rounded-xs bg-surface-variant"></div>
                  <div className="w-2 h-3 rounded-xs bg-surface-variant"></div>
                  <div className="w-2 h-3 rounded-xs bg-surface-variant"></div>
                  <span className="ml-2 font-label-micro text-label-micro text-outline font-mono">Gain: -18dB</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-label-md text-label-md text-on-surface font-medium">Camera Source</label>
                <div className="flex items-center justify-between p-space-sm rounded bg-surface-container-low">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-outline text-[18px]">videocam</span>
                    <span className="font-body-sm text-body-sm text-on-surface truncate">FaceTime HD Camera (1080p)</span>
                  </div>
                  <span className="font-label-micro text-label-micro text-secondary font-medium shrink-0">Connected</span>
                </div>
                <div className="flex items-center justify-between px-1 py-1 mt-0.5">
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">AI Eye-contact posture coaching</span>
                  <button
                    type="button"
                    onClick={() => setEyeContactCoaching(!eyeContactCoaching)}
                    className={`w-8 h-4 rounded-full relative transition-colors shrink-0 cursor-pointer ${
                      eyeContactCoaching ? 'bg-primary-container' : 'bg-surface-container-high'
                    }`}
                  >
                    <span className={`block w-2.5 h-2.5 bg-surface-container-lowest rounded-full absolute top-0.75 transition-all ${
                      eyeContactCoaching ? 'right-1' : 'left-1'
                    }`}></span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-lg p-space-sm flex flex-col sm:flex-row items-center justify-between gap-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[18px]">noise_control_off</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-medium">Echo Cancellation &amp; Studio Noise Gate</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                    Processes raw audio on-device prior to streaming to STT transcription.
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-label-micro text-label-micro font-medium shadow-sm shrink-0">
                Enabled (Neural)
              </span>
            </div>
          </section>

          {/* Section 4: Data, Privacy & Practice Records */}
          <section className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[19px]">lock_reset</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Data, Privacy &amp; Recordings
                </h2>
              </div>
              <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider font-semibold">
                Security Guardrails
              </span>
            </div>

            <div className="flex flex-col gap-space-sm">
              <div className="flex items-start justify-between p-space-sm bg-surface-container-low rounded-lg gap-space-md">
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-md text-label-md text-on-surface font-medium">Model Training Opt-out</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] max-w-xl">
                    Strict Zero-Data Retention policy. Ensure interview transcripts and audio responses are never used to train global LLM models.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModelTrainingOptOut(!modelTrainingOptOut)}
                  className={`w-10 h-5 rounded-full relative transition-colors shrink-0 mt-0.5 cursor-pointer ${
                    modelTrainingOptOut ? 'bg-primary-container' : 'bg-surface-container-high'
                  }`}
                >
                  <span className={`block w-3.5 h-3.5 bg-surface-container-lowest rounded-full absolute top-0.75 transition-all ${
                    modelTrainingOptOut ? 'right-1' : 'left-1'
                  }`}></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-medium">Session Transcript Retention</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Automatically purge raw audio and score transcripts after expiration.</span>
                </div>
                <select
                  value={retentionPeriod}
                  onChange={(e) => setRetentionPeriod(e.target.value)}
                  className="h-[30px] px-2.5 rounded bg-surface-container-lowest text-on-surface font-label-md text-label-md focus:outline-none shadow-sm cursor-pointer"
                >
                  <option>Keep for 7 days</option>
                  <option>Keep for 30 days</option>
                  <option>Keep for 90 days</option>
                  <option>Never retain audio</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-medium">Download Practice Archives</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Export all 24 mock sessions, transcripts, audio recordings, and rubric grades.</span>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-space-md h-[30px] rounded bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-label-md shadow-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">download</span>
                  Export ZIP
                </button>
              </div>
            </div>

            {/* Danger Zone Box */}
            <div className="p-space-md rounded-lg bg-error-container/20 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mt-space-xs border border-error-container/40">
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-error font-semibold">Delete Account &amp; Simulation History</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Permanently erase your target role models, scorecard history, and profile data.</span>
              </div>
              <button
                type="button"
                onClick={() => alert("Simulation and profile data reset.")}
                className="px-space-md h-[30px] rounded bg-surface-container-lowest text-error hover:bg-error-container hover:text-on-error-container font-label-md text-label-md shadow-sm transition-colors shrink-0 cursor-pointer font-medium"
              >
                Delete Profile
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Toast Notification Simulator */}
      <div 
        className={`fixed bottom-6 right-6 px-space-md py-space-sm rounded-lg bg-on-surface text-surface font-label-md text-label-md shadow-lg flex items-center gap-2 transition-all duration-300 z-50 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
        }`}
      >
        <span className="material-symbols-outlined text-secondary-fixed text-[18px]">check_circle</span>
        <span>Preferences saved successfully</span>
      </div>
    </div>
  );
};
