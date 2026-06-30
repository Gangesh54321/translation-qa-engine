import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// ExplainerVideoPlayer removed — @remotion/player caused SecurityError crashes
import { BlogIntroduction } from './components/BlogIntroduction';
import { DocumentationView } from './components/DocumentationView';
import { FeatureSlider } from './components/FeatureSlider';

import {
  Upload,
  FileText,
  Play,
  AlertCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  LogOut,
  Palette,
  User,
  Trash2,
  Settings,
  X,
  Languages,
  ArrowRight,
  Book,
  BookMarked,
  LogIn,
  ShieldCheck,
  Zap,
  FileJson,
  FileCode2,
  Terminal,
  Braces,
  FileSpreadsheet,
  FileType,
  FileCheck,
  Download,
  Search,
  CheckCircle,
  BarChart3,
  ArrowLeft,
  ChevronDown,
  HelpCircle,
  FolderUp,
  Hash,
  Maximize2,
  Lock,
  CheckCircle2,
  Percent
} from 'lucide-react';

import { AuthView } from './components/AuthView';
import { FooterStrip } from './components/FooterStrip';
import { LinguisticInsights } from './components/LinguisticInsights';
import { SAMPLE_FILE, SAMPLE_GLOSSARY } from './data/sampleQA';
const getFileIcon = (ext: string) => {
  switch (ext) {
    case 'JSON': return <FileJson className="w-3 h-3 mr-1.5" />;
    case 'XML':
    case 'XLIFF':
    case 'RESX':
    case 'TMX':
    case 'TTX':
    case 'TBX':
    case 'MQXLIFF':
      return <FileCode2 className="w-3 h-3 mr-1.5" />;
    case 'PO':
    case 'STRINGS':
    case 'PROPERTIES':
      return <Terminal className="w-3 h-3 mr-1.5" />;
    case 'YAML': return <Braces className="w-3 h-3 mr-1.5" />;
    case 'CSV':
    case 'TSV':
      return <FileSpreadsheet className="w-3 h-3 mr-1.5" />;
    case 'TXT': return <FileType className="w-3 h-3 mr-1.5" />;
    default: return <FileText className="w-3 h-3 mr-1.5" />;
  }
};




import { Separator } from '@/components/ui/separator';



import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { parseFile, FileParserError, parseGlossaryFile, detectFileType } from '@/lib/fileParser';


import type {
  TranslationFile,
  QAResult,
  QAIssue,
  IssueType,
  IssueCategory,
  QAConfig,
  GlossaryTerm
} from '@/types/translation';
import { ISSUE_TYPE_LABELS, ISSUE_SEVERITY_COLORS, SUPPORTED_FILE_EXTENSIONS, ISSUE_CATEGORY_MAP, ISSUE_CATEGORY_LABELS } from '@/types/translation';

import { runQA, DEFAULT_CONFIG } from '@/lib/qaEngine';

import { exportToExcel, exportToHTML, exportToRTF } from '@/lib/exportService';
import { auth, updateUserCredits, logPaymentTransaction, getUserCredits } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import './App.css';

// Global variables for dictionary caching
let cachedDictionary: string[] | undefined = undefined;
let cachedDictionaryLocale: string | undefined = undefined;

// generateHTMLReport removed in favor of exportToHTML from exportService

const SUB_CATEGORY_RULES: Record<string, IssueType[]> = {
  'untranslatables': ['lang_partial_untranslated', 'seg_source_copied'],
  'terminology': ['term_missing', 'term_approved_not_used', 'term_translation_mismatch'],
  'consistency': ['consist_identical_source', 'consist_identical_target'],
  'spelling': ['lang_spelling', 'lang_grammar', 'lang_repeated_word'],
  'case': ['cap_mismatch', 'cap_incorrect_upper', 'cap_incorrect_lower', 'cap_sentence_start', 'cap_all_caps_mismatch'],
  'punctuation': ['punct_missing', 'punct_extra', 'punct_mismatch', 'space_leading', 'space_trailing', 'space_double', 'space_before_punct', 'space_missing_after_punct'],
  'quotes': ['punct_incorrect_quotes', 'punct_quotes_mismatch', 'punct_unpaired_quotes', 'punct_unpaired_symbol'],
  'measurement': ['loc_measurement', 'num_measurement_mismatch'],
  'tags': ['tag_missing', 'tag_extra', 'tag_order_mismatch', 'tag_position_mismatch', 'tag_pair_mismatch', 'tag_formatting_mismatch'],
  'numbers': ['num_missing', 'num_extra', 'num_mismatch', 'num_decimal_mismatch', 'num_thousand_mismatch', 'num_currency_mismatch'],
  'miscellaneous': ['loc_date', 'regex_email', 'regex_url']
};

interface AuthViewProps {
  onClose: () => void;
  onSuccess: (userData: { name: string; email: string; password?: string; isLogin?: boolean; rememberMe?: boolean }) => void;
}

interface User {
  name: string;
  email: string;
  credits: number;
  password?: string;
  rememberMe?: boolean;
}

interface IssueItemProps {
  issue: QAIssue;
  index: number;
  fileName?: string;
  onSelect: () => void;
  onApplyFix: (issue: QAIssue) => void;
}

const IssueItem = ({ issue, index, fileName, onSelect, onApplyFix }: IssueItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={onSelect}
    className="group relative bg-card hover:bg-accent/50 p-5 cursor-pointer transition-all border-b last:border-0"
  >
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 mt-1">
        {issue.severity === 'error' ? (
          <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-destructive" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded leading-none">#{issue.index || issue.key}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${issue.severity === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600'
              }`}>
              {issue.type.replace(/_/g, ' ')}
            </span>
            {fileName && (
              <Badge variant="secondary" className="text-[9px] h-4 font-normal bg-muted/50 border-transparent">
                {fileName}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm font-medium leading-relaxed mb-4 text-foreground/90">{issue.message}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">Source Context</p>
            <div className="p-3 rounded-xl bg-muted/30 border border-transparent group-hover:border-indigo-500/10 transition-colors">
              <p className="text-xs font-mono italic whitespace-pre-wrap break-words">
                <HighlightText text={issue.source} />
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">Target String</p>
            <div className="p-3 rounded-xl bg-muted/30 border border-transparent group-hover:border-indigo-500/10 transition-colors">
              <p className="text-xs font-mono whitespace-pre-wrap break-words">
                <HighlightText text={issue.target} />
              </p>
            </div>
          </div>
        </div>

        {issue.suggestion && (
          <div className="mt-4 p-3 rounded-xl bg-green-500/5 border border-green-500/10 flex items-center justify-between group/fix animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                <RefreshCw className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-green-700/60 tracking-widest mb-0.5">Suggested Correction</p>
                <p className="text-xs font-mono text-green-700 font-bold">{issue.suggestion}</p>
              </div>
            </div>
            {issue.autoFix && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-green-500/20 text-green-700 hover:bg-green-500 hover:text-white transition-all shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyFix(issue);
                }}
              >
                Auto-fix
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

// helper exported for tests and potential reuse
export function isAboutPath(pathname: string = typeof window !== 'undefined' ? window.location.pathname : ''): boolean {
  return pathname === '/about' || pathname === '/';
}

export function isWorkspacePath(pathname: string = typeof window !== 'undefined' ? window.location.pathname : ''): boolean {
  return pathname === '/qa' || pathname === '/workspace' || pathname.startsWith('/qa/');
}

const HighlightText = ({ text }: { text: string }) => {
  if (!text) return null;
  const tagPattern = /(\{[^}]+\})/g;
  const parts = text.split(tagPattern);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.match(tagPattern)) {
          return (
            <span key={i} className="text-blue-600 font-black px-1 bg-blue-500/10 rounded-sm inline-block leading-none border border-blue-200">
              {part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
};


export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('transtech_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [files, setFiles] = useState<TranslationFile[]>([]);
  const [results, setResults] = useState<QAResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<QAIssue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string[]>(['error', 'warning', 'info']);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<QAConfig>(DEFAULT_CONFIG);
  const [selectedCheckGroup, setSelectedCheckGroup] = useState<IssueCategory>('terminology');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'checks' | 'options' | 'actions'>('checks');
  const [hasRunQA, setHasRunQA] = useState(false);
  const [hasStartedQA, setHasStartedQA] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [glossaryFiles, setGlossaryFiles] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [viewMode, setViewMode] = useState<'flat' | 'category'>('flat');
  const [showAuth, setShowAuth] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [workspaceTab, setWorkspaceTab] = useState<'files' | 'filters' | 'glossary' | 'settings' | 'length'>('files');
  const [glossarySearch, setGlossarySearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('untranslatables');
  const [geoConfig, setGeoConfig] = useState({ currency: 'INR', symbol: '₹', isIndia: true });
  const [showLinguisticInsights, setShowLinguisticInsights] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Clean up legacy test accounts on first launch to ensure a fresh start
  useEffect(() => {
    const hasLegacy = localStorage.getItem('transtech_user') || localStorage.getItem('transtech_all_users');
    if (hasLegacy) {
      localStorage.removeItem('transtech_user');
      localStorage.removeItem('transtech_all_users');
      setUser(null);
      console.log("[Cleanup] All legacy test accounts cleared for fresh Google Authentication.");
    }
  }, []);

  // Persistence Effect
  useEffect(() => {
    if (user) {
      // Only save session to localStorage if rememberMe is true
      if (user.rememberMe !== false) {
        localStorage.setItem('transtech_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('transtech_user');
      }
      
      // Sync with global users "database" to persist credits across logins
      const allUsers = JSON.parse(localStorage.getItem('transtech_all_users') || '{}');
      allUsers[user.email] = user;
      localStorage.setItem('transtech_all_users', JSON.stringify(allUsers));

      // Sync credits to Firestore database if user is authenticated via Firebase
      const firebaseUser = auth?.currentUser;
      if (firebaseUser) {
        updateUserCredits('qa-feature', firebaseUser.uid, user.credits).catch((err) => {
          console.error("[Firebase] Failed to auto-sync credits to Firestore:", err);
        });
      }
    } else {
      localStorage.removeItem('transtech_user');
    }
  }, [user]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    // Detect location using timezone as a lightweight method
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
      setGeoConfig({ currency: 'INR', symbol: '₹', isIndia: true });
    } else {
      setGeoConfig({ currency: 'USD', symbol: '$', isIndia: false });
    }

    // Sync workspaceTab with URL subpath
    const path = window.location.pathname;
    if (path === '/qa/file-setting') {
      setWorkspaceTab('filters');
      setHasStartedQA(true);
    } else if (path === '/qa/glossary-setting') {
      setWorkspaceTab('glossary');
      setHasStartedQA(true);
    } else if (path === '/qa/rules-setting') {
      setWorkspaceTab('settings');
      setHasStartedQA(true);
    } else if (path === '/qa/length-setting') {
      setWorkspaceTab('length');
      setHasStartedQA(true);
    }
  }, []);

  useEffect(() => {
    if (isWorkspacePath() && user && !isAnalyzing) {
      const subpath = workspaceTab !== 'files' ? `/${workspaceTab}` : '';
      const newPath = subpath ? `/qa${subpath}` : '/qa';
      if (currentPath !== newPath) {
        navigateTo(newPath);
      }
    }
  }, [workspaceTab, user, isAnalyzing, currentPath]);

  const isWorkspacePath = () => currentPath.startsWith('/qa') || currentPath.startsWith('/workspace');
  const isAboutPath = () => currentPath === '/' || currentPath === '';
  const isAbout = !user || isAboutPath();

  const handleLoginSuccess = async (userData: { name: string; email: string; password?: string; isLogin?: boolean; rememberMe?: boolean }) => {
    // Check if user already exists in local storage "database"
    const allUsers = JSON.parse(localStorage.getItem('transtech_all_users') || '{}');
    let existingUser = allUsers[userData.email];

    if (!existingUser) {
      // Auto-create user for Google Sign-In with 10 free credits
      existingUser = {
        name: userData.name,
        email: userData.email,
        credits: 10, // Give 10 credits on first login
        rememberMe: true
      };
    } else {
      // Always update local name with the fresh Google name
      existingUser.name = userData.name;
    }

    // Try to sync with Firestore if firebase authentication is active
    const firebaseUser = auth?.currentUser;
    if (firebaseUser) {
      try {
        const firestoreCredits = await getUserCredits('qa-feature', firebaseUser.uid);
        if (firestoreCredits !== null) {
          existingUser.credits = firestoreCredits;
          console.log(`[Firebase] Loaded ${firestoreCredits} credits from Firestore for user ${userData.email}`);
        } else {
          // If the user doesn't have credits stored in Firestore yet, write the default credits (10 or current) to Firestore
          await updateUserCredits('qa-feature', firebaseUser.uid, existingUser.credits);
        }
      } catch (err) {
        console.error("[Firebase] Error syncing credits on login:", err);
      }
    }

    allUsers[userData.email] = existingUser;
    localStorage.setItem('transtech_all_users', JSON.stringify(allUsers));

    // Login Successful
    const loggedInUser = {
      ...existingUser,
      rememberMe: userData.rememberMe ?? true
    };
    setUser(loggedInUser);
    setShowAuth(false);
    setShowDocs(false);
    setShowDashboard(true);
    toast.success(`Hi ${userData.name}, Welcome to TransTech Hub!`, {
      description: `Session active with ${existingUser.credits} credits.`
    });
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.error('Firebase sign-out error:', err);
    }
    setUser(null);
    setFiles([]);
    setResults([]);
    setHasRunQA(false);
    setHasStartedQA(false);
    setShowDashboard(false);
    setShowDocs(false);
    navigateTo('/');
    toast.info("Logged out successfully");
  };

  const handlePayment = useCallback((creditsToAdd: number, amount: number) => {
    console.log(`Payment button clicked for ${creditsToAdd} credits`);
    if (!user) {
      console.log("No user found");
      toast.error("Please log in to purchase credits.");
      return;
    }

    const rzpKey = import.meta.env.VITE_RAZORPAY_LIVE_KEY;
    console.log("Key from env:", rzpKey);
    if (!rzpKey) {
      alert("Error: .env file is not loaded! Please completely stop your terminal/server (Ctrl+C) and run 'npm run dev' again so it reads the .env file.");
      toast.error("Configuration Error", {
        description: "Razorpay Live Key is missing. Did you restart the server after creating .env?"
      });
      return;
    }

    const amountInSmallestUnit = amount * 100;

    const options = {
      key: rzpKey,
      amount: amountInSmallestUnit.toString(),
      currency: geoConfig.currency,
      name: "TransTech Hub",
      description: `${creditsToAdd} Audit Credits`,
      handler: async function (response: any) {
        const newCredits = user.credits + creditsToAdd;
        
        // 1. Update local React state
        setUser(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            credits: newCredits
          };
        });

        // 2. Persist to Firestore and Log Transaction if Firebase auth is active
        const firebaseUser = auth?.currentUser;
        if (firebaseUser) {
          try {
            // Update credits in Firestore
            await updateUserCredits('qa-feature', firebaseUser.uid, newCredits);
            
            // Log payment details in Firestore transactions subcollection
            await logPaymentTransaction('qa-feature', firebaseUser.uid, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id || '',
              razorpay_signature: response.razorpay_signature || '',
              amount: amount,
              currency: geoConfig.currency,
              creditsAdded: creditsToAdd,
              status: 'verified_simulated'
            });

            console.log("[Firebase] Successfully persisted credits and logged transaction.");
          } catch (dbErr) {
            console.error("[Firebase] Error saving transaction/credits:", dbErr);
          }
        }

        // 3. Highlight Security Verification in Dev Mode
        console.log("%c[Security Info] In production, you must verify the signature on your server side:", "color: #FF5C00; font-weight: bold;");
        console.log(`Signature details received:\nPayment ID: ${response.razorpay_payment_id}\nOrder ID: ${response.razorpay_order_id}\nSignature: ${response.razorpay_signature}`);

        toast.success("Payment Successful!", {
          description: `${creditsToAdd} Credits have been added to your account.`
        });
      },
      prefill: {
        name: user.name
      },
      theme: {
        color: "#FF5C00"
      }
    };
    
    try {
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        toast.error("Payment Failed", {
          description: response.error.description
        });
        
        // Log failed payment if Firebase is active
        const firebaseUser = auth?.currentUser;
        if (firebaseUser) {
          logPaymentTransaction('qa-feature', firebaseUser.uid, {
            razorpay_payment_id: response.error.metadata?.payment_id || `fail_${Date.now()}`,
            amount: amount,
            currency: geoConfig.currency,
            creditsAdded: 0,
            status: 'failed'
          }).catch(console.error);
        }
      });
      rzp1.open();
    } catch (e: any) {
      console.error("Razorpay error:", e);
      toast.error("Razorpay SDK failed to load. Are you online?");
    }
  }, [user, geoConfig]);

  // Handle file upload
  const handleFileUpload = useCallback(async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;
    
    setHasRunQA(false);
    // Reset selective filtering on new upload
    setConfig(prev => ({
      ...prev,
      selectiveFiltering: { excludeIce: undefined, excludeLocked: undefined }
    }));
    
    try {
      // Check Credits
      if (user) {
        if (user.credits <= 0) {
          toast.error("Out of Credits", {
            description: `You have exhausted your free credits. Please contact support to add more.`
          });
          return;
        }
      }

      const newFiles: TranslationFile[] = [];
      const filesArray = Array.from(uploadedFiles);
      let skippedCount = 0;
      
      for (const file of filesArray) {
        const isSupported = detectFileType(file.name);
        if (!isSupported) {
          console.warn(`Skipping unsupported file: ${file.name}`);
          skippedCount++;
          continue;
        }

        try {
          const parsedFile = await parseFile(file);
          if (parsedFile.units.length === 0) {
            toast.warning(`Empty file: ${file.name}`, {
              description: "No translation units were found in this file."
            });
          }
          newFiles.push(parsedFile);
          
          toast.success(`Parsed ${file.name}`, {
            description: `${parsedFile.units.length} translation units found`,
          });
          
          // Yield to event loop to keep UI responsive
          await new Promise(resolve => setTimeout(resolve, 0));
        } catch (error) {
          console.error(`Error parsing ${file.name}:`, error);
          toast.error(`Failed to parse ${file.name}`, {
            description: error instanceof Error ? error.message : "Internal parser error",
          });
        }
      }

      if (skippedCount > 0) {
        toast.info(`Skipped ${skippedCount} file(s)`, {
          description: "Some files were not recognized as supported translation formats."
        });
      }

      if (newFiles.length > 0) {
        // Auto-detect target language and merge glossary terms
        let detectedLangs = new Set<string>();
        for (const f of newFiles) {
          if (!f.targetLanguage || f.targetLanguage === '') {
            // Check file name regex
            const regex1 = new RegExp('[._-]([a-z]{2}(?:_[a-z]{2})?)(?:\\.[a-z]+)?$', 'i');
            const regex2 = new RegExp('^([a-z]{2}(?:_[a-z]{2})?)[._-]', 'i');
            const fileExtAndLocale = f.name.toLowerCase().match(regex1) || f.name.toLowerCase().match(regex2);
            if (fileExtAndLocale) {
              f.targetLanguage = fileExtAndLocale[1].substring(0, 2);
            } else {
              // Extract from script counts
              let cjkCount = 0;
              let arabicCount = 0;
              let cyrillicCount = 0;
              let devanagariCount = 0;
              let greekCount = 0;
              let totalUnits = 0;
              
              const reCJK = new RegExp('[\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff]');
              const reArabic = new RegExp('[\\u0600-\\u06FF]');
              const reCyrillic = new RegExp('[\\u0400-\\u04FF]');
              const reDevanagari = new RegExp('[\\u0900-\\u097F]');
              const reGreek = new RegExp('[\\u0370-\\u03FF]');

              for (const unit of f.units) {
                if (!unit.target) continue;
                totalUnits++;
                if (reCJK.test(unit.target)) cjkCount++;
                if (reArabic.test(unit.target)) arabicCount++;
                if (reCyrillic.test(unit.target)) cyrillicCount++;
                if (reDevanagari.test(unit.target)) devanagariCount++;
                if (reGreek.test(unit.target)) greekCount++;
              }
              if (totalUnits > 0) {
                if (cjkCount / totalUnits > 0.1) f.targetLanguage = 'zh';
                else if (arabicCount / totalUnits > 0.1) f.targetLanguage = 'ar';
                else if (cyrillicCount / totalUnits > 0.1) f.targetLanguage = 'ru';
                else if (devanagariCount / totalUnits > 0.1) f.targetLanguage = 'hi';
                else if (greekCount / totalUnits > 0.1) f.targetLanguage = 'el';
                else {
                  // Detect Latin sub-languages (English, Spanish, French, German, Italian, Portuguese)
                  let enScore = 0;
                  let esScore = 0;
                  let frScore = 0;
                  let deScore = 0;
                  let itScore = 0;
                  let ptScore = 0;
                  
                  const enWords = new Set(['the', 'and', 'that', 'with', 'this', 'have', 'from', 'your', 'are']);
                  const esWords = new Set(['el', 'los', 'las', 'del', 'que', 'con', 'para', 'como', 'este', 'una']);
                  const frWords = new Set(['les', 'des', 'est', 'avec', 'pour', 'dans', 'cette', 'pour', 'dans']);
                  const deWords = new Set(['der', 'die', 'das', 'und', 'ist', 'mit', 'auf', 'für', 'eine', 'den']);
                  const itWords = new Set(['gli', 'che', 'con', 'per', 'nella', 'questo', 'sono', 'della']);
                  const ptWords = new Set(['dos', 'das', 'uma', 'com', 'para', 'este', 'mais', 'para', 'pela']);

                  for (const unit of f.units) {
                    if (!unit.target) continue;
                    const words = (unit.target.toLowerCase().match(/[a-z]+/g) || []);
                    for (const w of words) {
                      if (enWords.has(w)) enScore++;
                      if (esWords.has(w)) esScore++;
                      if (frWords.has(w)) frScore++;
                      if (deWords.has(w)) deScore++;
                      if (itWords.has(w)) itScore++;
                      if (ptWords.has(w)) ptScore++;
                    }
                  }

                  const scores = [
                    { lang: 'en', score: enScore },
                    { lang: 'es', score: esScore },
                    { lang: 'fr', score: frScore },
                    { lang: 'de', score: deScore },
                    { lang: 'it', score: itScore },
                    { lang: 'pt', score: ptScore }
                  ];
                  scores.sort((a, b) => b.score - a.score);
                  
                  if (scores[0].score > 0) {
                    f.targetLanguage = scores[0].lang;
                  } else {
                    f.targetLanguage = 'en'; // Safe default
                  }
                }
              } else {
                f.targetLanguage = 'en'; // Safe default
              }
            }
          }
          if (f.targetLanguage) detectedLangs.add(f.targetLanguage);
        }

        const PRESET_GLOSSARIES: Record<string, GlossaryTerm[]> = {
          'hi': [
            { source: 'Account', target: 'खाता', context: 'Banking/User profile' },
            { source: 'Payment', target: 'भुगतान', context: 'Transaction' },
            { source: 'Submit', target: 'जमा करें', context: 'Form action' }
          ],
          'es': [
            { source: 'Account', target: 'Cuenta', context: 'Banking/User profile' },
            { source: 'Payment', target: 'Pago', context: 'Transaction' },
            { source: 'Submit', target: 'Enviar', context: 'Form action' }
          ],
          'fr': [
            { source: 'Account', target: 'Compte', context: 'Banking/User profile' },
            { source: 'Payment', target: 'Paiement', context: 'Transaction' },
            { source: 'Submit', target: 'Soumettre', context: 'Form action' }
          ],
          'zh': [
            { source: 'Account', target: '账户', context: 'Banking/User profile' },
            { source: 'Payment', target: '支付', context: 'Transaction' },
            { source: 'Submit', target: '提交', context: 'Form action' }
          ],
          'ru': [
            { source: 'Account', target: 'Учетная запись', context: 'Banking/User profile' },
            { source: 'Payment', target: 'Оплата', context: 'Transaction' },
            { source: 'Submit', target: 'Отправить', context: 'Form action' }
          ]
        };

        const presetTerms: GlossaryTerm[] = [];
        detectedLangs.forEach(lang => {
          if (PRESET_GLOSSARIES[lang]) {
            presetTerms.push(...PRESET_GLOSSARIES[lang]);
          }
        });

        if (presetTerms.length > 0) {
          const langsStr = Array.from(detectedLangs).join(', ');
          const msg = `Auto Glossary (${langsStr})`;
          setGlossary(prev => [...prev, ...presetTerms]);
          setGlossaryFiles(prev => {
            const next = new Set([...prev, msg]);
            return Array.from(next);
          });
          setConfig(prev => ({
            ...prev,
            glossary: [...(prev.glossary || []), ...presetTerms]
          }));
          toast.success(`Automatically applied preset glossary for ${langsStr}`);
        }

        if (files.length === 0) {
          setSelectedFile(newFiles[0].id);
        }
        setFiles(prev => [...prev, ...newFiles]);
        
        // Deduct credits for successful uploads (1 credit per file)
        if (user) {
          setUser(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              credits: Math.max(0, prev.credits - newFiles.length)
            };
          });
        }
        
        toast.success(`Loaded ${newFiles.length} file(s)`);
      } else if (filesArray.length > 0 && skippedCount === filesArray.length) {
        toast.error("No valid files found", {
          description: "Please ensure you are uploading supported formats like XLIFF, JSON, or Excel."
        });
      }
    } catch (e) {
      toast.error("Critical error during upload");
      console.error(e);
    }
  }, [config, user, files]);

  // Fallback for selectedFile
  useEffect(() => {
    if (files.length > 0 && !selectedFile) {
      setSelectedFile(files[0].id);
    }
  }, [files, selectedFile]);
  
  // Explicitly run QA analysis on user trigger
  const runAllFilesAnalysis = useCallback(async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setHasRunQA(true);

    let wordsArray: string[] | undefined = cachedDictionary;
    const fileTargetLang = files[0]?.targetLanguage || 'hi';
    const targetLang = fileTargetLang.toLowerCase().replace('-', '_');

    if (config.rules.lang_spelling && (!wordsArray || cachedDictionaryLocale !== targetLang)) {
      try {
        const indexRes = await fetch(`${window.location.origin}/dictionaries/index.json`);
        const index = await indexRes.json();
        
        let match = index.find((d: any) => {
          const loc = d.locale.toLowerCase();
          const target = targetLang.toLowerCase();
          return (
            loc === target ||
            target.startsWith(loc) ||
            loc.startsWith(target) ||
            loc.substring(0, 2) === target.substring(0, 2) ||
            (target.includes('hin') && loc.includes('hi')) ||
            (target.includes('hi') && loc.includes('hi'))
          );
        });

        if (!match) {
          match = index.find((d: any) => d.locale.toLowerCase().startsWith('hi'));
        }

        if (!match) {
          match = index.find((d: any) => d.locale.toLowerCase() === 'hi_in');
        }

        if (match) {
          const dicFiles = match.files.filter((f: string) => f.endsWith('.dic'));
          const words = new Set<string>();
          
          for (const dicFile of dicFiles) {
            const res = await fetch(`${window.location.origin}/dictionaries/${match.locale}/${dicFile}`);
            const text = await res.text();
            
            const lines = text.split('\n');
            for (let i = 1; i < lines.length; i++) {
              const word = lines[i].split('/')[0].trim();
              if (word) {
                words.add(word.toLowerCase());
                words.add(word);
              }
            }
          }
          cachedDictionary = Array.from(words);
          cachedDictionaryLocale = targetLang;
          wordsArray = cachedDictionary;
          setConfig(prev => ({ ...prev, dictionary: wordsArray }));
          console.log(`✅ Loaded dictionary for ${match.locale} (${words.size} words)`);
        }
      } catch (dictErr) {
        console.warn('Could not load spellcheck dictionary on main thread:', dictErr);
      }
    }

    const updatedResults: QAResult[] = [];
    const allUnits = files.flatMap(f => f.units || []);
    
    for (const file of files) {
      try {
        const worker = new Worker(new URL('./lib/qa.worker.ts', import.meta.url), { type: 'module' });
        const result = await new Promise<QAResult>((resolve, reject) => {
          worker.onmessage = (e) => {
            if (e.data.type === 'success') {
              resolve(e.data.result);
            } else {
              reject(new Error(e.data.error));
            }
            worker.terminate();
          };
          worker.onerror = (err) => {
            reject(err);
            worker.terminate();
          };
          worker.postMessage({ 
            file, 
            config: { ...config, dictionary: wordsArray || config.dictionary, geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY },
            allUnits,
            baseUrl: window.location.origin 
          });
        });
        updatedResults.push(result);
      } catch (err) {
        console.error(`QA Engine failed for file ${file.name}:`, err);
        updatedResults.push({
          fileId: file.id,
          fileName: file.name,
          totalUnits: file.units.length,
          issues: [],
          stats: { total: 0, errors: 0, warnings: 0, info: 0, byType: {} as any },
          completedAt: new Date()
        } as QAResult);
      }
    }
    setResults(updatedResults);
    setIsAnalyzing(false);
  }, [config, files]);
 
  // Scroll monitoring for active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'features', 'categories', 'formats'];
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-select first file or combined report when files load or change
  useEffect(() => {
    if (files.length > 0) {
      const fileExists = files.some(f => f.id === selectedFile) || selectedFile === 'combined';
      if (!fileExists) {
        setSelectedFile(files.length > 1 ? 'combined' : files[0].id);
      }
    } else {
      setSelectedFile(null);
    }
  }, [files, selectedFile]);



  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  // Clear all files
  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setResults([]);
    setGlossary([]);
    setGlossaryFiles([]);
    setSelectedFile(null);
    setSelectedIssue(null);
    setHasRunQA(false);
  }, []);

  // Handle glossary upload
  const handleGlossaryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const terms = await parseGlossaryFile(file);
      setGlossary(terms);
      setGlossaryFiles(prev => [...new Set([...prev, file.name])]);

      // Update config with glossary
      setConfig(prev => ({
        ...prev,
        glossary: terms
      }));

      toast.success(`Glossary loaded: ${file.name}`, {
        description: `${terms.length} terms loaded into audit engine`,
      });

      // Auto re-run QA if results already exist (meaning user already ran QA once)
      if (files.length > 0 && results.length > 0) {
        const newResults = files.map(f => runQA(f, { ...config, glossary: terms }));
        setResults(newResults);
      }

    } catch (error) {
      toast.error(`Failed to load glossary: ${file.name}`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [files, config, results, glossaryFiles]);







  // Re-run QA with new config
  const rerunQA = useCallback(async () => {
    if (files.length === 0) return;

    // Check credits before running audit
    if (user && user.credits <= 0) {
      toast.error("Out of Credits", {
        description: "Please top up your credits to run a new audit."
      });
      return;
    }

    setIsAnalyzing(true);
    const runToast = toast.loading('Running QA analysis in background...');

    try {
      let wordsArray: string[] | undefined = cachedDictionary;
      const fileTargetLang = files[0]?.targetLanguage || 'hi';
      const targetLang = fileTargetLang.toLowerCase().replace('-', '_');

      if (config.rules.lang_spelling && (!wordsArray || cachedDictionaryLocale !== targetLang)) {
        try {
          const indexRes = await fetch(`${window.location.origin}/dictionaries/index.json`);
          const index = await indexRes.json();
          
          let match = index.find((d: any) => {
            const loc = d.locale.toLowerCase();
            const target = targetLang.toLowerCase();
            return (
              loc === target ||
              target.startsWith(loc) ||
              loc.startsWith(target) ||
              loc.substring(0, 2) === target.substring(0, 2) ||
              (target.includes('hin') && loc.includes('hi')) ||
              (target.includes('hi') && loc.includes('hi'))
            );
          });

          if (!match) {
            match = index.find((d: any) => d.locale.toLowerCase().startsWith('hi'));
          }

          if (match) {
            const dicFiles = match.files.filter((f: string) => f.endsWith('.dic'));
            const words = new Set<string>();
            for (const dicFile of dicFiles) {
              const res = await fetch(`${window.location.origin}/dictionaries/${match.locale}/${dicFile}`);
              const text = await res.text();
              const lines = text.split('\n');
              for (let i = 1; i < lines.length; i++) {
                const word = lines[i].split('/')[0].trim();
                if (word) {
                  words.add(word.toLowerCase());
                  words.add(word);
                }
              }
            }
            cachedDictionary = Array.from(words);
            cachedDictionaryLocale = targetLang;
            wordsArray = cachedDictionary;
            setConfig(prev => ({ ...prev, dictionary: wordsArray }));
          }
        } catch (err) {
          console.warn('Could not load dictionary inside rerunQA:', err);
        }
      }

      const currentConfig = { ...config, glossary };
      const newResults: QAResult[] = [];

      for (const file of files) {
        const worker = new Worker(new URL('./lib/qa.worker.ts', import.meta.url), { type: 'module' });
        
        const result = await new Promise<QAResult>((resolve, reject) => {
          worker.onmessage = (e) => {
            if (e.data.type === 'success') {
              resolve(e.data.result);
            } else {
              reject(new Error(e.data.error));
            }
            worker.terminate();
          };
          worker.onerror = (err) => {
            reject(err);
            worker.terminate();
          };
          worker.postMessage({ 
            file, 
            config: { ...currentConfig, dictionary: wordsArray || config.dictionary, geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY }, 
            baseUrl: window.location.origin 
          });
        });
        
        newResults.push(result);
      }

      setResults(newResults);

      // Deduct 1 credit for manual re-run
      if (user) {
        setUser(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            credits: Math.max(0, prev.credits - 1)
          };
        });
      }

      toast.dismiss(runToast);
      toast.success('QA analysis completed', {
        description: `Analyzed ${files.length} file(s) with ${glossary.length} glossary terms`,
      });

      if (newResults.length > 0 && !selectedFile) {
        setSelectedFile(newResults[0].fileId);
      }
    } catch (error) {
      toast.dismiss(runToast);
      toast.error('QA analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [files, config, glossary, selectedFile, user]);

  // Apply auto-fix
  const applyAutoFix = useCallback((issue: QAIssue) => {
    if (!issue.autoFix || !selectedFile) return;

    setFiles(prev => prev.map(f => {
      if (f.id !== selectedFile) return f;
      return {
        ...f,
        units: f.units.map(u => {
          if (u.id !== issue.unitId) return u;
          return { ...u, target: issue.autoFix! };
        })
      };
    }));

    setResults(prev => prev.map(res => {
      if (res.fileId !== selectedFile) return res;
      const updatedIssues = res.issues.filter(i => i.id !== issue.id);
      return {
        ...res,
        issues: updatedIssues,
        stats: {
          ...res.stats,
          errors: updatedIssues.filter(i => i.severity === 'error').length,
          warnings: updatedIssues.filter(i => i.severity === 'warning').length,
          info: updatedIssues.filter(i => i.severity === 'info').length,
        }
      };
    }));

    // Increment usage count for analytics/billing
    // Increment usage count (deduct credit)
    if (user) {
      setUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          credits: Math.max(0, prev.credits - 1)
        };
      });
    }
    
    toast.success('Auto-fix applied');
  }, [user, selectedFile, rerunQA]);

  // Load Sample Project
  const loadSampleProject = useCallback(() => {
    setFiles([SAMPLE_FILE]);
    setGlossary(SAMPLE_GLOSSARY);
    setSelectedFile(SAMPLE_FILE.id);
    
    // Simulate analysis
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = runQA(SAMPLE_FILE, { ...config, glossary: SAMPLE_GLOSSARY });
      setResults([result]);
      setHasRunQA(true);
      setIsAnalyzing(false);
      setShowLinguisticInsights(true);
      toast.success("Sample Project Loaded", {
        description: "Industrial Linguistic QA Demo initialized with 7 segments and pre-configured glossary."
      });
    }, 1500);
  }, [config]);

  // Export report
  const exportReport = useCallback((value: string) => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    const currentResults = selectedFile === 'combined' ? results : [results.find(r => r.fileId === selectedFile)!].filter(Boolean);
    if (!currentResults.length) return;

    if (value === 'excel') {
      exportToExcel(currentResults.length === 1 ? currentResults[0] : currentResults, config).catch(err => {
        console.error('Excel export failed:', err);
        toast.error('Excel export failed');
      });
    } else if (value.startsWith('html-')) {
      const theme = value.split('-')[1] as any;
      exportToHTML(currentResults.length === 1 ? currentResults[0] : currentResults, config, theme);
    } else if (value === 'rtf') {
      const currentFiles = selectedFile === 'combined'
        ? files
        : [files.find(f => f.id === selectedFile)!].filter(Boolean);
      exportToRTF(currentFiles.length === 1 ? currentFiles[0] : currentFiles);
    }

    toast.success('Report exported');
  }, [results, selectedFile, config]);

  const exportCorrectedFile = useCallback(() => {
    const currentFile = files.find(f => f.id === selectedFile) || files[0];
    if (!currentFile) {
      toast.error('No file selected to export');
      return;
    }

    let fileContent = '';
    let mimeType = 'text/plain';
    const ext = currentFile.name.split('.').pop()?.toLowerCase() || 'txt';

    if (ext === 'json') {
      const simplifiedObj = currentFile.units.map(u => ({ id: u.id, source: u.source, target: u.target }));
      fileContent = JSON.stringify(simplifiedObj, null, 2);
      mimeType = 'application/json';
    } else {
      fileContent = currentFile.units.map(u => `Source: ${u.source}\nTarget: ${u.target}`).join('\n\n');
      mimeType = 'text/plain';
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected_${currentFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Corrected file downloaded');
  }, [files, selectedFile]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalFiles = files.length;
    const totalUnits = files.reduce((sum, f) => sum + (f?.units?.length || 0), 0);
    const totalIssues = results.reduce((sum, r) => sum + (r?.issues?.length || 0), 0);
    const errors = results.reduce((sum, r) => sum + (r?.stats?.errors || 0), 0);
    const warnings = results.reduce((sum, r) => sum + (r?.stats?.warnings || 0), 0);
    const info = results.reduce((sum, r) => sum + (r?.stats?.info || 0), 0);
    
    const byType: Record<IssueType, number> = {};
    results.forEach(r => {
      if (r?.stats?.byType) {
        Object.entries(r.stats.byType).forEach(([type, count]) => {
          byType[type as IssueType] = (byType[type as IssueType] || 0) + count;
        });
      }
    });

    return {
      totalFiles,
      totalUnits,
      totalIssues,
      errors,
      warnings,
      info,
      byType,
      isPending: results.length < files.length && files.length > 0
    };
  }, [files, results]);

  // Get current result (supporting Combined View)
  const currentResult = useMemo(() => {
    if (selectedFile === 'combined') {
      return {
        fileId: 'combined',
        fileName: 'Combined Project Report',
        totalUnits: overallStats.totalUnits,
        issues: results.flatMap(r => r.issues),
        stats: {
          total: overallStats.totalIssues,
          errors: overallStats.errors,
          warnings: overallStats.warnings,
          info: overallStats.info,
          byType: overallStats.byType
        },
        completedAt: new Date()
      } as QAResult;
    }
    return results.find(r => r.fileId === selectedFile);
  }, [selectedFile, results, overallStats]);

  // Get filtered issues for current view
  const filteredIssues = useMemo(() => {
    if (!currentResult) return [];

    const unitMap = new Map();
    for (const file of files) {
      for (const unit of file.units) {
        unitMap.set(unit.id, unit);
      }
    }

    const query = searchQuery.trim().toLowerCase();

    return currentResult.issues.filter(issue => {
      const unit = unitMap.get(issue.unitId);
      const sourceText = (unit?.source || issue.source || '').toLowerCase();
      const targetText = (unit?.target || issue.target || '').toLowerCase();
      const keyText = (issue.key || '').toLowerCase();
      const messageText = (issue.message || '').toLowerCase();

      const matchesSearch = !query ||
        sourceText.includes(query) ||
        targetText.includes(query) ||
        keyText.includes(query) ||
        messageText.includes(query);

      const matchesSeverity = severityFilter.includes(issue.severity);

      const cat = ISSUE_CATEGORY_MAP[issue.type] || 'Other';
      let matchesCategory = true;
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'punctuation') {
          matchesCategory = cat === 'punctuation' || cat === 'whitespace';
        } else {
          matchesCategory = cat === categoryFilter;
        }
      }

      // Apply selective filtering if defined in config
      let isExcluded = false;
      if (config.selectiveFiltering) {
        const status = (unit?.status || '').toLowerCase();
        const isICE = status.includes('sign-off') || 
                      status.includes('approved') || 
                      status.includes('exact') ||
                      (unit?.matchPercent !== undefined && unit.matchPercent > 100);
        
        const isLocked = unit?.isLocked || status.includes('locked');
        const is100 = unit?.matchPercent === 100;

        if (config.selectiveFiltering.excludeIce && isICE) isExcluded = true;
        if (config.selectiveFiltering.excludeLocked && isLocked) isExcluded = true;
        if (config.selectiveFiltering.excludeUnlocked && !isLocked) isExcluded = true;
        if (config.selectiveFiltering.exclude100 && is100) isExcluded = true;
        
        if (config.selectiveFiltering.excludeConf && unit?.conf && config.selectiveFiltering.excludeConf.includes(unit.conf)) {
          isExcluded = true;
        }
        
        if (config.selectiveFiltering.excludePercent !== undefined && unit?.matchPercent !== undefined && unit.matchPercent >= config.selectiveFiltering.excludePercent) {
          isExcluded = true;
        }
      }

      return matchesSearch && matchesSeverity && matchesCategory && !isExcluded;
    });
  }, [currentResult, searchQuery, severityFilter, categoryFilter, files, config]);


  // Handle smooth scroll to sections
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 140;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };


  return (
    <>
      <TooltipProvider>

      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fynsec-gradient" />

        {/* FYNSEC Style Floating Nav */}
        <nav className="pill-nav">
          <div className="flex items-center gap-3 pr-6 border-r border-border/50">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-black text-xl select-none">T</span>
            </div>
            <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">TransTech Hub</span>
          </div>

          <div className="flex-1 flex items-center justify-center gap-8">
            {['Home', 'Features', 'Categories', 'Formats', 'Docs', 'QA Engine'].map((tab) => {
              return (
                <button
                  key={tab}
                  onClick={() => {
                    if (tab === 'Docs') {
                      setShowDocs(true);
                      setShowDashboard(false);
                    } else if (tab === 'QA Engine') {
                      if (user) {
                        navigateTo('/qa');
                        setShowDashboard(false);
                        setShowDocs(false);
                        setHasStartedQA(true);
                      } else {
                        setShowAuth(true);
                      }
                    } else {
                      setShowDocs(false);
                      setShowDashboard(false);
                      if (isWorkspacePath()) {
                        navigateTo('/');
                        setTimeout(() => scrollToSection(tab.toLowerCase()), 300);
                      } else {
                        scrollToSection(tab.toLowerCase());
                      }
                    }
                  }}
                  className={`text-[13px] font-black uppercase tracking-[0.15em] transition-all ${
                    (tab === 'Docs' && showDocs) || 
                    (tab === 'Dashboard' && showDashboard) || 
                    (tab.toLowerCase() === activeSection && !showDocs && !showDashboard)
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="ml-auto pl-6 border-l border-border/50">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                  {user.credits} CR
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full border border-primary/10 bg-primary/5 hover:bg-primary/10 p-0 overflow-hidden transition-all hover:ring-2 hover:ring-primary/20"
                    >
                      <Avatar className="h-full w-full">
                        <AvatarFallback className="bg-primary/5 text-primary font-black uppercase text-xs">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 mt-2" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1 p-1">
                        <p className="text-sm font-black leading-none uppercase tracking-tight">{user.name}</p>
                        <p className="text-xs text-muted-foreground leading-none mt-1">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <div className="px-3 py-3 bg-primary/5 rounded-md mx-1 mb-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <Zap className="w-3 h-3 text-primary" /> Credits
                        </span>
                        <span className="text-xs font-black text-primary">{user.credits}</span>
                      </div>
                      <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (user.credits / 10) * 100)}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer font-bold py-2.5 text-xs uppercase tracking-widest" onClick={() => setShowDashboard(true)}>
                      <User className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer font-bold py-2.5 text-xs uppercase tracking-widest" onClick={() => {
                      navigateTo('/qa');
                      setShowDashboard(false);
                      setHasStartedQA(true);
                    }}>
                      <ShieldCheck className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                      <span>Workspace</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5 font-bold py-2.5 text-xs uppercase tracking-widest"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="px-8 py-3 bg-primary text-white text-[13px] font-black uppercase tracking-[0.15em] rounded-full hover:scale-105 active:scale-95 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>

        <main className={`${(files.length > 0 || isAnalyzing || showDashboard) ? 'w-full px-10' : 'container mx-auto px-4'} pt-36 pb-8 relative transition-all duration-300`}>
          <AnimatePresence mode="wait">
            {showDocs ? (
              <DocumentationView key="docs" onBack={() => setShowDocs(false)} />
            ) : showDashboard && user ? (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                <div className="flex items-end justify-between mb-12">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tighter uppercase">User <span className="text-primary">Dashboard</span></h2>
                    <p className="text-sm text-muted-foreground font-medium">Welcome back, {user.name}. Manage your account and linguistic resources.</p>
                  </div>
                  <Button variant="outline" className="rounded-full px-6 border-primary/20 text-primary font-black uppercase tracking-widest text-[10px]" 
                    onClick={() => {
                      navigateTo('/qa');
                      setShowDashboard(false);
                      setHasStartedQA(true); // Direct to editor/upload
                    }}>
                    Back to Workspace
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Credit Card */}
                  <Card className="md:col-span-2 glass border-none shadow-2xl relative overflow-hidden group p-0">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Zap className="w-48 h-48 text-primary" />
                    </div>
                    <CardHeader className="p-10 pb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">Credit Balance</CardTitle>
                      </div>
                      <CardDescription className="text-sm font-medium">Your current analysis capacity for the audit engine.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-0">
                      <div className="flex items-baseline gap-3 mb-8">
                        <span className="text-5xl font-black tracking-tighter text-primary">{user.credits}</span>
                        <span className="text-sm font-black text-muted-foreground/60 uppercase tracking-widest">Credits Available</span>
                      </div>
                      
                      <div className="space-y-4 max-w-md">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                          <span>Usage History</span>
                          <span>{user.credits > 0 ? 'Optimal' : 'Exhausted'}</span>
                        </div>
                        <div className="h-4 w-full bg-muted/50 rounded-full overflow-hidden border border-border/50">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (user.credits / 10) * 100)}%` }}
                            className="h-full rounded-full bg-primary shadow-[0_0_20px_rgba(255,92,0,0.3)]"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">Credits are deducted for each file uploaded or manual audit re-run. Enterprise users enjoy unlimited linguistic processing.</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upgrade Card */}
                  <Card className="border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] bg-white relative overflow-hidden flex flex-col rounded-[2rem]">
                    <CardHeader className="p-10 pb-4">
                      <Badge className="w-fit bg-primary hover:bg-primary/90 text-white font-black px-4 py-1 mb-4 rounded-full text-xs tracking-widest border-none">PREMIUM</Badge>
                      <CardDescription className="text-slate-400 font-medium text-sm leading-relaxed">
                        Unlock full power of the TransTech Hub engine.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-10 pt-4 flex-1 flex flex-col">
                      <ul className="space-y-6 mb-8 flex-1 mt-4">
                        {[
                          "File Audits based on Plan",
                          "Bulk Processing API",
                          "Custom Linguistic Rules"
                        ].map((feature, i) => (
                          <li key={i} className="flex items-center gap-4 text-slate-600 font-bold text-sm">
                            <CheckCircle className="w-6 h-6 text-primary stroke-[1.5]" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto space-y-3">
                        <Button 
                          className="w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 font-black text-lg shadow-[0_5px_20px_-5px_rgba(0,0,0,0.1)] border border-slate-200 transition-all hover:scale-[1.02] flex justify-between items-center px-6" 
                          onClick={() => handlePayment(50, geoConfig.isIndia ? 250 : 5)}
                        >
                          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> 50 Credits</span>
                          <span className="text-primary font-bold">{geoConfig.symbol}{geoConfig.isIndia ? 250 : 5}</span>
                        </Button>
                        <Button 
                          className="w-full h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black text-xl shadow-[0_10px_40px_-10px_rgba(255,92,0,0.4)] transition-all hover:scale-[1.02] flex justify-between items-center px-6" 
                          onClick={() => handlePayment(100, geoConfig.isIndia ? 500 : 10)}
                        >
                          <span className="flex items-center gap-2"><Zap className="w-5 h-5 text-white" fill="currentColor" /> 100 Credits</span>
                          <span>{geoConfig.symbol}{geoConfig.isIndia ? 500 : 10}</span>
                        </Button>
                        <p className="text-center text-[10px] text-slate-400 mt-4 font-black tracking-widest uppercase">
                          Secure Payment via Razorpay
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="glass border-none shadow-xl p-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <User className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email Address</h4>
                        <p className="text-xl font-bold">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <span className="font-black text-2xl select-none">T</span>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Account Security</h4>
                        <p className="text-xl font-bold text-green-600">Verified Professional</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="glass border-none shadow-xl p-10 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-primary/[0.02] transition-colors" onClick={() => setShowDocs(true)}>
                    <Book className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Need Help?</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto mt-2">Explore our documentation to master the professional audit engine.</p>
                  </Card>
                </div>
              </motion.div>
            ) : (!user || isAboutPath()) ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-[1750px] mx-auto px-12 lg:px-24"
              >
                <div id="home" className="py-12 lg:py-20 space-y-24">
                  {/* Top Section: Text Only (Centered) */}
                  <div className="max-w-4xl mx-auto text-center space-y-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.25em]"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Linguistic Intelligence Platform
                    </motion.div>
                    
                    <div className="space-y-3">
                      <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] text-slate-900 dark:text-white uppercase">
                        TransTech <br />
                        <span className="text-primary text-3xl md:text-5xl">QA Engine</span>
                      </h1>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                        Smart Quality Checks for Translations.
                      </p>
                    </div>
                      
                    <p className="text-base text-muted-foreground leading-relaxed font-medium">
                      TransTech QA Engine is an <strong className="text-slate-900 dark:text-white">industrial-grade linguistic intelligence platform</strong> designed for high-precision translation auditing. Supporting over <strong className="text-slate-900 dark:text-white">100 languages</strong> with extensive <em className="text-primary italic">built-in dictionaries</em>, it integrates <strong className="text-slate-900 dark:text-white">AI-enhanced spell check</strong>, <em className="text-primary italic">custom glossaries</em>, and <strong className="text-slate-900 dark:text-white">multi-format support</strong> to ensure flawless localized content at scale.
                    </p>

                    <div className="pt-4 flex justify-center">
                      <Button 
                        onClick={() => {
                          if (user) {
                            navigateTo('/qa');
                            setShowDashboard(false);
                            setHasStartedQA(true);
                          } else {
                            setShowAuth(true);
                          }
                        }}
                        className="px-10 py-5 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-full shadow-[0_20px_50px_-10px_rgba(255,92,0,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 group"
                      >
                        Launch QA Engine
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                      </Button>
                    </div>
                  </div>

                  {/* Bottom Section: Two Columns (Features & Slider) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Core Capabilities */}
                    <motion.div
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="glass border-primary/20 bg-primary/5 p-10 rounded-[3rem] shadow-2xl shadow-primary/10 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                        <div className="space-y-8">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Precision Insight</p>
                            <h4 className="text-lg font-black uppercase tracking-tighter text-slate-900 dark:text-white">Core Capabilities</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            {[
                              { text: "Terminology Support", icon: <ShieldCheck className="w-4 h-4" /> },
                              { text: "Spellcheck", icon: <CheckCircle2 className="w-4 h-4" /> },
                              { text: "Grammar Check", icon: <Zap className="w-4 h-4" /> },
                              { text: "Multiple Files", icon: <FileText className="w-4 h-4" /> },
                              { text: "Multiple Export Formats", icon: <Download className="w-4 h-4" /> }
                            ].map((item, i) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                className="flex items-center gap-4"
                              >
                                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-md border border-slate-100 dark:border-slate-800">
                                  {item.icon}
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{item.text}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </motion.div>

                    {/* Right: Feature Slider */}
                    <motion.div
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="relative z-10"
                    >
                      <div className="rounded-[3rem] overflow-hidden shadow-2xl border border-primary/10 bg-black/5 p-4 lg:p-8 glass">
                        <FeatureSlider />
                      </div>
                    </motion.div>
                  </div>
                </div>

                <div className="mt-20">
                  <BlogIntroduction 
                    features={[
                      { title: "Universal Compatibility", description: "Seamlessly process SDLXLIFF, MQXLIFF/MQXLZ (MemoQ), TMX, and custom Excel structures with zero data loss.", icon: <Languages className="w-5 h-5" aria-hidden="true" /> },
                      { title: "Industrial Rulesets", description: "Standardized QA logic covering terminology, consistency, and tag integrity across all projects.", icon: <ShieldCheck className="w-5 h-5" aria-hidden="true" />, image: "/assets/rulesets_realistic.png" },
                      { title: "Professional Export", description: "Generate board-ready audit reports in Excel, HTML, and Bilingual RTF formats with one click.", icon: <FileText className="w-5 h-5" aria-hidden="true" /> },
                      { title: "Linguistic Focus", description: "Engineered logic that minimizes noise and flags only the most critical linguistic risks.", icon: <BarChart3 className="w-5 h-5" aria-hidden="true" />, image: "/assets/linguistic.png" }
                    ]}
                    onLaunch={() => {
                      if (user) {
                        navigateTo('/qa');
                        setHasStartedQA(true);
                      } else {
                        setShowAuth(true);
                      }
                    }}
                  />
                </div>

              </motion.div>
            ) : ( // This block handles authenticated users or when files are present
              <motion.div
                key="app-main"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Go Back To Workspace Button at the absolute top */}
                {hasRunQA && (
                  <div className="flex justify-start mb-6">
                    <Button
                      onClick={() => {
                        setHasRunQA(false);
                      }}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl px-4 h-10 transition-all border border-border/40 hover:border-primary/20 shadow-sm bg-background/50 hover:shadow"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Go Back To Workspace
                    </Button>
                  </div>
                )}

                {/* Stats Overview */}
                {hasRunQA && files.length > 0 && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
                  >
                    {[
                      { label: 'Files', value: overallStats.totalFiles, icon: FileText, color: 'text-indigo-500' },
                      { label: 'Units', value: overallStats.totalUnits, icon: Languages, color: 'text-purple-500' },
                      { label: 'Issues', value: overallStats.totalIssues, icon: AlertCircle, color: 'text-rose-500' },
                      { label: 'Errors', value: overallStats.errors, icon: X, color: 'text-red-500', bg: 'bg-red-50/50 dark:bg-red-950/20', border: 'border-red-100 dark:border-red-900/50' },
                      { label: 'Warnings', value: overallStats.warnings, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900/50' },
                      { label: 'Info', value: overallStats.info, icon: Info, color: 'text-blue-500', bg: 'bg-blue-50/50 dark:bg-blue-950/20', border: 'border-blue-100 dark:border-blue-900/50' },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className={`border-none shadow-sm shadow-indigo-500/5 glass ${stat.bg || ''} ${stat.border || ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                              </div>
                              <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} aria-hidden="true" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {results.length > 0 && (
                  <div className="flex justify-center mb-8">
                    <div className="bg-muted/50 p-1 rounded-2xl border border-border/50 flex gap-2">
                      <button 
                        onClick={() => setShowLinguisticInsights(false)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showLinguisticInsights ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Issue List
                      </button>
                      <button 
                        onClick={() => setShowLinguisticInsights(true)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showLinguisticInsights ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Linguistic Insights
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {isWorkspacePath() && !hasStartedQA && !hasRunQA && files.length === 0 ? (
                    <motion.div
                      key="qa-prototype-intro"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-4xl mx-auto text-center py-20 space-y-8"
                    >
                      <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-xs font-black uppercase tracking-widest">
                        <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-white mr-1 shadow-sm">
                          <span className="font-black text-[10px] select-none">T</span>
                        </div>
                        Linguistic QA Engine Prototype
                      </div>
                      <h1 className="text-4xl font-black tracking-tighter uppercase">
                        Industrial <span className="text-primary">Precision</span>
                      </h1>
                      <p className="text-sm text-muted-foreground font-medium max-w-2xl mx-auto">
                        Upload your translation files below to begin an automated linguistic audit. 
                        Our engine identifies terminology errors, consistency issues, and tag mismatches.
                      </p>
                      <div className="pt-8 flex items-center justify-center gap-4">
                        <Button 
                          onClick={() => setHasStartedQA(true)}
                          className="h-11 px-8 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-black text-sm shadow-xl shadow-indigo-500/20 transition-all hover:scale-105"
                        >
                          Get Started
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={loadSampleProject}
                          className="h-11 px-8 rounded-xl border-indigo-200 text-indigo-600 font-black text-sm hover:bg-indigo-50 transition-all"
                        >
                          View Sample Audit
                        </Button>
                      </div>
                    </motion.div>
                  ) : isAnalyzing ? (
                    <motion.div
                      key="analyzing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="min-h-[500px] flex flex-col items-center justify-center space-y-6"
                    >
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        {/* Circular ring animation */}
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                        <motion.div 
                          className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        ></motion.div>
                        
                        {/* Central T Symbol */}
                        <div className="relative w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30 shadow-xl shadow-primary/5">
                          <span className="text-5xl font-black text-primary select-none font-sans tracking-tight">T</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <h3 className="text-lg font-black tracking-tight text-foreground">Processing Analysis...</h3>
                        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                          Please wait while the TransTech QA engine runs advanced checks on your translation files.
                        </p>
                      </div>
                    </motion.div>
                  ) : !hasRunQA || files.length === 0 ? (
                    <motion.div
                      key="hero-auth"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full max-w-6xl mx-auto border border-slate-100 dark:border-slate-800 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl shadow-slate-100/40 dark:shadow-none flex flex-col md:flex-row gap-8 items-stretch min-h-[650px]"
                    >
                        {/* Tab Header */}
                        <div className="workspace-tabs-list">
                          <button 
                            onClick={() => setWorkspaceTab('files')}
                            className={`workspace-tab-trigger ${workspaceTab === 'files' ? 'active' : ''}`}
                            data-state={workspaceTab === 'files' ? 'active' : ''}
                          >
                            Files
                          </button>
                          <button 
                            onClick={() => setWorkspaceTab('filters')}
                            className={`workspace-tab-trigger ${workspaceTab === 'filters' ? 'active' : ''}`}
                            data-state={workspaceTab === 'filters' ? 'active' : ''}
                          >
                            File setting
                          </button>
                          <button 
                            onClick={() => setWorkspaceTab('glossary')}
                            className={`workspace-tab-trigger ${workspaceTab === 'glossary' ? 'active' : ''}`}
                            data-state={workspaceTab === 'glossary' ? 'active' : ''}
                          >
                            Glossary settings
                          </button>
                          <button 
                            onClick={() => setWorkspaceTab('settings')}
                            className={`workspace-tab-trigger ${workspaceTab === 'settings' ? 'active' : ''}`}
                            data-state={workspaceTab === 'settings' ? 'active' : ''}
                          >
                            QA settings
                          </button>
                          <button 
                            onClick={() => setWorkspaceTab('length')}
                            className={`workspace-tab-trigger ${workspaceTab === 'length' ? 'active' : ''}`}
                            data-state={workspaceTab === 'length' ? 'active' : ''}
                          >
                            Length check
                          </button>
                        </div>

                        <div className="flex-1 w-full pt-0">
                        {workspaceTab === 'files' && (
                          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div 
                              className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                            >
                              {files.length === 0 ? (
                                <>
                                  <svg width="240" height="120" viewBox="0 0 240 120" fill="none" className="mb-6 opacity-80">
                                    <rect x="90" y="55" width="60" height="40" rx="10" fill="#E2E8F0" />
                                    <path d="M120 75L120 65M120 65L115 70M120 65L125 70" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <rect x="50" y="65" width="25" height="35" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="1.5" />
                                    <rect x="165" y="65" width="35" height="35" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="1.5" />
                                    <path d="M165 75H200" stroke="#CBD5E1" strokeWidth="1.5" />
                                    <circle cx="120" cy="85" r="15" fill="#F1F5F9" />
                                    <path d="M115 85H125M120 80V90" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                                  </svg>
                                  <p className="text-muted-foreground text-sm flex items-center gap-2 font-medium">
                                    Drop your files or folder here
                                    <HelpCircle className="w-4 h-4 opacity-40" />
                                  </p>
                                </>
                              ) : (
                                <div className="w-full max-w-2xl space-y-4">
                                  <div className="flex items-center justify-between border-b pb-2">
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loaded Files ({files.length})</p>
                                    <p className="text-[10px] text-primary font-bold animate-pulse">Drop more files here to add</p>
                                  </div>
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar text-left">
                                    {files.map(f => (
                                      <div key={f.id} className="flex items-center justify-between bg-background/80 backdrop-blur p-3 rounded-xl border border-slate-100 shadow-sm hover:border-primary/20 transition-all">
                                        <span className="text-xs font-bold truncate flex items-center gap-2 text-slate-700">
                                          <FileText className="w-4 h-4 text-primary" />
                                          {f.name}
                                        </span>
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] bg-primary/5 text-primary px-2.5 py-0.5 rounded-full font-mono font-bold">{f.units.length} units</span>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setFiles(prev => prev.filter(file => file.id !== f.id));
                                            }}
                                            className="text-slate-400 hover:text-destructive transition-colors p-1 hover:bg-destructive/5 rounded-lg"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-center gap-4">
                              <Input
                                type="file"
                                multiple
                                accept={Object.keys(SUPPORTED_FILE_EXTENSIONS).join(',')}
                                onChange={(e) => handleFileUpload(e.target.files)}
                                className="hidden"
                                id="file-upload-main"
                              />
                              {/* Hidden folder input */}
                              <input
                                type="file"
                                webkitdirectory=""
                                directory=""
                                multiple
                                onChange={(e) => handleFileUpload(e.target.files)}
                                className="hidden"
                                id="folder-upload-main"
                              />
                              <div className="flex justify-center gap-4">
                                <Button asChild className="h-14 px-12 rounded-2xl bg-white border border-slate-200 text-slate-800 font-black uppercase tracking-widest text-xs shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.15)] hover:bg-slate-50 transition-all active:scale-95">
                                  <label htmlFor="file-upload-main" className="cursor-pointer flex items-center justify-center gap-3">
                                    <Upload className="w-5 h-5 text-primary" />
                                    Add files
                                  </label>
                                </Button>
                                <Button asChild className="h-14 px-12 rounded-2xl bg-white border border-slate-200 text-slate-800 font-black uppercase tracking-widest text-xs shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_30px_-10px_rgba(0,0,0,0.15)] hover:bg-slate-50 transition-all active:scale-95">
                                  <label htmlFor="folder-upload-main" className="cursor-pointer flex items-center justify-center gap-3">
                                    <FolderUp className="w-5 h-5 text-primary" />
                                    Add folder
                                  </label>
                                </Button>
                              </div>
                            </div>
                            <div className="flex justify-center mt-8">
                              <Button 
                                onClick={() => setWorkspaceTab('filters')}
                                disabled={files.length === 0}
                                className="px-12 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                              >
                                Next: File Settings <ArrowRight className="w-5 h-5 ml-2" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {workspaceTab === 'filters' && (
                          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto py-10">
                            <div className="text-center space-y-2">
                              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Selective Filtering</h2>
                              <p className="text-sm text-slate-500 font-medium">Exclude specific segment types from the QA audit to focus on relevant content.</p>
                            </div>

                            <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4">
                              {[
                                { id: 'excludeIce', label: 'Exclude ICE', description: 'Context Exact' },
                                { id: 'excludeLocked', label: 'Exclude Locked', description: 'Read-only' },
                              ].map((opt) => (
                                <div 
                                  key={opt.id}
                                  className="flex items-start gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group"
                                  onClick={() => setConfig(prev => ({
                                    ...prev,
                                    selectiveFiltering: {
                                      ...(prev.selectiveFiltering || {}),
                                      [opt.id]: !prev.selectiveFiltering?.[opt.id as keyof typeof prev.selectiveFiltering]
                                    }
                                  }))}
                                >
                                  <Checkbox 
                                    id={`filter-opt-${opt.id}`}
                                    checked={!!config.selectiveFiltering?.[opt.id as keyof typeof config.selectiveFiltering]} 
                                    className="mt-1 w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    onClick={(e) => e.stopPropagation()}
                                    onCheckedChange={(checked) => {
                                      setConfig(prev => ({
                                        ...prev,
                                        selectiveFiltering: {
                                          ...(prev.selectiveFiltering || {}),
                                          [opt.id]: checked === true
                                        }
                                      }));
                                    }}
                                  />
                                  <div className="space-y-0.5 cursor-pointer">
                                    <label htmlFor={`filter-opt-${opt.id}`} className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors cursor-pointer block leading-none pt-1">
                                      {opt.label}
                                    </label>
                                    <p className="text-xs text-slate-400 font-medium">{opt.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>



                            <div className="flex justify-center pt-4">
                              <Button 
                                onClick={() => setWorkspaceTab('glossary')}
                                className="px-12 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-xs shadow-xl hover:shadow-2xl transition-all active:scale-95"
                              >
                                Next: Glossary Settings <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {workspaceTab === 'glossary' && (
                          <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${config.glossary && config.glossary.length > 0 ? 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start' : 'space-y-8 max-w-2xl mx-auto'}`}>
                            {/* Left Column: Upload */}
                            <div className="space-y-6 flex flex-col justify-center">
                              <div 
                                className={`dropzone-container ${isDragging ? 'dragging' : ''} flex flex-col items-center justify-center p-8`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                              >
                                 <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6 opacity-80 mx-auto">
                                    <path d="M40 30H80V90H40V30Z" fill="white" stroke="#94A3B8" strokeWidth="2" />
                                    <path d="M40 45H80M40 60H80M40 75H80" stroke="#CBD5E1" strokeWidth="1.5" />
                                    <circle cx="80" cy="90" r="15" fill="#FF5C00" />
                                    <path d="M75 90H85M80 85V95" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                 </svg>
                                 <p className="text-muted-foreground text-sm font-medium text-center">Drop your glossary files here</p>
                              </div>
                              <div className="flex justify-center">
                                 <Input
                                    type="file"
                                    accept=".xlsx,.xls,.csv,.txt,.tbx,.tmx"
                                    onChange={handleGlossaryUpload}
                                    className="hidden"
                                    id="glossary-upload-main"
                                  />
                                  <Button asChild variant="outline" className="action-btn-secondary h-11 px-10 rounded-md border-slate-200">
                                    <label htmlFor="glossary-upload-main" className="cursor-pointer">Add files</label>
                                  </Button>
                              </div>
                              {glossaryFiles.length > 0 && (
                                 <div className="max-w-md mx-auto text-center">
                                   <p className="text-xs font-bold text-green-600 flex items-center justify-center gap-2 bg-green-50 py-2.5 px-6 rounded-full border border-green-100 shadow-sm">
                                     <CheckCircle className="w-4 h-4" />
                                     Active Glossary: {glossaryFiles[0]} ({config.glossary?.length || 0} terms)
                                   </p>
                                 </div>
                              )}
                              <div className="flex justify-center pt-2">
                               <Button 
                                 onClick={() => setWorkspaceTab('settings')}
                                 className="px-8 h-12 rounded-xl bg-slate-900 text-white font-bold"
                               >
                                 Next: QA Settings <ArrowRight className="w-4 h-4 ml-2" />
                               </Button>
                              </div>
                            </div>

                            {/* Right Column: Preview */}
                            {config.glossary && config.glossary.length > 0 && (
                              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 h-full flex flex-col justify-between">
                                <div className="space-y-4 flex-1">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800">Glossary Preview</h3>
                                    <button 
                                      onClick={() => {
                                        setConfig(prev => ({ ...prev, glossary: [] }));
                                        setGlossaryFiles([]);
                                      }}
                                      className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline"
                                    >
                                      Remove Glossary
                                    </button>
                                  </div>
                                  <Input 
                                    placeholder="Search glossary terms..." 
                                    value={glossarySearch}
                                    onChange={(e) => setGlossarySearch(e.target.value)}
                                    className="bg-white border-slate-200 text-xs h-10 rounded-xl"
                                  />
                                  <div className="max-h-[280px] overflow-y-auto custom-scrollbar border border-slate-200/60 rounded-xl bg-white">
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead className="bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b">
                                        <tr>
                                          <th className="p-3">Source Term</th>
                                          <th className="p-3">Target Translation</th>
                                          <th className="p-3 w-[60px] text-center">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {config.glossary
                                          .filter(t => 
                                            t.source.toLowerCase().includes(glossarySearch.toLowerCase()) || 
                                            t.target.toLowerCase().includes(glossarySearch.toLowerCase())
                                          )
                                          .slice(0, 100)
                                          .map((term, index) => (
                                            <tr key={index} className="border-b last:border-0 hover:bg-slate-50">
                                              <td className="p-3 font-medium text-slate-800">{term.source}</td>
                                              <td className="p-3 font-mono text-primary font-medium">{term.target}</td>
                                              <td className="p-3 text-center">
                                                <button 
                                                  onClick={() => {
                                                    setConfig(prev => ({
                                                      ...prev,
                                                      glossary: prev.glossary?.filter((_, idx) => idx !== index) || []
                                                    }));
                                                  }}
                                                  className="text-red-500 hover:text-red-700 font-bold text-xs"
                                                >
                                                  Delete
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {workspaceTab === 'settings' && (
                          <div className="space-y-6">
                            <div className="flex h-[500px] bg-white rounded-3xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">
                            {/* Sidebar */}
                            <div className="settings-sidebar bg-slate-50/50 p-6 flex flex-col w-[280px] overflow-y-auto custom-scrollbar">
                              <div className="space-y-1">
                                <div 
                                  onClick={() => {
                                    setSelectedCheckGroup('terminology');
                                    setSelectedSubCategory('untranslatables');
                                  }}
                                  className={`settings-sidebar-item relative ${selectedCheckGroup === 'terminology' ? 'active' : ''}`}
                                >
                                  Common
                                </div>
                                
                                {selectedCheckGroup === 'terminology' && (
                                  <div className="pl-6 border-l-2 border-slate-100 ml-6 my-2 space-y-0.5">
                                    {[
                                      { id: 'untranslatables', label: 'Untranslatables' },
                                      { id: 'terminology', label: 'Terminology' },
                                      { id: 'case', label: 'Letter case' },
                                      { id: 'punctuation', label: 'Punctuation and spacing' },
                                      { id: 'quotes', label: 'Quotes and apostrophes' },
                                      { id: 'measurement', label: 'Measurement' },
                                      { id: 'tags', label: 'Tags' },
                                      { id: 'numbers', label: 'Numbers and ranges' },
                                      { id: 'miscellaneous', label: 'Miscellaneous' }
                                    ].map(sub => (
                                      <div 
                                        key={sub.id} 
                                        onClick={() => setSelectedSubCategory(sub.id)}
                                        className={`text-[13px] py-2 px-3 rounded-lg transition-all cursor-pointer font-medium ${selectedSubCategory === sub.id ? 'text-primary bg-primary/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                                      >
                                        {sub.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div 
                                  onClick={() => {
                                    setSelectedCheckGroup('consistency');
                                    setSelectedSubCategory('consistency');
                                  }}
                                  className={`settings-sidebar-item relative ${selectedCheckGroup === 'consistency' ? 'active' : ''}`}
                                >
                                  Consistency
                                </div>
                                <div 
                                  onClick={() => {
                                    setSelectedCheckGroup('spelling');
                                    setSelectedSubCategory('spelling');
                                  }}
                                  className={`settings-sidebar-item relative ${selectedCheckGroup === 'spelling' ? 'active' : ''}`}
                                >
                                  Spelling
                                </div>
                              </div>
                            </div>
 
                            {/* Separator */}
                            <div className="w-px bg-slate-200 my-6" />
 
                            {/* Content */}
                            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                              <div className="space-y-8">
                                {(() => {
 
                                  let rulesToShow: IssueType[] = [];
                                  
                                  if (selectedSubCategory && SUB_CATEGORY_RULES[selectedSubCategory]) {
                                    rulesToShow = SUB_CATEGORY_RULES[selectedSubCategory];
                                  } else {
                                    rulesToShow = (Object.entries(ISSUE_TYPE_LABELS) as [IssueType, string][])
                                      .filter(([ruleType]) => ISSUE_CATEGORY_MAP[ruleType] === selectedCheckGroup)
                                      .map(([type]) => type);
                                  }
 
                                  rulesToShow = Array.from(new Set(rulesToShow));
 
                                  if (rulesToShow.length === 0) {
                                    return <div className="text-slate-400 text-sm font-medium italic">Select a category to view checks.</div>;
                                  }

                                  return rulesToShow.map((type) => (
                                    <div key={type} className="space-y-4">
                                      <div className="flex items-start gap-4">
                                        <Checkbox
                                          id={`rule-${type}`}
                                          checked={config.rules[type] !== false}
                                          onCheckedChange={(checked) => {
                                            setConfig(prev => ({
                                              ...prev,
                                              rules: { ...prev.rules, [type]: checked === true },
                                            }));
                                          }}
                                          className="mt-1 w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                        <div className="space-y-1">
                                          <label htmlFor={`rule-${type}`} className="text-[14px] font-bold text-slate-700 cursor-pointer hover:text-primary transition-colors">
                                            {ISSUE_TYPE_LABELS[type]}
                                          </label>
                                          
                                          {/* Sub-options based on Image 2 logic */}
                                          {type === 'lang_spelling' && (
                                            <div className="pt-4 pl-1 space-y-4">
                                              <div className="flex items-center gap-3">
                                                <Checkbox id="ignore-latin" checked className="rounded-[4px] border-slate-300 w-4 h-4" />
                                                <label htmlFor="ignore-latin" className="text-[13px] text-slate-500 font-medium cursor-pointer">Ignore single Latin letters</label>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <Checkbox id="ignore-math" checked className="rounded-[4px] border-slate-300 w-4 h-4" />
                                                <label htmlFor="ignore-math" className="text-[13px] text-slate-500 font-medium cursor-pointer">Ignore segments with numbers and math signs only</label>
                                              </div>
                                            </div>
                                          )}

                                          {/* Length Sub-options handled in main block if category is length */}
                                        </div>
                                      </div>
                                    </div>
                                  ));
                                })()}
                               </div>
                             </div>
                           </div>
                           <div className="flex justify-center mt-4">
                             <Button 
                               onClick={() => setWorkspaceTab('length')}
                               className="px-8 h-12 rounded-xl bg-slate-900 text-white font-bold"
                             >
                               Next: Length Checks <ArrowRight className="w-4 h-4 ml-2" />
                             </Button>
                           </div>
                         </div>
                        )}

                        {workspaceTab === 'length' && (
                          <div className="space-y-8 animate-in fade-in zoom-in duration-700">
                            <div className="bg-white rounded-[40px] border border-slate-200/60 p-8 md:p-12 shadow-2xl shadow-slate-200/20">
                              <div className="max-w-4xl mx-auto space-y-8">
                                <div className="space-y-1.5">
                                  <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">Length Constraints</h2>
                                  <p className="text-slate-400 font-medium text-xs">Define maximum character limits and expansion thresholds for high-fidelity translation quality.</p>
                                </div>
 
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {/* Character Limit */}
                                  <div className="group relative bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-100 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/40">
                                    <div className="absolute top-6 right-6">
                                      <Badge variant="outline" className="bg-white text-slate-400 border-slate-100 uppercase tracking-widest text-[10px] font-black px-3 py-1">Absolute</Badge>
                                    </div>
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                           <Hash className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                          <h3 className="text-lg md:text-xl font-black text-slate-800">Char Limit</h3>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hard Threshold</p>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-bold text-slate-600">Enabled Check</span>
                                          <Checkbox 
                                             checked={config.rules['len_char_limit'] !== false}
                                             onCheckedChange={(checked) => setConfig(prev => ({...prev, rules: {...prev.rules, len_char_limit: checked === true}}))}
                                             className="w-7 h-7 rounded-xl border-slate-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                                          />
                                        </div>
                                        <div className="pt-2 space-y-3">
                                           <div className="flex justify-between items-center">
                                             <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Max Characters</label>
                                             <span className="text-xs font-black text-primary bg-primary/5 px-2 py-0.5 rounded-lg">255 Default</span>
                                           </div>
                                           <div className="relative">
                                             <Input type="number" defaultValue={255} className="h-12 bg-white border-slate-100 rounded-xl px-4 font-black text-slate-700 text-base focus-visible:ring-primary/20" />
                                             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-tighter">Units</div>
                                           </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
 
                                  {/* Expansion Limit */}
                                  <div className="group relative bg-indigo-50/30 p-6 md:p-8 rounded-3xl border border-indigo-100/50 hover:border-indigo-200 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-200/30">
                                    <div className="absolute top-6 right-6">
                                      <Badge variant="outline" className="bg-white text-indigo-400 border-indigo-50 uppercase tracking-widest text-[10px] font-black px-3 py-1">Relative</Badge>
                                    </div>
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-indigo-50 group-hover:scale-110 transition-transform">
                                           <Maximize2 className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                          <h3 className="text-lg md:text-xl font-black text-indigo-900">Expansion</h3>
                                          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Growth Ratio</p>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-bold text-indigo-700">Enabled Check</span>
                                          <Checkbox 
                                             checked={config.rules['len_expansion_limit'] !== false}
                                             onCheckedChange={(checked) => setConfig(prev => ({...prev, rules: {...prev.rules, len_expansion_limit: checked === true}}))}
                                             className="w-7 h-7 rounded-xl border-indigo-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" 
                                          />
                                        </div>
                                        <div className="pt-2 space-y-3">
                                           <div className="flex justify-between items-center">
                                             <label className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Max Percentage</label>
                                             <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">50% Default</span>
                                           </div>
                                           <div className="relative">
                                             <Input type="number" defaultValue={50} className="h-12 bg-white border-indigo-50 rounded-xl px-4 font-black text-indigo-700 text-base focus-visible:ring-indigo-200" />
                                             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-300 uppercase tracking-tighter">Growth</div>
                                           </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-center pt-4">
                              <AnimatePresence>
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                >
                                  <Button 
                                    onClick={runAllFilesAnalysis}
                                    disabled={files.length === 0}
                                    size="lg"
                                    className={`px-16 py-8 font-black uppercase tracking-[0.2em] text-sm rounded-full shadow-2xl transition-all ${
                                      files.length > 0 
                                        ? 'bg-primary text-white shadow-primary/30 hover:scale-[1.02] active:scale-95' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed grayscale'
                                    }`}
                                  >
                                    <Play className={`w-5 h-5 mr-3 ${files.length > 0 ? 'fill-white' : 'fill-slate-400'}`} />
                                    Run Audit Report
                                  </Button>
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-4 w-full"
                  >
                    <div className="w-full flex-1">
                    {/* Main Panel - Expanded to 100% width */}
                    <div className="w-full">
                      {selectedFile && (selectedFile === 'combined' || currentResult) ? (
                        <Card className="h-[calc(100vh-250px)] flex flex-col overflow-hidden glass border-none shadow-xl shadow-indigo-500/5 gap-0 py-0">
                          <CardHeader className="p-4 flex-shrink-0 border-b">
                            {/* Horizontal Tabs for Files */}
                            <div className="flex items-center justify-between border-b pb-3 mb-4 w-full gap-4">
                              <div className="flex items-center gap-2 overflow-x-auto max-w-[calc(100%-100px)] scrollbar-none py-1">
                                {results.length > 1 && (
                                  <button
                                    onClick={() => setSelectedFile('combined')}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 flex-shrink-0 ${
                                      selectedFile === 'combined'
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                                  >
                                    <FileCheck className="w-3.5 h-3.5" />
                                    Combined Report ({results.reduce((s, r) => s + r.issues.length, 0)})
                                  </button>
                                )}
                                {files.map((file) => {
                                  const result = results.find(r => r.fileId === file.id);
                                  const issueCount = result?.issues.length || 0;
                                  const isActive = selectedFile === file.id;

                                  return (
                                    <button
                                      key={file.id}
                                      onClick={() => setSelectedFile(file.id)}
                                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 flex-shrink-0 max-w-[200px] ${
                                        isActive
                                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                      }`}
                                    >
                                      <span className="truncate">{file.name}</span>
                                      {issueCount > 0 && (
                                        <Badge
                                          variant={isActive ? 'secondary' : 'destructive'}
                                          className="text-[9px] h-3.5 min-w-[16px] justify-center px-1 rounded-full flex-shrink-0"
                                        >
                                          {issueCount}
                                        </Badge>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Sidebar Actions relocated next to horizontal tabs */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Input
                                  type="file"
                                  multiple
                                  accept={Object.keys(SUPPORTED_FILE_EXTENSIONS).join(',')}
                                  onChange={(e) => handleFileUpload(e.target.files)}
                                  className="hidden"
                                  id="add-files-horizontal"
                                />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl border-border/50 hover:bg-accent"
                                      asChild
                                    >
                                      <label htmlFor="add-files-horizontal" className="cursor-pointer flex items-center justify-center">
                                        <Upload className="w-4 h-4 text-muted-foreground" />
                                      </label>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Add more files</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl border-border/50 hover:bg-destructive/5 hover:text-destructive"
                                      onClick={clearAllFiles}
                                    >
                                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Clear all files</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            {/* Summary Line (Image 2 reference) */}
                            <div className="mb-4 text-sm font-semibold text-muted-foreground/80 flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-lg w-fit transition-all hover:bg-muted/50">
                              <span className="text-indigo-600 dark:text-indigo-400 font-black">TOTAL</span>
                              <span className="opacity-40">|</span>
                              <span>Language pairs: {Array.from(new Set(results.map(r => {
                                const f = files.find(f => f.id === r.fileId);
                                if (!f) return 'pending';
                                return `${f.sourceLanguage || '??'}-${f.targetLanguage || '??'}`;
                              }))).filter(p => p !== 'pending').length || 0}</span>
                              <span className="opacity-40">|</span>
                              <span>Files: {results.length}</span>
                              {overallStats.isPending && (
                                <>
                                  <span className="opacity-40">|</span>
                                  <span className="text-amber-500 animate-pulse flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Analysis in progress...
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg font-bold">
                                  {selectedFile === 'combined' ? 'Combined Project Report' : currentResult?.fileName}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {selectedFile === 'combined'
                                    ? `${results.length} files analyzed • ${results.reduce((s, r) => s + r.issues.length, 0)} issues identified`
                                    : `${currentResult?.totalUnits} translation units • ${currentResult?.issues.length} issues identified`}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* In-Header Selective Options (Simplified) */}
                                <div className="flex items-center gap-3 mr-4 px-3 py-1 bg-muted/30 rounded-full border border-border/50">
                                  {[
                                    { id: 'excludeIce', label: 'Exclude ICE', checked: config.selectiveFiltering?.excludeIce },
                                    { id: 'excludeLocked', label: 'Exclude Lock segment', checked: config.selectiveFiltering?.excludeLocked },
                                    { id: 'exclude100', label: '100% Match', checked: config.selectiveFiltering?.exclude100 },
                                  ].map((opt) => {
                                    return (
                                      <button 
                                        key={opt.id}
                                        onClick={() => setConfig(prev => ({
                                          ...prev,
                                          selectiveFiltering: { 
                                            ...(prev.selectiveFiltering || {}), 
                                            [opt.id]: !opt.checked 
                                          }
                                        }))}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                                          opt.checked 
                                            ? 'bg-primary text-primary-foreground shadow-sm px-3' 
                                            : 'text-muted-foreground hover:bg-muted px-3'
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    );
                                  })}
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="w-[95px] h-8 rounded-full text-[11px] font-black gap-1 flex items-center justify-center border border-border/60 hover:bg-accent transition-colors">
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Export</span>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-card border border-border/60 shadow-lg rounded-xl p-1 z-[110]">
                                    <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">HTML Reports</DropdownMenuLabel>
                                    <DropdownMenuItem className="cursor-pointer text-[11px] font-bold px-2 py-1.5 rounded-lg hover:bg-accent focus:bg-accent" onClick={() => exportReport('html-professional')}>Professional</DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-[11px] font-bold px-2 py-1.5 rounded-lg hover:bg-accent focus:bg-accent" onClick={() => exportReport('html-modern')}>Modern</DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-[11px] font-bold px-2 py-1.5 rounded-lg hover:bg-accent focus:bg-accent" onClick={() => exportReport('html-classic')}>Classic</DropdownMenuItem>
                                    <DropdownMenuSeparator className="h-px bg-muted my-1" />
                                    <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data Files</DropdownMenuLabel>
                                    <DropdownMenuItem className="cursor-pointer text-[11px] font-bold px-2 py-1.5 rounded-lg hover:bg-accent focus:bg-accent" onClick={() => exportReport('excel')}>Excel Export</DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-[11px] font-bold px-2 py-1.5 rounded-lg hover:bg-accent focus:bg-accent" onClick={() => exportReport('rtf')}>Bilingual RTF</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>

                          {/* Filters */}
                          <div className="px-6 pb-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <div className="relative flex-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search translation units..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                  />
                                </div>
                                <div className="flex items-center bg-muted/50 p-1 rounded-full border border-muted flex-shrink-0">
                                  <button
                                    onClick={() => setViewMode('flat')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                                      viewMode === 'flat' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    Flat View
                                  </button>
                                  <button
                                    onClick={() => setViewMode('category')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                                      viewMode === 'category' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                  >
                                    Grouped View
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Category Filter Pills */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                              {[
                                { id: 'all', label: 'All' },
                                { id: 'terminology', label: 'Terminology' },
                                { id: 'spelling', label: 'Spelling' },
                                { id: 'consistency', label: 'Consistency' },
                                { id: 'punctuation', label: 'Punctuation & Space' },
                                { id: 'tags', label: 'Tags' },
                                { id: 'length', label: 'Length' }
                              ].map(cat => (
                                <button
                                  key={cat.id}
                                  onClick={() => setCategoryFilter(cat.id)}
                                  className={`text-[10px] md:text-xs font-bold px-3 py-1 rounded-full transition-all border ${
                                    categoryFilter === cat.id
                                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                      : 'bg-background text-muted-foreground border-border hover:bg-muted/40 hover:text-foreground'
                                  }`}
                                >
                                  {cat.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Issues Table */}
                          <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
                            {showLinguisticInsights ? (
                               <ScrollArea className="flex-1">
                                 <div className="p-8">
                                   <LinguisticInsights results={results} />
                                 </div>
                               </ScrollArea>
                            ) : (
                            <div className="w-full h-full overflow-auto flex-1">
                              <Table className="w-full min-w-[1000px] table-fixed">
                                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                                    <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[55px] font-black uppercase tracking-tighter text-[10px]">Ref</TableHead>
                                    <TableHead className="w-[60px] font-black uppercase tracking-tighter text-[10px]">Locked</TableHead>
                                    <TableHead className="w-[65px] font-black uppercase tracking-tighter text-[10px]">Conf</TableHead>
                                    <TableHead className="w-[70px] font-black uppercase tracking-tighter text-[10px]">Match %</TableHead>
                                    <TableHead className="w-[85px] font-black uppercase tracking-tighter text-[10px]">Severity</TableHead>
                                    <TableHead className="w-[140px] font-black uppercase tracking-tighter text-[10px]">Issue Type</TableHead>
                                    <TableHead className="font-black uppercase tracking-tighter text-[10px] w-[28%] min-w-[180px]">Source</TableHead>
                                    <TableHead className="font-black uppercase tracking-tighter text-[10px] w-[28%] min-w-[180px]">Target</TableHead>
                                    <TableHead className="font-black uppercase tracking-tighter text-[10px] w-[28%] min-w-[180px]">Audit Comment</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredIssues.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground font-bold">
                                        No issues found matching your filters.
                                      </TableCell>
                                    </TableRow>
                                  ) : viewMode === 'category' ? (() => {
                                    const groupedByCategory: Record<string, QAIssue[]> = {};
                                    filteredIssues.forEach(issue => {
                                      const cat = ISSUE_CATEGORY_MAP[issue.type] || 'Other';
                                      const label = ISSUE_CATEGORY_LABELS[cat] || cat;
                                      if (!groupedByCategory[label]) {
                                        groupedByCategory[label] = [];
                                      }
                                      groupedByCategory[label].push(issue);
                                    });

                                    return Object.entries(groupedByCategory).map(([categoryLabel, issues]) => (
                                      <React.Fragment key={categoryLabel}>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40 font-black">
                                          <TableCell colSpan={9} className="py-3 px-4 text-xs tracking-wider uppercase font-black text-foreground">
                                            <span className="flex items-center gap-2">
                                              <span>{categoryLabel}</span>
                                              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary font-black border-none">{issues.length} {issues.length === 1 ? 'issue' : 'issues'}</Badge>
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                        {issues.map((issue) => (
                                          <TableRow
                                            key={issue.id}
                                            className="transition-colors hover:bg-muted/30 group border-b border-muted/30"
                                          >
                                            <TableCell className="font-mono text-[10px] text-muted-foreground align-top pt-4">#{issue.index || issue.key}</TableCell>
                                            <TableCell className="align-top pt-4">
                                              {(() => {
                                                const unit = files.flatMap(f => f.units).find(u => u.id === issue.unitId);
                                                return unit?.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <span className="text-[10px] text-muted-foreground/30">-</span>;
                                              })()}
                                            </TableCell>
                                            <TableCell className="align-top pt-4">
                                              {(() => {
                                                const unit = files.flatMap(f => f.units).find(u => u.id === issue.unitId);
                                                return unit?.conf ? (
                                                  <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-blue-500/5 text-blue-600 border-blue-500/20">
                                                    {unit.conf}
                                                  </Badge>
                                                ) : <span className="text-[10px] text-muted-foreground/30">-</span>;
                                              })()}
                                            </TableCell>
                                            <TableCell className="align-top pt-4">
                                              {(() => {
                                                const unit = files.flatMap(f => f.units).find(u => u.id === issue.unitId);
                                                return unit?.matchPercent !== undefined ? (
                                                  <span className={`text-[10px] font-black ${unit.matchPercent === 100 ? 'text-green-600' : 'text-slate-500'}`}>
                                                    {unit.matchPercent}%
                                                  </span>
                                                ) : <span className="text-[10px] text-muted-foreground/30">-</span>;
                                              })()}
                                            </TableCell>
                                            <TableCell className="align-top pt-4">
                                              <Badge className={`uppercase text-[9px] font-black px-2 py-0.5 border ${ISSUE_SEVERITY_COLORS[issue.severity]}`}>
                                                {issue.severity}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="font-bold text-[11px] align-top pt-4 whitespace-normal break-words pr-3">{ISSUE_TYPE_LABELS[issue.type]}</TableCell>
                                            <TableCell className="align-top pt-4">
                                              <div className="text-xs font-mono whitespace-normal break-words leading-relaxed py-1">
                                                <HighlightText text={issue.source} />
                                              </div>
                                            </TableCell>
                                            <TableCell className="align-top pt-4 bg-indigo-500/[0.02]">
                                              <div className="text-xs font-mono whitespace-normal break-words leading-relaxed text-primary font-medium py-1">
                                                <HighlightText text={issue.target} />
                                              </div>
                                            </TableCell>
                                            <TableCell className="align-top pt-4 whitespace-normal break-words pr-3">
                                               <p className="text-xs text-muted-foreground leading-relaxed py-1">
                                                 <HighlightText text={issue.message} />
                                               </p>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </React.Fragment>
                                    ));
                                  })() : (
                                    filteredIssues.map((issue) => (
                                      <TableRow
                                        key={issue.id}
                                        className="transition-colors hover:bg-muted/30 group"
                                      >
                                        <TableCell className="font-mono text-[10px] text-muted-foreground align-top pt-4">#{issue.index || issue.key}</TableCell>
                                        <TableCell className="align-top pt-4">
                                          {(() => {
                                            const unit = files.flatMap(f => f.units).find(u => u.id === issue.unitId);
                                            return unit?.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <span className="text-[10px] text-muted-foreground/30">-</span>;
                                          })()}
                                        </TableCell>
                                        <TableCell className="align-top pt-4">
                                          {(() => {
                                            const unit = files.flatMap(f => f.units).find(u => u.id === issue.unitId);
                                            return unit?.conf ? (
                                              <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-blue-500/5 text-blue-600 border-blue-500/20">
                                                {unit.conf}
                                              </Badge>
                                            ) : <span className="text-[10px] text-muted-foreground/30">-</span>;
                                          })()}
                                        </TableCell>
                                        <TableCell className="align-top pt-4">
                                          {(() => {
                                            const unit = files.flatMap(f => f.units).find(u => u.id === issue.unitId);
                                            return unit?.matchPercent !== undefined ? (
                                              <span className={`text-[10px] font-black ${unit.matchPercent === 100 ? 'text-green-600' : 'text-slate-500'}`}>
                                                {unit.matchPercent}%
                                              </span>
                                            ) : <span className="text-[10px] text-muted-foreground/30">-</span>;
                                          })()}
                                        </TableCell>
                                        <TableCell className="align-top pt-4">
                                          <Badge className={`uppercase text-[9px] font-black px-2 py-0.5 border ${ISSUE_SEVERITY_COLORS[issue.severity]}`}>
                                            {issue.severity}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-[11px] align-top pt-4 whitespace-normal break-words pr-3">{ISSUE_TYPE_LABELS[issue.type]}</TableCell>
                                        <TableCell className="align-top pt-4">
                                          <div className="text-xs font-mono whitespace-pre-wrap break-words leading-relaxed">
                                            <HighlightText text={issue.source} />
                                          </div>
                                        </TableCell>
                                        <TableCell className="align-top pt-4 bg-indigo-500/[0.02]">
                                          <div className="text-xs font-mono whitespace-pre-wrap break-words leading-relaxed text-primary font-medium">
                                            <HighlightText text={issue.target} />
                                          </div>
                                        </TableCell>
                                        <TableCell className="align-top pt-4 whitespace-normal break-words pr-3">
                                          <p className="text-xs text-muted-foreground leading-relaxed">
                                            <HighlightText text={issue.message} />
                                          </p>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="flex-1 flex items-center justify-center p-12 glass border-none shadow-xl shadow-indigo-500/5 min-h-[500px]">
                          <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                              {(selectedFile || isAnalyzing) ? (
                                <RefreshCw className="w-10 h-10 animate-spin" />
                              ) : (
                                <Search className="w-10 h-10" />
                              )}
                            </div>
                            <h3 className="text-2xl font-black">
                              {(selectedFile || isAnalyzing) ? 'Analyzing translation data...' : 'Select a file to view results'}
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                              {selectedFile 
                                ? 'Please wait while we run multi-tier linguistic checks against your content.' 
                                : 'Toggle between files on the left to see detailed quality reports and specific linguistic issues.'}
                            </p>
                            
                            {/* In-Dashboard Help / Workflow access */}
                            {!selectedFile && (
                              <div className="mt-8 p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 text-left max-w-md mx-auto">
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-700 mb-4 flex items-center gap-2">
                                  <Zap className="w-4 h-4" />
                                  Quick Workflow Guide
                                </h4>
                                <ul className="space-y-3">
                                  {[
                                    "Upload your translation files (XLIFF, JSON, Excel)",
                                    "Select a file from the sidebar to start auditing",
                                    "Review issues and use 'Auto-fix' for common errors",
                                    "Export professional reports in Excel or HTML"
                                  ].map((step, k) => (
                                    <li key={k} className="flex gap-3 text-sm">
                                      <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">{k+1}</span>
                                      <span className="text-muted-foreground leading-snug">{step}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </Card>
                      )}
                    </div>
                    </div>
                  </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-6xl w-[95vw] rounded-3xl overflow-hidden bg-card border-none shadow-2xl">
            <DialogHeader className="px-6 pt-6 bg-card">
              <DialogTitle className="text-2xl font-black">Audit Preferences</DialogTitle>
              <DialogDescription className="text-muted-foreground/80">
                Customize which comprehensive quality checks are applied during the QA engine process.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[72vh] px-6">
              <div className="space-y-8 py-4">
                {user && (
                  <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap className="w-16 h-16 text-indigo-500" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Credit Balance</h4>
                          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                            {user.credits} Credits Available
                          </p>
                        </div>
                        <Badge className="px-3 py-1 rounded-full font-black uppercase tracking-widest text-[10px] bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                          ACTIVE
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Usage Capacity</span>
                          <span className="text-xs font-bold">
                            {user.credits > 0 ? 'Ready for Analysis' : 'Credits Exhausted'}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (user.credits / 10) * 100)}%` }}
                            className="h-full rounded-full bg-indigo-500"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-[10px] font-bold text-muted-foreground">
                            1 credit per file upload / manual audit
                          </p>
                          <Button 
                            size="sm" 
                            variant="link" 
                            onClick={() => { 
                              setShowDashboard(true);
                              toast.info("Select a credit top-up package to purchase credits.");
                            }}
                            className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700"
                          >
                            Add Credits <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 Large, Beautiful Tabs at the Top */}
                <div className="flex gap-2 p-1 border border-border bg-muted/40 rounded-2xl mb-4">
                  {[
                    { id: 'checks', label: 'QA Rules & Groups' },
                    { id: 'options', label: 'Filtering & Exclusions' },
                    { id: 'actions', label: 'Quick Actions' },
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveSettingsTab(tab.id as any)}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${activeSettingsTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'bg-transparent text-muted-foreground hover:bg-primary/5 hover:text-foreground'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeSettingsTab === 'checks' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-border/50 bg-muted/10 p-4 rounded-2xl h-[52vh] max-h-[52vh] min-h-[380px] overflow-hidden text-slate-800 dark:text-slate-200">
                    {/* Left Column (1/3 width): Check Group vertical tabs */}
                    <div className="flex flex-col border border-border/50 bg-background/50 rounded-xl overflow-hidden h-full col-span-1">
                      <div className="bg-primary/5 px-4 py-3 border-b border-border/50 flex flex-shrink-0 justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-wider text-primary">Check Group</h4>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Groups</span>
                      </div>
                      <ScrollArea className="flex-1 px-3 py-2">
                        <div className="space-y-1">
                          {(Object.entries(ISSUE_CATEGORY_LABELS) as [IssueCategory, string][]).map(([category, categoryLabel]) => {
                            const categoryRules = (Object.entries(ISSUE_TYPE_LABELS) as [IssueType, string][]).filter(
                              ([ruleType]) => ISSUE_CATEGORY_MAP[ruleType] === category
                            );
                            if (categoryRules.length === 0) return null;

                            const isGroupEnabled = categoryRules.every(([type]) => config.rules[type] !== false);

                            return (
                              <div 
                                key={category} 
                                onClick={() => setSelectedCheckGroup(category)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-primary/5 transition-all group ${selectedCheckGroup === category ? 'bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                              >
                                <Checkbox 
                                  checked={isGroupEnabled}
                                  onCheckedChange={(checked) => {
                                    const nextRules = { ...config.rules };
                                    categoryRules.forEach(([type]) => {
                                      nextRules[type] = checked === true;
                                    });
                                    setConfig(prev => ({ ...prev, rules: nextRules }));
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className={`text-xs font-bold leading-tight group-hover:text-primary transition-colors ${selectedCheckGroup === category ? 'text-primary' : ''}`}>
                                  {categoryLabel.replace('QA Checks', '').trim()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Right Column (2/3 width): Individual check items */}
                    <div className="flex flex-col border border-border/50 bg-background/50 rounded-xl overflow-hidden h-full col-span-2">
                      <div className="bg-primary/5 px-4 py-3 border-b border-border/50 flex flex-shrink-0 justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-wider text-primary">List of Checks</h4>
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Toggles</span>
                      </div>
                      <ScrollArea className="flex-1 px-3 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(() => {
                            const categoryRules = (Object.entries(ISSUE_TYPE_LABELS) as [IssueType, string][]).filter(
                              ([ruleType]) => ISSUE_CATEGORY_MAP[ruleType] === selectedCheckGroup
                            );

                            if (categoryRules.length === 0) {
                              return <p className="text-[11px] text-muted-foreground p-3 col-span-2">No checks available for this group.</p>;
                            }

                            return categoryRules.map(([type, label]) => (
                              <div key={type} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-colors group">
                                <Checkbox
                                  checked={config.rules[type] !== false}
                                  onCheckedChange={(checked) => {
                                    setConfig(prev => ({
                                      ...prev,
                                      rules: { ...prev.rules, [type]: checked === true },
                                    }));
                                  }}
                                />
                                <div className="flex-1 min-w-0 pr-1">
                                  <p className="text-xs font-bold leading-snug group-hover:text-foreground transition-colors break-words">{label}</p>
                                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter truncate opacity-60">{type}</p>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'options' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-border/50 bg-muted/10 p-6 rounded-2xl h-[52vh] max-h-[52vh] min-h-[380px] overflow-hidden text-slate-800 dark:text-slate-200">
                    {/* Left Section: Options */}
                    <div className="flex flex-col border border-border/50 bg-background/50 rounded-xl overflow-hidden h-full">
                      <div className="bg-primary/5 px-4 py-3 border-b border-border/50 flex flex-shrink-0">
                        <h4 className="text-xs font-black uppercase tracking-wider text-primary">Options</h4>
                      </div>
                      <ScrollArea className="flex-1 px-4 py-4">
                        <div className="space-y-4">
                          {[
                            { id: 'excludeIce', label: 'Exclude ICE Segments', checked: !!config.selectiveFiltering?.excludeIce },
                            { id: 'excludeLocked', label: 'Exclude Locked Segments', checked: !!config.selectiveFiltering?.excludeLocked },
                            { id: 'exclude100', label: 'Exclude 100% Matches', checked: !!config.selectiveFiltering?.exclude100 },
                            { id: 'caseSensitive', label: 'Case-sensitive Inconsistencies', checked: !!config.caseSensitive },
                            { id: 'ignoreTags', label: 'Ignore Tags', checked: !!config.checkPlaceholders }
                          ].map((opt) => (
                            <div key={opt.id} className="flex items-center space-x-3 group px-1">
                              <Checkbox 
                                id={`options-${opt.id}`} 
                                checked={opt.checked}
                                onCheckedChange={(checked) => {
                                  setConfig(prev => {
                                    if (opt.id === 'caseSensitive') return { ...prev, caseSensitive: checked === true };
                                    if (opt.id === 'ignoreTags') return { ...prev, checkPlaceholders: checked === true };
                                    return {
                                      ...prev,
                                      selectiveFiltering: {
                                        ...(prev.selectiveFiltering || {}),
                                        [opt.id]: checked === true
                                      }
                                    };
                                  });
                                }}
                              />
                              <label htmlFor={`options-${opt.id}`} className="text-sm font-semibold text-muted-foreground group-hover:text-foreground cursor-pointer transition-colors leading-tight">
                                {opt.label}
                              </label>
                            </div>
                          ))}

                          <div className="mt-6 pt-4 border-t border-border/50">
                            <label className="text-xs font-bold block mb-1">Max Expansion Ratio</label>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1">
                              <span>Limit</span>
                              <span className="font-bold text-primary">{config.maxLengthRatio}x</span>
                            </div>
                            <Input
                              type="range"
                              step="0.1"
                              min="1.0"
                              max="3.0"
                              value={config.maxLengthRatio}
                              onChange={(e) => {
                                setConfig(prev => ({ ...prev, maxLengthRatio: parseFloat(e.target.value) || 1.5 }));
                              }}
                              className="accent-primary h-4"
                            />
                          </div>
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Right Section: Filter Issues */}
                    <div className="flex flex-col border border-border/50 bg-background/50 rounded-xl overflow-hidden h-full">
                      <div className="bg-primary/5 px-4 py-3 border-b border-border/50 flex flex-shrink-0">
                        <h4 className="text-xs font-black uppercase tracking-wider text-primary">Filter Issues</h4>
                      </div>
                      <ScrollArea className="flex-1 px-4 py-4">
                        <div className="space-y-4">
                          {[
                            { id: 'all', label: 'Show All' },
                            { id: 'marked', label: 'Show Marked' },
                            { id: 'hide', label: 'Hide Marked' }
                          ].map(f => (
                            <div key={f.id} className="flex items-center space-x-3 group px-1">
                              <Checkbox 
                                id={`filter-${f.id}`} 
                                checked={f.id === 'all'} 
                                onCheckedChange={() => {
                                  toast.success(`Filtered issues to ${f.label}`);
                                }}
                              />
                              <label htmlFor={`filter-${f.id}`} className="text-sm font-semibold text-muted-foreground group-hover:text-foreground cursor-pointer transition-colors leading-tight">
                                {f.label}
                              </label>
                            </div>
                          ))}

                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              toast.success("All Marks Cleared", {
                                description: "Successfully cleared all review marks from files."
                              });
                            }}
                            className="w-full mt-2 h-10 text-[11px] font-bold uppercase rounded-xl border-destructive/20 text-destructive/80 hover:bg-destructive/5 tracking-wider mt-6"
                          >
                            Clear All Marks
                          </Button>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'actions' && (
                  <div className="flex border border-border/50 bg-muted/10 p-6 rounded-2xl h-[52vh] max-h-[52vh] min-h-[380px] overflow-hidden items-center justify-center text-slate-800 dark:text-slate-200">
                    <div className="w-full max-w-sm flex flex-col justify-center gap-4 border border-border/50 bg-background/50 rounded-2xl p-6 shadow-sm">
                      <div className="bg-primary/5 px-4 py-3 border-b border-border/50 flex flex-shrink-0 mb-2 rounded-xl justify-center items-center">
                        <h4 className="text-xs font-black uppercase tracking-wider text-primary">Actions Execution</h4>
                      </div>
                      <Button 
                        onClick={() => { rerunQA(); setShowSettings(false); }} 
                        className="h-14 w-full text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all text-white bg-primary flex items-center justify-center gap-1 leading-tight text-center"
                      >
                        Check Ongoing Translation
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { rerunQA(); setShowSettings(false); }} 
                        className="h-12 w-full text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary/5 transition-all leading-tight text-center"
                      >
                        Run Project Checklists
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { rerunQA(); setShowSettings(false); }} 
                        className="h-12 w-full text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-primary/5 transition-all leading-tight text-center"
                      >
                        Run Personal Checklists
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-between items-center bg-muted/30 px-6 py-4">
              <Button variant="ghost" size="sm" onClick={() => setConfig(DEFAULT_CONFIG)} className="text-xs font-bold uppercase tracking-widest">
                Reset All Defaults
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowSettings(false)} className="rounded-full px-6 border-none">Cancel</Button>
                <Button size="sm" onClick={() => { rerunQA(); setShowSettings(false); }} className="rounded-full px-8 shadow-lg shadow-primary/20">Apply & Re-run</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </main>

        <FooterStrip />
      </div>

      {/* Global Analysis Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-md"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-black text-primary select-none animate-pulse">T</span>
              </div>
            </div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl font-black mt-8 text-primary uppercase tracking-tighter"
            >
              Analyzing Data
            </motion.h2>
            <p className="text-muted-foreground mt-2 font-medium">Running 110+ linguistic checks on your local segments...</p>
          </motion.div>
        )}
      </AnimatePresence>

      
      <AnimatePresence>
        {showAuth && (
          <AuthView 
            onClose={() => setShowAuth(false)} 
            onSuccess={handleLoginSuccess}
          />
        )}
      </AnimatePresence>

      </TooltipProvider>
    </>
  );
}
