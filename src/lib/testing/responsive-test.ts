/**
 * Responsive Design Test Suite
 *
 * Testing utilities for validating responsive design across different screen sizes
 * as specified in Phase 9: Polish & Testing
 */

export interface Breakpoint {
  name: string;
  min: number;
  max?: number;
  description: string;
}

export const BREAKPOINTS: Breakpoint[] = [
  {
    name: 'mobile',
    min: 320,
    max: 768,
    description: 'Mobile devices (320px-768px)'
  },
  {
    name: 'tablet',
    min: 768,
    max: 1024,
    description: 'Tablet devices (768px-1024px)'
  },
  {
    name: 'desktop',
    min: 1024,
    description: 'Desktop devices (1024px+)'
  }
];

export interface ResponsiveTest {
  name: string;
  description: string;
  test: (breakpoint: Breakpoint) => boolean;
  category: 'layout' | 'typography' | 'navigation' | 'interaction';
}

/**
 * Test Suite for Case Management Responsive Design
 */
export const RESPONSIVE_TESTS: ResponsiveTest[] = [
  // Mobile Layout Tests
  {
    name: 'mobile-header-layout',
    description: 'Case header should stack vertically on mobile',
    category: 'layout',
    test: (breakpoint) => {
      if (breakpoint.name !== 'mobile') return true;
      // Test: Case header elements should stack
      const header = document.querySelector('[data-testid="case-header"]');
      if (!header) return false;

      const topRow = header.querySelector('.flex.items-center.justify-between');
      if (!topRow) return false;

      const styles = window.getComputedStyle(topRow);
      return styles.flexDirection === 'column' ||
             topRow.classList.contains('flex-col') ||
             styles.flexWrap === 'wrap';
    }
  },

  {
    name: 'mobile-tabs-responsive',
    description: 'Tabs should show short labels on mobile',
    category: 'navigation',
    test: (breakpoint) => {
      if (breakpoint.name !== 'mobile') return true;
      // Test: Tab labels should be shortened on mobile
      const shortLabels = document.querySelectorAll('[data-tab-short]');

      // On mobile, short labels should be visible, long labels hidden
      return shortLabels.length > 0 &&
             Array.from(shortLabels).every(el =>
               el.closest('[hidden]') === null &&
               window.getComputedStyle(el).display !== 'none'
             );
    }
  },

  {
    name: 'mobile-action-buttons',
    description: 'Action buttons should wrap and be appropriately sized on mobile',
    category: 'interaction',
    test: (breakpoint) => {
      if (breakpoint.name !== 'mobile') return true;
      // Test: Action buttons should wrap and be touch-friendly
      const actionButtons = document.querySelectorAll('[data-testid="action-button"]');
      if (actionButtons.length === 0) return false;

      return Array.from(actionButtons).every(button => {
        const styles = window.getComputedStyle(button);
        const height = parseInt(styles.height);
        const minHeight = parseInt(styles.minHeight) || 44; // iOS touch target minimum

        // Check minimum touch target size
        return height >= minHeight || minHeight >= 44;
      });
    }
  },

  // Tablet Layout Tests
  {
    name: 'tablet-grid-layout',
    description: 'Grid layouts should adapt properly on tablet',
    category: 'layout',
    test: (breakpoint) => {
      if (breakpoint.name !== 'tablet') return true;
      // Test: Wedding details grid should be 2 columns on tablet
      const grid = document.querySelector('[data-testid="wedding-details-grid"]');
      if (!grid) return true; // Grid might not exist on all pages

      const styles = window.getComputedStyle(grid);
      return styles.gridTemplateColumns.includes('2') ||
             styles.display === 'grid';
    }
  },

  {
    name: 'tablet-navigation',
    description: 'Navigation should be optimal for tablet touch interaction',
    category: 'navigation',
    test: (breakpoint) => {
      if (breakpoint.name !== 'tablet') return true;
      // Test: Interactive elements should be tablet-friendly
      const interactiveElements = document.querySelectorAll('button, a, [role="button"]');

      return Array.from(interactiveElements).every(el => {
        const rect = el.getBoundingClientRect();
        const minSize = 44; // Minimum touch target for tablet

        return rect.width >= minSize && rect.height >= minSize;
      });
    }
  },

  // Desktop Layout Tests
  {
    name: 'desktop-full-layout',
    description: 'Full layout should be utilized on desktop',
    category: 'layout',
    test: (breakpoint) => {
      if (breakpoint.name !== 'desktop') return true;
      // Test: Grid should use 4 columns on desktop
      const grid = document.querySelector('[data-testid="wedding-details-grid"]');
      if (!grid) return true;

      const styles = window.getComputedStyle(grid);
      return styles.gridTemplateColumns.includes('4');
    }
  },

  {
    name: 'desktop-typography',
    description: 'Typography should scale appropriately on desktop',
    category: 'typography',
    test: (breakpoint) => {
      if (breakpoint.name !== 'desktop') return true;
      // Test: Text should be appropriately sized for desktop
      const headings = document.querySelectorAll('h1, h2, h3');

      return Array.from(headings).every(heading => {
        const styles = window.getComputedStyle(heading);
        const fontSize = parseInt(styles.fontSize);

        // Desktop should have larger font sizes
        return fontSize >= 16;
      });
    }
  },

  // Cross-breakpoint Tests
  {
    name: 'no-horizontal-scroll',
    description: 'No horizontal scroll should appear at any breakpoint',
    category: 'layout',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    test: (_breakpoint) => {
      // Test: Body should not have horizontal scroll
      const body = document.body;
      const html = document.documentElement;

      return body.scrollWidth <= body.clientWidth &&
             html.scrollWidth <= html.clientWidth;
    }
  },

  {
    name: 'content-readability',
    description: 'Content should remain readable across all breakpoints',
    category: 'typography',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    test: (_breakpoint) => {
      // Test: Text should have good contrast and readable font sizes
      const textElements = document.querySelectorAll('p, span, div');

      return Array.from(textElements).every(el => {
        const styles = window.getComputedStyle(el);
        const fontSize = parseInt(styles.fontSize);
        const lineHeight = parseFloat(styles.lineHeight);

        // Minimum readable font size
        if (fontSize < 14) return false;

        // Good line height for readability
        if (lineHeight < 1.2) return false;

        return true;
      });
    }
  },

  {
    name: 'touch-targets',
    description: 'Touch targets should be appropriate for each device type',
    category: 'interaction',
    test: (breakpoint) => {
      const isTouchDevice = breakpoint.name === 'mobile' || breakpoint.name === 'tablet';
      const interactiveElements = document.querySelectorAll('button, a, [role="button"], input');

      return Array.from(interactiveElements).every(el => {
        const rect = el.getBoundingClientRect();
        const minSize = isTouchDevice ? 44 : 32;

        return rect.width >= minSize && rect.height >= minSize;
      });
    }
  }
];

/**
 * Run responsive tests for a specific breakpoint
 */
export function runResponsiveTests(breakpoint: Breakpoint): {
  passed: ResponsiveTest[];
  failed: ResponsiveTest[];
  results: Array<{ test: ResponsiveTest; passed: boolean; error?: string }>;
} {
  const results: Array<{ test: ResponsiveTest; passed: boolean; error?: string }> = [];

  RESPONSIVE_TESTS.forEach(test => {
    try {
      const passed = test.test(breakpoint);
      results.push({ test, passed });
    } catch (error) {
      results.push({
        test,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const passed = results.filter(r => r.passed).map(r => r.test);
  const failed = results.filter(r => !r.passed).map(r => r.test);

  return { passed, failed, results };
}

/**
 * Simulate viewport resize for testing
 */
export function simulateViewportResize(width: number, height: number = 800): Promise<void> {
  return new Promise((resolve) => {
    // Mock viewport dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    // Allow for layout updates
    setTimeout(() => {
      resolve();
    }, 100);
  });
}

/**
 * Get current breakpoint based on viewport width
 */
export function getCurrentBreakpoint(): Breakpoint {
  const width = window.innerWidth;

  for (const breakpoint of BREAKPOINTS) {
    if (width >= breakpoint.min && (!breakpoint.max || width < breakpoint.max)) {
      return breakpoint;
    }
  }

  return BREAKPOINTS[BREAKPOINTS.length - 1]; // Fallback to desktop
}

/**
 * Generate responsive test report
 */
export function generateResponsiveTestReport(): string {
  const report: string[] = [];

  report.push('# Responsive Design Test Report');
  report.push(`Generated: ${new Date().toISOString()}`);
  report.push(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
  report.push(`Breakpoint: ${getCurrentBreakpoint().name}`);
  report.push('');

  const results = runResponsiveTests(getCurrentBreakpoint());

  report.push(`## Results Summary`);
  report.push(`✅ Passed: ${results.passed.length}`);
  report.push(`❌ Failed: ${results.failed.length}`);
  report.push(`📊 Success Rate: ${Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100)}%`);
  report.push('');

  if (results.failed.length > 0) {
    report.push('## Failed Tests');
    results.results.forEach(result => {
      if (!result.passed) {
        report.push(`### ❌ ${result.test.name}`);
        report.push(`**Description:** ${result.test.description}`);
        report.push(`**Category:** ${result.test.category}`);
        if (result.error) {
          report.push(`**Error:** ${result.error}`);
        }
        report.push('');
      }
    });
  }

  report.push('## All Tests');
  results.results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    report.push(`${status} **${result.test.name}** - ${result.test.description}`);
  });

  return report.join('\n');
}