import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WelcomePage() {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/login');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="relative w-full max-w-2xl">
                <Card className="w-full shadow-2xl animate-in fade-in zoom-in-95 duration-700 border-2">
                    <CardHeader className="text-center space-y-6 pb-8">
                        <div className="mx-auto mb-4 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                            <img 
                                src="/favicon.png" 
                                alt="ميدجرام" 
                                className="h-24 w-24 relative z-10 drop-shadow-2xl" 
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                                <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    مرحباً بك!
                                </CardTitle>
                                <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                            </div>
                            
                            <CardDescription className="text-lg">
                                أهلاً بك في <span className="font-bold text-primary">ميدجرام</span>
                            </CardDescription>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6 px-8 pb-8">
                        <div className="text-center space-y-4">
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                نظام متكامل لإدارة الصيدليات
                            </p>
                            
                            <div className="grid gap-4 mt-6">
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                                    <p className="text-right flex-1">إدارة المبيعات والمخزون بكفاءة عالية</p>
                                </div>
                                
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                                    <div className="h-2 w-2 rounded-full bg-purple-500 mt-2"></div>
                                    <p className="text-right flex-1">تتبع المشتريات والموردين</p>
                                </div>
                                
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2"></div>
                                    <p className="text-right flex-1">تقارير شاملة ومفصلة</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3 pt-4">
                            <Button 
                                onClick={handleGetStarted}
                                size="lg"
                                className="w-full text-lg h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                ابدأ الآن
                                <ArrowLeft className="ms-2 h-5 w-5" />
                            </Button>
                            
                            <p className="text-center text-sm text-muted-foreground">
                                سجّل الدخول للبدء في استخدام النظام
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
