import ReactTestRenderer from 'react-test-renderer';

export function findAccessibleElement(
  root: ReactTestRenderer.ReactTestRendererJSON | ReactTestRenderer.ReactTestRendererJSON[] | null,
  accessibilityLabel: string,
): ReactTestRenderer.ReactTestRendererJSON | null {
  if (!root) return null;
  const items = Array.isArray(root) ? root : [root];

  for (const item of items) {
    if (item.props?.accessibilityLabel === accessibilityLabel) {
      return item;
    }
    if (item.children) {
      const children = Array.isArray(item.children)
        ? item.children.filter((c): c is ReactTestRenderer.ReactTestRendererJSON => c !== null && typeof c === 'object')
        : [];
      for (const child of children) {
        const found = findAccessibleElement(child, accessibilityLabel);
        if (found) return found;
      }
    }
  }
  return null;
}

export function getAccessibilityProps(
  root: ReactTestRenderer.ReactTestRendererJSON | null,
): Record<string, unknown> {
  if (!root) return {};
  return root.props ?? {};
}

export function hasAccessibilityRole(
  root: ReactTestRenderer.ReactTestRendererJSON | null,
  role: string,
): boolean {
  return root?.props?.accessibilityRole === role;
}

export function getTextContent(
  node: ReactTestRenderer.ReactTestRendererJSON | null,
): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (!node.children) return '';
  return node.children
    .map(c => (typeof c === 'string' ? c : getTextContent(c)))
    .join('');
}
