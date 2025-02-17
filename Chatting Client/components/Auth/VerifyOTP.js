"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { toast } from "react-hot-toast";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { Input } from "../ui/input";
import { useAuth } from "@/hooks/useAuth";

export default function VerifyOTP() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const router = useRouter();
  const { verifyOtp, resendOtp } = useAuth();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("registrationEmail");
    const expireTime = sessionStorage.getItem("registrationEmailExpireTime");

    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push("/");
    }

    if (expireTime) {
      const remainingTime = Math.max(
        0,
        parseInt(expireTime) - new Date().getTime()
      );

      if (remainingTime > 0) {
        setIsResendDisabled(true);
        setTimeRemaining(Math.ceil(remainingTime / 1000));

        const timer = setInterval(() => {
          const currentRemaining = Math.max(
            0,
            parseInt(expireTime) - new Date().getTime()
          );
          if (currentRemaining <= 0) {
            clearInterval(timer);
            setIsResendDisabled(false);
            setTimeRemaining(0);
          } else {
            setTimeRemaining(Math.ceil(currentRemaining / 1000));
          }
        }, 1000);

        return () => clearInterval(timer);
      } else {
        setIsResendDisabled(false);
      }
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !otp) {
      toast.error("Please enter the OTP to verify your account.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOtp(email, otp);

      if (result?.success) {
        toast.success("Your account has been successfully verified!");
        sessionStorage.removeItem("registrationEmail");
        sessionStorage.removeItem("registrationEmailExpireTime");
        router.push("/login");
      } else {
        const errorMessage =
          result?.message || "Wrong OTP. Please check and try again.";
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred while verifying your account.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email is required to resend OTP.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await resendOtp(email);

      if (result?.success) {
        const newExpireTime = new Date().getTime() + 3 * 60 * 1000;
        sessionStorage.setItem(
          "registrationEmailExpireTime",
          newExpireTime.toString()
        );

        toast.success(
          result.message || "A new OTP has been sent to your email."
        );
        setIsResendDisabled(true);
        setTimeRemaining(180);
        window.location.reload();
      } else {
        toast.error(result?.message || "Failed to resend OTP");
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An error occurred while resending OTP";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen-200px my-auto p-4'>
      <Card className='w-full max-w-md bg-white shadow-lg'>
        <CardHeader className='text-center'>
          <ShieldCheck className='mx-auto h-12 w-12 text-green-600' />
          <h2 className='text-2xl font-bold mt-4'>Verify Your Account</h2>
          <p className='text-muted-foreground'>
            Enter the OTP sent to your email
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <Label htmlFor='email'>Your Email</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email'
                readOnly
                className='bg-gray-100 cursor-not-allowed'
              />
            </div>
            <div>
              <Label htmlFor='otp'>One-Time Password (OTP)</Label>
              <Input
                id='otp'
                type='text'
                value={otp}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setOtp(value);
                  }
                }}
                placeholder='Enter 6-digit OTP'
                maxLength={6}
              />
            </div>

            <Button
              type='submit'
              className='w-full bg-green-600 hover:bg-green-700 text-white'
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify Account"}
            </Button>
            <div className='text-center text-sm text-muted-foreground space-y-2'>
              {isResendDisabled && timeRemaining > 0 ? (
                <div className='w-full p-2 bg-yellow-100 text-yellow-800 rounded'>
                  OTP Expires in {timeRemaining} seconds
                </div>
              ) : (
                <Button
                  type='button'
                  variant='outline'
                  className='w-full border-blue-500 text-blue-600 hover:bg-blue-50'
                  onClick={handleResendOTP}
                  disabled={isResendDisabled || isLoading}
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Resend OTP
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
