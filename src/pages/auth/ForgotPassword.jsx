import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authService, DEV_SENDER_EMAIL } from '../../services/authService';
import { Input } from '../../components/common/forms/Input';
import { Button } from '../../components/common/buttons/Button';
import { emailValidation } from '../../utils/validators';
import { FiMail, FiArrowLeft, FiCheckCircle, FiClock, FiSend, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const ForgotPassword = () => {
  const [submittedData, setSubmittedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.requestPasswordReset(data.email);
      setSubmittedData({
        email: data.email,
        senderEmail: res.senderEmail || DEV_SENDER_EMAIL,
        resetLink: res.resetLink,
        expiryTime: '15 Minutes',
      });
      toast.success(`Password reset dispatch initiated from ${DEV_SENDER_EMAIL}!`);
    } catch (err) {
      toast.error('Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">Forgot Password?</h3>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered Gmail ID to receive reset instructions
        </p>
      </div>

      {submittedData ? (
        <div className="space-y-4">
          {/* Professional Simulated Email Template Preview Box */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                  <FiSend />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">Gmail Dispatch System</h5>
                  <p className="text-[10px] text-slate-400">From: {submittedData.senderEmail}</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                Email Prepared
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient Gmail ID:</span>
                <strong className="text-slate-200 font-mono">{submittedData.email}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Link Expiry Duration:</span>
                <strong className="text-amber-400 flex items-center gap-1">
                  <FiClock /> {submittedData.expiryTime}
                </strong>
              </div>
            </div>

            {/* Email Body Card */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 text-xs space-y-2">
              <p className="font-bold text-white text-xs">Password Reset Requested</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Click below to open the secure password reset portal for <strong>{submittedData.email}</strong>.
              </p>
              <div className="pt-1">
                <Link to="/reset-password">
                  <Button variant="primary" size="sm" fullWidth icon={FiLock}>
                    Proceed to Reset Password Page
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900">
              <FiArrowLeft /> Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Gmail ID"
            type="email"
            icon={FiMail}
            placeholder="name@gmail.com"
            error={errors.email?.message}
            {...register('email', emailValidation)}
          />

          <Button type="submit" variant="primary" fullWidth isLoading={loading}>
            Send Reset Link
          </Button>

          <div className="text-center pt-2">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900">
              <FiArrowLeft /> Back to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
