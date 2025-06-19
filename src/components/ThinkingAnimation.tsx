
export const ThinkingAnimation = () => {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-muted-foreground font-medium">Echo is analyzing</span>
      <div className="flex space-x-1">
        <div 
          className="w-2 h-2 bg-primary/70 rounded-full animate-thinking-wave"
          style={{ animationDelay: '0ms' }}
        />
        <div 
          className="w-2 h-2 bg-primary/70 rounded-full animate-thinking-wave"
          style={{ animationDelay: '200ms' }}
        />
        <div 
          className="w-2 h-2 bg-primary/70 rounded-full animate-thinking-wave"
          style={{ animationDelay: '400ms' }}
        />
      </div>
    </div>
  );
};
