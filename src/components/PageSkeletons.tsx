import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function CashflowSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="mb-6">
        <Skeleton className="h-1 w-16 mb-4" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      
      {/* Disclaimer banner skeleton */}
      <Skeleton className="h-24 w-full rounded-lg mb-6" />
      
      {/* 4 Portfolio Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Stabilization info skeleton */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Projection Chart skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      
      {/* Table skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function BuyVsRentSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-1 w-16 mb-4" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left column - Input forms */}
        <div className="space-y-6">
          {/* Equipment Details Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          
          {/* Rental Rates Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          
          {/* Ownership Costs Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Results */}
        <div className="space-y-6">
          {/* Recommendation Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            </CardContent>
          </Card>
          
          {/* Cost Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          </div>
          
          {/* Chart skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
          
          {/* Year breakdown table skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-1 w-16 mb-4" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72 mt-1" />
      </div>
      
      {/* Metrics Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Financing Summary */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-8 w-28" />
              </div>
            ))}
          </div>
          <div className="pt-4 border-t">
            <Skeleton className="h-4 w-48 mb-3" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Two Column Grid */}
      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2 mb-8">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full mb-4" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Replacement Planning */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-44" />
            </div>
            <Skeleton className="h-4 w-52 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Aging & Recent */}
      <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function EquipmentListSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-1 w-16 mb-4" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      {/* Filters skeleton */}
      <div className="space-y-4 mb-6">
        <Skeleton className="h-10 w-full max-w-[400px]" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-20" />
          ))}
        </div>
      </div>
      
      {/* Category Groups skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <div className="px-4 py-3 flex items-center justify-between bg-muted/50">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function InsuranceContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Tabs skeleton */}
      <div className="flex gap-1 mb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>
      
      {/* Content skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
