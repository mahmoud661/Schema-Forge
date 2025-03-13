"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

export function LicenseDetails() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-gradient-to-b from-background/70 to-background/40 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-primary/10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
          <span className="bg-primary/10 p-2 rounded-full">
            <FileText className="h-6 w-6 text-primary" />
          </span>
          License
        </h2>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors duration-200"
        >
          {isOpen ? "Hide Details" : "View License"}
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      
      {isOpen && (
        <div className="mt-6 p-6 bg-background/50 rounded-xl border border-border max-h-[500px] overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4">MIT License with Attribution</h3>
          <div className="prose prose-sm prose-gray dark:prose-invert">
            <p>Copyright (c) 2025 Mahmoud Zuriqi</p>
            
            <p>
              Permission is hereby granted, free of charge, to any person obtaining a copy
              of this software and associated documentation files (the &quot;Software&quot;), to deal
              in the Software without restriction, including without limitation the rights
              to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
              copies of the Software, subject to the following conditions:
            </p>
            
            <ol className="list-decimal pl-6 space-y-4 my-6">
              <li>
                <strong>Attribution Requirement</strong> - Any use, distribution, or modification of this software must include the following attribution in a visible and appropriate location (e.g., project documentation, website footer, or software UI):
                <ul className="list-disc pl-6 mt-2">
                  <li>&quot;Powered by Schema Forge - Created by Mahmoud Zuriqi&quot;</li>
                  <li>
                    A link to the original project repository: 
                    <a 
                      href="https://github.com/mahmoud661/schema-forge" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-primary hover:underline ml-1"
                    >
                      https://github.com/mahmoud661/schema-forge
                    </a>
                  </li>
                </ul>
              </li>
              
              <li>
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
              </li>
              
              <li>
                THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                SOFTWARE.
              </li>
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
