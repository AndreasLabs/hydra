import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { DataAsset } from '@/types/data-asset';
import { DataAssetsTable } from '@/components/data-assets-table';
import { DataAssetDialog } from '@/components/data-asset-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Database } from 'lucide-react';
import { db } from '@/lib/db';

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
      console.error('Failed to delete data asset:', error);
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
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Assets Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your data assets and storage configurations
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Data Asset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataAssets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Object Storage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataAssets.filter(asset => asset.storage_type === 'OBJECT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Table Storage</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dataAssets.filter(asset => asset.storage_type === 'TABLE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Types</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(dataAssets.map(asset => asset.asset_type)).size}
            </div>
          </CardContent>
        </Card>
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
    const dataAssets = await db.dataAsset.findMany({
      orderBy: {
        date_created: 'desc'
      }
    });

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
    console.error('Failed to fetch data assets:', error);
    return {
      props: {
        dataAssets: [],
      },
    };
  }
};
