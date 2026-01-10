import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  User,
  FileText,
  Package
} from "lucide-react";
import { ExtractedPolicyData, ExtractedScheduledEquipment, InsuranceSettings } from "@/types/insurance";
import { Equipment } from "@/types/equipment";

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 10);
  
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

interface MatchedEquipment {
  extracted: ExtractedScheduledEquipment;
  existing: Equipment;
  matchType: 'serial' | 'make_model_year' | 'fuzzy';
  selected: boolean;
  editedDeclaredValue?: number;
}

interface UnmatchedEquipment {
  extracted: ExtractedScheduledEquipment;
  action: 'ignore' | 'add' | null;
}

interface InsurancePolicyImportReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: ExtractedPolicyData | null;
  existingEquipment: Equipment[];
  onApplyImport: (
    settingsUpdates: Partial<InsuranceSettings>,
    matchedEquipmentUpdates: { id: string; declaredValue: number }[]
  ) => Promise<void>;
}

export function InsurancePolicyImportReview({
  open,
  onOpenChange,
  extractedData,
  existingEquipment,
  onApplyImport,
}: InsurancePolicyImportReviewProps) {
  const [isApplying, setIsApplying] = useState(false);
  
  // Editable broker/policy info
  const [brokerInfo, setBrokerInfo] = useState({
    brokerName: '',
    brokerCompany: '',
    brokerEmail: '',
    brokerPhone: '',
  });
  const [policyInfo, setPolicyInfo] = useState({
    policyNumber: '',
    policyRenewalDate: '',
  });

  // Equipment matching state
  const [matchedEquipment, setMatchedEquipment] = useState<MatchedEquipment[]>([]);
  const [unmatchedEquipment, setUnmatchedEquipment] = useState<UnmatchedEquipment[]>([]);

  // Initialize state when extractedData changes
  useEffect(() => {
    if (!extractedData) return;

    // Set broker info
    setBrokerInfo({
      brokerName: extractedData.brokerInfo.name || '',
      brokerCompany: extractedData.brokerInfo.company || '',
      brokerEmail: extractedData.brokerInfo.email || '',
      brokerPhone: formatPhoneNumber(extractedData.brokerInfo.phone || ''),
    });

    // Set policy info
    setPolicyInfo({
      policyNumber: extractedData.policyInfo.policyNumber || '',
      policyRenewalDate: extractedData.policyInfo.renewalDate || '',
    });

    // Match equipment
    const matched: MatchedEquipment[] = [];
    const unmatched: UnmatchedEquipment[] = [];

    for (const extracted of extractedData.scheduledEquipment) {
      let foundMatch: Equipment | null = null;
      let matchType: 'serial' | 'make_model_year' | 'fuzzy' = 'fuzzy';

      // Try serial/VIN match first (highest confidence)
      if (extracted.serialVin) {
        const normalizedSerial = extracted.serialVin.replace(/\s+/g, '').toLowerCase();
        foundMatch = existingEquipment.find(e => 
          e.serialVin && e.serialVin.replace(/\s+/g, '').toLowerCase() === normalizedSerial
        ) || null;
        if (foundMatch) matchType = 'serial';
      }

      // Try make + model + year match
      if (!foundMatch && extracted.make && extracted.model) {
        const normalizedMake = extracted.make.toLowerCase().trim();
        const normalizedModel = extracted.model.toLowerCase().trim();
        
        foundMatch = existingEquipment.find(e => {
          const eMake = e.make.toLowerCase().trim();
          const eModel = e.model.toLowerCase().trim();
          const makeMatch = eMake.includes(normalizedMake) || normalizedMake.includes(eMake);
          const modelMatch = eModel.includes(normalizedModel) || normalizedModel.includes(eModel);
          const yearMatch = !extracted.year || e.year === extracted.year;
          return makeMatch && modelMatch && yearMatch;
        }) || null;
        if (foundMatch) matchType = 'make_model_year';
      }

      // Try fuzzy description match as last resort
      if (!foundMatch) {
        const descWords = extracted.description.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        foundMatch = existingEquipment.find(e => {
          const equipName = `${e.make} ${e.model}`.toLowerCase();
          const matchCount = descWords.filter(w => equipName.includes(w)).length;
          return matchCount >= 2;
        }) || null;
        if (foundMatch) matchType = 'fuzzy';
      }

      if (foundMatch) {
        // Check if this equipment is already matched
        const alreadyMatched = matched.some(m => m.existing.id === foundMatch!.id);
        if (!alreadyMatched) {
          matched.push({
            extracted,
            existing: foundMatch,
            matchType,
            selected: true,
          });
        } else {
          // Equipment already matched to something else, treat as unmatched
          unmatched.push({ extracted, action: null });
        }
      } else {
        unmatched.push({ extracted, action: null });
      }
    }

    setMatchedEquipment(matched);
    setUnmatchedEquipment(unmatched);
  }, [extractedData, existingEquipment]);

  const toggleMatchedSelection = (index: number) => {
    setMatchedEquipment(prev => 
      prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item)
    );
  };

  const updateMatchedDeclaredValue = (index: number, value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    setMatchedEquipment(prev => 
      prev.map((item, i) => i === index 
        ? { ...item, editedDeclaredValue: isNaN(numValue) ? undefined : numValue } 
        : item
      )
    );
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      // Build settings updates
      const settingsUpdates: Partial<InsuranceSettings> = {
        brokerName: brokerInfo.brokerName || null,
        brokerCompany: brokerInfo.brokerCompany || null,
        brokerEmail: brokerInfo.brokerEmail || null,
        brokerPhone: brokerInfo.brokerPhone || null,
        policyNumber: policyInfo.policyNumber || null,
        policyRenewalDate: policyInfo.policyRenewalDate || null,
      };

      // Build matched equipment updates - use edited value if available, otherwise use extracted value
      const equipmentUpdates = matchedEquipment
        .filter(m => m.selected && (m.editedDeclaredValue !== undefined || m.extracted.declaredValue))
        .map(m => ({
          id: m.existing.id,
          declaredValue: m.editedDeclaredValue ?? m.extracted.declaredValue!,
        }));

      await onApplyImport(settingsUpdates, equipmentUpdates);
      onOpenChange(false);
    } finally {
      setIsApplying(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const getMatchBadge = (matchType: 'serial' | 'make_model_year' | 'fuzzy') => {
    switch (matchType) {
      case 'serial':
        return <Badge variant="default" className="bg-green-500">Serial Match</Badge>;
      case 'make_model_year':
        return <Badge variant="secondary">Make/Model Match</Badge>;
      case 'fuzzy':
        return <Badge variant="outline">Fuzzy Match</Badge>;
    }
  };

  const selectedCount = matchedEquipment.filter(m => m.selected).length;

  if (!extractedData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Review Imported Policy Data</DialogTitle>
          <DialogDescription>
            Review and edit the extracted information before applying to your settings and equipment.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {/* Broker & Policy Info */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Broker Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Broker Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={brokerInfo.brokerName}
                        onChange={(e) => setBrokerInfo(prev => ({ ...prev, brokerName: e.target.value }))}
                        placeholder="Contact name"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Company</Label>
                      <Input
                        value={brokerInfo.brokerCompany}
                        onChange={(e) => setBrokerInfo(prev => ({ ...prev, brokerCompany: e.target.value }))}
                        placeholder="Company"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      value={brokerInfo.brokerEmail}
                      onChange={(e) => setBrokerInfo(prev => ({ ...prev, brokerEmail: e.target.value }))}
                      placeholder="email@example.com"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={brokerInfo.brokerPhone}
                      onChange={(e) => setBrokerInfo(prev => ({ ...prev, brokerPhone: formatPhoneNumber(e.target.value) }))}
                      placeholder="(555) 123-4567"
                      className="h-8 text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Policy Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Policy Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Policy Number</Label>
                    <Input
                      value={policyInfo.policyNumber}
                      onChange={(e) => setPolicyInfo(prev => ({ ...prev, policyNumber: e.target.value }))}
                      placeholder="POL-123456"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Renewal Date</Label>
                    <Input
                      type="date"
                      value={policyInfo.policyRenewalDate}
                      onChange={(e) => setPolicyInfo(prev => ({ ...prev, policyRenewalDate: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Matched Equipment */}
            {matchedEquipment.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Matched Equipment ({selectedCount} selected)
                  </h3>
                </div>
                <div className="space-y-2">
                  {matchedEquipment.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        item.selected ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30'
                      }`}
                    >
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleMatchedSelection(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {item.existing.year} {item.existing.make} {item.existing.model}
                          </span>
                          {getMatchBadge(item.matchType)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate" title={item.extracted.description}>
                          Policy: "{item.extracted.description}"
                        </p>
                        {item.existing.serialVin && (
                          <p className="text-xs text-muted-foreground">
                            S/N: {item.existing.serialVin}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 space-y-1 w-32">
                        {item.existing.insuranceDeclaredValue && (
                          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                            <span>Current:</span>
                            <span>{formatCurrency(item.existing.insuranceDeclaredValue)}</span>
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <Label className="text-xs text-muted-foreground">Imported Value</Label>
                          <Input
                            type="number"
                            value={item.editedDeclaredValue ?? item.extracted.declaredValue ?? ''}
                            onChange={(e) => updateMatchedDeclaredValue(index, e.target.value)}
                            className="h-8 text-sm text-right"
                            placeholder="$0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unmatched Equipment */}
            {unmatchedEquipment.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-medium">
                    Unmatched Items ({unmatchedEquipment.length})
                  </h3>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                    These items from your policy don't match any equipment in your records. 
                    To include them, first add them to your equipment list, then re-import.
                  </p>
                  <div className="space-y-2">
                    {unmatchedEquipment.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 p-2 rounded bg-background/50"
                      >
                        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" title={item.extracted.description}>
                            {item.extracted.description}
                          </p>
                          {item.extracted.serialVin && (
                            <p className="text-xs text-muted-foreground">
                              S/N: {item.extracted.serialVin}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm">
                            {formatCurrency(item.extracted.declaredValue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Equipment */}
            {matchedEquipment.length === 0 && unmatchedEquipment.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No scheduled equipment found in the document</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            {selectedCount > 0 
              ? `${selectedCount} equipment will be marked as insured with updated declared values`
              : 'Only broker and policy info will be updated'
            }
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply Import"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
