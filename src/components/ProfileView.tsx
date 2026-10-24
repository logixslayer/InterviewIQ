import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Briefcase,
  Award,
  Sparkles,
  Save,
  X,
  Edit3,
  Loader2,
  Plus,
  Building2,
  Target,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { UserProfile } from '../types';
import { AuthUser } from '../services/authService';
import { auth } from '../services/firebase';
import { saveUserProfile } from '../services/userService';

interface ProfileViewProps {
  userProfile: UserProfile | null;
  authUser: AuthUser | null;
  onProfileUpdated: (updated: UserProfile) => void;
  onNavigate: (route: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  authUser,
  onProfileUpdated,
  onNavigate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states initialized from userProfile or authUser
  const [fullName, setFullName] = useState(userProfile?.fullName || authUser?.fullName || 'Candidate');
  const [currentStage, setCurrentStage] = useState(userProfile?.currentStage || 'Active Job Hunter');
  const [experienceYears, setExperienceYears] = useState(userProfile?.experienceYears ?? 3);
  const [primaryRole, setPrimaryRole] = useState(userProfile?.primaryRole || 'Frontend Developer');
  const [experienceLevel, setExperienceLevel] = useState(userProfile?.experienceLevel || 'Intermediate');
  const [targetInterviewDate, setTargetInterviewDate] = useState(userProfile?.targetInterviewDate || '');
  const [preferredInterviewType, setPreferredInterviewType] = useState(userProfile?.preferredInterviewType || 'Technical');
  const [careerGoals, setCareerGoals] = useState(userProfile?.careerGoals || '');
  const [summary, setSummary] = useState(userProfile?.summary || '');

  // Dynamic tags
  const [skills, setSkills] = useState<string[]>(userProfile?.topSkills || ['React', 'TypeScript', 'Tailwind CSS']);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);

  const [companies, setCompanies] = useState<string[]>(userProfile?.targetCompanies || ['Google', 'Meta', 'Stripe', 'Vercel']);
  const [newCompanyInput, setNewCompanyInput] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);

  // Sync state when incoming userProfile updates
  useEffect(() => {
    if (userProfile && !isEditing) {
      setFullName(userProfile.fullName || authUser?.fullName || 'Candidate');
      setCurrentStage(userProfile.currentStage || 'Active Job Hunter');
      setExperienceYears(userProfile.experienceYears ?? 3);
      setPrimaryRole(userProfile.primaryRole || 'Frontend Developer');
      setExperienceLevel(userProfile.experienceLevel || 'Intermediate');
      setTargetInterviewDate(userProfile.targetInterviewDate || '');
      setPreferredInterviewType(userProfile.preferredInterviewType || 'Technical');
      setCareerGoals(userProfile.careerGoals || '');
      setSummary(userProfile.summary || '');
      setSkills(userProfile.topSkills || ['React', 'TypeScript']);
      setCompanies(userProfile.targetCompanies || ['Google', 'Meta']);
    }
  }, [userProfile, authUser, isEditing]);

  const handleCancel = () => {
    if (userProfile) {
      setFullName(userProfile.fullName || authUser?.fullName || 'Candidate');
      setCurrentStage(userProfile.currentStage || 'Active Job Hunter');
      setExperienceYears(userProfile.experienceYears ?? 3);
      setPrimaryRole(userProfile.primaryRole || 'Frontend Developer');
      setExperienceLevel(userProfile.experienceLevel || 'Intermediate');
      setTargetInterviewDate(userProfile.targetInterviewDate || '');
      setPreferredInterviewType(userProfile.preferredInterviewType || 'Technical');
      setCareerGoals(userProfile.careerGoals || '');
      setSummary(userProfile.summary || '');
      setSkills(userProfile.topSkills || ['React', 'TypeScript']);
      setCompanies(userProfile.targetCompanies || ['Google', 'Meta']);
    }
    setErrorMessage(null);
    setIsEditing(false);
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkillInput('');
      setShowAddSkill(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddCompany = () => {
    const trimmed = newCompanyInput.trim();
    if (trimmed && !companies.includes(trimmed)) {
      setCompanies([...companies, trimmed]);
      setNewCompanyInput('');
      setShowAddCompany(false);
    }
  };

  const handleRemoveCompany = (companyToRemove: string) => {
    setCompanies(companies.filter(c => c !== companyToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const uid = authUser?.id || auth?.currentUser?.uid || userProfile?.uid || 'anonymous';
    const email = authUser?.email || auth?.currentUser?.email || userProfile?.email || '';

    const updatedProfile: UserProfile = {
      ...(userProfile || {}),
      uid,
      fullName: fullName.trim(),
      email,
      primaryRole,
      experienceLevel,
      currentStage,
      experienceYears: Number(experienceYears) || 0,
      targetRoles: userProfile?.targetRoles?.length ? userProfile.targetRoles : [
        {
          title: primaryRole,
          desc: `${primaryRole} Architecture & Problem Solving`,
          match: 92,
          reason: 'Primary selected target track.'
        }
      ],
      topSkills: skills,
      targetCompanies: companies,
      careerGoals: careerGoals.trim(),
      preferredInterviewType,
      targetInterviewDate,
      readinessTier: userProfile?.readinessTier || 'Tier B+',
      keyAchievements: userProfile?.keyAchievements || ['Completed InterviewIQ practice calibration'],
      suggestedFocus: userProfile?.suggestedFocus || 'Focus on system design trade-offs and behavioral STAR delivery.',
      summary: summary.trim(),
    };

    try {
      const saved = await saveUserProfile(updatedProfile);
      onProfileUpdated(saved);
      setIsEditing(false);
      setToastMessage('Profile updated and saved persistently.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentEmail = authUser?.email || auth?.currentUser?.email || 'user@interviewiq.ai';
  const isEmailVerified = auth?.currentUser?.emailVerified ?? false;
  const createdAtFormatted = auth?.currentUser?.metadata?.creationTime
    ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recently';

  const userInitials = fullName
    ? fullName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'IQ';

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Candidate Profile
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Active User
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage your personal identity, target roles, and interview preparation preferences.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-medium text-sm transition-all shadow-sm cursor-pointer active:scale-[0.99]"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-medium text-sm transition-all shadow-sm cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-semibold">Unable to save profile</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Identity Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-variant shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-surface-variant">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Avatar / Initials */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#3867F5] to-[#101828] text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md shrink-0">
              {userInitials}
            </div>

            <div className="flex flex-col">
              {isEditing ? (
                <div className="flex flex-col gap-1 max-w-sm">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-base font-semibold"
                  />
                </div>
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold text-on-surface leading-tight">
                  {fullName}
                </h2>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-outline" />
                  <span>{currentEmail}</span>
                </span>

                {isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#16845B] font-medium bg-[#16845B]/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-outline font-medium bg-surface-container-high px-2 py-0.5 rounded-full">
                    <span>Unverified</span>
                  </span>
                )}
              </div>

              {authUser?.id && (
                <span className="text-[11px] font-mono text-outline mt-1.5">
                  UID: {authUser.id}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-1.5 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-outline" />
              <span>Member since: <strong>{createdAtFormatted}</strong></span>
            </span>
            <span className="text-outline">
              Role: <strong className="text-on-surface">{primaryRole}</strong>
            </span>
          </div>
        </div>

        {/* Career Details Form / Display */}
        <form onSubmit={handleSave} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Career Stage */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Current Career Stage
            </label>
            {isEditing ? (
              <select
                value={currentStage}
                onChange={(e) => setCurrentStage(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium"
              >
                <option value="Active Job Hunter">Active Job Hunter</option>
                <option value="Senior Undergrad">Senior Undergrad / Recent Graduate</option>
                <option value="Early Career Professional (1-2 yrs)">Early Career Professional (1–2 yrs)</option>
                <option value="Mid-Level Engineer (3-5 yrs)">Mid-Level Engineer (3–5 yrs)</option>
                <option value="Senior Engineer (6+ yrs)">Senior Engineer (6+ yrs)</option>
                <option value="Engineering Manager / Lead">Engineering Manager / Lead</option>
              </select>
            ) : (
              <div className="p-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm font-medium">
                {currentStage}
              </div>
            )}
          </div>

          {/* Primary Target Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Primary Target Role
            </label>
            {isEditing ? (
              <select
                value={primaryRole}
                onChange={(e) => setPrimaryRole(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium"
              >
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Full Stack Engineer">Full Stack Engineer</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="Software Engineer">Software Engineer (Generalist)</option>
                <option value="System Design Architect">System Design Architect</option>
                <option value="AI / ML Engineer">AI / ML Engineer</option>
              </select>
            ) : (
              <div className="p-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm font-medium">
                {primaryRole}
              </div>
            )}
          </div>

          {/* Experience Level & Years */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Experience Level &amp; Years
            </label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium"
                >
                  <option value="Entry Level">Entry Level (0-2y)</option>
                  <option value="Intermediate">Intermediate (2-5y)</option>
                  <option value="Experienced">Experienced (5-8y)</option>
                  <option value="Staff+">Staff / Principal (8y+)</option>
                </select>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="Years"
                  className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium"
                />
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm font-medium">
                {experienceLevel} • {experienceYears} {experienceYears === 1 ? 'Year' : 'Years'} of Experience
              </div>
            )}
          </div>

          {/* Preferred Interview Track */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Preferred Interview Track
            </label>
            {isEditing ? (
              <select
                value={preferredInterviewType}
                onChange={(e) => setPreferredInterviewType(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium"
              >
                <option value="Technical">Technical Deep Dive</option>
                <option value="Behavioral">Behavioral &amp; Leadership (STAR)</option>
                <option value="System Design">System Design &amp; Architecture</option>
                <option value="Mixed Simulation">Mixed Real-World Simulation</option>
              </select>
            ) : (
              <div className="p-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm font-medium">
                {preferredInterviewType}
              </div>
            )}
          </div>

          {/* Target Interview Date */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Target Interview Milestone Date (Optional)
            </label>
            {isEditing ? (
              <input
                type="date"
                value={targetInterviewDate}
                onChange={(e) => setTargetInterviewDate(e.target.value)}
                className="h-10 px-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm font-medium max-w-sm"
              />
            ) : (
              <div className="p-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm font-medium max-w-sm">
                {targetInterviewDate ? new Date(targetInterviewDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No target date set'}
              </div>
            )}
          </div>
        </form>
      </section>

      {/* Skills & Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Skills Section */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-variant shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-base text-on-surface">Core Skills &amp; Stack</h3>
              </div>
              <span className="text-xs text-outline">{skills.length} skills listed</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container text-on-surface text-xs font-semibold shadow-xs border border-surface-variant"
                >
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-outline hover:text-error transition-colors cursor-pointer"
                      title={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}

              {isEditing && (
                showAddSkill ? (
                  <div className="inline-flex items-center gap-1.5 bg-surface-container-high px-2 py-1 rounded-lg border border-primary">
                    <input
                      type="text"
                      autoFocus
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Add skill..."
                      className="text-xs bg-transparent text-on-surface focus:outline-none w-24"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="text-primary hover:text-primary/80 font-bold text-xs cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSkill(false)}
                      className="text-outline hover:text-on-surface text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddSkill(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Skill</span>
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* Target Companies Section */}
        <section className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-variant shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-base text-on-surface">Target Companies</h3>
              </div>
              <span className="text-xs text-outline">{companies.length} targets</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {companies.map((company) => (
                <span
                  key={company}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container text-on-surface text-xs font-semibold shadow-xs border border-surface-variant"
                >
                  <span>{company}</span>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCompany(company)}
                      className="text-outline hover:text-error transition-colors cursor-pointer"
                      title={`Remove ${company}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}

              {isEditing && (
                showAddCompany ? (
                  <div className="inline-flex items-center gap-1.5 bg-surface-container-high px-2 py-1 rounded-lg border border-primary">
                    <input
                      type="text"
                      autoFocus
                      value={newCompanyInput}
                      onChange={(e) => setNewCompanyInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompany())}
                      placeholder="Company..."
                      className="text-xs bg-transparent text-on-surface focus:outline-none w-24"
                    />
                    <button
                      type="button"
                      onClick={handleAddCompany}
                      className="text-primary hover:text-primary/80 font-bold text-xs cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCompany(false)}
                      className="text-outline hover:text-on-surface text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCompany(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Company</span>
                  </button>
                )
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Summary & Career Goals */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 border border-surface-variant shadow-sm flex flex-col gap-6">
        <div>
          <h3 className="text-base font-semibold text-on-surface mb-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span>Career Goals &amp; Interview Motivation</span>
          </h3>
          <p className="text-xs text-on-surface-variant mb-2.5">
            What are your core objectives for this interview preparation cycle?
          </p>
          {isEditing ? (
            <textarea
              rows={3}
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
              placeholder="e.g. Preparing for Senior Frontend roles with focus on state architecture and performance metrics..."
              className="w-full p-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm"
            />
          ) : (
            <div className="p-3.5 rounded-lg bg-surface-container-low text-on-surface text-sm leading-relaxed whitespace-pre-wrap">
              {careerGoals || 'No career goals specified yet. Click "Edit Profile" to define your targets.'}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-base font-semibold text-on-surface mb-1 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            <span>Professional Summary</span>
          </h3>
          <p className="text-xs text-on-surface-variant mb-2.5">
            High-level overview of your background, technical focus, and accomplishments.
          </p>
          {isEditing ? (
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Software engineer specializing in building high-scale client web applications..."
              className="w-full p-3 rounded-lg bg-surface-container text-on-surface border border-surface-variant focus:outline-none focus:border-primary text-sm"
            />
          ) : (
            <div className="p-3.5 rounded-lg bg-surface-container-low text-on-surface text-sm leading-relaxed whitespace-pre-wrap">
              {summary || 'No professional summary provided yet.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
