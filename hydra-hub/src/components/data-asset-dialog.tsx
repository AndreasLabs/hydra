import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { DataAsset } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  storage_type: z.enum(['OBJECT', 'TABLE']),
  storage_location: z.string().min(1, 'Storage location is required'),
  asset_type: z.string().min(1, 'Asset type is required'),
  owner_uuid: z.string().uuid('Must be a valid UUID'),
});

type FormData = z.infer<typeof formSchema>;

interface DataAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: DataAsset | null;
  onSave: () => void;
}

export function DataAssetDialog({ open, onOpenChange, asset, onSave }: DataAssetDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!asset;

  const defaultUserUUID = '550e8400-e29b-41d4-a716-446655440000';

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      path: asset?.path || '',
      storage_type: asset?.storage_type || 'OBJECT',
      storage_location: asset?.storage_location || '',
      asset_type: asset?.asset_type || '',
      owner_uuid: asset?.owner_uuid || defaultUserUUID,
    },
  });

  // Reset form when asset changes
  React.useEffect(() => {
    if (asset) {
      form.reset({
        path: asset.path,
        storage_type: asset.storage_type,
        storage_location: asset.storage_location,
        asset_type: asset.asset_type,
        owner_uuid: asset.owner_uuid,
      });
          } else {
      form.reset({
        path: '',
        storage_type: 'OBJECT',
        storage_location: '',
        asset_type: '',
        owner_uuid: defaultUserUUID,
      });
    }
  }, [asset, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = isEditing ? `/api/data-assets/${asset.id}` : '/api/data-assets';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSave();
        form.reset();
      } else {
        const error = await response.json();
        console.error('Failed to save data asset:', error);
        alert('Failed to save data asset: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save data asset:', error);
      alert('Failed to save data asset');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Data Asset' : 'Create Data Asset'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the data asset information below.'
              : 'Add a new data asset to your collection.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Path</FormLabel>
                  <FormControl>
                    <Input placeholder="/data/my-dataset.csv" {...field} />
                  </FormControl>
                  <FormDescription>
                    The file or directory path for this data asset.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storage_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="OBJECT">Object Storage</SelectItem>
                      <SelectItem value="TABLE">Table Storage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose between object storage (files) or table storage (database).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storage_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Location</FormLabel>
                  <FormControl>
                    <Input placeholder="s3://my-bucket/data/" {...field} />
                  </FormControl>
                  <FormDescription>
                    The storage location (e.g., S3 bucket, database connection).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="asset_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Type</FormLabel>
                  <FormControl>
                    <Input placeholder="csv, json, parquet, etc." {...field} />
                  </FormControl>
                  <FormDescription>
                    The type or format of the data asset.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="owner_uuid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner UUID</FormLabel>
                  <FormControl>
                    <Input placeholder={defaultUserUUID} {...field} />
                  </FormControl>
                  <FormDescription>
                    The UUID of the user or system that owns this asset.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
