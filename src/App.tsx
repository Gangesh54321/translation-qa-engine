import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Download,
  Search,
  X,
  Languages,
  FileCheck,
  BarChart3,
  RefreshCw,
  Trash2,
  Book,
  Palette,
} from 'lucide-react';




import { Separator } from '@/components/ui/separator';



import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { parseFile, FileParserError, parseGlossaryFile, detectFileType } from '@/lib/fileParser';


import type {
  TranslationFile,
  QAResult,
  QAIssue,
  IssueType,
  QAConfig,
  GlossaryTerm
} from '@/types/translation';

import { runQA, DEFAULT_CONFIG } from '@/lib/qaEngine';



import { ISSUE_TYPE_LABELS, ISSUE_SEVERITY_COLORS, SUPPORTED_FILE_EXTENSIONS } from '@/types/translation';
import { exportToExcel, exportToHTML } from '@/lib/exportService';
import './App.css';

// generateHTMLReport removed in favor of exportToHTML from exportService

interface IssueItemProps {
  issue: QAIssue;
  index: number;
  fileName?: string;
  onSelect: () => void;
  onApplyFix: (issue: QAIssue) => void;
}

const HighlightText = ({ text, highlights, type }: { text: string; highlights?: string[]; type: 'source' | 'target' }) => {
  if (!highlights || highlights.length === 0) return <span>{text}</span>;

  let result: (string | React.ReactNode)[] = [text];

  highlights.forEach(term => {
    const newResult: (string | React.ReactNode)[] = [];
    result.forEach(item => {
      if (typeof item !== 'string') {
        newResult.push(item);
        return;
      }

      const parts = item.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      parts.forEach((part, i) => {
        if (part.toLowerCase() === term.toLowerCase()) {
          newResult.push(
            <span key={`${term}-${i}`} className={type === 'source' ? 'bg-indigo-500/20 text-indigo-700 font-bold px-0.5 rounded' : 'bg-amber-500/20 text-amber-700 font-bold px-0.5 rounded'}>
              {part}
            </span>
          );
        } else if (part) {
          newResult.push(part);
        }
      });
    });
    result = newResult;
  });

  return <>{result}</>;
};

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
                <HighlightText text={issue.source} highlights={issue.highlights?.source} type="source" />
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">Target String</p>
            <div className="p-3 rounded-xl bg-muted/30 border border-transparent group-hover:border-indigo-500/10 transition-colors">
              <p className="text-xs font-mono whitespace-pre-wrap break-words">
                <HighlightText text={issue.target} highlights={issue.highlights?.target} type="target" />
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

function App() {
  const [files, setFiles] = useState<TranslationFile[]>([]);
  const [results, setResults] = useState<QAResult[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<QAIssue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string[]>(['error', 'warning', 'info']);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<QAConfig>(DEFAULT_CONFIG);
  const [isDragging, setIsDragging] = useState(false);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [glossaryFiles, setGlossaryFiles] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uiTheme, setUiTheme] = useState<'professional' | 'modern' | 'classic'>('modern');



  // Handle file upload
  const handleFileUpload = useCallback(async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;

    const newFiles: TranslationFile[] = [];
    const newResults: QAResult[] = [];
    let glossaryTerms: GlossaryTerm[] | null = null;

    const filesArray = Array.from(uploadedFiles);
    const processedGlossaryFiles = new Set<string>();

    // First, look for glossary files
    for (const file of filesArray) {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      // .xlsx and .xls are explicitly glossary files in this app's current context
      // TMX, CSV, TSV can be both, so we attempt to parse as glossary first
      if (['.xlsx', '.xls', '.tmx', '.csv', '.tsv'].includes(ext)) {
        try {
          const terms = await parseGlossaryFile(file);
          if (terms.length > 0) {
            glossaryTerms = terms;
            setGlossary(terms);
            setGlossaryFiles(prev => [...new Set([...prev, file.name])]);
            processedGlossaryFiles.add(file.name);
            setConfig(prev => ({ ...prev, glossary: terms }));
            toast.success(`Glossary loaded from ${file.name}`, {
              description: `${terms.length} terms added to audit engine`
            });
          }
        } catch (e) {
          // If it fails as glossary and it's not Excel, it might be a regular bilingual file
          if (ext === '.xlsx' || ext === '.xls') {
            toast.error(`Failed to parse glossary: ${file.name}`);
          }
        }
      }
    }

    for (const file of filesArray) {
      // Skip if already processed as glossary
      if (processedGlossaryFiles.has(file.name)) continue;

      const isTranslationFile = detectFileType(file.name);
      if (!isTranslationFile) continue;

      try {
        const parsedFile = await parseFile(file);
        newFiles.push(parsedFile);

        // Run QA immediately with the potentially new glossary
        const currentConfig = glossaryTerms ? { ...config, glossary: glossaryTerms } : config;
        const qaResult = runQA(parsedFile, currentConfig);
        newResults.push(qaResult);

        toast.success(`Parsed ${file.name}`, {
          description: `${parsedFile.units.length} translation units found`,
        });
      } catch (error) {
        if (error instanceof FileParserError) {
          toast.error(`Failed to parse ${file.name}`, {
            description: error.message,
          });
        } else {
          toast.error(`Error processing ${file.name}`);
        }
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    setResults(prev => [...prev, ...newResults]);

    if (newFiles.length > 0 && !selectedFile) {
      setSelectedFile(newFiles[0].id);
    }

    toast.success(`Loaded ${newFiles.length} file(s)`);
  }, [config, selectedFile]);



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
  }, [files, config, results]);





  // Re-run QA with new config
  const rerunQA = useCallback(async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    const runToast = toast.loading('Running QA analysis...');

    try {
      // Small delay for better UX feel
      await new Promise(resolve => setTimeout(resolve, 600));

      const currentConfig = { ...config, glossary };
      const newResults = files.map(file => runQA(file, currentConfig));
      setResults(newResults);

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
  }, [files, config, glossary, selectedFile]);

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

    // Re-run QA automatically to refresh results
    setTimeout(() => rerunQA(), 0);
    toast.success('Auto-fix applied');
  }, [selectedFile, rerunQA]);



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
    }

    toast.success('Report exported');
  }, [results, selectedFile, config]);


  // Get filtered issues
  const getFilteredIssues = useCallback((result: QAResult): QAIssue[] => {
    return result.issues.filter(issue => {
      const matchesSearch = !searchQuery ||
        issue.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter.includes(issue.severity);

      return matchesSearch && matchesSeverity;
    });
  }, [searchQuery, severityFilter]);

  // Calculate overall stats
  const overallStats = {
    totalFiles: files.length,
    totalUnits: files.reduce((sum, f) => sum + f.units.length, 0),
    totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
    errors: results.reduce((sum, r) => sum + r.stats.errors, 0),
    warnings: results.reduce((sum, r) => sum + r.stats.warnings, 0),
    info: results.reduce((sum, r) => sum + r.stats.info, 0),
  };

  // Get current result
  const currentResult = results.find(r => r.fileId === selectedFile);
  const filteredIssues = currentResult ? getFilteredIssues(currentResult) : [];

  return (
    <TooltipProvider>
      <div className={`min-h-screen bg-background relative overflow-hidden theme-${uiTheme}`}>
        {/* Background Decorations */}
        {uiTheme === 'modern' && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
          </>
        )}
        {uiTheme === 'professional' && (
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        )}

        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${uiTheme === 'modern' ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/20' : 'bg-primary shadow-primary/20'}`}>
                <Languages className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold bg-clip-text text-transparent ${uiTheme === 'modern' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400' : 'bg-primary'}`}>Translation QA Engine</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Bilingual Quality Assurance
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2 border-r pr-2 mr-2">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.tmx,.csv,.tsv"
                  onChange={handleGlossaryUpload}
                  className="hidden"
                  id="glossary-upload"
                />
                <Button
                  variant={glossaryFiles.length > 0 ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                  className="rounded-full px-4"
                >
                  <label htmlFor="glossary-upload" className="cursor-pointer">
                    <Book className="w-4 h-4 mr-2" />
                    {glossaryFiles.length > 0 ? `Glossary (${glossaryFiles.length})` : 'Add Glossary'}
                  </label>
                </Button>
              </div>

              <Select value={uiTheme} onValueChange={(v: any) => setUiTheme(v)}>
                <SelectTrigger className="w-[140px] h-9 rounded-full bg-card/50">
                  <Palette className="w-3.5 h-3.5 mr-2" />
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="dark">Night Mode</SelectItem>
                  <SelectItem value="midnight">Midnight</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="rounded-full"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant={results.length === 0 ? "default" : "outline"}
                size="sm"
                onClick={results.length === 0 ? rerunQA : clearAllFiles}
                disabled={files.length === 0 || isAnalyzing}
                className={`rounded-full px-6 ${results.length === 0 && files.length > 0 ? "shadow-lg shadow-primary/20" : ""}`}
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  results.length === 0 ? (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )
                )}
                {results.length === 0 ? "Run QA" : "New Project"}
              </Button>
            </motion.div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 relative">
          <AnimatePresence mode="wait">
            {/* Stats Overview */}
            {files.length > 0 && (
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
                          <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Main Content Area */}
            {files.length === 0 ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto mt-12 mb-20"
              >
                <div className="text-center mb-12">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-2xl relative ${uiTheme === 'modern' ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-500/40' : 'bg-primary shadow-primary/40'}`}
                  >
                    <Upload className="w-10 h-10 text-white" />
                    <div className="absolute inset-x-0 -bottom-4 flex justify-center">
                      <div className="px-3 py-1 bg-white dark:bg-card rounded-full text-[10px] font-bold shadow-lg text-primary uppercase tracking-tighter border">Ready to Audit</div>
                    </div>
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                    Professional <span className="text-primary">Translation QA</span>
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    Identify inconsistencies, formatting issues, and translation errors instantly.
                    Experience Xbench-style checks in a modern, streamlined interface.
                  </p>
                </div>

                <Card
                  className={`border-2 border-dashed transition-all duration-300 relative overflow-hidden group ${isDragging
                    ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                    : 'border-muted-foreground/10 hover:border-primary/40'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <CardContent className="p-16">
                    <div className="text-center relative z-10">
                      <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {['JSON', 'XLIFF', 'TMX', 'CSV', 'YAML', 'PO', 'STRINGS', 'TXT'].map(ext => (
                          <span key={ext} className="px-3 py-1 rounded-full bg-muted text-[10px] font-bold text-muted-foreground uppercase">{ext}</span>
                        ))}
                      </div>
                      <div className="space-y-4">
                        <Input
                          type="file"
                          multiple
                          accept={Object.keys(SUPPORTED_FILE_EXTENSIONS).join(',')}
                          onChange={(e) => handleFileUpload(e.target.files)}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button asChild size="lg" className="rounded-full px-8 h-14 text-base font-semibold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <Upload className="w-5 h-5 mr-3" />
                            Drag & Drop or Browse Files
                          </label>
                        </Button>
                        <p className="text-sm text-muted-foreground">Multiple file uploads supported</p>
                      </div>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors">
                      <FileCheck className="w-32 h-32" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-6"
              >
                {/* Sidebar - File List */}
                <div className="lg:col-span-1 min-w-[240px]">
                  <Card className="h-[calc(100vh-280px)] flex flex-col overflow-hidden glass border-none shadow-xl shadow-indigo-500/5 gap-0 py-0">
                    <CardHeader className="p-4 flex-shrink-0 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Files</CardTitle>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                onClick={clearAllFiles}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Clear all files</TooltipContent>
                          </Tooltip>
                          <Input
                            type="file"
                            multiple
                            accept={Object.keys(SUPPORTED_FILE_EXTENSIONS).join(',')}
                            onChange={(e) => handleFileUpload(e.target.files)}
                            className="hidden"
                            id="add-files"
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full"
                                asChild
                              >
                                <label htmlFor="add-files" className="cursor-pointer">
                                  <Upload className="w-4 h-4" />
                                </label>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add more files</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                      <ScrollArea className="h-full">
                        <div className="space-y-1 p-3">
                          {results.length > 1 && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-4 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${selectedFile === 'combined'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                }`}
                              onClick={() => setSelectedFile('combined')}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate flex items-center gap-2">
                                    <FileCheck className="w-4 h-4" />
                                    Combined View
                                  </p>
                                  <p className={`text-[10px] mt-0.5 ${selectedFile === 'combined' ? 'text-white/80' : 'text-muted-foreground'}`}>
                                    {results.length} files • {results.reduce((s, r) => s + r.issues.length, 0)} total issues
                                  </p>
                                </div>
                                <Badge variant={selectedFile === 'combined' ? 'secondary' : 'default'} className="bg-indigo-500 text-white border-none">
                                  All
                                </Badge>
                              </div>
                            </motion.div>
                          )}
                          {files.map((file, i) => {
                            const result = results.find(r => r.fileId === file.id);
                            const issueCount = result?.issues.length || 0;

                            return (
                              <motion.div
                                key={file.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${selectedFile === file.id
                                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                  : 'hover:bg-primary/10'
                                  }`}
                                onClick={() => setSelectedFile(file.id)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className={`text-[10px] mt-0.5 ${selectedFile === file.id
                                      ? 'text-primary-foreground/80'
                                      : 'text-muted-foreground'
                                      }`}>
                                      {file.units.length} units
                                    </p>
                                  </div>
                                  {issueCount > 0 && (
                                    <Badge
                                      variant={selectedFile === file.id ? 'secondary' : 'destructive'}
                                      className="text-[10px] h-4 min-w-[20px] justify-center px-1 rounded-full"
                                    >
                                      {issueCount}
                                    </Badge>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Panel */}
                <div className="lg:col-span-3">
                  {selectedFile && (selectedFile === 'combined' || currentResult) ? (
                    <Card className="h-[calc(100vh-280px)] flex flex-col overflow-hidden glass border-none shadow-xl shadow-indigo-500/5 gap-0 py-0">
                      <CardHeader className="p-4 flex-shrink-0 border-b">
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
                            <Select onValueChange={(v) => exportReport(v)}>
                              <SelectTrigger className="w-[120px] h-9 rounded-full">
                                <Download className="w-3.5 h-3.5 mr-2" />
                                <SelectValue placeholder="Export" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase">HTML Reports</div>
                                <SelectItem value="html-professional">Professional</SelectItem>
                                <SelectItem value="html-modern">Modern</SelectItem>
                                <SelectItem value="html-classic">Classic</SelectItem>
                                <div className="h-px bg-muted my-1" />
                                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase">Data Files</div>
                                <SelectItem value="excel">Excel Export</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardHeader>

                      {/* Filters */}
                      <div className="px-6 pb-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Search translation units..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && getFilteredIssues(currentResult!)}
                                className="pl-9 h-10 rounded-xl bg-muted/30 border-none focus-visible:ring-primary"
                              />
                            </div>
                            <Button
                              size="sm"
                              className="h-10 rounded-xl px-4"
                              onClick={() => getFilteredIssues(currentResult!)}
                            >
                              Search
                            </Button>
                          </div>
                          <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl">
                            {(['error', 'warning', 'info'] as const).map(sev => (
                              <Button
                                key={sev}
                                variant={severityFilter.includes(sev) && severityFilter.length === 1 ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                  setSeverityFilter(prev => {
                                    // If already selected exclusively, reset to all
                                    if (prev.includes(sev) && prev.length === 1) {
                                      return ['error', 'warning', 'info'];
                                    }
                                    // Otherwise, select exclusively
                                    return [sev];
                                  });
                                }}
                                className={`h-8 rounded-lg text-[10px] uppercase font-bold tracking-wider px-3 ${severityFilter.includes(sev) && severityFilter.length === 1 ? 'shadow-sm' : ''
                                  }`}
                              >
                                {sev}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-0 flex-1 overflow-hidden border-t">
                        <ScrollArea className="h-full">
                          <div className="divide-y relative">
                            {selectedFile === 'combined' ? (
                              (() => {
                                // Aggregate and group all issues by type
                                const allIssues: (QAIssue & { fileName: string })[] = [];
                                results.forEach(r => {
                                  r.issues.forEach(issue => {
                                    allIssues.push({ ...issue, fileName: r.fileName });
                                  });
                                });

                                const groupedByType: Record<string, (QAIssue & { fileName: string })[]> = {};
                                allIssues.forEach(issue => {
                                  const label = ISSUE_TYPE_LABELS[issue.type];
                                  if (!groupedByType[label]) groupedByType[label] = [];
                                  groupedByType[label].push(issue);
                                });

                                const filteredGroupedTypes = Object.entries(groupedByType).map(([label, issues]) => {
                                  const filtered = issues.filter(issue => {
                                    const matchesSearch = !searchQuery ||
                                      issue.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      issue.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      issue.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      issue.message.toLowerCase().includes(searchQuery.toLowerCase());
                                    const matchesSeverity = severityFilter.includes(issue.severity);
                                    return matchesSearch && matchesSeverity;
                                  });
                                  return { label, issues: filtered };
                                }).filter(group => group.issues.length > 0);

                                if (filteredGroupedTypes.length === 0) {
                                  return (
                                    <div className="p-20 text-center">
                                      <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center"
                                      >
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                      </motion.div>
                                      <h3 className="text-lg font-bold mb-1">No Issues Found</h3>
                                      <p className="text-muted-foreground text-sm max-w-[240px] mx-auto">
                                        No quality issues match your filters in the combined view.
                                      </p>
                                    </div>
                                  );
                                }

                                return filteredGroupedTypes.map((group) => (
                                  <div key={group.label} className="relative">
                                    <div className="px-5 py-2 bg-background/95 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between border-y sticky top-0 z-20 backdrop-blur-sm shadow-sm ring-1 ring-border/5">
                                      <span className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {group.label}
                                      </span>
                                      <Badge variant="outline" className="text-[9px] bg-background">
                                        {group.issues.length} {group.issues.length === 1 ? 'issue' : 'issues'}
                                      </Badge>
                                    </div>
                                    <div className="divide-y relative z-0">
                                      {group.issues.map((issue, i) => (
                                        <IssueItem
                                          key={issue.id}
                                          issue={issue}
                                          index={i}
                                          fileName={issue.fileName}
                                          onSelect={() => setSelectedIssue(issue)}
                                          onApplyFix={applyAutoFix}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ));
                              })()
                            ) : filteredIssues.length === 0 ? (
                              <div className="p-20 text-center">
                                <motion.div
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center"
                                >
                                  <CheckCircle className="w-8 h-8 text-green-500" />
                                </motion.div>
                                <h3 className="text-lg font-bold mb-1">Audit Passed</h3>
                                <p className="text-muted-foreground text-sm max-w-[240px] mx-auto">
                                  {currentResult?.issues.length === 0
                                    ? 'No quality issues detected in this document.'
                                    : 'No issues match your current search filters.'}
                                </p>
                              </div>
                            ) : (
                              filteredIssues.map((issue, i) => (
                                <IssueItem
                                  key={issue.id}
                                  issue={issue}
                                  index={i}
                                  onSelect={() => setSelectedIssue(issue)}
                                  onApplyFix={applyAutoFix}
                                />
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="h-[calc(100vh-280px)] flex items-center justify-center glass border-none shadow-xl shadow-indigo-500/5">
                      <div className="text-center p-12">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="w-20 h-20 mx-auto mb-6 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500"
                        >
                          <BarChart3 className="w-10 h-10" />
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2">Select a File to Review</h3>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                          Choose a document from the left sidebar to see detailed analysis and QA results.
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Dialogs */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl rounded-3xl overflow-hidden glass border-none shadow-2xl">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="text-2xl font-black">Audit Preferences</DialogTitle>
              <DialogDescription>
                Customize which Xbench-style checks are applied during the QA engine process.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[50vh] px-6">
              <div className="space-y-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {Object.entries(ISSUE_TYPE_LABELS).map(([type, label]) => (
                    <div key={type} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 hover:bg-indigo-500/5 transition-colors group">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-bold leading-none mb-1 group-hover:text-indigo-600 transition-colors">{label}</p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter truncate">{type}</p>
                      </div>
                      <Checkbox
                        checked={config.rules[type as IssueType] !== false}
                        onCheckedChange={(checked) => {
                          setConfig(prev => ({
                            ...prev,
                            rules: {
                              ...prev.rules,
                              [type]: checked === true,
                            },
                          }));
                        }}
                        className="rounded-md"
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4 pb-4">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-500" />
                    Advanced Configuration
                  </h4>
                  <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold">Maximum Expansion Ratio</label>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold">{config.maxLengthRatio}x</span>
                    </div>
                    <Input
                      type="range"
                      step="0.1"
                      min="1.0"
                      max="3.0"
                      value={config.maxLengthRatio}
                      onChange={(e) => {
                        setConfig(prev => ({
                          ...prev,
                          maxLengthRatio: parseFloat(e.target.value) || 1.5,
                        }));
                      }}
                      className="accent-indigo-500"
                    />
                    <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                      Flags segments where the target translation is disproportionately longer than the source.
                      Standard for most languages is 1.5x.
                    </p>
                  </div>
                </div>
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

        {/* Issue Detail Dialog */}
        <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="max-w-3xl glass border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
            {selectedIssue && (
              <div className="flex flex-col h-full">
                <div className={`h-2 w-full ${selectedIssue.severity === 'error' ? 'bg-red-500' :
                  selectedIssue.severity === 'warning' ? 'bg-amber-500' :
                    'bg-blue-500'
                  }`} />
                <div className="p-8">
                  <DialogHeader className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 ${ISSUE_SEVERITY_COLORS[selectedIssue.severity]}`}>
                        {selectedIssue.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">SEGMENT #{selectedIssue.index}</span>
                    </div>
                    <DialogTitle className="text-2xl font-black leading-tight">
                      {ISSUE_TYPE_LABELS[selectedIssue.type]}
                    </DialogTitle>
                    <DialogDescription className="text-base text-foreground/70 mt-2">
                      {selectedIssue.message}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Source Material</label>
                        <div className="p-5 rounded-2xl bg-muted/30 border font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                          {selectedIssue.source}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Result</label>
                        <div className="p-5 rounded-2xl bg-muted/30 border font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                          {selectedIssue.target}
                        </div>
                      </div>
                    </div>

                    {selectedIssue.suggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-green-700/60 mb-1 block">Audit Recommendation</label>
                              <p className="text-lg font-mono text-green-700 font-bold leading-tight">{selectedIssue.suggestion}</p>
                            </div>
                          </div>
                          {selectedIssue.autoFix && (
                            <Button
                              size="lg"
                              onClick={() => { applyAutoFix(selectedIssue); setSelectedIssue(null); }}
                              className="rounded-full px-8 bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20"
                            >
                              Apply Correction
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
                <div className="px-8 py-4 bg-muted/20 border-t flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Key:</span>
                    <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{selectedIssue?.key}</code>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIssue(null)} className="rounded-full px-6 font-bold uppercase tracking-widest text-[10px]">Close Inspector</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}




export default App;
