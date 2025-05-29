import React, { useEffect, useRef } from 'react';

interface MarkdownInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  className?: string;
}

export const MarkdownInput: React.FC<MarkdownInputProps> = ({ label, id, value, className = '', ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const baseMinHeight = props.rows ? props.rows * 20 : 60; // Approx 20px per row
      textareaRef.current.style.height = `${Math.max(scrollHeight, baseMinHeight)}px`;
    }
  }, [value, props.rows]);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-600 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        className={`w-full p-3 border border-neutral-300 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-neutral-800 placeholder:text-neutral-400 overflow-y-hidden selection:bg-sky-200 selection:text-sky-700 ${className}`}
        style={{ minHeight: props.rows ? `${props.rows * 20}px` : '60px' }}
        {...props}
      />
    </div>
  );
};