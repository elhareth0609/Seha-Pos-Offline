"use client";

import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { About } from "./components/About";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <About />
        <Features />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { ArrowLeft, BarChart, Boxes, CreditCard, DollarSign, PackagePlus, ShoppingCart, Users } from 'lucide-react';
// import Image from 'next/image';

// const features = [
//   {
//     icon: ShoppingCart,
//     title: 'نظام مبيعات متكامل',
//     description: 'واجهة بيع سريعة تدعم الباركود، تعرض أرباح كل فاتورة، وتنبهك للبدائل وتواريخ الانتهاء.',
//   },
//   {
//     icon: Boxes,
//     title: 'إدارة مخزون ذكية',
//     description: 'تتبع الأصناف، تعديل الأسعار، طباعة الباركود، واستيراد المخزون من ملفات Excel بسهولة.',
//   },
//   {
//     icon: PackagePlus,
//     title: 'إدارة المشتريات والموردين',
//     description: 'سجل قوائم الشراء والمرتجعات، وتتبع ديون الموردين ومدفوعاتك بدقة.',
//   },
//   {
//     icon: BarChart,
//     title: 'تقارير وتحليلات شاملة',
//     description: 'احصل على رؤى حول مبيعاتك، أرباحك، وأداء الموظفين لتحسين قراراتك.',
//   },
//   {
//     icon: Users,
//     title: 'أصدقاء الصيدلية',
//     description: 'أنشئ ملفات للمرضى الدائمين، سجل ملاحظاتك، وتتبع ديونهم لتقديم رعاية أفضل.',
//   },
//   {
//     icon: DollarSign,
//     title: 'إدارة الصرفيات',
//     description: 'سجل وتتبع جميع مصروفات الصيدلية للحصول على صورة مالية كاملة.',
//   },
// ];

// export default function LandingPage() {
//   return (
//     <div className="flex flex-col min-h-screen bg-background">
//       <header className="container mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
//         <Link href="/" className="flex items-center justify-center">
//             <img src="/icon.png" alt="Site Icon" className="h-8 w-8" />
//             <span className="sr-only">Midgram</span>
//         </Link>
//         <Button asChild>
//             <Link href="/login">
//                 تسجيل الدخول <ArrowLeft className="mr-2 h-4 w-4" />
//             </Link>
//         </Button>
//       </header>

//       <main className="flex-1">
//         <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
//           <div className="container px-4 md:px-6">
//             <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
//               <div className="flex flex-col justify-center space-y-4">
//                 <div className="space-y-2">
//                   <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
//                     نظام صيدليتك المتكامل في مكان واحد
//                   </h1>
//                   <p className="max-w-[600px] text-muted-foreground md:text-xl">
//                     ميدجرام يقدم لك الأدوات التي تحتاجها لإدارة المبيعات، المخزون، المشتريات، والزبائن بكفاءة وسهولة.
//                   </p>
//                 </div>
//                 <div className="flex flex-col gap-2 min-[400px]:flex-row">
//                     <Button asChild size="lg">
//                         <Link href="/login">
//                             ابدأ الآن
//                         </Link>
//                     </Button>
//                 </div>
//               </div>
//               <Image
//                 src="https://picsum.photos/seed/pharma-hero/1200/800"
//                 width="600"
//                 height="400"
//                 alt="Hero"
//                 className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
//                 data-ai-hint="pharmacy interior modern"
//               />
//             </div>
//           </div>
//         </section>

//         <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
//           <div className="container px-4 md:px-6">
//             <div className="flex flex-col items-center justify-center space-y-4 text-center">
//               <div className="space-y-2">
//                 <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">مصمم لنجاح صيدليتك</h2>
//                 <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
//                   نظامنا يقدم مجموعة متكاملة من الميزات التي تغطي كل جوانب إدارة الصيدلية الحديثة.
//                 </p>
//               </div>
//             </div>
//             <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
//                 {features.map((feature, index) => (
//                     <Card key={index} className="h-full">
//                         <CardHeader className="flex flex-col items-center text-center">
//                             <div className="p-3 bg-primary/10 rounded-full mb-2">
//                                 <feature.icon className="h-8 w-8 text-primary" />
//                             </div>
//                             <CardTitle>{feature.title}</CardTitle>
//                         </CardHeader>
//                         <CardContent className="text-center">
//                             <p className="text-muted-foreground">{feature.description}</p>
//                         </CardContent>
//                     </Card>
//                 ))}
//             </div>
//           </div>
//         </section>
//       </main>

//       <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
//         <p className="text-xs text-muted-foreground">&copy; 2024 ميدجرام. جميع الحقوق محفوظة.</p>
//       </footer>
//     </div>
//   )
// }
