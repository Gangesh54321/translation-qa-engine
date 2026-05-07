import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { QAResult, IssueCategory, IssueType } from '@/types/translation';
import { ISSUE_CATEGORY_LABELS, ISSUE_CATEGORY_MAP } from '@/types/translation';
import { 
  BarChart3, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface LinguisticInsightsProps {
  results: QAResult[];
}

export const LinguisticInsights: React.FC<LinguisticInsightsProps> = ({ results }) => {
  const stats = useMemo(() => {
    const categoryStats: Record<string, { count: number, errors: number, warnings: number }> = {};
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalInfo = 0;

    results.forEach(res => {
      totalErrors += res.stats.errors;
      totalWarnings += res.stats.warnings;
      totalInfo += res.stats.info;

      res.issues.forEach(issue => {
        const category = ISSUE_CATEGORY_MAP[issue.type] || 'other';
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, errors: 0, warnings: 0 };
        }
        categoryStats[category].count++;
        if (issue.severity === 'error') categoryStats[category].errors++;
        if (issue.severity === 'warning') categoryStats[category].warnings++;
      });
    });

    return {
      categoryStats: Object.entries(categoryStats).sort((a, b) => b[1].count - a[1].count),
      totalErrors,
      totalWarnings,
      totalInfo,
      totalIssues: totalErrors + totalWarnings + totalInfo
    };
  }, [results]);

  if (results.length === 0) return null;

  return (
    <div className="space-y-10 py-6">
      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass border-none shadow-indigo-500/10 p-6 bg-indigo-500/5">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Linguistic Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tighter text-indigo-600">
                {Math.max(0, 100 - (stats.totalIssues * 2)).toFixed(0)}
              </span>
              <span className="text-xl font-bold text-indigo-400">/100</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Based on industrial QA standards</p>
          </div>
        </Card>

        <div className="md:col-span-3 grid grid-cols-3 gap-6">
           {[
            { label: 'Critical Errors', value: stats.totalErrors, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
            { label: 'Linguistic Warnings', value: stats.totalWarnings, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Minor Issues', value: stats.totalInfo, icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
          ].map((stat) => (
            <Card key={stat.label} className="glass border-none shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className={`text-3xl font-black ${stat.color}`}>{stat.value}</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="glass border-none shadow-xl overflow-hidden">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              Category Breakdown
            </CardTitle>
            <CardDescription className="text-sm font-medium italic">Distribution of issues across linguistic categories</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-6 space-y-6">
            {stats.categoryStats.map(([category, data]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-700">
                    {ISSUE_CATEGORY_LABELS[category as IssueCategory] || category}
                  </span>
                  <span className="text-xs font-bold text-indigo-600">{data.count} Issues</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.errors / stats.totalIssues) * 100}%` }}
                    className="h-full bg-rose-500"
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.warnings / stats.totalIssues) * 100}%` }}
                    className="h-full bg-amber-500"
                  />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((data.count - data.errors - data.warnings) / stats.totalIssues) * 100}%` }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass border-none shadow-xl p-8 bg-indigo-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Precision Audit Status</h3>
            <p className="text-indigo-100 font-medium leading-relaxed mb-6">
              Our AI engine has completed a multi-pass linguistic audit. We recommend addressing the {stats.totalErrors} critical errors before final delivery to ensure brand integrity.
            </p>
            <div className="flex gap-4">
              <div className="flex-1 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Consistency</p>
                <p className="text-lg font-black">{stats.categoryStats.find(c => c[0] === 'consistency')?.[1].count || 0 === 0 ? 'High' : 'Mixed'}</p>
              </div>
              <div className="flex-1 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Risk Level</p>
                <p className="text-lg font-black">{stats.totalErrors > 5 ? 'High' : stats.totalErrors > 0 ? 'Medium' : 'Low'}</p>
              </div>
            </div>
          </Card>

          <Card className="glass border-none shadow-xl p-8 space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Recommended Actions</h4>
            <div className="space-y-3">
              {[
                { text: "Fix terminology mismatches using glossary terms", icon: CheckCircle },
                { text: "Correct numeric discrepancies in critical segments", icon: CheckCircle },
                { text: "Ensure tag integrity for localized software strings", icon: CheckCircle },
              ].map((action, i) => (
                <div key={i} className="flex items-center gap-3 text-xs font-medium text-slate-600">
                  <action.icon className="w-4 h-4 text-green-600" />
                  {action.text}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
