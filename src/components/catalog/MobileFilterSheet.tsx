'use client';

import Modal from '@/components/ui/Modal';
import FilterSidebar from './FilterSidebar';
import type { CategoryListItem } from '@/types/category';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryListItem[];
}

export default function MobileFilterSheet({ isOpen, onClose, categories }: MobileFilterSheetProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Фільтри" size="full">
      <div className="p-4">
        <FilterSidebar categories={categories} />
      </div>
    </Modal>
  );
}
