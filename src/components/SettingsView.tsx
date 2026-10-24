import React, { useState } from 'react';

const SETTINGS_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCjjxolxnff2-9s14RCmPG3ueg30WrwDybKqFNnE1UvPL3k1HN94Rd2FC6riNujEzSWC38cUUKaNmqTieBNIPs5bvFrmnz-lKEbmPj5y0s7neS0L72ofWH5R-d9nUanjfOkEJbzBcQ3gulOGw7N2O-0QgbtQiHNCuDRBGarnADKM2JfyTNHj--imBtE6nRMRYjvtr4Cp-9K8J9A5kSgAT1W2HArG_MIA_tSFTQnGv3dH1zGUyMMrcJYRQ";

export const SettingsView: React.FC<SettingsViewProps> = ({
  userSettings,
  userProfile,
  authUser,
  onSettingsUpdated,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'interview' | 'notifications' | 'privacy'>('appearance');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings State Form
  const [theme, setSelectedTheme] = useState<ThemeMode>(userSettings.theme || getStoredTheme());

  // Interview Defaults
  const [defaultRole, setDefaultRole] = useState(userSettings.interviewDefaults.defaultRole || 'Frontend Developer');
  const [defaultDifficulty, setDefaultDifficulty] = useState(userSettings.interviewDefaults.defaultDifficulty || 'Medium');
  const [defaultType, setDefaultType] = useState(userSettings.interviewDefaults.defaultType || 'Technical');
  const [duration, setDuration] = useState(userSettings.interviewDefaults.duration || '20 min (5 questions)');
  const [questionsCount, setQuestionsCount] = useState(userSettings.interviewDefaults.questionsPerSession || 5);
  const [feedbackRigor, setFeedbackRigor] = useState(userSettings.interviewDefaults.feedbackRigor || 'Calibrated');

  // Notifications
  const [practiceReminders, setPracticeReminders] = useState(userSettings.notifications.practiceReminders);
  const [weeklyProgressUpdates, setWeeklyProgressUpdates] = useState(userSettings.notifications.weeklyProgressUpdates);
  const [productAnnouncements, setProductAnnouncements] = useState(userSettings.notifications.productAnnouncements);
  const [frequency, setFrequency] = useState(userSettings.notifications.frequency || 'weekly');

  // Accessibility
  const [reducedMotion, setReducedMotion] = useState(userSettings.accessibility.reducedMotion);
  const [soundEffects, setSoundEffects] = useState(userSettings.accessibility.soundEffects);

  // Delete account confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync state if incoming userSettings changes
  useEffect(() => {
    setSelectedTheme(userSettings.theme || getStoredTheme());
    setDefaultRole(userSettings.interviewDefaults.defaultRole || 'Frontend Developer');
    setDefaultDifficulty(userSettings.interviewDefaults.defaultDifficulty || 'Medium');
    setDefaultType(userSettings.interviewDefaults.defaultType || 'Technical');
    setDuration(userSettings.interviewDefaults.duration || '20 min (5 questions)');
    setQuestionsCount(userSettings.interviewDefaults.questionsPerSession || 5);
    setFeedbackRigor(userSettings.interviewDefaults.feedbackRigor || 'Calibrated');
    setPracticeReminders(userSettings.notifications.practiceReminders);
    setWeeklyProgressUpdates(userSettings.notifications.weeklyProgressUpdates);
    setProductAnnouncements(userSettings.notifications.productAnnouncements);
    setFrequency(userSettings.notifications.frequency || 'weekly');
    setReducedMotion(userSettings.accessibility.reducedMotion);
    setSoundEffects(userSettings.accessibility.soundEffects);
  }, [userSettings]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setSelectedTheme(newTheme);
    setTheme(newTheme); // Applies to DOM and localStorage immediately
  };

  const handleSaveSettings = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setErrorMessage(null);

    const updated: UserSettings = {
      theme,
      interviewDefaults: {
        defaultRole,
        defaultLevel: defaultDifficulty === 'Hard' ? 'Experienced' : defaultDifficulty === 'Medium' ? 'Intermediate' : 'Entry Level',
        defaultType,
        defaultDifficulty,
        duration,
        questionsPerSession: questionsCount,
        feedbackRigor,
      },
      notifications: {
        practiceReminders,
        weeklyProgressUpdates,
        productAnnouncements,
        frequency,
      },
      accessibility: {
        reducedMotion,
        highContrast: false,
        soundEffects,
      },
    };

    const uid = authUser?.id || userProfile?.uid || 'anonymous';
    try {
      const saved = await saveUserSettings(uid, updated);
      onSettingsUpdated(saved);
      setToastMessage('Preferences saved successfully.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    if (!userProfile) return;
    exportUserData(userProfile, userSettings);
    setToastMessage('Export initiated: check your downloads.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      setDeleteError('Please type DELETE to confirm account removal.');
      return;
    }

    const uid = authUser?.id || userProfile?.uid;
    if (!uid) return;

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      await deleteUserAccount(uid);
      if (onSignOut) {
        onSignOut();
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account. You may need to sign out and log back in before deleting.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 animate-enter-up">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-[#101828] text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-sm font-medium border border-[#3867F5]/30 animate-enter-up"
        >
          <CheckCircle2 className="w-4 h-4 text-[#16845B]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Application Settings
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure your application theme, default interview simulation parameters, and privacy preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-medium text-sm transition-all shadow-sm cursor-pointer active:scale-[0.99] disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Layout: Tabs + Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <aside className="col-span-12 md:col-span-3 flex flex-col gap-1.5" aria-label="Settings Categories">
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-left transition-colors cursor-pointer ${activeTab === 'appearance'
                ? 'bg-primary/10 text-primary font-semibold border-l-3 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
          >
            <Sun className="w-4 h-4" />
            <span>Appearance &amp; Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interview')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-left transition-colors cursor-pointer ${activeTab === 'interview'
                ? 'bg-primary/10 text-primary font-semibold border-l-3 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Interview Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-left transition-colors cursor-pointer ${activeTab === 'notifications'
                ? 'bg-primary/10 text-primary font-semibold border-l-3 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-left transition-colors cursor-pointer ${activeTab === 'privacy'
                ? 'bg-primary/10 text-primary font-semibold border-l-3 border-primary'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Privacy &amp; Data</span>
          </button>
        </aside>

        {/* Tab Content Panes */}
        <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
          {/* =========================================================================
              TAB 1: APPEARANCE & THEME
              ========================================================================= */}
          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-6">
              <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-variant shadow-sm">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-on-surface">Theme Mode</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Select your preferred visual theme. System mode automatically matches your operating system preference.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="radiogroup" aria-label="Theme selection">
                  {/* Light Theme Card */}
                  <div
                    onClick={() => handleThemeChange('light')}
                    role="radio"
                    aria-checked={theme === 'light'}
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleThemeChange('light')}
                    className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${theme === 'light'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-surface-variant hover:border-outline bg-surface-container-low'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Sun className="w-5 h-5 text-[#3867F5]" />
                      <span className={`w-3.5 h-3.5 rounded-full border-2 ${theme === 'light' ? 'border-primary bg-primary' : 'border-outline'}`} />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-on-surface block">Light Mode</span>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">Clean, high-contrast crisp day interface.</span>
                    </div>
                  </div>

                  {/* Dark Theme Card */}
                  <div
                    onClick={() => handleThemeChange('dark')}
                    role="radio"
                    aria-checked={theme === 'dark'}
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleThemeChange('dark')}
                    className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${theme === 'dark'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-surface-variant hover:border-outline bg-surface-container-low'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Moon className="w-5 h-5 text-[#8699ff]" />
                      <span className={`w-3.5 h-3.5 rounded-full border-2 ${theme === 'dark' ? 'border-primary bg-primary' : 'border-outline'}`} />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-on-surface block">Dark Mode</span>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">Low-glare dark surfaces for comfortable focus.</span>
                    </div>
                  </div>

                  {/* System Theme Card */}
                  <div
                    onClick={() => handleThemeChange('system')}
                    role="radio"
                    aria-checked={theme === 'system'}
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && handleThemeChange('system')}
                    className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${theme === 'system'
                        ? 'border-primary bg-primary/5 shadow-xs'
                        : 'border-surface-variant hover:border-outline bg-surface-container-low'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Laptop className="w-5 h-5 text-outline" />
                      <span className={`w-3.5 h-3.5 rounded-full border-2 ${theme === 'system' ? 'border-primary bg-primary' : 'border-outline'}`} />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-on-surface block">System Default</span>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">Syncs with your device day &amp; night appearance.</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Accessibility Card */}
              <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-variant shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-on-surface">Motion &amp; Accessibility</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Customize sensory and motion behavior for an optimal practice experience.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-3">
                      <Eye className="w-4 h-4 text-primary" />
                      <div>
                        <span className="text-sm font-semibold text-on-surface block">Reduced Motion</span>
                        <span className="text-xs text-on-surface-variant">Minimize UI transitions and page animations.</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={reducedMotion}
                      onChange={(e) => setReducedMotion(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-surface-variant cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-primary" />
                      <div>
                        <span className="text-sm font-semibold text-on-surface block">Sound Feedback</span>
                        <span className="text-xs text-on-surface-variant">Play subtle audio cues on session countdown and submission.</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={soundEffects}
                      onChange={(e) => setSoundEffects(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-surface-variant cursor-pointer"
                    />
                  </label>
                </div>
              </section>
            </div>
          )}

          {/* =========================================================================
              TAB 2: INTERVIEW DEFAULTS
              ========================================================================= */}
          {activeTab === 'interview' && (
            <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-variant shadow-sm flex flex-col gap-6">
              <div className="pb-4 border-b border-surface-variant">
                <h2 className="text-lg font-bold text-on-surface">Default Interview Simulation Parameters</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  These settings automatically configure your setup when starting a new practice drill. You can still adjust them for individual sessions in Mock Setup.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Default Target Track
                  </label>
                  <select
                    value={defaultRole}
                    onChange={(e) => setDefaultRole(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium"
                  >
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Full Stack Engineer">Full Stack Engineer</option>
                    <option value="Backend Engineer">Backend Engineer</option>
                    <option value="System Design Architect">System Design Architect</option>
                    <option value="AI / ML Engineer">AI / ML Engineer</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Default Difficulty Level
                  </label>
                  <select
                    value={defaultDifficulty}
                    onChange={(e) => setDefaultDifficulty(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium"
                  >
                    <option value="Easy">Easy (Fundamental concepts)</option>
                    <option value="Medium">Medium (Industry standard)</option>
                    <option value="Hard">Hard (Senior &amp; edge cases)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Interview Format Type
                  </label>
                  <select
                    value={defaultType}
                    onChange={(e) => setDefaultType(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium"
                  >
                    <option value="Technical">Technical (Architecture &amp; Algorithms)</option>
                    <option value="Behavioral">Behavioral (Leadership &amp; STAR)</option>
                    <option value="System Design">System Design</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Session Duration &amp; Question Count
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      if (e.target.value.includes('3')) setQuestionsCount(3);
                      else if (e.target.value.includes('7')) setQuestionsCount(7);
                      else setQuestionsCount(5);
                    }}
                    className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium"
                  >
                    <option value="15 min (3 questions)">15 min (3 questions - Quick drill)</option>
                    <option value="20 min (5 questions)">20 min (5 questions - Standard)</option>
                    <option value="30 min (7 questions)">30 min (7 questions - Comprehensive)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    AI Evaluator Strictness Rigor
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Lenient', 'Calibrated', 'Rigorous'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFeedbackRigor(level)}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${feedbackRigor === level
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-container text-on-surface border-surface-variant hover:border-outline'
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-1">
                    Calibrated compares against mid-to-senior industry benchmarks with objective rubrics.
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================================
              TAB 3: NOTIFICATIONS
              ========================================================================= */}
          {activeTab === 'notifications' && (
            <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-variant shadow-sm flex flex-col gap-6">
              <div className="pb-4 border-b border-surface-variant">
                <h2 className="text-lg font-bold text-on-surface">Practice Reminders &amp; Updates</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Configure how InterviewIQ reminds you of weekly practice goals and performance milestones.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  In-app banner notifications are active. External email/push notifications require connecting an email delivery gateway.
                </span>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-on-surface block">Practice Schedule Reminders</span>
                    <span className="text-xs text-on-surface-variant">Alerts when your scheduled mock practice session is due.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={practiceReminders}
                    onChange={(e) => setPracticeReminders(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-surface-variant cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-on-surface block">Weekly Progress Digest</span>
                    <span className="text-xs text-on-surface-variant">Summary of rubric scores, average latency, and STAR delivery scores.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyProgressUpdates}
                    onChange={(e) => setWeeklyProgressUpdates(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-surface-variant cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low cursor-pointer hover:bg-surface-container transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-on-surface block">New Question Pack Releases</span>
                    <span className="text-xs text-on-surface-variant">Notifications when new questions from Google, Meta, or Stripe are added.</span>
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
                className={`relative flex flex-col gap-1.5 p-space-md rounded-lg cursor-pointer transition-all ${voicePersona === 'Nova'
                    ? 'bg-surface-container-low ring-1 ring-primary'
                    : 'bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">record_voice_over</span>
                    Nova
                  </span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center ${voicePersona === 'Nova' ? 'bg-primary text-on-primary' : 'bg-surface-container'
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
                className={`relative flex flex-col gap-1.5 p-space-md rounded-lg cursor-pointer transition-all ${voicePersona === 'Alloy'
                    ? 'bg-surface-container-low ring-1 ring-primary'
                    : 'bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-outline text-[16px]">record_voice_over</span>
                    Alloy
                  </span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center ${voicePersona === 'Alloy' ? 'bg-primary text-on-primary' : 'bg-surface-container'
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
                className={`relative flex flex-col gap-1.5 p-space-md rounded-lg cursor-pointer transition-all ${voicePersona === 'Echo'
                    ? 'bg-surface-container-low ring-1 ring-primary'
                    : 'bg-surface-container-lowest hover:bg-surface-container-low'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-outline text-[16px]">record_voice_over</span>
                    Echo
                  </span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center ${voicePersona === 'Echo' ? 'bg-primary text-on-primary' : 'bg-surface-container'
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

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-surface-variant">
            <div>
              <h3 className="text-sm font-semibold text-on-surface">Export Your Account Data</h3>
              <p className="text-xs text-on-surface-variant">
                Download a complete JSON file containing your profile, preferences, and interview setup.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Export JSON</span>
            </button>
          </div>
        </section>

        {/* Danger Zone: Account Deletion */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-error/30 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-error">
            <Trash2 className="w-5 h-5" />
            <h2 className="text-lg font-bold text-error">Danger Zone</h2>
          </div>
          <p className="text-xs text-on-surface-variant">
            Permanently delete your InterviewIQ candidate account, career profile, and interview history. This action is irreversible.
          </p>

          <div>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmationText('');
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 hover:bg-error/20 text-error text-xs font-semibold transition-colors cursor-pointer border border-error/30"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </section>
      </div>
          )}
    </div>
      </div >

  {/* Delete Confirmation Modal */ }
{
  showDeleteModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-enter-fade">
      <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 border border-surface-variant shadow-2xl animate-enter-up">
        <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-on-surface mb-2">Delete Account Permanently</h3>
        <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
          This will permanently delete your candidate account (<strong>{authUser?.email}</strong>), your saved profile, and all practice interview rubrics.
        </p>

        <div className="mb-4">
          <label className="text-xs font-medium text-on-surface block mb-1.5">
            Type <strong>DELETE</strong> below to confirm:
          </label>
          <input
            type="text"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-error text-sm font-mono"
          />
        </div>

        {deleteError && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
            {deleteError}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeletingAccount}
            className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount || deleteConfirmationText.trim().toLowerCase() !== 'delete'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-error hover:bg-error/90 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeletingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isDeletingAccount ? 'Deleting...' : 'Confirm Deletion'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
    </div >
  );
};
