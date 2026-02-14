## Animation patterns for Taichi articles

This guide documents the current, working pattern for NeetCode-style stepper animations embedded in blog posts.

## Standard approach

1. Build a client-side React component in `src/components`.
2. Register a custom HTML tag in `src/components/MarkdownRenderer.tsx` so markdown can render the component.
3. Insert the tag at the relevant spot in the article markdown.

## Example (MetaMorpho queue walkthrough)

- Component file: `src/components/MetaMorphoQueueAnimation.tsx`.
- Custom tag: `<metamorpho-queue-animation></metamorpho-queue-animation>`.
- Renderer mapping: `'metamorpho-queue-animation'` in `MarkdownRenderer`.

## What the component should render

- A full-width code panel (spans the entire row).
- Use real code from the contract, not pseudocode.
- 4-space indentation inside the code block.
- No list markers (no bullets, no line numbers).
- A stepper: title, description, and step controls (Previous, Next, Reset).
- State panels for arrays/variables (`withdrawQueue`, `seen`, `config`, checks).

## Rendering rules for the code panel

- Use a simple stack of div rows, not `<ol>`/`<ul>`.
- Each line should be a `<div>` with `whitespace-pre` and `font-mono` so indentation is preserved.
- Avoid list semantics entirely, or the browser will render bullets or numbers.

## MarkdownRenderer integration

- `react-markdown` is configured with `rehype-raw`, so custom tags are supported.
- The `components` map must be typed or cast to allow custom tags.
- The paragraph renderer should treat the animation component as a block element to avoid invalid nesting.

## Build and deploy sanity checks

- Always run `npm run build` after adding or changing a custom markdown component.
- A failed build leads to missing chunks and client-side load errors in production.

## Debug log (MetaMorpho animation bug)

Symptom: client-side exception with chunk load/MIME errors after deployment.

Causes:
- TypeScript build failed because the custom tag was not allowed in the `components` type.
- Implicit `any` errors appeared after loosening types.

Fixes:
- Cast the `components` map to `any` for the custom tag.
- Add explicit prop types for markdown renderers (`h1`, `h2`, `h3`, `blockquote`, `table`, `p`, `a`).
- Rebuild and redeploy to refresh chunks.
