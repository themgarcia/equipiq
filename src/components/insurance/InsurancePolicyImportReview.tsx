import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  User,
  FileText,
  Package,
  ArrowRightLeft,
  Link2,
  Trash2,
  X,
  Undo2
} from "lucide-react";
import { ExtractedPolicyData, ExtractedScheduledEquipment, InsuranceSettings } from "@/types/insurance";
import { Equipment } from "@/types/equipment";
import { formatPhoneNumber } from "@/lib/formatUtils";

interface MatchedEquipment {
  extracted: ExtractedScheduledEquipment;
  existing: Equipment;
  matchType: 'serial' | 'make_model_year' | 'fuzzy' | 'manual';
  selected: boolean;
  editedDeclaredValue?: number;
}

type RemovalReason = 'sold' | 'retired' | 'lost' | 'traded';

interface UnmatchedEquipment {
  extracted: ExtractedScheduledEquipment;
  action: 'ignore' | 'add' | 'flag_removal' | null;
  removalReason?: RemovalReason;
}

interface RemovalFlag {
  equipmentName: string;
  reason: RemovalReason;
  previousDeclaredValue: number | null;
}

interface InsurancePolicyImportReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: ExtractedPolicyData | null;
  existingEquipment: Equipment[];
  onApplyImport: (
    settingsUpdates: Partial<InsuranceSettings>,
    matchedEquipmentUpdates: { id: string; declaredValue: number }[],
    removalFlags?: RemovalFlag[]
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

  // Get equipment not currently matched (available for assignment from unmatched)
  const availableEquipment = useMemo(() => {
    return existingEquipment.filter(
      e => !matchedEquipment.some(m => m.existing.id === e.id)
    );
  }, [existingEquipment, matchedEquipment]);

  // Get all extracted items for swap dropdown (unmatched + current item)
  const getAvailableExtractedForSwap = (currentIndex: number) => {
    const currentExtracted = matchedEquipment[currentIndex]?.extracted;
    return unmatchedEquipment.map((u, idx) => ({ 
      extracted: u.extracted, 
      unmatchedIndex: idx,
      isCurrent: false 
    }));
  };

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

  // Reassign a matched item to a different extracted policy item from unmatched
  const reassignMatch = (matchIndex: number, unmatchedIndex: number) => {
    const currentMatch = matchedEquipment[matchIndex];
    const newExtracted = unmatchedEquipment[unmatchedIndex].extracted;
    
    // Move current extracted to unmatched
    setUnmatchedEquipment(prev => {
      const updated = [...prev];
      // Remove the new extracted from unmatched
      updated.splice(unmatchedIndex, 1);
      // Add the old extracted to unmatched
      updated.push({ extracted: currentMatch.extracted, action: null });
      return updated;
    });
    
    // Update matched with new extracted
    setMatchedEquipment(prev => prev.map((item, i) => 
      i === matchIndex 
        ? { ...item, extracted: newExtracted, matchType: 'manual', editedDeclaredValue: undefined } 
        : item
    ));
  };

  // Remove a match (move extracted back to unmatched)
  const removeMatch = (matchIndex: number) => {
    const item = matchedEquipment[matchIndex];
    
    // Move extracted to unmatched
    setUnmatchedEquipment(prev => [...prev, { extracted: item.extracted, action: null }]);
    
    // Remove from matched
    setMatchedEquipment(prev => prev.filter((_, i) => i !== matchIndex));
  };

  // Assign an unmatched item to an equipment
  const assignToEquipment = (unmatchedIndex: number, equipmentId: string) => {
    const extracted = unmatchedEquipment[unmatchedIndex].extracted;
    const equipment = existingEquipment.find(e => e.id === equipmentId);
    
    if (!equipment) return;
    
    // Add to matched
    setMatchedEquipment(prev => [...prev, {
      extracted,
      existing: equipment,
      matchType: 'manual',
      selected: true,
    }]);
    
    // Remove from unmatched
    setUnmatchedEquipment(prev => prev.filter((_, i) => i !== unmatchedIndex));
  };

  // Flag an unmatched item for removal (notify broker to remove from policy)
  const flagForRemoval = (index: number, reason: RemovalReason) => {
    setUnmatchedEquipment(prev => prev.map((u, i) => 
      i === index ? { ...u, action: 'flag_removal', removalReason: reason } : u
    ));
  };

  // Undo a flag for removal
  const undoFlag = (index: number) => {
    setUnmatchedEquipment(prev => prev.map((u, i) => 
      i === index ? { ...u, action: null, removalReason: undefined } : u
    ));
  };

  // Ignore an unmatched item (remove from list, no database action)
  const ignoreItem = (index: number) => {
    setUnmatchedEquipment(prev => prev.filter((_, i) => i !== index));
  };

  const getReasonLabel = (reason: RemovalReason): string => {
    switch (reason) {
      case 'sold': return 'Sold';
      case 'retired': return 'Retired';
      case 'lost': return 'Lost';
      case 'traded': return 'Traded';
    }
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

      // Build removal flags for items flagged to be removed from policy
      const removalFlags: RemovalFlag[] = unmatchedEquipment
        .filter(u => u.action === 'flag_removal' && u.removalReason)
        .map(u => ({
          equipmentName: u.extracted.description,
          reason: u.removalReason!,
          previousDeclaredValue: u.extracted.declaredValue,
        }));

      await onApplyImport(settingsUpdates, equipmentUpdates, removalFlags.length > 0 ? removalFlags : undefined);
      onOpenChange(false);
    } finally {
      setIsApplying(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const getMatchBadge = (matchType: 'serial' | 'make_model_year' | 'fuzzy' | 'manual') => {
    switch (matchType) {
      case 'serial':
        return <Badge variant="default" className="bg-success">Serial Match</Badge>;
      case 'make_model_year':
        return <Badge variant="secondary">Make/Model Match</Badge>;
      case 'fuzzy':
        return <Badge variant="outline">Fuzzy Match</Badge>;
      case 'manual':
        return <Badge variant="default" className="bg-info">Manual Match</Badge>;
    }
  };

  const hasYearMismatch = (item: MatchedEquipment) => {
    if (!item.extracted.year) return false;
    return Math.abs(item.existing.year - item.extracted.year) > 1;
  };

  const selectedCount = matchedEquipment.filter(m => m.selected).length;

  if (!extractedData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>Review Imported Policy Data</DialogTitle>
          <DialogDescription>
            Review and edit the extracted information before applying to your settings and equipment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 min-h-0">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Matched Equipment ({selectedCount} selected)
                  </h3>
                </div>
                <div className="space-y-2">
                  {matchedEquipment.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        item.selected ? 'bg-success/5 border-success/20' : 'bg-muted/30'
                      }`}
                    >
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleMatchedSelection(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {item.existing.year} {item.existing.make} {item.existing.model}
                          </span>
                          {getMatchBadge(item.matchType)}
                          {hasYearMismatch(item) && (
                            <Badge variant="outline" className="text-warning border-warning/50 bg-warning/10">
                              ⚠️ Policy says {item.extracted.year}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Policy item swap dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Policy:</span>
                          <Select
                            value="current"
                            onValueChange={(value) => {
                              if (value === 'remove') {
                                removeMatch(index);
                              } else if (value !== 'current') {
                                const unmatchedIdx = parseInt(value);
                                reassignMatch(index, unmatchedIdx);
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1 max-w-md">
                              <SelectValue>
                                <span className="truncate">{item.extracted.description}</span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="current" className="text-xs">
                                <span className="font-medium">Current:</span> {item.extracted.description}
                              </SelectItem>
                              {unmatchedEquipment.length > 0 && (
                                <>
                                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                                    Swap with unmatched item:
                                  </div>
                                  {unmatchedEquipment.map((unmatched, uIdx) => (
                                    <SelectItem key={uIdx} value={uIdx.toString()} className="text-xs">
                                      <div className="flex items-center gap-2">
                                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                        <span className="truncate">{unmatched.extracted.description}</span>
                                        {unmatched.extracted.declaredValue && (
                                          <span className="text-muted-foreground">
                                            ({formatCurrency(unmatched.extracted.declaredValue)})
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                              <SelectItem value="remove" className="text-xs text-destructive border-t mt-1 pt-2">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-3 w-3" />
                                  Remove match
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

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
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-medium">
                    Unmatched Items ({unmatchedEquipment.length})
                  </h3>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs text-warning mb-3">
                    These items from your policy don't match any equipment in your records. 
                    You can manually assign them to equipment below.
                  </p>
                  <div className="space-y-2">
                    {unmatchedEquipment.map((item, index) => {
                      const isFlagged = item.action === 'flag_removal';
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-start gap-3 p-2 rounded ${
                            isFlagged 
                              ? 'bg-destructive/10 border border-destructive/20' 
                              : 'bg-background/50'
                          }`}
                        >
                          {isFlagged ? (
                            <Trash2 className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm truncate ${isFlagged ? 'line-through text-muted-foreground' : ''}`} title={item.extracted.description}>
                                {item.extracted.description}
                              </p>
                              {isFlagged && item.removalReason && (
                                <Badge variant="destructive" className="text-xs">
                                  Will flag: {getReasonLabel(item.removalReason)}
                                </Badge>
                              )}
                            </div>
                            {item.extracted.serialVin && (
                              <p className="text-xs text-muted-foreground">
                                S/N: {item.extracted.serialVin}
                              </p>
                            )}
                            
                            {/* Action buttons row */}
                            {!isFlagged ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Assign to equipment dropdown */}
                                {availableEquipment.length > 0 && (
                                  <Select
                                    value=""
                                    onValueChange={(equipmentId) => {
                                      if (equipmentId) {
                                        assignToEquipment(index, equipmentId);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-auto max-w-[180px]">
                                      <div className="flex items-center gap-1.5">
                                        <Link2 className="h-3 w-3" />
                                        <span>Assign to equipment</span>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover z-50">
                                      {availableEquipment.map((equip) => (
                                        <SelectItem key={equip.id} value={equip.id} className="text-xs">
                                          <div className="flex items-center gap-2">
                                            <span>{equip.year} {equip.make} {equip.model}</span>
                                            {equip.serialVin && (
                                              <span className="text-muted-foreground text-xs">
                                                ({equip.serialVin.slice(-6)})
                                              </span>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                
                                {/* Flag for Removal dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Flag for Removal
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="bg-popover">
                                    <DropdownMenuItem onClick={() => flagForRemoval(index, 'sold')}>
                                      Sold
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => flagForRemoval(index, 'retired')}>
                                      Retired
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => flagForRemoval(index, 'lost')}>
                                      Lost
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => flagForRemoval(index, 'traded')}>
                                      Traded
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                
                                {/* Ignore button */}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 text-xs text-muted-foreground"
                                  onClick={() => ignoreItem(index)}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Ignore
                                </Button>
                              </div>
                            ) : (
                              /* Undo button for flagged items */
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs"
                                onClick={() => undoFlag(index)}
                              >
                                <Undo2 className="h-3 w-3 mr-1" />
                                Undo
                              </Button>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-sm ${isFlagged ? 'line-through text-muted-foreground' : ''}`}>
                              {formatCurrency(item.extracted.declaredValue)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
        </div>

        <div className="flex justify-between items-center px-6 py-4 border-t flex-shrink-0">
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
