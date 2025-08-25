import adze from 'adze';
import { useEffect, useMemo, useState, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Folder, File as FileIcon, ChevronRight, ChevronDown, RefreshCcw, Search, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { ListFileResult } from '@/lib/types/files/types-files';
import { CodeBlock, CodeBlockCopyButton } from "@/components/ui/shadcn-io/ai/code-block";

type TreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: Date;  
  children?: TreeNode[];
};

const logger = adze.namespace('pages').namespace('files');

export default function FilesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<ListFileResult[]>([]);

  // Query controls
  const [pathPrefix, setPathPrefix] = useState<string>(''); 
  const [recursive, setRecursive] = useState<boolean>(true);
  const [nameContains, setNameContains] = useState<string>('');

  // UI state
  const [expanded, setExpanded] = useState<Set<string>>(new Set<string>(['/']));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewTruncated, setPreviewTruncated] = useState<boolean>(false);
  const [previewKind, setPreviewKind] = useState<'text' | 'image' | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (pathPrefix) params.set('path', pathPrefix);
      if (recursive) params.set('recursive', '1');
      if (nameContains) params.set('nameContains', nameContains);
      const url = `/api/files${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch files: ${res.status}`);
      const data = (await res.json()) as Array<any>;
      const normalized = data.map((d) => ({
        ...d,
        lastModified: d.lastModified ? new Date(d.lastModified) : undefined,
      })) as ListFileResult[];
      setFiles(normalized);
    } catch (err: any) {
      logger.error('Failed to fetch files', { err });
      setError(err?.message || 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tree = useMemo<TreeNode>(() => buildTree(files), [files]);

  const handleToggle = (nodePath: string) => {
    setExpanded((prev) => {
      const copy = new Set(prev);
      if (copy.has(nodePath)) copy.delete(nodePath); else copy.add(nodePath);
      return copy;
    });
  };

  const handleApplyFilters = async () => {
    await fetchFiles();
  };

  const handleSelectFile = async (filePath: string) => {
    setSelectedPath(filePath);
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewContent('');
      setPreviewTruncated(false);
      setPreviewKind(null);
      setPreviewImageUrl(null);
      const key = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const res = await fetch(`/api/files/preview-file?key=${encodeURIComponent(key)}`);
      if (!res.ok) {
        const msg = res.status === 415 ? 'Unsupported file type for preview' : `Failed to preview: ${res.status}`;
        throw new Error(msg);
      }
      const data = await res.json();
      if (data.kind === 'text') {
        setPreviewKind('text');
        setPreviewContent(String(data.content ?? ''));
        setPreviewTruncated(Boolean(data.truncated));
      } else if (data.kind === 'image') {
        setPreviewKind('image');
        setPreviewImageUrl(String(data.url));
      } else {
        setPreviewError('Unsupported preview format');
      }
    } catch (e: any) {
      setPreviewError(e?.message || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Files"
        description="Browse object storage as a collapsible file tree"
        right={(
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchFiles} disabled={loading} className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Set the path prefix and optional name filter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-5">
              <label className="text-sm text-muted-foreground">Path prefix</label>
              <Input
                placeholder="e.g. datasets/site-1/"
                value={pathPrefix}
                onChange={(e) => setPathPrefix(e.target.value)}
              />
            </div>
            <div className="md:col-span-5">
              <label className="text-sm text-muted-foreground">Name contains</label>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="substring..."
                  value={nameContains}
                  onChange={(e) => setNameContains(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-2 flex items-end gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="recursive" checked={recursive} onCheckedChange={(v) => setRecursive(Boolean(v))} />
                <label htmlFor="recursive" className="text-sm">Recursive</label>
              </div>
              <Button onClick={handleApplyFilters} disabled={loading}>Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-5 lg:col-span-4">
          <Card className="h-[70vh] flex flex-col">
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                {loading ? 'Loading files…' : `${files.length} files`}
                {error ? ` – ${error}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="text-sm">
                <TreeView node={tree} expanded={expanded} onToggle={handleToggle} onSelectFile={handleSelectFile} selectedPath={selectedPath} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-7 lg:col-span-8">
          <Card className="h-[70vh] flex flex-col">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {selectedPath ? selectedPath : 'Select a file to preview'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {!selectedPath ? (
                <div className="text-muted-foreground">No file selected</div>
              ) : previewLoading ? (
                <div className="text-muted-foreground">Loading preview…</div>
              ) : previewError ? (
                <div className="text-red-600">{previewError}</div>
              ) : isEptJson(selectedPath) ? (
                <EptEmbeddedViewer path={selectedPath} />
              ) : previewKind === 'text' && previewContent ? (
                <TextPreview content={previewContent} truncated={previewTruncated} path={selectedPath} />
              ) : previewKind === 'image' && previewImageUrl ? (
                <ImagePreview url={previewImageUrl} path={selectedPath} />
              ) : (
                <div className="text-muted-foreground">No preview available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function buildTree(files: ListFileResult[]): TreeNode {
  const root: TreeNode = { name: '/', path: '/', isDirectory: true, children: [] };
  const dirMap = new Map<string, TreeNode>();
  dirMap.set(root.path, root);

  const ensureDir = (dirPath: string, name: string, parent: TreeNode) => {
    let node = dirMap.get(dirPath);
    if (!node) {
      node = { name, path: dirPath, isDirectory: true, children: [] };
      parent.children!.push(node);
      dirMap.set(dirPath, node);
    }
    return node;
  };

  for (const file of files) {
    const key = file.name || file.key;
    const parts = key.split('/').filter(Boolean);
    let current = root;
    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (isLast) {
        // file node
        const fileNode: TreeNode = {
          name: part,
          path: `/${currentPath}`,
          isDirectory: false,
          size: file.size,
          lastModified: file.lastModified ? new Date(file.lastModified) : undefined,
        };
        current.children!.push(fileNode);
      } else {
        // directory node
        const dirPath = `/${currentPath}`;
        const existing = dirMap.get(dirPath);
        if (existing) {
          current = existing;
        } else {
          current = ensureDir(dirPath, part, current);
        }
      }
    }
  }

  // Sort children: directories first, then files, both alphabetically
  const sortChildren = (node: TreeNode) => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortChildren);
  };
  sortChildren(root);

  return root;
}

function TreeView({ node, expanded, onToggle, onSelectFile, selectedPath }: { node: TreeNode; expanded: Set<string>; onToggle: (path: string) => void; onSelectFile: (path: string) => void; selectedPath: string | null }) {
  if (!node) return null;
  const isRoot = node.path === '/';
  return (
    <div>
      {isRoot ? (
        <div className="space-y-1">
          {node.children?.map((child) => (
            <TreeNodeRow key={child.path} node={child} expanded={expanded} onToggle={onToggle} onSelectFile={onSelectFile} selectedPath={selectedPath} depth={0} />
          ))}
        </div>
      ) : (
        <TreeNodeRow node={node} expanded={expanded} onToggle={onToggle} onSelectFile={onSelectFile} selectedPath={selectedPath} depth={0} />
      )}
    </div>
  );
}

function TreeNodeRow({ node, expanded, onToggle, onSelectFile, selectedPath, depth }: { node: TreeNode; expanded: Set<string>; onToggle: (path: string) => void; onSelectFile: (path: string) => void; selectedPath: string | null; depth: number }) {
  const isOpen = node.isDirectory && expanded.has(node.path);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = !node.isDirectory && selectedPath === node.path;

  return (
    <div>
      <div className={`flex items-center py-1 rounded ${isSelected ? 'bg-accent' : ''}`}>
        {Array.from({ length: depth }, (_, i) => (
          <span key={i} className="inline-block w-4" aria-hidden="true" />
        ))}
        {node.isDirectory ? (
          <button
            className="mr-1 inline-flex items-center justify-center h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={() => onToggle(node.path)}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="mr-1 inline-flex h-5 w-5" />
        )}
        {node.isDirectory ? (
          <Folder className="h-4 w-4 mr-2 text-blue-600" />
        ) : (
          <button className="inline-flex items-center" onClick={() => onSelectFile(node.path)} title="Open file preview">
            <FileIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          </button>
        )}
        {node.isDirectory ? (
          <span className="truncate cursor-pointer select-none" onClick={() => onToggle(node.path)}>{node.name}</span>
        ) : (
          <span className="truncate cursor-pointer select-none" onClick={() => onSelectFile(node.path)}>{node.name}</span>
        )}
        {!node.isDirectory ? (
          <span className="ml-2 text-muted-foreground">{formatSize(node.size)}{node.lastModified ? ` • ${formatDate(node.lastModified)}` : ''}</span>
        ) : null}
      </div>
      {node.isDirectory && isOpen && hasChildren ? (
        <div>
          {node.children!.map((child) => (
            <TreeNodeRow key={child.path} node={child} expanded={expanded} onToggle={onToggle} onSelectFile={onSelectFile} selectedPath={selectedPath} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatSize(size?: number) {
  if (typeof size !== 'number') return '';
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  const value = (size / Math.pow(1024, i)).toFixed(1);
  const unit = ['B', 'KB', 'MB', 'GB', 'TB'][i] || 'B';
  return `${value} ${unit}`;
}

function formatDate(date?: Date) {
  try {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString();
  } catch {
    return '';
  }
}

function TextPreview({ content, truncated, path }: { content: string; truncated: boolean; path: string }) {
  const ext = (() => {
    const dot = path.lastIndexOf('.')
    return dot >= 0 ? path.slice(dot + 1).toLowerCase() : ''
  })()
  let display = content
  let language = ext
  if (ext === 'json') {
    try {
      const parsed = JSON.parse(content)
      display = JSON.stringify(parsed, null, 2)
    } catch {
      // keep raw
    }
  }
  return (
    <div className="space-y-2">
      <CodeBlock code={display} language={language} showLineNumbers={true} />
      {truncated ? <div className="text-xs text-muted-foreground">Preview truncated</div> : null}
    </div>
  )
}

function ImagePreview({ url, path }: { url: string; path: string }) {
  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = path.split('/').pop() || 'downloaded-image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="bg-muted rounded p-3 flex items-center justify-center min-h-[200px] relative group">
        <NextImage
          src={url}
          alt={`Preview of ${path}`}
          width={800}
          height={600}
          className="max-w-full max-h-[60vh] object-contain rounded cursor-pointer"
          unoptimized
        />
        
        {/* Action buttons overlay */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                title="View fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="!max-w-none !w-screen !h-screen !m-0 p-0 bg-black border-0 fixed inset-0 translate-x-0 translate-y-0" 
              showCloseButton={false}
            >
              <FullscreenImageViewer url={url} path={path} onDownload={handleDownload} />
            </DialogContent>
          </Dialog>
          
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
            onClick={handleDownload}
            title="Download image"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Image preview for {path}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-auto p-1 text-xs"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3 mr-1" />
          Download
        </Button>
      </div>
    </div>
  );
}

function FullscreenImageViewer({ url, path, onDownload }: { url: string; path: string; onDownload: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(10, prev * delta)));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          // Dialog will handle this
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden ${zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Image */}
      <div
        className="transition-transform duration-100 ease-out"
        // eslint-disable-next-line react/forbid-dom-props -- Dynamic transform values require inline styles
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <NextImage
          src={url}
          alt={`Fullscreen view of ${path}`}
          width={1920}
          height={1080}
          className="max-w-[100vw] max-h-[100vh] object-contain select-none"
          unoptimized
          draggable={false}
        />
      </div>

      {/* Control buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-10 w-10 p-0 bg-black/70 hover:bg-black/90 text-white border-0"
          onClick={handleZoomIn}
          title="Zoom in (+)"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-10 w-10 p-0 bg-black/70 hover:bg-black/90 text-white border-0"
          onClick={handleZoomOut}
          title="Zoom out (-)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-10 w-10 p-0 bg-black/70 hover:bg-black/90 text-white border-0"
          onClick={handleResetZoom}
          title="Reset zoom (0)"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-10 px-3 bg-black/70 hover:bg-black/90 text-white border-0"
          onClick={onDownload}
          title="Download image"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
        {Math.round(zoom * 100)}%
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-xs max-w-xs">
        <div>Mouse wheel: Zoom</div>
        <div>Drag: Pan (when zoomed)</div>
        <div>+/- keys: Zoom in/out</div>
        <div>0 key: Reset zoom</div>
        <div>Esc: Close</div>
      </div>
    </div>
  );
}

function isTextPreviewable(path: string) {
  const lower = path.toLowerCase()
  return lower.endsWith('.txt') || lower.endsWith('.json')
}

function isEptJson(path: string) {
  const p = (path || '').toLowerCase();
  return p.endsWith('/ept.json') || p.endsWith('ept.json');
}

function EptPreviewActions({ path }: { path: string }) {
  const key = path.startsWith('/') ? path.slice(1) : path;
  const namePart = key.split('/').slice(-3, -1).join('/') || key.split('/').slice(-2, -1).join('/') || 'Point Cloud';
  // Ensure we pass the manifest key itself to get-url (viewer will presign and normalize if needed)
  const manifestKey = key.endsWith('ept.json') ? key : `${key.replace(/\/$/, '')}/ept.json`;
  const viewerUrl = `/point-cloud?key=${encodeURIComponent(manifestKey)}&name=${encodeURIComponent(namePart)}`;
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">Entwine Point Tiles manifest detected</div>
      <Button asChild>
        <a href={viewerUrl} target="_blank" rel="noreferrer">Open in 3D Viewer</a>
      </Button>
    </div>
  );
}

function EptEmbeddedViewer({ path }: { path: string }) {
  const key = path.startsWith('/') ? path.slice(1) : path;
  const namePart = key.split('/').slice(-3, -1).join('/') || key.split('/').slice(-2, -1).join('/') || 'Point Cloud';
  const manifestKey = key.endsWith('ept.json') ? key : `${key.replace(/\/$/, '')}/ept.json`;
  const src = `/point-cloud?key=${encodeURIComponent(manifestKey)}&name=${encodeURIComponent(namePart)}`;
  return (
    <div className="w-full h-[60vh]">
      <iframe
        src={src}
        title={`Point Cloud: ${namePart}`}
        className="w-full h-full rounded border"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Embedded 3D viewer</span>
        <EptPreviewActions path={path} />
      </div>
    </div>
  );
}


