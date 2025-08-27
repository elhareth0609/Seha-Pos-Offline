
"use client";

import * as React from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgePercent, Eye, Phone } from 'lucide-react';
import type { Offer } from '@/lib/types';
import { isAfter, parseISO } from 'date-fns';

export default function OffersPage() {
    const { offers, loading, incrementOfferView } = useAuth();

    const activeOffers = React.useMemo(() => {
        return (offers || []).filter(offer => isAfter(parseISO(offer.expiration_date), new Date()));
    }, [offers]);

    React.useEffect(() => {
        if (loading || activeOffers.length === 0) return;

        const viewedOffers = new Set<string>();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const offerId = (entry.target as HTMLElement).dataset.offerId;
                        if (offerId && !viewedOffers.has(offerId)) {
                            incrementOfferView(offerId);
                            viewedOffers.add(offerId);
                            observer.unobserve(entry.target); // Stop observing after view is counted
                        }
                    }
                });
            },
            { threshold: 0.5 } // Trigger when 50% of the element is visible
        );

        document.querySelectorAll('[data-offer-id]').forEach((el) => {
            observer.observe(el);
        });

        return () => {
            observer.disconnect();
        };
    }, [activeOffers, loading, incrementOfferView]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-0">
                            <Skeleton className="w-full aspect-[4/3] rounded-t-lg" />
                        </CardContent>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <BadgePercent className="h-10 w-10 text-yellow-500" />
                <div>
                    <h1 className="text-3xl font-bold">عروض ميدجرام</h1>
                    <p className="text-muted-foreground">اكتشف أحدث العروض والمنتجات من شركائنا.</p>
                </div>
            </div>
            {activeOffers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {activeOffers.map(offer => (
                        <Card key={offer.id} data-offer-id={offer.id} className="overflow-hidden group flex flex-col">
                            <CardContent className="p-0">
                                <div className="aspect-[4/3] relative">
                                    <Image 
                                        src={offer.image_url} 
                                        alt={offer.title} 
                                        layout="fill" 
                                        objectFit="cover" 
                                        className="transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                            </CardContent>
                            <CardHeader className="flex-grow">
                                <CardTitle className="truncate">{offer.title}</CardTitle>
                            </CardHeader>
                            {offer.contact_number && (
                                <CardFooter className="flex-col items-start gap-2 border-t pt-4">
                                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4" />
                                        <span>للتواصل: <span className="font-mono">{offer.contact_number}</span></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Eye className="h-3 w-3" />
                                        <span>{offer.views || 0} مشاهدة</span>
                                    </div>
                                </CardFooter>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <BadgePercent className="h-16 w-16 mx-auto mb-4" />
                    <p>لا توجد عروض متاحة حاليًا. يرجى التحقق مرة أخرى قريبًا!</p>
                </div>
            )}
        </div>
    );
}
