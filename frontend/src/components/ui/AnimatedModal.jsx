import React, { useState, useEffect, useRef } from 'react';

/**
 * AnimatedModal wraps any modal content in a fade-in/fade-out overlay.
 * It delays unmounting so Tailwind exit animations can play.
 * It also caches the last children so they don't break during the fade-out phase
 * if the parent nullifies the selected state.
 *
 * Props:
 * - isOpen (boolean): Controls whether the modal is shown.
 * - onClose (function): Called when clicking the overlay (optional).
 * - children: The actual modal content (the centered card).
 * - className: Custom classes for the overlay wrapper.
 */
export default function AnimatedModal({ 
  isOpen, 
  onClose, 
  children,
  className = "fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const cachedChildren = useRef(children);

  useEffect(() => {
    if (isOpen) {
      cachedChildren.current = children;
    }
  }, [isOpen, children]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      // Trigger fade out
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200); // 200ms matches the duration-200 class
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`${className} ${isClosing ? 'animate-out fade-out duration-200' : 'animate-in fade-in duration-200'} overscroll-contain`}
      onClick={(e) => {
        // Only close if clicking exactly on the overlay, not the content
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div 
        className={`w-full max-w-7xl flex justify-center items-center pointer-events-none ${isClosing ? 'animate-out zoom-out-95 duration-200' : ''}`}
      >
        <div className="pointer-events-auto w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
          {isOpen ? children : cachedChildren.current}
        </div>
      </div>
    </div>
  );
}
