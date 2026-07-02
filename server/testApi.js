async function run() {
  const url = "http://localhost:5000/api/members";
  
  // We need an admin token. Let's just login as admin
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@library.com", password: "password" })
  });
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(data.find(d => d.email === "harshith@123")); 
}
run();
