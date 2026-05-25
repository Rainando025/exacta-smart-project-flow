const url = "https://kavileyrwfuiaaubrutc.supabase.co/rest/v1/";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthdmlsZXlyd2Z1aWFhdWJydXRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY3ODAxOSwiZXhwIjoyMDk0MjU0MDE5fQ.CpWAmA69yKYu7UDGMjaul4qmWK-hgPDI-PiM63ygVco";

async function run() {
  const res = await fetch(url, {
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`
    }
  });
  const openapi = await res.json();
  if (openapi.definitions && openapi.definitions.notifications) {
    const def = openapi.definitions.notifications;
    console.log("Notifications Definition properties:", Object.keys(def.properties));
  } else {
    console.log("Notifications definition not found.");
  }
}

run();
