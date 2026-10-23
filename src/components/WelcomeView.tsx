import React, { useState } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  MessageSquare, 
  CheckCircle2, 
  Menu, 
  X, 
  Cpu, 
  Clock, 
  Award, 
  ChevronRight 
} from 'lucide-react';

interface WelcomeViewProps {
  onNavigate: (route: string) => void;
  isAuthenticated?: boolean;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onNavigate, isAuthenticated = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Intended destination for Start Practicing action
  const handleStartPracticing = () => {
    if (isAuthenticated) {
      onNavigate('/mock-interview-workspace');
    } else {
      onNavigate('/login?redirect=/mock-interview-workspace');
    }
  };

  const handlePracticeWorkspaceClick = () => {
    if (isAuthenticated) {
      onNavigate('/mock-interview-workspace');
    } else {
      onNavigate('/login?redirect=/mock-interview-workspace');
    }
  };

  const handlePreviewDashboardClick = () => {
    if (isAuthenticated) {
      onNavigate('/overview');
    } else {
      onNavigate('/login?redirect=/overview');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#182230] font-sans antialiased flex flex-col selection:bg-[#EFF4FF] selection:text-[#3867F5]">
      {/* =========================================================================
          NAVIGATION HEADER
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#D0D5DD]/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] rounded-md"
            onClick={() => onNavigate('/')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onNavigate('/')}
            aria-label="InterviewIQ Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#101828] text-[#FFFFFF] flex items-center justify-center font-bold text-base sm:text-lg tracking-tight shadow-sm group-hover:bg-[#182230] transition-colors">
              <span className="text-[#3867F5]">I</span>Q
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#182230] leading-none">
                InterviewIQ
              </span>
              <span className="text-[11px] font-medium text-[#667085] tracking-wider uppercase mt-0.5">
                AI Interview Coach
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links & CTAs */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            <button
              type="button"
              onClick={handlePracticeWorkspaceClick}
              className="text-sm font-medium text-[#667085] hover:text-[#182230] transition-colors px-3 py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] cursor-pointer"
            >
              Practice Workspace
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-sm font-medium text-[#182230] hover:text-[#3867F5] transition-colors px-3 py-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/signup')}
              className="inline-flex items-center justify-center gap-2 bg-[#3867F5] hover:bg-[#2e57d8] text-[#FFFFFF] text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3867F5] cursor-pointer"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-[#667085] hover:text-[#182230] hover:bg-[#EFF4FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3867F5]"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#FFFFFF] border-b border-[#D0D5DD] px-4 pt-3 pb-5 space-y-3 shadow-lg animate-enter-fade">
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                handlePracticeWorkspaceClick();
              }}
              className="block w-full text-left px-3 py-2 text-base font-medium text-[#667085] hover:text-[#182230] hover:bg-[#EFF4FF] rounded-lg transition-colors cursor-pointer"
            >
              Practice Workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/login');
              }}
              className="block w-full text-left px-3 py-2 text-base font-medium text-[#182230] hover:bg-[#EFF4FF] rounded-lg transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('/signup');
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#3867F5] hover:bg-[#2e57d8] text-[#FFFFFF] text-base font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        {/* Subtle Background Glow with approved palette */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 blur-3xl -z-10" 
          aria-hidden="true"
        >
          <div className="w-[500px] h-[300px] bg-[#EFF4FF] rounded-full mx-auto" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left animate-enter-up">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF4FF] border border-[#3867F5]/20 text-[#3867F5] text-xs sm:text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4 text-[#3867F5]" />
                <span>Next-Generation Technical &amp; Behavioral Practice</span>
              </div>

              {/* Primary Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#182230] tracking-tight leading-[1.15] mb-6">
                Walk Into Every Interview Prepared.
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg lg:text-xl text-[#667085] font-normal leading-relaxed max-w-2xl mb-8">
                Practice with AI-powered mock interviews, receive personalized feedback, and improve your answers one step at a time.
              </p>

              {/* Action Buttons: Behavior cleanly conditioned on authentication state */}
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
                <button
                  type="button"
                  onClick={handleStartPracticing}
                  className="inline-flex items-center justify-center gap-2.5 bg-[#3867F5] hover:bg-[#2e57d8] text-[#FFFFFF] text-base font-semibold px-7 py-3.5 rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3867F5] cursor-pointer"
                >
                  <span>Start Practicing</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('/login')}
                  className="inline-flex items-center justify-center gap-2 bg-[#FFFFFF] hover:bg-[#EFF4FF] text-[#182230] hover:text-[#3867F5] border border-[#D0D5DD] hover:border-[#3867F5]/40 text-base font-semibold px-6 py-3.5 rounded-lg transition-all duration-150 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] cursor-pointer"
                >
                  <span>Sign In</span>
                </button>
              </div>

              {/* Key Trust Signals */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-[#667085] pt-2 border-t border-[#D0D5DD]/60 w-full">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16845B]" />
                  <span>Calibrated to Senior Standards</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16845B]" />
                  <span>Objective Rubric Debriefs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16845B]" />
                  <span>Real-time Audio &amp; Text</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual / Interactive Preview Card */}
            <div className="lg:col-span-5 w-full flex justify-center animate-enter-up animation-delay-100">
              <div className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#D0D5DD] shadow-[0_12px_32px_rgba(16,24,40,0.08)] p-6 relative overflow-hidden">
                {/* Header of Preview Card */}
                <div className="flex items-center justify-between pb-4 border-b border-[#D0D5DD]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16845B] animate-pulse" />
                    <span className="text-xs font-semibold text-[#182230] uppercase tracking-wider">
                      Live Simulation
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#EFF4FF] text-[#3867F5] text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Technical Round</span>
                  </div>
                </div>

                {/* Question Preview */}
                <div className="py-4">
                  <span className="text-xs font-semibold text-[#3867F5] uppercase tracking-wide">
                    Question 02 of 05
                  </span>
                  <h3 className="text-sm sm:text-base font-semibold text-[#182230] mt-1 leading-snug">
                    "How do you design a token authentication flow using refresh token rotation and HttpOnly cookies to prevent XSS and CSRF?"
                  </h3>
                </div>

                {/* Candidate Response Snippet */}
                <div className="bg-[#F6F8FC] rounded-xl p-3.5 border border-[#D0D5DD]/60 mb-4">
                  <div className="flex items-center justify-between text-xs text-[#667085] mb-1.5">
                    <span className="font-medium text-[#182230]">Candidate Answer</span>
                    <span className="text-[11px]">Transcribed Speech</span>
                  </div>
                  <p className="text-xs text-[#667085] italic line-clamp-3 leading-relaxed">
                    "I structure access tokens as short-lived JWTs stored in memory, while the refresh token is stored in a SameSite=Strict HttpOnly cookie with server-side family revocation on reuse..."
                  </p>
                </div>

                {/* AI Evaluation Debrief Pill */}
                <div className="bg-[#EFF4FF] rounded-xl p-4 border border-[#3867F5]/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#101828]">
                      <Award className="w-4 h-4 text-[#3867F5]" />
                      <span>AI Evaluator Feedback</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#16845B] bg-[#FFFFFF] px-2 py-0.5 rounded shadow-xs">
                      92 / 100
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-[#182230]">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16845B] shrink-0 mt-0.5" />
                      <span>Strong articulation of token reuse detection and cookie flags.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-[#3867F5] shrink-0 mt-0.5" />
                      <span className="text-[#667085]">Follow-up: Ask how multi-region replication impacts revocation state.</span>
                    </div>
                  </div>
                </div>

                {/* Direct workspace entry trigger */}
                <button
                  type="button"
                  onClick={handlePreviewDashboardClick}
                  className="mt-4 w-full py-2 text-center text-xs font-semibold text-[#3867F5] hover:text-[#2e57d8] hover:bg-[#EFF4FF] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Explore live candidate dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE SECTION (3 POLISHED ITEMS)
          ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#FFFFFF] border-y border-[#D0D5DD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16 animate-enter-up">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#3867F5] mb-2 block">
              Built For Serious Engineers
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#182230] tracking-tight">
              Master the Three Pillars of Modern Interviews
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#667085]">
              Targeted simulation designed to build reflexive confidence across code architecture, system trade-offs, and behavioral storytelling.
            </p>
          </div>

          {/* 3 Core Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#F6F8FC] rounded-2xl p-7 border border-[#D0D5DD] flex flex-col justify-between hover:border-[#3867F5]/40 transition-all duration-200 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EFF4FF] border border-[#3867F5]/20 text-[#3867F5] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#182230] mb-3">
                  1. Personalized Mock Interview Practice
                </h3>
                <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
                  Calibrate your practice sessions to specific roles—Frontend Developer, Full Stack, or Systems Engineer. Tailor seniority expectations from entry level to principal architect with targeted technical tracks.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#D0D5DD]/70 flex items-center text-xs font-semibold text-[#3867F5]">
                <span>Configurable difficulty &amp; tracks</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#F6F8FC] rounded-2xl p-7 border border-[#D0D5DD] flex flex-col justify-between hover:border-[#3867F5]/40 transition-all duration-200 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EFF4FF] border border-[#3867F5]/20 text-[#3867F5] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#182230] mb-3">
                  2. Contextual Follow-Up Questions
                </h3>
                <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
                  Real hiring managers never stop at the surface. InterviewIQ analyzes your verbal response in real time, identifying omissions, edge cases, and trade-offs to probe deeper just like an engineering lead.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#D0D5DD]/70 flex items-center text-xs font-semibold text-[#3867F5]">
                <span>Adaptive intelligent follow-ups</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#F6F8FC] rounded-2xl p-7 border border-[#D0D5DD] flex flex-col justify-between hover:border-[#3867F5]/40 transition-all duration-200 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#EFF4FF] border border-[#3867F5]/20 text-[#3867F5] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
                  <CheckCircle2 className="w-6 h-6 text-[#16845B]" />
                </div>
                <h3 className="text-xl font-bold text-[#182230] mb-3">
                  3. Actionable Feedback &amp; Improvements
                </h3>
                <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
                  Receive comprehensive rubric debriefs dissecting communication delivery, technical depth, and problem formulation. Get clear gap analyses with model STAR responses to refine your answers step-by-step.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#D0D5DD]/70 flex items-center text-xs font-semibold text-[#16845B]">
                <span>Structured rubric scorecards</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          STRUCTURED 3-STEP WALKTHROUGH
          ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#F6F8FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#182230] tracking-tight">
              How Your Practice Workflow Works
            </h2>
            <p className="mt-3 text-base text-[#667085]">
              A structured progression designed to transform hesitation into structured delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#D0D5DD] shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#101828] text-[#FFFFFF] font-bold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-[#182230] mb-2">Set Your Role &amp; Difficulty</h4>
              <p className="text-sm text-[#667085] leading-relaxed">
                Choose your focus track (Frontend, Backend, System Design) and difficulty level to generate realistic questions.
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#D0D5DD] shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#3867F5] text-[#FFFFFF] font-bold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-[#182230] mb-2">Engage in Live Practice</h4>
              <p className="text-sm text-[#667085] leading-relaxed">
                Respond via speech or text in a timed workspace. The AI coach tracks pace, clarity, and technical terminology.
              </p>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#D0D5DD] shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-[#16845B] text-[#FFFFFF] font-bold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-[#182230] mb-2">Review Your Rubric Report</h4>
              <p className="text-sm text-[#667085] leading-relaxed">
                Inspect your overall hire score, key strengths, knowledge gaps, and concrete coaching pointers to iterate immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BOTTOM CTA SECTION
          ========================================================================= */}
      <section className="bg-[#101828] text-[#FFFFFF] py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4 text-[#FFFFFF]">
            Start Preparing For Your Next Interview Today
          </h2>
          <p className="text-base sm:text-lg text-[#D0D5DD] max-w-2xl mx-auto mb-8 font-normal">
            Sharpen your communication, structure complex system explanations, and step into interviews with confidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleStartPracticing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#3867F5] hover:bg-[#2e57d8] text-[#FFFFFF] text-base font-semibold px-8 py-3.5 rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#101828] focus:ring-[#3867F5] cursor-pointer"
            >
              <span>Start Practicing Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-[#182230] text-[#FFFFFF] border border-[#D0D5DD]/30 text-base font-semibold px-7 py-3.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#3867F5] cursor-pointer"
            >
              <span>Already Registered? Sign In</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="bg-[#FFFFFF] border-t border-[#D0D5DD] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand in Footer */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#101828] text-[#FFFFFF] flex items-center justify-center font-bold text-sm tracking-tight">
                <span className="text-[#3867F5]">I</span>Q
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base font-bold text-[#182230]">InterviewIQ</span>
                <span className="text-xs text-[#667085]">Intelligent AI Interview Coaching</span>
              </div>
            </div>

            {/* Navigation Links with real destinations */}
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#667085]" aria-label="Footer Navigation">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="hover:text-[#182230] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] rounded cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/signup')}
                className="hover:text-[#182230] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] rounded cursor-pointer"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={handlePracticeWorkspaceClick}
                className="hover:text-[#182230] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3867F5] rounded cursor-pointer"
              >
                Practice Workspace
              </button>
            </nav>

            {/* Copyright */}
            <p className="text-xs text-[#667085]">
              &copy; 2026 InterviewIQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
