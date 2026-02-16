# Translation QA Engine

A high-performance, web-based Quality Assurance tool for professional translation and localization workflows.

## 🚀 Key Features

- **Multi-Format Support**: Parse and analyze XLIFF, JSON, TMX, CSV, TSV, PO, and more.
- **Combined Audit View**: Regroup issues from multiple files into a single, structured workspace categorized by issue type.
- **Intelligent Glossary Mapping**: Automatically cross-reference terminology violations with your uploaded glossary files.
- **Human-Readable Reports**: Export detailed LQA reports in Excel and HTML formats using the descriptive `filename_#segid` pattern.
- **Dynamic Highlights**: Instantly visualize source and target terminology mismatches with color-coded highlighting.

## 🛠️ Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Gangesh54321/translation-qa-engine.git
   cd translation-qa-engine/app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## ☁️ Deployment

### Deploy on Vercel
This project is optimized for [Vercel](https://vercel.com). To deploy:

1. Push your changes to GitHub.
2. Import the project into your Vercel dashboard.
3. Vercel will automatically detect the Vite configuration and deploy.

## 📄 License
MIT
