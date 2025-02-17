"use client";

import { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import logger from "@/utils/logger";
import toast from "react-hot-toast";

const AuthModal = ({ isOpen, onClose, type = "login" }) => {
  const { login, register } = useAuth();
  const [modalType, setModalType] = useState(type);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    userName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    // fullName: false,
    email: false,
    // password: false,
  });
  const [formErrors, setFormErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    // checkbox: "",
  });

  useEffect(() => {
    setModalType(type);
  }, [type]);

  const validateForm = () => {
    const errors = {
      fullName: "",
      email: "",
      // password: "",
      // checkbox: "",
    };
    let isValid = true;

    if (modalType === "register" && !formData.fullName.trim()) {
      errors.fullName = "Full name is required";
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (modalType === "login" && !rememberMe) {
      errors.checkbox = "Please accept the remember me checkbox";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setError("");
    setLoading(true);

    try {
      let result;
      if (modalType === "login") {
        // logger.debug("Attempting login with email:", formData.email);
        result = await login(formData.email, formData.password);
      } else {
        // logger.debug("Attempting registration with data:", {
        //   fullName: formData.fullName,
        //   email: formData.email,
        // });
        result = await register(formData);
      }

      // logger.debug("Auth result:", result);

      if (result.success) {
        logger.info(
          `${
            modalType.charAt(0).toUpperCase() + modalType.slice(1)
          } successful`,
          result.data
        );

        if (modalType === "register") {
          toast.success("Registration successful! Please log in.");
          setModalType("login");
        } else {
          toast.success(
            `${
              modalType.charAt(0).toUpperCase() + modalType.slice(1)
            } successful!`
          );
          onClose();
          window.location.reload();
        }
      } else {
        logger.warn(
          `${modalType.charAt(0).toUpperCase() + modalType.slice(1)} failed`,
          result.error
        );
        setError(result.error || "Operation failed. Please try again.");
        toast.error(result.error || "Operation failed. Please try again.");
      }
    } catch (err) {
      logger.error("Unexpected error during submission:", err);
      setError("An unexpected error occurred.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
      logger.debug("Form submission completed for:", modalType);
    }
  };

  const toggleType = () => {
    const newType = modalType === "login" ? "register" : "login";
    setModalType(newType);
    setFormData({
      fullName: "",
      email: "",
      password: "",
    });
    setError("");
    setFormErrors({
      fullName: "",
      email: "",
      password: "",
      // checkbox: "",
    });
    setTouchedFields({
      fullName: false,
      email: false,
      password: false,
    });
  };

  if (!isOpen) return null;

  const isFormValid =
    modalType === "login"
      ? formData.email && formData.password
      : // &&
        // rememberMe &&
        // !Object.values(formErrors).some((error) => error)
        formData.fullName && formData.email;
  // &&
  //   formData.password &&
  //   !Object.values(formErrors).some((error) => error);

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 font-rubik'>
      <div className='bg-white rounded-xl px-8 py-6 w-full max-w-[478px] relative'>
        <button
          onClick={onClose}
          className='absolute right-4 top-4 text-gray-900 hover:text-gray-700'
        >
          <X size={24} />
        </button>

        <h2 className='text-[32px] font-semibold text-center mb-6'>
          {modalType === "login" ? "Login" : "Register"}
        </h2>

        {error && (
          <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          {modalType === "register" && (
            <div>
              <Label htmlFor='fullName' className='block mb-2'>
                Full Name
              </Label>
              <input
                type='text'
                placeholder='Enter your name'
                className={`w-full p-2 border rounded-lg ${
                  formErrors.fullName && touchedFields.fullName
                    ? "border-red-500"
                    : ""
                }`}
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fullName: e.target.value,
                    userName: e.target.value,
                  })
                }
                onBlur={() => handleBlur("fullName")}
                required
              />
              {formErrors.fullName && touchedFields.fullName && (
                <p className='text-red-500 text-sm mt-1'>
                  {formErrors.fullName}
                </p>
              )}
            </div>
          )}

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='Enter your email'
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                onBlur={() => handleBlur("email")}
                required
                className={`h-12 ${
                  formErrors.email && touchedFields.email
                    ? "border-red-500"
                    : ""
                }`}
              />
              {formErrors.email && touchedFields.email && (
                <p className='text-red-500 text-sm'>{formErrors.email}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? "text" : "password"}
                  placeholder='Enter your password'
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  onBlur={() => handleBlur("password")}
                  required
                  className={`h-12 pr-10 ${
                    formErrors.password && touchedFields.password
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                >
                  {showPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>
              {formErrors.password && touchedFields.password && (
                <p className='text-red-500 text-sm'>{formErrors.password}</p>
              )}
            </div>
          </div>

          <div className='flex items-center justify-between my-6'>
            {modalType === "login" && (
              <div className='flex items-center space-x-1'>
                <Checkbox
                  id='remember'
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked)}
                  className={`w-5 h-5 mr-2 border-[#E16F3D] placeholder-[#E16F3D] ${
                    formErrors.checkbox ? "border-red-500" : ""
                  }`}
                />
                <label
                  htmlFor='remember'
                  className='text-sm text-textPrimaryColor font-semibold'
                >
                  Remember me
                </label>
              </div>
            )}
            {modalType === "login" && (
              <button
                type='button'
                className='text-sm text-textPrimaryColor underline hover:text-gray-900'
              >
                Forgot Password
              </button>
            )}
          </div>
          {formErrors.checkbox && modalType === "login" && (
            <p className='text-red-500 text-sm -mt-4'>{formErrors.checkbox}</p>
          )}

          <Button
            type='submit'
            disabled={loading || !isFormValid}
            className={`w-full h-[53px] ${
              isFormValid
                ? "bg-[#FF6A1A] hover:bg-[#FF6A1A]/90 text-white"
                : "bg-[#FF6A1A] text-black cursor-not-allowed"
            }  font-semibold`}
          >
            {loading
              ? "Processing..."
              : modalType === "login"
              ? "Login"
              : "Register"}
          </Button>

          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-200' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='bg-white px-4 text-gray-500'>
                Or Sign in with
              </span>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-6'>
            <Button type='button' variant='outline' className='h-12'>
              <svg
                width='21'
                height='21'
                viewBox='0 0 21 21'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <g clipPath='url(#clip0_4803_19274)'>
                  <g clipPath='url(#clip1_4803_19274)'>
                    <path
                      d='M20.04 8.82776C20.1276 8.82776 20.1985 8.89875 20.1985 8.98631V10.6509C20.1985 11.2739 20.1407 11.8831 20.0297 12.4741C19.1711 17.0642 15.1272 20.5331 10.2801 20.4997C4.84121 20.4622 0.488471 16.0676 0.500513 10.6287C0.512478 5.19955 4.91753 0.80188 10.3495 0.80188C13.0108 0.80188 15.4254 1.85765 17.1982 3.57261C17.2622 3.63452 17.2639 3.73655 17.2009 3.79949L14.8459 6.15444C14.7853 6.21508 14.6874 6.21665 14.6252 6.15752C13.5125 5.0984 12.0071 4.44818 10.3495 4.44818C6.92655 4.44818 4.17016 7.18498 4.14692 10.6079C4.12357 14.0532 6.90962 16.8536 10.3495 16.8536C13.1405 16.8536 15.5011 15.0098 16.2795 12.4741H10.5081C10.4205 12.4741 10.3495 12.4031 10.3495 12.3155V8.98627C10.3495 8.89871 10.4205 8.82773 10.5081 8.82773H20.04V8.82776Z'
                      fill='#2196F3'
                    />
                    <path
                      d='M20.039 8.82776H18.85C18.9376 8.82776 19.0086 8.89874 19.0086 8.98631V10.6509C19.0086 11.2739 18.9507 11.8831 18.8397 12.4741C18.0206 16.8531 14.3024 20.2116 9.75342 20.4822C9.92747 20.4924 10.1027 20.4984 10.2791 20.4997C15.1263 20.5331 19.1701 17.0642 20.0287 12.4741C20.1397 11.8831 20.1976 11.2739 20.1976 10.6509V8.98627C20.1976 8.89874 20.1266 8.82776 20.039 8.82776Z'
                      fill='#1E88E5'
                    />
                    <path
                      d='M4.7153 8.05331L1.72412 5.89206C3.40223 2.8569 6.63594 0.80188 10.3493 0.80188C13.0105 0.80188 15.4252 1.85765 17.198 3.57261C17.262 3.63452 17.2636 3.73655 17.2006 3.79949L14.8457 6.15445C14.7852 6.21496 14.6872 6.21685 14.6252 6.15783C13.5126 5.09852 12.007 4.44822 10.3493 4.44822C7.85114 4.44822 5.69782 5.92495 4.7153 8.05331Z'
                      fill='#F44336'
                    />
                    <path
                      d='M3.85156 7.42943L4.71508 8.05334C5.61188 6.11069 7.48428 4.71159 9.70377 4.4821C9.72047 4.48029 9.73651 4.4781 9.75352 4.47648C9.55819 4.45794 9.36025 4.44824 9.16004 4.44824C6.90334 4.44824 4.93661 5.63794 3.85156 7.42943Z'
                      fill='#E53935'
                    />
                    <path
                      d='M16.0087 3.57261C16.0727 3.63452 16.0744 3.73655 16.0114 3.79953L14.0999 5.71097C14.2831 5.85024 14.4583 5.99921 14.6247 6.15756C14.6868 6.21669 14.7848 6.21512 14.8454 6.15448L17.2004 3.79953C17.2634 3.73655 17.2617 3.63455 17.1977 3.57261C15.4249 1.85765 13.0103 0.80188 10.349 0.80188C10.1493 0.80188 9.95114 0.808536 9.75439 0.82027C12.1797 0.964735 14.3689 1.9863 16.0087 3.57261Z'
                      fill='#E53935'
                    />
                    <path
                      d='M17.5735 17.3443C15.7749 19.2852 13.2035 20.5 10.3486 20.5C6.49266 20.5 3.1543 18.284 1.5376 15.0558L4.59137 12.9631C5.50776 15.2433 7.74033 16.8536 10.3486 16.8536C11.9855 16.8536 13.4742 16.2195 14.5823 15.1834L17.5735 17.3443Z'
                      fill='#4CAF50'
                    />
                    <path
                      d='M4.59141 12.9631L3.69092 13.5802C4.7368 15.5286 6.79352 16.8536 9.15963 16.8536C9.35973 16.8536 9.55752 16.8438 9.75277 16.8253C7.40404 16.6014 5.43712 15.0676 4.59141 12.9631Z'
                      fill='#43A047'
                    />
                    <path
                      d='M10.3489 20.5C13.2037 20.5 15.7752 19.2852 17.5738 17.3443L16.8411 16.8151C15.1523 18.9168 12.6189 20.3111 9.75586 20.4821C9.95207 20.4938 10.1497 20.5 10.3489 20.5Z'
                      fill='#43A047'
                    />
                    <path
                      d='M4.14634 10.6509C4.14634 11.4682 4.30446 12.2486 4.59181 12.9632L1.538 15.0558C0.873763 13.7305 0.5 12.2343 0.5 10.6509C0.5 8.9249 0.943899 7.30266 1.7239 5.89209L4.71508 8.05334C4.35005 8.84322 4.14634 9.72352 4.14634 10.6509Z'
                      fill='#FFC107'
                    />
                    <path
                      d='M3.69153 13.5803L4.59203 12.9632C4.30468 12.2486 4.14655 11.4682 4.14655 10.651C4.14655 9.72354 4.35027 8.84324 4.7153 8.05336L3.85177 7.42944C3.29103 8.35529 2.96559 9.44173 2.95767 10.608C2.95036 11.6834 3.21686 12.6961 3.69153 13.5803Z'
                      fill='#FFB300'
                    />
                  </g>
                </g>
                <defs>
                  <clipPath id='clip0_4803_19274'>
                    <rect
                      width='20'
                      height='20'
                      fill='white'
                      transform='translate(0.5 0.5)'
                    />
                  </clipPath>
                  <clipPath id='clip1_4803_19274'>
                    <rect
                      width='20'
                      height='20'
                      fill='white'
                      transform='translate(0.5 0.80188)'
                    />
                  </clipPath>
                </defs>
              </svg>
              Google
            </Button>
            <Button type='button' variant='outline' className='h-12'>
              <svg className='mr-2 h-5 w-5' fill='#1877F2' viewBox='0 0 24 24'>
                <path d='M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z' />
              </svg>
              Facebook
            </Button>
          </div>
        </form>

        <div className='mt-6 text-center text-sm'>
          <p className='text-gray-600'>
            {modalType === "login"
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
            <button
              type='button'
              onClick={toggleType}
              className='text-[#FF5C00] hover:text-[#FF5C00]/90 font-medium'
            >
              {modalType === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
