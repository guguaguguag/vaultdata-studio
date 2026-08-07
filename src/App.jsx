import React, { useState, useMemo } from 'react';
import { 
  Lock, Copy, Trash2, FileText, ArrowRightLeft, 
  ShieldCheck, Check, Sparkles, ChevronDown, ChevronRight, 
  Download, Github, Coffee, UploadCloud, Shield, Cpu, RefreshCw
} from 'lucide-react';

// --- Sub-component: JSON Tree View ---
const JsonTreeNode = ({ data, keyName, isLast = true }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);

  if (!isObject) {
    let valueColor = 'text-amber-400';
    if (typeof data === 'number') valueColor = 'text-sky-400';
    if (typeof data === 'boolean') valueColor = 'text-purple-400';
    if (data === null) valueColor = 'text-rose-400';

    return (
      <div className="pl-4 py-0.5 font-mono text-xs leading-relaxed hover:bg-slate-800/40 rounded transition-colors">
        {keyName && <span className="text-slate-400">"{keyName}": </span>}
        <span className={valueColor}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  const keys = Object.keys(data);
  const isEmpty = keys.length === 0;

  return (
    <div className="pl-4 py-0.5 font-mono text-xs leading-relaxed">
      <div 
        className="flex items-center gap-1 cursor-pointer select-none text-slate-300 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {!isEmpty && (
          <span className="text-slate-500 hover:text-slate-300">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {keyName && <span className="text-slate-400">"{keyName}": </span>}
        <span>{isArray ? '[' : '{'}</span>
        {!isOpen && (
          <span className="text-slate-500 text-[10px] px-1 bg-slate-800/60 rounded border border-slate-700/50">
            {keys.length} {keys.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {isOpen && !isEmpty && (
        <div className="border-l border-slate-800/80 ml-2 pl-1">
          {keys.map((k, index) => (
            <JsonTreeNode 
              key={k} 
              keyName={isArray ? null : k} 
              data={data[k]} 
              isLast={index === keys.length - 1} 
            />
          ))}
        </div>
      )}

      {isOpen && (
        <div className="text-slate-300">
          {isArray ? ']' : '}'}
          {!isLast && <span className="text-slate-500">,</span>}
        </div>
      )}
    </div>
  );
};

export default function VaultDataStudio() {
  const [activeTab, setActiveTab] = useState('beautifier');
  const [inputData, setInputData] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('code');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- Sample JSON Data ---
  const sampleJson = JSON.stringify({
    session_id: "sess_99823a41b",
    user_profile: {
      full_name: "Sarah Connor",
      email: "s.connor@cyberdyne.io",
      phone: "+1 (555) 019-2834",
      ssn: "123-45-6789",
      ip_address: "192.168.1.105"
    },
    billing: {
      credit_card: "4532-7182-9901-3411",
      billing_address: "100 Wilshire Blvd, Los Angeles, CA"
    },
    permissions: ["admin", "auditor"],
    is_active: true
  }, null, 2);

  // --- Logic Processing ---
  const formattedJson = useMemo(() => {
    if (!inputData.trim()) {
      setErrorMsg(null);
      return '';
    }
    try {
      const parsed = JSON.parse(inputData);
      setErrorMsg(null);
      return JSON.stringify(parsed, null, 2);
    } catch (err) {
      setErrorMsg(err.message);
      return null;
    }
  }, [inputData]);

  const parsedJsonObject = useMemo(() => {
    if (activeTab === 'beautifier' && formattedJson) {
      try { return JSON.parse(inputData); } catch (e) { return null; }
    }
    return null;
  }, [inputData, formattedJson, activeTab]);

  const csvResult = useMemo(() => {
    if (activeTab !== 'converter' || !inputData.trim()) return '';
    try {
      const parsed = JSON.parse(inputData);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) return '';

      const headers = Array.from(new Set(arr.flatMap(obj => typeof obj === 'object' && obj ? Object.keys(obj) : [])));
      if (headers.length === 0) return 'Invalid JSON structure for CSV conversion';

      const csvRows = [];
      csvRows.push(headers.join(','));

      for (const row of arr) {
        const values = headers.map(header => {
          const val = row[header];
          const escaped = ('' + (val ?? '')).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      setErrorMsg(null);
      return csvRows.join('\n');
    } catch (err) {
      setErrorMsg("Please enter valid JSON or Array of Objects to convert");
      return '';
    }
  }, [inputData, activeTab]);

  const maskedResult = useMemo(() => {
    if (activeTab !== 'masker' || !inputData) return '';

    let result = inputData;

    result = result.replace(/"(full_name|name|userName|realName|author|owner)"\s*:\s*"([A-Za-z]+(?:\s+[A-Za-z]+)+)"/g, (match, field, name) => {
      const maskedName = name
        .split(' ')
        .map(part => part[0] + '*'.repeat(Math.max(1, part.length - 1)))
        .join(' ');
      return `"${field}": "${maskedName}"`;
    });

    const emailRegex = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    result = result.replace(emailRegex, (match, p1, p2) => {
      const maskedUser = p1.length > 2 ? p1.slice(0, 1) + '***' + p1.slice(-1) : '***';
      return `${maskedUser}@${p2}`;
    });

    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    result = result.replace(ssnRegex, (match) => '***-**-' + match.slice(-4));

    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    result = result.replace(phoneRegex, (match) => match.slice(0, -4).replace(/\d/g, '*') + match.slice(-4));

    const creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    result = result.replace(creditCardRegex, (match) => {
      const clean = match.replace(/\D/g, '');
      if (clean.length < 13) return match;
      return '**** **** **** ' + clean.slice(-4);
    });

    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    result = result.replace(ipRegex, (match) => {
      const parts = match.split('.');
      return `${parts[0]}.${parts[1]}.x.x`;
    });

    return result;
  }, [inputData, activeTab]);

  // --- Handlers ---
  const handleCopy = () => {
    let textToCopy = '';
    if (activeTab === 'beautifier') textToCopy = formattedJson || inputData;
    if (activeTab === 'converter') textToCopy = csvResult;
    if (activeTab === 'masker') textToCopy = maskedResult;

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setInputData(event.target.result);
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col overflow-hidden">
      
      {/* 1. Header (与支持/Star组件整合) */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur px-6 py-2.5 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-[#38bdf8]">
            <Lock size={15} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base tracking-tight text-white">
              VaultData <span className="text-[#38bdf8]">Studio</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">v1.2.0</span>
          </div>
        </div>

        {/* 顶部中央卖点微提示 */}
        <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Shield size={13} className="text-emerald-400" /> 100% Client-Side Engine</span>
          <span className="flex items-center gap-1.5"><Cpu size={13} className="text-sky-400" /> Zero Server Latency</span>
          <span className="flex items-center gap-1.5"><RefreshCw size={13} className="text-purple-400" /> GDPR PII Compliant</span>
        </div>

        {/* 右侧外链/变现组合 */}
        <div className="flex items-center gap-2">
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-md transition font-medium"
          >
            <Coffee size={13} />
            <span className="hidden sm:inline">Buy me a coffee</span>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
            title="View Source on GitHub"
          >
            <Github size={16} />
          </a>
        </div>
      </header>

      {/* 2. Main Workspace Container */}
      <main className="flex-1 p-4 flex flex-col gap-3 min-h-0 max-w-[1800px] w-full mx-auto">
        
        {/* Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800/60">
          
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('beautifier')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'beautifier' 
                  ? 'bg-slate-800 text-[#38bdf8] shadow-sm border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={14} /> JSON Beautifier
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'converter' 
                  ? 'bg-slate-800 text-[#38bdf8] shadow-sm border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft size={14} /> JSON ↔ CSV
            </button>
            <button
              onClick={() => setActiveTab('masker')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'masker' 
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Smart PII Masker</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">PRO</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setInputData(sampleJson)}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-[#38bdf8] px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>Load Sample</span>
            </button>
            <button
              onClick={() => { setInputData(''); setErrorMsg(null); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#38bdf8] hover:bg-sky-400 text-slate-950 px-4 py-1.5 rounded-lg transition shadow-md shadow-sky-950/20"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy Result'}
            </button>
          </div>
        </div>

        {/* Input/Output Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          
          {/* Left: Input Editor */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col bg-slate-900/50 rounded-xl border transition-all overflow-hidden ${
              isDragging ? 'border-sky-400 bg-sky-950/20 ring-2 ring-sky-400/20' : 'border-slate-800/80 focus-within:border-slate-700'
            }`}
          >
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-500"></span> INPUT
              </span>
              <span>{inputData.length.toLocaleString()} chars</span>
            </div>

            <div className="relative flex-1 min-h-0">
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Paste raw JSON or text here, or drag & drop a file..."
                className="w-full h-full bg-transparent p-4 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
              />
              {!inputData && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-600 gap-2">
                  <UploadCloud size={28} className="opacity-40" />
                  <span className="text-xs">Drag and drop a file, or paste raw data</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Output Preview */}
          <div className="flex flex-col bg-slate-900/50 rounded-xl border border-slate-800/80 overflow-hidden">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> PREVIEW
              </span>

              {activeTab === 'beautifier' && formattedJson && (
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
                  <button
                    onClick={() => setViewMode('code')}
                    className={`px-2 py-0.5 rounded text-[11px] ${viewMode === 'code' ? 'bg-slate-800 text-sky-400 font-medium' : 'text-slate-500'}`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`px-2 py-0.5 rounded text-[11px] ${viewMode === 'tree' ? 'bg-slate-800 text-sky-400 font-medium' : 'text-slate-500'}`}
                  >
                    Tree
                  </button>
                </div>
              )}

              {activeTab === 'converter' && csvResult && (
                <button
                  onClick={() => {
                    const blob = new Blob([csvResult], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'export_data.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 text-xs transition"
                >
                  <Download size={12} /> Download .CSV
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs min-h-0">
              {errorMsg && (
                <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs flex items-center gap-2">
                  <span>⚠️ Syntax Error:</span> {errorMsg}
                </div>
              )}

              {!errorMsg && !inputData && (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                  Output will update automatically...
                </div>
              )}

              {activeTab === 'beautifier' && !errorMsg && formattedJson && (
                viewMode === 'code' ? (
                  <pre className="text-sky-300/90 leading-relaxed whitespace-pre-wrap">{formattedJson}</pre>
                ) : (
                  <JsonTreeNode data={parsedJsonObject} />
                )
              )}

              {activeTab === 'converter' && !errorMsg && (
                <pre className="text-emerald-300/90 leading-relaxed whitespace-pre">{csvResult}</pre>
              )}

              {activeTab === 'masker' && inputData && (
                <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap">{maskedResult}</pre>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. Bottom Status Bar */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 px-6 py-2 text-center text-[11px] text-slate-500 flex items-center justify-between shrink-0 font-mono">
        <span>VaultData Studio</span>
        <span>Built for GDPR/CCPA Privacy Compliance</span>
        <span>Client-Side Local V8 Engine</span>
      </footer>
    </div>
  );
}
