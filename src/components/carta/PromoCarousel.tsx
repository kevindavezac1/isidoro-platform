import { formatARS } from '@/lib/utils'
import type { PromoSlide } from '@/lib/types'

interface PromoCarouselProps {
  slides: PromoSlide[]
}

function SlideImagePlaceholder() {
  return (
    <div
      className="flex items-center justify-center w-full"
      style={{ height: 130, background: 'rgba(0,0,0,0.25)' }}
    >
      <svg
        width="36"
        height="36"
        fill="none"
        stroke="#ca9e69"
        strokeWidth={1.2}
        viewBox="0 0 24 24"
        aria-hidden="true"
        opacity={0.4}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  )
}

export function PromoCarousel({ slides }: PromoCarouselProps) {
  if (slides.length === 0) return null

  return (
    <div
      className="flex gap-3 px-4 py-3 overflow-x-auto border-b"
      style={{
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
        scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'],
        msOverflowStyle: 'none' as React.CSSProperties['msOverflowStyle'],
        borderColor: 'var(--border)',
      }}
    >
      {slides.map((slide) => (
        <article
          key={slide.id}
          className="shrink-0 rounded-2xl overflow-hidden flex flex-col"
          style={{
            scrollSnapAlign: 'start',
            width: '80vw',
            maxWidth: 300,
            height: 220,
            background: 'var(--surface)',
          }}
        >
          <SlideImagePlaceholder />

          <div className="flex flex-col justify-between flex-1 px-4 py-3">
            <div>
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold mb-2"
                style={{ background: 'var(--brand)', color: 'var(--background)' }}
              >
                {slide.badge}
              </span>
              <p
                className="text-base font-semibold leading-tight font-display"
                style={{ color: 'var(--brand)' }}
              >
                {slide.title}
              </p>
              {slide.description && (
                <p
                  className="mt-1 text-xs line-clamp-2"
                  style={{ color: 'rgba(245,239,230,0.65)' }}
                >
                  {slide.description}
                </p>
              )}
            </div>

            {slide.price != null && (
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>
                  {formatARS(slide.price)}
                </span>
                {slide.originalPrice != null && (
                  <span
                    className="text-xs line-through"
                    style={{ color: 'rgba(245,239,230,0.45)' }}
                  >
                    {formatARS(slide.originalPrice)}
                  </span>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
