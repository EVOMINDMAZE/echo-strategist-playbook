
export const ThinkingAnimation = () => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-slate-600">Echo is thinking</span>
      <div className="flex space-x-1">
        <div 
          className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"
          style={{ animationDelay: '0ms', animationDuration: '1000ms' }}
        />
        <div 
          className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"
          style={{ animationDelay: '200ms', animationDuration: '1000ms' }}
        />
        <div 
          className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"
          style={{ animationDelay: '400ms', animationDuration: '1000ms' }}
        />
      </div>
    </div>
  );
};
