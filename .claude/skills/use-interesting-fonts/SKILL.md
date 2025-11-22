---
name: frontend-aesthetics
description: Guidelines for creating distinctive, creative frontends that avoid generic "AI slop" aesthetics. Use when creating UI, styling, choosing fonts, colors, animations, or any visual design work.
---

# Frontend Aesthetics

You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight.

## Typography

Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

### Never Use
- Inter
- Roboto
- Open Sans
- Lato
- Arial
- Default system fonts

### Recommended Starting Points
These are suggestions, not a closed list - think beyond these:
- **Editorial**: Playfair Display, Crimson Pro, Newsreader
- **Technical**: IBM Plex family, Source Sans 3
- **Distinctive**: Bricolage Grotesque, Syne, Clash Display
- **Monospace**: JetBrains Mono, Fira Code

Note: Avoid overusing Space Grotesk - it has become too common in AI-generated designs.

### Sizing Principles
Use extremes for impact:
- Weights: 100/200 vs 800/900 (not 400 vs 600)
- Size jumps: 3x+ (not 1.5x)

### Pairing Principles
High contrast = interesting:
- Display + Monospace
- Serif + Geometric Sans
- Variable font across weights

## Color & Theme

Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Avoid clichéd color schemes, particularly purple gradients on white backgrounds.

## Motion

Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

## Backgrounds

Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

## Avoid Generic AI Aesthetics

- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

## Creative Philosophy

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. Avoid converging on common choices across generations - it is critical that you think outside the box!
