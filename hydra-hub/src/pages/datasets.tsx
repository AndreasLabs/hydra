import adze from 'adze';

const logger = adze.namespace('pages').namespace('datasets');
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import { Dataset, DatasetsTable } from '@/components/datasets-table';
import { DatasetDialog } from '@/components/dataset-dialog';
import { DatasetQueryDialog } from '@/components/dataset-query-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, Search, Database } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';

export default function Datasets() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetDialogOpen, setDatasetDialogOpen] = useState(false);
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  const [managingQueriesDataset, setManagingQueriesDataset] = useState<Dataset | null>(null);

  // Fetch datasets on component mount
  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/datasets');
      if (response.ok) {
        const data = await response.json();
        
        // Transform the data to match our frontend Dataset type
        const transformedData = data.map((item: any) => ({
          key: item.name?.replace('datasets/', '') || item.key || 'unknown',
          name: item.name?.replace('datasets/', '') || item.key || 'Unknown Dataset',
          description: item.description || '',
          createdAt: item.created || new Date().toISOString(),
          updatedAt: item.updated || new Date().toISOString(),
          queries: item.queries || [],
        }));
        
        setDatasets(transformedData);
      } else {
        logger.error('Failed to fetch datasets');
      }
    } catch (error) {
      logger.error('Failed to fetch datasets', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDataset(null);
    setDatasetDialogOpen(true);
  };

  const handleEdit = (dataset: Dataset) => {
    setEditingDataset(dataset);
    setDatasetDialogOpen(true);
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      // Note: The API doesn't currently support DELETE for datasets
      // In a full implementation, you'd call the delete endpoint here
      alert('Dataset deletion is not yet implemented in the API');
    } catch (error) {
      logger.error('Failed to delete dataset', { error });
      alert('Failed to delete dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleManageQueries = (dataset: Dataset) => {
    setManagingQueriesDataset(dataset);
    setQueryDialogOpen(true);
  };

  const handleSave = async () => {
    setDatasetDialogOpen(false);
    setEditingDataset(null);
    await fetchDatasets(); // Refresh the data
  };

  const handleQuerySave = async () => {
    await fetchDatasets(); // Refresh the data
  };

  // Calculate statistics
  const totalDatasets = datasets.length;
  const datasetsWithQueries = datasets.filter(d => d.queries.length > 0).length;
  const totalQueries = datasets.reduce((sum, d) => sum + d.queries.length, 0);
  const pathQueries = datasets.reduce((sum, d) => sum + d.queries.filter(q => q.type === 'objectstore/path').length, 0);
  const objectQueries = datasets.reduce((sum, d) => sum + d.queries.filter(q => q.type === 'objectstore/object').length, 0);
  const bucketQueries = datasets.reduce((sum, d) => sum + d.queries.filter(q => q.type === 'objectstore/bucket').length, 0);

  return (
    <div className="p-6">
      <PageHeader
        title="Datasets"
        description="Organize and query your data with flexible dataset definitions"
        right={(
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Dataset
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Total Datasets" 
          value={totalDatasets} 
          icon={<FolderOpen className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          title="With Queries" 
          value={datasetsWithQueries} 
          icon={<Search className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          title="Total Queries" 
          value={totalQueries} 
          icon={<Database className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatCard 
          title="Query Types" 
          value={
            <div className="flex gap-1">
              <span className="text-blue-600">{pathQueries}P</span>
              <span className="text-green-600">{objectQueries}O</span>
              <span className="text-purple-600">{bucketQueries}B</span>
            </div>
          }
          icon={<Database className="h-4 w-4 text-muted-foreground" />} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datasets</CardTitle>
          <CardDescription>
            Manage your dataset definitions and their associated queries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatasetsTable
            data={datasets}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onManageQueries={handleManageQueries}
          />
        </CardContent>
      </Card>

      <DatasetDialog
        open={datasetDialogOpen}
        onOpenChange={setDatasetDialogOpen}
        dataset={editingDataset}
        onSave={handleSave}
      />

      <DatasetQueryDialog
        open={queryDialogOpen}
        onOpenChange={setQueryDialogOpen}
        dataset={managingQueriesDataset}
        onSave={handleQuerySave}
      />
    </div>
  );
}
