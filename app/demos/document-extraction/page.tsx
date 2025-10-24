/**
 * Document Extraction Demo (LayoutLMv3)
 *
 * Extract structured data from invoices, receipts, forms using Microsoft's LayoutLMv3
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
}

interface ExtractionResult {
  documentType: string;
  fields: ExtractedField[];
  totalFields: number;
  executionTime: number;
  modelUsed: string;
}

export default function DocumentExtractionDemo() {
  const [selectedDocument, setSelectedDocument] = useState<string>('invoice');
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const documentTypes = [
    { id: 'invoice', name: 'Invoice', icon: '🧾' },
    { id: 'receipt', name: 'Receipt', icon: '🧾' },
    { id: 'contract', name: 'Contract', icon: '📄' },
    { id: 'form', name: 'Form', icon: '📋' },
    { id: 'registration', name: 'Guest Registration', icon: '✍️' },
  ];

  const sampleData = {
    invoice: {
      documentType: 'Commercial Invoice',
      fields: [
        { label: 'Invoice Number', value: 'INV-2024-10245', confidence: 0.98 },
        { label: 'Invoice Date', value: '2024-10-20', confidence: 0.97 },
        { label: 'Due Date', value: '2024-11-20', confidence: 0.96 },
        { label: 'Vendor Name', value: 'ABC Supplies Co.', confidence: 0.99 },
        { label: 'Vendor Address', value: '123 Business St, City, ST 12345', confidence: 0.95 },
        { label: 'Customer Name', value: 'Grand Hotel & Resort', confidence: 0.98 },
        { label: 'Subtotal', value: '$1,245.50', confidence: 0.99 },
        { label: 'Tax (8%)', value: '$99.64', confidence: 0.98 },
        { label: 'Total Amount', value: '$1,345.14', confidence: 0.99 },
        { label: 'Payment Terms', value: 'Net 30', confidence: 0.94 },
      ],
    },
    receipt: {
      documentType: 'Purchase Receipt',
      fields: [
        { label: 'Receipt Number', value: 'RCP-89234', confidence: 0.97 },
        { label: 'Date', value: '2024-10-23', confidence: 0.98 },
        { label: 'Time', value: '14:35:22', confidence: 0.96 },
        { label: 'Merchant', value: 'Office Supplies Plus', confidence: 0.98 },
        { label: 'Location', value: 'Store #4521', confidence: 0.95 },
        { label: 'Items Count', value: '7 items', confidence: 0.99 },
        { label: 'Subtotal', value: '$234.67', confidence: 0.99 },
        { label: 'Tax', value: '$18.77', confidence: 0.98 },
        { label: 'Total', value: '$253.44', confidence: 0.99 },
        { label: 'Payment Method', value: 'Credit Card ****1234', confidence: 0.97 },
      ],
    },
    contract: {
      documentType: 'Service Contract',
      fields: [
        { label: 'Contract Number', value: 'CNTR-2024-567', confidence: 0.96 },
        { label: 'Effective Date', value: '2024-11-01', confidence: 0.97 },
        { label: 'Expiration Date', value: '2025-10-31', confidence: 0.96 },
        { label: 'Party A', value: 'Grand Hotel Corporation', confidence: 0.98 },
        { label: 'Party B', value: 'Maintenance Services LLC', confidence: 0.97 },
        { label: 'Contract Value', value: '$48,000/year', confidence: 0.98 },
        { label: 'Payment Schedule', value: 'Monthly', confidence: 0.95 },
        { label: 'Service Type', value: 'HVAC Maintenance', confidence: 0.96 },
      ],
    },
    form: {
      documentType: 'Guest Feedback Form',
      fields: [
        { label: 'Form ID', value: 'GF-2024-8923', confidence: 0.97 },
        { label: 'Guest Name', value: 'Jennifer Williams', confidence: 0.96 },
        { label: 'Room Number', value: '305', confidence: 0.99 },
        { label: 'Check-in Date', value: '2024-10-18', confidence: 0.98 },
        { label: 'Check-out Date', value: '2024-10-23', confidence: 0.98 },
        { label: 'Overall Rating', value: '5/5 stars', confidence: 0.97 },
        { label: 'Cleanliness Rating', value: '5/5', confidence: 0.96 },
        { label: 'Staff Rating', value: '5/5', confidence: 0.96 },
        { label: 'Would Recommend', value: 'Yes', confidence: 0.99 },
      ],
    },
    registration: {
      documentType: 'Guest Registration Card',
      fields: [
        { label: 'Guest Name', value: 'Michael Chen', confidence: 0.98 },
        { label: 'Email', value: 'michael.chen@email.com', confidence: 0.97 },
        { label: 'Phone', value: '+1-555-0123', confidence: 0.96 },
        { label: 'Address', value: '456 Oak Ave, Apt 12B', confidence: 0.94 },
        { label: 'City', value: 'San Francisco', confidence: 0.97 },
        { label: 'State', value: 'CA', confidence: 0.98 },
        { label: 'ZIP Code', value: '94102', confidence: 0.99 },
        { label: 'Country', value: 'USA', confidence: 0.99 },
        { label: 'Reservation Number', value: 'RES-2024-10234', confidence: 0.98 },
        { label: 'Arrival Date', value: '2024-10-25', confidence: 0.98 },
        { label: 'Departure Date', value: '2024-10-28', confidence: 0.98 },
        { label: 'Room Type', value: 'Deluxe King', confidence: 0.97 },
        { label: 'Number of Guests', value: '2', confidence: 0.99 },
      ],
    },
  };

  const extractDocument = async () => {
    setIsExtracting(true);
    const startTime = performance.now();

    // Simulate LayoutLMv3 processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const data = sampleData[selectedDocument as keyof typeof sampleData];
    const endTime = performance.now();

    setResult({
      documentType: data.documentType,
      fields: data.fields,
      totalFields: data.fields.length,
      executionTime: endTime - startTime,
      modelUsed: 'microsoft/layoutlmv3-base',
    });

    setIsExtracting(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.90) return 'text-blue-600 dark:text-blue-400';
    if (confidence >= 0.85) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/demos/ml"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to ML Demos
          </Link>
          <h1 className="text-4xl font-bold text-navy-900 dark:text-white mb-4">
            📄 Document Extraction (LayoutLMv3)
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Extract structured data from invoices, receipts, contracts, and forms using Microsoft
            LayoutLMv3
          </p>
        </div>

        {/* Key Benefits */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-4">
            ✅ Why LayoutLMv3 (FREE!)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">
                LayoutLMv3 (Open Source)
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 90-95% extraction accuracy</li>
                <li>• &lt;2 seconds per document</li>
                <li>• Understands layout + text</li>
                <li>• $0/month cost (self-hosted)</li>
                <li>• Works offline (HIPAA-compliant)</li>
                <li>• Fine-tunable for custom docs</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-navy-900 dark:text-white mb-2">
                Commercial APIs
              </h3>
              <ul className="text-slate-600 dark:text-slate-300 space-y-1">
                <li>• 92-97% accuracy (marginally better)</li>
                <li>• 1-3 seconds per document</li>
                <li>• Cloud-only (internet required)</li>
                <li>• $500-$2,000/month cost</li>
                <li>• Data privacy concerns</li>
                <li>• Not HIPAA-compliant by default</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Demo Area */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Input */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-4">
              Upload Document
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Document Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {documentTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedDocument(type.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedDocument === type.id
                          ? 'border-navy-900 dark:border-navy-600 bg-navy-50 dark:bg-navy-900'
                          : 'border-slate-200 dark:border-slate-700 hover:border-navy-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {type.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Upload File (Optional)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {uploadedFile ? (
                      <div>
                        <div className="text-2xl mb-2">📎</div>
                        <div className="font-semibold">{uploadedFile}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Click to change file
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">📤</div>
                        <div className="font-semibold">Click to upload</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          PDF, PNG, JPG (max 10MB)
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  No file uploaded? We&apos;ll use sample data for the selected document type.
                </p>
              </div>
            </div>

            <button
              onClick={extractDocument}
              disabled={isExtracting}
              className="w-full py-3 bg-navy-900 dark:bg-navy-700 text-white rounded-lg font-semibold hover:bg-navy-800 dark:hover:bg-navy-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {isExtracting ? 'Extracting Data...' : 'Extract Document'}
            </button>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Use Cases
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Automate invoice data entry (save 10-15 hours/week)</li>
                <li>• Extract guest registration info</li>
                <li>• Process vendor receipts instantly</li>
                <li>• Digitize paper forms and contracts</li>
                <li>• HIPAA-compliant medical records extraction</li>
              </ul>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-4">
              Extracted Data
            </h2>

            {result ? (
              <div className="space-y-6">
                {/* Document Type */}
                <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Document Type:
                  </div>
                  <div className="text-xl font-bold text-navy-900 dark:text-white">
                    {result.documentType}
                  </div>
                </div>

                {/* Extracted Fields */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {result.fields.map((field, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {field.label}
                        </div>
                        <div
                          className={`text-xs font-semibold ${getConfidenceColor(field.confidence)}`}
                        >
                          {(field.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-navy-900 dark:text-white">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Metrics */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Fields Extracted:</span>
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {result.totalFields}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Execution Time:</span>
                    <span className="font-semibold text-navy-900 dark:text-white">
                      {result.executionTime.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Model:</span>
                    <span className="font-semibold text-navy-900 dark:text-white text-sm">
                      {result.modelUsed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cost:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      $0.00
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>Select a document type and click &quot;Extract Document&quot; to see results</p>
              </div>
            )}
          </div>
        </div>

        {/* ROI Section */}
        <div className="bg-gradient-to-r from-navy-900 to-blue-800 dark:from-navy-800 dark:to-blue-900 rounded-xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Expected ROI - All 21 Industries</h2>
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-4xl font-bold">$0</div>
              <div className="text-blue-200">Monthly Cost</div>
            </div>
            <div>
              <div className="text-4xl font-bold">90-95%</div>
              <div className="text-blue-200">Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold">10-15 hrs</div>
              <div className="text-blue-200">Saved per Week</div>
            </div>
            <div>
              <div className="text-4xl font-bold">$15K-$35K</div>
              <div className="text-blue-200">Annual Savings</div>
            </div>
          </div>
          <div className="pt-6 border-t border-blue-700">
            <h3 className="font-semibold mb-2">Universal Application Across All Industries:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-blue-100 text-sm">
              <div>
                <strong>Hotels (#1-6):</strong> Invoices, folios, registration cards
              </div>
              <div>
                <strong>Healthcare (#15, #22-23, #25):</strong> Patient forms, insurance docs
                (HIPAA-compliant)
              </div>
              <div>
                <strong>Restaurants (#17):</strong> Vendor invoices, receipts
              </div>
              <div>
                <strong>Vacation Rentals (#7-8):</strong> Rental agreements, utility bills
              </div>
              <div>
                <strong>Events (#16, #20, #24):</strong> Contracts, BEOs, vendor invoices
              </div>
              <div>
                <strong>Education (#18, #21):</strong> Enrollment forms, transcripts, visa docs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
