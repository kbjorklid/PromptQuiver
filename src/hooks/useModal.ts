import { useState, useCallback } from 'react';

export interface ModalConfig<T> {
  title: string;
  message?: string;
  options: { label: string; value: T }[];
  onSelect: (value: T) => void;
  onCancel?: () => void;
}

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<ModalConfig<any> | null>(null);

  const showModal = useCallback(<T>(config: ModalConfig<T>) => {
    setModalConfig(config);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback((value: any) => {
    setIsOpen(false);
    if (modalConfig) {
      modalConfig.onSelect(value);
    }
  }, [modalConfig]);

  return {
    isModalOpen: isOpen,
    modalConfig,
    showModal,
    closeModal,
    handleSelect
  };
}
