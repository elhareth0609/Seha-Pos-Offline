
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartPulse, Baby, Brain, Wind, Activity, Bug, Scale, Pill, Droplets, Shield, Stethoscope, Bone, SmilePlus, Microscope, Ear, Gem, Syringe, Female, Male, Leaf } from 'lucide-react';
import type { Medication } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// Custom Icon for cold chain
const ThermometerSnowflake = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10 12.4V4.5a3 3 0 0 1 3-3a3 3 0 0 1 3 3v7.9a5 5 0 1 1-6 0Z" />
        <path d="M8 9h1" /><path d="m15 9-1-1" /><path d="m15 13-1-1" />
        <path d="m14 11 1-1" /><path d="M8 17a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3" />
        <path d="m11 2-1-1" /><path d="M11 6V5" />
    </svg>
);


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
        system: 'الحالات الطارئة والإسعافات الأولية',
        icon: Shield,
        diseases: [
            {
                name: 'الحروق (Burns)',
                overview: 'التعامل الأولي مع الحروق يعتمد على درجتها. الهدف هو تبريد المنطقة ومنع التلوث.',
                drugClasses: [
                    { name: 'كريمات الحروق', scientific_names: ['Mebo (beta-sitosterol)', 'Silver Sulfadiazine'], mechanism: 'توفر بيئة رطبة للشفاء وتمنع العدوى البكتيرية.' },
                    { name: 'مسكنات الألم', scientific_names: ['Paracetamol', 'Ibuprofen'], mechanism: 'لتخفيف الألم المصاحب للحرق.' },
                ],
                counselingPoints: [
                    'برد الحرق فوراً بماء جارٍ (غير مثلج) لمدة 10-20 دقيقة.',
                    'لا تضع معجون أسنان أو مواد أخرى على الحرق.',
                    'غطِّ الحرق بضمادة نظيفة وغير لاصقة.',
                    'في الحروق الشديدة أو الكبيرة، اطلب المساعدة الطبية فوراً.'
                ]
            },
            {
                name: 'عضات الحيوانات (Animal Bites)',
                overview: 'الأولوية هي تنظيف الجرح جيداً وتقييم الحاجة لمضاد حيوي أو لقاح الكزاز أو داء الكلب.',
                drugClasses: [
                    { name: 'مضادات حيوية وقائية', scientific_names: ['Amoxicillin/clavulanic acid'], mechanism: 'يغطي مجموعة واسعة من البكتيريا الموجودة في فم الحيوانات.' },
                    { name: 'مطهّرات موضعية', scientific_names: ['Povidone-iodine', 'Chlorhexidine'], mechanism: 'لتنظيف الجرح وتقليل خطر العدوى.' },
                ],
                counselingPoints: [
                    'اغسل الجرح جيداً بالماء والصابون لمدة لا تقل عن 5 دقائق.',
                    'يجب مراجعة الطبيب لتقييم الجرح والحاجة إلى إجراءات إضافية، خاصةً مع عضات الكلاب والقطط.',
                ]
            },
            {
                name: 'لسعات الحشرات والعقارب',
                overview: 'العلاج يركز على تخفيف الأعراض الموضعية مثل الألم، التورم، والحكة.',
                drugClasses: [
                    { name: 'مضادات الهيستامين الموضعية', scientific_names: ['Diphenhydramine cream'], mechanism: 'لتخفيف الحكة والتورم.' },
                    { name: 'كورتيزون موضعي خفيف', scientific_names: ['Hydrocortisone cream 1%'], mechanism: 'لتقليل الالتهاب والحكة.' },
                    { name: 'مسكنات الألم', scientific_names: ['Paracetamol'], mechanism: 'لتخفيف الألم.' },
                ],
                counselingPoints: [
                    'ضع كمادات باردة على مكان اللسعة.',
                    'في حالة لسعة العقرب، يجب التوجه إلى أقرب مركز طوارئ فوراً.',
                    'انتبه لعلامات التحسس الشديد (صعوبة في التنفس، تورم في الوجه أو الحلق) واطلب المساعدة الطبية الطارئة.',
                ]
            },
        ]
    },
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
        system: 'صحة المرأة',
        icon: Female,
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
             {
                name: 'آلام الدورة الشهرية (Dysmenorrhea)',
                overview: 'ألم يصاحب الدورة الشهرية، ويمكن علاجه بمسكنات الألم ومضادات الالتهاب.',
                drugClasses: [
                    { name: 'مضادات الالتهاب غير الستيرويدية (NSAIDs)', scientific_names: ['Ibuprofen', 'Naproxen', 'Mefenamic Acid'] },
                    { name: 'مسكنات أخرى', scientific_names: ['Paracetamol'] },
                ],
                counselingPoints: [
                    'تناولي الدواء مع بداية الشعور بالألم، لا تنتظري حتى يشتد.',
                    'استخدام الكمادات الدافئة قد يساعد في تخفيف الألم.',
                ]
            },
            {
                name: 'وسائل منع الحمل (Contraception)',
                overview: 'طرق مختلفة لمنع الحمل، تتطلب استشارة طبية لاختيار الأنسب.',
                drugClasses: [
                    { name: 'حبوب منع الحمل المركبة (COCPs)', scientific_names: ['Ethinylestradiol/Levonorgestrel', 'Ethinylestradiol/Drospirenone'] },
                    { name: 'حبوب منع الحمل التي تحتوي على بروجستين فقط (POPs)', scientific_names: ['Desogestrel'] },
                ],
                counselingPoints: [
                    'يجب تناول الحبوب في نفس الموعد كل يوم.',
                    'بعض الأدوية (مثل بعض المضادات الحيوية) قد تقلل من فعالية حبوب منع الحمل.',
                    'الحمل المنتبذ (Ectopic Pregnancy) حالة طبية طارئة حيث تُزرع البويضة المخصبة خارج الرحم، وعادة في قناة فالوب. لا علاقة له بوسائل منع الحمل بشكل مباشر لكنه يتطلب وعياً بأعراضه (ألم حاد في البطن، نزيف) والتوجه للطوارئ فوراً.',
                ]
            }
        ]
    },
     {
        system: 'صحة الرجل',
        icon: Male,
        diseases: [
            {
                name: 'ضعف الانتصاب (Erectile Dysfunction)',
                overview: 'عدم القدرة على تحقيق أو الحفاظ على الانتصاب الكافي للأداء الجنسي.',
                drugClasses: [
                    { name: 'مثبطات PDE5', scientific_names: ['Sildenafil', 'Tadalafil', 'Vardenafil'] },
                ],
                counselingPoints: [
                    'يجب عدم تناول هذه الأدوية مع أدوية النترات (Nitrates) المستخدمة لأمراض القلب.',
                    'يجب تناول Sildenafil على معدة فارغة قبل ساعة من النشاط.',
                    'Tadalafil له مفعول أطول ويمكن تناوله بجرعة يومية صغيرة.',
                ]
            }
        ]
    },
    {
        system: 'الجهاز القلبي الوعائي وأمراض الدم',
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
            },
            {
                name: 'ارتفاع الكوليسترول في الدم (Hyperlipidemia)',
                overview: 'زيادة مستويات الدهون (مثل الكوليسترول والدهون الثلاثية) في الدم.',
                drugClasses: [
                    { name: 'الستاتينات (Statins)', scientific_names: ['Atorvastatin', 'Rosuvastatin', 'Simvastatin'] },
                    { name: 'الفايبرات (Fibrates)', scientific_names: ['Fenofibrate', 'Gemfibrozil'] },
                ],
                counselingPoints: [
                    'يُفضل تناول أدوية الستاتين في المساء.',
                    'تجنب عصير الجريب فروت مع بعض أنواع الستاتين (مثل Atorvastatin).',
                ]
            },
            {
                name: 'الأدوية المضادة للتخثر (Anticoagulants/Antiplatelets)',
                overview: 'تستخدم لمنع تكون الجلطات الدموية.',
                drugClasses: [
                    { name: 'مضادات الصفيحات (Antiplatelets)', scientific_names: ['Aspirin (low dose)', 'clopidogrel'] },
                    { name: 'مضادات التخثر (Anticoagulants)', scientific_names: ['warfarin', 'rivaroxaban', 'apixaban', 'dabigatran'] },
                ],
                counselingPoints: ['انتبه لعلامات النزيف غير المعتاد.', 'تجنب تناولها مع مضادات الالتهاب غير الستيرويدية (NSAIDs) دون استشارة طبية.', 'Warfarin يتطلب مراقبة مستمرة (INR).']
            },
            {
                name: 'علاج فقر الدم (Anemia)',
                overview: 'يعالج حسب سبب فقر الدم، وأشهره نقص الحديد.',
                drugClasses: [
                    { name: 'مكملات الحديد (Iron Supplements)', scientific_names: ['ferrous sulfate', 'ferrous fumarate', 'ferrous gluconate'] },
                    { name: 'حمض الفوليك (Folic Acid)', scientific_names: ['folic acid'] },
                    { name: 'فيتامين B12', scientific_names: ['cyanocobalamin', 'methylcobalamin'] },
                ],
                counselingPoints: ['تناول مكملات الحديد مع فيتامين C لزيادة الامتصاص.', 'قد تسبب مكملات الحديد إمساكاً أو برازاً داكن اللون.']
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
             {
                name: 'الماكروليدات (Macrolides)',
                overview: 'مضادات حيوية تستخدم غالباً في التهابات الجهاز التنفسي.',
                drugClasses: [
                    { name: 'ماكروليدات', scientific_names: ['azithromycin', 'clarithromycin', 'erythromycin'] },
                ],
                counselingPoints: ['تناولها قبل الأكل بساعة أو بعده بساعتين لزيادة الامتصاص (باستثناء clarithromycin).', 'انتبه للتفاعلات الدوائية العديدة لهذه المجموعة.']
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
        system: 'الجهاز التنفسي والحساسية',
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
            },
            {
                name: 'التهاب الأنف التحسسي (Allergic Rhinitis)',
                overview: 'حساسية موسمية أو دائمة تسبب أعراضًا مثل العطاس، سيلان الأنف، وحكة العينين.',
                drugClasses: [
                    { name: 'مضادات الهيستامين الفموية', scientific_names: ['Loratadine', 'Cetirizine', 'Fexofenadine'] },
                    { name: 'بخاخات الأنف الستيرويدية', scientific_names: ['Fluticasone propionate', 'Mometasone furoate'] },
                ],
                counselingPoints: [
                    'بخاخات الأنف الستيرويدية هي الأكثر فعالية وتحتاج إلى استخدام منتظم.',
                    'بعض مضادات الهيستامين (الجيل الأول) قد تسبب النعاس.',
                ]
            },
            {
                name: 'السعال (Cough) والإنفلونزا',
                overview: 'عرض شائع له أسباب عديدة. العلاج يعتمد على نوع السعال.',
                drugClasses: [
                    { name: 'مهدئات السعال الجاف (Antitussives)', scientific_names: ['dextromethorphan', 'pholcodine'] },
                    { name: 'طاردات البلغم (Expectorants)', scientific_names: ['guaifenesin'] },
                    { name: 'مذيبات البلغم (Mucolytics)', scientific_names: ['bromhexine', 'ambroxol', 'acetylcysteine'] },
                    { name: 'مضادات الفيروسات (للإنفلونزا)', scientific_names: ['oseltamivir'], mechanism: 'يجب أن يبدأ في غضون 48 ساعة من بدء الأعراض.' },
                ],
                counselingPoints: ['لا تستخدم مهدئات السعال للسعال المنتج للبلغم.', 'شرب الكثير من السوائل يساعد على تخفيف البلغم.']
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
            },
            {
                name: 'الإمساك (Constipation)',
                overview: 'صعوبة في التبرز. العلاج يتضمن تغييرات في نمط الحياة والأدوية الملينة.',
                drugClasses: [
                    { name: 'ملينات الكتلة (Bulk-forming)', scientific_names: ['psyllium', 'methylcellulose'] },
                    { name: 'الملينات التناضحية (Osmotic laxatives)', scientific_names: ['lactulose', 'macrogol (PEG)'] },
                    { name: 'الملينات المنشطة (Stimulant laxatives)', scientific_names: ['bisacodyl', 'senna'] },
                ],
                counselingPoints: ['اشرب الكثير من الماء مع الملينات.', 'لا تستخدم الملينات المنشطة لفترات طويلة.']
            },
            {
                name: 'الإسهال (Diarrhea)',
                overview: 'زيادة في تكرار وسيولة البراز. الأهم هو تعويض السوائل والأملاح.',
                drugClasses: [
                    { name: 'محلول معالجة الجفاف (ORS)', scientific_names: ['Oral Rehydration Salts'] },
                    { name: 'مضادات الحركة (Antimotility agents)', scientific_names: ['loperamide'] },
                    { name: 'الممتزات (Adsorbents)', scientific_names: ['kaolin and pectin'] },
                ],
                counselingPoints: ['Loperamide لا يستخدم في حالة الإسهال الدموي أو الحمى الشديدة.', 'ORS ضروري جداً خاصة للأطفال وكبار السن.']
            },
            {
                name: 'البواسير (Hemorrhoids)',
                overview: 'أوردة متورمة في الجزء السفلي من المستقيم والشرج.',
                drugClasses: [
                    { name: 'تحاميل وكريمات موضعية', scientific_names: ['Hydrocortisone/Lidocaine', 'Cinchocaine/Policresulen'] },
                    { name: 'ملينات البراز', scientific_names: ['Docusate Sodium'] },
                ],
                counselingPoints: [
                    'زيادة تناول الألياف والسوائل لمنع الإمساك.',
                    'تجنب الجلوس لفترات طويلة على المرحاض.',
                ]
            }
        ]
    },
     {
        system: 'الغدد الصماء والسكري',
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
                name: 'الأنسولين (Insulin)',
                overview: 'علاج أساسي لمرضى السكري من النوع الأول وقد يستخدم في النوع الثاني.',
                drugClasses: [
                    { name: 'أنسولين سريع المفعول', scientific_names: ['insulin lispro', 'insulin aspart'] },
                    { name: 'أنسولين قصير المفعول (Regular)', scientific_names: ['regular insulin'] },
                    { name: 'أنسولين متوسط المفعول (NPH)', scientific_names: ['NPH insulin'] },
                    { name: 'أنسولين طويل المفعول', scientific_names: ['insulin glargine', 'insulin detemir', 'insulin degludec'] },
                    { name: 'أنسولين مخلوط (Premixed)', scientific_names: ['e.g., 70/30'] },
                ],
                counselingPoints: ['تعلم تقنية الحقن الصحيحة وتدوير أماكن الحقن.', 'خزن الأقلام غير المستخدمة في الثلاجة (وليس الفريزر).', 'القلم قيد الاستخدام يمكن حفظه في درجة حرارة الغرفة.']
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
        system: 'مضادات الطفيليات',
        icon: Microscope,
        diseases: [
            {
                name: 'الديدان المعوية (Helminthic Infections)',
                overview: 'تستخدم لعلاج الإصابات بالديدان المختلفة مثل الديدان الدبوسية والإسكارس.',
                drugClasses: [
                    { name: 'Benzimidazoles', scientific_names: ['albendazole', 'mebendazole'] },
                ],
                counselingPoints: ['عادة ما يتم تكرار الجرعة بعد أسبوعين لضمان القضاء على جميع الديدان.', 'يفضل أن تعالج جميع أفراد الأسرة في نفس الوقت.']
            },
        ]
    },
    {
        system: 'صحة الفم والأسنان',
        icon: SmilePlus,
        diseases: [
            {
                name: 'التهاب اللثة وألم الأسنان',
                overview: 'العناية بصحة الفم تتضمن استخدام غسولات مطهرة ومسكنات للألم.',
                drugClasses: [
                    { name: 'غسولات فم مطهرة', scientific_names: ['chlorhexidine gluconate'] },
                    { name: 'مسكنات موضعية', scientific_names: ['lidocaine gel'] },
                ],
                counselingPoints: ['لا تبلع غسول الفم.', 'استخدام غسول الكلورهيكسيدين لفترات طويلة قد يسبب تصبغ الأسنان.']
            },
             {
                name: 'تسوس الأسنان (Dental Caries)',
                overview: 'تلف في بنية السن ناتج عن الأحماض التي تنتجها بكتيريا البلاك.',
                drugClasses: [
                    { name: 'معاجين أسنان بالفلورايد', scientific_names: ['Sodium Fluoride'] },
                    { name: 'غسولات فم بالفلورايد', scientific_names: ['Sodium Fluoride mouthwash'] },
                ],
                counselingPoints: [
                    'نظّف أسنانك بالفرشاة والمعجون مرتين يومياً.',
                    'قلل من تناول السكريات والمشروبات الحمضية.',
                    'استخدم خيط الأسنان يومياً.',
                ]
            }
        ]
    },
    {
        system: 'أمراض الجلد والشعر',
        icon: Droplets,
        diseases: [
            {
                name: 'حب الشباب (Acne)',
                overview: 'علاج حب الشباب يعتمد على شدته ويتضمن علاجات موضعية وجهازية.',
                drugClasses: [
                    { name: 'مضادات حيوية موضعية', scientific_names: ['clindamycin', 'erythromycin'] },
                    { name: 'Retinoids', scientific_names: ['adapalene', 'tretinoin', 'isotretinoin (oral)'] },
                    { name: 'علاجات أخرى', scientific_names: ['benzoyl peroxide', 'salicylic acid'] },
                ],
                counselingPoints: ['قد تزيد هذه العلاجات من حساسية البشرة للشمس، استخدم واقي شمسي.', 'قد يستغرق ظهور النتائج عدة أسابيع.', 'Isotretinoin دواء فعال ولكنه يتطلب إشرافاً طبياً دقيقاً بسبب آثاره الجانبية المحتملة.']
            },
            {
                name: 'تساقط الشعر وقشرة الرأس',
                overview: 'علاجات لتحفيز نمو الشعر ومكافحة القشرة.',
                drugClasses: [
                    { name: 'محفزات نمو الشعر', scientific_names: ['minoxidil'] },
                    { name: 'مضادات الفطريات للقشرة', scientific_names: ['ketoconazole shampoo', 'selenium sulfide shampoo'] },
                ],
                counselingPoints: ['يجب استخدام Minoxidil بانتظام لرؤية النتائج والحفاظ عليها.', 'اترك شامبو الكيتوكونازول على فروة الرأس لبضع دقائق قبل شطفه.']
            }
        ]
    },
    {
        system: 'أمراض العين والأذن',
        icon: Ear,
        diseases: [
            {
                name: 'التهاب الملتحمة (Conjunctivitis)',
                overview: 'يعالج حسب السبب (بكتيري، فيروسي، تحسسي).',
                drugClasses: [
                    { name: 'قطرات مضاد حيوي', scientific_names: ['chloramphenicol', 'ofloxacin'] },
                    { name: 'قطرات مضادة للهيستامين', scientific_names: ['olopatadine'] },
                ],
                counselingPoints: ['تجنب لمس طرف القطارة للعين لمنع التلوث.', 'إذا كنت تستخدم أكثر من نوع من القطرات، انتظر 5 دقائق بين كل نوع.']
            },
            {
                name: 'التهاب الأذن الخارجية',
                overview: 'غالباً ما يعالج بقطرات للأذن تحتوي على مضاد حيوي أو مضاد للالتهاب.',
                drugClasses: [
                    { name: 'قطرات الأذن', scientific_names: ['ciprofloxacin/dexamethasone'] },
                ],
                counselingPoints: ['قم بتدفئة القطرة في يدك قبل وضعها لتقليل الدوار.', 'استلقِ على جانبك لبضع دقائق بعد وضع القطرة.']
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
    },
    {
        system: 'الفيتامينات والمعادن',
        icon: Gem,
        diseases: [
            {
                name: 'الفيتامينات الذائبة في الدهون',
                overview: 'هي فيتامينات تُخزن في الأنسجة الدهنية بالجسم. وهي A, D, E, K.',
                drugClasses: [
                    { name: 'Vitamin A (Retinol)', scientific_names: ['Retinol'], mechanism: 'ضروري للرؤية، وظيفة المناعة، والتكاثر.' },
                    { name: 'Vitamin D (Calciferol)', scientific_names: ['Cholecalciferol (D3)', 'Ergocalciferol (D2)'], mechanism: 'يساعد على امتصاص الكالسيوم، وهو حيوي لصحة العظام.' },
                    { name: 'Vitamin E (Tocopherol)', scientific_names: ['Tocopherol'], mechanism: 'يعمل كمضاد للأكسدة لحماية الخلايا من التلف.' },
                    { name: 'Vitamin K (Phytonadione)', scientific_names: ['Phytonadione'], mechanism: 'يلعب دورًا رئيسيًا في تخثر الدم.' },
                ],
                counselingPoints: [
                    'يجب تناولها مع وجبة تحتوي على دهون لزيادة الامتصاص.',
                    'الجرعات العالية من هذه الفيتامينات يمكن أن تكون سامة لأنها تتراكم في الجسم.',
                ]
            },
            {
                name: 'الفيتامينات الذائبة في الماء',
                overview: 'لا تُخزن في الجسم ويجب تناولها بانتظام. تشمل فيتامين C ومجموعة فيتامينات B.',
                drugClasses: [
                    { name: 'Vitamin C (Ascorbic Acid)', scientific_names: ['Ascorbic Acid'], mechanism: 'مضاد للأكسدة ومهم لإنتاج الكولاجين وصحة الجلد.' },
                    { name: 'Vitamin B Complex', scientific_names: ['B1 (Thiamine)', 'B2 (Riboflavin)', 'B3 (Niacin)', 'B5 (Pantothenic acid)', 'B6 (Pyridoxine)', 'B7 (Biotin)', 'B9 (Folic Acid)', 'B12 (Cobalamin)'], mechanism: 'مجموعة فيتامينات تلعب أدواراً حيوية في استقلاب الطاقة ووظائف الخلايا.' },
                ],
                counselingPoints: [
                    'فيتامين B12 ضروري لكبار السن والنباتيين.',
                    'حمض الفوليك (B9) حيوي للنساء في سن الإنجاب للوقاية من عيوب الأنبوب العصبي للجنين.',
                ]
            }
        ]
    },
    {
        system: 'اللقاحات الأساسية للأطفال',
        icon: Syringe,
        diseases: [
            {
                name: 'جدول اللقاحات الوطني',
                overview: 'اللقاحات هي الطريقة الأكثر فعالية لحماية الأطفال من الأمراض الخطيرة والمعدية.',
                drugClasses: [],
                counselingPoints: [
                    'عند الولادة: BCG (السل)، OPV (شلل الأطفال الفموي)، التهاب الكبد B.',
                    'عمر شهرين: اللقاح الخماسي (DTP, Hib, HepB)، شلل الأطفال الفموي (OPV)، لقاح الروتا.',
                    'عمر 4 أشهر: جرعة ثانية من الخماسي و OPV والروتا.',
                    'عمر 6 أشهر: جرعة ثالثة من الخماسي و OPV.',
                    'عمر 9 أشهر: لقاح الحصبة (Measles).',
                    'عمر 18 شهرًا: جرعة منشطة من DTP و OPV.',
                    'من المهم الالتزام بمواعيد اللقاحات لضمان أفضل حماية للطفل.'
                ]
            }
        ]
    },
    {
        system: 'أدوية السلسلة الباردة (Cold Chain)',
        icon: ThermometerSnowflake,
        diseases: [
            {
                name: 'أهمية التخزين البارد',
                overview: 'بعض الأدوية، وخاصة البيولوجية منها، تفقد فعاليتها إذا لم يتم تخزينها في درجات حرارة مناسبة (عادة بين 2-8 درجات مئوية).',
                drugClasses: [
                    { name: 'الأنسولين (Insulin)', scientific_names: ['All types'], mechanism: '' },
                    { name: 'بعض اللقاحات (Vaccines)', scientific_names: [], mechanism: '' },
                    { name: 'قطرات العين', scientific_names: ['Latanoprost'], mechanism: '' },
                    { name: 'الأدوية البيولوجية', scientific_names: ['Adalimumab', 'Etanercept'], mechanism: '' },
                ],
                counselingPoints: [
                    'يجب تخزين هذه الأدوية في الثلاجة، وليس في باب الثلاجة أو الفريزر.',
                    'عند السفر، استخدم حافظة مبردة مع عبوات ثلج.',
                    'قلم الأنسولين قيد الاستخدام يمكن حفظه في درجة حرارة الغرفة (أقل من 25-30 درجة) لمدة تصل إلى شهر.',
                    'لا تستخدم أي دواء من هذه الفئة إذا كنت تشك في أنه تعرض لحرارة زائدة أو تجمّد.'
                ]
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
                                        
                                        {disease.drugClasses.length > 0 && (
                                            <>
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
                                            </>
                                        )}
                                        
                                        {disease.counselingPoints.length > 0 && (
                                            <>
                                            <h4 className="font-semibold mt-4 mb-2">أهم النصائح للمريض:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                                {disease.counselingPoints.map((point, pIndex) => (
                                                    <li key={pIndex}>{point}</li>
                                                ))}
                                            </ul>
                                            </>
                                        )}
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
