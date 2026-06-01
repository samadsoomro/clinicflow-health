import { Heart } from 'lucide-react';

const ClinicLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      
      {/* Animated heartbeat icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <Heart
            size={36}
            className="text-red-500 animate-pulse"
            fill="currentColor"
          />
        </div>
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/10 animate-ping opacity-40" />
      </div>

      {/* ECG / pulse line animation */}
      <div className="mb-6 w-48 h-8 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 200 40" className="w-full" xmlns="http://www.w3.org/2000/svg">
          <polyline
            points="0,20 30,20 40,5 50,35 60,20 80,20 90,10 100,30 110,20 140,20 150,8 160,32 170,20 200,20"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Loading text */}
      <p className="text-gray-400 dark:text-gray-500 text-sm font-medium tracking-wide animate-pulse">
        Loading...
      </p>
    </div>
  );
};

export default ClinicLoadingScreen;
