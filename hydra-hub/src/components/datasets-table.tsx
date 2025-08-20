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
import { Edit2, Trash2, Search, X, Plus } from 'lucide-react';
import { EmptyState, LoadingState } from '@/components/feedback';

export type Dataset = {
  key: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  queries: DatasetQuery[];
};

export type DatasetQuery = {
  query: string;
  type: 'objectstore/path' | 'objectstore/object' | 'objectstore/bucket';
  exclude: boolean;
};

interface DatasetsTableProps {
  data: Dataset[];
  loading: boolean;
  onEdit: (dataset: Dataset) => void;
  onDelete: (key: string) => void;
  onManageQueries: (dataset: Dataset) => void;
}

export function DatasetsTable({ data, loading, onEdit, onDelete, onManageQueries }: DatasetsTableProps) {
  const [filters, setFilters] = useState({
    name: '',
    description: '',
    key: '',
  });

  const filteredData = useMemo(() => {
    return data.filter((dataset) => {
      const matchesName = dataset.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesDescription = dataset.description.toLowerCase().includes(filters.description.toLowerCase());
      const matchesKey = dataset.key.toLowerCase().includes(filters.key.toLowerCase());

      return matchesName && matchesDescription && matchesKey;
    });
  }, [data, filters]);

  const clearFilters = () => {
    setFilters({
      name: '',
      description: '',
      key: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getQueryTypeColor = (type: string) => {
    switch (type) {
      case 'objectstore/path':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'objectstore/object':
        return 'bg-green-500 hover:bg-green-600';
      case 'objectstore/bucket':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  if (loading) return <LoadingState label="Loading datasets..." />

  if (data.length === 0)
    return (
      <EmptyState
        title="No datasets found"
        description="Create your first dataset to get started organizing your data."
      />
    )

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="rounded-md border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Filter Datasets</h3>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input
              placeholder="Filter by name..."
              value={filters.name}
              onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Key</label>
            <Input
              placeholder="Filter by key..."
              value={filters.key}
              onChange={(e) => setFilters(prev => ({ ...prev, key: e.target.value }))}
              className="h-8"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Input
              placeholder="Filter by description..."
              value={filters.description}
              onChange={(e) => setFilters(prev => ({ ...prev, description: e.target.value }))}
              className="h-8"
            />
          </div>
        </div>
        
        {filteredData.length !== data.length && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredData.length} of {data.length} datasets
          </div>
        )}
      </div>

      {/* Results */}
      {filteredData.length === 0 && hasActiveFilters ? (
        <EmptyState
          title="No matching datasets"
          description="Try adjusting your filters to see more results."
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Queries</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((dataset) => (
                <TableRow key={dataset.key}>
                  <TableCell className="font-medium">{dataset.name}</TableCell>
                  <TableCell className="font-mono text-xs">{dataset.key}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {dataset.description || <span className="text-muted-foreground italic">No description</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {dataset.queries.slice(0, 3).map((query, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className={`text-xs ${getQueryTypeColor(query.type)} text-white`}
                        >
                          {query.type.split('/')[1]}
                          {query.exclude && ' (!)'}
                        </Badge>
                      ))}
                      {dataset.queries.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{dataset.queries.length - 3} more
                        </Badge>
                      )}
                      {dataset.queries.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">No queries</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(dataset.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(dataset.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageQueries(dataset)}
                        className="h-8 w-8 p-0"
                        title="Manage queries"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Manage queries</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(dataset)}
                        className="h-8 w-8 p-0"
                        title="Edit dataset"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(dataset.key)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Delete dataset"
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
