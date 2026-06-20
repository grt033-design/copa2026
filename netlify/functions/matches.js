// Netlify Function: proxy para football-data.org
// Node 18+ tem fetch nativo — sem dependências externas
const API_KEY = "45299c0f6b0c4378ac608d011783e099";
const BASE = "https://api.football-data.org/v4";

exports.handler = async (event) => {
  // Suporta preflight CORS
  if(event.httpMethod === "OPTIONS"){
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      },
      body: ""
    };
  }

  const { dateFrom, dateTo } = event.queryStringParameters || {};

  if(!dateFrom || !dateTo){
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "dateFrom e dateTo são obrigatórios" })
    };
  }

  const url = `${BASE}/competitions/WC/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-Auth-Token": API_KEY,
        "Content-Type": "application/json"
      }
    });

    if(!res.ok){
      const txt = await res.text();
      return {
        statusCode: res.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `API retornou ${res.status}: ${txt.substring(0,200)}` })
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message, stack: err.stack })
    };
  }
};
