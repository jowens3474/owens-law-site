/**
 * Seed the database with synthetic example contracts so the chat works
 * end-to-end without ingesting real PDFs.
 *
 *   npm run seed
 *
 * Only writes to `documents` and `contracts`. `document_chunks` stays
 * empty until you ingest real documents — which means `query_contracts`
 * (SQL) works after seeding, but `search_documents` (vector) doesn't
 * have anything to return yet.
 *
 * Idempotent: re-running deletes the seed rows and re-inserts.
 */

import "dotenv/config";
import { Pool } from "pg";

type SeedContract = {
  title: string;
  vendor: string;
  total_value_cents: number;
  start_date: string;
  end_date: string;
  department: string;
  services_summary: string;
};

const SEED: SeedContract[] = [
  {
    title: "EXAMPLE: Acme Janitorial Services FY24",
    vendor: "Acme Janitorial Services LLC",
    total_value_cents: 480_000_00,
    start_date: "2024-07-01",
    end_date: "2025-06-30",
    department: "Public Works",
    services_summary: "Nightly janitorial and restroom servicing at city hall and three branch facilities.",
  },
  {
    title: "EXAMPLE: SparkleCo Building Maintenance FY24",
    vendor: "SparkleCo Building Services Inc",
    total_value_cents: 312_500_00,
    start_date: "2024-07-01",
    end_date: "2025-06-30",
    department: "Public Works",
    services_summary: "Daytime janitorial, window cleaning, and pressure washing at four city-owned buildings.",
  },
  {
    title: "EXAMPLE: Hammond & Reese LLP General Counsel",
    vendor: "Hammond & Reese LLP",
    total_value_cents: 1_250_000_00,
    start_date: "2023-01-01",
    end_date: "2025-12-31",
    department: "City Attorney",
    services_summary: "Outside general counsel services including litigation, employment, and contract review.",
  },
  {
    title: "EXAMPLE: Pearson Municipal Law Group Litigation Support",
    vendor: "Pearson Municipal Law Group",
    total_value_cents: 460_000_00,
    start_date: "2024-01-01",
    end_date: "2025-06-30",
    department: "City Attorney",
    services_summary: "Specialized litigation support for land use and police liability matters.",
  },
  {
    title: "EXAMPLE: Northstar IT Managed Services",
    vendor: "Northstar IT Solutions Inc",
    total_value_cents: 2_400_000_00,
    start_date: "2024-01-01",
    end_date: "2026-12-31",
    department: "Information Technology",
    services_summary: "Helpdesk, network monitoring, and on-prem server administration across all departments.",
  },
  {
    title: "EXAMPLE: Strategic Visions Consulting Engagement",
    vendor: "Strategic Visions Consulting Group",
    total_value_cents: 875_000_00,
    start_date: "2024-03-01",
    end_date: "2024-12-31",
    department: "City Manager",
    services_summary: "Strategic planning facilitation, stakeholder interviews, and final report on 10-year vision.",
  },
  {
    title: "EXAMPLE: Bridgepoint Engineering Consultants",
    vendor: "Bridgepoint Engineering Consultants",
    total_value_cents: 1_650_000_00,
    start_date: "2023-09-01",
    end_date: "2025-09-01",
    department: "Public Works",
    services_summary: "Design and engineering review for Main Street bridge rehabilitation project.",
  },
  {
    title: "EXAMPLE: Coastline Construction Co — Park Renovation",
    vendor: "Coastline Construction Co",
    total_value_cents: 3_750_000_00,
    start_date: "2024-04-01",
    end_date: "2025-10-31",
    department: "Parks and Recreation",
    services_summary: "Capital construction for renovation of Riverside Park including playground and pavilion.",
  },
  {
    title: "EXAMPLE: Meadowlark Healthcare Brokerage",
    vendor: "Meadowlark Healthcare Brokerage",
    total_value_cents: 285_000_00,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    department: "Human Resources",
    services_summary: "Broker of record for employee health, dental, and vision benefits.",
  },
  {
    title: "EXAMPLE: PeopleFirst Benefits Advisors",
    vendor: "PeopleFirst Benefits Advisors LLC",
    total_value_cents: 198_000_00,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    department: "Human Resources",
    services_summary: "Supplemental benefits consulting on retirement plan administration.",
  },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`DELETE FROM documents WHERE title LIKE 'EXAMPLE:%'`);

  for (const c of SEED) {
    const doc = await pool.query<{ id: string }>(
      `INSERT INTO documents (title, doc_type) VALUES ($1, 'contract') RETURNING id`,
      [c.title],
    );
    await pool.query(
      `INSERT INTO contracts (
         document_id, vendor_name, total_value_cents, start_date, end_date,
         department, services_summary, extraction_model
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'seed')`,
      [
        doc.rows[0].id,
        c.vendor,
        c.total_value_cents,
        c.start_date,
        c.end_date,
        c.department,
        c.services_summary,
      ],
    );
  }

  console.log(`Seeded ${SEED.length} example contracts.`);
  console.log("Try asking the chat: 'Which contract has the largest total value?'");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
