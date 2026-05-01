import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B1220] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-950 via-gray-900 to-[#0B1220] flex items-center justify-center p-4 font-mono relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-30"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bubble w-2 h-2 bg-emerald-500/20" style={{ left: '20%', animationDuration: '8s' }}></div>
        <div className="bubble w-1 h-1 bg-cyan-500/20" style={{ left: '60%', animationDuration: '12s', animationDelay: '2s' }}></div>
        <div className="bubble w-1.5 h-1.5 bg-indigo-500/20" style={{ left: '85%', animationDuration: '10s', animationDelay: '4s' }}></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Main Terminal-like Card */}
        <div className="bg-gray-950/80 backdrop-blur-xl border border-gray-800 rounded-none relative">
         

          {/* Content Area */}
          <div className="p-8 md:p-12 relative">
            {/* 404 Display */}
            <div className="text-center mb-10">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                <span className="relative text-[120px] md:text-[160px] font-black text-emerald-500/30 tracking-widest">
                  404
                </span>
              </div>
            </div>

            {/* Warning Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center mb-10">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wider">
                LOCATION NOT FOUND
              </h1>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto mb-6"></div>
              <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                The requested resource could not be located.<br />
               </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <button
                onClick={() => navigate(-1)}
                className="group flex items-center justify-center gap-2 px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-emerald-500/50 text-gray-300 hover:text-emerald-400 font-medium rounded-none transition-all duration-200 relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors"></span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="relative z-10">NAVIGATE BACK</span>
              </button>

              <button
                onClick={() => navigate('/auth')}
                className="group flex items-center justify-center gap-2 px-8 py-3 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-500/50 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 font-medium rounded-none transition-all duration-200 relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/10 transition-colors"></span>
                <Home className="w-4 h-4" />
                <span className="relative z-10">RETURN TO HUB</span>
              </button>
            </div>

            
          </div>
        </div>

        {/* Additional quick links
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs mb-3">QUICK ACCESS</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm font-medium transition-colors hover:underline">
              System Manual
            </a>
            <span className="text-gray-600">/</span>
            <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm font-medium transition-colors hover:underline">
              Support Ticket
            </a>
            <span className="text-gray-600">/</span>
            <a href="#" className="text-gray-400 hover:text-emerald-400 text-sm font-medium transition-colors hover:underline">
              API Status
            </a>
          </div>
        </div> */}
      </div>

      <style>{`
        @keyframes bubble-rise {
          from {
            bottom: -30px;
            opacity: 0;
          }
          25% {
            opacity: 0.7;
          }
          95% {
            opacity: 0.4;
          }
          to {
            bottom: 105%;
            opacity: 0;
          }
        }
        .bubble {
          position: absolute;
          background-color: rgba(16, 185, 129, 0.25);
          border-radius: 50%;
          animation: bubble-rise linear infinite;
          transform: translateX(-50%);
        }
      `}</style>
    </div>
  );
};

export default NotFound;