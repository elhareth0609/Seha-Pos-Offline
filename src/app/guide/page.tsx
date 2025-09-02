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
import { HelpCircle, LayoutDashboard, ShoppingCart, Boxes, Truck, Landmark, FileText, Users, CalendarX2, Settings, Upload, KeyRound, LogIn, UserPlus, BrainCircuit, ListChecks } from "lucide-react"

type BaseContentItem = {
    text: string;
}

type DetailedContentItem = BaseContentItem & {
    subTitle: string;
    icon: React.ComponentType<any>;
}

type ContentItem = BaseContentItem | DetailedContentItem;

type GuideSection = {
    icon: React.ComponentType<any>;
    title: string;
    content: ContentItem[];
}

const guideSections: GuideSection[] = [
    {
        icon: KeyRound,
        title: "البدء: الإعداد وتسجيل الدخول",
        content: [
            {
                subTitle: "الإعداد لأول مرة",
                icon: UserPlus,
                text: "عند تشغيل التطبيق لأول مرة، سيُطلب منك إعداد حساب المدير. ستحتاج إلى إدخال اسمك، بريدك الإلكتروني، وتعيين رمز PIN سري مكون من 6 رموز. هذا الحساب سيكون له صلاحيات كاملة على النظام.",
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
                text: "توفر لوحة التحكم نظرة شاملة وسريعة على أهم مؤشرات الصيدلية. يمكنك رؤية إجمالي الإيرادات، صافي الربح، الأصناف التي تحتاج لإعادة طلب، والأصناف التي قاربت على الانتهاء. كما تعرض رسوماً بيانية للمبيعات وجداول مختصرة لأحدث العمليات.",
            },
        ],
    },
    {
        icon: ShoppingCart,
        title: "المبيعات",
        content: [
            {
                text: "هذه هي شاشتك الرئيسية للبيع. يمكنك البحث عن الأدوية بالاسم أو الباركود، أو استخدام ماسح الباركود لإضافتها بسرعة إلى الفاتورة. كل منتج في الفاتورة يعرض كلفته وربحه لتكون على دراية كاملة. النظام ينبهك إذا كان سعر البيع أقل من الكلفة، أو إذا كان هناك بديل بتاريخ انتهاء أقرب. بعد إتمام العملية، يمكنك طباعة فاتورة احترافية للزبون.",
            },
             {
                subTitle: "مساعد الجرعات الذكي",
                icon: BrainCircuit,
                text: "في صفحة المبيعات، يمكنك استخدام 'مساعد الجرعات الذكي'. أدخل عمر المريض، وسيقوم الذكاء الاصطناعي بتحليل الأدوية في الفاتورة، ويقترح الجرعات المناسبة، ويكشف عن أي تفاعلات دوائية محتملة، ويقدم تحذيرات هامة.",
            },
        ],
    },
    {
        icon: Boxes,
        title: "المخزون",
        content: [
            {
                text: "من هنا يمكنك إدارة مخزونك بالكامل. ابحث عن أي دواء، قم بتصفية النتائج حسب الفئة أو حالة المخزون، عدّل تفاصيل الأدوية مثل السعر ونقطة إعادة الطلب، واطبع باركود لأي منتج بضغطة زر. يمكنك أيضاً استيراد قائمة مخزون كاملة من ملف Excel.",
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
                text: "هنا يمكنك تتبع الوضع المالي مع كل مورد. تعرض الصفحة صافي الدين المستحق لكل مورد، والذي يتم تحديثه تلقائيًا مع كل عملية شراء أو إرجاع. يمكنك أيضًا تسجيل الدفعات التي تقوم بها للموردين وعرض كشف حساب تفصيلي لكل مورد.",
            },
        ],
    },
    {
        icon: FileText,
        title: "الفواتير",
        content: [
            {
                text: "توفر صفحة الفواتير تحليلاً كاملاً لمبيعاتك. يمكنك رؤية إجمالي المبيعات وصافي الأرباح، وتصفية النتائج حسب الموظف أو طريقة الدفع لعرض أداء كل فرد في الفريق. يمكنك أيضًا طباعة أو تعديل أو حذف أي فاتورة سابقة من هنا.",
            },
        ],
    },
    {
        icon: Users,
        title: "أصدقاء الصيدلية",
        content: [
            {
                text: "هذه الميزة مصممة لمساعدتك في تقديم رعاية أفضل لمرضاك الدائمين، خاصة الذين يعانون من أمراض مزمنة. يمكنك إنشاء ملف لكل مريض، تسجيل ملاحظات خاصة به، وربط أدويته المعتادة بملفه لتذكيره بها في كل زيارة. كما يمكنك تتبع ديونهم وعرض كشف حساب لكل منهم.",
            },
        ],
    },
    {
        icon: ListChecks,
        title: "المهام",
        content: [
            {
                text: "يمكن للمدير إسناد مهام محددة للموظفين (مثل: تنظيف الرفوف، جرد قسم معين). يتلقى الموظف إشعارًا بالمهمة ويمكنه تحديدها كـ 'منجزة' عند الانتهاء، مما يساعد على تنظيم العمل وتوزيعه بفاعلية.",
            },
        ],
    },
    {
        icon: CalendarX2,
        title: "قريب الانتهاء والتوالف",
        content: [
            {
                text: "تعرض هذه الصفحة قائمة بجميع الأدوية التي ستنتهي صلاحيتها قريبًا، بناءً على الفترة الزمنية التي تحددها في الإعدادات. هذا يساعدك على إدارة المخزون وتقليل الخسائر. يمكنك أيضاً نقل الأدوية المنتهية إلى قائمة 'التالف' لتتبع الخسائر بدقة.",
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
                subTitle: "الحذف الآمن",
                icon: KeyRound,
                text: "يمكنك تفعيل خيار طلب رمز PIN قبل تنفيذ أي عملية حذف (مثل حذف فاتورة أو دواء). هذا يوفر طبقة حماية إضافية لمنع الحذف غير المقصود.",
            },
            {
                subTitle: "النسخ الاحتياطي والاستيراد",
                icon: Upload,
                text: "لأمان بياناتك، يمكنك أخذ نسخة احتياطية من جميع بيانات التطبيق (المخزون، المبيعات، إلخ) وحفظها كملف على جهازك. يمكنك لاحقًا استيراد هذا الملف لاستعادة بياناتك بالكامل. يمكن الوصول لهذه الميزة من القائمة الرئيسية.",
            },
        ],
    },
];

function isDetailedContentItem(item: ContentItem): item is DetailedContentItem {
    return 'subTitle' in item && 'icon' in item;
}

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
                                        {isDetailedContentItem(item) ? (
                                            <>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <item.icon className="h-5 w-5 text-muted-foreground" />
                                                    <h4 className="font-semibold text-lg">{item.subTitle}</h4>
                                                </div>
                                                <p className="text-muted-foreground text-base leading-relaxed ms-7">
                                                    {item.text}
                                                </p>
                                            </>
                                        ) : (
                                             <p className="text-muted-foreground text-base leading-relaxed">
                                                {item.text}
                                            </p>
                                        )}
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
