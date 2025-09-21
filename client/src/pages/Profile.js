import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  MapPin, 
  Bell, 
  Shield, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      latitude: user?.location?.coordinates?.[1] || '',
      longitude: user?.location?.coordinates?.[0] || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    watch,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm();

  const {
    register: registerNotifications,
    handleSubmit: handleSubmitNotifications,
    formState: { errors: notificationErrors }
  } = useForm({
    defaultValues: {
      email: user?.preferences?.notifications?.email || false,
      sms: user?.preferences?.notifications?.sms || false,
      push: user?.preferences?.notifications?.push || true,
      alertRadius: user?.preferences?.alertRadius || 10
    }
  });

  const newPassword = watch('newPassword');

  const onSubmitProfile = async (data) => {
    const result = await updateProfile(data);
    if (result.success) {
      toast.success('Profile updated successfully');
    }
  };

  const onSubmitPassword = async (data) => {
    const result = await changePassword(data);
    if (result.success) {
      resetPassword();
      toast.success('Password changed successfully');
    }
  };

  const onSubmitNotifications = async (data) => {
    const result = await updateProfile({ preferences: data });
    if (result.success) {
      toast.success('Notification preferences updated');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'password', name: 'Password', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="w-4 h-4" /> }
  ];

  return (
    <>
      <Helmet>
        <title>Profile Settings - Groundwater Detection System</title>
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Profile Settings
          </h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span className="ml-2">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerProfile('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters'
                        }
                      })}
                      type="text"
                      className={`input-field pl-10 ${profileErrors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {profileErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerProfile('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className={`input-field pl-10 ${profileErrors.email ? 'border-red-300 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {profileErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerProfile('latitude', {
                        required: 'Latitude is required',
                        min: { value: -90, message: 'Latitude must be between -90 and 90' },
                        max: { value: 90, message: 'Latitude must be between -90 and 90' }
                      })}
                      type="number"
                      step="any"
                      className={`input-field pl-10 ${profileErrors.latitude ? 'border-red-300 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {profileErrors.latitude && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.latitude.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerProfile('longitude', {
                        required: 'Longitude is required',
                        min: { value: -180, message: 'Longitude must be between -180 and 180' },
                        max: { value: 180, message: 'Longitude must be between -180 and 180' }
                      })}
                      type="number"
                      step="any"
                      className={`input-field pl-10 ${profileErrors.longitude ? 'border-red-300 focus:ring-red-500' : ''}`}
                    />
                  </div>
                  {profileErrors.longitude && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.longitude.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Role: <span className="font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
                <button type="submit" className="btn-primary flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    {...registerPassword('currentPassword', {
                      required: 'Current password is required'
                    })}
                    type={showCurrentPassword ? 'text' : 'password'}
                    className={`input-field pr-10 ${passwordErrors.currentPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showNewPassword ? 'text' : 'password'}
                    className={`input-field pr-10 ${passwordErrors.newPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === newPassword || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`input-field pr-10 ${passwordErrors.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button type="submit" className="btn-primary flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Change Password
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
            <form onSubmit={handleSubmitNotifications(onSubmitNotifications)} className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Email Notifications</div>
                      <div className="text-sm text-gray-500">Receive alerts and updates via email</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        {...registerNotifications('email')}
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">SMS Notifications</div>
                      <div className="text-sm text-gray-500">Receive critical alerts via SMS</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        {...registerNotifications('sms')}
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Push Notifications</div>
                      <div className="text-sm text-gray-500">Receive real-time notifications in browser</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        {...registerNotifications('push')}
                        type="checkbox"
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Radius (km)
                </label>
                <input
                  {...registerNotifications('alertRadius', {
                    required: 'Alert radius is required',
                    min: { value: 1, message: 'Radius must be at least 1 km' },
                    max: { value: 100, message: 'Radius must be at most 100 km' }
                  })}
                  type="number"
                  min="1"
                  max="100"
                  className={`input-field ${notificationErrors.alertRadius ? 'border-red-300 focus:ring-red-500' : ''}`}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Receive alerts for stations within this radius from your location
                </p>
                {notificationErrors.alertRadius && (
                  <p className="mt-1 text-sm text-red-600">{notificationErrors.alertRadius.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button type="submit" className="btn-primary flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
