# UI Design System

## Design Principles

1. **Professional & Institutional**: Clean, sophisticated design with ample whitespace and a focus on data presentation
2. **Data-Focused**: Prioritize data visualization and key metrics with clear hierarchy
3. **Trustworthy**: Convey security, reliability, and credibility through design elements
4. **Actionable**: Provide clear paths to action and decision-making
5. **Responsive**: Ensure optimal experience across all device sizes
6. **Consistent**: Maintain consistent design language throughout the application
7. **Accessible**: Ensure all components meet WCAG 2.1 AA accessibility standards

## Brand Identity

As a standalone module that will integrate into a larger platform, the simulation engine should:

1. Feel like a premium financial product
2. Emphasize precision and reliability
3. Present data with clarity and sophistication
4. Use design to convey trust and institutional-grade quality

## Color Palette

### Primary Colors
- **Primary Blue**: #0A2463 (Deep Navy Blue) - Used for primary actions, headers, and emphasis
- **Secondary Blue**: #3E92CC (Medium Blue) - Used for secondary elements, highlights, and accents
- **Accent Blue**: #D8E1E9 (Light Blue/Gray) - Used for backgrounds, cards, and subtle highlights

### Secondary Colors
- **Success Green**: #2E7D32 (Forest Green) - Used for positive indicators, success states
- **Warning Amber**: #FF8F00 (Deep Amber) - Used for warnings, alerts that need attention
- **Error Red**: #C62828 (Deep Red) - Used for errors, critical alerts
- **Info Teal**: #00796B (Teal) - Used for informational elements

### Neutral Colors
- **Dark Gray**: #263238 - Used for primary text, high emphasis content
- **Medium Gray**: #546E7A - Used for secondary text, medium emphasis content
- **Light Gray**: #ECEFF1 - Used for disabled states, subtle borders
- **Ultra Light Gray**: #F5F7F9 - Used for backgrounds, containers
- **White**: #FFFFFF - Used for card backgrounds, UI containers, primary background

## Typography

### Font Family
- **Primary Font**: Inter, Sans-Serif - Clean, modern, highly legible
- **Monospace**: Roboto Mono - For code, technical data

### Font Weights
- **Bold (600)**: Used for headings, buttons, emphasis
- **Medium (500)**: Used for subheadings, labels, emphasis within text
- **Regular (400)**: Used for body text, general content
- **Light (300)**: Used sparingly for tertiary information

### Font Sizes
- **H1**: 32px/40px (2rem) - Page titles
- **H2**: 28px/36px (1.75rem) - Section titles
- **H3**: 24px/32px (1.5rem) - Card titles, major sections
- **H4**: 20px/28px (1.25rem) - Subsection titles
- **H5**: 18px/24px (1.125rem) - Card headings, emphasized content
- **H6**: 16px/24px (1rem) - Minor headings
- **Body 1**: 16px/24px (1rem) - Primary body text
- **Body 2**: 14px/20px (0.875rem) - Secondary body text
- **Caption**: 12px/16px (0.75rem) - Labels, captions, metadata
- **Overline**: 10px/16px (0.625rem) - Overline text, very small labels

## Spacing System

Based on a consistent 8px grid system:

- **Tiny**: 4px (0.25rem) - Minimum spacing, icons alignment
- **XSmall**: 8px (0.5rem) - Tight spacing, internal padding
- **Small**: 16px (1rem) - Standard spacing, card padding
- **Medium**: 24px (1.5rem) - Medium spacing, section separation
- **Large**: 32px (2rem) - Large spacing, major section separation
- **XLarge**: 48px (3rem) - Extra large spacing, page section separation
- **XXLarge**: 64px (4rem) - Maximum spacing, major page divisions

## Component Design

### Cards
- Clean, crisp white background
- Subtle shadow (elevation: 1)
- 1px border in very light gray (#EEEEEE)
- Rounded corners (8px border radius)
- Consistent internal padding (16px/24px)
- Clear heading hierarchy
- Optional hover and active states for interactive cards

### Buttons
- **Primary**: Solid navy background (#0A2463), white text
- **Secondary**: Light blue background (#3E92CC), white text
- **Tertiary**: Transparent background, navy text, navy border
- **Danger**: Deep red background (#C62828), white text
- Heights: 48px (large), 40px (medium), 32px (small)
- 8px border radius
- Clear hover, active, and disabled states
- 16px internal padding on sides (minimum)

### Forms and Inputs
- Clear, persistent labels
- 1px border for text fields
- 8px border radius
- 16px internal padding
- Clear focus, hover, and error states
- Inline validation with helpful error messages
- Consistent component heights (40px)

### Navigation
- Light gray background for sidebar
- Clear active and hover states
- Distinct separation between main navigation and sub-navigation
- Icons paired with text for better recognition

### Tables
- Clean, minimal design with subtle row separation
- Clear column headers with sorting indicators
- Subtle hover effect for rows
- Consistent cell padding (16px)
- Pagination controls for large datasets
- Responsive design for smaller screens

### Charts and Data Visualization
- Consistent color scheme for data categories
- Clear labels and annotations
- Grid lines should be subtle but visible
- Interactive elements (tooltips, filters)
- Loading and empty states
- Responsive sizing for different screen sizes

## Iconography

- 24px base size (can scale to 20px or 16px)
- 2px stroke weight for line icons
- Material Icons as the primary icon library
- Icons should be used consistently to represent specific actions/concepts

## Layout Guidelines

### Grid System
- 12-column grid for desktop
- Responsive breakpoints:
  - Mobile: 0-599px
  - Tablet: 600-959px
  - Desktop: 960px+
- Container max-width: 1200px
- Gutters: 24px

### Page Structure
1. **Header** - Contains logo, navigation, user controls
2. **Main Content** - Primary content area with proper margins
3. **Sidebar** (when applicable) - Contextual navigation or filters
4. **Footer** - Secondary links, legal information

## Interactive States

### Hover States
- Subtle background color change
- Cursor change (pointer for clickable elements)
- Transition duration: 0.2s

### Focus States
- Visible focus ring for keyboard navigation (2px, #3E92CC)
- Maintains accessibility standards

### Active States
- Slightly darker than hover state
- Visual feedback for pressed buttons (subtle scale transform)

### Disabled States
- 40% opacity
- Non-interactive cursor

## Animations & Transitions

- Subtle, purposeful animations
- Standard duration: 0.2s - 0.3s
- Easing: ease-in-out
- Avoid animations that block user interaction
- Consider reduced motion preferences

## Landing Page Card Design

For the landing page featuring two cards (Manual Simulation and Automated Simulations):

- Large, prominent cards (min-height: 240px)
- Equal width, side-by-side on desktop
- Stacked on mobile
- Clear visual hierarchy with prominent titles
- Descriptive text explaining each option
- Call-to-action button aligned at the bottom
- Automated simulation card should have a semi-transparent overlay with a "Coming Soon" badge

## Design Inspiration Sources

- Bloomberg Terminal (for data density and professional feel)
- BlackRock Aladdin (for institutional investment platform design)
- JPMorgan Chase dashboards (for bank-grade security and professionalism)
- Goldman Sachs Marquee (for modern institutional finance platform)
- Morningstar Direct (for financial data visualization)

## Implementation Guidelines

- Use Material-UI (MUI) as the component library
- Implement a customized theme based on this design system
- Ensure consistent component usage across the application
- Document component variants and usage guidelines
- Use CSS-in-JS (styled-components or emotion) for component styling
