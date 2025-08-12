import type { DataAsset } from '@prisma/client';
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit2, Trash2, Loader2, Search, X } from 'lucide-react';
import { EmptyState, LoadingState } from '@/components/feedback';

interface DataAssetsTableProps {
  data: DataAsset[];
  loading: boolean;
  onEdit: (asset: DataAsset) => void;
  onDelete: (id: string) => void;
}

export function DataAssetsTable({ data, loading, onEdit, onDelete }: DataAssetsTableProps) {
  const [filters, setFilters] = useState({
    path: '',
    storageType: '',
    storageLocation: '',
    assetType: '',
    ownerUuid: '',
  });

  const filteredData = useMemo(() => {
    return data.filter((asset) => {
      const matchesPath = asset.path.toLowerCase().includes(filters.path.toLowerCase());
      const matchesStorageType = asset.storage_type.toLowerCase().includes(filters.storageType.toLowerCase());
      const matchesStorageLocation = asset.storage_location.toLowerCase().includes(filters.storageLocation.toLowerCase());
      const matchesAssetType = asset.asset_type.toLowerCase().includes(filters.assetType.toLowerCase());
      const matchesOwnerUuid = asset.owner_uuid.toLowerCase().includes(filters.ownerUuid.toLowerCase());

      return matchesPath && matchesStorageType && matchesStorageLocation && matchesAssetType && matchesOwnerUuid;
    });
  }, [data, filters]);

  const clearFilters = () => {
    setFilters({
      path: '',
      storageType: '',
      storageLocation: '',
      assetType: '',
      ownerUuid: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStorageTypeBadge = (type: string) => {
    return type === 'OBJECT' ? (
      <Badge variant="default">Object</Badge>
    ) : (
      <Badge variant="secondary">Table</Badge>
    );
  };

  if (loading) return <LoadingState label="Loading data assets..." />

  if (data.length === 0)
    return (
      <EmptyState
        title="No data assets found"
        description="Create your first data asset to get started."
      />
    )

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="rounded-md border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Filter Data Assets</h3>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Path</label>
            <Input
              placeholder="Filter by path..."
              value={filters.path}
              onChange={(e) => setFilters(prev => ({ ...prev, path: e.target.value }))}
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Storage Type</label>
            <Input
              placeholder="Filter by storage type..."
              value={filters.storageType}
              onChange={(e) => setFilters(prev => ({ ...prev, storageType: e.target.value }))}
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Storage Location</label>
            <Input
              placeholder="Filter by location..."
              value={filters.storageLocation}
              onChange={(e) => setFilters(prev => ({ ...prev, storageLocation: e.target.value }))}
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Asset Type</label>
            <Input
              placeholder="Filter by asset type..."
              value={filters.assetType}
              onChange={(e) => setFilters(prev => ({ ...prev, assetType: e.target.value }))}
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Owner UUID</label>
            <Input
              placeholder="Filter by owner..."
              value={filters.ownerUuid}
              onChange={(e) => setFilters(prev => ({ ...prev, ownerUuid: e.target.value }))}
              className="h-8"
            />
          </div>
        </div>
        
        {filteredData.length !== data.length && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredData.length} of {data.length} assets
          </div>
        )}
      </div>

      {/* Results */}
      {filteredData.length === 0 && hasActiveFilters ? (
        <EmptyState
          title="No matching data assets"
          description="Try adjusting your filters to see more results."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Path</TableHead>
            <TableHead>Storage Type</TableHead>
            <TableHead>Storage Location</TableHead>
            <TableHead>Asset Type</TableHead>
            <TableHead>Owner UUID</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">{asset.path}</TableCell>
              <TableCell>{getStorageTypeBadge(asset.storage_type)}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {asset.storage_location}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{asset.asset_type}</Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {asset.owner_uuid.substring(0, 8)}...
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(asset.date_created)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(asset.date_updated)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(asset)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(asset.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        </div>
      )}
    </div>
  );
}
