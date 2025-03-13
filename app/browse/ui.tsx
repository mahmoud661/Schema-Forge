"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Edit } from "lucide-react";
import { useSchemasCollection } from "@/hooks/use-schemas-collection";

export function BrowseUI() {
  const [showNewSchemaDialog, setShowNewSchemaDialog] = useState(false);
  const [schemaName, setSchemaName] = useState("");
  const [schemaDescription, setSchemaDescription] = useState("");
  const router = useRouter();
  const { schemas, addSchema, deleteSchema } = useSchemasCollection();
  
  const handleCreateSchema = () => {
    if (schemaName.trim() === "") return;
    
    const schemaId = addSchema({ 
      title: schemaName, 
      description: schemaDescription,
      tags: []
    });
    
    setSchemaName("");
    setSchemaDescription("");
    setShowNewSchemaDialog(false);
    
    // Redirect to the editor with the new schema ID
    router.push(`/schemas/editor/${schemaId}`);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Schemas</h1>
        <Dialog open={showNewSchemaDialog} onOpenChange={setShowNewSchemaDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Schema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Schema</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Schema Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter schema name" 
                  value={schemaName} 
                  onChange={(e) => setSchemaName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter schema description" 
                  value={schemaDescription} 
                  onChange={(e) => setSchemaDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewSchemaDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateSchema}>Create Schema</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemas.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">No schemas found. Create your first schema to get started!</p>
          </div>
        ) : (
          schemas.map((schema) => (
            <Card key={schema.id}>
              <CardHeader>
                <CardTitle>{schema.title}</CardTitle>
                <CardDescription>{schema.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Last modified: {formatDate(schema.lastModified)}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteSchema(schema.id)}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => router.push(`/schemas/editor/${schema.id}`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
