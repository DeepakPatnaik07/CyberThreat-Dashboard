# Cyber Threat Dashboard

## Description

A dashboard application to monitor and visualize cybersecurity threats fetched from various sources.

## Features

- Displays key threat statistics (Total threats, recent threats, critical threats).
- Shows threat trends over time.
- Visualizes threat distribution by type (Malware, Phishing, Vulnerability, etc.).
- Provides a detailed threat feed with severity, CVSS score, and CVE information.
- Includes a CVE details page for in-depth vulnerability information.
- Offers a mitigation suggestion tool based on CVE IDs.
- Allows settings configuration (API keys, theme, notifications).

## Technologies Used

- Next.js (React Framework)
- TypeScript
- Tailwind CSS
- Shadcn/ui (UI Components)
- Recharts (Charting Library)
- Vercel (Deployment, potentially KV and Cron in future)

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DeepakPatnaik07/CyberThreat-Dashboard.git
   cd CyberThreat-Dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```
3. Set up environment variables:
   - Create a `.env.local` file in the root directory.
   - Add necessary API keys or configurations (e.g., `NVD_API_KEY=YOUR_NVD_API_KEY_HERE`). Refer to specific components or API routes for required variables.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

Navigate through the sidebar to access different sections:

- **Dashboard:** Overview of current threats.
- **Threat Feed:** Detailed list of recent threats.
- **CVE Details:** Search for specific CVE information (if implemented).
- **Mitigation:** Generate mitigation plans for specific CVEs.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

