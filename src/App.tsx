import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

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
  CheckSquare,
  Square,
  Book,
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
  TranslationUnit,
  GlossaryTerm
} from '@/types/translation';

import { runQA, DEFAULT_CONFIG } from '@/lib/qaEngine';



import { ISSUE_TYPE_LABELS, ISSUE_SEVERITY_COLORS, SUPPORTED_FILE_EXTENSIONS } from '@/types/translation';
import './App.css';

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
  const [viewMode, setViewMode] = useState<'list' | 'bilingual'>('list');
  const [selectedUnit, setSelectedUnit] = useState<TranslationUnit | null>(null);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);



  // Handle file upload
  const handleFileUpload = useCallback(async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return;

    const newFiles: TranslationFile[] = [];
    const newResults: QAResult[] = [];
    let glossaryTerms: GlossaryTerm[] | null = null;

    const filesArray = Array.from(uploadedFiles);

    // First, look for glossary files
    for (const file of filesArray) {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (['.xlsx', '.xls', '.tmx', '.csv', '.tsv'].includes(ext)) {
        // Potential glossary, check if it's strictly a glossary or just another file
        // For now, if it's one of these and we haven't loaded a glossary, try it
        try {
          const terms = await parseGlossaryFile(file);
          if (terms.length > 0) {
            glossaryTerms = terms;
            setGlossary(terms);
            setConfig(prev => ({ ...prev, glossary: terms }));
            toast.success(`Glossary loaded from ${file.name}`);
          }
        } catch (e) {
          // If it fails as glossary, it might be a regular file, let it fall through
        }
      }
    }

    for (const file of filesArray) {
      // Skip if already processed as glossary and it's not a supported translation format
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
    // Note: We no longer auto-run QA here. User must click "Run QA".
  }, [config]);



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
    setSelectedFile(null);
    setSelectedIssue(null);
    setSelectedUnit(null);
    setGlossary([]);
  }, []);

  // Handle glossary upload
  const handleGlossaryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const terms = await parseGlossaryFile(file);
      setGlossary(terms);

      // Update config with glossary
      setConfig(prev => ({
        ...prev,
        glossary: terms
      }));

      toast.success(`Glossary loaded: ${file.name}`, {
        description: `${terms.length} terms loaded`,
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



  // Export report
  const exportReport = useCallback((format: 'excel' | 'html') => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'html') {
      content = generateHTMLReport(results);
      filename = 'qa-report.html';
      mimeType = 'text/html';

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      const data: any[] = [];
      results.forEach(result => {
        result.issues.forEach(issue => {
          data.push({
            'File': result.fileName,
            'Key': issue.key,
            'Type': ISSUE_TYPE_LABELS[issue.type],
            'Severity': issue.severity,
            'Message': issue.message,
            'Source': issue.source,
            'Target': issue.target,
            'Suggestion': issue.suggestion || ''
          });
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "QA Report");
      XLSX.writeFile(workbook, "qa-report.xlsx");
    }

    toast.success('Report exported', {
      description: `Saved as ${filename || 'qa-report.xlsx'}`,
    });
  }, [results]);


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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Translation QA Engine</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Bilingual Quality Assurance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border-r pr-2 mr-2">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.tmx,.csv,.tsv"
                  onChange={handleGlossaryUpload}
                  className="hidden"
                  id="glossary-upload"
                />
                <Button
                  variant={glossary.length > 0 ? "secondary" : "outline"}
                  size="sm"
                  asChild
                >
                  <label htmlFor="glossary-upload" className="cursor-pointer">
                    <Book className="w-4 h-4 mr-2" />
                    {glossary.length > 0 ? `Glossary (${glossary.length})` : 'Add Glossary'}
                  </label>
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >

                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant={results.length === 0 ? "default" : "outline"}
                size="sm"
                onClick={results.length === 0 ? rerunQA : clearAllFiles}
                disabled={files.length === 0 || isAnalyzing}
                className={results.length === 0 && files.length > 0 ? "animate-pulse shadow-md" : ""}
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
                {results.length === 0 ? "Run QA" : "New Analysis"}
              </Button>


            </div>

          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {/* Stats Overview */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Files</p>
                      <p className="text-2xl font-bold">{overallStats.totalFiles}</p>
                    </div>
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Units</p>
                      <p className="text-2xl font-bold">{overallStats.totalUnits}</p>
                    </div>
                    <Languages className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Issues</p>
                      <p className="text-2xl font-bold">{overallStats.totalIssues}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overallStats.errors}</p>
                    </div>
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600 dark:text-amber-400">Warnings</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{overallStats.warnings}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Info</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{overallStats.info}</p>
                    </div>
                    <Info className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upload Area */}
          {files.length === 0 && (
            <Card
              className={`border-2 border-dashed transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Upload Translation Files</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Drag and drop your translation files here, or click to browse.
                    Supports JSON, XLIFF, XML, PO, STRINGS, YAML, Properties, CSV, TSV, RESX, and TMX formats.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {Object.keys(SUPPORTED_FILE_EXTENSIONS).map(ext => (
                      <Badge key={ext} variant="secondary" className="text-xs">
                        {ext}
                      </Badge>
                    ))}
                  </div>
                  <Input
                    type="file"
                    multiple
                    accept={Object.keys(SUPPORTED_FILE_EXTENSIONS).join(',')}
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {files.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar - File List */}
              <div className="lg:col-span-1">
                <Card className="h-[calc(100vh-280px)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Files</CardTitle>
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
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
                              className="h-7 w-7"
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
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100%-60px)]">
                      <div className="space-y-1 p-3">
                        {files.map(file => {
                          const result = results.find(r => r.fileId === file.id);
                          const issueCount = result?.issues.length || 0;

                          return (
                            <div
                              key={file.id}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedFile === file.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                                }`}
                              onClick={() => setSelectedFile(file.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className={`text-xs ${selectedFile === file.id
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground'
                                    }`}>
                                    {file.units.length} units
                                  </p>
                                </div>
                                {issueCount > 0 && (
                                  <Badge
                                    variant={selectedFile === file.id ? 'secondary' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {issueCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Main Panel */}
              <div className="lg:col-span-3">
                {selectedFile && currentResult ? (
                  <Card className="h-[calc(100vh-280px)]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{currentResult.fileName}</CardTitle>
                          <CardDescription>
                            {currentResult.totalUnits} translation units • {currentResult.issues.length} issues found
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                            <Button
                              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                              size="sm"
                              onClick={() => setViewMode('list')}
                            >
                              <BarChart3 className="w-4 h-4 mr-1" />
                              List
                            </Button>
                            <Button
                              variant={viewMode === 'bilingual' ? 'secondary' : 'ghost'}
                              size="sm"
                              onClick={() => setViewMode('bilingual')}
                            >
                              <Languages className="w-4 h-4 mr-1" />
                              Bilingual
                            </Button>
                          </div>
                          <Select onValueChange={(v) => exportReport(v as any)}>
                            <SelectTrigger className="w-[130px]">
                              <Download className="w-4 h-4 mr-2" />
                              <SelectValue placeholder="Export" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="html">HTML</SelectItem>
                              <SelectItem value="excel">Excel</SelectItem>
                            </SelectContent>

                          </Select>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Filters */}
                    <div className="px-6 pb-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search issues..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Severity:</span>
                          {(['error', 'warning', 'info'] as const).map(sev => (
                            <Button
                              key={sev}
                              variant={severityFilter.includes(sev) ? 'secondary' : 'ghost'}
                              size="sm"
                              onClick={() => {
                                setSeverityFilter(prev =>
                                  prev.includes(sev)
                                    ? prev.filter(s => s !== sev)
                                    : [...prev, sev]
                                );
                              }}
                              className="text-xs capitalize"
                            >
                              {severityFilter.includes(sev) ? (
                                <CheckSquare className="w-3 h-3 mr-1" />
                              ) : (
                                <Square className="w-3 h-3 mr-1" />
                              )}
                              {sev}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-0">
                      {viewMode === 'list' ? (
                        <ScrollArea className="h-[calc(100%-140px)]">
                          <div className="divide-y">
                            {filteredIssues.length === 0 ? (
                              <div className="p-8 text-center">
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                <h3 className="text-lg font-semibold mb-2">No issues found</h3>
                                <p className="text-muted-foreground">
                                  {currentResult.issues.length === 0
                                    ? 'Great job! This file passed all QA checks.'
                                    : 'No issues match your current filters.'}
                                </p>
                              </div>
                            ) : (
                              filteredIssues.map(issue => (
                                <div
                                  key={issue.id}
                                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                  onClick={() => setSelectedIssue(issue)}
                                >
                                  <div className="flex items-start gap-4">
                                    <Badge
                                      variant="outline"
                                      className={ISSUE_SEVERITY_COLORS[issue.severity]}
                                    >
                                      {issue.severity}
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="secondary" className="px-1 py-0 h-4 text-[10px] font-mono">
                                          #{issue.index}
                                        </Badge>
                                        <span className="font-medium">{ISSUE_TYPE_LABELS[issue.type]}</span>
                                        <span className="text-muted-foreground">•</span>
                                        <span className="text-sm text-muted-foreground font-mono">{issue.key}</span>
                                      </div>

                                      <p className="text-sm text-muted-foreground mb-2">{issue.message}</p>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-xs text-muted-foreground uppercase">Source</span>
                                          <p className="truncate font-mono bg-muted px-2 py-1 rounded">{issue.source}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs text-muted-foreground uppercase">Target</span>
                                          <p className="truncate font-mono bg-muted px-2 py-1 rounded">{issue.target}</p>
                                        </div>
                                      </div>
                                      {issue.suggestion && (
                                        <div className="mt-2">
                                          <span className="text-xs text-muted-foreground uppercase">Suggestion</span>
                                          <p className="text-sm text-green-600 dark:text-green-400 font-mono">{issue.suggestion}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      ) : (
                        <BilingualView
                          file={files.find(f => f.id === selectedFile)!}
                          issues={currentResult.issues}
                          onSelectUnit={setSelectedUnit}
                          selectedUnit={selectedUnit}
                        />
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-[calc(100vh-280px)] flex items-center justify-center">
                    <div className="text-center p-8 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <FileCheck className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                      <p className="text-muted-foreground max-w-xs mx-auto">
                        Drop your translation files and glossary together to start the QA process.
                      </p>
                    </div>

                  </Card>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>QA Settings</DialogTitle>
              <DialogDescription>
                Configure which checks to run during QA analysis
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[50vh]">
              <div className="space-y-6 p-1">
                <div>
                  <h4 className="text-sm font-medium mb-3">Enabled Checks</h4>
                  <div className="space-y-2">
                    {Object.entries(ISSUE_TYPE_LABELS).map(([type, label]) => (
                      <div key={type} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{type}</p>
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
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3">Advanced Options</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm mb-1 block">Max Length Ratio</label>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        max="3"
                        value={config.maxLengthRatio}
                        onChange={(e) => {
                          setConfig(prev => ({
                            ...prev,
                            maxLengthRatio: parseFloat(e.target.value) || 1.5,
                          }));
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum allowed ratio of target length to source length
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setConfig(DEFAULT_CONFIG)}>
                Reset to Default
              </Button>
              <Button onClick={() => {
                rerunQA();
                setShowSettings(false);
              }}>
                Apply & Re-run
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Issue Detail Dialog */}
        <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={selectedIssue ? ISSUE_SEVERITY_COLORS[selectedIssue.severity] : ''}
                >
                  {selectedIssue?.severity}
                </Badge>
                {selectedIssue && (
                  <span className="flex items-center gap-2">
                    {ISSUE_TYPE_LABELS[selectedIssue.type]}
                    <Badge variant="secondary" className="font-normal text-[10px] h-4">
                      Segment #{selectedIssue.index}
                    </Badge>
                  </span>
                )}

              </DialogTitle>
              <DialogDescription>
                {selectedIssue?.message}
              </DialogDescription>
            </DialogHeader>
            {selectedIssue && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Key</label>
                  <code className="bg-muted px-2 py-1 rounded text-sm">{selectedIssue.key}</code>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Source</label>
                    <div className="bg-muted p-3 rounded-lg font-mono text-sm whitespace-pre-wrap">
                      {selectedIssue.source}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Target</label>
                    <div className="bg-muted p-3 rounded-lg font-mono text-sm whitespace-pre-wrap">
                      {selectedIssue.target}
                    </div>
                  </div>
                </div>
                {selectedIssue.suggestion && (
                  <div>
                    <label className="text-sm font-medium mb-1 block text-green-600">Suggestion</label>
                    <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg font-mono text-sm whitespace-pre-wrap text-green-700 dark:text-green-400">
                      {selectedIssue.suggestion}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// Bilingual View Component
interface BilingualViewProps {
  file: TranslationFile;
  issues: QAIssue[];
  onSelectUnit: (unit: TranslationUnit) => void;
  selectedUnit: TranslationUnit | null;
}

function BilingualView({ file, issues, onSelectUnit, selectedUnit }: BilingualViewProps) {
  const [filter, setFilter] = useState<'all' | 'issues'>('all');

  const unitsWithIssues = new Set(issues.map(i => i.unitId));

  const displayUnits = filter === 'issues'
    ? file.units.filter(u => unitsWithIssues.has(u.id))
    : file.units;

  return (
    <div className="h-[calc(100%-140px)] flex flex-col">
      <div className="flex items-center justify-between px-6 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Units
          </Button>
          <Button
            variant={filter === 'issues' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('issues')}
          >
            With Issues
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          Showing {displayUnits.length} of {file.units.length} units
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y">
          {displayUnits.map(unit => {
            const unitIssues = issues.filter(i => i.unitId === unit.id);
            const hasIssues = unitIssues.length > 0;

            return (
              <div
                key={unit.id}
                className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${selectedUnit?.id === unit.id ? 'bg-primary/5' : ''
                  }`}
                onClick={() => onSelectUnit(unit)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{unit.key}</code>
                      {hasIssues && (
                        <Badge variant="destructive" className="text-xs">
                          {unitIssues.length} issue{unitIssues.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                        <span className="text-xs text-blue-600 dark:text-blue-400 uppercase font-medium">Source</span>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{unit.source}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${hasIssues
                        ? 'bg-red-50 dark:bg-red-950/30'
                        : 'bg-green-50 dark:bg-green-950/30'
                        }`}>
                        <span className={`text-xs uppercase font-medium ${hasIssues
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                          }`}>Target</span>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{unit.target || '(empty)'}</p>
                      </div>
                    </div>
                    {hasIssues && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {unitIssues.map(issue => (
                          <Badge
                            key={issue.id}
                            variant="outline"
                            className={`text-xs ${ISSUE_SEVERITY_COLORS[issue.severity]}`}
                          >
                            {ISSUE_TYPE_LABELS[issue.type]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Generate HTML Report
function generateHTMLReport(results: QAResult[]): string {
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Translation QA Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px; }
    h1 { color: #1a1a1a; margin-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; color: #0066cc; }
    .stat-label { color: #666; font-size: 0.9em; }
    .file-section { margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px; }
    .file-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .file-name { font-size: 1.2em; font-weight: 600; }
    .issue-count { background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.9em; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e0e0e0; }
    th { background: #f8f9fa; font-weight: 600; color: #555; }
    .severity { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 0.85em; font-weight: 500; }
    .severity-error { background: #fee; color: #c33; }
    .severity-warning { background: #fff3cd; color: #856404; }
    .severity-info { background: #e3f2fd; color: #0d47a1; }
    .source, .target { font-family: monospace; background: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 0.9em; max-width: 300px; overflow: hidden; text-overflow: ellipsis; }
    .timestamp { color: #999; font-size: 0.9em; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Translation QA Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    
    <div class="summary">
      <div class="stat-card">
        <div class="stat-value">${results.length}</div>
        <div class="stat-label">Files</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${results.reduce((sum, r) => sum + r.totalUnits, 0)}</div>
        <div class="stat-label">Translation Units</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${totalIssues}</div>
        <div class="stat-label">Total Issues</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${results.reduce((sum, r) => sum + r.stats.errors, 0)}</div>
        <div class="stat-label">Errors</div>
      </div>
    </div>
    
    ${results.map(result => `
      <div class="file-section">
        <div class="file-header">
          <span class="file-name">${result.fileName}</span>
          <span class="issue-count">${result.issues.length} issues</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Type</th>
              <th>Key</th>
              <th>Source</th>
              <th>Target</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            ${result.issues.map(issue => `
              <tr>
                <td><span class="severity severity-${issue.severity}">${issue.severity}</span></td>
                <td>${ISSUE_TYPE_LABELS[issue.type]}</td>
                <td><code>${issue.key}</code></td>
                <td><div class="source" title="${issue.source.replace(/"/g, '&quot;')}">${issue.source}</div></td>
                <td><div class="target" title="${issue.target.replace(/"/g, '&quot;')}">${issue.target}</div></td>
                <td>${issue.message}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('')}
    
    <p class="timestamp">Report generated by Translation QA Engine</p>
  </div>
</body>
</html>`;
}

export default App;
