import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Database, Search, Users } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { RouteLoader } from "@/components/route-loader";
export default function HomePage() {
  return (
    <>
      <RouteLoader />
      <Navigation />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col">
        <main className="flex-1">
          <section className="relative hero-gradient space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32 flex justify-center items-center">
            <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center justify-center">
              <div className="rounded-2xl px-4 py-1.5 text-sm font-medium">
                <span className="text-primary">
                  ✨ Visualize Your Database Schema
                </span>
              </div>
              <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50 font-bold">
                Database Schema Visualization Made Simple
              </h1>
              <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                Visualize and understand your database relationships with our
                interactive schema viewer. Perfect for developers, architects,
                and teams.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/schemas">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/browse">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    Browse Examples
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="container space-y-6 py-8 md:py-12 lg:py-24 bg-transparent">
            <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Database className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Interactive Schemas</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualize your database relationships in real-time with
                      interactive diagrams.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Search className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Easy Navigation</h3>
                    <p className="text-sm text-muted-foreground">
                      Explore your database structure with intuitive navigation
                      and search.
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl">
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <Users className="h-12 w-12 text-primary" />
                  <div className="space-y-2">
                    <h3 className="font-bold">Team Collaboration</h3>
                    <p className="text-sm text-muted-foreground">
                      Share and collaborate on database designs with your team.
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
