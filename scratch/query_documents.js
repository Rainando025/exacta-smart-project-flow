const url = "https://kavileyrwfuiaaubrutc.supabase.co/rest/v1/documents?select=*";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdmlsZXlyd2Z1aWFhdWJydXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY3ODAxOSwiZXhwIjoyMDk0MjU0MDE5fQ.CpWAmA69yKYu7UDGMjaul4qmWK-hgPDI-PiM63ygVco";

async function run() {
  const res = await fetch(url, {
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`
    }
  });
  console.log("Documents query status:", res.status);
  try {
    const json = await res.json();
    console.log("Documents list:", json);
  } catch (err) {
    console.log("Error reading response:", await res.text());
  }
}

run();
