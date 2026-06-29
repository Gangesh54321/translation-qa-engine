import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Layers,
  FileText,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';


interface BlogIntroductionProps {
  features?: { title: string; description: string; icon: React.ReactNode; image?: string }[];
  categories?: { name: string; description: string }[];
  formats?: {
    standard: string[];
    professional: { name: string; description: string }[];
  };
  showOnly?: 'Home' | 'features' | 'categories' | 'formats' | 'highlights' | 'footer';
  onLaunch?: () => void;
}

const DEFAULT_FEATURES: { title: string; description: string; icon: React.ReactNode; image?: string }[] = [
  {
    title: "Comprehensive QA Rules",
    description: "From simple punctuation to complex terminology consistency. Our rule set covers every possible linguistic pitfall.",
    icon: <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
  },
  {
    title: "Industrial-Scale Parsing",
    description: "Support for multiple industrial file formats. Upload your project and get results in seconds, not minutes.",
    icon: <Layers className="w-6 h-6" aria-hidden="true" />
  },
  {
    title: "Combined Export",
    description: "Advanced export to Excel, HTML, or Bilingual RTF. Share your audit results with colleagues or clients in their preferred format.",
    icon: <FileText className="w-6 h-6" aria-hidden="true" />
  },
  {
    title: "Smart De-duplication",
    description: "Intelligent filtering so you only see unique, actionable issues. No more wading through repetitive tag mismatches.",
    icon: <Trash2 className="w-6 h-6" aria-hidden="true" />
  },
  {
    title: "Bilingual Review RTF",
    description: "Download a 2-column report for manual proofreading. Perfect for offline review or final client sign-off.",
    icon: <Search className="w-6 h-6" aria-hidden="true" />
  },
  {
    title: "Glossary & Blacklist Support",
    description: "Personalize your audits with custom termbases. Ensure your project's specific terminology is respected every time.",
    icon: <BookOpen className="w-6 h-6" aria-hidden="true" />
  },
  {
    title: "AI & Custom Spellcheck",
    description: "Detect spelling errors across 100+ languages using powerful custom dictionaries and AI-enhanced contextual suggestions.",
    icon: <ShieldCheck className="w-6 h-6" aria-hidden="true" />
  },
];

const DEFAULT_CATEGORIES = [
  { name: "Terminology", description: "Termbase matching, forbidden words, and inflection validation." },
  { name: "Spellcheck", description: "AI-enhanced & custom dictionary spell correction." },
  { name: "Numbers", description: "Numeric count, mismatch, and localization checks." },
  { name: "Tags", description: "XML/HTML tag integrity and order mismatch." },
  { name: "Punctuation", description: "Missing end marks, double punctuation, and quote mismatches." },
  { name: "Whitespace", description: "Leading/trailing spaces, double spaces, and NBSP validation." },
  { name: "Capitalization", description: "Sentence-start checks and All-Caps mismatch." },
  { name: "Length", description: "Expansion limits and suspiciously short translations." },
  { name: "Consistency", description: "Cross-segment repetition and identical source/different target checks." },
  { name: "Formatting", description: "Line break and paragraph mismatch." },
  { name: "Language", description: "Script mixing (Latn/Cyrl) and locale variant detection." },
  { name: "Segment Structure", description: "Untranslated segments and source-copy detection." },
  { name: "Regex / Pattern", description: "URL/Email mismatch and custom regex rule support." },
  { name: "Localization", description: "Date, currency, and address format validation." },
];

const DEFAULT_FORMATS = {
  standard: [".json", ".xml", ".csv", ".tsv", ".txt", ".yaml", ".properties"],
  professional: [
    { name: "XLIFF / MQXLIFF", description: "The standard for exchange." },
    { name: "SDLXLIFF", description: "Full support for Trados Studio files." },
    { name: "PO / POT", description: "The heart of open-source localization." },
    { name: "STRINGS / RESX", description: "Native support for iOS and Windows." },
    { name: "TMX / TBX", description: "Bilingual memory and glossary interchange." },
    { name: "TTX", description: "Tag Editor legacy support." },
  ]
};

export const BlogIntroduction: React.FC<BlogIntroductionProps> = ({
  features = DEFAULT_FEATURES,
  categories = DEFAULT_CATEGORIES,
  formats = DEFAULT_FORMATS,
  showOnly,
  onLaunch
}) => {
  const isSelected = (section: string) => !showOnly || showOnly === section;

  return (
    <div id="features" className="mx-auto mb-8 max-w-[1400px] space-y-16 px-4 font-sans text-slate-700 dark:text-slate-300">

      {/* Features Header & Core Capabilities */}
      {isSelected('features') && (
        <>
          <section id="features" className="py-12 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <Badge variant="outline" className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">Industrial Grade</Badge>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">Core <br /><span className="text-primary">Capabilities</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Linguistic Accuracy",
                  description: "Industry-leading rulesets validated by localization experts for global projects.",
                  icon: <ShieldCheck className="w-6 h-6" />,
                  color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                },
                {
                  title: "Ultra-Fast Analysis",
                  description: "Process massive datasets and complex file structures in under 500ms.",
                  icon: <Zap className="w-6 h-6" />,
                  color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                },
                {
                  title: "Context-Aware AI",
                  description: "Advanced logic that detects semantic mismatches and tag integrity risks.",
                  icon: <Cpu className="w-6 h-6" />,
                  color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="p-12 rounded-[3.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none text-center flex flex-col items-center group transition-all"
                >
                  <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  
                  <h3 className="text-2xl font-black mb-4 text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Staggered Features */}
          <section className="space-y-20 py-8">
          {features.slice(0, 7).map((feature, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center`}
            >
              <div className="flex-1 space-y-6">
                <Badge variant="outline" className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">
                  Precision 0{i + 1}
                </Badge>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-[0.9] uppercase tracking-tighter">{feature.title}</h2>
                <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-400 font-medium italic">{feature.description}</p>
                <div className="flex items-center gap-4 pt-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Industrial Grade</span>
                </div>
              </div>
              <div className="flex-1 w-full max-w-xl">
                <div className="aspect-video relative rounded-[3.5rem] border-8 border-white dark:border-slate-900 shadow-2xl overflow-hidden group">
                  <img 
                    src={
                      feature.image || (
                        i === 0 ? "/assets/multi_format.png" :
                        i === 1 ? "/assets/linguistic.png" :
                        i === 2 ? "/assets/reporting.png" :
                        "/assets/engine.png"
                      )
                    } 
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                    <p className="text-white font-black text-xl uppercase tracking-widest">{feature.title}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      </>
    )}

      {/* Categories Grid */}
      {isSelected('categories') && (
        <section id="categories" className="relative overflow-hidden bg-slate-950 text-white rounded-[5rem] p-8 md:p-16 space-y-12">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/2 h-full bg-orange-500/5 blur-[120px] pointer-events-none" />
          
          <div className="text-center max-w-4xl mx-auto space-y-6 relative z-10">
            <Badge variant="outline" className="px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-white/5 text-white border-white/20">Audit Engine Core</Badge>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-none">Comprehensive Audit <br /><span className="text-primary">Categories</span></h2>
            <p className="text-slate-400 text-xl leading-relaxed font-medium max-w-2xl mx-auto">Advanced rulesets designed for complex localization workflows. Total control over your audit preferences.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {categories.map((cat, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -10, backgroundColor: "rgba(255, 92, 0, 0.05)", borderColor: "rgba(255, 92, 0, 0.3)" }}
                className="p-10 rounded-[3rem] bg-white/5 border border-white/10 transition-all group backdrop-blur-sm"
              >
                <div className="flex items-center gap-5 mb-6">
                  <span className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <h4 className="font-black text-xl m-0 uppercase tracking-tight">{cat.name}</h4>
                </div>
                <p className="text-base text-slate-400 leading-relaxed font-bold">{cat.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* File Formats */}
      {isSelected('formats') && (
        <section id="formats" className="space-y-16 px-4 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-slate-100 dark:border-slate-800 pb-16">
            <div className="space-y-6 max-w-2xl">
              <Badge variant="outline" className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20">Compatibility</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white m-0 uppercase leading-none tracking-tighter">Supported <br /><span className="text-primary">Formats</span></h2>
              <p className="text-2xl text-slate-600 dark:text-slate-400 m-0 font-medium italic">Built for the modern localization stack.</p>
            </div>
            <div className="flex flex-wrap gap-3 max-w-md justify-end">
              {formats.standard.map(f => (
                <span key={f} className="px-6 py-3 rounded-full bg-slate-50 dark:bg-slate-900 font-black text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary transition-colors">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {formats.professional.map((f, i) => (
              <div key={i} className="p-12 rounded-[3.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-4 transition-all duration-500 group">
                <div className="text-primary font-black text-3xl mb-8 group-hover:translate-x-2 transition-transform origin-left">0{i + 1}</div>
                <h4 className="text-2xl font-black mb-4 text-slate-900 dark:text-white uppercase tracking-tight">{f.name}</h4>
                <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium italic">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* Footer CTA */}
      {isSelected('footer') && (
        <section className="relative rounded-[4rem] overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="/assets/launch.png" 
              alt="Launch Background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-500/20" />
          </div>
          
          <div className="relative z-10 text-center py-20 px-4 space-y-12">
            <div className="space-y-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest"
              >
                <Zap className="w-4 h-4 text-primary" />
                Ready to optimize your workflow?
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-none">
                Get Started Today
              </h2>
              <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed italic">
                Stop guessing and start auditing. Your bilingual quality assurance is now faster, smarter, and more beautiful than ever.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
              <button 
                onClick={() => onLaunch ? onLaunch() : window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-16 py-6 bg-primary hover:bg-primary/90 text-white font-black text-2xl rounded-full shadow-[0_20px_50px_-10px_rgba(59,130,246,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 group"
              >
                Launch TransTech Hub
                <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

