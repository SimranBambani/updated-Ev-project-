import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/buttons/Button';
import { FiAlertCircle, FiHome } from 'react-icons/fi';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-card border border-slate-200/80">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center text-3xl mx-auto mb-4">
          <FiAlertCircle />
        </div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-2">404</h1>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Page Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The charging route or page you are looking for does not exist or has been relocated.
        </p>
        <Link to="/">
          <Button variant="primary" icon={FiHome} fullWidth>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
