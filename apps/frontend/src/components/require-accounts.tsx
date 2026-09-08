import { useState, type ReactNode } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAccountsQuery } from '@/stores/accounts.store';
import { CreateAccountDialog } from '@/components/create-account-dialog';

interface RequireAccountsProps {
  children: ReactNode;
}

export function RequireAccounts({ children }: RequireAccountsProps) {
  const { data: accounts, isLoading } = useAccountsQuery();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/30">
              <Wallet className="h-10 w-10 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-text">
              Crea tu primera cuenta
            </h1>
            <p className="mt-3 text-text-secondary">
              Necesitas al menos una cuenta para comenzar a gestionar tus finanzas.
            </p>
            <Button
              size="lg"
              className="mt-8"
              onClick={() => setDialogOpen(true)}
            >
              Crear cuenta
            </Button>
          </div>
        </div>

        <CreateAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </>
    );
  }

  return <>{children}</>;
}
