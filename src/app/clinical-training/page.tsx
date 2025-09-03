
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeartPulse, Baby, Brain, Wind, Activity, Bug, Scale, Pill, Droplets, Shield, Stethoscope, Bone, SmilePlus, Microscope, Ear, Gem, Syringe, PersonStanding, Leaf, Footprints, Radiation, BrainCircuit, EarOff, ThermometerSnowflake } from 'lucide-react';
import type { Medication } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// Custom Icon for cold chain
const ThermometerSnowflakeIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
        system: 'صحة المرأة والرجل',
        icon: PersonStanding,
        diseases: [
            {
                name: 'الأدوية الآمنة أثناء الحمل والرضاعة',
                overview: 'قائمة ببعض الأدوية التي تعتبر آمنة بشكل عام خلال فترة الحمل والرضاعة، ولكن يجب دائماً استشارة الطبيب أولاً.',
                drugClasses: [
                    { name: 'مسكنات الألم', scientific_names: ['Paracetamol (آمن)', 'Ibuprofen (يجب تجنبه في الحمل خاصة في الثلث الأخير)'] },
                    { name: 'مضادات الحموضة', scientific_names: ['Calcium Carbonate', 'Magnesium Hydroxide'] },
                    { name: 'مضادات الهيستامين', scientific_names: ['Loratadine', 'Cetirizine'] },
                ],
                counselingPoints: [
                    'لا تتناولي أي دواء دون استشارة طبيبك أو الصيدلي.',
                    'المكملات الغذائية مثل حمض الفوليك والحديد والكالسيوم ضرورية جداً للحامل.',
                    'أبلغي الصيدلي دائماً بحالتك (حمل أو رضاعة) قبل صرف أي دواء.',
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
                name: 'وسائل منع الحمل (Contraception) والحمل المنتبذ',
                overview: 'طرق مختلفة لمنع الحمل، تتطلب استشارة طبية لاختيار الأنسب. الحمل المنتبذ (Ectopic Pregnancy) حالة طبية طارئة حيث تُزرع البويضة المخصبة خارج الرحم، ويتطلب وعياً بأعراضه.',
                drugClasses: [
                    { name: 'حبوب منع الحمل المركبة (COCPs)', scientific_names: ['Ethinylestradiol/Levonorgestrel', 'Ethinylestradiol/Drospirenone'] },
                    { name: 'حبوب منع الحمل التي تحتوي على بروجستين فقط (POPs)', scientific_names: ['Desogestrel'] },
                ],
                counselingPoints: [
                    'يجب تناول الحبوب في نفس الموعد كل يوم.',
                    'بعض الأدوية (مثل بعض المضادات الحيوية) قد تقلل من فعالية حبوب منع الحمل.',
                    'أعراض الحمل المنتبذ: ألم حاد ومفاجئ في جانب واحد من البطن، نزيف مهبلي غير طبيعي. يجب التوجه للطوارئ فوراً عند الشك.',
                ]
            },
            {
                name: 'متلازمة المبيض متعدد الكيسات (PCOS)',
                overview: 'اضطراب هرموني شائع يؤثر على النساء في سن الإنجاب، وقد يسبب عدم انتظام الدورة الشهرية، زيادة في نمو الشعر، وحب الشباب. العلاج يركز على التحكم في الأعراض.',
                drugClasses: [
                    { name: 'لتنظيم الدورة الشهرية', scientific_names: ['حبوب منع الحمل المركبة', 'Medroxyprogesterone'] },
                    { name: 'لمقاومة الأنسولين', scientific_names: ['Metformin'] },
                    { name: 'لعلاج الشعر الزائد', scientific_names: ['Spironolactone'] },
                ],
                counselingPoints: [
                    'فقدان الوزن واتباع نظام غذائي صحي يلعب دوراً كبيراً في التحكم بالأعراض.',
                    'مراقبة مستويات السكر في الدم مهمة للمرضى الذين يتناولون Metformin.',
                ]
            },
            {
                name: 'متلازمة ما قبل الطمث (PMS)',
                overview: 'مجموعة من الأعراض الجسدية والنفسية التي تحدث قبل الدورة الشهرية. العلاج يهدف لتخفيف الأعراض.',
                drugClasses: [
                    { name: 'لتخفيف الألم', scientific_names: ['Ibuprofen', 'Naproxen'] },
                    { name: 'للأعراض النفسية الشديدة', scientific_names: ['SSRIs (مثل Fluoxetine, Sertraline)'] },
                    { name: 'مدرات البول (لاحتشاء السوائل)', scientific_names: ['Spironolactone'] },
                ],
                counselingPoints: [
                    'تقليل الملح والكافيين قد يساعد في تخفيف الأعراض.',
                    'ممارسة الرياضة بانتظام يمكن أن تحسن المزاج وتقلل من الأعراض.',
                ]
            },
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
                counselingPoints: ['قِس ضغطك بانتظام.', 'قلل من تناول الملح.', 'لا تتوقف عن تناول الدواء فجأة.']
            },
            {
                name: 'فشل القلب الاحتقاني (Congestive Heart Failure)',
                overview: 'حالة لا يستطيع فيها القلب ضخ الدم بكفاءة كافية لتلبية احتياجات الجسم. العلاج يهدف لتحسين وظيفة القلب وتقليل الأعراض.',
                drugClasses: [
                    { name: 'مثبطات ACE و ARBs', scientific_names: ['Enalapril', 'Lisinopril', 'Valsartan'] },
                    { name: 'حاصرات بيتا', scientific_names: ['Carvedilol', 'Bisoprolol', 'Metoprolol Succinate'] },
                    { name: 'المدررات', scientific_names: ['Furosemide', 'Spironolactone'] },
                    { name: 'أدوية أخرى', scientific_names: ['Digoxin', 'Sacubitril/Valsartan'] },
                ],
                counselingPoints: [
                    'وزن نفسك يومياً، أي زيادة سريعة في الوزن قد تعني احتباس السوائل.',
                    'اتبع نظاماً غذائياً قليل الملح.',
                    'الالتزام بالأدوية ضروري جداً.',
                ]
            },
            {
                name: 'ارتفاع الكوليسترول في الدم (Hyperlipidemia)',
                overview: 'زيادة مستويات الدهون (مثل الكوليسترول والدهون الثلاثية) في الدم.',
                drugClasses: [
                    { name: 'الستاتينات (Statins)', scientific_names: ['Atorvastatin', 'Rosuvastatin', 'Simvastatin'] },
                    { name: 'الفايبرات (Fibrates)', scientific_names: ['Fenofibrate', 'Gemfibrozil'] },
                ],
                counselingPoints: ['يُفضل تناول أدوية الستاتين في المساء.', 'تجنب عصير الجريب فروت مع بعض أنواع الستاتين (مثل Atorvastatin).']
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
                name: 'فقر الدم (Anemia)',
                overview: 'يعالج حسب سبب فقر الدم، وأشهره نقص الحديد.',
                drugClasses: [
                    { name: 'مكملات الحديد (Iron Supplements)', scientific_names: ['ferrous sulfate', 'ferrous fumarate', 'ferrous gluconate'] },
                    { name: 'حمض الفوليك (Folic Acid)', scientific_names: ['folic acid'] },
                    { name: 'فيتامين B12', scientific_names: ['cyanocobalamin', 'methylcobalamin'] },
                ],
                counselingPoints: ['تناول مكملات الحديد مع فيتامين C لزيادة الامتصاص.', 'قد تسبب مكملات الحديد إمساكاً أو برازاً داكن اللون.']
            },
            {
                name: 'دوالي الأوردة (Varicose Veins)',
                overview: 'أوردة متضخمة وملتوية، تظهر عادة في الساقين. العلاج يهدف لتخفيف الأعراض ومنع المضاعفات.',
                drugClasses: [
                    { name: 'أدوية مقوية للأوعية (Phlebotonics)', scientific_names: ['Diosmin/Hesperidin'] },
                    { name: 'كريمات موضعية', scientific_names: ['Heparinoid cream'] },
                ],
                counselingPoints: [
                    'ارتداء الجوارب الضاغطة هو العلاج الأساسي.',
                    'تجنب الوقوف أو الجلوس لفترات طويلة.',
                    'رفع الساقين عند الجلوس أو الاستلقاء.',
                ]
            }
        ]
    },
    {
        system: 'الجهاز العصبي والصحة النفسية',
        icon: Brain,
        diseases: [
            {
                name: 'الشقيقة (Migraine)',
                overview: 'صداع شديد نابض، غالباً في جانب واحد من الرأس، قد يصاحبه غثيان وحساسية للضوء والصوت. العلاج ينقسم إلى حاد (للنوبة) ووقائي.',
                drugClasses: [
                    { name: 'للنوبة الحادة', scientific_names: ['Sumatriptan', 'Zolmitriptan', 'Rizatriptan', 'NSAIDs (Ibuprofen, Naproxen)', 'Paracetamol'] },
                    { name: 'للوقاية', scientific_names: ['Propranolol', 'Topiramate', 'Amitriptyline', 'Valproic Acid'] },
                ],
                counselingPoints: [
                    'تناول دواء النوبة الحادة عند أول علامة للشقيقة.',
                    'استرح في غرفة هادئة ومظلمة أثناء النوبة.',
                    'الأدوية الوقائية تؤخذ يومياً لمنع حدوث النوبات.',
                ]
            },
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
            },
            {
                name: 'داء باركنسون (Parkinson\'s Disease)',
                overview: 'اضطراب تنكسي عصبي يؤثر بشكل رئيسي على الحركة، ويتميز بأعراض مثل الرعاش، تصلب العضلات، وبطء الحركة.',
                drugClasses: [
                    { name: 'أدوية الدوبامين', scientific_names: ['Levodopa/Carbidopa', 'Levodopa/Benserazide'] },
                    { name: 'محفزات مستقبلات الدوبامين', scientific_names: ['Pramipexole', 'Ropinirole', 'Bromocriptine'] },
                    { name: 'مثبطات MAO-B', scientific_names: ['Selegiline', 'Rasagiline'] },
                ],
                counselingPoints: [
                    'تناول ليفودوبا على معدة فارغة لزيادة الامتصاص، ولكن يمكن تناوله مع الطعام لتقليل الغثيان.',
                    'قد يسبب الدواء حركات لا إرادية (dyskinesia) بعد فترة طويلة من الاستخدام.',
                ]
            },
             {
                name: 'السكتة الدماغية (Stroke)',
                overview: 'تحدث عندما ينقطع تدفق الدم إلى جزء من الدماغ. العلاج ما بعد السكتة يركز على منع حدوث سكتة أخرى وإعادة التأهيل.',
                drugClasses: [
                    { name: 'مضادات الصفيحات', scientific_names: ['Aspirin', 'Clopidogrel'] },
                    { name: 'مضادات التخثر (في حالة الرجفان الأذيني)', scientific_names: ['Warfarin', 'Rivaroxaban', 'Apixaban'] },
                    { name: 'الستاتينات (لخفض الكوليسترول)', scientific_names: ['Atorvastatin', 'Rosuvastatin'] },
                    { name: 'أدوية ضغط الدم', scientific_names: ['Lisinopril', 'Amlodipine'] },
                ],
                counselingPoints: [
                    'الالتزام بأدوية الوقاية الثانوية أمر حيوي.',
                    'التحكم بعوامل الخطر مثل ارتفاع ضغط الدم والسكري والكوليسترول مهم جداً.',
                ]
            },
            {
                name: 'التصلب المتعدد (Multiple Sclerosis)',
                overview: 'مرض مناعي ذاتي مزمن يصيب الجهاز العصبي المركزي (الدماغ والحبل الشوكي)، ويسبب مجموعة واسعة من الأعراض.',
                drugClasses: [
                    { name: 'لتعديل مسار المرض (DMTs)', scientific_names: ['Interferon beta', 'Glatiramer acetate', 'Fingolimod', 'Natalizumab'] },
                    { name: 'لعلاج الهجمات الحادة', scientific_names: ['Methylprednisolone (corticosteroids)'] },
                    { name: 'للأعراض (مثل التشنج العضلي)', scientific_names: ['Baclofen', 'Tizanidine'] },
                ],
                counselingPoints: [
                    'الأدوية المعدلة لمسار المرض تتطلب متابعة دقيقة مع الطبيب المختص.',
                    'إدارة الأعراض جزء مهم من العلاج لتحسين جودة الحياة.',
                ]
            },
             {
                name: 'متلازمة تململ الساقين (Restless Legs Syndrome)',
                overview: 'رغبة لا تقاوم لتحريك الساقين، عادة بسبب إحساس غير مريح. تزداد سوءًا في المساء أو أثناء الراحة.',
                drugClasses: [
                    { name: 'محفزات مستقبلات الدوبامين', scientific_names: ['Pramipexole', 'Ropinirole'] },
                    { name: 'مكملات الحديد (إذا كان هناك نقص)', scientific_names: ['Ferrous Sulfate'] },
                    { name: 'أخرى', scientific_names: ['Gabapentin', 'Pregabalin'] },
                ],
                counselingPoints: [
                    'تجنب الكافيين والكحول والتدخين.',
                    'ممارسة التمارين الرياضية بانتظام قد يساعد.',
                ]
            },
        ]
    },
     {
        system: 'الجهاز التنفسي والأمراض المعدية',
        icon: Bug,
        diseases: [
            {
                name: 'الزكام والإنفلونزا (Common Cold & Influenza)',
                overview: 'أمراض فيروسية تصيب الجهاز التنفسي. الزكام أخف، بينما الإنفلونزا أشد وتسبب حمى وآلام في الجسم.',
                drugClasses: [
                    { name: 'مسكنات ومخفضات حرارة', scientific_names: ['Paracetamol', 'Ibuprofen'] },
                    { name: 'مزيلات الاحتقان', scientific_names: ['Pseudoephedrine', 'Phenylephrine', 'Oxymetazoline (nasal spray)'] },
                    { name: 'مضادات الهيستامين (لأعراض الحساسية المصاحبة)', scientific_names: ['Loratadine', 'Chlorpheniramine'] },
                    { name: 'مضادات الفيروسات (للإنفلونزا)', scientific_names: ['Oseltamivir'], mechanism: 'يجب أن يبدأ في غضون 48 ساعة من بدء الأعراض ليكون فعالاً.' },
                ],
                counselingPoints: [
                    'الراحة وشرب الكثير من السوائل هي أساس العلاج.',
                    'المضادات الحيوية لا تعالج الزكام أو الإنفلونزا لأنها أمراض فيروسية.',
                    'لا تستخدم مزيلات الاحتقان الموضعية (البخاخات) لأكثر من 3-5 أيام.',
                ]
            },
            {
                name: 'التهاب الجيوب الأنفية (Sinusitis)',
                overview: 'التهاب أو تورم في الأنسجة المبطنة للجيوب الأنفية. يمكن أن يكون حاداً أو مزمناً.',
                drugClasses: [
                    { name: 'مزيلات الاحتقان', scientific_names: ['Pseudoephedrine'] },
                    { name: 'بخاخات الأنف الستيرويدية', scientific_names: ['Mometasone furoate', 'Fluticasone propionate'] },
                    { name: 'مسكنات الألم', scientific_names: ['Paracetamol', 'Ibuprofen'] },
                    { name: 'مضادات حيوية (إذا كان السبب بكتيرياً)', scientific_names: ['Amoxicillin', 'Amoxicillin/clavulanic acid'] },
                ],
                counselingPoints: [
                    'استخدام غسول الأنف الملحي يمكن أن يساعد في تخفيف الأعراض.',
                    'بخاخات الستيرويد هي العلاج الأساسي للالتهاب المزمن وتحتاج إلى استخدام منتظم.',
                ]
            },
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
        system: 'الجهاز الهضمي والكلى',
        icon: Activity,
        diseases: [
            {
                name: 'الارتجاع المعدي المريئي (GERD) والقرحة الهضمية',
                overview: 'حالات تنتج عن زيادة حمض المعدة أو ضعف الطبقة الواقية للمعدة والمريء.',
                drugClasses: [
                    { name: 'مثبطات مضخة البروتون (PPIs)', scientific_names: ['omeprazole', 'esomeprazole', 'lansoprazole', 'pantoprazole'] },
                    { name: 'حاصرات H2', scientific_names: ['famotidine', 'ranitidine (تم سحبه في بعض المناطق)'] },
                    { name: 'مضادات الحموضة (Antacids)', scientific_names: ['Calcium carbonate', 'Magnesium hydroxide', 'Aluminum hydroxide'] },
                    { name: 'لجرثومة المعدة (H. pylori)', scientific_names: ['Clarithromycin', 'Amoxicillin', 'Metronidazole'] },
                ],
                counselingPoints: ['تناول أدوية PPIs قبل 30-60 دقيقة من الإفطار.', 'تجنب الأطعمة التي تزيد الأعراض.']
            },
            {
                name: 'الإمساك والإسهال',
                overview: 'اضطرابات شائعة في حركة الأمعاء. علاج الإمساك يركز على التليين، وعلاج الإسهال يركز على تعويض السوائل.',
                drugClasses: [
                    { name: 'ملينات للإمساك', scientific_names: ['Lactulose', 'Bisacodyl', 'Psyllium husk', 'Macrogol (PEG)'] },
                    { name: 'مضادات للإسهال', scientific_names: ['Loperamide', 'ORS (Oral Rehydration Salts)'] },
                ],
                counselingPoints: [
                    'شرب كميات كافية من الماء ضروري عند استخدام الملينات.',
                    'لا يستخدم Loperamide في حالة الإسهال الدموي أو الحمى الشديدة.',
                    'ORS ضروري جداً خاصة للأطفال وكبار السن لمنع الجفاف.'
                ]
            },
            {
                name: 'داء كرون (Crohn\'s Disease) والتهاب القولون التقرحي',
                overview: 'أمراض التهاب الأمعاء (IBD) هي حالات مزمنة تسبب التهاباً في الجهاز الهضمي.',
                drugClasses: [
                    { name: 'أمينوساليسيلات (5-ASA)', scientific_names: ['Mesalazine (Mesalamine)', 'Sulfasalazine'] },
                    { name: 'الكورتيكوستيرويدات', scientific_names: ['Prednisone', 'Budesonide'] },
                    { name: 'معدلات المناعة', scientific_names: ['Azathioprine', 'Mercaptopurine', 'Methotrexate'] },
                ],
                counselingPoints: [
                    'العلاج يهدف للسيطرة على الالتهاب ومنع الانتكاسات.',
                    'Sulfasalazine قد يلون البول والدموع باللون البرتقالي.',
                ]
            },
            {
                name: 'البواسير (Hemorrhoids)',
                overview: 'أوردة متورمة في الجزء السفلي من المستقيم والشرج.',
                drugClasses: [
                    { name: 'تحاميل وكريمات موضعية', scientific_names: ['Hydrocortisone/Lidocaine', 'Cinchocaine/Policresulen'] },
                    { name: 'ملينات البراز', scientific_names: ['Docusate Sodium'] },
                ],
                counselingPoints: ['زيادة تناول الألياف والسوائل لمنع الإمساك.', 'تجنب الجلوس لفترات طويلة على المرحاض.']
            },
            {
                name: 'حصوات الكلى (Kidney Stones)',
                overview: 'رواسب صلبة تتكون من المعادن والأملاح داخل الكلى. تسبب ألماً شديداً عند مرورها.',
                drugClasses: [
                    { name: 'مسكنات الألم', scientific_names: ['Ibuprofen', 'Diclofenac', 'Ketorolac'] },
                    { name: 'حاصرات ألفا (لتسهيل مرور الحصوة)', scientific_names: ['Tamsulosin'] },
                    { name: 'للوقاية', scientific_names: ['Potassium citrate', 'Hydrochlorothiazide (لبعض الأنواع)'] },
                ],
                counselingPoints: [
                    'شرب كميات كبيرة من الماء (2-3 لتر يومياً) هو أهم إجراء.',
                    'مسكنات NSAIDs فعالة جداً في تخفيف ألم المغص الكلوي.',
                ]
            }
        ]
    },
     {
        system: 'الغدد الصماء والسكري والسمنة',
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
            },
            {
                name: 'السمنة (Obesity) والتخسيس',
                overview: 'حالة طبية تتميز بزيادة الدهون في الجسم. العلاج يتضمن تغيير نمط الحياة وفي بعض الحالات الأدوية.',
                drugClasses: [
                    { name: 'مثبطات الليباز (تقلل امتصاص الدهون)', scientific_names: ['Orlistat'] },
                    { name: 'محفزات مستقبلات GLP-1', scientific_names: ['Liraglutide', 'Semaglutide'] },
                ],
                counselingPoints: [
                    'يجب استخدام هذه الأدوية مع نظام غذائي صحي وممارسة الرياضة.',
                    'Orlistat قد يسبب آثارًا جانبية دهنية في البراز ويتطلب تناول فيتامينات ذائبة في الدهون.',
                    'أدوية GLP-1 قد تسبب غثيانًا في بداية العلاج.',
                ]
            }
        ]
    },
    {
        system: 'الألم والالتهاب وأمراض العظام والمفاصل',
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
                name: 'الفصال العظمي (Osteoarthritis)',
                overview: 'الشكل الأكثر شيوعاً لالتهاب المفاصل، يحدث بسبب تآكل الغضروف الواقي في نهايات العظام.',
                drugClasses: [
                    { name: 'مسكنات الألم', scientific_names: ['Paracetamol', 'Ibuprofen (oral/topical)', 'Diclofenac (oral/topical)'] },
                    { name: 'مكملات غذائية', scientific_names: ['Glucosamine/Chondroitin'] },
                    { name: 'حقن موضعية', scientific_names: ['Corticosteroids', 'Hyaluronic acid'] },
                ],
                counselingPoints: [
                    'فقدان الوزن يقلل الضغط على المفاصل الحاملة للوزن مثل الركبتين.',
                    'العلاج الطبيعي والتمارين الخفيفة يمكن أن تقوي العضلات حول المفصل.',
                ]
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
        system: 'أمراض الجلد والشعر والأظافر',
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
                name: 'الصدفية (Psoriasis)',
                overview: 'مرض جلدي مزمن يسرّع دورة حياة خلايا الجلد، مما يؤدي إلى تراكمها بسرعة على سطح الجلد.',
                drugClasses: [
                    { name: 'كورتيكوستيرويدات موضعية', scientific_names: ['Clobetasol', 'Betamethasone', 'Hydrocortisone'] },
                    { name: 'نظائر فيتامين D', scientific_names: ['Calcipotriol', 'Calcitriol'] },
                    { name: 'Retinoids', scientific_names: ['Tazarotene'] },
                    { name: 'علاجات جهازية', scientific_names: ['Methotrexate', 'Ciclosporin', 'Acitretin'] },
                ],
                counselingPoints: [
                    'الترطيب المستمر للجلد يساعد في تقليل الحكة والتقشر.',
                    'تجنب المحفزات المعروفة مثل التوتر وبعض الأدوية.',
                ]
            },
             {
                name: 'فطريات القدم (Athlete\'s Foot)',
                overview: 'عدوى فطرية شائعة تصيب جلد القدمين، خاصة بين أصابع القدم.',
                drugClasses: [
                    { name: 'مضادات الفطريات الموضعية (Azoles)', scientific_names: ['Clotrimazole', 'Miconazole', 'Ketoconazole'] },
                    { name: 'مضادات الفطريات الموضعية (Allylamines)', scientific_names: ['Terbinafine'] },
                ],
                counselingPoints: [
                    'جفف قدميك جيداً بعد الاستحمام، خاصة بين الأصابع.',
                    'ارتدِ جوارب قطنية وغيّرها يومياً.',
                    'استمر في استخدام العلاج لمدة أسبوع إلى أسبوعين بعد اختفاء الأعراض لمنع عودتها.',
                ]
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
        system: 'أمراض العين والأذن والحنجرة',
        icon: Ear,
        diseases: [
            {
                name: 'التهاب الملتحمة (Conjunctivitis)',
                overview: 'يعالج حسب السبب (بكتيري، فيروسي، تحسسي).',
                drugClasses: [
                    { name: 'قطرات مضاد حيوي', scientific_names: ['chloramphenicol', 'ofloxacin', 'tobramycin'] },
                    { name: 'قطرات مضادة للهيستامين', scientific_names: ['olopatadine', 'ketotifen'] },
                ],
                counselingPoints: ['تجنب لمس طرف القطارة للعين لمنع التلوث.', 'إذا كنت تستخدم أكثر من نوع من القطرات، انتظر 5 دقائق بين كل نوع.']
            },
            {
                name: 'الساد (Cataract)',
                overview: 'إعتام عدسة العين، مما يسبب ضبابية في الرؤية. العلاج الوحيد الفعال هو الجراحة.',
                drugClasses: [
                    { name: 'لا يوجد علاج دوائي', scientific_names: [], mechanism: 'الجراحة هي الحل الوحيد لاستبدال العدسة المعتمة.' },
                ],
                counselingPoints: [
                    'ارتداء النظارات الشمسية قد يساعد في إبطاء تطور الساد.',
                    'النصيحة الرئيسية هي توجيه المريض إلى طبيب العيون لتقييم الحاجة للجراحة.',
                ]
            },
             {
                name: 'إنتانات الأذن (Ear Infections)',
                overview: 'التهاب الأذن الوسطى (Otitis Media) هو الأكثر شيوعاً، خاصة عند الأطفال.',
                drugClasses: [
                    { name: 'مسكنات الألم', scientific_names: ['Paracetamol', 'Ibuprofen'] },
                    { name: 'مضادات حيوية فموية', scientific_names: ['Amoxicillin', 'Amoxicillin/clavulanic acid'] },
                    { name: 'قطرات أذن (في حالات معينة)', scientific_names: ['Ciprofloxacin/Dexamethasone'] },
                ],
                counselingPoints: [
                    'غالباً ما تُوصف المضادات الحيوية إذا لم تتحسن الأعراض بعد 48-72 ساعة.',
                    'تسكين الألم مهم جداً في بداية العلاج.',
                ]
            },
            {
                name: 'طنين الأذن (Tinnitus)',
                overview: 'سماع صوت في الأذن (مثل رنين أو أزيز) دون وجود مصدر صوت خارجي. لا يوجد علاج شافٍ، ولكن يمكن التحكم في الأعراض.',
                drugClasses: [
                    { name: 'لا يوجد علاج دوائي معتمد بشكل عام', scientific_names: [] },
                    { name: 'أحياناً تستخدم', scientific_names: ['Alprazolam (للقلق المصاحب)', 'Amitriptyline (بجرعات منخفضة)'] },
                ],
                counselingPoints: [
                    'تجنب الضوضاء العالية.',
                    'تقليل التوتر والكافيين يمكن أن يساعد.',
                    'العلاج السلوكي المعرفي (CBT) وأجهزة إخفاء الصوت (Masking devices) هي من أكثر الطرق فعالية.',
                ]
            }
        ]
    },
    {
        system: 'صحة الفم والأسنان',
        icon: SmilePlus,
        diseases: [
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
            },
            {
                name: 'التهاب اللثة (Gingivitis) ومرض دواعم السن (Periodontitis)',
                overview: 'التهاب اللثة هو المرحلة الأولى، وإذا لم يعالج قد يتطور إلى مرض دواعم السن الذي يؤثر على العظم الداعم للأسنان.',
                drugClasses: [
                    { name: 'غسولات فم مطهرة', scientific_names: ['Chlorhexidine gluconate'] },
                    { name: 'مضادات حيوية (في الحالات المتقدمة)', scientific_names: ['Metronidazole', 'Doxycycline'] },
                ],
                counselingPoints: [
                    'العناية بنظافة الفم هي حجر الزاوية في الوقاية والعلاج.',
                    'استخدام غسول الكلورهيكسيدين لفترات طويلة قد يسبب تصبغ الأسنان.',
                    'زيارة طبيب الأسنان بانتظام ضرورية.',
                ]
            },
            {
                name: 'السلاق الفموي (Oral Thrush)',
                overview: 'عدوى فطرية (Candida albicans) تسبب بقعاً بيضاء كريمية على اللسان وداخل الفم.',
                drugClasses: [
                    { name: 'مضادات الفطريات الموضعية', scientific_names: ['Miconazole (oral gel)', 'Nystatin (suspension)'] },
                    { name: 'مضادات الفطريات الجهازية (للحالات الشديدة)', scientific_names: ['Fluconazole'] },
                ],
                counselingPoints: [
                    'يجب وضع الجل أو المضمضة في الفم لأطول فترة ممكنة قبل البلع.',
                    'من المهم علاج السبب الأساسي إن وجد (مثل استخدام البخاخات الكورتيزونية دون مضمضة الفم).',
                ]
            }
        ]
    },
    {
        system: 'أمراض المناعة الذاتية',
        icon: BrainCircuit,
        diseases: [
            {
                name: 'داء الذئبة (Lupus)',
                overview: 'مرض مناعي ذاتي مزمن يمكن أن يؤثر على العديد من أجزاء الجسم، بما في ذلك المفاصل والجلد والكلى والدم والدماغ.',
                drugClasses: [
                    { name: 'مضادات الالتهاب غير الستيرويدية (NSAIDs)', scientific_names: ['Ibuprofen', 'Naproxen'] },
                    { name: 'مضادات الملاريا', scientific_names: ['Hydroxychloroquine'] },
                    { name: 'الكورتيكوستيرويدات', scientific_names: ['Prednisone'] },
                    { name: 'مثبطات المناعة', scientific_names: ['Azathioprine', 'Mycophenolate mofetil', 'Belimumab'] },
                ],
                counselingPoints: [
                    'الوقاية من الشمس ضرورية جداً لأنها قد تثير نوبات المرض.',
                    'Hydroxychloroquine يتطلب فحصاً دورياً للعين.',
                ]
            },
        ]
    },
     {
        system: 'الأورام (Oncology)',
        icon: Radiation,
        diseases: [
            {
                name: 'السرطان (Cancer)',
                overview: 'مجموعة واسعة من الأمراض التي تتميز بنمو الخلايا غير الطبيعي. دور الصيدلي يركز على إدارة الأعراض الجانبية للعلاج الكيميائي وتقديم الدعم.',
                drugClasses: [
                    { name: 'مضادات الغثيان والقيء', scientific_names: ['Ondansetron', 'Granisetron', 'Aprepitant', 'Dexamethasone'] },
                    { name: 'محفزات خلايا الدم البيضاء (لمنع العدوى)', scientific_names: ['Filgrastim', 'Pegfilgrastim'] },
                    { name: 'مسكنات الألم', scientific_names: ['Morphine', 'Oxycodone', 'Fentanyl'] },
                ],
                counselingPoints: [
                    'الدعم النفسي للمريض وعائلته جزء مهم من الرعاية.',
                    'التعامل مع الآثار الجانبية (مثل تقرحات الفم، الإسهال) بشكل فعال يحسن جودة حياة المريض.',
                    'يجب توجيه المرضى دائماً إلى فريقهم الطبي المختص لأي استفسارات حول علاج السرطان نفسه.',
                ]
            },
        ]
    },
    {
        system: 'الفيتامينات واللقاحات وأدوية التخزين البارد',
        icon: Syringe,
        diseases: [
            {
                name: 'الفيتامينات والمعادن',
                overview: 'مغذيات دقيقة ضرورية لوظائف الجسم. تنقسم إلى ذائبة في الدهون (A, D, E, K) وذائبة في الماء (B complex, C).',
                drugClasses: [
                    { name: 'Vitamin D', scientific_names: ['Cholecalciferol (D3)'], mechanism: 'صحة العظام والمناعة' },
                    { name: 'Vitamin B12', scientific_names: ['Cyanocobalamin', 'Methylcobalamin'], mechanism: 'صحة الأعصاب وتكوين الدم' },
                    { name: 'Iron', scientific_names: ['Ferrous Sulfate'], mechanism: 'علاج فقر الدم' },
                    { name: 'Folic Acid (B9)', scientific_names: ['Folic Acid'], mechanism: 'مهم للحمل ونمو الخلايا' },
                ],
                counselingPoints: [
                    'تناول الفيتامينات الذائبة في الدهون مع وجبة دهنية لزيادة الامتصاص.',
                    'فيتامين B12 ضروري لكبار السن والنباتيين.',
                    'حمض الفوليك حيوي للنساء في سن الإنجاب.',
                ]
            },
            {
                name: 'اللقاحات الأساسية للأطفال',
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
            },
            {
                name: 'أدوية السلسلة الباردة (Cold Chain)',
                overview: 'بعض الأدوية، وخاصة البيولوجية منها، تفقد فعاليتها إذا لم يتم تخزينها في درجات حرارة مناسبة (عادة بين 2-8 درجات مئوية).',
                drugClasses: [
                    { name: 'الأنسولين (Insulin)', scientific_names: ['All types'] },
                    { name: 'بعض اللقاحات (Vaccines)', scientific_names: [] },
                    { name: 'قطرات العين', scientific_names: ['Latanoprost'] },
                    { name: 'الأدوية البيولوجية', scientific_names: ['Adalimumab', 'Etanercept'] },
                ],
                counselingPoints: [
                    'يجب تخزين هذه الأدوية في الثلاجة، وليس في باب الثلاجة أو الفريزر.',
                    'عند السفر، استخدم حافظة مبردة مع عبوات ثلج.',
                    'قلم الأنسولين قيد الاستخدام يمكن حفظه في درجة حرارة الغرفة (أقل من 25-30 درجة) لمدة تصل إلى شهر.',
                    'لا تستخدم أي دواء من هذه الفئة إذا كنت تشك في أنه تعرض لحرارة زائدة أو تجمّد.'
                ]
            }
        ]
    },
    {
        system: 'مستحضرات التجميل والعناية بالبشرة',
        icon: Leaf,
        diseases: [
            {
                name: 'أساسيات العناية بالبشرة',
                overview: 'روتين العناية بالبشرة الفعال يتكون من خطوات أساسية: التنظيف، الترطيب، والحماية. الهدف هو الحفاظ على صحة حاجز البشرة.',
                drugClasses: [
                    { name: 'المنظفات (Cleansers)', scientific_names: ['Glycerin', 'Ceramides', 'Salicylic Acid', 'Benzoyl Peroxide'], mechanism: 'إزالة الأوساخ والزيوت والشوائب. يتم اختيارها حسب نوع البشرة (جافة، دهنية، حساسة).' },
                    { name: 'المرطبات (Moisturizers)', scientific_names: ['Hyaluronic Acid', 'Glycerin', 'Ceramides', 'Dimethicone', 'Urea'], mechanism: 'تعمل على حبس الرطوبة داخل البشرة وتقوية حاجز الحماية الطبيعي.' },
                    { name: 'واقيات الشمس (Sunscreens)', scientific_names: ['Zinc Oxide', 'Titanium Dioxide', 'Avobenzone', 'Octocrylene'], mechanism: 'حماية البشرة من أضرار الأشعة فوق البنفسجية (UVA/UVB) التي تسبب الشيخوخة المبكرة وسرطان الجلد.' },
                ],
                counselingPoints: [
                    'نظّف بشرتك مرتين يومياً.',
                    'استخدم مرطباً مناسباً لنوع بشرتك حتى لو كانت دهنية.',
                    'استخدم واقي الشمس يومياً، حتى في الأيام الغائمة، وجدده كل ساعتين عند التعرض المباشر للشمس.',
                ]
            },
            {
                name: 'مكونات فعالة شائعة',
                overview: 'مكونات نشطة تُضاف لمنتجات العناية بالبشرة لاستهداف مشاكل معينة مثل التجاعيد، التصبغات، وحب الشباب.',
                drugClasses: [
                    { name: 'Vitamin C (Ascorbic Acid)', scientific_names: ['L-Ascorbic Acid', 'Magnesium Ascorbyl Phosphate'], mechanism: 'مضاد أكسدة قوي، يحفز إنتاج الكولاجين، ويوحّد لون البشرة.' },
                    { name: 'Niacinamide (Vitamin B3)', scientific_names: ['Niacinamide'], mechanism: 'يحسن من وظيفة حاجز البشرة، يقلل الاحمرار، ينظم إفراز الدهون، ويقلل من ظهور المسام.' },
                    { name: 'Retinoids', scientific_names: ['Retinol', 'Retinaldehyde', 'Adapalene'], mechanism: 'تسرّع من عملية تجدد الخلايا، تحفز الكولاجين، وتعالج حب الشباب والتجاعيد.' },
                ],
                counselingPoints: [
                    'ابدأ باستخدام الرتينويدات بتركيز منخفض وتدريجياً.',
                    'استخدم فيتامين C في الصباح للحماية من الأكسدة، والرتينويدات في المساء.',
                    'النياسيناميد مكون متعدد الاستخدامات ويمكن دمجه مع معظم المكونات الأخرى.',
                ]
            },
             {
                name: 'علاج التصبغات وتفتيح البشرة',
                overview: 'تهدف هذه المنتجات إلى تقليل ظهور البقع الداكنة وتوحيد لون البشرة عن طريق تثبيط إنتاج صبغة الميلانين أو تقشير الجلد.',
                drugClasses: [
                    { name: 'مثبطات التيروزيناز', scientific_names: ['Hydroquinone (بوصفة طبية)', 'Arbutin', 'Kojic Acid', 'Azelaic Acid'], mechanism: 'تمنع الإنزيم المسؤول عن إنتاج الميلانين.' },
                    { name: 'مقشرات كيميائية', scientific_names: ['Glycolic Acid (AHA)', 'Lactic Acid (AHA)', 'Salicylic Acid (BHA)'], mechanism: 'تزيل خلايا الجلد الميتة وتكشف عن بشرة أفتح وأكثر إشراقاً.' },
                ],
                counselingPoints: [
                    'استخدام واقي الشمس ضروري جداً عند استخدام منتجات التفتيح لمنع نتائج عكسية.',
                    'قد تسبب بعض المكونات تهيجاً في البداية، استخدمها تدريجياً.',
                ]
            },
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
