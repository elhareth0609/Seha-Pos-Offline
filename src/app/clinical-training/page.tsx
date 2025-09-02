
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartPulse, Heart, Wind, Activity, Bug, Scale, Pill } from 'lucide-react';
import type { Medication, ClinicalTrainingContent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const clinicalContent: ClinicalTrainingContent[] = [
    {
        system: 'الجهاز القلبي الوعائي',
        icon: Heart,
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
        icon: Bug,
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
            },
            {
                name: 'السيفالوسبورينات (Cephalosporins)',
                overview: 'مجموعة أخرى من المضادات الحيوية تشبه البنسلين في آلية عملها، ولكنها مقسمة إلى أجيال حسب طيف فعاليتها.',
                drugClasses: [
                    { name: 'الجيل الأول', mechanism: 'فعال بشكل أساسي ضد البكتيريا موجبة الجرام.', scientific_names: ['cephalexin', 'cefadroxil'] },
                    { name: 'الجيل الثاني', mechanism: 'طيف أوسع يشمل بعض البكتيريا سالبة الجرام.', scientific_names: ['cefaclor', 'cefuroxime'] },
                    { name: 'الجيل الثالث', mechanism: 'أكثر فعالية ضد البكتیيريا سالبة الجرام، وتستخدم للعدوى الأكثر خطورة.', scientific_names: ['cefixime', 'ceftriaxone', 'cefdinir'] },
                ],
                counselingPoints: [
                    'يجب إكمال كورس العلاج كاملاً.',
                    'أبلغ الطبيب إذا كان لديك حساسية معروفة للبنسلين.',
                    'تجنب تناول الكحول مع بعض أنواع السيفالوسبورينات.',
                ]
            }
        ]
    },
    {
        system: 'الجهاز التنفسي',
        icon: Wind,
        diseases: [
            {
                name: 'الربو (Asthma)',
                overview: 'مرض مزمن يسبب التهاب وتضيق في المسالك الهوائية، مما يؤدي إلى صعوبة في التنفس، سعال، وصفير في الصدر.',
                drugClasses: [
                    { name: 'موسعات الشعب الهوائية قصيرة المفعول (SABAs)', mechanism: 'تعمل بسرعة على إرخاء العضلات حول الشعب الهوائية لتخفيف الأعراض الحادة.', scientific_names: ['salbutamol', 'albuterol'] },
                    { name: 'الكورتيكوستيرويدات المستنشقة (ICS)', mechanism: 'تقلل من الالتهاب في المسالك الهوائية، وهي العلاج الأساسي للتحكم في الربو على المدى الطويل.', scientific_names: ['budesonide', 'fluticasone', 'beclomethasone'] },
                    { name: 'مزيج ICS و LABA', mechanism: 'يجمع بين مضاد للالتهاب وموسع للشعب الهوائية طويل المفعول للتحكم المستمر.', scientific_names: ['budesonide/formoterol', 'fluticasone/salmeterol'] },
                ],
                counselingPoints: [
                    'تعلم كيفية استخدام البخاخ بشكل صحيح.',
                    'استخدم البخاخ الإنقاذي (SABA) فقط عند الحاجة، وليس بشكل منتظم.',
                    'اغسل فمك بالماء بعد استخدام بخاخ الكورتيزون لمنع الفطريات.',
                ]
            }
        ]
    },
    {
        system: 'الجهاز الهضمي',
        icon: Activity,
        diseases: [
            {
                name: 'مرض الارتجاع المعدي المريئي (GERD)',
                overview: 'حالة يرتد فيها حمض المعدة بشكل متكرر إلى المريء، مما يسبب حرقة وأعراض أخرى.',
                drugClasses: [
                    { name: 'مثبطات مضخة البروتون (PPIs)', mechanism: 'تقلل من إنتاج حمض المعدة بشكل فعال، وهي العلاج الأكثر شيوعاً.', scientific_names: ['omeprazole', 'esomeprazole', 'lansoprazole', 'pantoprazole'] },
                    { name: 'حاصرات H2', mechanism: 'تقلل من إنتاج الحمض ولكنها أقل قوة من PPIs.', scientific_names: ['ranitidine', 'famotidine'] },
                ],
                counselingPoints: [
                    'يُفضل تناول أدوية PPIs قبل 30-60 دقيقة من وجبة الإفطار.',
                    'تجنب الأطعمة والمشروبات التي تزيد من الأعراض (مثل الأطعمة الدهنية، القهوة، الشوكولاتة).',
                    'حاول عدم الاستلقاء مباشرة بعد تناول الطعام.',
                ]
            }
        ]
    },
    {
        system: 'الغدد الصماء',
        icon: Scale,
        diseases: [
            {
                name: 'مرض السكري من النوع الثاني',
                overview: 'مرض مزمن يؤثر على كيفية معالجة الجسم لسكر الدم (الجلوكوز)، إما بسبب عدم إنتاج كمية كافية من الأنسولين أو مقاومة الجسم للأنسولين.',
                drugClasses: [
                    { name: 'Biguanides', mechanism: 'يقلل من إنتاج الجلوكوز في الكبد ويحسن من حساسية الجسم للأنسولين.', scientific_names: ['metformin'] },
                    { name: 'Sulfonylureas', mechanism: 'تحفز البنكرياس على إفراز المزيد من الأنسولين.', scientific_names: ['glibenclamide', 'gliclazide', 'glimepiride'] },
                    { name: 'DPP-4 Inhibitors', mechanism: 'تزيد من مستويات هرمونات طبيعية تساعد على التحكم في سكر الدم.', scientific_names: ['sitagliptin', 'vildagliptin', 'saxagliptin'] },
                    { name: 'SGLT2 Inhibitors', mechanism: 'تساعد الكلى على التخلص من الجلوكوز الزائد عن طريق البول.', scientific_names: ['dapagliflozin', 'empagliflozin', 'canagliflozin'] },
                ],
                counselingPoints: [
                    'تناول دواء Metformin مع الطعام لتقليل اضطراب المعدة.',
                    'راقب مستويات سكر الدم بانتظام كما نصحك الطبيب.',
                    'انتبه لأعراض هبوط السكر (الدوخة، التعرق، الرعشة) خاصة مع أدوية السلفونيل يوريا.',
                    'اتباع نظام غذائي صحي وممارسة الرياضة جزء أساسي من العلاج.',
                ]
            }
        ]
    },
    {
        system: 'الألم والالتهاب',
        icon: Activity,
        diseases: [
            {
                name: 'مسكنات الألم الشائعة',
                overview: 'أدوية تستخدم للأوجاع البسيطة إلى المتوسطة مثل الصداع، آلام العضلات، ولخفض درجة الحرارة.',
                drugClasses: [
                    { name: 'Paracetamol / Acetaminophen', mechanism: 'يعمل بشكل مركزي في الدماغ لتخفيف الألم وخفض الحرارة. آمن على المعدة.', scientific_names: ['paracetamol', 'acetaminophen'] },
                ],
                counselingPoints: [
                    'لا تتجاوز الجرعة اليومية القصوى (عادة 4 غرامات للبالغين) لتجنب تلف الكبد.',
                    'تأكد من عدم تناول منتجات أخرى تحتوي على الباراسيتامول في نفس الوقت.',
                ]
            },
            {
                name: 'مضادات الالتهاب غير الستيرويدية (NSAIDs)',
                overview: 'مجموعة من الأدوية تستخدم لتخفيف الألم، تقليل الالتهاب، وخفض الحمى.',
                drugClasses: [
                    { name: 'غير انتقائية (Non-selective)', mechanism: 'تثبط إنزيمات COX-1 و COX-2، مما قد يؤثر على المعدة.', scientific_names: ['ibuprofen', 'diclofenac', 'naproxen', 'piroxicam', 'mefenamic acid'] },
                    { name: 'انتقائية (COX-2 Inhibitors)', mechanism: 'تستهدف بشكل أساسي إنزيم COX-2 المسؤول عن الالتهاب، مما يقلل من التأثير على المعدة.', scientific_names: ['celecoxib', 'etoricoxib'] },
                ],
                counselingPoints: [
                    'تناول معظم أنواع الـ NSAIDs مع الطعام لحماية المعدة.',
                    'استشر الطبيب قبل استخدامها إذا كنت تعاني من مشاكل في القلب، الكلى، أو قرحة في المعدة.',
                    'لا تستخدم لفترات طويلة دون استشارة طبية.'
                ]
            },
            {
                name: 'أدوية النقرس (Gout)',
                overview: 'أدوية تستخدم لعلاج نوبات النقرس الحادة أو للوقاية منها عن طريق تقليل مستويات حمض اليوريك في الدم.',
                drugClasses: [
                     { name: 'للعلاج الحاد (Acute Attack)', mechanism: 'يقلل الالتهاب والألم أثناء نوبة النقرس.', scientific_names: ['colchicine'] },
                     { name: 'للوقاية (Prevention)', mechanism: 'يمنع إنتاج حمض اليوريك في الجسم.', scientific_names: ['allopurinol', 'febuxostat'] },
                ],
                counselingPoints: [
                     'يجب شرب كميات كبيرة من الماء مع أدوية الوقاية.',
                     'قد تحدث نوبات نقرس في بداية العلاج الوقائي، قد يصف الطبيب علاجاً إضافياً لهذه الفترة.',
                     'يجب تناول الكولشيسين عند أول علامة للنوبة الحادة.'
                ]
            },
            {
                name: 'مرخيات العضلات (Muscle Relaxants)',
                overview: 'تستخدم لتخفيف التشنجات العضلية والألم المصاحب لها.',
                drugClasses: [
                     { name: 'مرخيات العضلات', mechanism: 'تعمل مركزياً على الجهاز العصبي لتقليل التوتر العضلي.', scientific_names: ['orphenadrine', 'carisoprodol', 'cyclobenzaprine', 'tizanidine'] },
                ],
                counselingPoints: [
                    'قد تسبب النعاس والدوخة، لذا يجب تجنب القيادة أو تشغيل الآلات الثقيلة.',
                    'يُفضل استخدامها لفترات قصيرة.',
                    'لا تتناولها مع الكحول أو المهدئات الأخرى.'
                ]
            }
        ]
    },
    {
        system: 'أدوية بدون وصفة (OTC)',
        icon: Pill,
        diseases: [
            {
                name: 'أدوية السعال والزكام',
                overview: 'مجموعة متنوعة من الأدوية لتخفيف أعراض نزلات البرد الشائعة.',
                drugClasses: [
                    { name: 'مضادات الهيستامين (Antihistamines)', mechanism: 'تخفف أعراض الحساسية مثل العطاس، سيلان الأنف، والدموع.', scientific_names: ['chlorpheniramine', 'diphenhydramine', 'loratadine', 'cetirizine'] },
                    { name: 'مزيلات الاحتقان (Decongestants)', mechanism: 'تقلل من تورم الأوعية الدموية في الأنف لتسهيل التنفس.', scientific_names: ['pseudoephedrine', 'phenylephrine', 'xylometazoline'] },
                    { name: 'طاردات البلغم (Expectorants)', mechanism: 'تساعد على تليين البلغم وتسهيل خروجه من الشعب الهوائية.', scientific_names: ['guaifenesin'] },
                    { name: 'مهدئات السعال (Antitussives)', mechanism: 'تعمل على تثبيط مركز السعال في الدماغ لتهدئة السعال الجاف وغير المنتج.', scientific_names: ['dextromethorphan'] },
                ],
                counselingPoints: [
                    'بعض مضادات الهيستامين (الجيل الأول) تسبب النعاس، تجنب القيادة بعدها.',
                    'لا تستخدم مزيلات الاحتقان الموضعية (بخاخات الأنف) لأكثر من 3-5 أيام.',
                    'مرضى الضغط والسكري يجب أن يستشيروا الصيدلي قبل استخدام مزيلات الاحتقان.',
                ]
            },
            {
                name: 'مضادات الحموضة',
                overview: 'أدوية لمعالجة حرقة المعدة وعسر الهضم عن طريق معادلة حمض المعدة.',
                drugClasses: [
                    { name: 'معادلات الحموضة (Antacids)', mechanism: 'تعمل بسرعة على معادلة حمض المعدة الموجود وتوفر راحة سريعة ومؤقتة.', scientific_names: ['calcium carbonate', 'magnesium hydroxide', 'aluminum hydroxide'] },
                ],
                counselingPoints: [
                    'يتم تناولها عند الشعور بالحرقة للحصول على راحة سريعة.',
                    'قد تؤثر على امتصاص أدوية أخرى، لذا يجب المباعدة بينها وبين الأدوية الأخرى بساعتين على الأقل.',
                    'إذا استمرت الأعراض، يجب مراجعة الطبيب.',
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
