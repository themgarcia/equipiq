import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEquipment } from '@/contexts/EquipmentContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useDeviceType } from '@/hooks/use-mobile';
import { Layout } from '@/components/Layout';
import { AddEquipmentModal } from '@/components/AddEquipmentModal';
import { EquipmentImportReview } from '@/components/EquipmentImportReview';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import { EquipmentCategoryGroup } from '@/components/equipment/EquipmentCategoryGroup';
import { EquipmentDetailsSheet } from '@/components/equipment/EquipmentDetailsSheet';
import { formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Equipment, ExtractedEquipmentBase } from '@/types/equipment';
import { categoryDefaults } from '@/data/categoryDefaults';
import { EquipmentListSkeleton } from '@/components/PageSkeletons';

export default function EquipmentList() {
  const { calculatedEquipment, addEquipment, updateEquipment, deleteEquipment, attachmentsByEquipmentId, loading } = useEquipment();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'phone';
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  
  // Modal/sheet state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [extractedEquipment, setExtractedEquipment] = useState<ExtractedEquipmentBase[]>([]);
  const [importEntrySource, setImportEntrySource] = useState<'ai_document' | 'spreadsheet'>('ai_document');
  
  // Category/attachment expansion
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => 
    new Set(categoryDefaults.map(c => c.category))
  );
  const [expandedAttachments, setExpandedAttachments] = useState<Set<string>>(new Set());
  
  // Equipment details sheet — store only ID, derive object from live data
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const selectedEquipment = selectedEquipmentId
    ? calculatedEquipment.find(e => e.id === selectedEquipmentId) ?? null
    : null;
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle deep-link to specific equipment via ?selected=<id>
  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (selectedId && calculatedEquipment.length > 0) {
      const equipment = calculatedEquipment.find(e => e.id === selectedId);
      if (equipment) {
        setSelectedEquipmentId(selectedId);
        searchParams.delete('selected');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [searchParams, calculatedEquipment, setSearchParams]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleAttachments = (equipmentId: string) => {
    setExpandedAttachments(prev => {
      const next = new Set(prev);
      if (next.has(equipmentId)) {
        next.delete(equipmentId);
      } else {
        next.add(equipmentId);
      }
      return next;
    });
  };

  const handleEquipmentExtracted = (
    equipment: ExtractedEquipmentBase[],
    _documentSummaries?: any,
    _conflicts?: any,
    _processingNotes?: string,
    _sourceFiles?: File[],
    importType?: 'ai' | 'structured'
  ) => {
    setExtractedEquipment(equipment);
    setImportEntrySource(importType === 'structured' ? 'spreadsheet' : 'ai_document');
    setIsReviewOpen(true);
  };

  const { markStepComplete } = useOnboarding();

  const handleImportComplete = useCallback(() => {
    setExtractedEquipment([]);
    markStepComplete('step_equipment_imported');
  }, [markStepComplete]);

  const handleFormSubmitWithOnboarding = async (data: Omit<Equipment, 'id'>) => {
    await addEquipment(data, 'manual');
    markStepComplete('step_equipment_imported');
    setIsAddModalOpen(false);
  };




  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this equipment?')) {
      deleteEquipment(id);
    }
  };

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    return calculatedEquipment.filter(equipment => {
      const matchesSearch = equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        equipment.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || equipment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [calculatedEquipment, searchQuery, statusFilter]);

  // Group by category
  const groupedEquipment = useMemo(() => {
    const groups: Record<string, typeof filteredEquipment> = {};
    categoryDefaults.forEach(cat => {
      groups[cat.category] = [];
    });
    filteredEquipment.forEach(equipment => {
      if (groups[equipment.category]) {
        groups[equipment.category].push(equipment);
      } else {
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push(equipment);
      }
    });
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredEquipment]);

  if (loading) {
    return (
      <Layout>
        <EquipmentListSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold">Equipment</h1>
            <p className="text-muted-foreground mt-1">
              Manage your equipment fleet and allocations
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add to Equipment</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <EquipmentFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          isMobile={isMobile}
        />

        {/* Category Groups */}
        <div className="space-y-4">
          {groupedEquipment.length === 0 ? (
            <div className="bg-card border rounded-lg p-8 text-center text-muted-foreground">
              No equipment found. Add your first piece of equipment to get started.
            </div>
          ) : (
            groupedEquipment.map(([category, items]) => (
              <EquipmentCategoryGroup
                key={category}
                category={category}
                items={items}
                isExpanded={expandedCategories.has(category)}
                onToggle={() => toggleCategory(category)}
                isMobile={isMobile}
                attachmentsByEquipmentId={attachmentsByEquipmentId}
                expandedAttachments={expandedAttachments}
                onToggleAttachments={toggleAttachments}
                onSelectEquipment={(eq) => setSelectedEquipmentId(eq.id)}
              />
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredEquipment.length} of {calculatedEquipment.length} items in {groupedEquipment.length} categories
          </p>
          <p>
            Total Value (incl. attachments): <span className="font-mono-nums font-medium text-foreground">
              {formatCurrency(filteredEquipment.reduce((sum, e) => sum + e.totalCostBasis, 0))}
            </span>
          </p>
        </div>

        {/* Modals & Sheets */}
        <AddEquipmentModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onEquipmentExtracted={handleEquipmentExtracted}
          onManualSubmit={handleFormSubmitWithOnboarding}
        />

        <EquipmentImportReview
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          extractedEquipment={extractedEquipment}
          onComplete={handleImportComplete}
          entrySource={importEntrySource}
        />

        <EquipmentDetailsSheet
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipmentId(null)}
          onUpdate={updateEquipment}
          onDelete={handleDelete}
        />
      </div>
    </Layout>
  );
}
