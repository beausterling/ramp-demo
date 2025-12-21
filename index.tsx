
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
  Zap,
  ShoppingBag
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

// --- Brand Palette ---
const RAMP_COLORS = {
  bg: '#E8E8E1',      
  black: '#1A1A1A',   
  neon: '#CEFD2F',    
  white: '#FFFFFF',
  gray100: '#DCDCD3', 
  gray500: '#6B7280',
  chart: ['#1A1A1A', '#374151', '#4B5563', '#6B7280', '#CEFD2F'] 
};

const LOADING_STEPS = [
  "Ingesting document data...",
  "OCR: Extracting ledger balances...",
  "Cross-referencing high-volume vendors...",
  "Detecting spending anomalies...",
  "Calculating ROI-driven distributions...",
  "Synthesizing high-impact savings strategies...",
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
  suggestions: { title: string; description: string; impact: 'High' | 'Medium' | 'Low'; potentialSavings: number }[];
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
      
      const prompt = `Analyze this financial statement with the mindset of a Ramp CFO. Ramp values frugality, significant cost savings, and executive efficiency.

        PRIORITIZATION RULES:
        1. 'Impact' is strictly based on ROI. A $1400 expense at a vendor like Walmart is "High Impact", whereas a one-off $30 NSF fee is "Low Impact".
        2. Suggestions MUST target the largest spend areas. If a user spends thousands at one vendor, suggest bulk consolidation, contract negotiation, or alternate sourcing.
        3. 'Insights' should detect patterns (e.g., "Frequent high-value grocery runs" or "Rising recurring SaaS costs").
        4. Ensure 'categoryDistribution' percentage fields are accurate and based on TOTAL spend volume.

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
          "suggestions": [{ "title": string, "description": string, "impact": "High" | "Medium" | "Low", "potentialSavings": number }]
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
          thinkingConfig: { thinkingBudget: 4000 } // Increased thinking budget for better prioritization
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
            <h1 className="text-5xl font-black tracking-tightest text-black">CFO Insights.</h1>
            <p className="text-[#6B7280] font-bold text-lg">Optimizing liquidity through strategic frugality.</p>
          </div>
          <div className="flex flex-col items-end gap-6">
            <div className="flex items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-[#333333] transition-all text-sm font-black shadow-lg"><Upload className="w-4 h-4" /> Upload Document</button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt,.pdf" onChange={handleFileUpload} />
              {data && <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 border border-[#DCDCD3] bg-white text-black rounded-xl hover:bg-[#F0F0E8] text-sm font-black transition-colors"><Download className="w-4 h-4" /> Export</button>}
            </div>
          </div>
        </header>

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center max-w-lg mx-auto animate-in fade-in">
            <div className="relative mb-12"><div className="absolute inset-0 bg-black rounded-full animate-ping opacity-5"></div><div className="relative bg-black rounded-full p-8 shadow-2xl"><Loader2 className="w-14 h-14 text-[#CEFD2F] animate-spin" /></div></div>
            <div className="w-full space-y-8">
              <div className="h-2 w-full bg-[#DCDCD3] rounded-full overflow-hidden"><div className="h-full bg-black transition-all duration-1000 ease-in-out" style={{ width: `${((loadingStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}></div></div>
              <div className="space-y-4"><h2 className="text-3xl font-black text-black">Strategic Processing</h2><div className="flex items-center justify-center gap-3 text-[#6B7280] font-black min-h-[24px] uppercase text-[10px] tracking-[0.2em]"><div className="w-2 h-2 rounded-full bg-[#CEFD2F] animate-pulse"></div><p>{LOADING_STEPS[loadingStepIdx]}</p></div></div>
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="border border-[#DCDCD3] rounded-[2.5rem] p-32 flex flex-col items-center text-center bg-white shadow-sm transition-all hover:shadow-xl">
            <div className="w-24 h-24 bg-[#E8E8E1] rounded-[2rem] flex items-center justify-center mb-10 shadow-inner"><FileText className="w-12 h-12 text-black" /></div>
            <h2 className="text-5xl font-black mb-4 text-black tracking-tightest">Ramp Intelligence.</h2>
            <p className="text-[#6B7280] max-w-sm mb-12 text-xl font-bold leading-tight">Identify high-impact savings across your institutional ledger.</p>
            <button onClick={() => fileInputRef.current?.click()} className="px-12 py-6 bg-[#CEFD2F] text-black rounded-2xl font-black hover:brightness-110 transition-all flex items-center gap-4 group text-2xl shadow-[0_12px_40px_rgba(206,253,47,0.3)]">Analyze Data <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" /></button>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-12 animate-in fade-in duration-1000 slide-in-from-bottom-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Gross Outflow" value={`$${Number(data.summary.totalSpend).toLocaleString()}`} change="+12.5%" isPositive={false} />
              <StatCard title="Treasury Allocation" value={`$${Number(data.summary.totalBudget).toLocaleString()}`} change="-2.1%" isPositive={true} />
              <StatCard title="Burn Rate" value={String(data.summary.burnRate)} change="Calc." isPositive={true} />
              <StatCard title="Top Spend Area" value={String(data.summary.topCategory)} change="Volume" isPositive={false} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card title="Spend Intensity" subtitle="High-impact transaction timeline" className="lg:col-span-2">
                <div className="w-full h-[400px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.charts.spendOverTime} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={RAMP_COLORS.black} stopOpacity={0.15}/><stop offset="95%" stopColor={RAMP_COLORS.black} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E1" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280', fontWeight: 800}} minTickGap={40} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280', fontWeight: 800}} tickFormatter={(val) => `$${val}`} dx={-10} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', background: '#1A1A1A', color: '#FFFFFF', fontWeight: 900 }} cursor={{stroke: '#CEFD2F', strokeWidth: 2}} />
                      <Area type="monotone" dataKey="amount" stroke={RAMP_COLORS.black} strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" animationDuration={1500} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Top Vendors" subtitle="Highest volume partners">
                <div className="space-y-6 mt-6">
                  {data.charts.vendorSpend?.map((vendor, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-black uppercase tracking-tight flex items-center gap-2">
                          <ShoppingBag className="w-3 h-3 text-gray-400" />
                          {vendor.vendor}
                        </span>
                        <span className="font-black tabular-nums text-sm">${Number(vendor.amount).toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black transition-all duration-1000" 
                          style={{ width: `${(vendor.amount / data.summary.totalSpend) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {(!data.charts.vendorSpend || data.charts.vendorSpend.length === 0) && (
                    <div className="py-20 text-center opacity-20"><ShoppingBag className="w-12 h-12 mx-auto" /></div>
                  )}
                </div>
              </Card>
            </div>

            <section className="pt-20 space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-black text-[#CEFD2F] rounded-2xl shadow-xl"><Lightbulb className="w-10 h-10" /></div>
                  <div>
                    <h2 className="text-6xl font-black text-black tracking-tightest">Efficiency Protocol.</h2>
                    <p className="text-xl text-[#6B7280] font-bold">Prioritizing high-ROI savings opportunities.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <History className="w-5 h-5 text-black" />
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-black">Pattern Analysis</h3>
                  </div>
                  <div className="grid gap-6">
                    {data.insights.map((insight, idx) => (
                      <div key={idx} className="p-8 bg-white border border-[#DCDCD3] rounded-[2rem] shadow-sm hover:shadow-xl transition-all group flex items-start gap-6 border-l-[12px] border-l-black">
                        <div className="w-14 h-14 rounded-2xl bg-[#E8E8E1] flex items-center justify-center flex-shrink-0 group-hover:bg-[#CEFD2F] group-hover:text-black transition-all duration-500"><TrendingUp className="w-7 h-7" /></div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Observation #{idx + 1}</p>
                          <p className="text-xl text-[#1A1A1A] leading-tight font-black tracking-tight">{insight}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <Target className="w-5 h-5 text-black" />
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-black">Strategic ROI High Impact</h3>
                  </div>
                  <div className="grid gap-6">
                    {data.suggestions?.sort((a, b) => b.potentialSavings - a.potentialSavings).map((suggestion, idx) => (
                      <div key={idx} className={`p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group ${suggestion.impact === 'High' ? 'bg-black text-white' : 'bg-white border border-[#DCDCD3] text-black'}`}>
                        <div className="absolute top-0 right-0 p-8">
                           <Zap className={`w-8 h-8 ${suggestion.impact === 'High' ? 'text-[#CEFD2F]' : 'text-gray-300'}`} />
                        </div>
                        <div className="flex flex-col h-full">
                          <div className="flex items-center gap-3 mb-6">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              suggestion.impact === 'High' ? 'bg-[#CEFD2F] text-black' : 'bg-gray-100 text-black'
                            }`}>
                              {suggestion.impact} Impact
                            </span>
                            {suggestion.potentialSavings > 0 && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#CEFD2F] bg-white/10 px-3 py-1 rounded-full">
                                Est. Save: ${suggestion.potentialSavings.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <h4 className="text-3xl font-black mb-4 tracking-tightest leading-none">{suggestion.title}</h4>
                          <p className={`text-lg font-bold leading-snug flex-1 ${suggestion.impact === 'High' ? 'text-gray-400' : 'text-gray-500'}`}>{suggestion.description}</p>
                          <div className={`mt-8 flex items-center gap-3 text-sm font-black hover:translate-x-2 transition-transform cursor-pointer w-fit uppercase tracking-widest ${suggestion.impact === 'High' ? 'text-[#CEFD2F]' : 'text-black'}`}>
                            Automate Savings <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
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
