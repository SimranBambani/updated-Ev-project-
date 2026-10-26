import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/buttons/Button';
import { FiShieldOff, FiLock } from 'react-icons/fi';

export const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-card border border-slate-200/80">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-3xl mx-auto mb-4">
          <FiShieldOff />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">401 Access Denied</h1>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          You do not have the required permissions or role to access this system module.
        </p>
        <div className="flex gap-3">
          <Link to="/login" className="w-full">
            <Button variant="outline" fullWidth>
              Log In as Different User
            </Button>
          </Link>
          <Link to="/" className="w-full">
            <Button variant="primary" fullWidth>
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
