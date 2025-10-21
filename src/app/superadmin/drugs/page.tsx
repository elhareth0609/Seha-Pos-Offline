
"use client";

import * as React from "react";
import * as XLSX from 'xlsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Medication, PaginatedResponse } from "@/lib/types";
import { ArrowLeft, Upload } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import Link from 'next/link';

export default function CentralDrugsPage() {
    const { getCentralDrugs, uploadCentralDrugList } = useAuth();
    const { toast } = useToast();

    const [drugs, setDrugs] = React.useState<Medication[]>([]);
    const [loadingDrugs, setLoadingDrugs] = React.useState(true);
    
    const [drugCurrentPage, setDrugCurrentPage] = React.useState(1);
    const [drugTotalPages, setDrugTotalPages] = React.useState(1);
    const [drugSearchTerm, setDrugSearchTerm] = React.useState("");
    const [perPage, setPerPage] = React.useState(15);
    const [isImporting, setIsImporting] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const fetchDrugs = React.useCallback(async () => {
        setLoadingDrugs(true);
        const data = await getCentralDrugs(drugCurrentPage, perPage, drugSearchTerm);
        setDrugs(data.data);
        setDrugTotalPages(data.last_page);
        setLoadingDrugs(false);
    }, [getCentralDrugs, drugCurrentPage, perPage, drugSearchTerm]);

    React.useEffect(() => {
        fetchDrugs();
    }, [fetchDrugs]);
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    toast({ variant: 'destructive', title: 'ملف فارغ' });
                    setIsImporting(false);
                    return;
                }

                const medicationsToProcess: Partial<Medication>[] = jsonData.map(row => ({
                    name: row['الاسم التجاري'],
                    scientific_names: (row['الاسم العلمي'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
                    barcodes: (row['الباركود'] || '').split(',').map((s: string) => String(s).trim()).filter(Boolean),
                    dosage_form: row['الشكل الدوائي'],
                }));
                
                await uploadCentralDrugList(medicationsToProcess);
                toast({ title: "تم رفع الملف بنجاح", description: `جاري معالجة ${medicationsToProcess.length} دواء.` });
                fetchDrugs();

            } catch (error) {
                console.error('Error importing from Excel:', error);
                toast({ variant: 'destructive', title: 'خطأ في الاستيراد' });
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>قاعدة بيانات الأدوية المركزية</CardTitle>
                            <CardDescription>إدارة قائمة الأدوية الرئيسية التي تستخدمها جميع الصيدليات.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/superadmin"><ArrowLeft className="me-2"/>العودة للوحة التحكم</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <Input 
                            placeholder="ابحث في الأدوية..."
                            value={drugSearchTerm}
                            onChange={(e) => setDrugSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <Button onClick={handleImportClick} disabled={isImporting}>
                            <Upload className="me-2 h-4 w-4" />
                            {isImporting ? "جاري الاستيراد..." : "رفع ملف الأدوية (Excel)"}
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".xlsx, .xls"
                        />
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الاسم التجاري</TableHead>
                                <TableHead>الاسم العلمي</TableHead>
                                <TableHead>الشكل الدوائي</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingDrugs ? Array(5).fill(0).map((_,i) => <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-5 w-full"/></TableCell></TableRow>)
                            : drugs.map(drug => (
                                <TableRow key={drug.id}>
                                    <TableCell>{drug.name}</TableCell>
                                    <TableCell>{drug.scientific_names?.join(', ')}</TableCell>
                                    <TableCell>{drug.dosage_form}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                     <div className="flex items-center justify-between pt-4">
                        <span className="text-sm text-muted-foreground">
                            الصفحة {drugCurrentPage} من {drugTotalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDrugCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={drugCurrentPage === 1 || loadingDrugs}
                            >
                                السابق
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDrugCurrentPage(p => Math.min(p + 1, drugTotalPages))}
                                disabled={drugCurrentPage === drugTotalPages || loadingDrugs}
                            >
                                التالي
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
