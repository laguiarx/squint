export type TreeNode = {
  name: string;
  /** Full repo-relative path (empty for the synthetic root). */
  path: string;
  kind: "dir" | "file";
  children?: TreeNode[];
};

/**
 * Build a sorted directory tree from a flat list of repo-relative paths.
 * Directories come before files at each level; both alphabetical.
 */
export function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", path: "", kind: "dir", children: [] };
  for (const p of paths) {
    if (!p) continue;
    const parts = p.split("/");
    let cur = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      acc = acc ? `${acc}/${name}` : name;
      const isFile = i === parts.length - 1;
      let child = cur.children?.find((c) => c.name === name);
      if (!child) {
        child = {
          name,
          path: acc,
          kind: isFile ? "file" : "dir",
          children: isFile ? undefined : [],
        };
        cur.children!.push(child);
      }
      cur = child;
    }
  }
  sortDeep(root);
  return root;
}

function sortDeep(node: TreeNode): void {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  node.children.forEach(sortDeep);
}

export type TreeRow = {
  node: TreeNode;
  depth: number;
  isOpen: boolean;
};

/**
 * Flatten the tree to a list of visible rows, based on which directories the
 * user has expanded. Children of the synthetic root are emitted at depth 0.
 */
export function flattenTree(
  root: TreeNode,
  expanded: ReadonlySet<string>,
): TreeRow[] {
  const out: TreeRow[] = [];
  function walk(node: TreeNode, depth: number) {
    const isOpen = node.kind === "dir" && expanded.has(node.path);
    out.push({ node, depth, isOpen });
    if (node.kind !== "dir") return;
    if (!isOpen) return;
    node.children?.forEach((c) => walk(c, depth + 1));
  }
  // Skip the synthetic root.
  root.children?.forEach((c) => walk(c, 0));
  return out;
}

/** Collect the chain of directory paths leading up to a file path. */
export function ancestorsOf(path: string): string[] {
  const parts = path.split("/");
  const out: string[] = [];
  let acc = "";
  for (let i = 0; i < parts.length - 1; i++) {
    acc = acc ? `${acc}/${parts[i]}` : parts[i];
    out.push(acc);
  }
  return out;
}
