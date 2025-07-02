"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PackagePlus } from 'lucide-react';

export default function LoginPage() {
  const [pin, setPin] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handlePinChange = (value: string) => {
    if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      toast({
        variant: 'destructive',
        title: 'خطأ في الدخول',
        description: 'الرجاء إدخال رقم سري مكون من 4 أرقام.',
      });
      return;
    }
    setIsLoading(true);
    const success = await login(pin);
    if (!success) {
      toast({
        variant: 'destructive',
        title: 'فشل تسجيل الدخول',
        description: 'الرقم السري غير صحيح. الرجاء المحاولة مرة أخرى.',
      });
      setPin('');
    }
    setIsLoading(false);
  };
  
  // This prevents the login page from flashing if the user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  const keypadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <PackagePlus className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold">مدستوك</span>
            </div>
          <CardTitle>تسجيل الدخول</CardTitle>
          <CardDescription>أدخل الرقم السري الخاص بك للمتابعة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Input
              type="password"
              value={pin}
              readOnly
              className="w-48 h-14 text-center text-3xl tracking-[1rem]"
              maxLength={4}
              placeholder="••••"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {keypadButtons.map((num) => (
              <Button key={num} variant="outline" size="lg" className="text-2xl" onClick={() => handlePinChange(num)}>
                {num}
              </Button>
            ))}
            <Button variant="outline" size="lg" className="text-lg" onClick={handleDelete}>
              مسح
            </Button>
             <Button variant="outline" size="lg" className="text-2xl" onClick={() => handlePinChange('0')}>
              0
            </Button>
            <Button size="lg" className="text-lg" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin"/> : 'دخول'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
