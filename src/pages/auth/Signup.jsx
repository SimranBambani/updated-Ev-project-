import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/forms/Input';
import { Select } from '../../components/common/forms/Select';
import { Button } from '../../components/common/buttons/Button';
import { emailValidation, phoneValidation, passwordValidation } from '../../utils/validators';
import { FiUser, FiMail, FiPhone, FiLock, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';

export const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: 'Customer',
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await signup(data);
      toast.success('Account created successfully! Welcome to VoltFlow.');
      
      if (res.user.role === 'Admin') navigate('/admin');
      else if (res.user.role === 'Station Manager') navigate('/manager');
      else navigate('/customer');
    } catch (err) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">Create your VoltFlow account</h3>
        <p className="text-xs text-slate-500 mt-1">Join the next-gen EV charging network</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label="Full Name"
          icon={FiUser}
          placeholder="e.g. Alex Morgan"
          error={errors.name?.message}
          {...register('name', { required: 'Full name is required' })}
        />

        <Input
          label="Gmail ID"
          type="email"
          icon={FiMail}
          placeholder="alex@gmail.com"
          error={errors.email?.message}
          {...register('email', emailValidation)}
        />

        <Input
          label="Phone Number"
          type="tel"
          icon={FiPhone}
          placeholder="9876543210"
          error={errors.phone?.message}
          {...register('phone', phoneValidation)}
        />

        <Select
          label="Select Account Role"
          icon={FiShield}
          options={[
            { label: 'Customer (EV Owner)', value: 'Customer' },
            { label: 'Station Manager', value: 'Station Manager' },
            { label: 'System Admin', value: 'Admin' },
          ]}
          error={errors.role?.message}
          {...register('role', { required: 'Please select a role' })}
        />

        <Input
          label="Password"
          type="password"
          icon={FiLock}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', passwordValidation)}
        />

        <Button type="submit" variant="primary" fullWidth isLoading={loading} className="mt-2">
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-primary-600 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};
