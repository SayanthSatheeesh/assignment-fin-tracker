'use client';
import { useState, useEffect, useCallback } from 'react';
import { Search, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { PortfolioSummaryCard } from '@/components/portfolio-summary-card';
import { PaginationControls } from '@/components/pagination-controls';
import { InvestmentTable } from '@/components/investment-table';
import { InvestmentForm } from '@/components/investment-form';
import type { Investment, PaginatedInvestments, PortfolioSummary } from '@/types/investment';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function InvestmentsPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [investmentType, setInvestmentType] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<Investment | null>(null);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const summaryRes = await apiClient.get<PortfolioSummary>('/portfolio/summary');
      setSummary(summaryRes);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) queryParams.append('search', search);
      if (investmentType) queryParams.append('investmentType', investmentType);

      const invRes = await apiClient.get<PaginatedInvestments>(`/investments?${queryParams.toString()}`);
      setInvestments(invRes.data);
      setTotalPages(invRes.meta.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, investmentType]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const openAdd = () => {
    setEditingInv(null);
    setIsFormOpen(true);
  };

  const openEdit = (inv: Investment) => {
    setEditingInv(inv);
    setIsFormOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingInv) {
        await apiClient.put(`/investments/${editingInv.id}`, data);
      } else {
        await apiClient.post('/investments', data);
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save investment');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiClient.delete(`/investments/${deletingId}`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete investment');
    }
  };

  return (
    <div className="min-h-screen bg-surface-soft pb-24">
      {/* Light hero header */}
      <header className="bg-canvas border-b border-hairline py-6">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <h1 className="text-title-lg font-display text-ink">Investments</h1>
        </div>
      </header>

      {summary && <PortfolioSummaryCard summary={summary} />}

      <section className="bg-canvas max-w-[1200px] mx-auto mt-8 rounded-xl border border-hairline overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-hairline flex flex-col md:flex-row gap-4 justify-between items-center bg-canvas">
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="bg-surface-strong text-ink text-body-md rounded-pill pl-12 pr-5 h-11 border-none focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64 transition-shadow"
              />
            </div>
            <input
              type="text"
              placeholder="Filter by type"
              value={investmentType}
              onChange={(e) => { setInvestmentType(e.target.value); setPage(1); }}
              className="bg-surface-strong text-ink text-body-md rounded-pill px-5 h-11 border-none focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-48 transition-shadow hidden sm:block"
            />
          </div>
          <button
            onClick={openAdd}
            className="bg-primary text-on-dark font-semibold text-body-md rounded-pill px-5 h-11 hover:bg-primary-active active:bg-primary-active transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Add Investment
          </button>
        </div>

        <InvestmentTable
          investments={investments}
          loading={loading}
          onEdit={openEdit}
          onDelete={openDelete}
        />

        <div className="p-6">
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>

      <InvestmentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        mode={editingInv ? 'edit' : 'create'}
        initialValues={
          editingInv
            ? {
                investmentName: editingInv.investmentName,
                investmentType: editingInv.investmentType,
                investedAmount: editingInv.investedAmount,
                currentValue: editingInv.currentValue,
                purchaseDate: editingInv.purchaseDate.split('T')[0],
              }
            : undefined
        }
        onSubmit={handleFormSubmit}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="max-w-[400px] bg-canvas border-none rounded-xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-title-md font-semibold text-ink">Delete Investment?</AlertDialogTitle>
            <AlertDialogDescription className="text-body-md text-body-text">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
            <AlertDialogCancel className="bg-surface-strong text-ink border-none hover:bg-hairline hover:text-ink rounded-pill font-semibold h-11 px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-semantic-down text-on-dark hover:bg-semantic-down/90 rounded-pill font-semibold h-11 px-5">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
