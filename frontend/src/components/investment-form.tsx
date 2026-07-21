import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useEffect } from 'react';

const investmentSchema = z.object({
  investmentName: z.string().min(1, 'Investment name is required'),
  investmentType: z.string().min(1, 'Investment type is required'),
  investedAmount: z.coerce.number().positive('Invested amount must be positive'),
  currentValue: z.coerce.number().positive('Current value must be positive'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
});

type InvestmentFormValues = z.infer<typeof investmentSchema>;

interface InvestmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialValues?: Partial<InvestmentFormValues>;
  onSubmit: (data: InvestmentFormValues) => void;
}

export function InvestmentForm({ isOpen, onClose, mode, initialValues, onSubmit }: InvestmentFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema) as any,
    defaultValues: {
      investmentName: '',
      investmentType: '',
      investedAmount: 0,
      currentValue: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      ...initialValues,
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        investmentName: '',
        investmentType: '',
        investedAmount: 0,
        currentValue: 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        ...initialValues,
      });
    }
  }, [isOpen, initialValues, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[520px] bg-canvas border-none rounded-xl p-8">
        <DialogHeader>
          <DialogTitle className="text-title-lg font-normal tracking-tight text-ink mb-2">
            {mode === 'edit' ? 'Edit Investment' : 'Add Investment'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="text-body-text text-body-sm mb-1.5 block">Investment Name</label>
            <input
              {...register('investmentName')}
              className="w-full h-12 px-4 rounded-md bg-canvas border border-hairline text-ink text-body-md focus:outline-none focus:border-2 focus:border-primary transition-colors"
              placeholder="e.g. Apple Inc."
            />
            {errors.investmentName && <p className="text-semantic-down text-sm mt-1">{errors.investmentName.message}</p>}
          </div>
          <div>
            <label className="text-body-text text-body-sm mb-1.5 block">Type</label>
            <input
              {...register('investmentType')}
              className="w-full h-12 px-4 rounded-md bg-canvas border border-hairline text-ink text-body-md focus:outline-none focus:border-2 focus:border-primary transition-colors"
              placeholder="e.g. Stock, Crypto"
            />
            {errors.investmentType && <p className="text-semantic-down text-sm mt-1">{errors.investmentType.message}</p>}
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-body-text text-body-sm mb-1.5 block">Invested Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-mono">$</span>
                <input
                  type="number" step="0.01" min="0"
                  {...register('investedAmount')}
                  className="w-full h-12 pl-8 pr-4 rounded-md bg-canvas border border-hairline text-ink text-body-md focus:outline-none focus:border-2 focus:border-primary transition-colors font-mono"
                />
              </div>
              {errors.investedAmount && <p className="text-semantic-down text-sm mt-1">{errors.investedAmount.message}</p>}
            </div>
            <div className="flex-1">
              <label className="text-body-text text-body-sm mb-1.5 block">Current Value</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-mono">$</span>
                <input
                  type="number" step="0.01" min="0"
                  {...register('currentValue')}
                  className="w-full h-12 pl-8 pr-4 rounded-md bg-canvas border border-hairline text-ink text-body-md focus:outline-none focus:border-2 focus:border-primary transition-colors font-mono"
                />
              </div>
              {errors.currentValue && <p className="text-semantic-down text-sm mt-1">{errors.currentValue.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-body-text text-body-sm mb-1.5 block">Purchase Date</label>
            <input
              type="date"
              {...register('purchaseDate')}
              className="w-full h-12 px-4 rounded-md bg-canvas border border-hairline text-ink text-body-md focus:outline-none focus:border-2 focus:border-primary transition-colors"
            />
            {errors.purchaseDate && <p className="text-semantic-down text-sm mt-1">{errors.purchaseDate.message}</p>}
          </div>
          <DialogFooter className="mt-8 gap-3 sm:gap-0">
            <button type="button" onClick={onClose} className="bg-surface-strong text-ink font-semibold text-body-md rounded-pill px-5 py-3 h-11 hover:bg-hairline transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-primary text-on-dark font-semibold text-body-md rounded-pill px-5 py-3 h-11 hover:bg-primary-active transition-colors">
              {mode === 'edit' ? 'Update' : 'Save'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
