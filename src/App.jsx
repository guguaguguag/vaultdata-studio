import React, { useState, useMemo } from 'react';

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
      <div className="pl-4 py-0.5 font-mono text-xs leading-relaxed hover:bg-slate-800/40 rounded transition-colors break-all">
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
            {isOpen ? '▼' : '▶'}
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
  const [showInfoModal, setShowInfoModal] = useState(false);

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

      // 递归展平（Flatten）嵌套对象与数组优化
      const flattenObject = (obj, prefix = '') => {
        return Object.keys(obj).reduce((acc, k) => {
          const pre = prefix.length ? prefix + '.' : '';
          const val = obj[k];

          if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
            Object.assign(acc, flattenObject(val, pre + k));
          } else if (Array.isArray(val)) {
            const isPrimitiveArray = val.every(item => typeof item !== 'object' || item === null);
            acc[pre + k] = isPrimitiveArray ? val.join('; ') : JSON.stringify(val);
          } else {
            acc[pre + k] = val;
          }
          return acc;
        }, {});
      };

      const flattenedArr = arr.map(item => typeof item === 'object' && item !== null ? flattenObject(item) : { value: item });

      const headers = Array.from(new Set(flattenedArr.flatMap(obj => Object.keys(obj))));
      if (headers.length === 0) return 'Invalid JSON structure for CSV conversion';

      const csvRows = [];
      csvRows.push(headers.map(h => `"${h}"`).join(','));

      for (const row of flattenedArr) {
        const values = headers.map(header => {
          const val = row[header];
          const escaped = ('' + (val ?? '')).replace(/"/g, '""');
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

  // --- Feature 3: Smart PII Masking ---
  const maskedResult = useMemo(() => {
    if (activeTab !== 'masker' || !inputData) return '';

    let result = inputData;

    // 1. English Full Names
    result = result.replace(/"(full_name|name|userName|realName|author|owner)"\s*:\s*"([A-Za-z]+(?:\s+[A-Za-z]+)+)"/g, (match, field, name) => {
      const maskedName = name
        .split(' ')
        .map(part => part[0] + '*'.repeat(Math.max(1, part.length - 1)))
        .join(' ');
      return `"${field}": "${maskedName}"`;
    });

    // 2. Email Addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    result = result.replace(emailRegex, (match, p1, p2) => {
      const maskedUser = p1.length > 2 ? p1.slice(0, 1) + '***' + p1.slice(-1) : '***';
      return `${maskedUser}@${p2}`;
    });

    // 3. US Social Security Numbers (SSN)
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    result = result.replace(ssnRegex, (match) => '***-**-' + match.slice(-4));

    // 4. Phone Numbers
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    result = result.replace(phoneRegex, (match) => match.slice(0, -4).replace(/\d/g, '*') + match.slice(-4));

    // 5. Credit Cards
    const creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    result = result.replace(creditCardRegex, (match) => {
      const clean = match.replace(/\D/g, '');
      if (clean.length < 13) return match;
      return '**** **** **** ' + clean.slice(-4);
    });

    // 6. IP Addresses
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

  // --- Drag & Drop / Local File Readers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputData(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setInputData(event.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col overflow-x-hidden">
      
      {/* 1. Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur px-4 lg:px-6 py-2.5 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-[#38bdf8] font-bold text-xs">
            🔒
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm lg:text-base tracking-tight text-white">
              VaultData <span className="text-[#38bdf8]">Studio</span>
            </span>
          </div>
        </div>

        <button 
          onClick={() => setShowInfoModal(true)}
          className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] lg:text-xs font-medium transition cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">🔒 Zero Data Leakage Guarantee</span>
          <span className="sm:hidden">🔒 Zero Leakage</span>
          <span className="text-xs">❓</span>
        </button>

        <div className="flex items-center gap-2">
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-md transition font-medium"
          >
            <span>☕</span>
            <span className="hidden sm:inline">Buy me a coffee</span>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition font-bold text-xs"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* 2. Main Workspace Container */}
      <main className="flex-1 p-3 lg:p-4 flex flex-col gap-3 min-h-0 max-w-[1800px] w-full mx-auto">
        
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800/60">
          
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('beautifier')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'beautifier' 
                  ? 'bg-slate-800 text-[#38bdf8] shadow-sm border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📄 Beautifier
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'converter' 
                  ? 'bg-slate-800 text-[#38bdf8] shadow-sm border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔄 JSON ↔ CSV
            </button>
            <button
              onClick={() => setActiveTab('masker')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'masker' 
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛡️ PII Masker
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setInputData(sampleJson)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-xs text-slate-300 hover:text-[#38bdf8] px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 transition"
            >
              ✨ Sample
            </button>
            <button
              onClick={() => { setInputData(''); setErrorMsg(null); }}
              className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 transition"
            >
              🗑️ Clear
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 text-xs font-semibold bg-[#38bdf8] hover:bg-sky-400 text-slate-950 px-3.5 py-1.5 rounded-lg transition shadow-md"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* Input/Output Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
          
          {/* Left: Input Editor */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col bg-slate-900/50 rounded-xl border transition-all overflow-hidden h-64 lg:h-auto ${
              isDragging ? 'border-sky-400 bg-sky-950/40 ring-2 ring-sky-400/40 scale-[0.99]' : 'border-slate-800/80 focus-within:border-slate-700'
            }`}
          >
            <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono shrink-0">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                🛡️ DATA STAYS LOCAL
              </span>
              <span className="text-slate-400">{inputData.length.toLocaleString()} chars</span>
            </div>

            <div className="relative flex-1 min-h-0">
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="Paste JSON or text here. No data ever leaves this browser window."
                className="w-full h-full bg-transparent p-3 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed relative z-10"
              />

              {!inputData && (
                <label className="absolute inset-0 z-0 flex flex-col items-center justify-center text-slate-600 gap-2 p-4 text-center cursor-pointer hover:bg-slate-800/20 transition">
                  <span className="text-2xl opacity-50">📁</span>
                  <span className="text-xs text-slate-400">
                    {isDragging ? 'Drop file to open locally' : 'Drag file here to open locally (No server upload)'}
                  </span>
                  <input 
                    type="file" 
                    accept=".json,.txt,.log,.csv" 
                    onChange={handleFileInputChange} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>
          </div>

          {/* Right: Output Preview */}
          <div className="flex flex-col bg-slate-900/50 rounded-xl border border-slate-800/80 overflow-hidden h-64 lg:h-auto">
            <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> PREVIEW
              </span>

              {activeTab === 'beautifier' && formattedJson && (
                <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800">
                  <button
                    onClick={() => setViewMode('code')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${viewMode === 'code' ? 'bg-slate-800 text-sky-400 font-medium' : 'text-slate-500'}`}
                  >
                    Code
                  </button>
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${viewMode === 'tree' ? 'bg-slate-800 text-sky-400 font-medium' : 'text-slate-500'}`}
                  >
                    Tree
                  </button>
                </div>
              )}

              {activeTab === 'converter' && csvResult && (
                <button
                  onClick={() => {
                    // 关键修复：加入 '\uFEFF' UTF-8 BOM 头彻底解决 Excel 中文乱码问题
                    const blob = new Blob(['\uFEFF' + csvResult], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'export_data.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-1 text-sky-400 text-[11px] hover:text-sky-300 transition"
                >
                  📥 Export CSV
                </button>
              )}
            </div>

            <div className="flex-1 p-3 overflow-auto font-mono text-xs min-h-0">
              {errorMsg && (
                <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded text-[11px]">
                  ⚠️ Error: {errorMsg}
                </div>
              )}

              {!errorMsg && !inputData && (
                <div className="h-full flex items-center justify-center text-slate-600 text-[11px]">
                  Output will appear here...
                </div>
              )}

              {activeTab === 'beautifier' && !errorMsg && formattedJson && (
                viewMode === 'code' ? (
                  <pre className="text-sky-300/90 leading-relaxed whitespace-pre-wrap break-all">{formattedJson}</pre>
                ) : (
                  <JsonTreeNode data={parsedJsonObject} />
                )
              )}

              {activeTab === 'converter' && !errorMsg && (
                <pre className="text-emerald-300/90 leading-relaxed whitespace-pre overflow-x-auto">{csvResult}</pre>
              )}

              {activeTab === 'masker' && inputData && (
                <pre className="text-slate-300 leading-relaxed whitespace-pre-wrap break-all">{maskedResult}</pre>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. Modal 弹窗 */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-lg w-full relative shadow-2xl">
            <button 
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              ✕
            </button>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              🛡️ Zero Data Leakage Guarantee
            </h2>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-sky-400 mb-1 flex items-center gap-1">
                  🔒 Your file never leaves your browser
                </h3>
                <p className="text-slate-400">We have no backend server. We cannot leak what we do not have access to. Your data remains in your computer's RAM/memory only.</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  ⚡ 100% Offline Processing
                </h3>
                <p className="text-slate-400">You can turn off your Wi-Fi after loading this page. All formatting and masking happens inside this browser window.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 px-4 py-2 text-center text-[10px] text-slate-500 shrink-0 font-mono">
        VaultData Studio • 100% Client-Side Local Engine • No Server Requests
      </footer>
    </div>
  );
}
