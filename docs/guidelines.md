# Development Guidelines & Standards

To maintain a professional codebase for civil engineering applications, follow these development guidelines.

## 1. UI/UX: The "Aesthetic Engineering" Rule
- **Premium Feel**: Use curated color palettes (e.g., Slate, Blue, Emerald). Avoid generic colors.
- **Responsiveness**: Always use Tailwind's responsive prefixes (`lg:`, `md:`) to ensure tools work on tablets/sites.
- **Micro-interactions**: Use `framer-motion` for transitions. Structural changes (adding items) should feel "alive".

## 2. Drawing Engine Logic
- **Meters Default**: Always calculate dimensions in meters (m). Format the display for the user, but keep logic unit-systematic.
- **CTM Transformation**: Never use raw mouse `clientX/Y` directly. Always use the `getCoords` helper in `LayoutCanvas` to account for Zoom/Pan.
- **Non-Scaling Strokes**: Use `vector-effect="non-scaling-stroke"` on all SVG lines to maintain constant line thickness during zoom.

## 3. Data Integrity
- **Zod First**: Define structural types and BOQ schemas using Zod. This prevents "undefined" errors in complex calculations.
- **Reactive Summaries**: Use `useMemo` for the heavy calculation logic (`projectSummary`). Do not store calculated totals in the database; calculate them on the fly from the source-of-truth (Instances).

## 4. Component Structure
- **Container/Presenter**: Keep the Drawing Engine (`LayoutCanvas`) separate from Data Management (`TemplateManager`).
- **Hooks**: Abstract the BOQ store logic into `hooks/`.
- **Constants**: Store all material weights, prices, and default specs in `lib/constants.js`.

## 5. Deployment
- The system is built with Vite. Use `npm run build` for production.
- Ensure all SVG assets are inline or properly handled via `lucide-react`.
