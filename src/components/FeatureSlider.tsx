import React from 'react';
import { motion } from 'framer-motion';
import Autoplay from 'embla-carousel-autoplay';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselPrevious, 
  CarouselNext,
  type CarouselApi
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, Info } from "lucide-react";

interface SlideData {
  title: string;
  source: string;
  target: string;
  error?: string;
  correction?: string;
  type: string;
  footer: string;
}

const slides: SlideData[] = [
  {
    title: "Terminology Support",
    source: "Access the profile dashboard.",
    target: "प्रोफ़ाइल पैनल तक पहुँचें।",
    error: "पैनल",
    correction: "डैशबोर्ड",
    type: "TERMINOLOGY",
    footer: "[INFO] Glossary mismatch detected"
  },
  {
    title: "Spellcheck",
    source: "Verification completed.",
    target: "सत्यापन पुरा हुआ।",
    error: "पुरा",
    correction: "पूरा",
    type: "SPELLCHECK",
    footer: "[INFO] Spelling error identified"
  },
  {
    title: "Grammar Check",
    source: "The systems are online.",
    target: "सिस्टम ऑनलाइन है।",
    error: "है",
    correction: "हैं",
    type: "GRAMMAR",
    footer: "[INFO] Subject-Verb agreement error"
  },
  {
    title: "Multiple Files",
    source: "Batch Audit (Project_A)",
    target: "Analyzing 45 Files...",
    error: "Analyzing",
    correction: "Verified",
    type: "MULTI-FILE",
    footer: "[INFO] Cross-file consistency check"
  },
  {
    title: "Multiple Export Formats",
    source: "Download Results",
    target: "Select: Excel / HTML / RTF",
    error: "Select:",
    correction: "Ready:",
    type: "EXPORT",
    footer: "[INFO] Professional reports generated"
  },
  {
    title: "Advanced Tag Validation",
    source: "[1}Signature:{2]",
    target: "[1}توقيع:{3]",
    error: "{3]",
    correction: "{2]",
    type: "TAGS",
    footer: "[INFO] MemoQ mixed-bracket tag mismatch"
  }
];

export function FeatureSlider() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full">
      <div className="flex justify-center gap-2 mb-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              current === i ? "bg-primary w-5" : "bg-slate-300"
            }`}
          />
        ))}
      </div>

      <Carousel 
        setApi={setApi} 
        plugins={[
          Autoplay({
            delay: 4000,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8">
                    <div className="text-center space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Precision QA Insight</p>
                        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
                          {slide.title}
                        </h3>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 space-y-4 border border-slate-100">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Source</p>
                          <p className="text-lg font-medium text-slate-700 text-left">{slide.source}</p>
                        </div>
                        
                        <div className="h-px bg-slate-200 w-full" />

                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Target</p>
                          <div className="text-lg font-medium text-slate-900 text-left flex flex-wrap items-center gap-2">
                            {slide.target.split(slide.error || "___").map((part, i, arr) => (
                              <React.Fragment key={i}>
                                {part}
                                {i < arr.length - 1 && (
                                  <span className="relative group">
                                    <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/30 font-bold decoration-primary underline decoration-2 underline-offset-4">
                                      {slide.error}
                                    </span>
                                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none">
                                      Correction: {slide.correction}
                                    </span>
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                          <Info className="w-3 h-3" />
                          {slide.footer}
                        </div>
                        <Badge variant="outline" className="border-primary/20 text-primary text-[10px] font-black tracking-widest px-3 py-1 uppercase rounded-full">
                          {slide.type} Verified
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden md:block">
          <CarouselPrevious className="-left-16 border-none bg-white shadow-xl hover:bg-slate-50 text-slate-900" />
          <CarouselNext className="-right-16 border-none bg-white shadow-xl hover:bg-slate-50 text-slate-900" />
        </div>
      </Carousel>
    </div>
  );
}
