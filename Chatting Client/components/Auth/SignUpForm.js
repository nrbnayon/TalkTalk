'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Upload, XCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Card, CardHeader } from '../ui/card';
import { Label } from '../ui/label';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Logo from '@/assets/icons/chat.png';
import { useRegisterMutation } from '@/redux/features/auth/authApiSlice';
import logger from '@/utils/logger';

export default function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    image: null,
    profileImage: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [picLoading, setPicLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const [registerMutation] = useRegisterMutation();

  useEffect(() => {
    setIsClient(true);
    const storedEmail = sessionStorage.getItem('registrationEmail');
    if (storedEmail) {
      router.push('/otp-verify');
    }
  }, [router]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.image) {
      newErrors.image = 'Profile image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadToCloudinary = file => {
    return new Promise((resolve, reject) => {
      setPicLoading(true);
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', 'Chatters');
      data.append('cloud_name', 'nayon');

      fetch('https://api.cloudinary.com/v1_1/nayon/image/upload', {
        method: 'POST',
        body: data,
      })
        .then(res => res.json())
        .then(cloudinaryData => {
          setFormData(prev => ({
            ...prev,
            profileImage: cloudinaryData.url,
          }));
          setPicLoading(false);
          resolve(cloudinaryData.url);
        })
        .catch(err => {
          logger.error('Cloudinary upload error:', err);
          setPicLoading(false);
          reject(err);
        });
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let cloudinaryUrl = formData.profileImage;

      // Upload local image to Cloudinary if exists
      if (formData.image && !formData.profileImage) {
        cloudinaryUrl = await uploadToCloudinary(formData.image);
      }

      const formDataToSubmit = new FormData();

      if (formData.image) {
        formDataToSubmit.append('image', formData.image);
      }

      formDataToSubmit.append(
        'data',
        JSON.stringify({
          name: `${formData.firstName} ${formData.lastName || ''}`.trim(),
          email: formData.email,
          password: formData.password,
          phone: formData.phone || '',
          profileImage: cloudinaryUrl,
        })
      );
      const result = await registerMutation(formDataToSubmit).unwrap();

      if (result.success) {
        const email = result.email;
        const expireTime = new Date().getTime() + 3 * 60 * 1000;
        sessionStorage.setItem('registrationEmail', email);
        sessionStorage.setItem(
          'registrationEmailExpireTime',
          expireTime.toString()
        );
        router.push('/otp-verify');

        toast.success(
          'Registration successful! Please check your email to verify your account. We have sent you an OTP to complete the registration process.'
        );
      }
    } catch (error) {
      console.error('Detailed registration error:', error);
      toast.error(
        error.data?.message || error.message || 'Registration failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = file => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File must be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file,
        profileImage: '',
      }));
    }
  };

  const handleDragEvents = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const removeProfileImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      profileImage: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePasswordVisibility = field => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl rounded-none md:rounded-2xl px-6 py-2 shadow-input bg-white dark:bg-black">
        <CardHeader className="space-y-2 flex items-center justify-center flex-col text-center">
          {/* <MessageCircle className="w-12 h-12 mx-auto text-neutral-800 dark:text-neutral-200" /> */}
          <Image
            src={Logo}
            alt="Chatters"
            width={100}
            height={100}
            className="mx-auto"
          />
          <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
            Create An Account
          </h2>
        </CardHeader>

        <form onSubmit={handleSubmit} className="my-4">
          {/* Name Field */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="w-full">
              <Label htmlFor="firstName">
                First name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                type="text"
                value={formData.firstName}
                onChange={e =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
              {errors.firstName && (
                <div className="text-red-500 flex items-center gap-2 mt-1">
                  <AlertTriangle size={16} />
                  {errors.firstName}
                </div>
              )}
            </div>
            <div className="w-full">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                type="text"
                value={formData.lastName}
                onChange={e =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={e =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2 mb-4">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={e =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            {errors.email && (
              <div className="text-red-500 flex items-center gap-2 mt-1">
                <AlertTriangle size={16} />
                {errors.email}
              </div>
            )}
          </div>

          {/* Password Input */}
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="w-full space-y-2 relative mb-4">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword.password ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => togglePasswordVisibility('password')}
                >
                  {showPassword.password ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="text-red-500 flex items-center gap-2 mt-1">
                  <AlertTriangle size={16} />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="w-full space-y-2 relative mb-4">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                >
                  {showPassword.confirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="text-red-500 flex items-center gap-2 mt-1">
                  <AlertTriangle size={16} />
                  {errors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          {/* Profile Image Upload */}
          <div className="mb-6">
            <Label>
              Upload Profile Image <span className="text-red-500">*</span>
            </Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-300 mt-1',
                dragOver ? 'border-primary bg-primary/10' : 'border-gray-300'
              )}
              onDragEnter={handleDragEvents}
              onDragOver={handleDragEvents}
              onDragLeave={handleDragEvents}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={e => handleFileChange(e.target.files[0])}
              />
              {formData.image ? (
                <div className="relative">
                  <Image
                    src={URL.createObjectURL(formData.image)}
                    alt="Profile"
                    width={150}
                    height={150}
                    className="mx-auto max-h-32 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeProfileImage}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-6 w-6 text-neutral-500 mb-2" />
                  <p className="text-sm text-neutral-500">
                    Drag & Drop or{' '}
                    <span className="text-neutral-700 font-medium cursor-pointer hover:underline">
                      Browse
                    </span>
                  </p>
                </div>
              )}
            </div>
            {errors.image && (
              <div className="text-red-500 flex items-center gap-2">
                <AlertTriangle size={16} />
                {errors.image}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            className="bg-gradient-to-br  relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full cursor-pointer text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign up →'}
          </button>
        </form>
        <p className="text-sm text-center text-muted-foreground pb-4">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
