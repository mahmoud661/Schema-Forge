# Schema Forge

<div align="center">
  <h3>Design Database Schemas Directly in Your Browser</h3>
  
  <p>
    <a href="http://schema-forge.vercel.app/">View Demo</a>
    ·
    <a href="https://github.com/mahmoud661/Schema-Forge/issues">Report Bug</a>
    ·
    <a href="https://github.com/mahmoud661/Schema-Forge/issues">Request Feature</a>
  </p>
</div>

## Overview

Schema Forge is a powerful client-side tool for designing database schemas directly in your browser. Create, visualize, and export SQL - all with an intuitive interface that requires no account or backend.

![Schema Forge Screenshot](public/screenshot.png)

## Features

- **Visual Schema Design** - Intuitive drag-and-drop interface for creating tables and relationships
- **Client-Side Only** - No backend, no account required, and all your data stays on your device
- **SQL Generation** - Automatically generate SQL for different database systems
- **Local Storage** - Your schemas are stored securely on your device
- **Dual Editing Modes** - Design with our visual editor or switch to code view for direct schema definition
- **Export Options** - Export your designs as SQL scripts or for documentation
- **Modern UI** - Clean, responsive interface with light and dark mode support

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/mahmoud661/Schema-Forge.git
   ```

2. Install dependencies
   ```sh
   cd Schema-Forge
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```sh
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser

## Usage

1. **Creating a new schema** - Click "Start Designing" on the homepage
2. **Add tables** - Use the sidebar to add tables to your schema
3. **Define relationships** - Connect tables to establish relationships
4. **Export your schema** - Generate SQL code for your target database system

## Technologies

- [React](https://reactjs.org/) - UI framework
- [Next.js](https://nextjs.org/) - React framework
- [React Flow](https://reactflow.dev/) - Diagram and node-based UI
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [suztand] - For persisting schemas

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

Project Link: [https://github.com/mahmoud661/Schema-Forge](https://github.com/mahmoud661/Schema-Forge)

## Acknowledgments

* [React Flow](https://reactflow.dev/) for the powerful flow visualization library
* [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components

