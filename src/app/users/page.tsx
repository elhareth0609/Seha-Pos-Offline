"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المستخدمين</CardTitle>
        <CardDescription>
          إدارة حسابات الموظفين وصلاحياتهم.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center text-center gap-4 py-16">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <div className="space-y-2">
            <h3 className="text-lg font-semibold">ميزة قيد التطوير</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
                تتطلب إدارة المستخدمين الكاملة (بما في ذلك إنشاء الحسابات والأدوار المختلفة) وجود قاعدة بيانات ونظام مصادقة خلفي.
                هذه الميزة هي جزء من خططنا المستقبلية للتطبيق.
            </p>
        </div>
      </CardContent>
    </Card>
  )
}
