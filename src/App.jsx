import React, { useState, useMemo } from 'react';
import { 
  Lock, Copy, Trash2, FileText, ArrowRightLeft, 
  ShieldCheck, Check, Sparkles, ChevronDown, ChevronRight, Download
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
      <div className="pl-4 py-0.5 font-mono text-sm leading-relaxed hover:bg-slate-800/40 rounded">
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
    <div className="pl-4 py-0.5 font-mono text-sm leading-relaxed">
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
          <span className="text-slate-500 text-xs px-1">
            ... {keys.length} items ... {isArray ? ']' : '}'}
          </span>
        )}
      </div>

      {isOpen && !isEmpty && (
        <div className="border-l border-slate-800 ml-2 pl-1">
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
  const [activeTab, setActiveTab] = useState('beautifier'); // 'beautifier' | 'converter' | 'masker'
  const [inputData, setInputData] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('code'); // 'code' | 'tree'
  const [errorMsg, setErrorMsg] = useState(null);

  // --- Sample JSON Data tailored for US/EU Standard PII ---
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

  // --- Feature 1: JSON Formatting ---
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

  // --- Feature 2: JSON to CSV Conversion ---
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

  // --- Feature 3: Western PII Redaction Logic ---
  const maskedResult = useMemo(() => {
    if (activeTab !== 'masker' || !inputData) return '';

    let result = inputData;

    // 1. English Full Names ("full_name", "name", "author" etc. -> "Sarah Connor" -> "S**** C*****")
    result = result.replace(/"(full_name|name|userName|realName|author|owner)"\s*:\s*"([A-Za-z]+(?:\s+[A-Za-z]+)+)"/g, (match, field, name) => {
      const maskedName = name
        .split(' ')
        .map(part => part[0] + '*'.repeat(Math.max(1, part.length - 1)))
        .join(' ');
      return `"${field}": "${maskedName}"`;
    });

    // 2. Email Addresses ("s.connor@cyberdyne.io" -> "s***r@cyberdyne.io")
    const emailRegex = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    result = result.replace(emailRegex, (match, p1, p2) => {
      const maskedUser = p1.length > 2 ? p1.slice(0, 1) + '***' + p1.slice(-1) : '***';
      return `${maskedUser}@${p2}`;
    });

    // 3. US Social Security Numbers (SSN: 123-45-6789 -> ***-**-6789)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    result = result.replace(ssnRegex, (match) => {
      return '***-**-' + match.slice(-4);
    });

    // 4. Phone Numbers (US/EU Formats: +1 (555) 019-2834 -> +1 (555) ***-2834)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    result = result.replace(phoneRegex, (match) => {
      return match.slice(0, -4).replace(/\d/g, '*') + match.slice(-4);
    });

    // 5. Credit Cards (PCI-DSS Standard: Keep last 4 digits)
    const creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    result = result.replace(creditCardRegex, (match) => {
      const clean = match.replace(/\D/g, '');
      if (clean.length < 13) return match;
      return '**** **** **** ' + clean.slice(-4);
    });

    // 6. IP Addresses (192.168.1.105 -> 192.168.x.x)
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

  const handleClear = () => {
    setInputData('');
    setErrorMsg(null);
  };

  const handleDownloadCsv = () => {
    if (!csvResult) return;
    const blob = new Blob([csvResult], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'export_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-[#38bdf8]">
            <Lock size={18} />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            VaultData <span className="text-[#38bdf8]">Studio</span>
          </span>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          🔒 100% Private & Local
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('beautifier')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'beautifier' 
                  ? 'bg-slate-800 text-[#38bdf8] shadow-sm border border-slate-700/50' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText size={16} /> JSON Beautifier
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'converter' 
                  ? 'bg-slate-800 text-[#38bdf8] shadow-sm border border-slate-700/50' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft size={16} /> JSON ↔ CSV
            </button>
            <button
              onClick={() => setActiveTab('masker')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'masker' 
                  ? 'bg-slate-800 text-[#38bdf8] shadow-sm border border-slate-700/50' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck size={16} /> Smart PII Masker
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setInputData(sampleJson)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#38bdf8] px-3 py-1.5 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 transition"
            >
              <Sparkles size={13} /> Load Sample
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 transition"
            >
              <Trash2 size={13} /> Clear
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium bg-[#38bdf8] hover:bg-sky-400 text-slate-950 px-3.5 py-1.5 rounded transition shadow-sm"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy Result'}
            </button>
          </div>
        </div>

        {/* Workspace Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
          
          {/* Input Panel */}
          <div className="flex flex-col bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden">
            <div className="bg-slate-900/60 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>INPUT DATA</span>
              <span>{inputData.length} chars</span>
            </div>
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Paste raw JSON or string here..."
              className="flex-1 w-full bg-transparent p-4 font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Output Panel */}
          <div className="flex flex-col bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden">
            <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>OUTPUT PREVIEW</span>
              
              {activeTab === 'beautifier' && formattedJson && (
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800">
                  <button
                    onClick={() => setViewMode('code')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'code' ? 'bg-slate-800 text-sky-400' : 'text-slate-500'}`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`px-2 py-0.5 rounded ${viewMode === 'tree' ? 'bg-slate-800 text-sky-400' : 'text-slate-500'}`}
                  >
                    Tree
                  </button>
                </div>
              )}

              {activeTab === 'converter' && csvResult && (
                <button
                  onClick={handleDownloadCsv}
                  className="flex items-center gap-1 text-sky-400 hover:underline"
                >
                  <Download size={12} /> Download .CSV
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-sm">
              {errorMsg && (
                <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded text-xs">
                  ⚠️ Error: {errorMsg}
                </div>
              )}

              {!errorMsg && !inputData && (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                  Enter data on the left to see live output...
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

      <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        VaultData Studio • 100% Client-Side Processing • No Server Requests
      </footer>
    </div>
  );
}
