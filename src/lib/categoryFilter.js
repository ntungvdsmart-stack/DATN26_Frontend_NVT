import { normalizeSearch } from './search.js';

export function categoryDescendants(tree, selection) {
  const ids = new Set(tree.filter(category => String(category.category_id) === selection || normalizeSearch(category.category_name) === normalizeSearch(selection)).map(category => String(category.category_id)));
  if (selection && /^\d+$/.test(selection)) ids.add(selection);
  let changed = true;
  while (changed) {
    changed = false;
    for (const category of tree) {
      const id = String(category.category_id);
      if (ids.has(String(category.parent_id)) && !ids.has(id)) { ids.add(id); changed = true; }
    }
  }
  return ids;
}
