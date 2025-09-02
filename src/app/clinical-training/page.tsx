
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartPulse, Stethoscope, Brain, Shield, TestTube, Bone, Droplets } from 'lucide-react';
import type { Medication, ClinicalTrainingContent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const clinicalContent: ClinicalTrainingContent[] = [
    {
        system: 'الجهاز القلبي الوعائي',
        icon: HeartPulse,
        diseases: [
            {
                name: 'ارتفاع ضغط الدم (Hypertension)',
                overview: 'حالة يكون فيها ضغط الدم على جدران الشرايين مرتفعاً بشكل مستمر، مما يزيد من خطر الإصابة بأمراض القلب والسكتة الدماغية.',
                drugClasses: [
                    { name: 'حاصرات بيتا (Beta-Blockers)', mechanism: 'تقلل من سرعة نبضات القلب وقوة ضخه، مما يخفض ضغط الدم.', scientific_names: ['bisoprolol', 'atenolol', 'metoprolol', 'carvedilol'] },
                    { name: 'مثبطات الإنزيم المحول للأنجيوتنسين (ACE Inhibitors)', mechanism: 'تمنع إنتاج هرمون يسبب تضيق الأوعية الدموية، مما يساعد على استرخائها.', scientific_names: ['captopril', 'enalapril', 'lisinopril', 'ramipril'] },
                    { name: 'مضادات مستقبلات الأنجيوتنسين II (ARBs)', mechanism: 'تمنع تأثير هرمون الأنجيوتنسين II، مما يؤدي إلى توسع الأوعية الدموية.', scientific_names: ['losartan', 'valsartan', 'candesartan', 'telmisartan'] },
                    { name: 'حاصرات قنوات الكالسيوم (CCBs)', mechanism: 'تمنع الكالسيوم من دخول خلايا القلب والأوعية الدموية، مما يسبب استرخائها.', scientific_names: ['amlodipine', 'nifedipine', 'diltiazem', 'verapamil'] },
                    { name: 'المدررات (Diuretics)', mechanism: 'تساعد الجسم على التخلص من الملح والماء الزائد، مما يقلل من حجم الدم وضغطه.', scientific_names: ['hydrochlorothiazide', 'furosemide', 'spironolactone'] },
                ],
                counselingPoints: [
                    'قِس ضغطك بانتظام في المنزل.',
                    'قلل من تناول الملح (الصوديوم) في طعامك.',
                    'انتبه للأعراض الجانبية مثل الدوخة، التعب، أو السعال الجاف مع بعض الأدوية.',
                    'لا تتوقف عن تناول الدواء فجأة دون استشارة الطبيب.'
                ]
            }
        ]
    },
    {
        system: 'المضادات الحيوية والأمراض المعدية',
        icon: Shield,
        diseases: [
            {
                name: 'البنسلينات (Penicillins)',
                overview: 'مجموعة واسعة من المضادات الحيوية الفعالة ضد العديد من أنواع البكتيريا. تعمل عن طريق تثبيط بناء جدار الخلية البكتيرية.',
                drugClasses: [
                    { name: 'بنسلينات طبيعية', mechanism: 'فعالة ضد البكتيريا موجبة الجرام.', scientific_names: ['penicillin g', 'penicillin v'] },
                    { name: 'أمينوبنسلينات', mechanism: 'أوسع طيفاً من البنسلينات الطبيعية، فعالة ضد بعض البكتيريا سالبة الجرام.', scientific_names: ['amoxicillin', 'ampicillin'] },
                    { name: 'مقاومة للبيتا-لاكتاميز', mechanism: 'مصممة لمقاومة الإنزيمات التي تفرزها بعض البكتيريا لتحطيم البنسلين.', scientific_names: ['cloxacillin', 'dicloxacillin', 'flucloxacillin'] },
                    { name: 'مع مثبطات البيتا-لاكتاميز', mechanism: 'مزيج يجمع بين أمينوبنسلين ومادة تحميها من تحطيم البكتيريا، مما يزيد من فعاليتها.', scientific_names: ['amoxicillin/clavulanic acid', 'ampicillin/sulbactam'] },
                ],
                counselingPoints: [
                    'يجب إكمال كورس العلاج كاملاً حتى لو شعرت بتحسن لمنع عودة العدوى.',
                    'بعض الأنواع (مثل Augmentin) يُفضل تناولها مع الطعام لتقليل اضطراب المعدة.',
                    'انتبه جيداً لأي علامات حساسية (طفح جلدي، صعوبة في التنفس) وأبلغ الطبيب فوراً.',
                    'قد تقلل من فعالية بعض أنواع حبوب منع الحمل.'
                ]
            }
        ]
    }
];

export default function ClinicalTrainingPage() {
    const { scopedData } = useAuth();
    const [inventory, setInventory] = React.useState<Medication[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        if (scopedData.inventory[0]) {
            setInventory(scopedData.inventory[0]);
            setLoading(false);
        }
    }, [scopedData.inventory]);

    const findMedsInStock = (scientificNames: string[]) => {
        if (!inventory || inventory.length === 0) return [];
        const lowerCaseNames = scientificNames.map(n => n.toLowerCase());
        
        return inventory.filter(med => 
            med.scientific_names?.some(sn => lowerCaseNames.includes(sn.toLowerCase()))
        );
    };

    if (loading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <HeartPulse className="h-10 w-10 text-primary" />
                    <div>
                        <CardTitle className="text-3xl">التدريب السريري</CardTitle>
                        <CardDescription>
                            دليلك العملي لفهم الأمراض الشائعة وربطها بالأدوية المتوفرة في صيدليتك.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {clinicalContent.map((system, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-xl hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <system.icon className="h-6 w-6 text-primary" />
                                    {system.system}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-muted/50 rounded-md border-s-4 border-primary space-y-6">
                                {system.diseases.map((disease, dIndex) => (
                                    <div key={dIndex}>
                                        <h3 className="text-lg font-bold mb-2">{disease.name}</h3>
                                        <p className="text-muted-foreground mb-4">{disease.overview}</p>
                                        
                                        <h4 className="font-semibold mb-2">مجموعات الأدوية وخياراتك في الصيدلية:</h4>
                                        <div className="space-y-3">
                                            {disease.drugClasses.map((dClass, cIndex) => {
                                                const medsInStock = findMedsInStock(dClass.scientific_names);
                                                return (
                                                <div key={cIndex} className="p-3 border rounded-md bg-background">
                                                    <p className="font-semibold">{dClass.name}</p>
                                                    <p className="text-xs text-muted-foreground mb-2">{dClass.mechanism}</p>
                                                    {medsInStock.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="text-sm font-medium">متوفر لديك:</span>
                                                            {medsInStock.map(med => (
                                                                <div key={med.id} className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">{med.name}</div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                         <p className="text-sm text-amber-600">لا توجد أصناف من هذه المجموعة في المخزون حاليًا.</p>
                                                    )}
                                                </div>
                                            )})}
                                        </div>
                                        
                                        <h4 className="font-semibold mt-4 mb-2">أهم النصائح للمريض:</h4>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {disease.counselingPoints.map((point, pIndex) => (
                                                <li key={pIndex}>{point}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}

