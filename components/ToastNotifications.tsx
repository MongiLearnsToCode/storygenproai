
import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../types';
import { Button } from './Button';
import { Icon } from './Icon';

interface ToastNotificationsProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const ToastNotifications: React.FC<ToastNotificationsProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timerId: number | undefined;
    let visibilityTimerId: number | undefined;

    if (toast) {
      // Short delay to allow for CSS transition on appearance
      visibilityTimerId = window.setTimeout(() => {
        setIsVisible(true);
      }, 50); 

      if (toast.duration) {
        timerId = window.setTimeout(() => {
          handleClose();
        }, toast.duration);
      }
    } else {
      setIsVisible(false);
    }

    return () => {
      clearTimeout(timerId);
      clearTimeout(visibilityTimerId);
    };
  }, [toast]);

  const handleClose = () => {
    setIsVisible(false);
    // Allow time for fade-out animation before calling onClose
    setTimeout(() => {
      onClose();
    }, 300); // Must match transition duration
  };

  // Undo functionality is removed
  // const handleUndo = () => {
  //   if (toast?.undoAction) {
  //     toast.undoAction();
  //   }
  //   handleClose();
  // };

  if (!toast) {
    return null;
  }

  const typeStyles = {
    success: {
      bg: 'bg-green-500',
      border: 'border-green-600',
      iconBg: 'bg-green-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      iconName: 'Check',
    },
    error: {
      bg: 'bg-red-500',
      border: 'border-red-600',
      iconBg: 'bg-red-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      iconName: 'XMark', 
    },
    info: {
      bg: 'bg-sky-500',
      border: 'border-sky-600',
      iconBg: 'bg-sky-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      iconName: 'Lightbulb', 
    },
    warning: {
      bg: 'bg-amber-500',
      border: 'border-amber-600',
      iconBg: 'bg-amber-600',
      iconColor: 'text-white',
      textColor: 'text-white',
      iconName: 'ExclamationTriangle', 
    },
  };

  const currentStyle = typeStyles[toast.type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`fixed top-5 right-5 sm:top-7 sm:right-7 w-auto max-w-sm sm:max-w-md p-0.5 rounded-lg shadow-2xl z-[2000] transition-all duration-300 ease-in-out
                  ${currentStyle.bg} border ${currentStyle.border}
                  ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
    >
      <div className="flex items-start p-3 sm:p-4">
        <div className={`p-1.5 sm:p-2 mr-2 sm:mr-3 rounded-full ${currentStyle.iconBg}`}>
          <Icon name={currentStyle.iconName} className={`w-4 h-4 sm:w-5 sm:h-5 ${currentStyle.iconColor}`} />
        </div>
        <div className="flex-grow">
          <p className={`text-sm sm:text-base font-medium ${currentStyle.textColor}`}>
            {toast.message}
          </p>
          {/* Undo button removed from here */}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          aria-label="Close notification"
          className={`!p-1 ml-2 sm:ml-3 self-start ${currentStyle.textColor} hover:!bg-white/20 focus:!ring-white/50 rounded-full`}
        >
          <Icon name="XMark" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  );
};