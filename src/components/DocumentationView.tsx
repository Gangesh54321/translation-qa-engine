import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  CheckCircle2, 
  ArrowLeft,
  FileText,
  Upload,
  Search,
  Zap,
  Download,
  ShieldCheck,
  MousePointer2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface DocumentationViewProps {
  onBack: () => void;
}

const STEPS = [
  {
    icon: <MousePointer2 className="w-6 h-6" />,
    title: "1. Sign In & Navigation",
    description: "Start by signing in through the floating Pill-Nav at the top. New users receive 5 Free Credits to begin auditing. Use the navigation bar to jump between Home, Features, and the QA Engine.",
    details: [
      "Instant Access: Sign in with your name and email to initialize your professional workspace.",
      "Free Credits: Every new account starts with 5 credits to test the engine's precision.",
      "Dynamic Nav: The Pill-Nav follows you as you scroll, allowing one-click access to the workspace."
    ],
    tip: "Look for the 'Sign In' button in the center of the navigation bar."
  },
  {
    icon: <Upload className="w-6 h-6" />,
    title: "2. Upload & Credits",
    description: "Drop your files into the workspace to begin analysis. Each file upload or manual re-run consumes 1 credit (CR) from your balance, visible in your profile dropdown.",
    details: [
      "Supported Formats: Fully processes industry formats like SDLXLIFF, MQXLIFF, XLIFF, JSON, TMX, CSV, and more.",
      "Credit Management: View your 'CR' balance in the navigation bar. 5 free credits are added upon initial sign-in.",
      "Batch Processing: Select multiple files at once. The engine calculates the credit cost before processing."
    ],
    tip: "Monitor your CR badge in the Pill-Nav to keep track of your audit capacity."
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: "3. Review Results",
    description: "Once your files are analyzed, our engine applies multi-tier quality assurance rules. Filter issues by severity or search for specific items to speed up your auditing tasks.",
    details: [
      "Rich Split Screen View: The interactive workspace shows the source text side-by-side with its target translation.",
      "Issue Breakdown: Errors, Warnings, and Info markers are clearly highlighted. Click on any file to select it and view its issues instantly.",
      "Smart Filtering: Use the rules filter to look for missing punctuation, terms, or tag order mismatches."
    ],
    tip: "Toggle between Error, Warning, and Info filters to prioritize your work."
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "4. Smart Glossaries",
    description: "The engine automatically detects target languages and applies preset terminology checks. You can also upload custom termbases for project-specific audits.",
    details: [
      "Auto-Detection: On upload, the app identifies languages (e.g., Hindi, Spanish, Russian) and applies relevant preset terms.",
      "Custom Upload: Supports termbases in CSV, TSV, and TMX format via the dedicated Glossary tab.",
      "Terminology Mapping: Instantly flags mismatches, missing terms, and forbidden vocabulary usage."
    ],
    tip: "Check the Glossary tab to see which terms are currently active in your audit."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "5. Advanced Intelligence",
    description: "TransTech Hub uses advanced script-aware linguistic logic to detect structural shifts, tag integrity issues, and mixed scripts.",
    details: [
      "Script Awareness: Prevents false positive spelling errors for non-Latin scripts (e.g. Hindi, Kannada) if the custom dictionary doesn't support them.",
      "Context Validation: Deep scanning identifies semantic shifts and syntax errors that basic checks miss.",
      "Spellcheck Integration: Seamless spellchecking across 100+ languages with full dictionary caching to maintain sub-500ms processing speeds."
    ],
    tip: "Enable 'Deep Scan' in the advanced settings tab for complex projects."
  },
  {
    icon: <Download className="w-6 h-6" />,
    title: "6. Export Reports",
    description: "Save your audit results in your choice of file format to present to clients or share with team members.",
    details: [
      "Interactive HTML Report: A fully styled single-file HTML page containing visuals, summary charts, and detailed issue breakdowns.",
      "Structured Excel Report: Perfect for data analysis, parsing with other tools, and tracking metrics in enterprise pipelines.",
      "Bilingual RTF: A convenient two-column document ideal for manual side-by-side offline proofreading."
    ],
    tip: "The Professional HTML report is our most detailed and visual export format."
  }
];

export const DocumentationView: React.FC<DocumentationViewProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="flex flex-col h-[calc(100vh-120px)] max-w-6xl mx-auto w-full"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            aria-label="Back to dashboard"
            className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none">Intelligence Center Guide</h1>
            <p className="text-muted-foreground text-sm mt-1">Master the TransTech Hub ecosystem in minutes.</p>
          </div>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 text-primary font-bold uppercase tracking-widest text-[10px]">
          v1.0 Documentation
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Navigation Sidebar */}
        <Card className="lg:col-span-1 rounded-[2.5rem] border-none glass shadow-xl overflow-hidden flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Quick Navigation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {STEPS.map((step, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      const element = document.getElementById(`step-${i}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px] group-hover:bg-primary/20 group-hover:text-primary transition-colors" aria-hidden="true">
                      0{i + 1}
                    </div>
                    <span className="text-[13px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">{step.title.split('. ')[1]}</span>
                    <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content Area */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none glass shadow-xl overflow-hidden flex flex-col">
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full px-8 py-10">
              <div className="space-y-16 pb-20">
                {STEPS.map((step, i) => (
                  <motion.section 
                    key={i}
                    id={`step-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6 relative"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20" aria-hidden="true">
                        {step.icon}
                      </div>
                      <h2 className="text-2xl font-black tracking-tight">{step.title}</h2>
                    </div>
                    
                    <div className="pl-0 md:pl-16 space-y-6">
                      <p className="text-base text-foreground/80 leading-relaxed font-semibold">
                        {step.description}
                      </p>

                      <ul className="space-y-3 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-border shadow-sm">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(255,92,0,0.4)]" />
                            <span className="text-sm font-bold text-foreground leading-relaxed">{detail}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="p-6 rounded-[2rem] bg-gradient-to-r from-primary/10 to-orange-500/5 border border-primary/20 flex gap-5 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 block">Pro Tip</label>
                          <p className="text-sm font-black leading-tight text-slate-800 dark:text-white">{step.tip}</p>
                        </div>
                      </div>
                    </div>

                    {i < STEPS.length - 1 && (
                      <div className="absolute -bottom-8 left-7 w-[2px] h-10 bg-gradient-to-b from-primary/20 to-transparent" />
                    )}
                  </motion.section>
                ))}

                <div className="pt-10 text-center">
                  <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-black uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                    Documentation Complete
                  </div>
                  <div className="mt-8">
                    <Button 
                      size="lg" 
                      onClick={onBack}
                      className="rounded-full px-10 h-14 text-lg font-bold shadow-2xl shadow-primary/20 hover:scale-105 transition-transform"
                    >
                      Return to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
