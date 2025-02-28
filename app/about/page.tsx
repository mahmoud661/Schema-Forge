import { Navigation } from "@/components/navigation";

export default function About() {
  return (<><Navigation/>
    <div className="min-h-[calc(100vh-4rem)] gradient-bg">
      <div className="container py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-gradient-to-b from-background to-background/80 rounded-2xl p-8 shadow-lg">
          <h1 className="text-4xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
            About Database Schema Visualizer
          </h1>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-xl text-muted-foreground mb-8">
              We help developers and teams visualize and understand complex database relationships
              through interactive schema diagrams.
            </p>
            
            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">Our Mission</h2>
                <p className="text-muted-foreground">
                  Our mission is to simplify database design and documentation by providing powerful
                  visualization tools that make it easy to understand and communicate database structures.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">Key Features</h2>
                <ul className="grid gap-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Interactive schema visualization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Real-time collaboration
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Version control for schema changes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Export and sharing capabilities
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">•</span>
                    Custom styling and theming
                  </li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">Technology Stack</h2>
                <p className="text-muted-foreground">
                  Built with modern web technologies including React, Next.js, and React Flow.
                  Our platform leverages the latest advancements in web development to provide
                  a smooth and responsive user experience.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div></>
  );
}