
"use client"

import * as React from "react"
import Image from 'next/image';
import { useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { PurchaseOrder, Medication, Supplier, ReturnOrder, PurchaseOrderItem, ReturnOrderItem, PaginatedResponse } from "@/lib/types"
import { PlusCircle, ChevronDown, Trash2, X, Pencil, Percent, FilePlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from "@/components/ui/skeleton"

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const dosage_forms = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Cream", "Gel", "Suppository", "Inhaler", "Drops", "Powder", "Lotion", "spray"];

type PurchaseItemFormData = Partial<PurchaseOrderItem> & { profit_margin?: number };

export default function PurchasesPage() {
  const { toast } = useToast()
  const { 
      scopedData, 
      addSupplier, 
      addPurchaseOrder, 
      addReturnOrder,
      getPaginatedPurchaseOrders,
      getPaginatedReturnOrders,
      searchAllInventory,
      addMedication,
      deletePurchaseOrder, 
      deleteReturnOrder,
    } = useAuth();
  
  const {
      suppliers: [suppliers, setSuppliers],
  } = scopedData;


  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // Purchase Form State
  const [purchase_id, setPurchaseId] = React.useState('');
  const [purchaseOrderIdToUpdate, setPurchaseOrderIdToUpdate] = React.useState<string | null>(null);
  const [purchaseSupplierId, setPurchaseSupplierId] = React.useState('');
  const [purchaseItems, setPurchaseItems] = React.useState<PurchaseOrderItem[]>([]);
  const [purchaseItemSearchTerm, setPurchaseItemSearchTerm] = React.useState('');
  const [purchaseItemSuggestions, setPurchaseItemSuggestions] = React.useState<Medication[]>([]);
  const [purchaseItemNameSearchTerm, setPurchaseItemNameSearchTerm] = React.useState('');
  const [purchaseItemNameSuggestions, setPurchaseItemNameSuggestions] = React.useState<Medication[]>([]);
  const [purchaseItemBarcodeSearchTerm, setPurchaseItemBarcodeSearchTerm] = React.useState('');
  const [purchaseItemBarcodeSuggestions, setPurchaseItemBarcodeSuggestions] = React.useState<Medication[]>([]);
  const barcodeInputRef = React.useRef<HTMLInputElement>(null);
  const [isPurchaseInfoLocked, setIsPurchaseInfoLocked] = React.useState(false);
  
  // State for return form
  const [returnSlipId, setReturnSlipId] = React.useState('');
  const [returnOrderIdToUpdate, setReturnOrderIdToUpdate] = React.useState<string | null>(null);
  const [returnSupplierId, setReturnSupplierId] = React.useState('');
  const [returnCart, setReturnCart] = React.useState<ReturnOrderItem[]>([]);
  const [is_returnInfoLocked, setIsReturnInfoLocked] = React.useState(false);
  const [returnMedSearchTerm, setReturnMedSearchTerm] = React.useState("");
  const [returnMedSuggestions, setReturnMedSuggestions] = React.useState<Medication[]>([]);
  const [returnMedNameSearchTerm, setReturnMedNameSearchTerm] = React.useState("");
  const [returnMedNameSuggestions, setReturnMedNameSuggestions] = React.useState<Medication[]>([]);
  const [returnMedBarcodeSearchTerm, setReturnMedBarcodeSearchTerm] = React.useState("");
  const [returnMedBarcodeSuggestions, setReturnMedBarcodeSuggestions] = React.useState<Medication[]>([]);
  const returnBarcodeInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedMedForReturn, setSelectedMedForReturn] = React.useState<Medication | null>(null);
  const [returnItemQuantity, setReturnItemQuantity] = React.useState("1");
  const [returnItemReason, setReturnItemReason] = React.useState("");

  // Pagination and search for Purchase History
  const [purchaseHistory, setPurchaseHistory] = React.useState<PurchaseOrder[]>([]);
  const [purchaseTotalPages, setPurchaseTotalPages] = React.useState(1);
  const [purchaseCurrentPage, setPurchaseCurrentPage] = React.useState(1);
  const [purchasePerPage, setPurchasePerPage] = React.useState(10);
  const [purchaseLoading, setPurchaseLoading] = React.useState(true);
  const [purchaseSearchTerm, setPurchaseSearchTerm] = React.useState('');
  const [purchaseDateFrom, setPurchaseDateFrom] = React.useState('');
  const [purchaseDateTo, setPurchaseDateTo] = React.useState('');

  // Pagination and search for Return History
  const [returnHistory, setReturnHistory] = React.useState<ReturnOrder[]>([]);
  const [returnTotalPages, setReturnTotalPages] = React.useState(1);
  const [returnCurrentPage, setReturnCurrentPage] = React.useState(1);
  const [returnPerPage, setReturnPerPage] = React.useState(10);
  const [returnLoading, setReturnLoading] = React.useState(true);
  const [returnSearchTerm, setReturnSearchTerm] = React.useState('');
  const [returnDateFrom, setReturnDateFrom] = React.useState('');
  const [returnDateTo, setReturnDateTo] = React.useState('');

  const [activeTab, setActiveTab] = React.useState("new-purchase");
  
  // Refs for suggestion containers
  const nameSearchContainerRef = useRef<HTMLDivElement>(null);
  const barcodeSearchContainerRef = useRef<HTMLDivElement>(null);
  const returnNameSearchContainerRef = useRef<HTMLDivElement>(null);
  const returnBarcodeSearchContainerRef = useRef<HTMLDivElement>(null);

  // State for modal to add a completely new medication
  const [isAddNewMedModalOpen, setIsAddNewMedModalOpen] = React.useState(false);
  const [newMedData, setNewMedData] = React.useState<PurchaseItemFormData>({
      barcodes: [], scientific_names: [], stock: 0, reorder_point: 10,
      price: 0, purchase_price: 0, expiration_date: '',
      dosage: '', dosage_form: '', image_url: '', profit_margin: 0
  });
  const [newMedImageFile, setNewMedImageFile] = React.useState<File | null>(null);
  const [newMedImagePreview, setNewMedImagePreview] = React.useState<string | null>(null);
  
  // State for editing purchase item
  const [editingPurchaseItem, setEditingPurchaseItem] = React.useState<PurchaseItemFormData | null>(null);
  const [isEditItemOpen, setIsEditItemOpen] = React.useState(false);

    const calculateProfitMargin = (purchasePrice: number, sellPrice: number) => {
        if (!purchasePrice || purchasePrice <= 0) return 0;
        return ((sellPrice - purchasePrice) / purchasePrice) * 100;
    };

    const calculateSellPrice = (purchasePrice: number, margin: number) => {
        if (!purchasePrice || purchasePrice <= 0) return 0;
        return purchasePrice * (1 + margin / 100);
    };

    
    const handlePriceChange = (setter: React.Dispatch<React.SetStateAction<PurchaseItemFormData>> | React.Dispatch<React.SetStateAction<PurchaseItemFormData | null>>, name: 'price' | 'profit_margin' | 'purchase_price' | 'expiration_date' | 'quantity', value: string) => {
        const numericValue = parseFloat(value) || 0;
        setter((prev: PurchaseItemFormData | null) => {
            if (!prev) return prev;
            
            let { purchase_price = 0, price = 0, profit_margin = 0 } = prev;

            if (name === 'price') {
                price = numericValue;
                profit_margin = calculateProfitMargin(purchase_price, price);
            } else if (name === 'profit_margin') {
                profit_margin = numericValue;
                price = calculateSellPrice(purchase_price, profit_margin);
            } else if (name === 'purchase_price') {
                purchase_price = numericValue;
                if (price > 0) { // Recalculate profit if sell price is already set
                    profit_margin = calculateProfitMargin(purchase_price, price);
                } else if (profit_margin > 0) { // Recalculate sell price if margin is set
                    price = calculateSellPrice(purchase_price, profit_margin);
                }
            } else if (name === 'expiration_date') {
                return { ...prev, expiration_date: value };
            } else if (name === 'quantity') {
                return { ...prev, quantity: numericValue };
            }
            return { ...prev, purchase_price, price, profit_margin };
        });
    };

    const fetchPurchaseHistory = React.useCallback(async (page: number, limit: number, search: string, from: string, to: string) => {
        setPurchaseLoading(true);
        try {
            const data = await getPaginatedPurchaseOrders(page, limit, search, from, to);
            setPurchaseHistory(data.data);
            setPurchaseTotalPages(data.last_page);
            setPurchaseCurrentPage(data.current_page);
        } catch(e) {} finally {
            setPurchaseLoading(false);
        }
    }, [getPaginatedPurchaseOrders]);

    const fetchReturnHistory = React.useCallback(async (page: number, limit: number, search: string, from: string, to: string) => {
        setReturnLoading(true);
        try {
            const data = await getPaginatedReturnOrders(page, limit, search, from, to);
            setReturnHistory(data.data);
            setReturnTotalPages(data.last_page);
            setReturnCurrentPage(data.current_page);
        } catch(e) {} finally {
            setReturnLoading(false);
        }
    }, [getPaginatedReturnOrders]);

    React.useEffect(() => {
        if (activeTab === 'purchase-history') {
            const handler = setTimeout(() => {
                fetchPurchaseHistory(purchaseCurrentPage, purchasePerPage, purchaseSearchTerm, purchaseDateFrom, purchaseDateTo);
            }, 300);
            return () => clearTimeout(handler);
        }
    }, [activeTab, purchaseCurrentPage, purchasePerPage, purchaseSearchTerm, purchaseDateFrom, purchaseDateTo, fetchPurchaseHistory]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (barcodeInputRef.current && !barcodeInputRef.current.contains(event.target as Node)) {
            setPurchaseItemBarcodeSuggestions([]);
        }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    React.useEffect(() => {
        if (activeTab === 'return-history') {
            const handler = setTimeout(() => {
                fetchReturnHistory(returnCurrentPage, returnPerPage, returnSearchTerm, returnDateFrom, returnDateTo);
            }, 300);
            return () => clearTimeout(handler);
        }
    }, [activeTab, returnCurrentPage, returnPerPage, returnSearchTerm, returnDateFrom, returnDateTo, fetchReturnHistory]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (returnBarcodeInputRef.current && !returnBarcodeInputRef.current.contains(event.target as Node)) {
            setReturnMedBarcodeSuggestions([]);
        }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    const toggleRow = (id: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(id)) {
        newExpandedRows.delete(id);
        } else {
        newExpandedRows.add(id);
        }
        setExpandedRows(newExpandedRows);
    };
  
    const handleAddSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("supplier_name") as string;
        const contact_person = formData.get("supplierContact") as string;

        if (!name) {
            toast({ variant: "destructive", title: "اسم المورد مطلوب" });
            return;
        }
        
        const newSupplier = await addSupplier({ name, contact_person });

        if (newSupplier) {
            setPurchaseSupplierId(newSupplier.id);
            setIsAddSupplierOpen(false);
        }
    };

    const handlePurchaseNameSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPurchaseItemNameSearchTerm(value);

        if (value.length > 0) {
            const results = await searchAllInventory(value);
            setPurchaseItemNameSuggestions(results.slice(0, 5));
        } else {
            setPurchaseItemNameSuggestions([]);
        }
    };

    const handlePurchaseBarcodeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPurchaseItemBarcodeSearchTerm(value);
        if (value.length === 0) {
            setPurchaseItemBarcodeSuggestions([]);
        }
    }

    const handlePurchaseBarcodeSearchKeyDown = React.useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if(purchaseItemBarcodeSearchTerm) {
                const results = await searchAllInventory(purchaseItemBarcodeSearchTerm);
                setPurchaseItemBarcodeSuggestions(results.slice(0, 5));
                setPurchaseItemBarcodeSearchTerm("");
            }
        }
    }, [purchaseItemBarcodeSearchTerm]);

    const handleSelectMed = (med: Medication, asNewBatch: boolean = false) => {
        const medData: PurchaseItemFormData = {
            ...med,
            id: asNewBatch ? `new-${Date.now()}` : med.id, 
            medication_id: med.id,
            profit_margin: calculateProfitMargin(med.purchase_price, med.price),
            is_new: asNewBatch,
            name: asNewBatch ? `${med.name} (دفعة جديدة)` : med.name,
        };
        if (asNewBatch) {
            medData.stock = 0; 
            medData.expiration_date = '';
        }
        setNewMedData(medData);
        setPurchaseItemNameSearchTerm(med.name);
        setPurchaseItemNameSuggestions([]);
        setPurchaseItemBarcodeSearchTerm("");
        setPurchaseItemBarcodeSuggestions([]);
        document.getElementById("quantity")?.focus();
    };

    // Handle clicks outside suggestion containers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
        if (nameSearchContainerRef.current && !nameSearchContainerRef.current.contains(event.target as Node)) {
            setPurchaseItemNameSuggestions([]);
        }
        
        if (barcodeSearchContainerRef.current && !barcodeSearchContainerRef.current.contains(event.target as Node)) {
            setPurchaseItemBarcodeSuggestions([]);
        }
        
        if (returnNameSearchContainerRef.current && !returnNameSearchContainerRef.current.contains(event.target as Node)) {
            setReturnMedNameSuggestions([]);
        }
        
        if (returnBarcodeSearchContainerRef.current && !returnBarcodeSearchContainerRef.current.contains(event.target as Node)) {
            setReturnMedBarcodeSuggestions([]);
        }
        };

        document.addEventListener("mousedown", handleClickOutside);
        
        return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const openNewMedModal = () => {
        setNewMedData({
            barcodes: [],
            scientific_names: [], 
            stock: 0, 
            reorder_point: 10,
            price: 0, 
            purchase_price: 0, 
            expiration_date: '',
            dosage: '', 
            dosage_form: '', 
            image_url: '', 
            profit_margin: 0,
            is_new: true, // Mark as a completely new medication
        });
        setNewMedImageFile(null);
        setNewMedImagePreview(null);
        setIsAddNewMedModalOpen(true);
    }

    const handleAddNewMedSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let imageUrl = newMedData.image_url || '';
        if (newMedImageFile) {
            imageUrl = await fileToDataUri(newMedImageFile);
        }

        const { profit_margin, ...medToAdd } = newMedData;
        const medWithImage = {
            ...medToAdd,
            image_url: imageUrl,
            stock: medToAdd.quantity,
        };
        
        const newMedication = await addMedication(medWithImage);

        if (newMedication) {
            const newItemForPurchase: PurchaseOrderItem = {
                ...newMedication,
                id: newMedication.id,
                medication_id: newMedication.id,
                quantity: newMedData.quantity || 1,
                purchase_price: newMedData.purchase_price || 0,
                price: newMedData.price || 0,
                expiration_date: newMedData.expiration_date || '',
                is_new: true
            };
            setPurchaseItems(prev => [...prev, newItemForPurchase]);
            setIsAddNewMedModalOpen(false);
        }
    }


    const handleAddItemToPurchase = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!purchase_id || !purchaseSupplierId) {
            toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء إدخال رقم قائمة الشراء واختيار المورد." });
            return;
        }
        
        if (!newMedData.id) {
            openNewMedModal();
            return;
        }

        const { profit_margin, ...itemData } = newMedData;

        const newItem = {
        ...itemData,
        id: itemData.id!,
        medication_id: itemData.medication_id!,
        };
        
        setPurchaseItems(prev => [...prev, newItem as PurchaseOrderItem]);
        setIsPurchaseInfoLocked(true);
        
        setNewMedData({});
        setPurchaseItemNameSearchTerm("");
        setPurchaseItemNameSuggestions([]);
        setPurchaseItemBarcodeSearchTerm("");
        setPurchaseItemBarcodeSuggestions([]);
        document.getElementById("purchase-item-name-search")?.focus();
    };

    const handleRemoveFromPurchase = (medId: string) => {
        setPurchaseItems(prev => prev.filter(item => item.id !== medId));
    }

    const handleFinalizePurchase = async () => {
        if (purchaseItems.length === 0) {
            toast({ variant: "destructive", title: "القائمة فارغة", description: "الرجاء إضافة أصناف إلى قائمة الشراء أولاً." });
            return;
        }

        const supplier = suppliers.find(s => s.id == purchaseSupplierId);
        if (!supplier) return;

        const purchaseData = {
            id: purchaseOrderIdToUpdate,
            number: purchase_id,
            supplier_id: supplier.id,
            supplier_name: supplier.name,
            date: new Date().toISOString().split('T')[0],
            items: purchaseItems,
            status: "Received",
            total_amount: purchaseItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.purchase_price || 0)), 0),
        }

        const success = await addPurchaseOrder(purchaseData);

        if (success) {
            setPurchaseId('');
            setPurchaseSupplierId('');
            setPurchaseItems([]);
            setIsPurchaseInfoLocked(false);
            setPurchaseOrderIdToUpdate(null);
            fetchPurchaseHistory(1, purchasePerPage, '', '', '');
        }
    }

    const handleNewMedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setNewMedImageFile(file);
        setNewMedImagePreview(URL.createObjectURL(file));
        }
    };


    const handleReturnNameSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setReturnMedNameSearchTerm(value);
        if (value.length > 0) {
            const results = await searchAllInventory(value);
            const filtered = results.filter(med => med.stock > 0);
            setReturnMedNameSuggestions(filtered.slice(0, 5));
        } else {
            setReturnMedNameSuggestions([]);
        }
    };

    const handleReturnBarcodeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setReturnMedBarcodeSearchTerm(value);
        if (value.length === 0) {
            setReturnMedBarcodeSuggestions([]);
        }
    };

    const handleReturnBarcodeSearchKeyDown = React.useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if(returnMedBarcodeSearchTerm) {
                const results = await searchAllInventory(returnMedBarcodeSearchTerm);
                const filtered = results.filter(med => med.stock > 0);
                setReturnMedBarcodeSuggestions(filtered.slice(0, 5));
                setReturnMedBarcodeSearchTerm("");
            }
        }
    }, [returnMedBarcodeSearchTerm]);

    const handleSelectMedForReturn = (med: Medication) => {
        setSelectedMedForReturn(med);
        setReturnMedNameSearchTerm(med.name);
        setReturnMedNameSuggestions([]);
        setReturnMedBarcodeSearchTerm("");
        setReturnMedBarcodeSuggestions([]);
        document.getElementById("return-quantity")?.focus();
    };

    const handleAddItemToReturnCart = (e: React.FormEvent) => {
        e.preventDefault();
        if (!returnSlipId || !returnSupplierId) {
            toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء إدخال رقم قائمة الاسترجاع واختيار المورد." });
            return;
        }
        if (!selectedMedForReturn) {
            toast({ variant: "destructive", title: "لم يتم اختيار دواء", description: "الرجاء البحث واختيار دواء لإضافته." });
            return;
        }
        const quantity = parseInt(returnItemQuantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
            toast({ variant: "destructive", title: "كمية غير صالحة", description: "الرجاء إدخال كمية صحيحة." });
            return;
        }
        if (quantity > selectedMedForReturn.stock) {
            toast({ variant: "destructive", title: "كمية غير كافية", description: `الرصيد المتوفر من ${selectedMedForReturn.name} هو ${selectedMedForReturn.stock} فقط.`});
            return;
        }

        const newItem: ReturnOrderItem = {
            id: selectedMedForReturn.id,
            medication_id: selectedMedForReturn.id,
            name: selectedMedForReturn.name,
            quantity: quantity,
            purchase_price: selectedMedForReturn.purchase_price,
            reason: returnItemReason
        };
        
        setReturnCart(prev => [...prev, newItem]);
        setIsReturnInfoLocked(true);
        
        setSelectedMedForReturn(null);
        setReturnMedNameSearchTerm("");
        setReturnMedBarcodeSearchTerm("");
        setReturnMedNameSuggestions([]);
        setReturnMedBarcodeSuggestions([]);
        setReturnItemQuantity("1");
        setReturnItemReason("");
        document.getElementById("return-med-name-search")?.focus();
    };

    const handleRemoveFromReturnCart = (medId: string) => {
        setReturnCart(prev => prev.filter(item => item.medication_id !== medId));
    }

    const handleFinalizeReturn = async () => {
        if (returnCart.length === 0) {
        toast({ variant: "destructive", title: "القائمة فارغة", description: "الرجاء إضافة أصناف إلى قائمة الاسترجاع أولاً." });
        return;
        }

        const supplier = suppliers.find(s => s.id == returnSupplierId);
        if (!supplier) return;
        
        const returnData = {
            id: returnOrderIdToUpdate,
            number: returnSlipId,
            supplier_id: supplier.id,
            supplier_name: supplier.name,
            date: new Date().toISOString().split('T')[0],
            items: returnCart,
            total_amount: returnCart.reduce((acc, item) => acc + item.quantity * item.purchase_price, 0)
        }
        
        const success = await addReturnOrder(returnData);
        
        if(success) {
            setReturnSlipId("");
            setReturnSupplierId("");
            setReturnCart([]);
            setIsReturnInfoLocked(false);
            setReturnOrderIdToUpdate(null);
            fetchReturnHistory(1, returnPerPage, '', '', '');
        }
    }

    const openEditItemDialog = (item: PurchaseOrderItem) => {
        setEditingPurchaseItem({ 
            ...item,
            profit_margin: calculateProfitMargin(item.purchase_price || 0, item.price || 0)
        });
        setIsEditItemOpen(true);
    };
    
    const handleUpdatePurchaseItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPurchaseItem) return;
        
        const { profit_margin, ...updatedItem } = editingPurchaseItem;
        
        setPurchaseItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem as PurchaseOrderItem : item));
        setIsEditItemOpen(false);
        setEditingPurchaseItem(null);
    };

    const handleEditPurchaseOrder = (order: PurchaseOrder) => {
        setPurchaseOrderIdToUpdate(order.id);
        setPurchaseId(order.number);
        setPurchaseSupplierId(order.supplier_id?.toString() || "");
        
        const itemsWithCorrectDate = order.items.map(item => {
            const expirationDate = item.medication?.expiration_date;

            return {
                ...item,
                expiration_date: expirationDate ? new Date(expirationDate).toISOString().split('T')[0] : '',
                price: item.medication?.price,
                barcodes: item.medication?.barcodes || [],
            };
        });

        setPurchaseItems(itemsWithCorrectDate);
        setIsPurchaseInfoLocked(true);
        setActiveTab('new-purchase');
    };

    const handleEditReturnOrder = (order: ReturnOrder) => {
        setReturnOrderIdToUpdate(order.id);
        setReturnSlipId(order.number);
        setReturnSupplierId(order.supplier_id);
        setReturnCart(order.items);
        setIsReturnInfoLocked(true);
        setActiveTab('new-return');
    }

    const handleDeletePurchaseOrder = async (orderId: string) => {
        const success = await deletePurchaseOrder(orderId);
        if (success) {
            toast({ title: "تم حذف قائمة الشراء بنجاح" });
            fetchPurchaseHistory(1, purchasePerPage, "", "", ""); // Refresh list
        }
    };

    const handleDeleteReturnOrder = async (orderId: string) => {
        const success = await deleteReturnOrder(orderId);
        if (success) {
            toast({ title: "تم حذف قائمة الاسترجاع بنجاح" });
            fetchReturnHistory(1, returnPerPage, "", "", ""); // Refresh list
        }
    };


  return (
     <Tabs defaultValue="new-purchase" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-10">
        <TabsTrigger value="new-purchase">استلام بضاعة</TabsTrigger>
        <TabsTrigger value="purchase-history">سجل المشتريات</TabsTrigger>
        <TabsTrigger value="new-return">إرجاع للمورد</TabsTrigger>
        <TabsTrigger value="return-history">سجل الاسترجاع</TabsTrigger>
      </TabsList>
      <TabsContent value="new-purchase" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>استلام بضاعة جديدة</CardTitle>
            <CardDescription>
              أضف الأصناف المستلمة إلى القائمة أدناه ثم اضغط على "إتمام عملية الاستلام" لحفظها.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
                <form onSubmit={handleAddItemToPurchase} className="p-4 border rounded-md space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchase_id">رقم قائمة الشراء</Label>
                            <Input id="purchase_id" value={purchase_id} onChange={e => setPurchaseId(e.target.value)} placeholder="مثال: PO-2024-001" required disabled={isPurchaseInfoLocked && purchaseItems.length > 0}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supplier_id">المورد</Label>
                            <div className="flex gap-2">
                                <Select value={purchaseSupplierId} onValueChange={setPurchaseSupplierId} required disabled={isPurchaseInfoLocked && purchaseItems.length > 0}>
                                    <SelectTrigger id="supplier_id">
                                        <SelectValue placeholder="اختر موردًا" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(suppliers || []).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" size="icon" variant="outline">
                                            <PlusCircle />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>إضافة مورد جديد</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddSupplier} className="space-y-4 pt-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="supplier_name">اسم المورد</Label>
                                                <Input id="supplier_name" name="supplier_name" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="supplierContact">الشخص المسؤول (اختياري)</Label>
                                                <Input id="supplierContact" name="supplierContact" />
                                            </div>
                                            <DialogFooter className="pt-2">
                                                <DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose>
                                                <Button type="submit" variant="success">إضافة</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </div>
                     <hr className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 space-y-2">
                        <div className="relative space-y-2" ref={nameSearchContainerRef}>
                            <Label htmlFor="purchase-item-name-search">ابحث بالاسم أو الاسم العلمي</Label>
                            <Input 
                                id="purchase-item-search"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                    e.preventDefault();
                                    }
                                }}
                                value={purchaseItemNameSearchTerm} 
                                onChange={handlePurchaseNameSearch}
                                placeholder="ابحث بالاسم أو الاسم العلمي..."
                                autoComplete="off"
                            />
                        {purchaseItemNameSuggestions.length > 0 && (
                             <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
                                <CardContent className="p-0">
                                    <ul className="divide-y divide-border">
                                        {purchaseItemNameSuggestions.map(med => (
                                            <li key={med.id}>
                                                <div className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center" onMouseDown={() => handleSelectMed(med)}>
                                                    <div>
                                                      <div>{med.name}</div>
                                                      <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
                                                </div>
                                                <Button variant="link" size="sm" className="w-full justify-start text-xs h-auto px-3 py-1" onMouseDown={() => handleSelectMed(med, true)}>
                                                    <FilePlus className="me-2 h-3 w-3" />
                                                    هل هذه دفعة جديدة بتاريخ انتهاء مختلف؟ اضغط هنا
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                        </div>
                        <div className="relative space-y-2" ref={barcodeSearchContainerRef}>
                            <Label htmlFor="purchase-item-barcode-search">امسح الباركود</Label>
                            <Input
                              id="purchase-item-barcode-search"
                              ref={barcodeInputRef}
                              value={purchaseItemBarcodeSearchTerm}
                              onChange={handlePurchaseBarcodeSearchChange}
                              onKeyDown={handlePurchaseBarcodeSearchKeyDown}
                              placeholder="امسح الباركود..."
                              autoComplete="off"
                            />
                            {purchaseItemBarcodeSuggestions.length > 0 && (
                                 <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
                                    <CardContent className="p-0">
                                        <ul className="divide-y divide-border max-h-[30rem] overflow-y-auto">
                                            {purchaseItemBarcodeSuggestions.map(med => (
                                                <li key={med.id}>
                                                    <div className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center" onMouseDown={() => handleSelectMed(med)}>
                                                        <div>
                                                          <div>{med.name}</div>
                                                          <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
                                                        </div>
                                                        <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
                                                    </div>
                                                    <Button variant="link" size="sm" className="w-full justify-start text-xs h-auto px-3 py-1" onMouseDown={() => handleSelectMed(med, true)}>
                                                        <FilePlus className="me-2 h-3 w-3" />
                                                        هل هذه دفعة جديدة بتاريخ انتهاء مختلف؟ اضغط هنا
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        <Button variant="link" size="sm" className="p-0 h-auto md:col-span-2" onClick={openNewMedModal}>أو أضف دواء جديد غير موجود...</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="quantity">الكمية</Label>
                            <Input id="quantity" type="number" value={newMedData.quantity || ''} onChange={e => handlePriceChange(setNewMedData, 'quantity', e.target.value)} required />
                        </div>
                         <div>
                            <Label>سعر الشراء</Label>
                            <Input type="number" value={newMedData.purchase_price || ''} onChange={e => handlePriceChange(setNewMedData, 'purchase_price', e.target.value)} required />
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="space-y-1 flex-grow">
                                <Label>سعر البيع</Label>
                                <Input type="number" value={newMedData.price || ''} onChange={e => handlePriceChange(setNewMedData, 'price', e.target.value)} required />
                            </div>
                            <div className="space-y-1 w-20">
                                <Label>النسبة %</Label>
                                <Input type="number" value={newMedData.profit_margin?.toFixed(0) || ''} onChange={e => handlePriceChange(setNewMedData, 'profit_margin', e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <Label>تاريخ الانتهاء</Label>
                            <Input type="date" value={newMedData.expiration_date || ''} onChange={e => handlePriceChange(setNewMedData, 'expiration_date', e.target.value)} required />
                        </div>
                    </div>
                    <Button type="submit" className="w-full">إضافة إلى القائمة</Button>
                </form>

                {purchaseItems.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">الأصناف في القائمة الحالية:</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المنتج</TableHead>
                                    <TableHead>الكمية</TableHead>
                                    <TableHead>سعر الشراء</TableHead>
                                    <TableHead>تاريخ الانتهاء</TableHead>
                                    <TableHead>الإجمالي</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="font-mono">{item.quantity}</TableCell>
                                        <TableCell className="font-mono">{item.purchase_price?.toLocaleString()}</TableCell>
                                        <TableCell className="font-mono">{item.expiration_date ? new Date(item.expiration_date).toLocaleDateString('en-US') : ''}</TableCell>
                                        <TableCell className="font-mono">{(item.quantity! * item.purchase_price!).toLocaleString()}</TableCell>
                                        <TableCell className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="text-blue-600 h-8 w-8" onClick={() => openEditItemDialog(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveFromPurchase(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleFinalizePurchase} variant="success" className="w-full" disabled={purchaseItems.length === 0}>
                {purchaseOrderIdToUpdate ? 'تأكيد تعديل القائمة' : 'إتمام عملية الاستلام'}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
       <TabsContent value="purchase-history" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>سجل المشتريات</CardTitle>
            <CardDescription>قائمة بجميع طلبات الشراء المستلمة. اضغط على أي صف لعرض التفاصيل.</CardDescription>
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input 
                placeholder="ابحث برقم القائمة، اسم المورد..."
                value={purchaseSearchTerm}
                onChange={(e) => setPurchaseSearchTerm(e.target.value)}
                className="sm:col-span-1"
              />
              <Input type="date" value={purchaseDateFrom} onChange={e => setPurchaseDateFrom(e.target.value)} />
              <Input type="date" value={purchaseDateTo} onChange={e => setPurchaseDateTo(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">رقم القائمة</TableHead>
                        <TableHead>المنتج / المورد</TableHead>
                        <TableHead className="w-[120px]">الكمية</TableHead>
                        <TableHead className="w-[120px]">سعر الشراء</TableHead>
                        <TableHead className="w-[120px]">الإجمالي</TableHead>
                        <TableHead className="w-[120px]">التاريخ</TableHead>
                        <TableHead className="w-[80px]">الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchaseLoading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skel-purchase-${i}`}>
                            <TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                    )) : purchaseHistory.length > 0 ? purchaseHistory.map(po => (
                        <React.Fragment key={po.id}>
                            <TableRow onClick={() => toggleRow(po.id)} className="cursor-pointer bg-muted/30 font-semibold">
                                <TableCell className="font-mono">{po.number}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(po.id) && "rotate-180")} />
                                        {po.supplier_name}
                                    </div>
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="font-mono">{po.total_amount.toLocaleString()}</TableCell>
                                <TableCell className="font-mono">{new Date(po.date).toLocaleDateString('en-US')}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleEditPurchaseOrder(po);}}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                            {expandedRows.has(po.id) && (po.items || []).map((item, index) => (
                                <TableRow key={`${po.id}-${item.id}-${index}`} className="bg-muted/10">
                                    <TableCell></TableCell>
                                    <TableCell className="pr-10">{item.name}</TableCell>
                                    <TableCell className="font-mono">{item.quantity}</TableCell>
                                    <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
                                    <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            ))}
                        </React.Fragment>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                                لا توجد نتائج مطابقة للبحث.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                    صفحة {purchaseCurrentPage} من {purchaseTotalPages}
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPurchaseCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={purchaseCurrentPage === 1 || purchaseLoading}
                    >
                        السابق
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPurchaseCurrentPage(p => Math.min(p + 1, purchaseTotalPages))}
                        disabled={purchaseCurrentPage === purchaseTotalPages || purchaseLoading}
                    >
                        التالي
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="new-return" dir="rtl">
         <Card>
            <CardHeader>
                <CardTitle>إنشاء قائمة إرجاع للمورد</CardTitle>
                <CardDescription>
                استخدم هذا النموذج لإنشاء قائمة بالأدوية المرتجعة للمورد.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="returnSlipId">رقم قائمة الاسترجاع</Label>
                        <Input id="returnSlipId" value={returnSlipId} onChange={e => setReturnSlipId(e.target.value)} placeholder="مثال: RET-2024-001" required disabled={is_returnInfoLocked && returnCart.length > 0} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="return-supplier_id">المورد</Label>
                        <Select value={returnSupplierId} onValueChange={setReturnSupplierId} required disabled={is_returnInfoLocked && returnCart.length > 0}>
                            <SelectTrigger id="return-supplier_id">
                                <SelectValue placeholder="اختر موردًا" />
                            </SelectTrigger>
                            <SelectContent>
                                {(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <form onSubmit={handleAddItemToReturnCart} className="p-4 border rounded-md space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 space-y-2">
                        <div className="relative space-y-2" ref={returnNameSearchContainerRef}>
                            <Label htmlFor="return-med-name-search">ابحث بالاسم أو الاسم العلمي</Label>
                            <Input 
                              id="return-med-name-search"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                }
                              }}
                              value={returnMedNameSearchTerm} 
                              onChange={handleReturnNameSearch}
                              placeholder="ابحث بالاسم أو الاسم العلمي..."
                              autoComplete="off"
                            />
                            {returnMedNameSuggestions.length > 0 && (
                                 <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
                                    <CardContent className="p-0">
                                        <ul className="divide-y divide-border">
                                            {returnMedNameSuggestions.map(med => (
                                                <li key={med.id}
                                                    onMouseDown={() => handleSelectMedForReturn(med)}
                                                    className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center"
                                                >
                                                    <div>
                                                      <div>{med.name}</div>
                                                      <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        <div className="relative space-y-2" ref={returnBarcodeSearchContainerRef}>
                            <Label htmlFor="return-med-barcode-search">امسح الباركود</Label>
                            <Input
                              id="return-med-barcode-search"
                              ref={returnBarcodeInputRef}
                              value={returnMedBarcodeSearchTerm}
                              onChange={handleReturnBarcodeSearchChange}
                              onKeyDown={handleReturnBarcodeSearchKeyDown}
                              placeholder="امسح الباركود..."
                              autoComplete="off"
                            />
                            {returnMedBarcodeSuggestions.length > 0 && (
                                 <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
                                    <CardContent className="p-0">
                                        <ul className="divide-y divide-border max-h-[30rem] overflow-y-auto">
                                            {returnMedBarcodeSuggestions.map(med => (
                                                <li key={med.id}
                                                    onMouseDown={() => handleSelectMedForReturn(med)}
                                                    className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center"
                                                >
                                                    <div>
                                                      <div>{med.name}</div>
                                                      <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="return-quantity">الكمية المرتجعة</Label>
                            <Input id="return-quantity" type="number" value={returnItemQuantity} onChange={e => setReturnItemQuantity(e.target.value)} required min="1" disabled={!selectedMedForReturn} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">سبب الإرجاع</Label>
                            <Input id="reason" value={returnItemReason} onChange={e => setReturnItemReason(e.target.value)} placeholder="مثال: تالف، قريب الانتهاء" disabled={!selectedMedForReturn} />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={!selectedMedForReturn}>إضافة إلى القائمة</Button>
                </form>
                
                {returnCart.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">أصناف في قائمة الاسترجاع الحالية:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المنتج</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>السبب</TableHead>
                          <TableHead>القيمة</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnCart.map(item => (
                          <TableRow key={item.medication_id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="font-mono">{item.quantity}</TableCell>
                            <TableCell>{item.reason}</TableCell>
                            <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveFromReturnCart(item.medication_id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleFinalizeReturn} variant="destructive" className="w-full" disabled={returnCart.length === 0}>
                {returnOrderIdToUpdate ? 'تأكيد تعديل قائمة الإرجاع' : 'إتمام عملية الاسترجاع'}
              </Button>
            </CardFooter>
        </Card>
      </TabsContent>
       <TabsContent value="return-history" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>سجل الاسترجاع</CardTitle>
            <CardDescription>قائمة بجميع عمليات الاسترجاع للموردين. اضغط على أي صف لعرض التفاصيل.</CardDescription>
             <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input 
                placeholder="ابحث برقم القائمة، اسم المورد..."
                value={returnSearchTerm}
                onChange={(e) => setReturnSearchTerm(e.target.value)}
                className="sm:col-span-1"
              />
              <Input type="date" value={returnDateFrom} onChange={e => setReturnDateFrom(e.target.value)} />
              <Input type="date" value={returnDateTo} onChange={e => setReturnDateTo(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                     <TableRow>
                        <TableHead className="w-[150px]">رقم القائمة</TableHead>
                        <TableHead>المنتج / المورد</TableHead>
                        <TableHead className="w-[120px]">الكمية</TableHead>
                        <TableHead className="w-[120px]">سعر الشراء</TableHead>
                        <TableHead className="w-[120px]">الإجمالي</TableHead>
                        <TableHead className="w-[120px]">التاريخ</TableHead>
                        <TableHead className="w-[80px]">الإجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {returnLoading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skel-return-${i}`}>
                            <TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                    )) : returnHistory.length > 0 ? returnHistory.map(ret => (
                        <React.Fragment key={ret.id}>
                            <TableRow onClick={() => toggleRow(ret.id)} className="cursor-pointer bg-muted/30 font-semibold">
                                <TableCell className="font-mono">{ret.number}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(ret.id) && "rotate-180")} />
                                        {ret.supplier_name}
                                    </div>
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="font-mono">{ret.total_amount.toLocaleString()}</TableCell>
                                <TableCell className="font-mono">{new Date(ret.date).toLocaleDateString('en-US')}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleEditReturnOrder(ret);}}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>

                                </TableCell>
                            </TableRow>
                            {expandedRows.has(ret.id) && (ret.items || []).map((item, index) => (
                                <TableRow key={`${ret.id}-${item.medication_id}-${index}`} className="bg-muted/10">
                                    <TableCell></TableCell>
                                    <TableCell className="pr-10">{item.name} <span className="text-xs text-muted-foreground">({item.reason})</span></TableCell>
                                    <TableCell className="font-mono">{item.quantity}</TableCell>
                                    <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
                                    <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
                                    <TableCell></TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            ))}
                        </React.Fragment>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                                لا توجد نتائج مطابقة للبحث.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                    صفحة {returnCurrentPage} من {returnTotalPages}
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReturnCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={returnCurrentPage === 1 || returnLoading}
                    >
                        السابق
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReturnCurrentPage(p => Math.min(p + 1, returnTotalPages))}
                        disabled={returnCurrentPage === returnTotalPages || returnLoading}
                    >
                        التالي
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <Dialog open={isAddNewMedModalOpen} onOpenChange={setIsAddNewMedModalOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>إضافة دواء جديد إلى المخزون</DialogTitle>
                <DialogDescription>هذا الدواء غير موجود في النظام. الرجاء إدخال تفاصيله كاملة.</DialogDescription>
            </DialogHeader>
             <form onSubmit={handleAddNewMedSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>الباركود (يفصل بفاصلة ,)</Label>
                        <div className="relative">
                            <Input value={newMedData.barcodes?.join(',') || ''} onChange={e => setNewMedData(p => ({...p, barcodes: e.target.value.split(',').map(s => s.trim())}))} />
                             <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-1 h-7 w-7" onClick={() => setNewMedData(p => ({...p, barcodes: [...(p.barcodes || []), '']}))}>
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label>الاسم التجاري</Label>
                        <Input value={newMedData.name || purchaseItemSearchTerm} onChange={e => setNewMedData(p => ({...p, name: e.target.value}))} required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>الاسم العلمي (يفصل بفاصلة ,)</Label>
                    <div className="relative">
                        <Input value={newMedData.scientific_names?.join(',') || ''} onChange={e => setNewMedData(p => ({...p, scientific_names: e.target.value.split(',').map(s => s.trim())}))} />
                        <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-1 h-7 w-7" onClick={() => setNewMedData(p => ({...p, scientific_names: [...(p.scientific_names || []), '']}))}>
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>الجرعة</Label>
                        <Input value={newMedData.dosage || ''} onChange={e => setNewMedData(p => ({...p, dosage: e.target.value}))} />
                    </div>
                     <div className="space-y-2">
                        <Label>الشكل الدوائي</Label>
                        <Select value={newMedData.dosage_form} onValueChange={val => setNewMedData(p => ({...p, dosage_form: val}))}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر الشكل" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">{dosage_forms.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>الكمية المستلمة</Label>
                        <Input type="number" value={newMedData.quantity || ''} onChange={e => setNewMedData(p => ({...p, quantity: parseInt(e.target.value)}))} required />
                    </div>
                    <div className="space-y-2">
                        <Label>نقطة إعادة الطلب</Label>
                        <Input type="number" value={newMedData.reorder_point || 10} onChange={e => setNewMedData(p => ({...p, reorder_point: parseInt(e.target.value)}))} required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>سعر الشراء</Label>
                        <Input type="number" value={newMedData.purchase_price || ''} onChange={e => handlePriceChange(setNewMedData, 'purchase_price', e.target.value)} required />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="space-y-1 flex-grow">
                            <Label>سعر البيع</Label>
                            <Input type="number" value={newMedData.price || ''} onChange={e => handlePriceChange(setNewMedData, 'price', e.target.value)} required />
                        </div>
                        <div className="space-y-1 w-20">
                            <Label>النسبة %</Label>
                            <Input type="number" value={newMedData.profit_margin?.toFixed(0) || ''} onChange={e => handlePriceChange(setNewMedData, 'profit_margin', e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>تاريخ الانتهاء</Label>
                        <Input type="date" value={newMedData.expiration_date || ''} onChange={e => setNewMedData(p => ({...p, expiration_date: e.target.value}))} required />
                    </div>
                     <div className="space-y-2">
                        <Label>صورة المنتج (اختياري)</Label>
                        <Input type="file" accept="image/*" onChange={handleNewMedImageChange} />
                        {newMedImagePreview && <Image src={newMedImagePreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" />}
                    </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                    <Button type="submit" variant="success">إضافة وإدراج في القائمة</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
        <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>تعديل الصنف: {editingPurchaseItem?.name}</DialogTitle>
                </DialogHeader>
                {editingPurchaseItem && (
                    <form onSubmit={handleUpdatePurchaseItem} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto p-1">
                        {editingPurchaseItem.is_new ? (
                             <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>الباركود (يفصل بفاصلة ,)</Label>
                                        <div className="relative">
                                            <Input value={editingPurchaseItem.barcodes?.join(',') || ''} onChange={e => setEditingPurchaseItem(p => p ? {...p, barcodes: e.target.value.split(',').map(s => s.trim())} : null)} />
                                            <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-1 h-7 w-7" onClick={() => setEditingPurchaseItem(p => p ? {...p, barcodes: [...(p.barcodes || []), '']} : null)}>
                                                <PlusCircle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الاسم التجاري</Label>
                                        <Input value={editingPurchaseItem.name || ''} onChange={e => setEditingPurchaseItem(p => p ? {...p, name: e.target.value} : null)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>الاسم العلمي (يفصل بفاصلة ,)</Label>
                                    <div className="relative">
                                        <Input value={editingPurchaseItem.scientific_names?.join(',') || ''} onChange={e => setEditingPurchaseItem(p => p ? {...p, scientific_names: e.target.value.split(',').map(s => s.trim())} : null)} />
                                        <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-1 h-7 w-7" onClick={() => setEditingPurchaseItem(p => p ? {...p, scientific_names: [...(p.scientific_names || []), '']} : null)}>
                                            <PlusCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>الجرعة</Label>
                                        <Input value={editingPurchaseItem.dosage || ''} onChange={e => setEditingPurchaseItem(p => p ? {...p, dosage: e.target.value} : null)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الشكل الدوائي</Label>
                                        <Select value={editingPurchaseItem.dosage_form} onValueChange={val => setEditingPurchaseItem(p => p ? {...p, dosage_form: val} : null)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الشكل" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-64">{dosage_forms.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الكمية المستلمة</Label>
                                        <Input type="number" value={editingPurchaseItem.quantity} onChange={e => setEditingPurchaseItem(p => p ? {...p, quantity: parseInt(e.target.value)} : null)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>نقطة إعادة الطلب</Label>
                                        <Input type="number" value={editingPurchaseItem.reorder_point} onChange={e => setEditingPurchaseItem(p => p ? {...p, reorder_point: parseInt(e.target.value)} : null)} required />
                                    </div>
                                </div>
                            </>
                        ) : (
                             <div className="space-y-2">
                                <Label htmlFor="edit-quantity">الكمية</Label>
                                <Input id="edit-quantity" name="quantity" type="number" value={editingPurchaseItem.quantity} onChange={e => setEditingPurchaseItem(p => p ? {...p, quantity: parseInt(e.target.value)} : null)} required />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>سعر الشراء</Label>
                                <Input type="number" step="0.01" value={editingPurchaseItem.purchase_price} onChange={e => handlePriceChange(setEditingPurchaseItem, 'purchase_price', e.target.value)} required />
                            </div>
                             <div className="flex items-end gap-2">
                                <div className="space-y-1 flex-grow">
                                    <Label>سعر البيع</Label>
                                    <Input type="number" step="0.01" value={editingPurchaseItem.price} onChange={e => handlePriceChange(setEditingPurchaseItem, 'price', e.target.value)} required />
                                </div>
                                <div className="space-y-1 w-20">
                                    <Label>النسبة %</Label>
                                    <Input type="number" value={editingPurchaseItem.profit_margin?.toFixed(0)} onChange={e => handlePriceChange(setEditingPurchaseItem, 'profit_margin', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>تاريخ الانتهاء</Label>
                            <Input type="date" value={editingPurchaseItem.expiration_date} onChange={e => setEditingPurchaseItem(p => p ? {...p, expiration_date: e.target.value} : null)} required />
                        </div>
                        <DialogFooter className="pt-2">
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            <Button type="submit" variant="success">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    </Tabs>
  )
}


// "use client"

// import * as React from "react"
// import Image from 'next/image';
// import { useEffect, useRef } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
//   CardFooter
// } from "@/components/ui/card"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
//   DialogFooter,
//   DialogClose,
//   DialogDescription,
// } from "@/components/ui/dialog"
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { useToast } from "@/hooks/use-toast"
// import type { PurchaseOrder, Medication, Supplier, ReturnOrder, PurchaseOrderItem, ReturnOrderItem, PaginatedResponse } from "@/lib/types"
// import { PlusCircle, ChevronDown, Trash2, X, Pencil, Percent, FilePlus } from "lucide-react"
// import { cn } from "@/lib/utils"
// import { useAuth } from "@/hooks/use-auth";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Skeleton } from "@/components/ui/skeleton"

// const fileToDataUri = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = () => resolve(reader.result as string);
//         reader.onerror = reject;
//         reader.readAsDataURL(file);
//     });
// };

// const dosage_forms = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Cream", "Gel", "Suppository", "Inhaler", "Drops", "Powder", "Lotion", "spray"];

// type PurchaseItemFormData = Partial<PurchaseOrderItem> & { profit_margin?: number };

// export default function PurchasesPage() {
//   const { toast } = useToast()
//   const { 
//       scopedData, 
//       addSupplier, 
//       addPurchaseOrder, 
//       addReturnOrder,
//       getPaginatedPurchaseOrders,
//       getPaginatedReturnOrders,
//       searchAllInventory,
//       addMedication,
//       purchaseDraft,
//       setPurchaseDraft,
//       returnDraft,
//       setReturnDraft,
//       deletePurchaseOrder, 
//       deleteReturnOrder,
//     } = useAuth();
  
//   const {
//       suppliers: [suppliers, setSuppliers],
//   } = scopedData;


//   const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);
//   const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

//   // Purchase Form State
//   const [purchase_id, setPurchaseId] = React.useState('');
//   const [purchaseSupplierId, setPurchaseSupplierId] = React.useState('');
//   const [purchaseItems, setPurchaseItems] = React.useState<PurchaseOrderItem[]>([]);
//   const [purchaseItemSearchTerm, setPurchaseItemSearchTerm] = React.useState('');
//   const [purchaseItemSuggestions, setPurchaseItemSuggestions] = React.useState<Medication[]>([]);
//   const [purchaseItemNameSearchTerm, setPurchaseItemNameSearchTerm] = React.useState('');
//   const [purchaseItemNameSuggestions, setPurchaseItemNameSuggestions] = React.useState<Medication[]>([]);
//   const [purchaseItemBarcodeSearchTerm, setPurchaseItemBarcodeSearchTerm] = React.useState('');
//   const [purchaseItemBarcodeSuggestions, setPurchaseItemBarcodeSuggestions] = React.useState<Medication[]>([]);
//   const barcodeInputRef = React.useRef<HTMLInputElement>(null);
//   const [isPurchaseInfoLocked, setIsPurchaseInfoLocked] = React.useState(false);
  
//   // State for return form
//   const [returnSlipId, setReturnSlipId] = React.useState('');
//   const [returnSupplierId, setReturnSupplierId] = React.useState('');
//   const [returnCart, setReturnCart] = React.useState<ReturnOrderItem[]>([]);
//   const [is_returnInfoLocked, setIsReturnInfoLocked] = React.useState(false);
//   const [returnMedSearchTerm, setReturnMedSearchTerm] = React.useState("");
//   const [returnMedSuggestions, setReturnMedSuggestions] = React.useState<Medication[]>([]);
//   const [returnMedNameSearchTerm, setReturnMedNameSearchTerm] = React.useState("");
//   const [returnMedNameSuggestions, setReturnMedNameSuggestions] = React.useState<Medication[]>([]);
//   const [returnMedBarcodeSearchTerm, setReturnMedBarcodeSearchTerm] = React.useState("");
//   const [returnMedBarcodeSuggestions, setReturnMedBarcodeSuggestions] = React.useState<Medication[]>([]);
//   const returnBarcodeInputRef = React.useRef<HTMLInputElement>(null);
//   const [selectedMedForReturn, setSelectedMedForReturn] = React.useState<Medication | null>(null);
//   const [returnItemQuantity, setReturnItemQuantity] = React.useState("1");
//   const [returnItemReason, setReturnItemReason] = React.useState("");

//   // Pagination and search for Purchase History
//   const [purchaseHistory, setPurchaseHistory] = React.useState<PurchaseOrder[]>([]);
//   const [purchaseTotalPages, setPurchaseTotalPages] = React.useState(1);
//   const [purchaseCurrentPage, setPurchaseCurrentPage] = React.useState(1);
//   const [purchasePerPage, setPurchasePerPage] = React.useState(10);
//   const [purchaseLoading, setPurchaseLoading] = React.useState(true);
//   const [purchaseSearchTerm, setPurchaseSearchTerm] = React.useState('');
//   const [purchaseDateFrom, setPurchaseDateFrom] = React.useState('');
//   const [purchaseDateTo, setPurchaseDateTo] = React.useState('');

//   // Pagination and search for Return History
//   const [returnHistory, setReturnHistory] = React.useState<ReturnOrder[]>([]);
//   const [returnTotalPages, setReturnTotalPages] = React.useState(1);
//   const [returnCurrentPage, setReturnCurrentPage] = React.useState(1);
//   const [returnPerPage, setReturnPerPage] = React.useState(10);
//   const [returnLoading, setReturnLoading] = React.useState(true);
//   const [returnSearchTerm, setReturnSearchTerm] = React.useState('');
//   const [returnDateFrom, setReturnDateFrom] = React.useState('');
//   const [returnDateTo, setReturnDateTo] = React.useState('');

//   const [activeTab, setActiveTab] = React.useState("new-purchase");
  
//   // Refs for suggestion containers
//   const nameSearchContainerRef = useRef<HTMLDivElement>(null);
//   const barcodeSearchContainerRef = useRef<HTMLDivElement>(null);
//   const returnNameSearchContainerRef = useRef<HTMLDivElement>(null);
//   const returnBarcodeSearchContainerRef = useRef<HTMLDivElement>(null);

//   // State for modal to add a completely new medication
//   const [isAddNewMedModalOpen, setIsAddNewMedModalOpen] = React.useState(false);
//   const [newMedData, setNewMedData] = React.useState<PurchaseItemFormData>({
//       barcodes: [], scientific_names: [], stock: 0, reorder_point: 10,
//       price: 0, purchase_price: 0, expiration_date: '',
//       dosage: '', dosage_form: '', image_url: '', profit_margin: 0
//   });
//   const [newMedImageFile, setNewMedImageFile] = React.useState<File | null>(null);
//   const [newMedImagePreview, setNewMedImagePreview] = React.useState<string | null>(null);
  
//   // State for editing purchase item
//   const [editingPurchaseItem, setEditingPurchaseItem] = React.useState<PurchaseItemFormData | null>(null);
//   const [isEditItemOpen, setIsEditItemOpen] = React.useState(false);

//     const calculateProfitMargin = (purchasePrice: number, sellPrice: number) => {
//         if (!purchasePrice || purchasePrice <= 0) return 0;
//         return ((sellPrice - purchasePrice) / purchasePrice) * 100;
//     };

//     const calculateSellPrice = (purchasePrice: number, margin: number) => {
//         if (!purchasePrice || purchasePrice <= 0) return 0;
//         return purchasePrice * (1 + margin / 100);
//     };

    
//     // const handlePriceChange = (setter: React.Dispatch<React.SetStateAction<PurchaseItemFormData | null>>, name: 'price' | 'profit_margin' | 'purchase_price', value: string) => {
//     //     const numericValue = parseFloat(value) || 0;
//     //     setter(prev => {
//     //         if (!prev) return null;
//     //         let { purchase_price = 0, price = 0, profit_margin = 0 } = prev;

//     //         if (name === 'price') {
//     //             price = numericValue;
//     //             profit_margin = calculateProfitMargin(purchase_price, price);
//     //         } else if (name === 'profit_margin') {
//     //             profit_margin = numericValue;
//     //             price = calculateSellPrice(purchase_price, profit_margin);
//     //         } else if (name === 'purchase_price') {
//     //             purchase_price = numericValue;
//     //             if (price > 0) { 
//     //                 profit_margin = calculateProfitMargin(purchase_price, price);
//     //             } else if (profit_margin > 0) {
//     //                 price = calculateSellPrice(purchase_price, profit_margin);
//     //             }
//     //         }
//     //         return { ...prev, purchase_price, price, profit_margin };
//     //     });
//     // };
//     const handlePriceChange = (setter: React.Dispatch<React.SetStateAction<PurchaseItemFormData>> | React.Dispatch<React.SetStateAction<PurchaseItemFormData | null>>, name: 'price' | 'profit_margin' | 'purchase_price' | 'expiration_date' | 'quantity', value: string) => {
//         const numericValue = parseFloat(value) || 0;
//         setter((prev: PurchaseItemFormData | null) => {
//             if (!prev) return prev;
            
//             let { purchase_price = 0, price = 0, profit_margin = 0 } = prev;

//             if (name === 'price') {
//                 price = numericValue;
//                 profit_margin = calculateProfitMargin(purchase_price, price);
//             } else if (name === 'profit_margin') {
//                 profit_margin = numericValue;
//                 price = calculateSellPrice(purchase_price, profit_margin);
//             } else if (name === 'purchase_price') {
//                 purchase_price = numericValue;
//                 if (price > 0) { // Recalculate profit if sell price is already set
//                     profit_margin = calculateProfitMargin(purchase_price, price);
//                 } else if (profit_margin > 0) { // Recalculate sell price if margin is set
//                     price = calculateSellPrice(purchase_price, profit_margin);
//                 }
//             } else if (name === 'expiration_date') {
//                 return { ...prev, expiration_date: value };
//             } else if (name === 'quantity') {
//                 return { ...prev, quantity: numericValue };
//             }
//             return { ...prev, purchase_price, price, profit_margin };
//         });
//     };

//     const fetchPurchaseHistory = React.useCallback(async (page: number, limit: number, search: string, from: string, to: string) => {
//         setPurchaseLoading(true);
//         try {
//             const data = await getPaginatedPurchaseOrders(page, limit, search, from, to);
//             setPurchaseHistory(data.data);
//             setPurchaseTotalPages(data.last_page);
//             setPurchaseCurrentPage(data.current_page);
//         } catch(e) {} finally {
//             setPurchaseLoading(false);
//         }
//     }, [getPaginatedPurchaseOrders]);

//     const fetchReturnHistory = React.useCallback(async (page: number, limit: number, search: string, from: string, to: string) => {
//         setReturnLoading(true);
//         try {
//             const data = await getPaginatedReturnOrders(page, limit, search, from, to);
//             setReturnHistory(data.data);
//             setReturnTotalPages(data.last_page);
//             setReturnCurrentPage(data.current_page);
//         } catch(e) {} finally {
//             setReturnLoading(false);
//         }
//     }, [getPaginatedReturnOrders]);

//     React.useEffect(() => {
//         if (activeTab === 'purchase-history') {
//             const handler = setTimeout(() => {
//                 fetchPurchaseHistory(purchaseCurrentPage, purchasePerPage, purchaseSearchTerm, purchaseDateFrom, purchaseDateTo);
//             }, 300);
//             return () => clearTimeout(handler);
//         }
//     }, [activeTab, purchaseCurrentPage, purchasePerPage, purchaseSearchTerm, purchaseDateFrom, purchaseDateTo, fetchPurchaseHistory]);

//     React.useEffect(() => {
//         const handleClickOutside = (event: MouseEvent) => {
//         if (barcodeInputRef.current && !barcodeInputRef.current.contains(event.target as Node)) {
//             setPurchaseItemBarcodeSuggestions([]);
//         }
//         };

//         document.addEventListener('mousedown', handleClickOutside);
//         return () => {
//         document.removeEventListener('mousedown', handleClickOutside);
//         };
//     }, []);
    
//     React.useEffect(() => {
//         if (activeTab === 'return-history') {
//             const handler = setTimeout(() => {
//                 fetchReturnHistory(returnCurrentPage, returnPerPage, returnSearchTerm, returnDateFrom, returnDateTo);
//             }, 300);
//             return () => clearTimeout(handler);
//         }
//     }, [activeTab, returnCurrentPage, returnPerPage, returnSearchTerm, returnDateFrom, returnDateTo, fetchReturnHistory]);

//     React.useEffect(() => {
//         const handleClickOutside = (event: MouseEvent) => {
//         if (returnBarcodeInputRef.current && !returnBarcodeInputRef.current.contains(event.target as Node)) {
//             setReturnMedBarcodeSuggestions([]);
//         }
//         };

//         document.addEventListener('mousedown', handleClickOutside);
//         return () => {
//         document.removeEventListener('mousedown', handleClickOutside);
//         };
//     }, []);

//     React.useEffect(() => {
//         if (purchaseDraft && purchaseDraft.items.length > 0) {
//             setPurchaseId(purchaseDraft.invoiceId);
//             setPurchaseSupplierId(purchaseDraft.supplierId);
//             setPurchaseItems(purchaseDraft.items);
//             setIsPurchaseInfoLocked(true);
//             setActiveTab('new-purchase');
//             setPurchaseDraft({ invoiceId: '', supplierId: '', items: [] }); // Clear draft after loading
//         }
//     }, [purchaseDraft, setPurchaseDraft]);

//     const toggleRow = (id: string) => {
//         const newExpandedRows = new Set(expandedRows);
//         if (newExpandedRows.has(id)) {
//         newExpandedRows.delete(id);
//         } else {
//         newExpandedRows.add(id);
//         }
//         setExpandedRows(newExpandedRows);
//     };
  
//     const handleAddSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
//         e.preventDefault();
//         const formData = new FormData(e.currentTarget);
//         const name = formData.get("supplier_name") as string;
//         const contact_person = formData.get("supplierContact") as string;

//         if (!name) {
//             toast({ variant: "destructive", title: "اسم المورد مطلوب" });
//             return;
//         }
        
//         const newSupplier = await addSupplier({ name, contact_person });

//         if (newSupplier) {
//             setPurchaseSupplierId(newSupplier.id);
//             setIsAddSupplierOpen(false);
//         }
//     };

//     const handlePurchaseNameSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value;
//         setPurchaseItemNameSearchTerm(value);

//         if (value.length > 0) {
//             const results = await searchAllInventory(value);
//             setPurchaseItemNameSuggestions(results.slice(0, 5));
//         } else {
//             setPurchaseItemNameSuggestions([]);
//         }
//     };

//     const handlePurchaseBarcodeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value;
//         setPurchaseItemBarcodeSearchTerm(value);
//         // Don't search automatically for barcode - wait for Enter key
//         // Clear barcode suggestions when input is cleared
//         if (value.length === 0) {
//             setPurchaseItemBarcodeSuggestions([]);
//         }
//     }

//     const handlePurchaseBarcodeSearchKeyDown = React.useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
//         if (event.key === 'Enter') {
//             event.preventDefault();
//             // Only process if barcode term exists
//             if(purchaseItemBarcodeSearchTerm) {
//                 const results = await searchAllInventory(purchaseItemBarcodeSearchTerm);
//                 setPurchaseItemBarcodeSuggestions(results.slice(0, 5));
//                 setPurchaseItemBarcodeSearchTerm("");
//             }
//         }
//     }, [purchaseItemBarcodeSearchTerm]);

//     const handleSelectMed = (med: Medication, asNewBatch: boolean = false) => {
//         const medData: PurchaseItemFormData = {
//             ...med,
//             id: asNewBatch ? `new-${Date.now()}` : med.id, // Use a temporary unique ID for new batches
//             medication_id: med.id,
//             profit_margin: calculateProfitMargin(med.purchase_price, med.price),
//             is_new: asNewBatch,
//             name: asNewBatch ? `${med.name} (دفعة جديدة)` : med.name,
//         };
//         if (asNewBatch) {
//             medData.stock = 0; // New batch starts with 0 stock until quantity is entered
//             medData.expiration_date = '';
//         }
//         setNewMedData(medData);
//         setPurchaseItemNameSearchTerm(med.name);
//         setPurchaseItemNameSuggestions([]);
//         setPurchaseItemBarcodeSearchTerm("");
//         setPurchaseItemBarcodeSuggestions([]);
//         document.getElementById("quantity")?.focus();
//     };

//     // Handle clicks outside suggestion containers
//     useEffect(() => {
//         const handleClickOutside = (event: MouseEvent) => {
//         // Check if click is outside the name search container
//         if (nameSearchContainerRef.current && !nameSearchContainerRef.current.contains(event.target as Node)) {
//             setPurchaseItemNameSuggestions([]);
//         }
        
//         // Check if click is outside the barcode search container
//         if (barcodeSearchContainerRef.current && !barcodeSearchContainerRef.current.contains(event.target as Node)) {
//             setPurchaseItemBarcodeSuggestions([]);
//         }
        
//         // Check if click is outside the return name search container
//         if (returnNameSearchContainerRef.current && !returnNameSearchContainerRef.current.contains(event.target as Node)) {
//             setReturnMedNameSuggestions([]);
//         }
        
//         // Check if click is outside the return barcode search container
//         if (returnBarcodeSearchContainerRef.current && !returnBarcodeSearchContainerRef.current.contains(event.target as Node)) {
//             setReturnMedBarcodeSuggestions([]);
//         }
//         };

//         // Add event listener when component mounts
//         document.addEventListener("mousedown", handleClickOutside);
        
//         // Clean up event listener when component unmounts
//         return () => {
//         document.removeEventListener("mousedown", handleClickOutside);
//         };
//     }, []);

//     const openNewMedModal = () => {
//         setNewMedData({
//             barcodes: [],
//             scientific_names: [], 
//             stock: 0, 
//             reorder_point: 10,
//             price: 0, 
//             purchase_price: 0, 
//             expiration_date: '',
//             dosage: '', 
//             dosage_form: '', 
//             image_url: '', 
//             profit_margin: 0,
//             is_new: true, // Mark as a completely new medication
//         });
//         setNewMedImageFile(null);
//         setNewMedImagePreview(null);
//         setIsAddNewMedModalOpen(true);
//     }

//     const handleAddNewMedSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         let imageUrl = newMedData.image_url || '';
//         if (newMedImageFile) {
//             imageUrl = await fileToDataUri(newMedImageFile);
//         }

//         const { profit_margin, ...medToAdd } = newMedData;
//         const medWithImage = {
//             ...medToAdd,
//             image_url: imageUrl,
//             stock: medToAdd.quantity,
//         };
        
//         const newMedication = await addMedication(medWithImage);

//         if (newMedication) {
//             const newItemForPurchase: PurchaseOrderItem = {
//                 ...newMedication,
//                 id: newMedication.id,
//                 medication_id: newMedication.id,
//                 quantity: newMedData.quantity || 1,
//                 purchase_price: newMedData.purchase_price || 0,
//                 price: newMedData.price || 0,
//                 expiration_date: newMedData.expiration_date || '',
//                 is_new: true
//             };
//             setPurchaseItems(prev => [...prev, newItemForPurchase]);
//             setIsAddNewMedModalOpen(false);
//         }
//     }


//     const handleAddItemToPurchase = (e: React.FormEvent) => {
//         e.preventDefault();
        
//         if (!purchase_id || !purchaseSupplierId) {
//             toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء إدخال رقم قائمة الشراء واختيار المورد." });
//             return;
//         }
        
//         if (!newMedData.id) {
//             openNewMedModal();
//             return;
//         }

//         const { profit_margin, ...itemData } = newMedData;

//         const newItem = {
//         ...itemData,
//         id: itemData.id!,
//         medication_id: itemData.medication_id!,
//         };
        
//         setPurchaseItems(prev => [...prev, newItem as PurchaseOrderItem]);
//         setIsPurchaseInfoLocked(true);
        
//         setNewMedData({});
//         setPurchaseItemNameSearchTerm("");
//         setPurchaseItemNameSuggestions([]);
//         setPurchaseItemBarcodeSearchTerm("");
//         setPurchaseItemBarcodeSuggestions([]);
//         document.getElementById("purchase-item-name-search")?.focus();
//     };

//     const handleRemoveFromPurchase = (medId: string) => {
//         setPurchaseItems(prev => prev.filter(item => item.id !== medId));
//     }

//     const handleFinalizePurchase = async () => {
//         if (purchaseItems.length === 0) {
//             toast({ variant: "destructive", title: "القائمة فارغة", description: "الرجاء إضافة أصناف إلى قائمة الشراء أولاً." });
//             return;
//         }

//         const supplier = suppliers.find(s => s.id == purchaseSupplierId);
//         if (!supplier) return;

//         const purchaseData = {
//             number: purchase_id,
//             supplier_id: supplier.id,
//             supplier_name: supplier.name,
//             date: new Date().toISOString().split('T')[0],
//             items: purchaseItems,
//             status: "Received",
//             total_amount: purchaseItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.purchase_price || 0)), 0),
//         }

//         const success = await addPurchaseOrder(purchaseData);

//         if (success) {
//             setPurchaseId('');
//             setPurchaseSupplierId('');
//             setPurchaseItems([]);
//             setIsPurchaseInfoLocked(false);
//             fetchPurchaseHistory(1, purchasePerPage, '', '', '');
//         }
//     }

//     const handleNewMedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files && e.target.files[0]) {
//         const file = e.target.files[0];
//         setNewMedImageFile(file);
//         setNewMedImagePreview(URL.createObjectURL(file));
//         }
//     };


//     const handleReturnNameSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value;
//         setReturnMedNameSearchTerm(value);
//         if (value.length > 0) {
//             const results = await searchAllInventory(value);
//             const filtered = results.filter(med => med.stock > 0);
//             setReturnMedNameSuggestions(filtered.slice(0, 5));
//         } else {
//             setReturnMedNameSuggestions([]);
//         }
//     };

//     const handleReturnBarcodeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value;
//         setReturnMedBarcodeSearchTerm(value);
//         // Don't search automatically for barcode - wait for Enter key
//         // Clear barcode suggestions when input is cleared
//         if (value.length === 0) {
//             setReturnMedBarcodeSuggestions([]);
//         }
//     };

//     const handleReturnBarcodeSearchKeyDown = React.useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
//         if (event.key === 'Enter') {
//             event.preventDefault();
//             // Only process if barcode term exists
//             if(returnMedBarcodeSearchTerm) {
//                 const results = await searchAllInventory(returnMedBarcodeSearchTerm);
//                 const filtered = results.filter(med => med.stock > 0);
//                 setReturnMedBarcodeSuggestions(filtered.slice(0, 5));
//                 setReturnMedBarcodeSearchTerm("");
//             }
//         }
//     }, [returnMedBarcodeSearchTerm]);

//     const handleSelectMedForReturn = (med: Medication) => {
//         setSelectedMedForReturn(med);
//         setReturnMedNameSearchTerm(med.name);
//         setReturnMedNameSuggestions([]);
//         setReturnMedBarcodeSearchTerm("");
//         setReturnMedBarcodeSuggestions([]);
//         document.getElementById("return-quantity")?.focus();
//     };

//     const handleAddItemToReturnCart = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!returnSlipId || !returnSupplierId) {
//             toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء إدخال رقم قائمة الاسترجاع واختيار المورد." });
//             return;
//         }
//         if (!selectedMedForReturn) {
//             toast({ variant: "destructive", title: "لم يتم اختيار دواء", description: "الرجاء البحث واختيار دواء لإضافته." });
//             return;
//         }
//         const quantity = parseInt(returnItemQuantity, 10);
//         if (isNaN(quantity) || quantity <= 0) {
//             toast({ variant: "destructive", title: "كمية غير صالحة", description: "الرجاء إدخال كمية صحيحة." });
//             return;
//         }
//         if (quantity > selectedMedForReturn.stock) {
//             toast({ variant: "destructive", title: "كمية غير كافية", description: `الرصيد المتوفر من ${selectedMedForReturn.name} هو ${selectedMedForReturn.stock} فقط.`});
//             return;
//         }

//         const newItem: ReturnOrderItem = {
//             id: selectedMedForReturn.id,
//             medication_id: selectedMedForReturn.id,
//             name: selectedMedForReturn.name,
//             quantity: quantity,
//             purchase_price: selectedMedForReturn.purchase_price,
//             reason: returnItemReason
//         };
        
//         setReturnCart(prev => [...prev, newItem]);
//         setIsReturnInfoLocked(true);
        
//         setSelectedMedForReturn(null);
//         setReturnMedNameSearchTerm("");
//         setReturnMedBarcodeSearchTerm("");
//         setReturnMedNameSuggestions([]);
//         setReturnMedBarcodeSuggestions([]);
//         setReturnItemQuantity("1");
//         setReturnItemReason("");
//         document.getElementById("return-med-name-search")?.focus();
//     };

//     const handleRemoveFromReturnCart = (medId: string) => {
//         setReturnCart(prev => prev.filter(item => item.medication_id !== medId));
//     }

//     const handleFinalizeReturn = async () => {
//         if (returnCart.length === 0) {
//         toast({ variant: "destructive", title: "القائمة فارغة", description: "الرجاء إضافة أصناف إلى قائمة الاسترجاع أولاً." });
//         return;
//         }

//         const supplier = suppliers.find(s => s.id == returnSupplierId);
//         if (!supplier) return;
        
//         const returnData = {
//             number: returnSlipId,
//             supplier_id: supplier.id,
//             supplier_name: supplier.name,
//             date: new Date().toISOString().split('T')[0],
//             items: returnCart,
//             total_amount: returnCart.reduce((acc, item) => acc + item.quantity * item.purchase_price, 0)
//         }
        
//         const success = await addReturnOrder(returnData);
        
//         if(success) {
//         setReturnSlipId("");
//         setReturnSupplierId("");
//         setReturnCart([]);
//         setIsReturnInfoLocked(false);
//         fetchReturnHistory(1, returnPerPage, '', '', '');
//         }
//     }

//     const openEditItemDialog = (item: PurchaseOrderItem) => {
//         setEditingPurchaseItem({ 
//             ...item,
//             profit_margin: calculateProfitMargin(item.purchase_price || 0, item.price || 0)
//         });
//         setIsEditItemOpen(true);
//     };
    
//     const handleUpdatePurchaseItem = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!editingPurchaseItem) return;
        
//         const { profit_margin, ...updatedItem } = editingPurchaseItem;
        
//         setPurchaseItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem as PurchaseOrderItem : item));
//         setIsEditItemOpen(false);
//         setEditingPurchaseItem(null);
//     };

//     const handleEditPurchaseOrder = (order: PurchaseOrder) => {
//         setPurchaseDraft({ 
//             invoiceId: order.number, 
//             supplierId: order.supplier_id, 
//             items: order.items 
//         });
//         // This will trigger the useEffect to load the draft
//     };

//     const handleEditReturnOrder = (order: ReturnOrder) => {
//         setReturnDraft({ 
//             slipId: order.number, 
//             supplierId: order.supplier_id, 
//             items: order.items 
//         });
//         // This will trigger the useEffect to load the draft
//     }
//     const handleDeletePurchaseOrder = async (orderId: string) => {
//         const success = await deletePurchaseOrder(orderId);
//         if (success) {
//             toast({ title: "تم حذف قائمة الشراء بنجاح" });
//             fetchPurchaseHistory(1, purchasePerPage, "", "", ""); // Refresh list
//         }
//     };

//     const handleDeleteReturnOrder = async (orderId: string) => {
//         const success = await deleteReturnOrder(orderId);
//         if (success) {
//             toast({ title: "تم حذف قائمة الاسترجاع بنجاح" });
//             fetchReturnHistory(1, returnPerPage, "", "", ""); // Refresh list
//         }
//     };


//   return (
//      <Tabs defaultValue="new-purchase" onValueChange={setActiveTab} className="w-full">
//       <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-10">
//         <TabsTrigger value="new-purchase">استلام بضاعة</TabsTrigger>
//         <TabsTrigger value="purchase-history">سجل المشتريات</TabsTrigger>
//         <TabsTrigger value="new-return">إرجاع للمورد</TabsTrigger>
//         <TabsTrigger value="return-history">سجل الاسترجاع</TabsTrigger>
//       </TabsList>
//       <TabsContent value="new-purchase" dir="rtl">
//         <Card>
//           <CardHeader>
//             <CardTitle>استلام بضاعة جديدة</CardTitle>
//             <CardDescription>
//               أضف الأصناف المستلمة إلى القائمة أدناه ثم اضغط على "إتمام عملية الاستلام" لحفظها.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-6">
//                 <form onSubmit={handleAddItemToPurchase} className="p-4 border rounded-md space-y-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div className="space-y-2">
//                             <Label htmlFor="purchase_id">رقم قائمة الشراء</Label>
//                             <Input id="purchase_id" value={purchase_id} onChange={e => setPurchaseId(e.target.value)} placeholder="مثال: PO-2024-001" required disabled={isPurchaseInfoLocked && purchaseItems.length > 0}/>
//                         </div>
//                         <div className="space-y-2">
//                             <Label htmlFor="supplier_id">المورد</Label>
//                             <div className="flex gap-2">
//                                 <Select value={purchaseSupplierId} onValueChange={setPurchaseSupplierId} required disabled={isPurchaseInfoLocked && purchaseItems.length > 0}>
//                                     <SelectTrigger id="supplier_id">
//                                         <SelectValue placeholder="اختر موردًا" />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         {(suppliers || []).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
//                                     </SelectContent>
//                                 </Select>
//                                 <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
//                                     <DialogTrigger asChild>
//                                         <Button type="button" size="icon" variant="outline">
//                                             <PlusCircle />
//                                         </Button>
//                                     </DialogTrigger>
//                                     <DialogContent>
//                                         <DialogHeader>
//                                             <DialogTitle>إضافة مورد جديد</DialogTitle>
//                                         </DialogHeader>
//                                         <form onSubmit={handleAddSupplier} className="space-y-4 pt-2">
//                                             <div className="space-y-2">
//                                                 <Label htmlFor="supplier_name">اسم المورد</Label>
//                                                 <Input id="supplier_name" name="supplier_name" required />
//                                             </div>
//                                             <div className="space-y-2">
//                                                 <Label htmlFor="supplierContact">الشخص المسؤول (اختياري)</Label>
//                                                 <Input id="supplierContact" name="supplierContact" />
//                                             </div>
//                                             <DialogFooter className="pt-2">
//                                                 <DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose>
//                                                 <Button type="submit" variant="success">إضافة</Button>
//                                             </DialogFooter>
//                                         </form>
//                                     </DialogContent>
//                                 </Dialog>
//                             </div>
//                         </div>
//                     </div>
//                      <hr className="my-4" />
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 space-y-2">
//                         <div className="relative space-y-2" ref={nameSearchContainerRef}>
//                             <Label htmlFor="purchase-item-name-search">ابحث بالاسم أو الاسم العلمي</Label>
//                             <Input 
//                                 id="purchase-item-search"
//                                 onKeyDown={(e) => {
//                                     if (e.key === "Enter") {
//                                     e.preventDefault();
//                                     }
//                                 }}
//                                 value={purchaseItemNameSearchTerm} 
//                                 onChange={handlePurchaseNameSearch}
//                                 placeholder="ابحث بالاسم أو الاسم العلمي..."
//                                 autoComplete="off"
//                             />
//                         {purchaseItemNameSuggestions.length > 0 && (
//                              <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
//                                 <CardContent className="p-0">
//                                     <ul className="divide-y divide-border">
//                                         {purchaseItemNameSuggestions.map(med => (
//                                             <li key={med.id}>
//                                                 <div className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center" onMouseDown={() => handleSelectMed(med)}>
//                                                     <div>
//                                                       <div>{med.name}</div>
//                                                       <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
//                                                     </div>
//                                                     <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
//                                                 </div>
//                                                 <Button variant="link" size="sm" className="w-full justify-start text-xs h-auto px-3 py-1" onMouseDown={() => handleSelectMed(med, true)}>
//                                                     <FilePlus className="me-2 h-3 w-3" />
//                                                     هل هذه دفعة جديدة بتاريخ انتهاء مختلف؟ اضغط هنا
//                                                 </Button>
//                                             </li>
//                                         ))}
//                                     </ul>
//                                 </CardContent>
//                             </Card>
//                         )}
//                         </div>
//                         <div className="relative space-y-2" ref={barcodeSearchContainerRef}>
//                             <Label htmlFor="purchase-item-barcode-search">امسح الباركود</Label>
//                             <Input
//                               id="purchase-item-barcode-search"
//                               ref={barcodeInputRef}
//                               value={purchaseItemBarcodeSearchTerm}
//                               onChange={handlePurchaseBarcodeSearchChange}
//                               onKeyDown={handlePurchaseBarcodeSearchKeyDown}
//                               placeholder="امسح الباركود..."
//                               autoComplete="off"
//                             />
//                             {purchaseItemBarcodeSuggestions.length > 0 && (
//                                  <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
//                                     <CardContent className="p-0">
//                                         <ul className="divide-y divide-border max-h-[30rem] overflow-y-auto">
//                                             {purchaseItemBarcodeSuggestions.map(med => (
//                                                 <li key={med.id}>
//                                                     <div className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center" onMouseDown={() => handleSelectMed(med)}>
//                                                         <div>
//                                                           <div>{med.name}</div>
//                                                           <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
//                                                         </div>
//                                                         <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
//                                                     </div>
//                                                     <Button variant="link" size="sm" className="w-full justify-start text-xs h-auto px-3 py-1" onMouseDown={() => handleSelectMed(med, true)}>
//                                                         <FilePlus className="me-2 h-3 w-3" />
//                                                         هل هذه دفعة جديدة بتاريخ انتهاء مختلف؟ اضغط هنا
//                                                     </Button>
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     </CardContent>
//                                 </Card>
//                             )}
//                         </div>
//                         <Button variant="link" size="sm" className="p-0 h-auto md:col-span-2" onClick={openNewMedModal}>أو أضف دواء جديد غير موجود...</Button>
//                     </div>
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                         <div>
//                             <Label htmlFor="quantity">الكمية</Label>
//                             <Input id="quantity" type="number" value={newMedData.quantity || ''} onChange={e => handlePriceChange(setNewMedData, 'quantity', e.target.value)} required />
//                         </div>
//                          <div>
//                             <Label>سعر الشراء</Label>
//                             <Input type="number" value={newMedData.purchase_price || ''} onChange={e => handlePriceChange(setNewMedData, 'purchase_price', e.target.value)} required />
//                         </div>
//                         <div className="flex items-end gap-2">
//                             <div className="space-y-1 flex-grow">
//                                 <Label>سعر البيع</Label>
//                                 <Input type="number" value={newMedData.price || ''} onChange={e => handlePriceChange(setNewMedData, 'price', e.target.value)} required />
//                             </div>
//                             <div className="space-y-1 w-20">
//                                 <Label>النسبة %</Label>
//                                 <Input type="number" value={newMedData.profit_margin?.toFixed(0) || ''} onChange={e => handlePriceChange(setNewMedData, 'profit_margin', e.target.value)} />
//                             </div>
//                         </div>
//                         <div>
//                             <Label>تاريخ الانتهاء</Label>
//                             <Input type="date" value={newMedData.expiration_date || ''} onChange={e => handlePriceChange(setNewMedData, 'expiration_date', e.target.value)} required />
//                         </div>
//                     </div>
//                     <Button type="submit" className="w-full">إضافة إلى القائمة</Button>
//                 </form>

//                 {purchaseItems.length > 0 && (
//                     <div>
//                         <h3 className="mb-2 text-lg font-semibold">الأصناف في القائمة الحالية:</h3>
//                         <Table>
//                             <TableHeader>
//                                 <TableRow>
//                                     <TableHead>المنتج</TableHead>
//                                     <TableHead>الكمية</TableHead>
//                                     <TableHead>سعر الشراء</TableHead>
//                                     <TableHead>تاريخ الانتهاء</TableHead>
//                                     <TableHead>الإجمالي</TableHead>
//                                     <TableHead></TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 {purchaseItems.map(item => (
//                                     <TableRow key={item.id}>
//                                         <TableCell>{item.name}</TableCell>
//                                         <TableCell className="font-mono">{item.quantity}</TableCell>
//                                         <TableCell className="font-mono">{item.purchase_price?.toLocaleString()}</TableCell>
//                                         <TableCell className="font-mono">{item.expiration_date ? new Date(item.expiration_date).toLocaleDateString('en-US') : ''}</TableCell>
//                                         <TableCell className="font-mono">{(item.quantity! * item.purchase_price!).toLocaleString()}</TableCell>
//                                         <TableCell className="flex items-center gap-1">
//                                             <Button variant="ghost" size="icon" className="text-blue-600 h-8 w-8" onClick={() => openEditItemDialog(item)}>
//                                                 <Pencil className="h-4 w-4" />
//                                             </Button>
//                                             <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveFromPurchase(item.id)}>
//                                                 <Trash2 className="h-4 w-4" />
//                                             </Button>
//                                         </TableCell>
//                                     </TableRow>
//                                 ))}
//                             </TableBody>
//                         </Table>
//                     </div>
//                 )}
//           </CardContent>
//           <CardFooter>
//             <Button onClick={handleFinalizePurchase} variant="success" className="w-full" disabled={purchaseItems.length === 0}>
//                 إتمام عملية الاستلام
//             </Button>
//           </CardFooter>
//         </Card>
//       </TabsContent>
//        <TabsContent value="purchase-history" dir="rtl">
//         <Card>
//           <CardHeader>
//             <CardTitle>سجل المشتريات</CardTitle>
//             <CardDescription>قائمة بجميع طلبات الشراء المستلمة. اضغط على أي صف لعرض التفاصيل.</CardDescription>
//             <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
//               <Input 
//                 placeholder="ابحث برقم القائمة، اسم المورد..."
//                 value={purchaseSearchTerm}
//                 onChange={(e) => setPurchaseSearchTerm(e.target.value)}
//                 className="sm:col-span-1"
//               />
//               <Input type="date" value={purchaseDateFrom} onChange={e => setPurchaseDateFrom(e.target.value)} />
//               <Input type="date" value={purchaseDateTo} onChange={e => setPurchaseDateTo(e.target.value)} />
//             </div>
//           </CardHeader>
//           <CardContent>
//              <Table>
//                 <TableHeader>
//                     <TableRow>
//                         <TableHead className="w-[150px]">رقم القائمة</TableHead>
//                         <TableHead>المنتج / المورد</TableHead>
//                         <TableHead className="w-[120px]">الكمية</TableHead>
//                         <TableHead className="w-[120px]">سعر الشراء</TableHead>
//                         <TableHead className="w-[120px]">الإجمالي</TableHead>
//                         <TableHead className="w-[120px]">التاريخ</TableHead>
//                         <TableHead className="w-[80px]">الإجراءات</TableHead>
//                     </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                     {purchaseLoading ? Array.from({ length: 5 }).map((_, i) => (
//                         <TableRow key={`skel-purchase-${i}`}>
//                             <TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell>
//                         </TableRow>
//                     )) : purchaseHistory.length > 0 ? purchaseHistory.map(po => (
//                         <React.Fragment key={po.id}>
//                             <TableRow onClick={() => toggleRow(po.id)} className="cursor-pointer bg-muted/30 font-semibold">
//                                 <TableCell className="font-mono">{po.number}</TableCell>
//                                 <TableCell>
//                                     <div className="flex items-center gap-2">
//                                         <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(po.id) && "rotate-180")} />
//                                         {po.supplier_name}
//                                     </div>
//                                 </TableCell>
//                                 <TableCell></TableCell>
//                                 <TableCell></TableCell>
//                                 <TableCell className="font-mono">{po.total_amount.toLocaleString()}</TableCell>
//                                 <TableCell className="font-mono">{new Date(po.date).toLocaleDateString('en-US')}</TableCell>
//                                 <TableCell>
//                                     <div className="flex items-center gap-1">
//                                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleEditPurchaseOrder(po);}}>
//                                             <Pencil className="h-4 w-4" />
//                                         </Button>
//                                         {/* <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={(e) => {e.stopPropagation(); handleDeletePurchaseOrder(po.id);}}>
//                                             <Trash2 className="h-4 w-4" />
//                                         </Button> */}
//                                     </div>
//                                 </TableCell>
//                             </TableRow>
//                             {expandedRows.has(po.id) && (po.items || []).map((item, index) => (
//                                 <TableRow key={`${po.id}-${item.id}-${index}`} className="bg-muted/10">
//                                     <TableCell></TableCell>
//                                     <TableCell className="pr-10">{item.name}</TableCell>
//                                     <TableCell className="font-mono">{item.quantity}</TableCell>
//                                     <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
//                                     <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
//                                     <TableCell></TableCell>
//                                     <TableCell></TableCell>
//                                 </TableRow>
//                             ))}
//                         </React.Fragment>
//                     )) : (
//                         <TableRow>
//                             <TableCell colSpan={7} className="text-center h-24">
//                                 لا توجد نتائج مطابقة للبحث.
//                             </TableCell>
//                         </TableRow>
//                     )}
//                 </TableBody>
//             </Table>
//             <div className="flex items-center justify-between pt-4">
//                 <span className="text-sm text-muted-foreground">
//                     صفحة {purchaseCurrentPage} من {purchaseTotalPages}
//                 </span>
//                 <div className="flex gap-2">
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setPurchaseCurrentPage(p => Math.max(p - 1, 1))}
//                         disabled={purchaseCurrentPage === 1 || purchaseLoading}
//                     >
//                         السابق
//                     </Button>
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setPurchaseCurrentPage(p => Math.min(p + 1, purchaseTotalPages))}
//                         disabled={purchaseCurrentPage === purchaseTotalPages || purchaseLoading}
//                     >
//                         التالي
//                     </Button>
//                 </div>
//             </div>
//           </CardContent>
//         </Card>
//       </TabsContent>
//        <TabsContent value="new-return" dir="rtl">
//          <Card>
//             <CardHeader>
//                 <CardTitle>إنشاء قائمة إرجاع للمورد</CardTitle>
//                 <CardDescription>
//                 استخدم هذا النموذج لإنشاء قائمة بالأدوية المرتجعة للمورد.
//                 </CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                         <Label htmlFor="returnSlipId">رقم قائمة الاسترجاع</Label>
//                         <Input id="returnSlipId" value={returnSlipId} onChange={e => setReturnSlipId(e.target.value)} placeholder="مثال: RET-2024-001" required disabled={is_returnInfoLocked && returnCart.length > 0} />
//                     </div>
//                      <div className="space-y-2">
//                         <Label htmlFor="return-supplier_id">المورد</Label>
//                         <Select value={returnSupplierId} onValueChange={setReturnSupplierId} required disabled={is_returnInfoLocked && returnCart.length > 0}>
//                             <SelectTrigger id="return-supplier_id">
//                                 <SelectValue placeholder="اختر موردًا" />
//                             </SelectTrigger>
//                             <SelectContent>
//                                 {(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
//                             </SelectContent>
//                         </Select>
//                     </div>
//                 </div>
                
//                 <form onSubmit={handleAddItemToReturnCart} className="p-4 border rounded-md space-y-4">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 space-y-2">
//                         <div className="relative space-y-2" ref={returnNameSearchContainerRef}>
//                             <Label htmlFor="return-med-name-search">ابحث بالاسم أو الاسم العلمي</Label>
//                             <Input 
//                               id="return-med-name-search"
//                               onKeyDown={(e) => {
//                                 if (e.key === "Enter") {
//                                   e.preventDefault();
//                                 }
//                               }}
//                               value={returnMedNameSearchTerm} 
//                               onChange={handleReturnNameSearch}
//                               placeholder="ابحث بالاسم أو الاسم العلمي..."
//                               autoComplete="off"
//                             />
//                             {returnMedNameSuggestions.length > 0 && (
//                                  <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
//                                     <CardContent className="p-0">
//                                         <ul className="divide-y divide-border">
//                                             {returnMedNameSuggestions.map(med => (
//                                                 <li key={med.id}
//                                                     onMouseDown={() => handleSelectMedForReturn(med)}
//                                                     className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center"
//                                                 >
//                                                     <div>
//                                                       <div>{med.name}</div>
//                                                       <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
//                                                     </div>
//                                                     <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     </CardContent>
//                                 </Card>
//                             )}
//                         </div>
//                         <div className="relative space-y-2" ref={returnBarcodeSearchContainerRef}>
//                             <Label htmlFor="return-med-barcode-search">امسح الباركود</Label>
//                             <Input
//                               id="return-med-barcode-search"
//                               ref={returnBarcodeInputRef}
//                               value={returnMedBarcodeSearchTerm}
//                               onChange={handleReturnBarcodeSearchChange}
//                               onKeyDown={handleReturnBarcodeSearchKeyDown}
//                               placeholder="امسح الباركود..."
//                               autoComplete="off"
//                             />
//                             {returnMedBarcodeSuggestions.length > 0 && (
//                                  <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
//                                     <CardContent className="p-0">
//                                         <ul className="divide-y divide-border max-h-[30rem] overflow-y-auto">
//                                             {returnMedBarcodeSuggestions.map(med => (
//                                                 <li key={med.id}
//                                                     onMouseDown={() => handleSelectMedForReturn(med)}
//                                                     className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center"
//                                                 >
//                                                     <div>
//                                                       <div>{med.name}</div>
//                                                       <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
//                                                     </div>
//                                                     <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     </CardContent>
//                                 </Card>
//                             )}
//                         </div>
//                     </div>
//                      <div className="grid grid-cols-2 gap-4">
//                         <div className="space-y-2">
//                             <Label htmlFor="return-quantity">الكمية المرتجعة</Label>
//                             <Input id="return-quantity" type="number" value={returnItemQuantity} onChange={e => setReturnItemQuantity(e.target.value)} required min="1" disabled={!selectedMedForReturn} />
//                         </div>
//                         <div className="space-y-2">
//                             <Label htmlFor="reason">سبب الإرجاع</Label>
//                             <Input id="reason" value={returnItemReason} onChange={e => setReturnItemReason(e.target.value)} placeholder="مثال: تالف، قريب الانتهاء" disabled={!selectedMedForReturn} />
//                         </div>
//                     </div>
//                     <Button type="submit" className="w-full" disabled={!selectedMedForReturn}>إضافة إلى القائمة</Button>
//                 </form>
                
//                 {returnCart.length > 0 && (
//                   <div>
//                     <h3 className="mb-2 text-lg font-semibold">أصناف في قائمة الاسترجاع الحالية:</h3>
//                     <Table>
//                       <TableHeader>
//                         <TableRow>
//                           <TableHead>المنتج</TableHead>
//                           <TableHead>الكمية</TableHead>
//                           <TableHead>السبب</TableHead>
//                           <TableHead>القيمة</TableHead>
//                           <TableHead></TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {returnCart.map(item => (
//                           <TableRow key={item.medication_id}>
//                             <TableCell>{item.name}</TableCell>
//                             <TableCell className="font-mono">{item.quantity}</TableCell>
//                             <TableCell>{item.reason}</TableCell>
//                             <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
//                             <TableCell>
//                               <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveFromReturnCart(item.medication_id)}>
//                                 <Trash2 className="h-4 w-4" />
//                               </Button>
//                             </TableCell>
//                           </TableRow>
//                         ))}
//                       </TableBody>
//                     </Table>
//                   </div>
//                 )}
//             </CardContent>
//             <CardFooter>
//               <Button onClick={handleFinalizeReturn} variant="destructive" className="w-full" disabled={returnCart.length === 0}>
//                 إتمام عملية الاسترجاع
//               </Button>
//             </CardFooter>
//         </Card>
//       </TabsContent>
//        <TabsContent value="return-history" dir="rtl">
//         <Card>
//           <CardHeader>
//             <CardTitle>سجل الاسترجاع</CardTitle>
//             <CardDescription>قائمة بجميع عمليات الاسترجاع للموردين. اضغط على أي صف لعرض التفاصيل.</CardDescription>
//              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
//               <Input 
//                 placeholder="ابحث برقم القائمة، اسم المورد..."
//                 value={returnSearchTerm}
//                 onChange={(e) => setReturnSearchTerm(e.target.value)}
//                 className="sm:col-span-1"
//               />
//               <Input type="date" value={returnDateFrom} onChange={e => setReturnDateFrom(e.target.value)} />
//               <Input type="date" value={returnDateTo} onChange={e => setReturnDateTo(e.target.value)} />
//             </div>
//           </CardHeader>
//           <CardContent>
//             <Table>
//                 <TableHeader>
//                      <TableRow>
//                         <TableHead className="w-[150px]">رقم القائمة</TableHead>
//                         <TableHead>المنتج / المورد</TableHead>
//                         <TableHead className="w-[120px]">الكمية</TableHead>
//                         <TableHead className="w-[120px]">سعر الشراء</TableHead>
//                         <TableHead className="w-[120px]">الإجمالي</TableHead>
//                         <TableHead className="w-[120px]">التاريخ</TableHead>
//                         <TableHead className="w-[80px]">الإجراءات</TableHead>
//                     </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                     {returnLoading ? Array.from({ length: 5 }).map((_, i) => (
//                         <TableRow key={`skel-return-${i}`}>
//                             <TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell>
//                         </TableRow>
//                     )) : returnHistory.length > 0 ? returnHistory.map(ret => (
//                         <React.Fragment key={ret.id}>
//                             <TableRow onClick={() => toggleRow(ret.id)} className="cursor-pointer bg-muted/30 font-semibold">
//                                 <TableCell className="font-mono">{ret.number}</TableCell>
//                                 <TableCell>
//                                     <div className="flex items-center gap-2">
//                                         <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(ret.id) && "rotate-180")} />
//                                         {ret.supplier_name}
//                                     </div>
//                                 </TableCell>
//                                 <TableCell></TableCell>
//                                 <TableCell></TableCell>
//                                 <TableCell className="font-mono">{ret.total_amount.toLocaleString()}</TableCell>
//                                 <TableCell className="font-mono">{new Date(ret.date).toLocaleDateString('en-US')}</TableCell>
//                                 <TableCell>
//                                     <div className="flex items-center gap-1">
//                                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {e.stopPropagation(); handleEditReturnOrder(ret);}}>
//                                             <Pencil className="h-4 w-4" />
//                                         </Button>
//                                         {/* <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={(e) => {e.stopPropagation(); handleDeleteReturnOrder(ret.id);}}>
//                                             <Trash2 className="h-4 w-4" />
//                                         </Button> */}
//                                     </div>

//                                 </TableCell>
//                             </TableRow>
//                             {expandedRows.has(ret.id) && (ret.items || []).map((item, index) => (
//                                 <TableRow key={`${ret.id}-${item.medication_id}-${index}`} className="bg-muted/10">
//                                     <TableCell></TableCell>
//                                     <TableCell className="pr-10">{item.name} <span className="text-xs text-muted-foreground">({item.reason})</span></TableCell>
//                                     <TableCell className="font-mono">{item.quantity}</TableCell>
//                                     <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
//                                     <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
//                                     <TableCell></TableCell>
//                                     <TableCell></TableCell>
//                                 </TableRow>
//                             ))}
//                         </React.Fragment>
//                     )) : (
//                         <TableRow>
//                             <TableCell colSpan={7} className="text-center h-24">
//                                 لا توجد نتائج مطابقة للبحث.
//                             </TableCell>
//                         </TableRow>
//                     )}
//                 </TableBody>
//             </Table>
//             <div className="flex items-center justify-between pt-4">
//                 <span className="text-sm text-muted-foreground">
//                     صفحة {returnCurrentPage} من {returnTotalPages}
//                 </span>
//                 <div className="flex gap-2">
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setReturnCurrentPage(p => Math.max(p - 1, 1))}
//                         disabled={returnCurrentPage === 1 || returnLoading}
//                     >
//                         السابق
//                     </Button>
//                     <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => setReturnCurrentPage(p => Math.min(p + 1, returnTotalPages))}
//                         disabled={returnCurrentPage === returnTotalPages || returnLoading}
//                     >
//                         التالي
//                     </Button>
//                 </div>
//             </div>
//           </CardContent>
//         </Card>
//       </TabsContent>
//       <Dialog open={isAddNewMedModalOpen} onOpenChange={setIsAddNewMedModalOpen}>
//         <DialogContent className="sm:max-w-2xl">
//             <DialogHeader>
//                 <DialogTitle>إضافة دواء جديد إلى المخزون</DialogTitle>
//                 <DialogDescription>هذا الدواء غير موجود في النظام. الرجاء إدخال تفاصيله كاملة.</DialogDescription>
//             </DialogHeader>
//              <form onSubmit={handleAddNewMedSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                         <Label>الباركود (يفصل بفاصلة ,)</Label>
//                         <div className="relative">
//                             <Input value={newMedData.barcodes?.join(',') || ''} onChange={e => setNewMedData(p => ({...p, barcodes: e.target.value.split(',').map(s => s.trim())}))} />
//                              <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-1 h-7 w-7" onClick={() => setNewMedData(p => ({...p, barcodes: [...(p.barcodes || []), '']}))}>
//                                 <PlusCircle className="h-4 w-4" />
//                             </Button>
//                         </div>
//                     </div>
//                      <div className="space-y-2">
//                         <Label>الاسم التجاري</Label>
//                         <Input value={newMedData.name || purchaseItemSearchTerm} onChange={e => setNewMedData(p => ({...p, name: e.target.value}))} required />
//                     </div>
//                 </div>
//                 <div className="space-y-2">
//                     <Label>الاسم العلمي (يفصل بفاصلة ,)</Label>
//                     <div className="relative">
//                         <Input value={newMedData.scientific_names?.join(',') || ''} onChange={e => setNewMedData(p => ({...p, scientific_names: e.target.value.split(',').map(s => s.trim())}))} />
//                         <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-1 h-7 w-7" onClick={() => setNewMedData(p => ({...p, scientific_names: [...(p.scientific_names || []), '']}))}>
//                             <PlusCircle className="h-4 w-4" />
//                         </Button>
//                     </div>
//                 </div>
//                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                     <div className="space-y-2">
//                         <Label>الجرعة</Label>
//                         <Input value={newMedData.dosage || ''} onChange={e => setNewMedData(p => ({...p, dosage: e.target.value}))} />
//                     </div>
//                      <div className="space-y-2">
//                         <Label>الشكل الدوائي</Label>
//                         <Select value={newMedData.dosage_form} onValueChange={val => setNewMedData(p => ({...p, dosage_form: val}))}>
//                             <SelectTrigger>
//                                 <SelectValue placeholder="اختر الشكل" />
//                             </SelectTrigger>
//                             <SelectContent className="max-h-64">{dosage_forms.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
//                         </Select>
//                     </div>
//                     <div className="space-y-2">
//                         <Label>الكمية المستلمة</Label>
//                         <Input type="number" value={newMedData.quantity || ''} onChange={e => setNewMedData(p => ({...p, quantity: parseInt(e.target.value)}))} required />
//                     </div>
//                     <div className="space-y-2">
//                         <Label>نقطة إعادة الطلب</Label>
//                         <Input type="number" value={newMedData.reorder_point || 10} onChange={e => setNewMedData(p => ({...p, reorder_point: parseInt(e.target.value)}))} required />
//                     </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                         <Label>سعر الشراء</Label>
//                         <Input type="number" value={newMedData.purchase_price || ''} onChange={e => handlePriceChange(setNewMedData, 'purchase_price', e.target.value)} required />
//                     </div>
//                     <div className="flex items-end gap-2">
//                         <div className="space-y-1 flex-grow">
//                             <Label>سعر البيع</Label>
//                             <Input type="number" value={newMedData.price || ''} onChange={e => handlePriceChange(setNewMedData, 'price', e.target.value)} required />
//                         </div>
//                         <div className="space-y-1 w-20">
//                             <Label>النسبة %</Label>
//                             <Input type="number" value={newMedData.profit_margin?.toFixed(0) || ''} onChange={e => handlePriceChange(setNewMedData, 'profit_margin', e.target.value)} />
//                         </div>
//                     </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                         <Label>تاريخ الانتهاء</Label>
//                         <Input type="date" value={newMedData.expiration_date || ''} onChange={e => setNewMedData(p => ({...p, expiration_date: e.target.value}))} required />
//                     </div>
//                      <div className="space-y-2">
//                         <Label>صورة المنتج (اختياري)</Label>
//                         <Input type="file" accept="image/*" onChange={handleNewMedImageChange} />
//                         {newMedImagePreview && <Image src={newMedImagePreview} alt="Preview" width={100} height={100} className="rounded-md object-cover" />}
//                     </div>
//                 </div>
//                  <DialogFooter>
//                     <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
//                     <Button type="submit" variant="success">إضافة وإدراج في القائمة</Button>
//                 </DialogFooter>
//             </form>
//         </DialogContent>
//       </Dialog>
//         <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
//             <DialogContent className="sm:max-w-2xl">
//                 <DialogHeader>
//                     <DialogTitle>تعديل الصنف: {editingPurchaseItem?.name}</DialogTitle>
//                 </DialogHeader>
//                 {editingPurchaseItem && (
//                     <form onSubmit={handleUpdatePurchaseItem} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto p-1">
//                         {editingPurchaseItem.is_new ? (
//                              <>
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     <div className="space-y-2">
//                                         <Label>الباركود (يفصل بفاصلة ,)</Label>
//                                         <div className="relative">
//                                             <Input value={editingPurchaseItem.barcodes?.join(',') || ''} onChange={e => setEditingPurchaseItem(p => p ? {...p, barcodes: e.target.value.split(',').map(s => s.trim())} : null)} />
//                                             <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-1 h-7 w-7" onClick={() => setEditingPurchaseItem(p => p ? {...p, barcodes: [...(p.barcodes || []), '']} : null)}>
//                                                 <PlusCircle className="h-4 w-4" />
//                                             </Button>
//                                         </div>
//                                     </div>
//                                     <div className="space-y-2">
//                                         <Label>الاسم التجاري</Label>
//                                         <Input value={editingPurchaseItem.name || ''} onChange={e => setEditingPurchaseItem(p => p ? {...p, name: e.target.value} : null)} required />
//                                     </div>
//                                 </div>
//                                 <div className="space-y-2">
//                                     <Label>الاسم العلمي (يفصل بفاصلة ,)</Label>
//                                     <div className="relative">
//                                         <Input value={editingPurchaseItem.scientific_names?.join(',') || ''} onChange={e => setEditingPurchaseItem(p => p ? {...p, scientific_names: e.target.value.split(',').map(s => s.trim())} : null)} />
//                                         <Button type="button" size="icon" variant="ghost" className="absolute top-1/2 -translate-y-1/2 left-1 h-7 w-7" onClick={() => setEditingPurchaseItem(p => p ? {...p, scientific_names: [...(p.scientific_names || []), '']} : null)}>
//                                             <PlusCircle className="h-4 w-4" />
//                                         </Button>
//                                     </div>
//                                 </div>
//                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                                     <div className="space-y-2">
//                                         <Label>الجرعة</Label>
//                                         <Input value={editingPurchaseItem.dosage || ''} onChange={e => setEditingPurchaseItem(p => p ? {...p, dosage: e.target.value} : null)} />
//                                     </div>
//                                     <div className="space-y-2">
//                                         <Label>الشكل الدوائي</Label>
//                                         <Select value={editingPurchaseItem.dosage_form} onValueChange={val => setEditingPurchaseItem(p => p ? {...p, dosage_form: val} : null)}>
//                                             <SelectTrigger>
//                                                 <SelectValue placeholder="اختر الشكل" />
//                                             </SelectTrigger>
//                                             <SelectContent className="max-h-64">{dosage_forms.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
//                                         </Select>
//                                     </div>
//                                     <div className="space-y-2">
//                                         <Label>الكمية المستلمة</Label>
//                                         <Input type="number" value={editingPurchaseItem.quantity} onChange={e => setEditingPurchaseItem(p => p ? {...p, quantity: parseInt(e.target.value)} : null)} required />
//                                     </div>
//                                     <div className="space-y-2">
//                                         <Label>نقطة إعادة الطلب</Label>
//                                         <Input type="number" value={editingPurchaseItem.reorder_point} onChange={e => setEditingPurchaseItem(p => p ? {...p, reorder_point: parseInt(e.target.value)} : null)} required />
//                                     </div>
//                                 </div>
//                             </>
//                         ) : (
//                              <div className="space-y-2">
//                                 <Label htmlFor="edit-quantity">الكمية</Label>
//                                 <Input id="edit-quantity" name="quantity" type="number" value={editingPurchaseItem.quantity} onChange={e => setEditingPurchaseItem(p => p ? {...p, quantity: parseInt(e.target.value)} : null)} required />
//                             </div>
//                         )}
//                         <div className="grid grid-cols-2 gap-4">
//                             <div className="space-y-2">
//                                 <Label>سعر الشراء</Label>
//                                 <Input type="number" step="0.01" value={editingPurchaseItem.purchase_price} onChange={e => handlePriceChange(setEditingPurchaseItem, 'purchase_price', e.target.value)} required />
//                             </div>
//                              <div className="flex items-end gap-2">
//                                 <div className="space-y-1 flex-grow">
//                                     <Label>سعر البيع</Label>
//                                     <Input type="number" step="0.01" value={editingPurchaseItem.price} onChange={e => handlePriceChange(setEditingPurchaseItem, 'price', e.target.value)} required />
//                                 </div>
//                                 <div className="space-y-1 w-20">
//                                     <Label>النسبة %</Label>
//                                     <Input type="number" value={editingPurchaseItem.profit_margin?.toFixed(0)} onChange={e => handlePriceChange(setEditingPurchaseItem, 'profit_margin', e.target.value)} />
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="space-y-2">
//                             <Label>تاريخ الانتهاء</Label>
//                             <Input type="date" value={editingPurchaseItem.expiration_date} onChange={e => setEditingPurchaseItem(p => p ? {...p, expiration_date: e.target.value} : null)} required />
//                         </div>
//                         <DialogFooter className="pt-2">
//                             <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
//                             <Button type="submit" variant="success">حفظ التغييرات</Button>
//                         </DialogFooter>
//                     </form>
//                 )}
//             </DialogContent>
//         </Dialog>
//     </Tabs>
//   )
// }
