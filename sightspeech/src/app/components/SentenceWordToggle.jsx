import React, { useState } from 'react';

const SentenceWordToggle = ({ onToggle, className }) => {
  const [useSentences, setUseSentences] = useState(false)

  const handleToggle = () => {
    setUseSentences(!useSentences);
    if (onToggle) {
      onToggle(!useSentences); // Pass the new state to the parent
    }
  };

  return (
    <label className={`flex flex-col justify-center cursor-pointer ${className}`}>
      <span className=" text-gray-700 text-2xl items-center">Use Sentences</span>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only" // Hide the default checkbox visually
          checked={useSentences}
          onChange={handleToggle}
        />
        {/* Background track */}
        <div
          className={`block w-14 h-8 rounded-full transition-colors duration-300 ${
            useSentences ? 'bg-[#6fb7ff]' : 'bg-gray-300'
          }`}
        ></div>
        {/* Toggle circle/thumb */}
        <div
          className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
            useSentences ? 'translate-x-6' : 'translate-x-0'
          }`}
        ></div>
      </div>
    </label>
  );
};

export default SentenceWordToggle;