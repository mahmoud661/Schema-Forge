import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Database, Monitor, FileJson, Download, Layers, Code } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { RouteLoader } from "@/components/route-loader";
import { MobileWarning } from "@/components/mobile-warning";

export default function HomePage() {
  return (
    <>
      <RouteLoader />
      <Navigation />
      <MobileWarning />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <main className="flex-1">
          <section className="relative hero-gradient space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32 flex justify-center items-center">
            <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center justify-center">
              <div className="rounded-2xl px-4 py-1.5 text-sm font-medium">
                <span className="text-primary">
                  ✨ Schema Forge: Browser-Based Schema Design
                </span>
              </div>
              <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50 font-bold">
                Design Locally, Export Anywhere
              </h1>
              <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                Schema Forge is a powerful client-side tool for designing database schemas directly in your browser.
                No backend, no account required, and all your data stays on your device.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/browse">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Start Designing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="space-y-6 py-8 md:py-12 lg:py-24 bg-transparent flex flex-col items-center justify-cente">
            <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Why Choose Schema Forge
            </h2>
            <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Monitor className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Client-Side Design</h3>
                    <p className="text-sm text-muted-foreground">
                      Build schemas entirely in your browser with no backend dependencies or accounts required.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Database className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Visual Schema Design</h3>
                    <p className="text-sm text-muted-foreground">
                      Create complex database schemas using our intuitive drag-and-drop interface.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Code className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">SQL Generation</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate SQL for multiple database systems from your visual designs.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <FileJson className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Local Storage</h3>
                    <p className="text-sm text-muted-foreground">
                      Your schemas are stored securely on your device, giving you complete data privacy.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Download className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Export Options</h3>
                    <p className="text-sm text-muted-foreground">
                      Export your designs as SQL scripts,for documentation.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Layers className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Code or Interface</h3>
                    <p className="text-sm text-muted-foreground">
                      Design with our visual editor or switch to code view for direct schema definition.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
