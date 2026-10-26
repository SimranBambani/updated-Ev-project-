import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white py-4 px-6 text-center sm:text-left">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <p>© 2026 VoltFlow Smart EV Charging System. Built for startup-grade performance.</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-800 transition cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-slate-800 transition cursor-pointer">Terms of Service</span>
          <span>•</span>
          <span className="text-primary-600 font-bold">API Documentation Ready</span>
        </div>
      </div>
    </footer>
  );
};
