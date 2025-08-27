
"use client";

import * as React from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgePercent, Eye } from 'lucide-react';
import type { Offer } from '@/lib/types';

export default function OffersPage() {
    const { offers, loading, incrementOfferView } = useAuth();

    // Use an effect to track viewed ads to avoid duplicate calls during the same session
    React.useEffect(() => {
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
    }, [offers, incrementOfferView]);

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
            {offers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {offers.map(offer => (
                        <Card key={offer.id} data-offer-id={offer.id} className="overflow-hidden group">
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
                            <CardHeader>
                                <CardTitle className="truncate">{offer.title}</CardTitle>
                            </CardHeader>
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
