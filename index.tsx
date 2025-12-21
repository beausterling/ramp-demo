
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Upload, 
  FileText, 
  Download, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  LayoutDashboard,
  Wallet,
  CreditCard,
  History,
  AlertCircle,
  Loader2,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  Lightbulb,
  Target,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import Papa from 'papaparse';
import { GoogleGenAI } from "@google/genai";

// --- Brand Palette (Based on provided images) ---
const RAMP_COLORS = {
  bg: '#E8E8E1',      // Cream / Light Beige (from image 1)
  black: '#1A1A1A',   // Deep Dark Grey (from image 1/2)
  neon: '#CEFD2F',    // Neon Lime Green (from image 2/3)
  white: '#FFFFFF',
  gray100: '#DCDCD3', // Subtle border color
  gray500: '#6B7280',
  chart: ['#1A1A1A', '#374151', '#4B5563', '#6B7280', '#CEFD2F'] // Monochromatic + Neon pop
};

const LOADING_STEPS = [
  "Ingesting document data...",
  "OCR: Extracting ledger balances...",
  "Cross-referencing accounts and loans...",
  "Detecting spending anomalies...",
  "Calculating category distributions...",
  "Synthesizing strategic suggestions...",
  "Finalizing visualization frames..."
];

interface FinancialData {
  summary: {
    totalSpend: number;
    totalBudget: number;
    burnRate: string;
    topCategory: string;
  };
  charts: {
    monthlySpend: { month: string; amount: number }[];
    categoryDistribution: { category: string; percentage: number }[];
    vendorSpend: { vendor: string; amount: number }[];
    spendOverTime: { date: string; amount: number }[];
  };
  insights: string[];
  suggestions: { title: string; description: string; impact: 'High' | 'Medium' | 'Low' }[];
}

type GeminiPayload = {
  text?: string;
  pdf?: {
    data: string;
    mimeType: string;
  };
};

// --- Components ---

const RampLogo = ({ className = "" }: { className?: string }) => (
  <svg 
    width="100" 
    height="28" 
    viewBox="0 0 75 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      fill="currentColor" 
      d="M5.19 6.76c-1.79 0-2.667 1.576-2.667 3.681v5.275H0V4.585h2.478v2.888h.043c.53-1.776 1.585-3.21 3.212-3.21 1.144 0 1.627.399 1.627.399L6.22 6.955c0-.002-.363-.195-1.031-.195Zm30.496 1.528v7.427h-2.458V9.192c0-1.872-.587-2.864-2.088-2.864-1.553 0-2.305 1.254-2.305 3.66v5.726H26.4V9.192c0-1.8-.58-2.864-2.066-2.864-1.695 0-2.348 1.486-2.348 3.66v5.726h-2.478V4.584h2.478v2.521h.022c.386-1.744 1.44-2.82 3.218-2.82 1.764 0 2.913.947 3.349 2.627.415-1.617 1.52-2.628 3.218-2.628 2.37 0 3.893 1.486 3.893 4.004ZM12.318 4.262c-2.28 0-3.773 1.071-4.453 3.005l2.099.763c.382-1.166 1.18-1.83 2.398-1.83 1.37 0 2.175.603 2.175 1.528 0 .947-.64 1.145-2.088 1.379-1.61.259-5.437.344-5.437 3.573 0 1.892 1.582 3.315 3.958 3.315 1.786 0 3.003-.73 3.566-2.089h.022v1.81h2.457V8.868c0-2.995-1.508-4.607-4.697-4.607Zm2.283 6.214c0 2.334-1.155 3.833-3 3.833-1.306 0-2.088-.732-2.088-1.788 0-.99.804-1.678 2.348-1.961 1.58-.29 2.375-.648 2.74-1.507v1.423Zm29.826-6.192c-1.88 0-3.121 1.033-3.653 2.585V4.585h-2.61V20h2.588v-6.568h.022c.576 1.681 1.775 2.606 3.653 2.606 2.979 0 5.11-2.454 5.11-5.921 0-3.443-2.131-5.833-5.11-5.833Zm-.642 9.688c-2.063 0-3.207-1.497-3.207-3.822s1.28-3.822 3.207-3.822c1.926 0 3.208 1.57 3.208 3.822 0 2.253-1.28 3.822-3.208 3.822ZM75.172 15.665v.07l-10.1.003v-.073c1.457-.823 2.462-1.66 3.367-2.536h4.147l2.586 2.536ZM72.67 2.51 70.11 0h-.075s.043 4.68-4.255 8.936c-4.206 4.166-9.152 4.175-9.152 4.175v.073l2.608 2.555s4.874.048 9.18-4.175c4.29-4.21 4.254-9.053 4.254-9.053Z" 
    />
  </svg>
);

const Card = ({ children, title, className = "", subtitle = "" }: { children?: React.ReactNode, title?: string, className?: string, subtitle?: string }) => (
  <div className={`bg-white border border-[#DCDCD3] rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ${className}`}>
    {(title || subtitle) && (
      <div className="px-6 py-5 border-b border-[#F0F0E8] flex justify-between items-center">
        <div>
          {title && <h3 className="text-sm font-black text-black uppercase tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-300 cursor-pointer" />
      </div>
    )}
    <div className="p-6">
      {children || null}
    </div>
  </div>
);

const StatCard = ({ title, value, change, isPositive }: { title: string, value: string, change: string, isPositive: boolean }) => (
  <Card className="flex flex-col justify-between h-full bg-white">
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
      <div className={`flex items-center text-[11px] font-black px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
        {change}
      </div>
    </div>
    <div className="text-3xl font-black text-black tracking-tightest leading-none">{value}</div>
  </Card>
);

const App = () => {
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [data, setData] = useState<FinancialData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: number;
    if (loading) {
      interval = window.setInterval(() => {
        setLoadingStepIdx((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 3000);
    } else {
      setLoadingStepIdx(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const processDataWithGemini = useCallback(async (payload: GeminiPayload) => {
    try {
      setLoading(true);
      setError(null);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Analyze this financial statement. Extract all transaction data and provide deep strategic insights. 

        CRITICAL: The 'categoryDistribution' values must be valid percentages (0-100) representing the share of total spend for that category. They MUST sum to 100.

        Return a JSON object:
        {
          "summary": { "totalSpend": number, "totalBudget": number, "burnRate": string, "topCategory": string },
          "charts": {
            "monthlySpend": [{ "month": string, "amount": number }],
            "categoryDistribution": [{ "category": string, "percentage": number }],
            "vendorSpend": [{ "vendor": string, "amount": number }],
            "spendOverTime": [{ "date": string, "amount": number }]
          },
          "insights": [string],
          "suggestions": [{ "title": string, "description": string, "impact": "High" | "Medium" | "Low" }]
        }`;

      const parts: any[] = [];
      if (payload.pdf) {
        parts.push({ inlineData: payload.pdf });
        parts.push({ text: prompt });
      } else if (payload.text) {
        parts.push({ text: `${prompt}\n\nData:\n${payload.text.slice(0, 30000)}` });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts },
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 3000 }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");
      const parsed = JSON.parse(text) as FinancialData;
      setData(parsed);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please ensure the file is a clear bank statement.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const base64 = result.split(',')[1];
        processDataWithGemini({ pdf: { data: base64, mimeType: "application/pdf" } });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processDataWithGemini({ text });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8E8E1] text-[#1A1A1A] font-sans selection:bg-[#CEFD2F] selection:text-black pb-20">
      {/* Sidebar - Brand Minimalist */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[#DCDCD3] p-6 hidden lg:flex flex-col z-10">
        <div className="flex items-center gap-2 mb-10 px-2">
          <RampLogo className="text-black" />
        </div>
        <nav className="flex-1 space-y-1">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-black text-black bg-[#E8E8E1] rounded-xl"><LayoutDashboard className="w-4 h-4" /> Dashboard</button>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-black text-gray-500 hover:bg-[#F0F0E8] rounded-xl transition-colors"><Wallet className="w-4 h-4" /> Wallets</button>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-black text-gray-500 hover:bg-[#F0F0E8] rounded-xl transition-colors"><CreditCard className="w-4 h-4" /> Cards</button>
          <button className="flex items-center gap-3 w-full px-4 py-3 text-sm font-black text-gray-500 hover:bg-[#F0F0E8] rounded-xl transition-colors"><History className="w-4 h-4" /> Activity</button>
        </nav>
        <div className="mt-auto pt-6 border-t border-[#F0F0E8]">
          <div className="p-5 bg-black text-white rounded-[1.5rem] relative overflow-hidden group">
            <Zap className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black mb-1 opacity-60 uppercase tracking-widest">Ramp Enterprise</p>
            <p className="text-sm mb-4 font-bold leading-snug">Precision OCR analysis for high-volume accounts.</p>
            <button className="w-full py-2 bg-[#CEFD2F] text-black text-xs font-black rounded-lg hover:brightness-110 transition-all">Go Plus</button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 p-8 max-w-[1400px] mx-auto">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-16">
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tightest text-black">Insights.</h1>
            <p className="text-[#6B7280] font-bold text-lg">AI-driven financial orchestration.</p>
          </div>
          <div className="flex flex-col items-end gap-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-[#333333] transition-all text-sm font-black shadow-lg"
              >
                <Upload className="w-4 h-4" /> Upload Document
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt,.pdf" onChange={handleFileUpload} />
              {data && (
                <button 
                  onClick={() => window.print()} 
                  className="flex items-center gap-2 px-6 py-3 border border-[#DCDCD3] bg-white text-black rounded-xl hover:bg-[#F0F0E8] text-sm font-black transition-colors"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              )}
            </div>
          </div>
        </header>

        {error && <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5" /> <span className="text-sm font-black">{error}</span></div>}

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center max-w-lg mx-auto animate-in fade-in">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-black rounded-full animate-ping opacity-5"></div>
              <div className="relative bg-black rounded-full p-8 shadow-2xl">
                <Loader2 className="w-14 h-14 text-[#CEFD2F] animate-spin" />
              </div>
            </div>
            <div className="w-full space-y-8">
              <div className="h-2 w-full bg-[#DCDCD3] rounded-full overflow-hidden">
                <div className="h-full bg-black transition-all duration-1000 ease-in-out" style={{ width: `${((loadingStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}></div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-black">Neural Processing</h2>
                <div className="flex items-center justify-center gap-3 text-[#6B7280] font-black min-h-[24px] uppercase text-[10px] tracking-[0.2em]">
                  <div className="w-2 h-2 rounded-full bg-[#CEFD2F] animate-pulse"></div>
                  <p>{LOADING_STEPS[loadingStepIdx]}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="border border-[#DCDCD3] rounded-[2.5rem] p-32 flex flex-col items-center text-center bg-white shadow-sm transition-all hover:shadow-xl">
            <div className="w-24 h-24 bg-[#E8E8E1] rounded-[2rem] flex items-center justify-center mb-10 shadow-inner">
              <FileText className="w-12 h-12 text-black" />
            </div>
            <h2 className="text-5xl font-black mb-4 text-black tracking-tightest">Ready for analysis.</h2>
            <p className="text-[#6B7280] max-w-sm mb-12 text-xl font-bold leading-tight">
              Upload your BECU, Chase, or custom transaction data to generate your dash.
            </p>
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-12 py-6 bg-[#CEFD2F] text-black rounded-2xl font-black hover:brightness-110 transition-all flex items-center gap-4 group text-2xl shadow-[0_12px_40px_rgba(206,253,47,0.3)]"
            >
              Get Started <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-12 animate-in fade-in duration-1000 slide-in-from-bottom-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Spend" value={`$${Number(data.summary.totalSpend).toLocaleString()}`} change="+12.5%" isPositive={false} />
              <StatCard title="Budget" value={`$${Number(data.summary.totalBudget).toLocaleString()}`} change="-2.1%" isPositive={true} />
              <StatCard title="Burn" value={String(data.summary.burnRate)} change="Calc." isPositive={true} />
              <StatCard title="Lead Cat." value={String(data.summary.topCategory)} change="High" isPositive={false} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card title="Spend Velocity" subtitle="Daily transaction intensity" className="lg:col-span-2">
                <div className="w-full h-[400px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.charts.spendOverTime} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={RAMP_COLORS.black} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={RAMP_COLORS.black} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E1" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280', fontWeight: 800}} minTickGap={40} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280', fontWeight: 800}} tickFormatter={(val) => `$${val}`} dx={-10} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: '#1A1A1A', color: '#FFFFFF', fontWeight: 900 }} cursor={{stroke: '#CEFD2F', strokeWidth: 2}} />
                      <Area type="stepAfter" dataKey="amount" stroke={RAMP_COLORS.black} strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" animationDuration={1500} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Allocation" subtitle="Portfolio by category">
                <div className="w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={data.charts.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="percentage"
                        animationDuration={1500}
                      >
                        {data.charts.categoryDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={RAMP_COLORS.chart[index % RAMP_COLORS.chart.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} contentStyle={{ borderRadius: '16px', background: '#1A1A1A', border: 'none', color: '#FFF' }} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 space-y-4">
                  {data.charts.categoryDistribution.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: RAMP_COLORS.chart[i % RAMP_COLORS.chart.length] }}></div>
                        <span className="text-[#1A1A1A] font-black text-[11px] uppercase tracking-tight group-hover:translate-x-1 transition-transform">{String(item.category)}</span>
                      </div>
                      <span className="font-black text-black tabular-nums text-sm">{Number(item.percentage).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Strategic Intelligence - Brand Full Width Section */}
            <section className="pt-20 space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-black text-[#CEFD2F] rounded-2xl shadow-xl"><Lightbulb className="w-10 h-10" /></div>
                  <div>
                    <h2 className="text-6xl font-black text-black tracking-tightest">Strategy.</h2>
                    <p className="text-xl text-[#6B7280] font-bold">Financial growth vectors optimized by AI.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                {/* Insights Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <History className="w-5 h-5 text-black" />
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-black">Ledger Anomalies</h3>
                  </div>
                  <div className="grid gap-6">
                    {data.insights.map((insight, idx) => (
                      <div key={idx} className="p-8 bg-white border border-[#DCDCD3] rounded-[2rem] shadow-sm hover:shadow-xl transition-all group flex items-start gap-6 border-l-[12px] border-l-black">
                        <div className="w-14 h-14 rounded-2xl bg-[#E8E8E1] flex items-center justify-center flex-shrink-0 group-hover:bg-[#CEFD2F] group-hover:text-black transition-all duration-500">
                          <TrendingUp className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Insight #{idx + 1}</p>
                          <p className="text-xl text-[#1A1A1A] leading-tight font-black tracking-tight">{insight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggestions Column */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <Target className="w-5 h-5 text-black" />
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-black">Strategic Vectors</h3>
                  </div>
                  <div className="grid gap-6">
                    {data.suggestions?.map((suggestion, idx) => (
                      <div key={idx} className="p-8 bg-black text-white rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8">
                           <Zap className={`w-8 h-8 ${suggestion.impact === 'High' ? 'text-[#CEFD2F]' : 'text-gray-600 opacity-20'}`} />
                        </div>
                        <div className="flex flex-col h-full">
                          <div className="flex items-center gap-3 mb-6">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              suggestion.impact === 'High' ? 'bg-[#CEFD2F] text-black' : 'bg-white/10 text-white'
                            }`}>
                              {suggestion.impact} Impact
                            </span>
                          </div>
                          <h4 className="text-3xl font-black mb-4 tracking-tightest leading-none">{suggestion.title}</h4>
                          <p className="text-gray-400 text-lg font-bold leading-snug flex-1">{suggestion.description}</p>
                          <div className="mt-8 flex items-center gap-3 text-sm font-black text-[#CEFD2F] hover:translate-x-2 transition-transform cursor-pointer w-fit uppercase tracking-widest">
                            Execute Protocol <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Brand Action Modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="p-10 bg-white border border-[#DCDCD3] rounded-[2.5rem] flex flex-col justify-between min-h-[220px] shadow-sm hover:-translate-y-2 transition-transform">
                  <div>
                    <ShieldCheck className="w-12 h-12 mb-6 text-black" />
                    <h5 className="font-black text-2xl tracking-tightest">Treasury Lock</h5>
                    <p className="text-sm font-bold text-gray-500 mt-2">Activate real-time leakage detection on all verified accounts.</p>
                  </div>
                  <button className="mt-8 w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#333]">Verify Identity</button>
                </div>
                <div className="p-10 bg-[#CEFD2F] border border-black/10 rounded-[2.5rem] flex flex-col justify-between min-h-[220px] shadow-sm hover:-translate-y-2 transition-transform">
                  <div>
                    <Zap className="w-12 h-12 mb-6 text-black" />
                    <h5 className="font-black text-2xl tracking-tightest">Liquidity Flow</h5>
                    <p className="text-sm font-bold text-black/60 mt-2">Rebalance idle assets into high-yield corporate ladders automatically.</p>
                  </div>
                  <button className="mt-8 w-full py-4 bg-black text-[#CEFD2F] text-xs font-black uppercase tracking-widest rounded-xl">Optimize Yield</button>
                </div>
                <div className="p-10 bg-white border border-[#DCDCD3] rounded-[2.5rem] flex flex-col justify-between min-h-[220px] shadow-sm hover:-translate-y-2 transition-transform">
                  <div>
                    <Target className="w-12 h-12 mb-6 text-black" />
                    <h5 className="font-black text-2xl tracking-tightest">Unified Feed</h5>
                    <p className="text-sm font-bold text-gray-500 mt-2">Connect external banking APIs for a holistic wealth overview.</p>
                  </div>
                  <button className="mt-8 w-full py-4 border border-black text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#F0F0E8]">Add Account</button>
                </div>
              </div>
            </section>

            <footer className="mt-32 pt-16 border-t border-[#DCDCD3] text-center">
              <div className="flex flex-col items-center gap-10">
                <RampLogo className="text-gray-300 w-32 h-auto" />
                <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                  <span>Privacy Protocol</span>
                  <span>Compliance</span>
                  <span>Security Stack</span>
                </div>
                <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] opacity-40">© Ramp Intelligence Lab 2025</p>
              </div>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
