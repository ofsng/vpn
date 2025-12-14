'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api';

interface DeleteUserModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

export function DeleteUserModal({ open, onClose, user }: DeleteUserModalProps) {
  const queryClient = useQueryClient();

  const { mutate: deleteUser, isLoading } = useMutation({
    mutationFn: () => userService.deleteUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Kullanıcıyı Sil</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {user?.username} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button
          onClick={() => deleteUser()}
          color="error"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Siliniyor...' : 'Sil'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 