"use client";

import * as React from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import type { TransactionLogEntry } from "@/lib/db";
import { RefreshCw, Search, Eye, AlertTriangle, CheckCircle2, Clock, XCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

function StatusBadge({ status }: { status: TransactionLogEntry['status'] }) {
    if (status === 'synced') {
        return (
            <Badge className="gap-1 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                <CheckCircle2 className="h-3 w-3" />
                مزامن
            </Badge>
        );
    }
    if (status === 'failed') {
        return (
            <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" />
                فشل
            </Badge>
        );
    }
    return (
        <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            معلق
        </Badge>
    );
}

export default function TransactionLogPage() {
    const { currentUser } = useAuth();
    const { toast } = useToast();

    const [entries, setEntries] = React.useState<TransactionLogEntry[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'synced' | 'failed'>('all');
    const [selectedEntry, setSelectedEntry] = React.useState<TransactionLogEntry | null>(null);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);

    const loadEntries = React.useCallback(async () => {
        setLoading(true);
        try {
            const all = await db.transactionLog.orderBy('id').reverse().toArray();
            setEntries(all);
        } catch (e) {
            console.error('[TransactionLog] Failed to load:', e);
            toast({ variant: 'destructive', title: 'خطأ في تحميل السجل' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        loadEntries();
    }, [loadEntries]);

    const filtered = React.useMemo(() => {
        return entries.filter(entry => {
            const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
            const matchesSearch = !searchTerm ||
                entry.localId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (entry.serverId && entry.serverId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (entry.employeeName && entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                entry.saleData?.items?.some((item: any) =>
                    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                );
            return matchesStatus && matchesSearch;
        });
    }, [entries, statusFilter, searchTerm]);

    const counts = React.useMemo(() => ({
        all: entries.length,
        pending: entries.filter(e => e.status === 'pending').length,
        synced: entries.filter(e => e.status === 'synced').length,
        failed: entries.filter(e => e.status === 'failed').length,
    }), [entries]);

    const openDetail = (entry: TransactionLogEntry) => {
        setSelectedEntry(entry);
        setIsDetailOpen(true);
    };

    const handleDeleteEntry = async (id: number) => {
        await db.transactionLog.delete(id);
        setEntries(prev => prev.filter(e => e.id !== id));
        setIsDetailOpen(false);
        toast({ title: 'تم حذف السجل' });
    };

    const handleClearSynced = async () => {
        await db.transactionLog.where('status').equals('synced').delete();
        await loadEntries();
        toast({ title: 'تم مسح السجلات المزامنة' });
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                    { key: 'all', label: 'الكل', className: '', activeClass: 'ring-2 ring-primary' },
                    { key: 'pending', label: 'معلق', className: 'text-yellow-600', activeClass: 'ring-2 ring-yellow-500' },
                    { key: 'synced', label: 'مزامن', className: 'text-green-600', activeClass: 'ring-2 ring-green-500' },
                    { key: 'failed', label: 'فشل', className: 'text-destructive', activeClass: 'ring-2 ring-destructive' },
                ] as const).map(({ key, label, className, activeClass }) => (
                    <Card
                        key={key}
                        className={`cursor-pointer transition-colors ${statusFilter === key ? activeClass : ''}`}
                        onClick={() => setStatusFilter(key as typeof statusFilter)}
                    >
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className={`text-sm font-medium ${className || 'text-muted-foreground'}`}>{label}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className={`text-2xl font-bold font-mono ${className}`}>{counts[key]}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {counts.pending > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 p-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>يوجد {counts.pending} عملية معلقة</strong> — هذه العمليات محفوظة محلياً ولم تُرسل إلى الخادم بعد.
                        ستتم المزامنة تلقائياً عند الاتصال بالإنترنت.
                    </div>
                </div>
            )}

            {counts.failed > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <div className="text-sm text-red-800 dark:text-red-300">
                        <strong>يوجد {counts.failed} عملية فاشلة</strong> — اضغط على "عرض" لرؤية التفاصيل وبيانات الفاتورة كاملة.
                        يمكنك إدخالها يدوياً أو التواصل مع الدعم.
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <CardTitle>سجل المعاملات</CardTitle>
                            <CardDescription>
                                كل فاتورة تم إنشاؤها — سواء كانت أونلاين أو أوفلاين — مسجلة هنا بشكل دائم.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {counts.synced > 0 && (
                                <Button variant="outline" size="sm" onClick={handleClearSynced}>
                                    مسح المزامنة
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={loadEntries} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 me-2 ${loading ? 'animate-spin' : ''}`} />
                                تحديث
                            </Button>
                        </div>
                    </div>
                    <div className="pt-2">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ابحث بالرقم، اسم الموظف، أو اسم الدواء..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pr-9"
                                dir="rtl"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">المعرف المحلي</TableHead>
                                <TableHead className="text-right">رقم الخادم</TableHead>
                                <TableHead className="text-right">الموظف</TableHead>
                                <TableHead className="text-right">الأصناف</TableHead>
                                <TableHead className="text-right">الإجمالي</TableHead>
                                <TableHead className="text-right">وقت الإنشاء</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="w-20"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                : filtered.length === 0
                                    ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                                لا توجد سجلات مطابقة
                                            </TableCell>
                                        </TableRow>
                                    )
                                    : filtered.map(entry => {
                                        const itemCount = entry.saleData?.items?.length ?? 0;
                                        const total = entry.saleData?.total ?? 0;
                                        return (
                                            <TableRow key={entry.id} className={entry.status === 'failed' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                                <TableCell className="font-mono text-xs text-muted-foreground">{entry.localId}</TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {entry.serverId ?? <span className="text-muted-foreground">—</span>}
                                                </TableCell>
                                                <TableCell>{entry.employeeName ?? '—'}</TableCell>
                                                <TableCell className="font-mono">{itemCount}</TableCell>
                                                <TableCell className="font-mono">{Number(total).toLocaleString()}</TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {new Date(entry.createdAt).toLocaleString('ar-EG', {
                                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                                        hour: 'numeric', minute: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell><StatusBadge status={entry.status} /></TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => openDetail(entry)}
                                                    >
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                            }
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Detail dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تفاصيل المعاملة</DialogTitle>
                        <DialogDescription className="font-mono text-xs">{selectedEntry?.localId}</DialogDescription>
                    </DialogHeader>
                    {selectedEntry && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <Label className="text-xs text-muted-foreground">الحالة</Label>
                                    <div className="mt-1"><StatusBadge status={selectedEntry.status} /></div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">رقم الخادم</Label>
                                    <div className="mt-1 font-mono">{selectedEntry.serverId ?? '—'}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">الموظف</Label>
                                    <div className="mt-1">{selectedEntry.employeeName ?? '—'}</div>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">وقت الإنشاء</Label>
                                    <div className="mt-1 font-mono text-xs">
                                        {new Date(selectedEntry.createdAt).toLocaleString('ar-EG')}
                                    </div>
                                </div>
                                {selectedEntry.syncedAt && (
                                    <div>
                                        <Label className="text-xs text-muted-foreground">وقت المزامنة</Label>
                                        <div className="mt-1 font-mono text-xs">
                                            {new Date(selectedEntry.syncedAt).toLocaleString('ar-EG')}
                                        </div>
                                    </div>
                                )}
                                {selectedEntry.errorMessage && (
                                    <div className="col-span-2">
                                        <Label className="text-xs text-destructive">رسالة الخطأ</Label>
                                        <div className="mt-1 text-xs text-destructive bg-red-50 dark:bg-red-900/20 rounded p-2 font-mono">
                                            {selectedEntry.errorMessage}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground mb-2 block">أصناف الفاتورة</Label>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">الاسم</TableHead>
                                            <TableHead className="text-right">الكمية</TableHead>
                                            <TableHead className="text-right">السعر</TableHead>
                                            <TableHead className="text-right">الإجمالي</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(selectedEntry.saleData?.items ?? []).map((item: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="font-mono">{item.quantity}</TableCell>
                                                <TableCell className="font-mono">{Number(item.price).toLocaleString()}</TableCell>
                                                <TableCell className="font-mono">{(item.quantity * item.price).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex justify-between text-sm font-semibold border-t pt-3">
                                <span>الإجمالي</span>
                                <span className="font-mono">{Number(selectedEntry.saleData?.total ?? 0).toLocaleString()}</span>
                            </div>

                            {/* Raw JSON for support/debugging */}
                            <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                    عرض البيانات الكاملة (للدعم الفني)
                                </summary>
                                <pre className="mt-2 bg-muted rounded p-3 overflow-x-auto text-xs leading-relaxed text-left" dir="ltr">
                                    {JSON.stringify(selectedEntry.saleData, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:justify-between">
                        {selectedEntry && currentUser?.role === 'Admin' && selectedEntry.id && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteEntry(selectedEntry.id!)}
                            >
                                حذف من السجل
                            </Button>
                        )}
                        <DialogClose asChild>
                            <Button variant="outline">إغلاق</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
