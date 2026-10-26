import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Input } from '../../components/common/forms/Input';
import { Button } from '../../components/common/buttons/Button';
import { passwordValidation } from '../../utils/validators';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, data.password, email);
      toast.success('Password successfully reset! Please log in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error('Failed to reset password. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">Reset Your Password</h3>
        <p className="text-xs text-slate-500 mt-1">Enter your new secure password below</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          icon={FiLock}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', passwordValidation)}
        />

        <Input
          label="Confirm New Password"
          type="password"
          icon={FiLock}
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (val) => val === password || 'Passwords do not match',
          })}
        />

        <Button type="submit" variant="primary" fullWidth isLoading={loading}>
          Update Password
        </Button>
      </form>
    </div>
  );
};
