/**
 * Unit tests for Responsive Layout Utilities (TASK-016)
 */

import {
  getResponsiveGrid,
  getPageContainer,
  getResponsiveFlex,
  buildResponsiveGrid,
  getResponsiveSpacing,
  getResponsiveVisibility,
  getLayoutComposition,
  RESPONSIVE_GRIDS,
  RESPONSIVE_GAPS,
  PAGE_CONTAINERS,
  RESPONSIVE_FLEX,
  RESPONSIVE_SPACING,
  RESPONSIVE_VISIBILITY,
  LAYOUT_COMPOSITIONS,
} from '../layout'

describe('Responsive Layout Utilities', () => {
  describe('RESPONSIVE_GRIDS', () => {
    it('should define all grid patterns', () => {
      expect(RESPONSIVE_GRIDS['1-2-3']).toBe('grid-cols-1 md:grid-cols-2 lg:grid-cols-3')
      expect(RESPONSIVE_GRIDS['1-2-4']).toBe('grid-cols-1 md:grid-cols-2 lg:grid-cols-4')
      expect(RESPONSIVE_GRIDS['1-3-3']).toBe('grid-cols-1 sm:grid-cols-3')
      expect(RESPONSIVE_GRIDS['2-4-4']).toBe('grid-cols-2 sm:grid-cols-4')
      expect(RESPONSIVE_GRIDS['1-1-1']).toBe('grid-cols-1')
      expect(RESPONSIVE_GRIDS['2-3-4']).toBe('grid-cols-2 md:grid-cols-3 lg:grid-cols-4')
    })
  })

  describe('RESPONSIVE_GAPS', () => {
    it('should define all gap sizes', () => {
      expect(RESPONSIVE_GAPS.sm).toBe('gap-3 md:gap-4 lg:gap-6')
      expect(RESPONSIVE_GAPS.md).toBe('gap-4 md:gap-6 lg:gap-8')
      expect(RESPONSIVE_GAPS.lg).toBe('gap-6 md:gap-8 lg:gap-12')
      expect(RESPONSIVE_GAPS.tight).toBe('gap-2 md:gap-3 lg:gap-4')
    })
  })

  describe('PAGE_CONTAINERS', () => {
    it('should define all container variants', () => {
      expect(PAGE_CONTAINERS.standard).toContain('container mx-auto px-4')
      expect(PAGE_CONTAINERS.full).toContain('max-w-full')
      expect(PAGE_CONTAINERS.narrow).toContain('max-w-4xl')
      expect(PAGE_CONTAINERS.wide).toContain('max-w-7xl')
    })
  })

  describe('RESPONSIVE_FLEX', () => {
    it('should define all flex patterns', () => {
      expect(RESPONSIVE_FLEX['col-row']).toBe('flex flex-col md:flex-row')
      expect(RESPONSIVE_FLEX['row-col']).toBe('flex flex-row md:flex-col')
      expect(RESPONSIVE_FLEX.col).toBe('flex flex-col')
      expect(RESPONSIVE_FLEX.row).toBe('flex flex-row')
      expect(RESPONSIVE_FLEX['wrap-nowrap']).toBe('flex flex-wrap lg:flex-nowrap')
    })
  })

  describe('RESPONSIVE_SPACING', () => {
    it('should define all spacing patterns', () => {
      expect(RESPONSIVE_SPACING.section).toBe('space-y-6 md:space-y-8')
      expect(RESPONSIVE_SPACING.sectionTight).toBe('space-y-4 md:space-y-6')
      expect(RESPONSIVE_SPACING.sectionLarge).toBe('space-y-8 md:space-y-12')
      expect(RESPONSIVE_SPACING.pagePadding).toBe('py-6 md:py-8')
      expect(RESPONSIVE_SPACING.sectionMargin).toBe('mb-8 md:mb-12')
    })
  })

  describe('RESPONSIVE_VISIBILITY', () => {
    it('should define all visibility patterns', () => {
      expect(RESPONSIVE_VISIBILITY.mobileOnly).toBe('block md:hidden')
      expect(RESPONSIVE_VISIBILITY.tabletUp).toBe('hidden md:block')
      expect(RESPONSIVE_VISIBILITY.desktopOnly).toBe('hidden lg:block')
      expect(RESPONSIVE_VISIBILITY.hideMobile).toBe('hidden md:block')
      expect(RESPONSIVE_VISIBILITY.hideDesktop).toBe('block lg:hidden')
    })
  })

  describe('getResponsiveGrid()', () => {
    it('should return grid classes with default gap', () => {
      const result = getResponsiveGrid('1-2-3')
      expect(result).toContain('grid')
      expect(result).toContain('grid-cols-1')
      expect(result).toContain('md:grid-cols-2')
      expect(result).toContain('lg:grid-cols-3')
      expect(result).toContain('gap-4') // default md gap
    })

    it('should return grid classes with custom gap', () => {
      const result = getResponsiveGrid('1-2-3', 'sm')
      expect(result).toContain('grid')
      expect(result).toContain('gap-3')
    })

    it('should work with all grid patterns', () => {
      Object.keys(RESPONSIVE_GRIDS).forEach((pattern) => {
        const result = getResponsiveGrid(pattern as keyof typeof RESPONSIVE_GRIDS)
        expect(result).toContain('grid')
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('getPageContainer()', () => {
    it('should return standard container by default', () => {
      const result = getPageContainer()
      expect(result).toContain('container')
      expect(result).toContain('mx-auto')
      expect(result).toContain('px-4')
    })

    it('should return specific container variant', () => {
      const narrow = getPageContainer('narrow')
      expect(narrow).toContain('max-w-4xl')

      const wide = getPageContainer('wide')
      expect(wide).toContain('max-w-7xl')

      const full = getPageContainer('full')
      expect(full).toContain('max-w-full')
    })
  })

  describe('getResponsiveFlex()', () => {
    it('should return flex classes with default gap', () => {
      const result = getResponsiveFlex('col-row')
      expect(result).toContain('flex')
      expect(result).toContain('flex-col')
      expect(result).toContain('md:flex-row')
      expect(result).toContain('gap-4') // default md gap
    })

    it('should return flex classes with custom gap', () => {
      const result = getResponsiveFlex('col-row', 'lg')
      expect(result).toContain('flex')
      expect(result).toContain('gap-6')
    })

    it('should work with all flex patterns', () => {
      Object.keys(RESPONSIVE_FLEX).forEach((pattern) => {
        const result = getResponsiveFlex(pattern as keyof typeof RESPONSIVE_FLEX)
        expect(result).toContain('flex')
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('buildResponsiveGrid()', () => {
    it('should build grid with default options (1-2-3)', () => {
      const result = buildResponsiveGrid()
      expect(result).toContain('grid')
      expect(result).toContain('grid-cols-1')
      expect(result).toContain('md:grid-cols-2')
      expect(result).toContain('lg:grid-cols-3')
      expect(result).toContain('gap-4') // default md gap
    })

    it('should build grid with custom column counts', () => {
      const result = buildResponsiveGrid({
        mobile: 2,
        tablet: 4,
        desktop: 6,
      })
      expect(result).toContain('grid-cols-2')
      expect(result).toContain('md:grid-cols-4')
      expect(result).toContain('lg:grid-cols-6')
    })

    it('should build grid with custom gap', () => {
      const result = buildResponsiveGrid({ gap: 'sm' })
      expect(result).toContain('gap-3')
    })

    it('should merge additional className', () => {
      const result = buildResponsiveGrid({
        className: 'custom-class',
      })
      expect(result).toContain('custom-class')
    })

    it('should not duplicate breakpoints when columns are the same', () => {
      const result = buildResponsiveGrid({
        mobile: 2,
        tablet: 2,
        desktop: 2,
      })
      // Should only have base grid-cols-2, not duplicate md: and lg: classes
      expect(result).toContain('grid-cols-2')
      expect(result).not.toContain('md:grid-cols-2')
      expect(result).not.toContain('lg:grid-cols-2')
    })
  })

  describe('getResponsiveSpacing()', () => {
    it('should return spacing classes', () => {
      expect(getResponsiveSpacing('section')).toBe('space-y-6 md:space-y-8')
      expect(getResponsiveSpacing('sectionTight')).toBe('space-y-4 md:space-y-6')
      expect(getResponsiveSpacing('sectionLarge')).toBe('space-y-8 md:space-y-12')
    })
  })

  describe('getResponsiveVisibility()', () => {
    it('should return visibility classes', () => {
      expect(getResponsiveVisibility('mobileOnly')).toBe('block md:hidden')
      expect(getResponsiveVisibility('tabletUp')).toBe('hidden md:block')
      expect(getResponsiveVisibility('desktopOnly')).toBe('hidden lg:block')
    })
  })

  describe('getLayoutComposition()', () => {
    it('should return composition classes', () => {
      const cardGrid = getLayoutComposition('cardGrid')
      expect(cardGrid).toContain('grid')
      expect(cardGrid).toContain('grid-cols-1')

      const statsGrid = getLayoutComposition('statsGrid')
      expect(statsGrid).toContain('grid')
      expect(statsGrid).toContain('grid-cols-2')

      const dashboardContainer = getLayoutComposition('dashboardContainer')
      expect(dashboardContainer).toContain('container')
    })
  })

  describe('LAYOUT_COMPOSITIONS', () => {
    it('should define common layout compositions', () => {
      expect(LAYOUT_COMPOSITIONS.cardGrid).toBeTruthy()
      expect(LAYOUT_COMPOSITIONS.statsGrid).toBeTruthy()
      expect(LAYOUT_COMPOSITIONS.heroSection).toBeTruthy()
      expect(LAYOUT_COMPOSITIONS.dashboardContainer).toBeTruthy()
      expect(LAYOUT_COMPOSITIONS.dataContainer).toBeTruthy()
    })
  })

  describe('Mobile-first breakpoints', () => {
    it('should use mobile-first approach (base classes without breakpoint prefix)', () => {
      const grid = getResponsiveGrid('1-2-3')
      expect(grid).toContain('grid-cols-1') // mobile (no prefix)
      expect(grid).toContain('md:grid-cols-2') // tablet
      expect(grid).toContain('lg:grid-cols-3') // desktop
    })

    it('should follow 8px grid spacing system', () => {
      // gap-2 = 8px, gap-3 = 12px, gap-4 = 16px, gap-6 = 24px, gap-8 = 32px
      expect(RESPONSIVE_GAPS.tight).toContain('gap-2') // 8px
      expect(RESPONSIVE_GAPS.sm).toContain('gap-3') // 12px
      expect(RESPONSIVE_GAPS.md).toContain('gap-4') // 16px
      expect(RESPONSIVE_GAPS.lg).toContain('gap-6') // 24px
    })
  })

  describe('Type safety', () => {
    it('should accept valid grid patterns', () => {
      expect(() => getResponsiveGrid('1-2-3')).not.toThrow()
      expect(() => getResponsiveGrid('1-2-4')).not.toThrow()
      expect(() => getResponsiveGrid('2-3-4')).not.toThrow()
    })

    it('should accept valid gap sizes', () => {
      expect(() => getResponsiveGrid('1-2-3', 'sm')).not.toThrow()
      expect(() => getResponsiveGrid('1-2-3', 'md')).not.toThrow()
      expect(() => getResponsiveGrid('1-2-3', 'lg')).not.toThrow()
      expect(() => getResponsiveGrid('1-2-3', 'tight')).not.toThrow()
    })

    it('should accept valid container variants', () => {
      expect(() => getPageContainer('standard')).not.toThrow()
      expect(() => getPageContainer('full')).not.toThrow()
      expect(() => getPageContainer('narrow')).not.toThrow()
      expect(() => getPageContainer('wide')).not.toThrow()
    })
  })
})
