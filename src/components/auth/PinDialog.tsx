
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pin: string) => void;
  title?: string;
  description?: string;
}

export function PinDialog({ open, onOpenChange, onConfirm, title, description }: PinDialogProps) {
  const [pin, setPin] = React.useState('');

  const handleConfirm = () => {
    // Validate PIN: at least 8 characters and at least one letter
    if (pin.length < 8) {
        // alert("رمز PIN يجب أن يكون 8 أحرف على الأقل");
        toast({ variant: 'destructive', title: 'رمز PIN يجب أن يكون 8 أحرف على الأقل' });
        return;
    }
    if (!/[a-zA-Z]/.test(pin)) {
        toast({ variant: 'destructive', title: 'رمز PIN يجب أن يحتوي على حرف واحد على الأقل' });
        // alert("رمز PIN يجب أن يحتوي على حرف واحد على الأقل");
        return;
    }

    onConfirm(pin);
    setPin(''); // Reset after confirm
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPin(''); // Reset if dialog is closed
    }
    onOpenChange(isOpen);
  };

  const hasCustomTitle = title !== undefined && title !== '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {hasCustomTitle ? (
            <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
        ) : (
            <DialogHeader>
                <VisuallyHidden>
                    <DialogTitle>تأكيد رمز PIN</DialogTitle>
                </VisuallyHidden>
            </DialogHeader>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">

            <Label htmlFor="pin-confirm" className="text-right">
              رمز PIN
            </Label>
            <Input
              id="pin-confirm"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="col-span-3"
              autoFocus
              autoComplete="new-password" // 👈 prevent autofill popup
              inputMode="numeric"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              إلغاء
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={!pin}>
            تأكيد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
