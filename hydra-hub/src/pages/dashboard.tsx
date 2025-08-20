import adze from 'adze';

const logger = adze.namespace('pages').namespace('dashboard');
import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { DataAsset } from '../../generated/prisma';
import { DataAssetsTable } from '@/components/data-assets-table';
import { DataAssetDialog } from '@/components/data-asset-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Database } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { fetchDataAssets } from '@/lib/queries/data-assets/fetch-data-assets';

interface DashboardProps {
  dataAssets: DataAsset[];
}

export default function Dashboard({ dataAssets }: DashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<DataAsset | null>(null);

  const refreshData = () => {
    router.replace(router.asPath);
  };

  const handleCreate = () => {
    setEditingAsset(null);
    setDialogOpen(true);
  };

  const handleEdit = (asset: DataAsset) => {
    setEditingAsset(asset);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this data asset?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/data-assets/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        refreshData(); // Refresh the page data
      } else {
        alert('Failed to delete data asset');
      }
    } catch (error) {
      logger.error('Failed to delete data asset', { error });
      alert('Failed to delete data asset');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setDialogOpen(false);
    refreshData(); // Refresh the page data
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Data Assets"
        description="Manage your data assets and storage configurations"
        right={(
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Data Asset
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Assets" value={dataAssets.length} icon={<Database className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Object Storage" value={dataAssets.filter(asset => asset.storage_type === 'OBJECT').length} icon={<Database className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Table Storage" value={dataAssets.filter(asset => asset.storage_type === 'TABLE').length} icon={<Database className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Asset Types" value={new Set(dataAssets.map(asset => asset.asset_type)).size} icon={<Database className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Assets</CardTitle>
          <CardDescription>
            A list of all your data assets with their storage configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataAssetsTable
            data={dataAssets}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <DataAssetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        asset={editingAsset}
        onSave={handleSave}
      />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
      const dataAssets = await fetchDataAssets();

    // Convert dates to strings for JSON serialization
    const serializedDataAssets = dataAssets.map(asset => ({
      ...asset,
      date_created: asset.date_created.toISOString(),
      date_updated: asset.date_updated.toISOString(),
    }));

    return {
      props: {
        dataAssets: serializedDataAssets,
      },
    };
  } catch (error) {
    logger.error('Failed to fetch data assets', { error });
    return {
      props: {
        dataAssets: [],
      },
    };
  }
};
