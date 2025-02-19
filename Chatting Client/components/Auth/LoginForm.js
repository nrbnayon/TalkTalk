'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '../ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '../ui/button';
import Image from 'next/image';
import Logo from '@/assets/icons/chat.png';
import { GenerateSlug } from '@/utils/GenerateSlug';
import toast from 'react-hot-toast';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('registrationEmail');
    if (storedEmail) {
      router.push('/otp-verify');
    }
  }, [router]);

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);

      const accessToken = result?.data?.data?.accessToken;
      if (result.success && accessToken) {
        const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
        const user = GenerateSlug(decodedToken.name);
        router.push(`welcome-${user}`);
        toast.success('Login successful!');
        window.location.reload();
      } else {
        toast.error('Login Failed! Please try again');
        console.error(result.error);
      }
    } catch (error) {
      console.error('Failed to login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4 ">
      <Card className="w-full bg-white max-w-prose p-4">
        <CardHeader className="space-y-2 text-center">
          {/* <MessageCircle className='w-12 h-12 mx-auto text-primary' /> */}
          <Image
            src={Logo}
            alt="Chatters"
            width={100}
            height={100}
            className="mx-auto"
          />
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground">Login to your account</p>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={e =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
