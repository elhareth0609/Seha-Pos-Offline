
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <p className="text-muted-foreground">جاري التحميل...</p>
    </div>
  );
};

export default Index;
