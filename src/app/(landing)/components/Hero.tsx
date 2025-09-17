"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import React from "react";

export const Hero = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true
  });
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    
    // Auto scroll
    const autoScroll = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => {
      clearInterval(autoScroll);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--medical-primary)/0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,hsl(var(--medical-secondary)/0.08),transparent_50%)] pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 text-right">
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
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed animate-fade-in" style={{animationDelay: "0.4s"}}>
              حوّل صيدليتك إلى مركز متكامل للكفاءة والربحية. نظام شامل لإدارة كل جوانب عملك اليومي بدقة وسهولة.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex justify-end animate-fade-in" style={{animationDelay: "0.6s"}}>
              <Button size="lg" className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-xl">
                تواصل معنا
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{animationDelay: "0.8s"}}>
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
          
          {/* Hero Images Carousel */}
          <div className="relative animate-fade-in" style={{animationDelay: "0.4s"}}>
            <div className="relative bg-gradient-card rounded-3xl p-8 shadow-glow hover:shadow-feature transition-shadow duration-500">
              <div className="embla overflow-hidden rounded-2xl" ref={emblaRef}>
                <div className="embla__container flex">
                  <div className="embla__slide flex-[0_0_100%] min-w-0">
                    <img
                      src="/landing/f695b7c1-a4db-4a2c-9044-9a3530dc8159.png"
                      alt="واجهة نظام إدارة الصيدلية ميدجرام - لوحة التحكم والتقارير"
                      className="w-full h-auto rounded-2xl shadow-feature"
                    />
                  </div>
                  <div className="embla__slide flex-[0_0_100%] min-w-0">
                    <img
                      src="/landing/53f31578-5447-46e2-809c-12b2e06ba9ce.png"
                      alt="واجهة نظام إدارة الصيدلية ميدجرام - نقطة البيع والمخزون"
                      className="w-full h-auto rounded-2xl shadow-feature"
                    />
                  </div>
                </div>
              </div>
              
              {/* Carousel Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1].map((index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      selectedIndex === index 
                        ? "bg-medical-primary scale-125" 
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                    onClick={() => emblaApi?.scrollTo(index)}
                  />
                ))}
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