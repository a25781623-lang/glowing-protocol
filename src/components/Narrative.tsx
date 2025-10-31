import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/lib/store';
import { CheckCircle2, Database, Shield, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const sections = [
  {
    id: 'consensus',
    icon: CheckCircle2,
    title: 'Consensus',
    description: 'Lightning-fast Byzantine Fault Tolerant consensus ensures network agreement in milliseconds.',
    features: [
      'Proof-of-Stake validation',
      'Instant finality',
      'Energy efficient',
    ],
    cameraTarget: [3, 2, 0] as [number, number, number],
  },
  {
    id: 'mempool',
    icon: Database,
    title: 'Mempool',
    description: 'Intelligent transaction ordering and parallel execution maximize throughput and minimize latency.',
    features: [
      'Priority gas auctions',
      'MEV protection',
      'Parallel processing',
    ],
    cameraTarget: [-3, -2, 0] as [number, number, number],
  },
  {
    id: 'validation',
    icon: Shield,
    title: 'Validation',
    description: 'Multi-layered cryptographic verification ensures every transaction is secure and verifiable.',
    features: [
      'Zero-knowledge proofs',
      'Signature verification',
      'State root validation',
    ],
    cameraTarget: [0, 3, -2] as [number, number, number],
  },
  {
    id: 'finality',
    icon: Zap,
    title: 'Finality',
    description: 'Irreversible commitment to the blockchain state provides instant settlement guarantees.',
    features: [
      'Economic finality',
      'Instant settlement',
      'No rollbacks',
    ],
    cameraTarget: [0, -3, 2] as [number, number, number],
  },
];

export default function Narrative() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setCameraTarget, setLinkSpeed, setEmissiveIntensity } = useSceneStore();
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      sections.forEach((section, index) => {
        const element = document.getElementById(section.id);
        if (!element) return;
        
        ScrollTrigger.create({
          trigger: element,
          start: 'top center',
          end: 'bottom center',
          onEnter: () => {
            setCameraTarget(section.cameraTarget);
            setLinkSpeed(1.5 + index * 0.3);
            setEmissiveIntensity(1.2 + index * 0.2);
          },
          onEnterBack: () => {
            setCameraTarget(section.cameraTarget);
            setLinkSpeed(1.5 + index * 0.3);
            setEmissiveIntensity(1.2 + index * 0.2);
          },
        });
        
        gsap.from(element, {
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 1,
          },
          opacity: 0,
          y: 100,
          scale: 0.95,
        });
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, [setCameraTarget, setLinkSpeed, setEmissiveIntensity]);
  
  return (
    <section ref={containerRef} className="relative py-32 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the core mechanisms that power our blockchain infrastructure
          </p>
        </div>
        
        <div className="space-y-32">
          {sections.map((section, index) => (
            <div
              key={section.id}
              id={section.id}
              className="min-h-[60vh] flex items-center"
            >
              <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/20 p-8 hover:border-primary/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,217,255,0.2)]">
                <div className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-center`}>
                  <div className="flex-1 space-y-6">
                    <div className="inline-flex items-center gap-3 text-primary">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <section.icon className="w-8 h-8" />
                      </div>
                      <span className="text-sm font-medium uppercase tracking-wider">
                        Step {index + 1}
                      </span>
                    </div>
                    
                    <h3 className="text-3xl sm:text-4xl font-bold">
                      {section.title}
                    </h3>
                    
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {section.description}
                    </p>
                    
                    <ul className="space-y-3">
                      {section.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 text-muted-foreground"
                        >
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex-1 flex justify-center">
                    <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl animate-glow-pulse" />
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
