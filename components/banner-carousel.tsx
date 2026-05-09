"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots
} from "@/components/ui/carousel"
import Image from "next/image"

interface Banner {
  id: string
  image_url: string
  image_url_mobile?: string | null
  link_url?: string
}

interface BannerCarouselProps {
  banners: Banner[]
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )

  if (!banners || banners.length === 0) {
    return null
  }

  return (
    <div className="w-full relative group">
      <Carousel
        plugins={[plugin.current]}
        className="w-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="-ml-0">
          {banners.map((banner, index) => {
            const hasMobile = !!banner.image_url_mobile;

            const DesktopImage = (
              <div className={`${hasMobile ? 'hidden md:block' : 'block'} relative w-full h-[200px] md:h-[300px] lg:h-[400px] overflow-hidden`}>
                <Image
                  src={banner.image_url}
                  alt={`Banner ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  priority={index === 0}
                  unoptimized
                />
              </div>
            );

            const MobileImage = hasMobile ? (
              <div className="md:hidden relative w-full aspect-square overflow-hidden">
                <Image
                  src={banner.image_url_mobile!}
                  alt={`Banner ${index + 1} Mobile`}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  priority={index === 0}
                  unoptimized
                />
              </div>
            ) : null;

            return (
              <CarouselItem key={banner.id} className="pl-0">
                {banner.link_url ? (
                  <a 
                    href={banner.link_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full cursor-pointer"
                  >
                    {DesktopImage}
                    {MobileImage}
                  </a>
                ) : (
                  <div className="w-full">
                    {DesktopImage}
                    {MobileImage}
                  </div>
                )}
              </CarouselItem>
            )
          })}
        </CarouselContent>
        {banners.length > 1 && (
          <>
            <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <CarouselPrevious className="left-4 bg-background/50 hover:bg-background/80 border-none text-foreground backdrop-blur-sm" />
              <CarouselNext className="right-4 bg-background/50 hover:bg-background/80 border-none text-foreground backdrop-blur-sm" />
            </div>
            <div className="absolute bottom-4 left-0 right-0">
              <CarouselDots className="mt-0 [&>button]:bg-white/50 [&>button.bg-primary]:bg-white [&>button]:border [&>button]:border-black/10" />
            </div>
          </>
        )}
      </Carousel>
    </div>
  )
}
