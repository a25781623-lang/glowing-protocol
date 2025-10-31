import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/lib/store';
import { CheckCircle2, Database, Shield, Zap, Code2, Lock, Network, TrendingUp, Users, GitBranch, Activity, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const sections = [
  {
    id: 'consensus',
    icon: CheckCircle2,
    color: 'from-primary/20 to-accent/20',
    title: 'Consensus Mechanism',
    subtitle: 'Byzantine Fault Tolerance at Scale',
    description: 'Our lightning-fast BFT consensus protocol achieves network agreement in milliseconds through a sophisticated multi-phase voting system. Validators stake tokens, propose blocks, and reach finality through cryptographically secure vote aggregation.',
    features: [
      { icon: Lock, text: 'Proof-of-Stake validation with slashing penalties' },
      { icon: Zap, text: 'Sub-second finality with 99.99% uptime' },
      { icon: TrendingUp, text: 'Energy efficient - 99.9% less than PoW' },
      { icon: Users, text: 'Supports 1000+ validator nodes globally' },
    ],
    stats: [
      { label: 'Validators', value: '1,200+' },
      { label: 'Finality', value: '<2s' },
      { label: 'Energy', value: '0.001%' },
    ],
    cameraTarget: [3, 2, 0] as [number, number, number],
  },
  {
    id: 'mempool',
    icon: Database,
    color: 'from-accent/20 to-primary/30',
    title: 'Mempool Architecture',
    subtitle: 'Intelligent Transaction Ordering',
    description: 'Advanced mempool management with parallel execution capabilities. Our multi-dimensional fee market prevents MEV exploitation while maximizing throughput through intelligent transaction batching and state-aware parallel processing.',
    features: [
      { icon: Activity, text: 'Priority gas auctions with EIP-1559 pricing' },
      { icon: Shield, text: 'MEV protection through encrypted mempools' },
      { icon: Network, text: 'Parallel processing across 16 execution shards' },
      { icon: Code2, text: 'Smart contract dependency resolution' },
    ],
    stats: [
      { label: 'TPS', value: '50,000+' },
      { label: 'Latency', value: '400ms' },
      { label: 'Shards', value: '16' },
    ],
    cameraTarget: [-3, -2, 0] as [number, number, number],
  },
  {
    id: 'validation',
    icon: Shield,
    color: 'from-primary/30 to-accent/10',
    title: 'Multi-Layer Validation',
    subtitle: 'Cryptographic Security Guarantees',
    description: 'Every transaction undergoes rigorous cryptographic verification through multiple independent validation layers. Zero-knowledge proofs ensure privacy while maintaining verifiability, and Merkle tree structures enable efficient state verification.',
    features: [
      { icon: Lock, text: 'ZK-SNARK proofs for privacy-preserving validation' },
      { icon: GitBranch, text: 'Ed25519 signature verification at hardware speed' },
      { icon: Database, text: 'Merkle root validation for state consistency' },
      { icon: Shield, text: 'Fraud proofs with 7-day challenge period' },
    ],
    stats: [
      { label: 'Signatures/sec', value: '1M+' },
      { label: 'ZK Proofs', value: '100K+' },
      { label: 'Security', value: '256-bit' },
    ],
    cameraTarget: [0, 3, -2] as [number, number, number],
  },
  {
    id: 'finality',
    icon: Zap,
    color: 'from-accent/30 to-primary/20',
    title: 'Economic Finality',
    subtitle: 'Irreversible Transaction Commitment',
    description: 'Achieve instant settlement guarantees through economic finality mechanisms. Once a transaction is finalized, reversing it would require destroying billions in staked value, making attacks economically infeasible and providing absolute certainty.',
    features: [
      { icon: TrendingUp, text: 'Economic security exceeding $10B in staked assets' },
      { icon: Clock, text: 'Instant settlement with no confirmation delays' },
      { icon: Shield, text: 'Zero rollback history across 2+ years' },
      { icon: Network, text: 'Cross-chain finality bridges to 15+ networks' },
    ],
    stats: [
      { label: 'Staked Value', value: '$12B+' },
      { label: 'Settlement', value: 'Instant' },
      { label: 'Rollbacks', value: '0' },
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
        
        // Animate cards
        gsap.from(element, {
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'top 30%',
            scrub: 1,
          },
          opacity: 0,
          y: 80,
          scale: 0.96,
        });
        
        // Animate floating shapes
        const shapes = element.querySelectorAll('.float-shape');
        shapes.forEach((shape, i) => {
          gsap.to(shape, {
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
            y: -100 * (i + 1),
            rotation: 360 * (i % 2 === 0 ? 1 : -1),
            ease: 'none',
          });
        });
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, [setCameraTarget, setLinkSpeed, setEmissiveIntensity]);
  
  return (
    <section ref={containerRef} className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="border-primary/30 text-primary px-4 py-2">
            <Network className="w-4 h-4 mr-2 inline" />
            Core Technology
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four pillars of next-generation blockchain infrastructure
          </p>
        </div>
        
        <div className="space-y-16">
          {sections.map((section, index) => (
            <div
              key={section.id}
              id={section.id}
              className="relative"
            >
              {/* Animated floating shapes */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className={`float-shape absolute top-10 ${index % 2 === 0 ? 'right-10' : 'left-10'} w-32 h-32 rounded-full bg-gradient-to-br ${section.color} blur-2xl opacity-30`} />
                <div className={`float-shape absolute bottom-10 ${index % 2 === 0 ? 'left-20' : 'right-20'} w-24 h-24 rounded-lg bg-gradient-to-tr ${section.color} blur-xl opacity-20 rotate-45`} />
              </div>
              
              <Card className="relative bg-card/40 backdrop-blur-xl border-primary/20 overflow-hidden hover:border-primary/40 transition-all duration-500 group">
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative p-6 sm:p-8">
                  <div className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 items-start`}>
                    {/* Left side - Content */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:shadow-glow transition-all duration-300">
                          <section.icon className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                              Phase {index + 1}
                            </span>
                          </div>
                          <h3 className="text-2xl sm:text-3xl font-bold mb-1">
                            {section.title}
                          </h3>
                          <p className="text-sm text-primary/80 font-medium">
                            {section.subtitle}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {section.description}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {section.features.map((feature, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-primary/10 hover:border-primary/30 hover:bg-background/70 transition-all duration-300 group/item"
                          >
                            <feature.icon className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform" />
                            <span className="text-sm text-muted-foreground">{feature.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Right side - Stats */}
                    <div className="flex-shrink-0 lg:w-64 space-y-4">
                      <div className="text-sm font-semibold text-primary/80 uppercase tracking-wider mb-4">
                        Key Metrics
                      </div>
                      {section.stats.map((stat, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-gradient-to-br from-background/80 to-background/40 border border-primary/20 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 group/stat"
                        >
                          <div className="text-3xl font-bold text-primary mb-1 group-hover/stat:scale-110 transition-transform inline-block">
                            {stat.value}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <Card className="inline-block bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 p-8 hover:border-primary/50 transition-all duration-300">
            <h3 className="text-2xl font-bold mb-3">Ready to Build?</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Join thousands of developers leveraging our blockchain infrastructure
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all hover:scale-105 glow-primary">
                Start Building
              </button>
              <button className="px-6 py-3 border border-primary/30 hover:bg-primary/10 rounded-lg font-semibold transition-all">
                Read Docs
              </button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
