import React, { useState } from 'react';
import { generateSystemInsight } from '../../services/geminiService';

const AIIntelligence: React.FC = () => {
  const [aiReport, setAiReport] = useState<string>('');
  const [generatingReport, setGeneratingReport] = useState(false);

  const generateReport = async () => {
    setGeneratingReport(true);
    // In a real app, you would fetch live data here to create the snapshot.
    const systemSnapshot = {
      stations: [],
      activeAlerts: 3,
      revenue: 12450,
      batteries: [],
      recentLogs: [],
    };
    const report = await generateSystemInsight(systemSnapshot);
    setAiReport(report);
    setGeneratingReport(false);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/50 mb-4 border border-indigo-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">RIDERCMS CORTEX AI</h2>
        <p className="text-gray-400 mt-2">Predictive analytics and situational reporting for fleet commanders.</p>
      </div>

      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <h3 className="font-bold text-lg text-white">Daily Situation Report</h3>
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
          >
            {generatingReport ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analyzing...</>
            ) : (
              <>Generate New Report</>
            )}
          </button>
        </div>
        <div className="p-8 min-h-[300px] bg-gray-900/50 text-gray-300 leading-relaxed font-mono text-sm">
          {aiReport ? (
            <div className="prose prose-invert max-w-none">
              {aiReport.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p>No report generated today.</p>
              <p className="text-xs mt-2">Click generate to analyze current system telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIIntelligence;