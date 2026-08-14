import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/toast-provider";

interface ConfirmDeleteOptions {
  description: string;
  id: string;
  message: string;
  onDelete: (id: string) => Promise<void>;
  queryKey: string;
  toastTitle: string;
}

export function useConfirmDelete() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  return async (options: ConfirmDeleteOptions): Promise<boolean> => {
    if (!window.confirm(options.message)) return false;
    try {
      await options.onDelete(options.id);
      addToast({ description: options.description, title: options.toastTitle });
      await queryClient.invalidateQueries({ queryKey: [options.queryKey] });
      return true;
    } catch (err) {
      addToast({ description: String(err), title: "Error", variant: "destructive" });
      return false;
    }
  };
}
