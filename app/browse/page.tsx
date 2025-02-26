"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Database, ShoppingCart, BookOpen, Package, Plus } from "lucide-react";
import { useSchemaStore } from "@/lib/store";

export default function Browse() {
  const { schemas, addSchema } = useSchemaStore();
  const [isCreating, setIsCreating] = useState(false);

  const templates = [
    {
      id: "ecommerce",
      title: "E-commerce Schema",
      description: "Complete database schema for an e-commerce platform with products, orders, and customer management",
      tags: ["Products", "Orders", "Customers", "Inventory"],
      icon: ShoppingCart
    },
    {
      id: "blog",
      title: "Blog Platform",
      description: "Modern blogging platform schema with support for posts, users, comments, and categories",
      tags: ["Posts", "Users", "Comments", "Categories"],
      icon: BookOpen
    },
    {
      id: "inventory",
      title: "Inventory System",
      description: "Comprehensive warehouse and inventory management system schema",
      tags: ["Products", "Warehouses", "Suppliers", "Stock"],
      icon: Package
    }
  ];

  const handleCreateFromTemplate = (template: typeof templates[0]) => {
    const newSchema = {
      id: `${template.id}-${Date.now()}`,
      title: `${template.title} Copy`,
      description: template.description,
      tags: template.tags,
      template: template.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addSchema(newSchema);
    setIsCreating(true);
    // Navigate to editor after a brief delay to show feedback
    setTimeout(() => {
      window.location.href = `/schemas/editor/${newSchema.id}`;
    }, 500);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] gradient-bg">
      <div className="container py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
                My Schemas
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Manage your database schemas and create new ones from templates
              </p>
            </div>
            <Link href="/schemas/editor/new">
              <Button className="gap-2" size="lg">
                <Plus className="h-5 w-5" />
                New Schema
              </Button>
            </Link>
          </div>

          {schemas.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {schemas.map((schema) => (
                <Link key={schema.id} href={`/schemas/editor/${schema.id}`}>
                  <Card className="h-full bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] border-primary/10">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Database className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{schema.title}</CardTitle>
                      </div>
                      <CardDescription className="text-muted-foreground mt-2">
                        {schema.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 flex-wrap">
                        {schema.tags.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary"
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Templates</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className="h-full bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] border-primary/10 cursor-pointer"
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <template.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{template.title}</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground mt-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap">
                      {template.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}