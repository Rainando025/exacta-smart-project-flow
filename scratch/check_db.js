import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  "https://kavileyrwfuiaaubrutc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdmlsZXlyd2Z1aWFhdWJydXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY3ODAxOSwiZXhwIjoyMDk0MjU0MDE5fQ.CpWAmA69yKYu7UDGMjaul4qmWK-hgPDI-PiM63ygVco"
);

async function main() {
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  if (error) {
    console.error("Error fetching projects:", error);
  } else {
    console.log("Sample project keys:", Object.keys(data[0] || {}));
  }
}
main();
