import axe from "axe-core";

/**
 * Accessibility problems axe-core finds in the rendered page, one line each.
 * jsdom does not compute styles, so colour contrast is left to manual checks.
 */
export async function accessibilityViolations(
  container: Element = document.body,
): Promise<string[]> {
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}
