import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import adze from 'adze';

const logger = adze.namespace('components').namespace('dataset-query-dialog');

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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const queryFormSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  type: z.enum(['objectstore/path', 'objectstore/object', 'objectstore/bucket']),
  exclude: z.boolean(),
});

type QueryFormData = z.infer<typeof queryFormSchema>;

export type DatasetQuery = {
  query: string;
  type: 'objectstore/path' | 'objectstore/object' | 'objectstore/bucket';
  exclude: boolean;
};

export type Dataset = {
  key: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  queries: DatasetQuery[];
};

interface DatasetQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataset?: Dataset | null;
  onSave: () => void;
}

export function DatasetQueryDialog({ open, onOpenChange, dataset, onSave }: DatasetQueryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [queries, setQueries] = useState<DatasetQuery[]>(dataset?.queries || []);

  const form = useForm<QueryFormData>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: {
      query: '',
      type: 'objectstore/path',
      exclude: false,
    },
  });

  // Update queries when dataset changes
  React.useEffect(() => {
    if (dataset) {
      setQueries(dataset.queries || []);
    } else {
      setQueries([]);
    }
  }, [dataset]);

  const addQuery = async (data: QueryFormData) => {
    if (!dataset) return;

    setLoading(true);
    try {
      const response = await fetch('/api/datasets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetKey: dataset.key,
          query: {
            query: data.query,
            type: data.type,
            exclude: data.exclude,
          },
        }),
      });

      if (response.ok) {
        // Update local state
        const newQuery = {
          query: data.query,
          type: data.type,
          exclude: data.exclude,
        };
        setQueries(prev => [...prev, newQuery]);
        form.reset();
        onSave(); // Refresh parent data
      } else {
        const error = await response.json();
        logger.error('Failed to add query', { error });
        alert('Failed to add query: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      logger.error('Failed to add query', { error });
      alert('Failed to add query');
    } finally {
      setLoading(false);
    }
  };

  const removeQuery = (index: number) => {
    setQueries(prev => prev.filter((_, i) => i !== index));
    // Note: In a full implementation, you'd want to call an API to remove the query
    // For now, this just updates the local state
  };

  const getQueryTypeColor = (type: string) => {
    switch (type) {
      case 'objectstore/path':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'objectstore/object':
        return 'bg-green-500 hover:bg-green-600 text-white';
      case 'objectstore/bucket':
        return 'bg-purple-500 hover:bg-purple-600 text-white';
      default:
        return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  const getQueryTypeLabel = (type: string) => {
    return type.split('/')[1]?.charAt(0).toUpperCase() + type.split('/')[1]?.slice(1);
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Dataset Queries</DialogTitle>
          <DialogDescription>
            Add and manage queries for "{dataset?.name}" dataset. Queries define how data is selected from your object store.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Queries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Queries ({queries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {queries.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No queries defined yet. Add your first query below.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queries.map((query, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-md border bg-muted/30">
                      <Badge className={getQueryTypeColor(query.type)}>
                        {getQueryTypeLabel(query.type)}
                      </Badge>
                      {query.exclude && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Exclude
                        </Badge>
                      )}
                      <span className="font-mono text-sm flex-1">{query.query}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuery(index)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Query */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Query
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(addQuery)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Query Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select query type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="objectstore/path">Path</SelectItem>
                            <SelectItem value="objectstore/object">Object</SelectItem>
                            <SelectItem value="objectstore/bucket">Bucket</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose how to match objects in your storage.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="query"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Query Pattern</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., /data/processed/*.json"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The pattern to match. Use wildcards (*) for flexible matching.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exclude"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Exclude matches
                          </FormLabel>
                          <FormDescription>
                            If checked, objects matching this query will be excluded from the dataset.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Plus className="mr-2 h-4 w-4" />
                    Add Query
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
