import React from 'react';

const SpeechGestureToggle = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center 
        w-24 h-24 
        rounded-full 
        bg-[#88c4ff] text-white
        border-4 border-white 
        hover:bg-[#6fb7ff]
        focus:outline-none focus:ring-0 focus:ring-blue-0 focus:ring-opacity-0
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default SpeechGestureToggle;