# UI Design System

## Overview

The Seasonal Bunker features a brutalist, lo-fi aesthetic with full light and dark mode support. The design emphasizes bold typography, strong borders, and a paper-like texture that adapts seamlessly between themes.

## Theme System

### Light Mode
- **Background**: `#f5f5f5` (paper texture)
- **Paper/Cards**: `#ffffff` (white)
- **Text**: `#1a1a1a` (ink black)
- **Dim Text**: `#666` (gray)
- **Borders**: `#000` (black)
- **Accent**: `#ff6b35` (orange-red)

### Dark Mode
- **Background**: `#0a0a0a` (deep black)
- **Paper/Cards**: `#1a1a1a` (dark gray)
- **Text**: `#e5e5e5` (off-white)
- **Dim Text**: `#999` (light gray)
- **Borders**: `#444` (medium gray)
- **Accent**: `#ff8c61` (lighter orange)

## Design Principles

### 1. Brutalist Shadows
All interactive elements use "brutal" box shadows that create a 3D paper-like effect:
- **Standard**: `4px 4px 0px 0px` (solid shadow)
- **Large**: `8px 8px 0px 0px` (emphasized shadow)
- Shadows adapt to theme (black in light mode, subtle white in dark mode)

### 2. Typography
- **Primary Font**: Courier Prime (monospace) - for that typewriter aesthetic
- **Secondary Font**: Georgia (serif) - for body text and descriptions
- **Headings**: Bold, uppercase, tight tracking
- **Body**: Relaxed leading, readable sizes

### 3. Interactive Elements

#### Buttons
- Solid background with contrasting text
- Brutal shadow that disappears on hover
- Slight translation on hover (moves with shadow)
- Uppercase text with wide tracking

#### Inputs
- Underline style for text inputs
- Border style for textareas
- Transparent background
- Focus state changes border color to accent

#### Cards/Papers
- White/dark background depending on theme
- 2px solid border
- Brutal shadow for depth
- Slight rotation for organic feel (where appropriate)

### 4. Color Usage
- **Accent color** used sparingly for highlights and underlines
- **Borders** provide structure and separation
- **Shadows** create depth and hierarchy
- **Opacity** used for decorative elements

## Components

### ThemeToggle
- Fixed position (top-right)
- Animated icon transition (sun ↔ moon)
- Persists preference to localStorage
- Respects system preference on first visit

### SeasonalDecoration
- Adapts opacity based on theme
- Uses accent colors for seasonal themes
- Positioned absolutely for decorative effect

### Paper Cards
- Consistent styling across all pages
- Adapts shadow and border to theme
- Used for forms, content blocks, and admin panels

## Accessibility

- High contrast ratios in both themes
- Focus states clearly visible
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support

## Theme Toggle Behavior

1. **First Visit**: Checks system preference (`prefers-color-scheme`)
2. **Subsequent Visits**: Loads saved preference from localStorage
3. **Manual Toggle**: Saves preference and applies immediately
4. **Smooth Transitions**: 0.3s ease on background and text colors

## Usage Examples

### Creating a Button
```svelte
<button class="bg-ink dark:bg-dark-ink text-paper dark:text-dark-bg font-bold py-3 px-6 uppercase tracking-widest shadow-brutal dark:shadow-brutal-dark hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
  Click Me
</button>
```

### Creating a Paper Card
```svelte
<div class="paper p-6 shadow-brutal dark:shadow-brutal-dark">
  <!-- Content -->
</div>
```

### Creating an Input
```svelte
<input class="input-underline w-full" type="text" />
```

## Tailwind Configuration

The design system extends Tailwind with custom colors and utilities:
- Custom color palette for light/dark themes
- Brutal shadow utilities
- Paper component class
- Input component classes

## CSS Variables

The system uses CSS variables for dynamic theming:
- `--bg-paper`: Main background color
- `--bg-white`: Card/paper background
- `--text-ink`: Primary text color
- `--text-dim`: Secondary text color
- `--border-color`: Border color
- `--accent`: Accent color

These variables automatically update when the theme changes.

## Future Enhancements

- Add noise texture overlay for authentic paper feel
- Implement seasonal theme variations
- Add more animation on page transitions
- Create reusable component library
- Add print stylesheet for physical archiving

