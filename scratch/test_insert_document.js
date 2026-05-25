const url = "https://kavileyrwfuiaaubrutc.supabase.co/rest/v1/documents";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdmlsZXlyd2Z1aWFhdWJydXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY3ODAxOSwiZXhwIjoyMDk0MjU0MDE5fQ.CpWAmA69yKYu7UDGMjaul4qmWK-hgPDI-PiM63ygVco";

async function run() {
  const payload = {
    title: "Documento de Teste",
    content: "Conteúdo do documento de teste.",
    type: "document",
    owner_id: "ff3226f8-4567-4c88-9ba8-aefc715c49d3" // Use a valid user ID or dummy if service role bypasses FK
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(payload)
  });

  console.log("Insert status:", res.status);
  try {
    const json = await res.json();
    console.log("Insert result:", json);
  } catch (err) {
    console.log("Error response:", await res.text());
  }
}

run();
