import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/cards/Card';
import { Input } from '../../components/common/forms/Input';
import { Button } from '../../components/common/buttons/Button';
import { StatusBadge } from '../../components/common/badge/StatusBadge';
import { ConfirmationModal } from '../../components/common/modal/ConfirmationModal';
import { emailValidation, phoneValidation } from '../../utils/validators';
import { FiUser, FiMail, FiPhone, FiShield, FiSave, FiPower, FiLoader } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, updateProfile, refreshProfile, disableAccount } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // On mount: fetch fresh profile from DB and pre-populate form
  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const freshUser = await refreshProfile();
        if (freshUser) {
          reset({
            name: freshUser.name || '',
            email: freshUser.email || '',
            phone: freshUser.phone || '',
          });
        }
      } catch (err) {
        // Fallback to localStorage user
        if (user) {
          reset({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          });
        }
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await updateProfile({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
      });
      toast.success('Profile updated successfully! Changes saved to database.');
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Failed to update profile. Please try again.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableAccount = async () => {
    setDisabling(true);
    try {
      await disableAccount();
      toast.info('Your account has been disabled. You have been logged out.');
      navigate('/login');
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Failed to disable account. Please try again.';
      toast.error(errMsg);
      setShowDisableModal(false);
    } finally {
      setDisabling(false);
    }
  };

  const displayUser = user || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">User Profile Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage your account information and credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="flex flex-col items-center text-center p-6 md:col-span-1">
          <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-600 border-4 border-white shadow-md flex items-center justify-center text-4xl font-extrabold mb-4">
            {displayUser?.name ? displayUser.name.charAt(0).toUpperCase() : <FiUser />}
          </div>
          <h3 className="text-lg font-bold text-slate-900">{displayUser?.name || 'VoltFlow User'}</h3>
          <p className="text-xs text-slate-500 mb-3">{displayUser?.email}</p>
          <StatusBadge status={displayUser?.role || 'Customer'} />
          <div className="w-full mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 text-left space-y-2">
            <div className="flex justify-between">
              <span>Account Status:</span>
              <span className={`font-semibold ${displayUser?.is_active !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                {displayUser?.is_active !== false ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Phone:</span>
              <span className="font-semibold text-slate-700">{displayUser?.phone || 'Not set'}</span>
            </div>
          </div>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2 p-6">
          <h4 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Edit Information
          </h4>

          {profileLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
              <FiLoader className="animate-spin" />
              <span className="text-sm">Loading profile...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                icon={FiUser}
                error={errors.name?.message}
                placeholder="Enter your full name"
                {...register('name', { required: 'Name is required' })}
              />

              <Input
                label="Email Address"
                type="email"
                icon={FiMail}
                error={errors.email?.message}
                placeholder="Enter your email address"
                {...register('email', emailValidation)}
              />

              <Input
                label="Phone Number"
                icon={FiPhone}
                error={errors.phone?.message}
                placeholder="+91 9876543210 or 9876543210"
                {...register('phone', phoneValidation)}
              />

              {user?.role === 'Station Manager' ? (
                <>
                  <Input
                    label="Station Name (Read Only)"
                    icon={FiShield}
                    value={user?.stationName || 'Station assignment unavailable'}
                    disabled
                  />

                  <Input
                    label="Shift Schedule"
                    icon={FiShield}
                    value={user?.shift || 'Morning (06:00 - 14:00)'}
                    disabled
                  />
                </>
              ) : (
                <Input
                  label="Role (Read-Only)"
                  icon={FiShield}
                  value={user?.role || 'Customer'}
                  disabled
                />
              )}

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={FiPower}
                  onClick={() => setShowDisableModal(true)}
                >
                  Disable Account
                </Button>
                <Button type="submit" variant="primary" icon={FiSave} isLoading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>

      {/* Disable Account Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={handleDisableAccount}
        title="Disable Account"
        message={
          "Are you sure you want to disable your VoltFlow account?\n\n" +
          "• Your account will be immediately deactivated\n" +
          "• You will be logged out and cannot log back in\n" +
          "• All your data (vehicles, bookings, history) will be preserved\n" +
          "• Contact support at support@voltflow.io to reactivate your account"
        }
        confirmText="Disable My Account"
        isLoading={disabling}
      />
    </div>
  );
};
