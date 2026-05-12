import Image from "next/image";

type Brand = { name: string; src: string };

const BRANDS: Brand[] = [
  { name: "NVIDIA",   src: "/brands/nvidia.svg" },
  { name: "AMD",      src: "/brands/amd.svg" },
  { name: "Intel",    src: "/brands/intel.svg" },
  { name: "ASUS",     src: "/brands/asus.svg" },
  { name: "MSI",      src: "/brands/msibusiness.svg" },
  { name: "Corsair",  src: "/brands/corsair.svg" },
  { name: "Razer",    src: "/brands/razer.svg" },
  { name: "Samsung",  src: "/brands/samsung.svg" },
  { name: "Kingston", src: "/brands/kingstontechnology.svg" },
  { name: "HP",       src: "/brands/hp.svg" },
  { name: "Dell",     src: "/brands/dell.svg" },
  { name: "Lenovo",   src: "/brands/lenovo.svg" },
  { name: "Acer",     src: "/brands/acer.svg" },
  { name: "Cooler Master", src: "/brands/coolermaster.svg" },
  { name: "Seagate",  src: "/brands/seagate.svg" },
  { name: "HyperX",   src: "/brands/hyperx.svg" },
  { name: "TP-Link",  src: "/brands/tplink.svg" },
];

export function BrandMarquee({ heading }: { heading: string }) {
  // Duplicate the brand array so the loop is seamless when translated -50%
  const loop = [...BRANDS, ...BRANDS];

  return (
    <section className="relative z-20 -mt-32 md:-mt-36 mb-4 md:mb-6 pointer-events-none">
      <div className="container-zed pointer-events-auto">
        <div className="flex items-center justify-center gap-3 mb-5 md:mb-6">
          <span className="h-px w-10 bg-white/30" />
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {heading}
          </span>
          <span className="h-px w-10 bg-white/30" />
        </div>

        <div className="marquee-mask group relative overflow-hidden py-2" dir="ltr">
          <div className="animate-marquee flex w-max items-center gap-12 md:gap-16">
            {loop.map((brand, i) => (
              <div
                key={`${brand.name}-${i}`}
                className="relative flex h-10 w-[110px] md:h-12 md:w-[140px] shrink-0 items-center justify-center opacity-95 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
                title={brand.name}
              >
                <Image
                  src={brand.src}
                  alt={brand.name}
                  fill
                  sizes="140px"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
