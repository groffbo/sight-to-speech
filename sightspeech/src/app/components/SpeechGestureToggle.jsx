import React from 'react';

const SpeechGestureToggle = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center 
        w-24 h-24 
        rounded-full 
        bg-blue-500 text-white 
        hover:bg-blue-600 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default SpeechGestureToggle;