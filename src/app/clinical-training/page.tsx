
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartPulse, Baby, Brain, Wind, Activity, Bug, Scale, Pill, Droplets, Shield, Stethoscope, Bone, SmilePlus, Microscope, Ear } from 'lucide-react';
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
        icon: HeartPulse,
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
            },
            {
                name: 'السعال (Cough)',
                overview: 'عرض شائع له أسباب عديدة. العلاج يعتمد على نوع السعال.',
                drugClasses: [
                    { name: 'مهدئات السعال الجاف (Antitussives)', scientific_names: ['dextromethorphan', 'pholcodine'] },
                    { name: 'طاردات البلغم (Expectorants)', scientific_names: ['guaifenesin'] },
                    { name: 'مذيبات البلغم (Mucolytics)', scientific_names: ['bromhexine', 'ambroxol', 'acetylcysteine'] },
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
                    { name: 'Retinoids', scientific_names: ['adapalene', 'tretinoin'] },
                    { name: 'علاجات أخرى', scientific_names: ['benzoyl peroxide', 'salicylic acid'] },
                ],
                counselingPoints: ['قد تزيد هذه العلاجات من حساسية البشرة للشمس، استخدم واقي شمسي.', 'قد يستغرق ظهور النتائج عدة أسابيع.']
            },
            {
                name: 'تساقط الشعر وقشرة الرأس',
                overview: 'علاجات لتحفيز نمو الشعر ومكافحة القشرة.',
                drugClasses: [
                    { name: 'محفزات نمو الشعر', scientific_names: ['minoxidil'] },
                    { name: 'مضادات الفطريات للقشرة', scientific_names: ['ketoconazole shampoo'] },
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

    
