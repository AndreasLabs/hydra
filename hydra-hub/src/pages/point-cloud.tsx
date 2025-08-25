import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import Script from "next/script";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Potree: any;
    THREE: any;
      $: any;
      jQuery: any;
  }
}

export default function PointCloudPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  // This function will be called after all scripts are loaded
  const handlePotreeLoaded = () => {
    try {
      // Fix script/resource/worker paths when serving from /potree/build
      if (typeof window !== "undefined" && window.Potree) {
        const origin = window.location.origin || "";
        // Use absolute URLs to satisfy new URL() calls inside Potree
        window.Potree.scriptPath = `${origin}/potree/build`;
        window.Potree.resourcePath = `${origin}/potree/build/resources`;
        console.log("Potree loaded. scriptPath:", window.Potree.scriptPath);
      }
    } catch (e) {
      console.warn("Unable to configure Potree paths:", e);
          } finally {
        setScriptsLoaded(true);
      }
    };

  // Initialize the viewer once scripts are loaded and the component is mounted
  useEffect(() => {
    if (scriptsLoaded && viewerContainerRef.current) {
      initPotreeViewer();
    }
  }, [scriptsLoaded]);

  const initPotreeViewer = () => {
    try {
      console.log("Initializing Potree viewer...");
      
      if (window.Potree && viewerContainerRef.current) {
        // Create viewer
        const viewer = new window.Potree.Viewer(viewerContainerRef.current);
        
        // Viewer settings
        viewer.setEDLEnabled(true);
        viewer.setFOV(60);
        viewer.setPointBudget(2_000_000);
        viewer.loadSettingsFromURL();
        // Load Potree GUI if available, but avoid jQuery typings in TS
        try {
          if (typeof (viewer as any).loadGUI === 'function') {
            (viewer as any).loadGUI(() => {
              try {
                (viewer as any).setLanguage('en');
                const menuTools = document.querySelector('#menu_tools');
                if (menuTools && (menuTools as any).nextElementSibling) {
                  (menuTools as any).nextElementSibling.style.display = 'block';
                }
              } catch {}
            });
          }
        } catch {}
        viewer.setDescription("ODM Point Cloud Viewer");
        
        // Following the exact pattern from the Potree examples
        const path = "/data/odm_results/site-1/entwine_pointcloud/ept.json";
        const name = "Site 1";
        
        console.log("Loading point cloud from:", path);
        
        // Using the exact pattern from the Potree examples
        window.Potree.loadPointCloud(path, name, (e: any) => {
          try {
            console.log("Point cloud loaded:", e);
            
            if (e && e.pointcloud) {
              const pointcloud = e.pointcloud;
              viewer.scene.addPointCloud(pointcloud);
              
              const material = pointcloud.material;
              material.size = 1;
              material.pointSizeType = window.Potree.PointSizeType.ADAPTIVE;
              material.shape = window.Potree.PointShape.SQUARE;
              //material.pointColorType = window.Potree.PointColorType.RGB;
              
              // Note: GLB model loading is disabled due to GLTFLoader ES6 module issues
              // To enable: fix GLTFLoader loading or use a different approach
              console.log("GLB model loading is disabled - point cloud only");

              viewer.fitToScreen(0.5);
              setIsLoading(false);
            } else {
              console.error("Failed to load point cloud - no pointcloud in response");
              setIsLoading(false);
            }
          } catch (loadError) {
            console.error("Error in point cloud callback:", loadError);
            setIsLoading(false);
          }
        });

        viewerRef.current = viewer;
      } else {
        console.error("Potree not loaded or viewer container not found");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to initialize Potree:", error);
      setIsLoading(false);
    }
  };



  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    
    if (!isFullscreen) {
      if (viewerContainerRef.current.requestFullscreen) {
        viewerContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleZoomIn = () => {
    if (viewerRef.current) {
      // In a real implementation: viewerRef.current.setMoveSpeed(viewerRef.current.getMoveSpeed() * 1.2);
      console.log("Zoom in");
    }
  };

  const handleZoomOut = () => {
    if (viewerRef.current) {
      // In a real implementation: viewerRef.current.setMoveSpeed(viewerRef.current.getMoveSpeed() / 1.2);
      console.log("Zoom out");
    }
  };

  const handleReset = () => {
    if (viewerRef.current) {
      // In a real implementation: viewerRef.current.fitToScreen();
      console.log("Reset view");
    }
  };

  return (
    <>
      <Head>
        <title>3D Point Cloud Viewer | Hydra Hub</title>
      </Head>
      
      {/* Load jQuery before anything that expects it */}
      <Script
        src="/potree/libs/jquery/jquery-3.1.1.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          try {
            // ensure globals exist
            if (typeof window !== 'undefined') {
              (window as any).jQuery = (window as any).jQuery || (window as any).$;
              (window as any).$ = (window as any).$ || (window as any).jQuery;
            }
          } catch {}
        }}
      />
              <Script src="/potree/libs/jquery-ui/jquery-ui.min.js" strategy="beforeInteractive" />
        {/* Load Three.js and loaders before Potree */}
        <Script src="/potree/libs/three.js/build/three.min.js" strategy="beforeInteractive" />
        <Script src="/potree/libs/three.js/loaders/OBJLoader.js" strategy="beforeInteractive" />
        <Script src="/potree/libs/three.js/loaders/MTLLoader.js" strategy="beforeInteractive" />
        {/* Load remaining Potree dependencies */}
        <Script src="/potree/libs/other/BinaryHeap.js" strategy="afterInteractive" />
        <Script src="/potree/libs/tween/tween.min.js" strategy="afterInteractive" />
        <Script src="/potree/libs/d3/d3.js" strategy="afterInteractive" />
        <Script src="/potree/libs/proj4/proj4.js" strategy="afterInteractive" />
        <Script src="/potree/libs/i18next/i18next.js" strategy="afterInteractive" />
        <Script src="/potree/libs/copc/copc.js" strategy="afterInteractive" />
        <Script src="/potree/build/potree.js" strategy="afterInteractive" onLoad={handlePotreeLoaded} />
        <Script src="/potree/libs/plasio/js/laslaz.js" strategy="afterInteractive" />
      
      <style jsx global>{`
        /* Ensure Potree viewer fills the Card without double headers */
        .potree_container {
          position: relative !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 70vh !important;
          overflow: hidden !important;
        }
        /* Hide Potree's built-in header/sidebar by default; we provide our own UI */
        #potree_toolbar_container,
        #potree_sidebar_container,
        #potree_quick_buttons,
        #potree_map {
          display: none !important;
        }
        /* Make Potree's renderer and canvas fit container */
        .potree_container canvas {
          width: 100% !important;
          height: 100% !important;
          display: block;
        }
      `}</style>
      
      <AppShell>
        <div className="container flex-1 space-y-6 p-4 md:p-8 lg:p-10">
          <Card className="relative flex-1 overflow-hidden">
            <div 
              ref={viewerContainerRef}
              className={cn(
                "w-full bg-black/10 dark:bg-white/5 transition-all duration-200 potree_container relative",
                isFullscreen ? "h-screen" : "h-[70vh]"
              )}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading point cloud viewer...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pointer-events-auto absolute top-4 right-4 z-20 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleReset}
                title="Reset view"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-2">About This Point Cloud</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This point cloud was generated using OpenDroneMap (ODM) from aerial imagery.
                The data is stored in Entwine Point Tile (EPT) format, which allows for efficient
                streaming and visualization of large point clouds.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Total Points</p>
                  <p className="text-muted-foreground">676,892</p>
                </div>
                <div>
                  <p className="font-medium">Coordinate System</p>
                  <p className="text-muted-foreground">EPSG:32610 (UTM Zone 10N)</p>
                </div>
                <div>
                  <p className="font-medium">Point Density</p>
                  <p className="text-muted-foreground">~100 points/m²</p>
                </div>
                <div>
                  <p className="font-medium">RGB Coloring</p>
                  <p className="text-muted-foreground">Available</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-2">Navigation Controls</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Orbit</span>
                  <span className="text-muted-foreground">Left mouse button</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Pan</span>
                  <span className="text-muted-foreground">Right mouse button</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Zoom</span>
                  <span className="text-muted-foreground">Mouse wheel</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Focus point</span>
                  <span className="text-muted-foreground">Double click</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">First person mode</span>
                  <span className="text-muted-foreground">F key</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </AppShell>
    </>
  );
}
