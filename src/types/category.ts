export interface CategoryListItem {
  id: number;
  name: string;
  slug: string;
  iconPath: string | null;
  coverImage: string | null;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  parentId: number | null;
  _count: { products: number };
}

export interface CategoryTreeNode extends CategoryListItem {
  children: CategoryTreeNode[];
}
