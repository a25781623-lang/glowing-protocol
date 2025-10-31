import { lazy, Suspense } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSceneStore } from '@/lib/store'; // Import the store

const Canvas3D = lazy(() => import('./Canvas3D'));

export default function Hero() {
  // Get the setter function from the store
  const setMeshScale = useSceneStore((state) => state.setMeshScale);

  // Handlers for click expansion (Netflix logo effect)
  const handleButtonPress = () => {
    setMeshScale(1.2); // Expand
  };
  const handleButtonRelease = () => {
    setMeshScale(1.0); // Return to normal
  };

  // Handlers for hover contraction
  const handleCanvasEnter = () => {
    setMeshScale(0.9); // Contract
  };
  const handleCanvasLeave = () => {
    setMeshScale(1.0); // Return to normal
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      // --- CHANGE 1: Move hover handlers here ---
      onPointerEnter={handleCanvasEnter}
      onPointerLeave={handleCanvasLeave}
    >
      {/* WebGL Background with mouse tracking */}
      <div
        className="absolute inset-0 z-0"
        // --- CHANGE 1: Remove handlers from here ---
        // onPointerEnter={handleCanvasEnter}
        // onPointerLeave={handleCanvasLeave}
      >
        <Suspense
          fallback={
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background" />
          }
        >
          <Canvas3D mouseTracking={true} />
        </Suspense>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-radial opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium backdrop-blur-sm animate-scale-in">
            <Sparkles className="w-4 h-4" />
            <span>Next-Generation Blockchain Infrastructure</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Build the Future of{' '}
            <span className="gradient-text animate-glow-pulse">
              Decentralized Networks
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience unprecedented speed, security, and scalability with our
            cutting-edge blockchain protocol. Join thousands of developers
            building tomorrow's infrastructure today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              className="group bg-primary hover:bg-primary/90 text-primary-foreground glow-primary transition-all hover:scale-105"
              onPointerDown={handleButtonPress}
              onPointerUp={handleButtonRelease}
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
              // --- CHANGE 2: Add handlers here ---
              onPointerDown={handleButtonPress}
              onPointerUp={handleButtonRelease}
            >
              View Documentation
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary animate-fade-in">
                50K+
              </div>
              <div className="text-sm text-muted-foreground">
                Transactions/sec
              </div>
            </div>
            <div className="space-y-2">
              <div
                className="text-3xl font-bold text-primary animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                &lt;2s
              </div>
              <div className="text-sm text-muted-foreground">
                Finality Time
              </div>
            </div>
            <div className="space-y-2">
              <div
                className="text-3xl font-bold text-primary animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                $0.001
              </div>
              <div className="text-sm text-muted-foreground">
                Avg. Fee
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-float">
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full p-1">
          <div className="w-1 h-3 bg-primary rounded-full mx-auto animate-glow-pulse" />
        </div>
      </div>
    </section>
  );
}
