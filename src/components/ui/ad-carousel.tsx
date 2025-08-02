
"use client";

import * as React from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from './skeleton';

export default function AdCarousel() {
    const { advertisements, loading } = useAuth();
    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    );

    if (loading) {
        return <Skeleton className="w-full h-28 rounded-lg" />;
    }

    if (!advertisements || advertisements.length === 0) {
        return null; // Don't render anything if there are no ads
    }

    return (
        <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
              loop: true,
              direction: 'rtl',
            }}
        >
            <CarouselContent>
                {advertisements.map((ad) => (
                    <CarouselItem key={ad.id}>
                        <Card className="overflow-hidden">
                            <CardContent className="p-0 flex items-center justify-center aspect-video sm:aspect-[4/1] relative">
                                <Image
                                    src={ad.imageUrl}
                                    alt={ad.title}
                                    layout="fill"
                                    objectFit="cover"
                                    priority
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-end p-4">
                                    <h3 className="text-white text-lg font-bold">{ad.title}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
            {advertisements.length > 1 && (
              <>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
              </>
            )}
        </Carousel>
    );
}
