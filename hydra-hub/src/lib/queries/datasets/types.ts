export type DatasetQueryType = 'objectstore/path' | 'objectstore/object' | 'objectstore/bucket';

export type DatasetQuery = {
  query: string;
  type: DatasetQueryType;
  exclude: boolean;
}

export type Dataset = {
  key: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  queries: DatasetQuery[];
}


