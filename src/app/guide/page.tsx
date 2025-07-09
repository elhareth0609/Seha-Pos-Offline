
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { HelpCircle, LayoutDashboard, ShoppingCart, Boxes, Truck, Landmark, FileText, Users, CalendarX2, Settings, Upload, KeyRound, LogIn, UserPlus, Repeat, Trash2 } from "lucide-react"

const guideSections = [
    {
        icon: KeyRound,
        title: "البدء: الإعداد وتسجيل الدخول",
        content: [
            {
                subTitle: "الإعداد لأول مرة",
                icon: UserPlus,
                text: "عند تشغيل التطبيق لأول مرة، سيُطلب منك إعداد حساب المدير. ستحتاج إلى إدخال اسمك، بريدك الإلكتروني، وتعيين رمز PIN سري مكون من 4 أرقام. هذا الحساب سيكون له صلاحيات كاملة على النظام.",
            },
            {
                subTitle: "تسجيل الدخول",
                icon: LogIn,
                text: "بعد الإعداد، ستستخدم بريدك الإلكتروني ورمز PIN للوصول إلى التطبيق. هذا يضمن حماية بيانات صيدليتك.",
            },
            {
                subTitle: "نسيت رمز PIN؟",
                icon: HelpCircle,
                text: "في شاشة تسجيل الدخول، يمكنك استخدام خيار 'هل نسيت رمز PIN؟' لإعادة تعيينه. ستحتاج إلى تأكيد بريدك الإلكتروني وتعيين رمز جديد.",
            },
        ],
    },
    {
        icon: LayoutDashboard,
        title: "لوحة التحكم",
        content: [
            {
                text: "توفر لوحة التحكم نظرة شاملة وسريعة على أهم مؤشرات الصيدلية. يمكنك رؤية إجمالي الإيرادات، إجمالي ديون الموردين، عدد الأصناف التي تحتاج لإعادة طلب، وعدد الأصناف التي قاربت على الانتهاء. كما تعرض رسماً بيانياً للمبيعات وجداول مختصرة لأحدث العمليات.",
            },
        ],
    },
    {
        icon: ShoppingCart,
        title: "المبيعات",
        content: [
            {
                text: "هذه هي شاشتك الرئيسية للبيع. يمكنك البحث عن الأدوية بالاسم أو الباركود، أو استخدام ماسح الباركود لإضافتها بسرعة إلى الفاتورة. كل منتج في الفاتورة يعرض كلفته وربحه لتكون على دراية كاملة. النظام ينبهك إذا كان سعر البيع أقل من الكلفة. بعد إتمام العملية، يمكنك طباعة فاتورة احترافية للزبون.",
            },
        ],
    },
    {
        icon: Boxes,
        title: "المخزون",
        content: [
            {
                text: "من هنا يمكنك إدارة مخزونك بالكامل. ابحث عن أي دواء، قم بتصفية النتائج حسب الفئة، عدّل تفاصيل الأدوية مثل السعر ونقطة إعادة الطلب، واطبع باركود لأي منتج بضغطة زر.",
            },
        ],
    },
    {
        icon: Truck,
        title: "المشتريات",
        content: [
            {
                text: "هذه الصفحة مخصصة لإدارة مشترياتك ومرتجعاتك للموردين. استخدم تبويب 'استلام بضاعة' لإدخال الأدوية الجديدة إلى مخزونك وتحديث أرصدتها. استخدم 'إرجاع للمورد' لتسجيل الأدوية المرتجعة، وسيتم تحديث المخزون وحسابات الموردين تلقائياً.",
            },
        ],
    },
    {
        icon: Landmark,
        title: "الموردون والحسابات",
        content: [
            {
                text: "هنا يمكنك تتبع الوضع المالي مع كل مورد. تعرض الصفحة صافي الدين المستحق لكل مورد، والذي يتم تحديثه تلقائيًا مع كل عملية شراء أو إرجاع. يمكنك أيضًا تسجيل الدفعات التي تقوم بها للموردين لتصفية حساباتك.",
            },
        ],
    },
    {
        icon: FileText,
        title: "التقارير",
        content: [
            {
                text: "توفر صفحة التقارير تحليلاً كاملاً لمبيعاتك. يمكنك رؤية إجمالي المبيعات وصافي الأرباح، وتصفية النتائج حسب الموظف لعرض أداء كل فرد في الفريق. يمكنك أيضًا طباعة أي فاتورة سابقة من هنا.",
            },
        ],
    },
    {
        icon: Repeat,
        title: "حركة المادة",
        content: [
            {
                text: "هذا القسم يوفر لك سجلاً كاملاً لكل حركة تمت على أي دواء في مخزونك. ابحث عن دواء معين لعرض تفاصيل كل عملية شراء، بيع، مرتجع زبون، أو مرتجع للمورد، مع التاريخ، الكمية، والسعر، مما يمنحك شفافية مطلقة.",
            },
        ],
    },
    {
        icon: Users,
        title: "أصدقاء الصيدلية",
        content: [
            {
                text: "هذه الميزة مصممة لمساعدتك في تقديم رعاية أفضل لمرضاك الدائمين، خاصة الذين يعانون من أمراض مزمنة. يمكنك إنشاء ملف لكل مريض، تسجيل ملاحظات خاصة به، وربط أدويته المعتادة بملفه لتذكيره بها في كل زيارة.",
            },
        ],
    },
    {
        icon: CalendarX2,
        title: "قريب الانتهاء",
        content: [
            {
                text: "تعرض هذه الصفحة قائمة بجميع الأدوية التي ستنتهي صلاحيتها قريبًا، بناءً على الفترة الزمنية التي تحددها في الإعدادات (افتراضيًا 90 يومًا). هذا يساعدك على إدارة المخزون وتقليل الخسائر.",
            },
        ],
    },
    {
        icon: Trash2,
        title: "سلة المحذوفات",
        content: [
            {
                text: "عندما تقوم بحذف أي عنصر (دواء، مريض، مورد، موظف) فإنه لا يُحذف نهائياً، بل يُنقل إلى هنا. من سلة المحذوفات، يمكنك استعادة العناصر المحذوفة إلى مكانها الأصلي، أو حذفها بشكل دائم. الحذف النهائي وتفريغ السلة هي صلاحيات حصرية للمدير فقط.",
            },
        ],
    },
    {
        icon: Settings,
        title: "الإعدادات والبيانات",
        content: [
            {
                subTitle: "الإعدادات العامة",
                icon: Settings,
                text: "من هنا يمكنك تعديل معلومات صيدليتك الأساسية مثل الاسم والعنوان، وتحديد فترة التنبيه لانتهاء الصلاحية.",
            },
            {
                subTitle: "النسخ الاحتياطي والاستيراد",
                icon: Upload,
                text: "لأمان بياناتك، يمكنك أخذ نسخة احتياطية من جميع بيانات التطبيق (المخزون، المبيعات، إلخ) وحفظها كملف على جهازك. يمكنك لاحقًا استيراد هذا الملف لاستعادة بياناتك بالكامل. يمكن الوصول لهذه الميزة من القائمة الرئيسية.",
            },
        ],
    },
];

export default function GuidePage() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <HelpCircle className="h-10 w-10 text-primary" />
                    <div>
                        <CardTitle className="text-3xl">دليل استخدام البرنامج</CardTitle>
                        <CardDescription>
                            مرجعك السريع لفهم جميع ميزات ووظائف نظام إدارة الصيدلية.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {guideSections.map((section, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-xl hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <section.icon className="h-6 w-6 text-primary" />
                                    {section.title}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-muted/50 rounded-md border-s-4 border-primary space-y-4">
                               {section.content.map((item, itemIndex) => (
                                   <div key={itemIndex}>
                                        {item.subTitle && (
                                            <div className="flex items-center gap-2 mb-2">
                                                {item.icon && <item.icon className="h-5 w-5 text-muted-foreground" />}
                                                <h4 className="font-semibold text-lg">{item.subTitle}</h4>
                                            </div>
                                        )}
                                        <p className="text-muted-foreground text-base leading-relaxed">
                                            {item.text}
                                        </p>
                                   </div>
                               ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}
