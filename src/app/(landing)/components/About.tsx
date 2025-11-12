"use client";

import { Card, CardContent } from "../components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, Target, Users, Zap, Smartphone, Download } from "lucide-react";

export const About = () => {
  return (
    <section id="about" className="py-24 bg-gradient-to-b from-accent/10 to-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20 animate-fade-in">
          <Badge className="bg-medical-primary/10 text-medical-primary hover:bg-medical-primary/20 mb-6 hover:scale-105 transition-transform duration-200">
            <Building className="w-4 h-4 ml-2" />
            من نحن
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in" style={{animationDelay: "0.2s"}}>
            شركة <span className="bg-gradient-primary bg-clip-text text-transparent">ميدجرام</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: "0.4s"}}>
            حلول تقنية مبتكرة للقطاع الطبي والصيدلاني
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-1 gap-12 items-center mb-16">
          {/* Company Info */}
          <div className="space-y-6 animate-fade-in" style={{animationDelay: "0.2s"}}>
            <Card className="border-0 bg-gradient-card hover:shadow-glow hover:scale-[1.02] transition-all duration-500">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">عن الشركة</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  شركة ميدجرام تأسست عام 2025، متخصصة في تطوير الحلول التقنية للقطاع الطبي والصيدلاني. 
                  نعمل على ربط المندوبين بالصيدليات وتسهيل العمليات اليومية عبر أنظمتنا الذكية.
                </p>
                <div className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-medical-primary/10 rounded-xl flex items-center justify-center hover:rotate-12 transition-transform duration-300">
                    <Building className="h-6 w-6 text-medical-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">تأسست عام 2025</div>
                    <div className="text-sm text-muted-foreground">رائدة في الحلول التقنية الطبية</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products */}
          {/* <div className="space-y-6 animate-fade-in" style={{animationDelay: "0.4s"}}>
            <Card className="border-0 bg-gradient-card hover:shadow-glow hover:scale-[1.02] transition-all duration-500">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-foreground">برامجنا الرئيسية</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-medical-primary/5 hover:bg-medical-primary/10 hover:scale-[1.02] transition-all duration-300">
                    <div className="w-10 h-10 bg-medical-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 hover:rotate-12 transition-transform duration-300">
                      <Users className="h-5 w-5 text-medical-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">برنامج ربط المندوبين والصيدليات</h4>
                      <p className="text-sm text-muted-foreground mb-4">هو أول برنامج عراقي لربط المندوبين والصيدليات ليسهل التواصل المباشر بين الطرفين وترتيب المواعيد كذلك نظام طلبات مبسط للمندوبين والعديد من التقارير الأخرى</p>
                      
                      <div className="mt-4">
                        <h6 className="font-medium text-foreground mb-3 flex items-center gap-2 text-sm">
                          <Smartphone className="h-4 w-4 text-medical-primary" />
                          حمّل التطبيق الآن
                        </h6>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button size="sm" className="bg-black hover:bg-black/90 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-xs hover:scale-105 transition-all duration-300" onClick={() => window.open('https://apps.apple.com/us/app/midgram/id6748060505', '_blank')}>
                            <div className="flex flex-col items-start">

                              <span className="font-semibold">App Store</span>
                            </div>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" className="bg-gradient-to-b from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg text-xs hover:scale-105 transition-all duration-300" onClick={() => window.open('https://play.google.com/store/apps/details?id=com.wepioners.midgram', '_blank')}>
                            <div className="flex flex-col items-start">

                              <span className="font-semibold">Google Play</span>
                            </div>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-medical-secondary/5 hover:bg-medical-secondary/10 hover:scale-[1.02] transition-all duration-300">
                    <div className="w-10 h-10 bg-medical-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0 hover:rotate-12 transition-transform duration-300">
                      <Zap className="h-5 w-5 text-medical-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">نظام مبيعات الصيدليات</h4>
                      <p className="text-sm text-muted-foreground">يدير عمليات البيع، الشفتات، والتقارير بشكل مرن ودقيق</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div> */}
        </div>

        {/* Vision */}
        <div className="text-center animate-fade-in" style={{animationDelay: "0.6s"}}>
          <Card className="border-0 bg-gradient-hero shadow-glow hover:shadow-feature hover:scale-[1.02] transition-all duration-500">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-3 h-3 bg-medical-primary rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-medical-secondary rounded-full animate-pulse" style={{animationDelay: "0.5s"}} />
                <div className="w-3 h-3 bg-medical-success rounded-full animate-pulse" style={{animationDelay: "1s"}} />
              </div>
              
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-medical-primary/10 rounded-2xl flex items-center justify-center hover:rotate-6 hover:scale-110 transition-transform duration-300">
                  <Target className="h-8 w-8 text-medical-primary" />
                </div>
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                رؤيتنا
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                أن نكون رواد في تطوير الحلول التقنية للمجال الطبي، عبر أدوات مبتكرة تساعد على رفع الكفاءة 
                وتوفير الوقت وتبسيط المهام.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};