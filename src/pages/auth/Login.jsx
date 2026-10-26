import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/forms/Input';
import { Button } from '../../components/common/buttons/Button';
import { emailValidation, passwordValidation } from '../../utils/validators';
import { FiMail, FiLock, FiUserCheck, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Customer');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'alice@customer.com',
      password: 'customerpass123',
    },
  });

  const handleRolePreset = (role) => {
    setSelectedRole(role);
    if (role === 'Admin') {
      setValue('email', 'admin@evcharge.com');
      setValue('password', 'adminpass123');
    } else if (role === 'Station Manager') {
      setValue('email', 'john.manager@evcharge.com');
      setValue('password', 'managerpass123');
    } else {
      setValue('email', 'alice@customer.com');
      setValue('password', 'customerpass123');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const cleanEmail = (data.email || '').trim();
      const cleanPassword = (data.password || '').trim();
      const res = await login(cleanEmail, cleanPassword, selectedRole);
      toast.success(`Welcome back, ${res.user.name}! Logged in as ${res.user.role}.`);
      
      // Redirect based on actual returned user role from database
      const userRole = res.user.role;
      if (userRole === 'Admin') {
        navigate('/admin');
      } else if (userRole === 'Station Manager') {
        navigate('/manager');
      } else {
        navigate('/customer');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">Sign in to your account</h3>
        <p className="text-xs text-slate-500 mt-1">Select a role preset or enter credentials below</p>
      </div>

      {/* Role Preset Selector for Easy College Demo Evaluation */}
      <div className="mb-6 bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between text-xs font-semibold">
        {['Customer', 'Station Manager', 'Admin'].map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => handleRolePreset(role)}
            className={`flex-1 py-2 px-2 rounded-xl transition text-center ${
              selectedRole === role
                ? 'bg-white text-primary-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {role === 'Station Manager' ? 'Manager' : role}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Gmail ID"
          type="email"
          icon={FiMail}
          placeholder="name@gmail.com"
          error={errors.email?.message}
          {...register('email', emailValidation)}
        />

        <Input
          label="Password"
          type="password"
          icon={FiLock}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', passwordValidation)}
        />

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              defaultChecked
            />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password" className="font-bold text-primary-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" fullWidth isLoading={loading}>
          Sign In as {selectedRole}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don't have an account?{' '}
        <Link to="/signup" className="font-bold text-primary-600 hover:underline">
          Create one now
        </Link>
      </div>
    </div>
  );
};
