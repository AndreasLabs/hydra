import { DataAsset } from '@/types/data-asset';
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
import { Edit2, Trash2, Loader2 } from 'lucide-react';

interface DataAssetsTableProps {
  data: DataAsset[];
  loading: boolean;
  onEdit: (asset: DataAsset) => void;
  onDelete: (id: string) => void;
}

export function DataAssetsTable({ data, loading, onEdit, onDelete }: DataAssetsTableProps) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading data assets...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No data assets found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first data asset to get started.
        </p>
      </div>
    );
  }

  return (
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
          {data.map((asset) => (
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
  );
}
