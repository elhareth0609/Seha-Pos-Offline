
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { ThemeToggle } from "./ThemeToggle";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--medical-primary)/0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--medical-secondary)/0.08),transparent_50%)] pointer-events-none" />
      
      {/* Theme Toggle Button */}
      <div className="absolute top-20 left-6 z-20">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 text-center lg:text-right">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-medical-primary/10 text-medical-primary px-4 py-2 rounded-full text-sm font-medium animate-fade-in">
              <span className="w-2 h-2 bg-medical-primary rounded-full animate-pulse"></span>
              نظام إدارة الصيدليات الذكي
            </div>
            
            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in" style={{animationDelay: "0.2s"}}>
              <span className="bg-gradient-primary bg-clip-text text-transparent">ميدجرام</span>
              <br />
              <span className="text-foreground">مستقبل إدارة</span>
              <br />
              <span className="text-foreground">الصيدليات</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed animate-fade-in" style={{animationDelay: "0.4s"}}>
              حوّل صيدليتك إلى مركز متكامل للكفاءة والربحية. نظام شامل لإدارة كل جوانب عملك اليومي بدقة وسهولة.
            </p>
            
            {/* CTA Button */}
            <div className="flex justify-center lg:justify-start animate-fade-in" style={{animationDelay: "0.6s"}}>
              <Button size="lg" className="bg-gradient-primary text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-glow hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                  تسجيل الدخول
                  <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center lg:justify-start gap-8 text-sm text-muted-foreground animate-fade-in" style={{animationDelay: "0.8s"}}>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                <div className="w-3 h-3 bg-medical-success rounded-full animate-pulse"></div>
                <span>✓ آمان مطلق للبيانات</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                <div className="w-3 h-3 bg-medical-success rounded-full animate-pulse" style={{animationDelay: "0.5s"}}></div>
                <span>✓ دعم فني على مدار الساعة</span>
              </div>
              <div className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                <div className="w-3 h-3 bg-medical-success rounded-full animate-pulse" style={{animationDelay: "1s"}}></div>
                <span>✓ تحديثات مستمرة</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative animate-fade-in" style={{animationDelay: "0.4s"}}>
            <div className="relative bg-gradient-card rounded-3xl p-4 sm:p-8 shadow-glow hover:shadow-feature transition-shadow duration-500">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src="/landing/f695b7c1-a4db-4a2c-9044-9a3530dc8159.png"
                  alt="واجهة نظام إدارة الصيدلية ميدجرام - لوحة التحكم والتقارير"
                  className="w-full h-auto rounded-2xl shadow-feature"
                />
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-medical-primary text-white px-4 py-2 rounded-xl shadow-lg animate-float">
                <span className="text-sm font-bold">إدارة ذكية</span>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-medical-secondary text-white px-4 py-2 rounded-xl shadow-lg animate-float" style={{animationDelay: "1.5s"}}>
                <span className="text-sm font-bold">تقارير فورية</span>
              </div>
              
              <div className="absolute top-1/2 -left-6 bg-medical-success text-white px-3 py-1 rounded-lg shadow-lg animate-float" style={{animationDelay: "3s"}}>
                <span className="text-xs font-bold">سهل الاستخدام</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
