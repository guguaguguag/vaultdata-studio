// ... (之前的 Imports 保持不变)
import React, { useState, useMemo } from 'react';
import { 
  Lock, Copy, Trash2, FileText, ArrowRightLeft, 
  ShieldCheck, Check, Sparkles, ChevronDown, ChevronRight, 
  Download, Github, Coffee, UploadCloud, Shield, Cpu, RefreshCw,
  HelpCircle, X
} from 'lucide-react';

// ... (JsonTreeNode 组件代码保持不变，此处省略，直接从下方继续)

export default function VaultDataStudio() {
  // ... (之前的 states 和 Logic 保持不变)
  // ... (state, useMemo, Handlers 等逻辑全部保持不变)

  return (
    <div className="min-h-screen lg:h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col overflow-x-hidden">
      
      {/* 1. Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur px-4 lg:px-6 py-2.5 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-[#38bdf8]">
            <Lock size={15} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm lg:text-base tracking-tight text-white">
              VaultData <span className="text-[#38bdf8]">Studio</span>
            </span>
          </div>
        </div>

        {/* 顶部安全徽章 */}
        <button 
          onClick={() => setShowInfoModal(true)}
          className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] lg:text-xs font-medium transition cursor-pointer"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">🔒 Zero Data Leakage</span>
          <span className="sm:hidden">🔒 Secure</span>
        </button>

        {/* 右侧 */}
        <div className="flex items-center gap-2">
           <a href="https://github.com" target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition">
            <Github size={16} />
          </a>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <main className="flex-1 p-3 lg:p-4 flex flex-col gap-3 min-h-0 max-w-[1800px] w-full mx-auto">
        
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0 bg-slate-900/40 p-1.5 rounded-xl border border-slate-800/60">
          {/* Tabs 代码保持不变... */}
          {/* Action Tools 代码保持不变... */}
        </div>

        {/* Input/Output Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
          
          {/* Left: Input Editor */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col bg-slate-900/50 rounded-xl border transition-all overflow-hidden h-64 lg:h-auto ${
              isDragging ? 'border-sky-400 bg-sky-950/40' : 'border-slate-800/80 focus-within:border-slate-700'
            }`}
          >
            <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
               <span className="flex items-center gap-1.5 text-emerald-400">
                <Shield size={11} /> DATA STAYS LOCAL
              </span>
              <span>{inputData.length.toLocaleString()} chars</span>
            </div>

            <div className="relative flex-1 min-h-0">
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                // 占位符也增加安全承诺
                placeholder="Paste JSON or drag file here. No data ever leaves this browser window."
                className="w-full h-full bg-transparent p-3 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none leading-relaxed relative z-10"
              />

              {!inputData && (
                <label className="absolute inset-0 z-0 flex flex-col items-center justify-center text-slate-600 gap-2 p-4 text-center cursor-pointer hover:bg-slate-800/20 transition">
                  <UploadCloud size={28} className={isDragging ? 'text-sky-400' : 'opacity-40'} />
                  <span className="text-xs text-slate-400">
                    {isDragging ? 'Drop file to open' : 'Drag file here (Locally read, no upload)'}
                  </span>
                  <input type="file" accept=".json,.txt,.log,.csv" onChange={handleFileInputChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Right: Output Preview (代码保持不变...) */}
        </div>
      </main>

      {/* 3. Modal 弹窗（重点优化文案） */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-lg w-full relative shadow-2xl">
            <button onClick={() => setShowInfoModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"><X size={18} /></button>
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              🛡️ How is my data protected?
            </h2>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-sky-400 mb-1 flex items-center gap-1">
                  <Lock size={13} /> Your file never leaves your browser
                </h3>
                <p className="text-slate-400">We have no server. We cannot leak what we do not have access to. Your data remains in your computer's RAM/memory only.</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h3 className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                  <Shield size={13} /> 100% Offline Processing
                </h3>
                <p className="text-slate-400">You can disconnect from the internet after loading this page. All formatting and masking happens inside this browser window.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Footer 代码保持不变... */}
    </div>
  );
}
