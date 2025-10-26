"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Brain, 
  Shield, 
  Clock, 
  Calculator,
  FileText,
  CreditCard,
  BookOpen,
  UserCheck,
  BarChart3,
  Zap,
  CheckCircle,
  ArrowLeft,
  Star,
  Target,
  Lightbulb,
  PieChart,
  Briefcase
} from "lucide-react";

export const Features = () => {
  const { isAuthenticated } = useAuth();
  const coreFeatures = [
    {
      icon: ShoppingCart,
      title: "إدارة المبيعات والمخزون الكاملة",
      description: "نظام متكامل لإدارة كافة عمليات البيع والمخزون بذكاء وكفاءة",
      features: [
        "نظام نقاط بيع (POS) متكامل وسريع",
        "إدارة فواتير المبيعات والمرتجعات", 
        "إدارة شاملة للمخزون مع طباعة الباركود",
        "استيراد البيانات من Excel",
        "نظام لإدارة المشتريات والمرتجعات للموردين"
      ],
      color: "medical-primary"
    },
    {
      icon: CreditCard,
      title: "إدارة الحسابات المالية",
      description: "نظام مالي شامل لإدارة جميع الحسابات والمدفوعات بدقة",
      features: [
        "حسابات الموردين مع تتبع دقيق للديون وكشف حساب تفصيلي",
        "حسابات المرضى (أصدقاء الصيدلية) وإدارة ديون الزبائن",
        "إدارة المصروفات اليومية والثابتة",
        "نظام الرواتب التلقائي حسب ساعات العمل المسجلة"
      ],
      color: "medical-secondary"
    },
    {
      icon: Shield,
      title: "الرقابة والإدارة",
      description: "أدوات متقدمة للإدارة الآمنة والمراقبة الدقيقة",
      features: [
        "إدارة الموظفين والصلاحيات الدقيقة",
        // "الحذف الآمن مع إدخال رمز PIN",
        "سجل الدوام الآلي للموظفين",
        "إسناد وتتبع المهام اليومية"
      ],
      color: "medical-success"
    }
  ];

  const smartFeatures = [
    {
      icon: Brain,
      title: "أداة التنبؤ بالطلب",
      description: "يحلل مبيعاتك التاريخية ويتنبأ بالكمية التي ستحتاجها من كل صنف في الفترة القادمة",
      location: "طلبات الشراء ← اقتراحات النظام",
      color: "medical-primary",
      benefit: "تجنب النقص في المخزون"
    },
    {
      icon: Calculator,
      title: "جدولة الدفعات الذكية",
      description: "يقترح خطة سداد ذكية لتوزيع المبالغ على الموردين مع إعطاء الأولوية للديون الأقدم",
      location: "الموردون والحسابات",
      color: "medical-secondary",
      benefit: "تحسين التدفق النقدي"
    },
    {
      icon: BarChart3,
      title: "تحليل عُمر الدين",
      description: "يصنف ديونك لكل مورد حسب عمرها ويحدد الديون التي تحتاج إلى اهتمام فوري",
      location: "كشف حساب المورد",
      color: "medical-warning",
      benefit: "إدارة أفضل للديون"
    },
    {
      icon: Zap,
      title: "مساعد الجرعات الذكي",
      description: "يحلل الأدوية في الفاتورة ويقدم ملخصاً عن الجرعات المقترحة والتفاعلات الدوائية",
      location: "صفحة المبيعات",
      color: "medical-info",
      benefit: "رعاية صيدلانية أفضل"
    },
    {
      icon: BookOpen,
      title: "التعليم السريري المستمر",
      description: "قسم تدريبي متكامل يشرح الأمراض الشائعة وربطها بالأدوية المتوفرة",
      location: "قسم التدريب والتطوير",
      color: "medical-purple",
      benefit: "تطوير مهني مستمر"
    },
    // {
    //   icon: UserCheck,
    //   title: "دليل المندوبين",
    //   description: "صفحة خاصة لعرض أحدث المنتجات والعروض من الشركات الطبية والمندوبين المسجلين",
    //   location: "الشبكة والعروض",
    //   color: "medical-success",
    //   benefit: "آخر المنتجات والعروض"
    // }
  ];

  const stats = [
    { icon: Target, value: "99.9%", label: "دقة في التنبؤ", color: "medical-primary" },
    { icon: TrendingUp, value: "+45%", label: "زيادة الأرباح", color: "medical-success" },
    { icon: Clock, value: "24/7", label: "دعم فني", color: "medical-secondary" },
    { icon: TrendingUp, value: "100%", label: "شفافية البيانات", color: "medical-warning" }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-to-b from-background to-accent/10" dir="rtl">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20 animate-fade-in">
          <Badge className="bg-medical-primary/10 text-medical-primary hover:bg-medical-primary/20 mb-6 hover:scale-105 transition-transform duration-200">
            <Star className="w-4 h-4 ml-2" />
            نظام شامل ومتكامل
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in" style={{animationDelay: "0.2s"}}>
            ميزات تقنية متطورة
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">تميز ميدجرام</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: "0.4s"}}>
            ميدجرام ليس مجرد برنامج إدارة، بل شريكك الذكي في تطوير صيدليتك وزيادة أرباحها. 
            نظام متكامل يجمع بين الذكاء الاصطناعي والتقنيات المتطورة لتقديم حلول لا مثيل لها في السوق
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-glow hover:scale-105 transition-all duration-300 animate-fade-in border-0 bg-gradient-card" style={{animationDelay: `${0.1 * index}s`}}>
              <CardContent className="p-0">
                <div className={`w-16 h-16 bg-${stat.color}/10 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:rotate-6 transition-transform duration-300`}>
                  <stat.icon className={`h-8 w-8 text-${stat.color}`} />
                </div>
                <div className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Core Features */}
        <div className="mb-24">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="bg-medical-secondary/10 text-medical-secondary hover:bg-medical-secondary/20 mb-4">
              <Briefcase className="w-4 h-4 ml-2" />
              الميزات الأساسية
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              إدارة شاملة لكافة العمليات
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نظام متكامل يغطي جميع احتياجات صيدليتك من المبيعات إلى الإدارة المالية
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="group hover:shadow-glow hover:scale-[1.02] transition-all duration-500 border-0 bg-gradient-card overflow-hidden animate-fade-in"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <CardContent className="p-8">
                  <div className={`w-16 h-16 bg-${feature.color}/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-8 w-8 text-${feature.color}`} />
                  </div>
                  
                  <h4 className="text-2xl font-bold mb-4 group-hover:text-medical-primary transition-colors duration-300">
                    {feature.title}
                  </h4>
                  
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-sm hover:translate-x-1 transition-transform duration-200">
                        <CheckCircle className={`w-5 h-5 text-${feature.color} flex-shrink-0 mt-0.5`} />
                        <span className="text-foreground leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Smart Features */}
        <div className="mb-20">
          <div className="text-center mb-16 animate-fade-in">
            <Badge className="bg-gradient-primary text-white hover:shadow-glow mb-4">
              <Lightbulb className="w-4 h-4 ml-2" />
              تقنيات الذكاء الاصطناعي
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              الميزات الذكية والمتقدمة
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              تقنيات متطورة تميز ميدجرام عن أي نظام آخر في السوق. هذه الميزات تجعل نظامك شريكاً ذكياً 
              يساعدك على اتخاذ قرارات مالية وتجارية أفضل
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {smartFeatures.map((feature, index) => (
              <Card 
                key={index}
                className="group hover:shadow-glow hover:scale-[1.02] transition-all duration-500 border-0 bg-gradient-card overflow-hidden animate-fade-in relative"
                style={{animationDelay: `${index * 0.1 + 0.4}s`}}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}/5 rounded-full -translate-y-16 translate-x-16`} />
                
                <CardContent className="p-8 relative">
                  <div className={`w-14 h-14 bg-${feature.color}/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-7 w-7 text-${feature.color}`} />
                  </div>
                  
                  <h4 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h4>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm">{feature.description}</p>
                  
                  <div className={`inline-flex items-center gap-2 bg-${feature.color}/10 text-${feature.color} px-3 py-1 rounded-lg text-xs font-medium mb-3`}>
                    <TrendingUp className="w-3 h-3" />
                    <span>{feature.benefit}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <PieChart className="w-3 h-3" />
                    <span>{feature.location}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center animate-fade-in">
          <Card className="border-0 bg-gradient-hero shadow-glow">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-3 h-3 bg-medical-primary rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-medical-secondary rounded-full animate-pulse" style={{animationDelay: "0.5s"}} />
                <div className="w-3 h-3 bg-medical-success rounded-full animate-pulse" style={{animationDelay: "1s"}} />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                استثمر في مستقبل صيدليتك اليوم
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                ميدجرام هو أكثر من مجرد برنامج، هو استثمار في مستقبل صيدليتك وضمان لزيادة أرباحك 
                وتحسين كفاءة عملك. انضم إلى آلاف الصيدليات التي تثق في ميدجرام
              </p>
              <div className="flex justify-center">
                <Link href={isAuthenticated ? "/dashboard" : "/login"}>
                    <button className="bg-gradient-primary text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-glow hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                    {isAuthenticated ? "لوحة التحكم" : "تسجيل الدخول"}
                    <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
