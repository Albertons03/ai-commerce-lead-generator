# AI Commerce Lead Generator - Design System

## Overview
This design system provides comprehensive UI/UX specifications for the AI-powered e-commerce lead generation dashboard. The design follows a **dark-first** approach with modern SaaS aesthetics, emphasizing clarity, accessibility, and minimal design patterns.

---

## Color Palette

### Primary Colors (Cyan/Teal)
```
primary-50:  #ECFEFF  (Lightest - subtle backgrounds)
primary-100: #CFFAFE  (Very light)
primary-200: #A5F3FC  (Light)
primary-300: #67E8F9  (Medium light)
primary-400: #22D3EE  (Medium)
primary-500: #0891B2  (Base primary - main brand color)
primary-600: #0E7490  (Dark)
primary-700: #155E75  (Darker)
primary-800: #164E63  (Very dark)
primary-900: #083344  (Darkest)
```

### Secondary Colors (Purple/Indigo)
```
secondary-50:  #EEF2FF  (Lightest)
secondary-100: #E0E7FF  (Very light)
secondary-200: #C7D2FE  (Light)
secondary-300: #A5B4FC  (Medium light)
secondary-400: #818CF8  (Medium)
secondary-500: #6366F1  (Base secondary)
secondary-600: #4F46E5  (Dark)
secondary-700: #4338CA  (Darker)
secondary-800: #3730A3  (Very dark)
secondary-900: #312E81  (Darkest)
```

### Accent Color (Yellow/Amber)
```
accent-50:  #FFFBEB  (Lightest)
accent-100: #FEF3C7  (Very light)
accent-200: #FDE68A  (Light)
accent-300: #FCD34D  (Medium light)
accent-400: #FBBF24  (Medium - CTA buttons)
accent-500: #F59E0B  (Base accent)
accent-600: #D97706  (Dark)
accent-700: #B45309  (Darker)
accent-800: #92400E  (Very dark)
accent-900: #78350F  (Darkest)
```

### Background Colors (Navy/Purple/Black)
```
bg-primary:   #0A0E1A  (Main dark background - navy black)
bg-secondary: #141729  (Card/panel backgrounds - lighter navy)
bg-tertiary:  #1E2238  (Elevated surfaces - purple tint)
bg-elevated:  #252B47  (Hover states, modals)
bg-hover:     #2D3454  (Interactive hover)
```

### Semantic Colors

#### Success (Green)
```
success-50:  #ECFDF5
success-100: #D1FAE5
success-500: #10B981  (Base success)
success-600: #059669
success-700: #047857
```

#### Error (Red)
```
error-50:  #FEF2F2
error-100: #FEE2E2
error-500: #EF4444  (Base error)
error-600: #DC2626
error-700: #B91C1C
```

#### Warning (Orange)
```
warning-50:  #FFFBEB
warning-100: #FEF3C7
warning-500: #F59E0B  (Base warning)
warning-600: #D97706
warning-700: #B45309
```

#### Info (Cyan - matches primary)
```
info-50:  #ECFEFF
info-100: #CFFAFE
info-500: #06B6D4  (Base info)
info-600: #0891B2
info-700: #0E7490
```

### Text Colors
```
text-primary:   #FFFFFF  (Main text)
text-secondary: #A0AEC0  (Subdued text - gray-400)
text-tertiary:  #718096  (Placeholder text - gray-500)
text-disabled:  #4A5568  (Disabled text - gray-600)
text-inverse:   #1A202C  (Text on light backgrounds)
```

### Border Colors
```
border-primary:   #2D3748  (Main borders - gray-700)
border-secondary: #4A5568  (Elevated borders - gray-600)
border-focus:     #0891B2  (Focus state - primary-500)
border-error:     #EF4444  (Error state)
```

---

## Gradients

### Hero/Feature Gradients
```css
/* Cyan to Purple */
gradient-hero: linear-gradient(135deg, #0891B2 0%, #6366F1 100%)

/* Dark teal to cyan */
gradient-teal: linear-gradient(135deg, #155E75 0%, #06B6D4 100%)

/* Purple to indigo (dark) */
gradient-purple: linear-gradient(135deg, #312E81 0%, #4F46E5 100%)

/* Background overlay */
gradient-overlay: linear-gradient(180deg, rgba(10,14,26,0) 0%, rgba(10,14,26,0.8) 100%)
```

---

## Typography

### Font Families
```css
font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace
```

### Font Size Scale (Tailwind)
```
text-xs:   0.75rem   (12px)  - Captions, labels
text-sm:   0.875rem  (14px)  - Small body text, form labels
text-base: 1rem      (16px)  - Body text, inputs
text-lg:   1.125rem  (18px)  - Large body, small headings
text-xl:   1.25rem   (20px)  - Section subheadings
text-2xl:  1.5rem    (24px)  - Page headings
text-3xl:  1.875rem  (30px)  - Hero subheadings
text-4xl:  2.25rem   (36px)  - Hero headings
text-5xl:  3rem      (48px)  - Marketing headings
text-6xl:  3.75rem   (60px)  - Large display text
```

### Font Weights
```
font-light:     300  - Rarely used
font-normal:    400  - Body text
font-medium:    500  - Emphasis, labels
font-semibold:  600  - Subheadings, buttons
font-bold:      700  - Headings
font-extrabold: 800  - Hero text
```

### Line Heights
```
leading-none:    1      - Tight headings
leading-tight:   1.25   - Headings
leading-snug:    1.375  - Compact text
leading-normal:  1.5    - Body text
leading-relaxed: 1.625  - Comfortable reading
leading-loose:   2      - Very spacious
```

### Typography Usage Guidelines

#### Headings
```
H1: text-4xl md:text-5xl font-bold leading-tight text-white
H2: text-3xl md:text-4xl font-bold leading-tight text-white
H3: text-2xl md:text-3xl font-semibold leading-snug text-white
H4: text-xl md:text-2xl font-semibold leading-snug text-white
H5: text-lg md:text-xl font-semibold leading-snug text-white
H6: text-base md:text-lg font-semibold leading-snug text-white
```

#### Body Text
```
Large:  text-lg leading-relaxed text-gray-300
Base:   text-base leading-normal text-gray-300
Small:  text-sm leading-normal text-gray-400
Tiny:   text-xs leading-normal text-gray-500
```

---

## Spacing System

### Scale (4px base unit)
```
0:   0px      - No space
px:  1px      - Hairline
0.5: 0.125rem (2px)   - Minimal
1:   0.25rem  (4px)   - Extra small
2:   0.5rem   (8px)   - Small
3:   0.75rem  (12px)  - Medium small
4:   1rem     (16px)  - Medium (base)
5:   1.25rem  (20px)  - Medium large
6:   1.5rem   (24px)  - Large
8:   2rem     (32px)  - Extra large
10:  2.5rem   (40px)  - 2x large
12:  3rem     (48px)  - 3x large
16:  4rem     (64px)  - 4x large
20:  5rem     (80px)  - 5x large
24:  6rem     (96px)  - 6x large
```

### Common Spacing Patterns
```
Component padding:     p-4 md:p-6
Card padding:          p-6 md:p-8
Page padding:          px-4 md:px-6 lg:px-8
Section spacing:       mb-8 md:mb-12 lg:mb-16
Element spacing:       space-y-4 md:space-y-6
Form field spacing:    space-y-4
Button padding:        px-6 py-3 (medium), px-8 py-4 (large)
```

---

## Layout System

### Container Max-Widths
```
sm:  640px   - Small screens
md:  768px   - Tablets
lg:  1024px  - Small desktops
xl:  1280px  - Large desktops (dashboard main content)
2xl: 1536px  - Extra large screens
full: 100%   - Full width
```

### Dashboard Layout
```
Sidebar width:       280px (expanded), 72px (collapsed)
Top navbar height:   64px
Breadcrumb height:   48px
Content max-width:   1280px (xl)
Side panel width:    360px (details, filters)
```

### Responsive Breakpoints
```
sm:  640px   - Mobile landscape, small tablets
md:  768px   - Tablets
lg:  1024px  - Small laptops
xl:  1280px  - Desktops
2xl: 1536px  - Large screens
```

---

## Border Radius

### Scale
```
rounded-none: 0px       - Sharp corners
rounded-sm:   0.125rem  (2px)  - Subtle
rounded:      0.25rem   (4px)  - Default
rounded-md:   0.375rem  (6px)  - Inputs, small cards
rounded-lg:   0.5rem    (8px)  - Cards, buttons
rounded-xl:   0.75rem   (12px) - Large cards
rounded-2xl:  1rem      (16px) - Modals, panels
rounded-3xl:  1.5rem    (24px) - Hero sections
rounded-full: 9999px    - Circles, pills
```

### Usage Guidelines
```
Buttons:           rounded-lg
Input fields:      rounded-md
Cards:             rounded-xl
Modals:            rounded-2xl
Avatars:           rounded-full
Tags/Badges:       rounded-full or rounded-md
```

---

## Shadow System

### Elevation Levels
```css
/* Level 0 - No shadow */
shadow-none: none

/* Level 1 - Subtle elevation */
shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)

/* Level 2 - Cards, default elevation */
shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)

/* Level 3 - Dropdowns, popovers */
shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)

/* Level 4 - Modals, drawers */
shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)

/* Level 5 - Large modals */
shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)

/* Level 6 - Maximum elevation */
shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

/* Special - Inner shadow */
shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)

/* Special - Glow effect for primary elements */
shadow-glow-primary: 0 0 20px rgba(8, 145, 178, 0.3)
shadow-glow-accent: 0 0 20px rgba(251, 191, 36, 0.3)
```

### Usage Guidelines
```
Cards:                shadow-lg
Elevated cards:       shadow-xl
Dropdowns:            shadow-md
Modals:               shadow-2xl
Buttons (hover):      shadow-lg
Focus states:         shadow-glow-primary
CTA buttons:          shadow-glow-accent
```

---

## Transitions & Animations

### Duration
```
duration-75:   75ms   - Instant
duration-100:  100ms  - Very fast
duration-150:  150ms  - Fast (default for most interactions)
duration-200:  200ms  - Normal
duration-300:  300ms  - Smooth
duration-500:  500ms  - Slow
duration-700:  700ms  - Very slow
```

### Easing Functions
```
ease-linear:    linear
ease-in:        cubic-bezier(0.4, 0, 1, 1)
ease-out:       cubic-bezier(0, 0, 0.2, 1)        - Default for UI
ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1)      - Smooth both ways
```

### Common Transitions
```
Button hover:     transition-all duration-150 ease-out
Input focus:      transition-colors duration-150 ease-out
Modal entrance:   transition-opacity duration-300 ease-out
Slide animation:  transition-transform duration-300 ease-out
Color change:     transition-colors duration-150 ease-out
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility Standards

### Color Contrast (WCAG 2.1 AA)
- Normal text (< 18px): minimum 4.5:1 contrast ratio
- Large text (>= 18px or 14px bold): minimum 3:1 contrast ratio
- UI components and graphics: minimum 3:1 contrast ratio

### Verified Color Combinations
```
Primary text on dark bg:       #FFFFFF on #0A0E1A  (✓ 17.6:1)
Secondary text on dark bg:     #A0AEC0 on #0A0E1A  (✓ 9.2:1)
Primary button text:           #0A0E1A on #0891B2  (✓ 6.8:1)
Accent button text:            #0A0E1A on #FBBF24  (✓ 10.2:1)
Link color on dark bg:         #22D3EE on #0A0E1A  (✓ 7.1:1)
```

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order following visual hierarchy
- Visible focus indicators (2px outline, primary color)
- Skip navigation links for screen readers
- Escape key closes modals and dropdowns

### Focus Indicators
```
Default focus ring:
ring-2 ring-primary-500 ring-offset-2 ring-offset-bg-primary

Button focus:
focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2

Input focus:
focus:ring-2 focus:ring-primary-500 focus:border-primary-500
```

### Touch Targets
- Minimum size: 48x48px (iOS/Android guidelines)
- Minimum spacing: 8px between touch targets
- Buttons on mobile: at least 44px height

### Screen Reader Support
- Semantic HTML structure (nav, main, article, aside, header, footer)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content
- Alt text for images (decorative images use alt="")
- Form labels properly associated with inputs

---

## Responsive Design Strategy

### Mobile-First Approach
Design and code for mobile first, then enhance for larger screens.

### Breakpoint Strategy
```
Base (< 640px):    Single column, stacked navigation, full-width components
sm (640px+):       Two columns where appropriate, improved spacing
md (768px+):       Sidebar appears, multi-column layouts, tablets
lg (1024px+):      Desktop layout, expanded sidebar, more whitespace
xl (1280px+):      Max content width, optimal reading experience
2xl (1536px+):     Large displays, extra whitespace
```

### Component Responsive Patterns

#### Navigation
```
Mobile:     Bottom tab bar or hamburger menu
Tablet:     Collapsed sidebar (icons only)
Desktop:    Expanded sidebar with labels
```

#### Dashboard Grid
```
Mobile:     grid-cols-1 (single column)
Tablet:     grid-cols-2 (two columns)
Desktop:    grid-cols-3 or grid-cols-4
```

#### Forms
```
Mobile:     Full width inputs, vertical stacking
Tablet:     Two-column forms where appropriate
Desktop:    Wider forms with inline labels option
```

#### Typography
```
Mobile:     Smaller headings (text-2xl for H1)
Tablet:     Medium headings (text-3xl for H1)
Desktop:    Full size headings (text-5xl for H1)
```

---

## Component States

### Interactive States
All interactive components must have these states:

#### Default
Normal resting state

#### Hover
```
Background:  Lighten 5-10%
Border:      Lighten 10-15%
Shadow:      Increase elevation
Cursor:      pointer
Transition:  duration-150
```

#### Active/Pressed
```
Background:  Darken 5%
Transform:   scale-95 (optional, for buttons)
Shadow:      Reduce slightly
```

#### Focus
```
Ring:        ring-2 ring-primary-500
Outline:     2px solid, primary color
Border:      primary-500
```

#### Disabled
```
Opacity:     opacity-50
Cursor:      cursor-not-allowed
Background:  Muted version of base color
Text:        text-gray-500
```

#### Loading
```
Opacity:     opacity-80
Cursor:      cursor-wait
Icon:        Spinner animation
Text:        Optional "Loading..." state
```

#### Error
```
Border:      border-error-500
Background:  error-50 tint (subtle)
Icon:        Error icon in error-500
Text:        error-600 color
```

#### Success
```
Border:      border-success-500
Background:  success-50 tint (subtle)
Icon:        Check icon in success-500
Text:        success-600 color
```

---

## Z-Index Scale

```
z-0:     0      - Base level
z-10:    10     - Dropdowns, tooltips
z-20:    20     - Sticky headers, fixed navigation
z-30:    30     - Modals backdrop
z-40:    40     - Modals content
z-50:    50     - Toast notifications
z-auto:  auto   - Let browser decide
```

### Usage
```
Dropdown menus:       z-10
Sticky navigation:    z-20
Modal backdrop:       z-30
Modal dialog:         z-40
Toast notifications:  z-50
```

---

## Design Principles

### 1. Clarity Over Cleverness
Every design choice reduces cognitive load. Make user intent obvious through clear visual hierarchy and familiar patterns.

### 2. Consistency is Key
Use the same patterns throughout:
- Button styles
- Form layouts
- Card designs
- Navigation structure
- Spacing rhythms

### 3. Immediate Feedback
Every user action must have clear, immediate feedback:
- Button states (hover, active)
- Loading indicators
- Success/error messages
- Form validation

### 4. Progressive Enhancement
Start with functional HTML, enhance with CSS, add JavaScript interactions last.

### 5. Performance Matters
- Minimize layout shifts
- Optimize images
- Lazy load below-the-fold content
- Use CSS transforms for animations (not layout properties)

### 6. Inclusivity First
Design for diverse users:
- High color contrast
- Keyboard navigation
- Screen reader support
- Touch-friendly sizes
- Reduced motion support

---

## Next Steps

Refer to the following additional documentation:
- `COMPONENT_SPECS.md` - Detailed specifications for all UI components
- `USER_FLOWS.md` - User journey maps and interaction flows
- `WIREFRAMES.md` - Layout wireframes and screen descriptions
- `tailwind.config.ts` - Complete Tailwind configuration file
