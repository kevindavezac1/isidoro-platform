import { formatARS } from '@/lib/utils'
import type { PromoSlide } from '@/lib/types'

interface PromoCarouselProps {
  slides: PromoSlide[]
}

function ImagePlaceholder() {
  return (
    <div
      className="flex items-center justify-center bg-surface-alt"
      style={{ height: 120 }}
    >
      <svg
        width="32"
        height="32"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        className="text-border"
        aria-hidden="true"
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
      className="border-b border-border"
      style={{ background: 'var(--brand-light)' }}
    >
      <div
        className="flex gap-3 px-4 py-3 overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'],
          msOverflowStyle: 'none' as React.CSSProperties['msOverflowStyle'],
        }}
      >
        {slides.map((slide) => (
          <article
            key={slide.id}
            className="shrink-0 rounded-xl overflow-hidden border border-border"
            style={{
              scrollSnapAlign: 'start',
              width: '72vw',
              maxWidth: 260,
              background: 'var(--surface)',
            }}
          >
            <ImagePlaceholder />
            <div className="p-3">
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold mb-2"
                style={{ background: 'var(--brand)', color: 'var(--background)' }}
              >
                {slide.badge}
              </span>
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--foreground)' }}>
                {slide.title}
              </p>
              {slide.description && (
                <p className="mt-0.5 text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {slide.description}
                </p>
              )}
              {slide.price != null && (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>
                    {formatARS(slide.price)}
                  </span>
                  {slide.originalPrice != null && (
                    <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
                      {formatARS(slide.originalPrice)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
