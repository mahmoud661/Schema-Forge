"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Database, ShoppingCart, BookOpen, Package, Plus, Search, Filter, Calendar, ArrowUpDown } from "lucide-react";
import { useSchemaStore } from "@/lib/store";
import { motion } from "framer-motion";

export default function Browse() {
  const { schemas, addSchema } = useSchemaStore();
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filteredSchemas, setFilteredSchemas] = useState(schemas);
  const [showTemplateInfo, setShowTemplateInfo] = useState<string | null>(null);

  const templates = [
    {
      id: "ecommerce",
      title: "E-commerce Schema",
      description: "Complete database schema for an e-commerce platform with products, orders, and customer management",
      tags: ["Products", "Orders", "Customers", "Inventory"],
      icon: ShoppingCart,
      features: [
        "Product catalog with categories and attributes",
        "Customer profiles and authentication",
        "Order processing and history",
        "Shopping cart functionality",
        "Inventory management"
      ]
    },
    {
      id: "blog",
      title: "Blog Platform",
      description: "Modern blogging platform schema with support for posts, users, comments, and categories",
      tags: ["Posts", "Users", "Comments", "Categories"],
      icon: BookOpen,
      features: [
        "User authentication and profiles",
        "Post creation and management",
        "Commenting system",
        "Category and tag organization",
        "Content scheduling"
      ]
    },
    {
      id: "inventory",
      title: "Inventory System",
      description: "Comprehensive warehouse and inventory management system schema",
      tags: ["Products", "Warehouses", "Suppliers", "Stock"],
      icon: Package,
      features: [
        "Product tracking and management",
        "Warehouse organization",
        "Supplier relationship management",
        "Stock level monitoring",
        "Inventory reporting"
      ]
    }
  ];

  // Get all unique tags from schemas and templates
  const allTags = [...new Set([
    ...schemas.flatMap(schema => schema.tags),
    ...templates.flatMap(template => template.tags)
  ])];

  useEffect(() => {
    // Filter and sort schemas
    let result = [...schemas];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(schema => 
        schema.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schema.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schema.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply tag filter
    if (filterTag !== "all") {
      result = result.filter(schema => 
        schema.tags.includes(filterTag)
      );
    }
    
    // Apply sorting
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredSchemas(result);
  }, [schemas, searchTerm, filterTag, sortBy]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] gradient-bg">
      <div className="container py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

          {/* Search and filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schemas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredSchemas.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSchemas.map((schema) => (
                <motion.div
                  key={schema.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/schemas/editor/${schema.id}`}>
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
                      <CardFooter className="text-xs text-muted-foreground flex justify-between">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Updated {formatDate(schema.updatedAt)}</span>
                        </div>
                        {schema.template && (
                          <Badge variant="outline" className="text-xs">
                            From Template
                          </Badge>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : schemas.length > 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No matching schemas found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your search or filter criteria to find what you're looking for.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setFilterTag("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : null}

          {schemas.length === 0 && (
            <div className="text-center py-10 bg-muted/30 rounded-lg border border-dashed">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No schemas yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Create your first schema or use one of our templates to get started quickly.
              </p>
              <Link href="/schemas/editor/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Schema
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-6">Templates</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card 
                    className="h-full bg-gradient-to-b from-background to-background/80 shadow-lg transition-all hover:shadow-xl border-primary/10 cursor-pointer relative overflow-hidden"
                    onClick={() => showTemplateInfo === template.id ? 
                      setShowTemplateInfo(null) : 
                      setShowTemplateInfo(template.id)}
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
                      <div className="flex gap-2 flex-wrap mb-4">
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
                      
                      {showTemplateInfo === template.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4"
                        >
                          <h4 className="font-medium mb-2 text-sm">Key Features:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {template.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          showTemplateInfo === template.id ? 
                            setShowTemplateInfo(null) : 
                            setShowTemplateInfo(template.id);
                        }}
                      >
                        {showTemplateInfo === template.id ? "Hide details" : "View details"}
                      </Button>
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateFromTemplate(template);
                        }}
                        size="sm"
                      >
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}