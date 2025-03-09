import { ShoppingCart, BookOpen, Package } from "lucide-react";
export const dummySchemas = [
  {
    id: "schema-1",
    title: "User Management System",
    description: "A comprehensive schema for user management with authentication and authorization",
    tags: ["Users", "Authentication", "Profiles"],
    createdAt: "2023-08-15T10:30:00Z",
    updatedAt: "2023-09-22T14:45:00Z"
  },
  {
    id: "schema-2",
    title: "Product Catalog",
    description: "Database schema for managing products with categories, attributes and inventory tracking",
    tags: ["Products", "Inventory", "Categories"],
    createdAt: "2023-07-10T08:20:00Z",
    updatedAt: "2023-10-05T11:15:00Z",
    template: "ecommerce"
  },
  {
    id: "schema-3",
    title: "Content Management",
    description: "Schema for a flexible content management system with support for various content types",
    tags: ["Content", "Media", "Publishing"],
    createdAt: "2023-09-02T16:40:00Z", 
    updatedAt: "2023-10-12T09:30:00Z"
  },
  {
    id: "schema-4",
    title: "Customer Support Ticketing",
    description: "Database design for customer support with ticket management and status tracking",
    tags: ["Customers", "Support", "Tickets"],
    createdAt: "2023-08-28T12:10:00Z",
    updatedAt: "2023-09-18T15:25:00Z"
  }
];

export const templates = [
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
