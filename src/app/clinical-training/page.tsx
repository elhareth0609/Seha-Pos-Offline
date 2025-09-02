
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartPulse, Baby, Pregnant, Brain, Wind, Activity, Bug, Scale, Pill, Droplets, Shield, Stethoscope, Bone } from 'lucide-react';
import type { Medication } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type DrugClassInfo = {
    name: string;
    mechanism?: string;
    scientific_names: string[];
};

type DiseaseInfo = {
    name: string;
    overview: string;
    drugClasses: DrugClassInfo[];
    counselingPoints: string[];
};

type ClinicalSystem = {
    system: string;
    icon: React.ComponentType<any>;
    diseases: DiseaseInfo[];
};

const clinicalContent: ClinicalSystem[] = [
    {
        system: 'صحة الأطفال والرضع',
        icon: Baby,
        diseases: [
            {
                name: 'تخفيف الألم وخفض الحرارة',
                overview: 'الحمى والألم من أكثر الأعراض شيوعاً عند الأطفال. من المهم استخدام المسكنات الآمنة بالجرعات الصحيحة.',
                drugClasses: [
                    { name: 'Paracetamol', scientific_names: ['Paracetamol (Acetaminophen)'], mechanism: 'يعمل كمسكن للألم وخافض للحرارة. يعتبر الخيار الأول والأكثر أماناً.' },
                    { name: 'Ibuprofen', scientific_names: ['Ibuprofen'], mechanism: 'يعمل كمسكن ومضاد للالتهاب. لا يُعطى للرضع أقل من 3-6 أشهر أو في حالات الجفاف.' },
                ],
                counselingPoints: [
                    'احسب الجرعة دائماً بناءً على وزن الطفل، وليس عمره.',
                    'الجرعة المعتادة للباراسيتامول: 10-15 ملغ/كغ كل 4-6 ساعات.',
                    'الجرعة المعتادة للآيبوبروفين: 5-10 ملغ/كغ كل 6-8 ساعات.',
                    'استخدم أداة القياس المرفقة مع الدواء دائماً (قطارة أو محقنة).',
                ]
            },
            {
                name: 'السعال والزكام',
                overview: 'لا يُنصح باستخدام أدوية السعال والزكام المركبة للأطفال أقل من 6 سنوات. العلاج يعتمد على تخفيف الأعراض.',
                drugClasses: [
                    { name: 'محلول ملحي للأنف', scientific_names: ['Saline Nasal Spray/Drops'], mechanism: 'يساعد على ترطيب الأنف وتخفيف الاحتقان.' },
                    { name: 'مضادات الهيستامين (الجيل الأول)', scientific_names: ['Chlorpheniramine', 'Diphenhydramine'], mechanism: 'قد تساعد على تقليل سيلان الأنف وتساعد على النوم. تستخدم بحذر.' },
                ],
                counselingPoints: [
                    'شجع على شرب الكثير من السوائل.',
                    'استخدم جهاز ترطيب الهواء في غرفة الطفل.',
                    'راجع الطبيب إذا كانت الأعراض شديدة أو استمرت لفترة طويلة.',
                ]
            },
        ]
    },
    {
        system: 'صحة المرأة (الحمل والرضاعة)',
        icon: Pregnant,
        diseases: [
            {
                name: 'الأدوية الآمنة أثناء الحمل',
                overview: 'قائمة ببعض الأدوية التي تعتبر آمنة بشكل عام خلال فترة الحمل، ولكن يجب دائماً استشارة الطبيب أولاً.',
                drugClasses: [
                    { name: 'مسكنات الألم', scientific_names: ['Paracetamol (آمن)', 'Ibuprofen (يجب تجنبه خاصة في الثلث الأخير)'] },
                    { name: 'مضادات الحموضة', scientific_names: ['Calcium Carbonate', 'Magnesium Hydroxide'] },
                    { name: 'مضادات الهيستامين', scientific_names: ['Loratadine', 'Cetirizine'] },
                    { name: 'مضادات حيوية', scientific_names: ['Amoxicillin', 'Cephalexin', 'Azithromycin'] },
                ],
                counselingPoints: [
                    'لا تتناولي أي دواء دون استشارة طبيبك أو الصيدلي.',
                    'المكملات الغذائية مثل حمض الفوليك والحديد والكالسيوم ضرورية جداً.',
                    'أبلغي الصيدلي دائماً بأنك حامل قبل صرف أي دواء.',
                ]
            },
             {
                name: 'الأدوية الآمنة أثناء الرضاعة',
                overview: 'العديد من الأدوية تنتقل إلى حليب الأم. هذه قائمة ببعض الخيارات الآمنة.',
                drugClasses: [
                    { name: 'مسكنات الألم', scientific_names: ['Paracetamol', 'Ibuprofen'] },
                    { name: 'مضادات الهيستامين', scientific_names: ['Loratadine', 'Fexofenadine'] },
                    { name: 'مزيلات الاحتقان', scientific_names: ['Pseudoephedrine (قد يقلل إدرار الحليب)'] },
                ],
                counselingPoints: [
                    'يُفضل تناول الدواء مباشرة بعد جلسة الرضاعة لإعطاء أطول فترة ممكنة قبل الرضعة التالية.',
                    'راقبي طفلك لأي تغييرات غير عادية (نعاس، تهيج).',
                ]
            },
        ]
    },
    {
        system: 'الجهاز القلبي الوعائي',
        icon: HeartPulse,
        diseases: [
            {
                name: 'ارتفاع ضغط الدم (Hypertension)',
                overview: 'حالة يكون فيها ضغط الدم مرتفعاً بشكل مستمر، مما يزيد من خطر أمراض القلب.',
                drugClasses: [
                    { name: 'حاصرات بيتا (Beta-Blockers)', scientific_names: ['bisoprolol', 'atenolol', 'metoprolol', 'carvedilol'] },
                    { name: 'مثبطات ACE', scientific_names: ['captopril', 'enalapril', 'lisinopril'] },
                    { name: 'مضادات مستقبلات الأنجيوتنسين (ARBs)', scientific_names: ['losartan', 'valsartan', 'candesartan'] },
                    { name: 'حاصرات قنوات الكالسيوم (CCBs)', scientific_names: ['amlodipine', 'nifedipine', 'diltiazem'] },
                    { name: 'المدررات (Diuretics)', scientific_names: ['hydrochlorothiazide', 'furosemide', 'spironolactone'] },
                ],
                counselingPoints: [
                    'قِس ضغطك بانتظام.',
                    'قلل من تناول الملح.',
                    'لا تتوقف عن تناول الدواء فجأة.'
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
                overview: 'مجموعة واسعة من المضادات الحيوية الفعالة ضد العديد من أنواع البكتيريا.',
                drugClasses: [
                    { name: 'أمينوبنسلينات', scientific_names: ['amoxicillin', 'ampicillin'] },
                    { name: 'مع مثبطات البيتا-لاكتاميز', scientific_names: ['amoxicillin/clavulanic acid', 'ampicillin/sulbactam'] },
                ],
                counselingPoints: ['يجب إكمال كورس العلاج كاملاً.', 'انتبه لعلامات الحساسية.']
            },
            {
                name: 'السيفالوسبورينات (Cephalosporins)',
                overview: 'مجموعة أخرى من المضادات الحيوية مقسمة إلى أجيال.',
                drugClasses: [
                    { name: 'الجيل الأول', scientific_names: ['cephalexin', 'cefadroxil'] },
                    { name: 'الجيل الثاني', scientific_names: ['cefaclor', 'cefuroxime'] },
                    { name: 'الجيل الثالث', scientific_names: ['cefixime', 'ceftriaxone'] },
                ],
                counselingPoints: ['أبلغ الطبيب إذا كان لديك حساسية للبنسلين.']
            },
        ]
    },
     {
        system: 'الجهاز العصبي المركزي',
        icon: Brain,
        diseases: [
            {
                name: 'الاكتئاب والقلق (Depression & Anxiety)',
                overview: 'حالات نفسية شائعة تؤثر على المزاج والحياة اليومية، وتعالج بأدوية تعمل على نواقل عصبية في الدماغ.',
                drugClasses: [
                    { name: 'مثبطات استرداد السيروتونين الانتقائية (SSRIs)', scientific_names: ['fluoxetine', 'sertraline', 'escitalopram', 'paroxetine'] },
                    { name: 'مثبطات استرداد السيروتونين والنورإبينفرين (SNRIs)', scientific_names: ['venlafaxine', 'duloxetine'] },
                    { name: 'مضادات الاكتئاب ثلاثية الحلقات (TCAs)', scientific_names: ['amitriptyline', 'imipramine'] },
                ],
                counselingPoints: ['قد يستغرق الدواء عدة أسابيع (4-6) لبدء مفعوله الكامل.', 'لا تتوقف عن تناول الدواء فجأة.', 'انتبه للأعراض الجانبية في بداية العلاج.']
            },
            {
                name: 'الصرع (Epilepsy)',
                overview: 'اضطراب عصبي يسبب نوبات متكررة. الأدوية تعمل على تهدئة النشاط الكهربائي الزائد في الدماغ.',
                drugClasses: [
                    { name: 'أدوية الصرع التقليدية', scientific_names: ['carbamazepine', 'phenytoin', 'valproic acid'] },
                    { name: 'أدوية الصرع الحديثة', scientific_names: ['levetiracetam', 'lamotrigine', 'topiramate', 'gabapentin', 'pregabalin'] },
                ],
                counselingPoints: ['الالتزام بمواعيد الدواء ضروري جداً للتحكم في النوبات.', 'بعض الأدوية تتفاعل مع أدوية أخرى، يجب إبلاغ الصيدلي بجميع الأدوية المتناولة.', 'تجنب التوقف المفاجئ عن الدواء.']
            }
        ]
    },
    {
        system: 'الجهاز التنفسي',
        icon: Wind,
        diseases: [
            {
                name: 'الربو (Asthma)',
                overview: 'مرض مزمن يسبب التهاب وتضيق في المسالك الهوائية.',
                drugClasses: [
                    { name: 'موسعات الشعب قصيرة المفعول (SABAs)', scientific_names: ['salbutamol', 'albuterol'] },
                    { name: 'الكورتيكوستيرويدات المستنشقة (ICS)', scientific_names: ['budesonide', 'fluticasone'] },
                    { name: 'مزيج ICS و LABA', scientific_names: ['budesonide/formoterol', 'fluticasone/salmeterol'] },
                ],
                counselingPoints: ['تعلم كيفية استخدام البخاخ بشكل صحيح.', 'اغسل فمك بالماء بعد استخدام بخاخ الكورتيزون.']
            }
        ]
    },
    {
        system: 'الجهاز الهضمي',
        icon: Activity,
        diseases: [
            {
                name: 'الارتجاع المعدي المريئي (GERD)',
                overview: 'حالة يرتد فيها حمض المعدة إلى المريء مسبباً حرقة.',
                drugClasses: [
                    { name: 'مثبطات مضخة البروتون (PPIs)', scientific_names: ['omeprazole', 'esomeprazole', 'lansoprazole'] },
                    { name: 'حاصرات H2', scientific_names: ['famotidine', 'ranitidine (تم سحبه في بعض المناطق)'] },
                ],
                counselingPoints: ['تناول أدوية PPIs قبل 30-60 دقيقة من الإفطار.', 'تجنب الأطعمة التي تزيد الأعراض.']
            }
        ]
    },
     {
        system: 'الغدد الصماء',
        icon: Scale,
        diseases: [
            {
                name: 'مرض السكري (Diabetes Mellitus)',
                overview: 'مرض مزمن يؤثر على كيفية معالجة الجسم لسكر الدم (الجلوكوز).',
                drugClasses: [
                    { name: 'Biguanides', scientific_names: ['metformin'] },
                    { name: 'Sulfonylureas', scientific_names: ['glibenclamide', 'gliclazide', 'glimepiride'] },
                    { name: 'DPP-4 Inhibitors', scientific_names: ['sitagliptin', 'vildagliptin'] },
                    { name: 'SGLT2 Inhibitors', scientific_names: ['dapagliflozin', 'empagliflozin'] },
                ],
                counselingPoints: ['تناول Metformin مع الطعام.', 'راقب مستويات سكر الدم بانتظام.', 'انتبه لأعراض هبوط السكر.']
            },
            {
                name: 'أمراض الغدة الدرقية',
                overview: 'اضطرابات في وظيفة الغدة الدرقية، إما قصور (hypothyroidism) أو فرط نشاط (hyperthyroidism).',
                drugClasses: [
                    { name: 'لعلاج قصور الغدة (Hypothyroidism)', scientific_names: ['levothyroxine (T4)'] },
                    { name: 'لعلاج فرط نشاط الغدة (Hyperthyroidism)', scientific_names: ['carbimazole', 'methimazole', 'propylthiouracil'] },
                ],
                counselingPoints: ['يجب تناول Levothyroxine على معدة فارغة في الصباح.', 'أدوية الغدة الدرقية تتطلب متابعة دورية مع الطبيب.']
            }
        ]
    },
    {
        system: 'الألم والالتهاب',
        icon: Bone,
        diseases: [
            {
                name: 'مسكنات الألم ومضادات الالتهاب',
                overview: 'مجموعات متنوعة لتخفيف الألم والالتهاب.',
                drugClasses: [
                    { name: 'Paracetamol / Acetaminophen', scientific_names: ['paracetamol'] },
                    { name: 'مضادات الالتهاب غير الستيرويدية (NSAIDs)', scientific_names: ['ibuprofen', 'diclofenac', 'naproxen', 'mefenamic acid', 'celecoxib'] },
                    { name: 'مسكنات أفيونية ضعيفة (Weak Opioids)', scientific_names: ['tramadol', 'codeine (غالباً في مركبات)'] },
                ],
                counselingPoints: ['لا تتجاوز الجرعة اليومية القصوى للباراسيتامول.', 'تناول NSAIDs مع الطعام لحماية المعدة.']
            },
            {
                name: 'النقرس (Gout)',
                overview: 'نوع من التهاب المفاصل ناتج عن تراكم حمض اليوريك.',
                drugClasses: [
                    { name: 'للعلاج الحاد', scientific_names: ['colchicine', 'diclofenac'] },
                    { name: 'للوقاية (خفض حمض اليوريك)', scientific_names: ['allopurinol', 'febuxostat'] },
                ],
                counselingPoints: ['اشرب كميات كبيرة من الماء مع أدوية الوقاية.', 'قد تحدث نوبات حادة في بداية العلاج الوقائي.']
            },
             {
                name: 'مرخيات العضلات (Muscle Relaxants)',
                overview: 'تستخدم لتخفيف التشنجات العضلية.',
                drugClasses: [
                    { name: 'مرخيات العضلات', scientific_names: ['orphenadrine', 'carisoprodol', 'cyclobenzaprine', 'tizanidine'] },
                ],
                counselingPoints: ['قد تسبب النعاس، تجنب القيادة.', 'لا تتناولها مع الكحول.']
            }
        ]
    },
    {
        system: 'أدوية بدون وصفة (OTC)',
        icon: Pill,
        diseases: [
            {
                name: 'أدوية السعال والزكام',
                overview: 'مجموعة متنوعة لتخفيف أعراض نزلات البرد.',
                drugClasses: [
                    { name: 'مضادات الهيستامين (Antihistamines)', scientific_names: ['chlorpheniramine', 'diphenhydramine', 'loratadine', 'cetirizine'] },
                    { name: 'مزيلات الاحتقان (Decongestants)', scientific_names: ['pseudoephedrine', 'phenylephrine'] },
                    { name: 'طاردات البلغم (Expectorants)', scientific_names: ['guaifenesin'] },
                    { name: 'مهدئات السعال (Antitussives)', scientific_names: ['dextromethorphan'] },
                ],
                counselingPoints: ['بعض مضادات الهيستامين تسبب النعاس.', 'لا تستخدم مزيلات الاحتقان الموضعية لأكثر من 3-5 أيام.']
            },
            {
                name: 'مضادات الحموضة',
                overview: 'أدوية لمعالجة حرقة المعدة وعسر الهضم.',
                drugClasses: [
                    { name: 'معادلات الحموضة (Antacids)', scientific_names: ['calcium carbonate', 'magnesium hydroxide', 'aluminum hydroxide'] },
                ],
                counselingPoints: ['توفر راحة سريعة ومؤقتة.', 'قد تؤثر على امتصاص أدوية أخرى.']
            }
        ]
    }
];

export default function ContinuingEducationPage() {
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Stethoscope className="h-10 w-10 text-primary" />
                    <div>
                        <CardTitle className="text-3xl">التعليم المستمر</CardTitle>
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
                                    <div key={dIndex} className="bg-background/70 p-4 rounded-lg shadow-sm">
                                        <h3 className="text-lg font-bold mb-2 text-primary/90">{disease.name}</h3>
                                        <p className="text-muted-foreground mb-4">{disease.overview}</p>
                                        
                                        <h4 className="font-semibold mb-2">مجموعات الأدوية وأهم الأسماء العلمية:</h4>
                                        <div className="space-y-3">
                                            {disease.drugClasses.map((dClass, cIndex) => (
                                                <div key={cIndex} className="p-3 border rounded-md bg-background">
                                                    <p className="font-semibold">{dClass.name}</p>
                                                    {dClass.mechanism && <p className="text-xs text-muted-foreground mb-2">{dClass.mechanism}</p>}
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        {dClass.scientific_names.map(name => (
                                                            <div key={name} className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900/50 dark:text-blue-300">{name}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
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
