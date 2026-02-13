"use client";

import { useCallback, useState, useEffect } from "react";
import { motion } from "motion/react";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css/effect-coverflow";
import "swiper/css";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CivilizationId } from "@/app/lib/game-state";
import { CIVILIZATION_PICKER_IMAGE_PATHS } from "@/app/lib/game-state";

const CIVILIZATIONS: { id: CivilizationId; label: string; subtitle: string; gradient: string }[] = [
  { id: "rome", label: "Ancient Rome", subtitle: "Senate, legions & empire", gradient: "linear-gradient(135deg, #8b4513 0%, #cd853f 50%, #daa520 100%)" },
  { id: "india", label: "Ancient India", subtitle: "Dynasties, trade & temples", gradient: "linear-gradient(135deg, #2e7d32 0%, #66bb6a 50%, #ffb74d 100%)" },
  { id: "egypt", label: "Ancient Egypt", subtitle: "Pharaohs, Nile & monuments", gradient: "linear-gradient(135deg, #1565c0 0%, #ffd54f 50%, #bf360c 100%)" },
];

const pickerCss = `
  .civilization-picker-swiper {
    width: 100%;
    height: 380px;
    padding: 20px 0 50px;
    overflow: visible;
  }
  .civilization-picker-swiper .swiper-wrapper {
    overflow: visible;
  }
  .civilization-picker-swiper .swiper-slide {
    background-position: center;
    background-size: cover;
    width: 280px;
    border-radius: 16px;
    overflow: visible;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .civilization-picker-swiper .swiper-slide-active {
    box-shadow: 0 12px 48px rgba(0,0,0,0.5);
  }
  @media (max-width: 767px) {
    .civilization-picker-swiper {
      height: 300px;
      padding: 16px 0 40px;
    }
    .civilization-picker-slide-image {
      flex: 1 1 auto;
      min-height: 0;
      aspect-ratio: 4 / 3;
    }
  }
`;

const resultCardButtonClass =
  "bg-white/[0.07] border border-white/[0.1] text-white/80 text-[14px] hover:bg-white/[0.12] hover:border-white/[0.15] hover:text-white active:scale-[0.98]";

type CivilizationPickerProps = {
  open?: boolean;
  onClose?: () => void;
  onSelect: (civilization: CivilizationId) => void;
  /** Inline: render carousel on page; modal: overlay. When inline, open/onClose are ignored. */
  variant?: "modal" | "inline";
  /** For inline: report selected civilization when slide changes */
  onSelectionChange?: (civilization: CivilizationId) => void;
  /** For inline: initial/controlled selection */
  selectedCivilization?: CivilizationId;
};

export function CivilizationPicker({
  open = true,
  onClose,
  onSelect,
  variant = "modal",
  onSelectionChange,
  selectedCivilization,
}: CivilizationPickerProps) {
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    if (selectedCivilization) {
      const i = CIVILIZATIONS.findIndex((c) => c.id === selectedCivilization);
      return i >= 0 ? i : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (selectedCivilization == null) return;
    const i = CIVILIZATIONS.findIndex((c) => c.id === selectedCivilization);
    if (i >= 0 && i !== activeIndex && swiper) swiper.slideTo(i);
  }, [selectedCivilization, swiper]);

  const handleSlideChange = useCallback(
    (s: SwiperType) => {
      const i = s.realIndex;
      setActiveIndex(i);
      const civ = CIVILIZATIONS[i];
      if (civ) onSelectionChange?.(civ.id);
    },
    [onSelectionChange]
  );

  const handleChoose = useCallback(() => {
    const civ = CIVILIZATIONS[activeIndex];
    if (civ) onSelect(civ.id);
  }, [activeIndex, onSelect]);

  const activeCiv = CIVILIZATIONS[activeIndex];

  const carouselBlock = (
    <>
      <style>{pickerCss}</style>
      <h2 className="text-center text-xl font-medium text-white/90 mb-2">
        Choose your civilization
      </h2>
      <p className="text-center text-white/50 text-sm mb-6">
        Swipe or use arrows to pick
        {variant === "modal" ? ", then tap Choose" : ", then tap New Game below"}
      </p>

      <div className="relative overflow-visible px-4 sm:px-8">
        <Swiper
          initialSlide={
            selectedCivilization
              ? Math.max(0, CIVILIZATIONS.findIndex((c) => c.id === selectedCivilization))
              : 0
          }
          onSwiper={setSwiper}
          onSlideChange={handleSlideChange}
          effect="coverflow"
          grabCursor
          slidesPerView="auto"
          centeredSlides
          loop={false}
          coverflowEffect={{
            rotate: 25,
            stretch: 0,
            depth: 80,
            modifier: 1,
            slideShadows: true,
          }}
          className="civilization-picker-swiper"
          modules={[EffectCoverflow]}
        >
          {CIVILIZATIONS.map((civ) => {
            const paths = CIVILIZATION_PICKER_IMAGE_PATHS[civ.id];
            return (
              <SwiperSlide key={civ.id}>
                <div className="flex flex-col w-full h-full">
                  <div
                    className={cn(
                      "civilization-picker-slide-image w-full flex-1 min-h-[240px] rounded-2xl relative overflow-hidden"
                    )}
                    style={{ background: civ.gradient }}
                  >
                    <img
                      src={paths.png}
                      alt={civ.label}
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.src.endsWith(".jpg")) el.style.display = "none";
                        else el.src = paths.jpg;
                      }}
                    />
                  </div>
                  <div className="pt-3 text-center shrink-0">
                    <p className="font-semibold text-lg text-white/95">{civ.label}</p>
                    <p className="text-white/60 text-sm mt-1">{civ.subtitle}</p>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        <div className="flex justify-center items-center gap-3 mt-6">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => swiper?.slidePrev()}
            className={cn("rounded-full p-2 h-9 w-9", resultCardButtonClass)}
            aria-label="Previous"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          {variant === "modal" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChoose}
              className={cn("min-w-[140px]", resultCardButtonClass)}
            >
              Choose {activeCiv?.label}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => swiper?.slideNext()}
            className={cn("rounded-full p-2 h-9 w-9", resultCardButtonClass)}
            aria-label="Next"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  );

  if (variant === "inline") {
    return <div className="w-full max-w-4xl px-4">{carouselBlock}</div>;
  }

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {carouselBlock}
        <p className="text-center mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white/70 text-sm underline"
          >
            Cancel
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}
