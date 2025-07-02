'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { PackagePlus, AlertCircle, Fingerprint } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function LoginPage() {
    const [pin, setPin] = React.useState('');
    const { login, getPinHint } = useAuth();
    const { toast } = useToast();

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (/\d/.test(event.key)) {
                handlePinChange(event.key);
            } else if (event.key === 'Backspace') {
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pin]); 


    const handlePinChange = (value: string) => {
        if (pin.length < 4) {
            const newPin = pin + value;
            setPin(newPin);
            if (newPin.length === 4) {
                handleSubmit(newPin);
            }
        }
    };
    
    const handleDelete = () => {
        setPin(pin.slice(0, -1));
    }

    const handleSubmit = async (finalPin: string) => {
        const success = await login(finalPin);
        if (!success) {
            toast({
                variant: 'destructive',
                title: 'رمز PIN غير صحيح',
                description: 'الرجاء المحاولة مرة أخرى.'
            });
            if (window.navigator.vibrate) window.navigator.vibrate(200);
            setTimeout(() => setPin(''), 500);
        }
    };

    const pinHint = getPinHint();

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-sm text-center shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader>
                    <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full">
                        <PackagePlus className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">مرحبًا بعودتك!</CardTitle>
                    <CardDescription>
                        الرجاء إدخال رمز PIN الخاص بك للمتابعة.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center items-center gap-4 h-8">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className={`h-4 w-4 rounded-full border-2 transition-all ${pin.length > index ? 'bg-primary border-primary scale-110' : 'bg-background border-muted-foreground'}`}></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[...Array(9)].map((_, i) => (
                            <Button key={i+1} variant="outline" size="lg" className="text-2xl font-bold h-16" onClick={() => handlePinChange(String(i+1))}>
                                {i+1}
                            </Button>
                        ))}
                         <Button variant="outline" size="lg" className="text-2xl font-bold h-16" onClick={handleDelete} disabled={pin.length === 0}>
                            ⌫
                        </Button>
                         <Button variant="outline" size="lg" className="text-2xl font-bold h-16" onClick={() => handlePinChange('0')}>
                            0
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="lg" className="h-16 text-muted-foreground hover:bg-yellow-400/20 hover:text-yellow-600">
                                    <Fingerprint />
                                </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل نسيت رمز PIN؟</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-4">
                                        {pinHint ? (
                                            <>
                                            <p>لقد قمت بتعيين تلميح لمساعدتك على تذكر الرمز الخاص بك:</p>
                                            <div className="p-3 bg-accent rounded-md border text-accent-foreground text-center font-medium">
                                                {pinHint}
                                            </div>
                                            </>
                                        ) : (
                                            <div className="flex items-start gap-3 text-destructive">
                                                <AlertCircle className="h-5 w-5 mt-1 shrink-0"/>
                                                <span>لم تقم بتعيين تلميح لرمز PIN. الطريقة الوحيدة لاستعادة الوصول هي عن طريق مسح جميع بيانات التطبيق والبدء من جديد. هذا الإجراء لا يمكن التراجع عنه.</span>
                                            </div>
                                        )}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>حسنًا</AlertDialogCancel>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
