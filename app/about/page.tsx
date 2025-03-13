import { Navigation } from "@/components/navigation";
import { MobileWarning } from "@/components/mobile-warning";
import { Download, FileJson, Monitor, Shield, Sparkles, Github, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function About() {
  return (
    <>
      <Navigation />
      <MobileWarning />
      <div className="min-h-[calc(100vh-4rem)] gradient-bg pb-20">
        <div className="container py-10 px-4 sm:px-6 lg:px-8">
          {/* Hero section with enhanced styling */}
          <div className="max-w-5xl mx-auto mb-16 text-center">
            <div className="inline-block animate-bounce-slow mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary/80">
              About Schema Forge
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A passion project built to simplify database schema design for everyone.
            </p>
          </div>

          {/* Main content with improved cards */}
          <div className="max-w-4xl mx-auto space-y-16">
            {/* Purpose section */}
            <section className="bg-gradient-to-b from-background/70 to-background/40 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-primary/10">
              <h2 className="text-3xl font-bold mb-6 text-primary flex items-center gap-3">
                <span className="bg-primary/10 p-2 rounded-full">
                  <Monitor className="h-6 w-6 text-primary" />
                </span>
                Our Purpose
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Schema Forge was created to provide developers with a simple, accessible tool for database design
                that doesn&apos;t require backend infrastructure. I believe that database design tools should be 
                available to everyone, from students to professional developers, without the need for accounts
                or subscriptions.
              </p>
            </section>

            {/* Features section with redesigned grid */}
            <section className="space-y-8">
              <h2 className="text-3xl font-bold text-center text-primary">Key Features</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group bg-card/30 hover:bg-card/50 transition-all duration-300 p-7 rounded-xl border border-border hover:border-primary/40 shadow-md hover:shadow-lg">
                  <Monitor className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground/90">Client-Side Design</h3>
                  <p className="text-muted-foreground">
                    Everything runs in your browser with no data sent to any servers.
                    Your designs stay private on your device.
                  </p>
                </div>
                
                <div className="group bg-card/30 hover:bg-card/50 transition-all duration-300 p-7 rounded-xl border border-border hover:border-primary/40 shadow-md hover:shadow-lg">
                  <FileJson className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground/90">Local Data Storage</h3>
                  <p className="text-muted-foreground">
                    All your schemas are stored in your browser&apos;s local storage,
                    giving you complete control over your data.
                  </p>
                </div>
                
                <div className="group bg-card/30 hover:bg-card/50 transition-all duration-300 p-7 rounded-xl border border-border hover:border-primary/40 shadow-md hover:shadow-lg">
                  <Download className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground/90">Export Functionality</h3>
                  <p className="text-muted-foreground">
                    Export your designs to SQL, JSON, or images to use with
                    any database system or documentation tool.
                  </p>
                </div>
                
                <div className="group bg-card/30 hover:bg-card/50 transition-all duration-300 p-7 rounded-xl border border-border hover:border-primary/40 shadow-md hover:shadow-lg">
                  <Shield className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground/90">Data Privacy</h3>
                  <p className="text-muted-foreground">
                    Your schema designs never leave your device, ensuring
                    complete privacy for sensitive database structures.
                  </p>
                </div>
              </div>
            </section>
            
            {/* Technology section with modern list styling */}
            <section className="bg-gradient-to-b from-background/70 to-background/40 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-primary/10">
              <h2 className="text-3xl font-bold mb-6 text-primary">Technology</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg border border-border">
                  <div className="bg-primary/10 p-2 rounded-full mt-1">
                    <span className="text-primary font-bold text-lg">R</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">React & Next.js</h3>
                    <p className="text-sm text-muted-foreground">For our responsive user interface</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg border border-border">
                  <div className="bg-primary/10 p-2 rounded-full mt-1">
                    <span className="text-primary font-bold text-lg">RF</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">React Flow</h3>
                    <p className="text-sm text-muted-foreground">Powers our interactive schema diagrams</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg border border-border">
                  <div className="bg-primary/10 p-2 rounded-full mt-1">
                    <span className="text-primary font-bold text-lg">LS</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Local Storage</h3>
                    <p className="text-sm text-muted-foreground">For saving your schemas in the browser</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-background/50 rounded-lg border border-border">
                  <div className="bg-primary/10 p-2 rounded-full mt-1">
                    <span className="text-primary font-bold text-lg">SQ</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">SQL Parser & Generator</h3>
                    <p className="text-sm text-muted-foreground">For importing and exporting SQL</p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Creator section - NEW */}
            <section className="bg-gradient-to-r from-primary/5 to-blue-500/5 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-primary/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-4 text-primary">Created By</h2>
                  
                  <p className="text-lg text-muted-foreground mb-6">
                    Schema Forge was designed and developed by Mahmoud Zuriqi.
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <Link 
                      href="https://www.mahmoudzuriqi.tech/" 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      <Globe className="h-4 w-4" />
                      Portfolio
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    
                    <Link 
                      href="https://github.com/mahmoud661" 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-background/80 hover:bg-background text-foreground/80 px-4 py-2 rounded-lg border border-border transition-colors duration-200"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </Link>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-primary/20 to-blue-500/20 p-1 rounded-full">
                  <div className="rounded-full overflow-hidden h-32 w-32 border-4 border-background">
                    <div className="bg-primary/20 h-full w-full flex items-center justify-center text-2xl font-bold text-primary">
                      MZ
                    </div>
           
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}