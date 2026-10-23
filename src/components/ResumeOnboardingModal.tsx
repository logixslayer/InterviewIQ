import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ResumeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileAnalyzed: (profile: UserProfile) => void;
  currentProfile?: UserProfile | null;
  forceRequired?: boolean;
}

const SAMPLE_RESUMES = {
  frontendLead: `Alex Morgan
alex.morgan@example.com | San Francisco, CA | github.com/alexmorgan | linkedin.com/in/alexmorgan

SUMMARY:
Lead Frontend Engineer with 6+ years specializing in high-scale React, Next.js, and TypeScript architectures. Track record architecting low-latency streaming UIs, reducing Core Web Vitals (INP/LCP) by 42%, and mentoring 12+ engineers across distributed systems and design tokens.

WORK EXPERIENCE:
Senior Frontend Engineer | TechCorp Inc. (2022 - Present)
- Architected enterprise real-time dashboard supporting 150k daily active users with sub-50ms render latency.
- Implemented state decoupling using Zustand and React 18 Concurrent features, eliminating 80% unnecessary re-renders.
- Spearheaded company-wide migration to Tailwind CSS and micro-frontend architecture.

Software Engineer | StartupStudio (2019 - 2022)
- Built interactive client-facing SaaS platform with TypeScript, GraphQL, and WebSockets.
- Created automated CI/CD end-to-end testing pipeline improving deployment reliability by 35%.

SKILLS:
Languages & Frameworks: TypeScript, JavaScript (ESNext), React 18, Next.js, Node.js, GraphQL, HTML5/CSS3, Tailwind CSS
Architecture: Micro-frontends, State Machines, Virtualized Lists, Web Workers, Core Web Vitals, WebSockets
Testing & Tools: Jest, React Testing Library, Playwright, Vite, Webpack, Docker, Git, CI/CD`,

  distributedBackend: `Jordan Lee
jordan.lee@example.com | Seattle, WA | github.com/jordanlee | linkedin.com/in/jordanlee

SUMMARY:
Senior Backend & Distributed Systems Engineer with 5+ years of experience designing high-throughput microservices, event-driven pipelines, and relational database partitioning handling 50k requests/sec.

WORK EXPERIENCE:
Senior Backend Engineer | CloudScale Systems (2021 - Present)
- Designed distributed event-driven messaging layer using Apache Kafka and Go/Java, processing 2B+ events daily with 99.99% uptime.
- Optimized PostgreSQL database sharding and Redis caching tier, cutting P99 latency from 320ms to 28ms.
- Built automated failover and rate limiting algorithms protecting internal APIs against DDoS spikes.

Software Engineer | FinTech Innovations (2019 - 2021)
- Developed secure PCI-DSS compliant payment processing APIs in Java / Spring Boot.
- Implemented idempotent distributed webhook processing with Redis Redlock and Postgres advisory locks.

SKILLS:
Languages: Go, Java, Python, SQL, C++
Platforms & Storage: Apache Kafka, PostgreSQL, Redis, AWS (ECS, Lambda, S3, RDS), Kubernetes, Docker
Core Competencies: Distributed Transactions, Idempotency, Concurrency, Microservices, API Gateway Architecture`,

  dataAnalyst: `Taylor Chen
taylor.chen@example.com | New York, NY | linkedin.com/in/taylorchen

SUMMARY:
Product & Data Analyst with 4 years extracting actionable user engagement metrics, designing cohort retention models, and presenting executive KPIs for Fortune 500 growth teams.

WORK EXPERIENCE:
Data Analyst II | OmniGrowth Media (2022 - Present)
- Modeled user acquisition and retention cohorts using SQL (Snowflake/BigQuery) and Python (Pandas/NumPy), identifying $1.8M ARR expansion opportunity.
- Automated daily executive dashboards using Tableau and dbt, reducing manual reporting cycles by 15 hours/week.

Associate Analyst | RetailPulse (2020 - 2022)
- Conducted multivariate A/B testing on checkout funnel conversion rates, achieving a +14% lift in completed orders.

SKILLS:
Analysis & Modeling: SQL, Python (Pandas, Scikit-Learn), R, dbt, Snowflake, BigQuery, Statistics & Hypothesis Testing
BI & Viz: Tableau, Looker, PowerBI, Amplitude, Google Analytics 4`,

  blockchainEngineer: `Alex Rivera
alex.rivera@example.com | San Francisco, CA | github.com/alexrivera-web3 | linkedin.com/in/alexrivera-web3

SUMMARY:
Lead Blockchain & Smart Contract Engineer with 5+ years building EVM protocols, Solidity smart contracts, DeFi liquidity vaults, and high-security dApps. Handled $140M+ Total Value Locked (TVL) with zero critical exploit incidents.

WORK EXPERIENCE:
Senior Blockchain Engineer | Nexus DeFi Protocol (2022 - Present)
- Architected automated market maker (AMM) liquidity pools and flash loan-resistant TWAP oracle feeds in Solidity & Foundry.
- Engineered upgradeable smart contracts using UUPS proxy pattern with ERC-7201 namespaced storage, slashing deployment gas costs by 28%.
- Implemented state machine security guards and Checks-Effects-Interactions pattern across 15+ smart contracts, passing audits by OpenZeppelin and Trail of Bits.

Smart Contract Developer | BlockWave Labs (2020 - 2022)
- Built ERC-20 staking and ERC-721 dynamic metadata minting contracts with gas golf assembly optimizations.
- Integrated Web3.js and Ethers.js client hooks with React/Next.js frontend for MetaMask wallet signing and event subscriptions.

SKILLS:
Smart Contracts & Web3: Solidity, EVM, Hardhat, Foundry, Ethers.js, Web3.js, OpenZeppelin, DeFi, Layer 2 (Arbitrum, Optimism)
Languages & Frameworks: TypeScript, JavaScript, Go, Python, React, Next.js, Node.js
Security & Testing: Slither, Echidna, Mythril, Gas Optimization, Reentrancy Protection, Formal Verification`
};

const isRawPdfContent = (text: string): boolean => {
  if (!text) return false;
  return (
    text.startsWith('%PDF-') ||
    text.includes('/Creator <FEFF') ||
    text.includes('/Producer <FEFF') ||
    (text.includes('/Type /Page') && text.includes('stream')) ||
    (text.includes('/Filter /FlateDecode') && text.includes('stream'))
  );
};

export const ResumeOnboardingModal: React.FC<ResumeOnboardingModalProps> = ({
  isOpen,
  onClose,
  onProfileAnalyzed,
  currentProfile,
  forceRequired = false,
}) => {
  const [resumeText, setResumeText] = useState(currentProfile?.rawResumeText || '');
  const [targetDate, setTargetDate] = useState(currentProfile?.targetInterviewDate || 'October 28, 2026');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so user can re-select the same file if desired
    e.target.value = '';

    setFileName(file.name);
    setErrorMsg(null);

    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';
    const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc');

    if (isPdf || isDocx) {
      setIsExtractingFile(true);
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const base64 = event.target?.result as string;
            const res = await fetch('/api/parse-document', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                filename: file.name,
                base64,
              }),
            });

            const data = await res.json();
            if (res.ok && data.success && data.text) {
              setResumeText(data.text);
              setErrorMsg(null);
            } else {
              setErrorMsg(data.error || 'Failed to extract text from document. Please paste your resume text directly.');
            }
          } catch (fetchErr: any) {
            console.error('Document parsing network error:', fetchErr);
            setErrorMsg('Network error while processing document. Please paste resume text directly.');
          } finally {
            setIsExtractingFile(false);
          }
        };

        reader.onerror = () => {
          setErrorMsg('Failed to read file from disk. Please paste your resume text.');
          setIsExtractingFile(false);
        };

        reader.readAsDataURL(file);
      } catch (err: any) {
        console.error('File read error:', err);
        setErrorMsg('Error reading document: ' + (err?.message || 'unknown error'));
        setIsExtractingFile(false);
      }
    } else {
      // Plain text, markdown, json, etc.
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          if (isRawPdfContent(text)) {
            setErrorMsg('This file appears to contain binary PDF data. Please re-upload as a .pdf so the parser can extract the text cleanly.');
          } else {
            setResumeText(text);
          }
        }
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read file. Please paste your resume text directly.');
      };
      reader.readAsText(file);
    }
  };

  const handleApplyPreset = (presetKey: keyof typeof SAMPLE_RESUMES, sampleDate: string) => {
    setResumeText(SAMPLE_RESUMES[presetKey]);
    setTargetDate(sampleDate);
    setFileName(`${presetKey}-resume.txt`);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim() || resumeText.trim().length < 20) {
      setErrorMsg('Please upload a resume file or paste at least a brief summary of your work experience and skills.');
      return;
    }

    if (isRawPdfContent(resumeText)) {
      setErrorMsg('Raw PDF binary bytecode detected. Please re-upload your PDF using the "Upload File" button so we can extract readable resume text.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisStep('Connecting to NVIDIA AI Engine...');

    try {
      setTimeout(() => setAnalysisStep('Analyzing candidate skills & career history via Nemotron 3.5...'), 600);
      setTimeout(() => setAnalysisStep('Synthesizing target roles and calibrating readiness score...'), 1200);

      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          targetDate: targetDate.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze resume');
      }

      const analyzedProfile: UserProfile = {
        ...data.profile,
        rawResumeText: resumeText,
        analyzedAt: new Date().toISOString(),
      };

      setAnalysisStep('Profile successfully calibrated!');
      setTimeout(() => {
        setIsAnalyzing(false);
        onProfileAnalyzed(analyzedProfile);
        onClose();
      }, 500);

    } catch (err: any) {
      console.error('Analysis error:', err);
      setIsAnalyzing(false);
      setErrorMsg(err?.message || 'Could not complete resume analysis. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-on-surface">
        
        {/* Header */}
        <div className="p-6 border-b border-surface-container flex items-start justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[24px]">assignment_ind</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Candidate Profile &amp; Resume Setup
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-micro text-label-micro font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  NVIDIA AI Calibrated
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Upload your resume so our AI can extract your target roles, benchmark your skills, and schedule mock milestones.
              </p>
            </div>
          </div>

          {!forceRequired && (
            <button
              type="button"
              onClick={onClose}
              disabled={isAnalyzing}
              className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick 1-Click Resume Fillers */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-micro text-label-micro uppercase tracking-wider text-outline font-semibold">
              Or load sample candidate profiles:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleApplyPreset('frontendLead', 'October 28, 2026')}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-container hover:bg-primary-fixed/30 text-on-surface hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">code</span>
                Alex (Frontend Lead)
              </button>
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleApplyPreset('distributedBackend', 'November 12, 2026')}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-container hover:bg-primary-fixed/30 text-on-surface hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">database</span>
                Jordan (Backend / Distributed)
              </button>
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleApplyPreset('blockchainEngineer', 'October 30, 2026')}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-container hover:bg-primary-fixed/30 text-on-surface hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">token</span>
                Alex (Blockchain Engineer)
              </button>
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => handleApplyPreset('dataAnalyst', 'October 20, 2026')}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-surface-container hover:bg-primary-fixed/30 text-on-surface hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">query_stats</span>
                Taylor (Data Analyst)
              </button>
            </div>
          </div>

          {/* Resume Upload / Text Area */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="resume-content" className="font-label-md text-label-md font-semibold text-on-surface">
                Resume Content / Work Experience
              </label>
              {isExtractingFile ? (
                <span className="inline-flex items-center gap-1.5 text-primary text-xs font-medium">
                  <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Extracting resume text from {fileName || 'document'}...</span>
                </span>
              ) : (
                <label className="text-primary hover:underline text-xs font-medium flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-[14px]">upload_file</span>
                  <span>{fileName ? `Loaded: ${fileName}` : 'Upload File (.pdf, .docx, .txt)'}</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isAnalyzing || isExtractingFile}
                  />
                </label>
              )}
            </div>

            {isRawPdfContent(resumeText) && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-on-surface text-xs flex items-start justify-between gap-3 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[20px] text-amber-500 shrink-0 mt-0.5">warning</span>
                  <div>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">Raw PDF Bytecode Detected</p>
                    <p className="text-on-surface-variant text-xs mt-0.5">
                      The box contains raw unparsed PDF binary code. Please re-upload your PDF using the "Upload File" button above so the server can extract your actual resume text, or clear and paste it directly.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResumeText('');
                    setFileName(null);
                    setErrorMsg(null);
                  }}
                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-medium text-xs shrink-0 cursor-pointer transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="relative">
              <textarea
                id="resume-content"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder={isExtractingFile ? "Extracting text from document, please wait..." : "Paste your resume, LinkedIn summary, or project accomplishments here... (e.g. Senior Frontend Engineer with 5 years experience in React, TypeScript, GraphQL...)"}
                rows={7}
                disabled={isAnalyzing || isExtractingFile}
                className="w-full p-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-y font-mono"
              />
              <span className="absolute bottom-2.5 right-3 text-[11px] text-outline font-sans">
                {resumeText.trim().length} chars
              </span>
            </div>
          </div>

          {/* Target Interview Date Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="target-date-input" className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">event</span>
                Target Interview Date
              </label>
              <input
                id="target-date-input"
                type="text"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                placeholder="e.g. October 28, 2026 or Next Month"
                disabled={isAnalyzing}
                className="w-full p-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">speed</span>
                Pacing Timeline
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {['In 1 Week', 'In 2 Weeks', 'In 1 Month'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => {
                      const d = new Date();
                      if (preset === 'In 1 Week') d.setDate(d.getDate() + 7);
                      if (preset === 'In 2 Weeks') d.setDate(d.getDate() + 14);
                      if (preset === 'In 1 Month') d.setMonth(d.getMonth() + 1);
                      setTargetDate(d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
                    }}
                    className="flex-1 py-1 px-2 rounded text-xs bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-medium transition-colors text-center cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Active Card */}
          {isAnalyzing && (
            <div className="p-4 rounded-xl bg-primary-fixed/20 border border-primary/20 flex items-center gap-3 animate-in fade-in">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm font-semibold text-primary">
                  Processing with NVIDIA Nemotron 3.5...
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {analysisStep}
                </span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-container">
            {!forceRequired && (
              <button
                type="button"
                onClick={onClose}
                disabled={isAnalyzing}
                className="px-4 py-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isAnalyzing || isExtractingFile || !resumeText.trim() || isRawPdfContent(resumeText)}
              className="px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all shadow-sm text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Analyzing Profile...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                  <span>Analyze Resume &amp; Calibrate Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
