import dns from 'dns';
// Force IPv4 to prevent Node.js fetch from hanging for 30 seconds on broken IPv6 networks
dns.setDefaultResultOrder('ipv4first');
import Book from '../models/book.js';
import Member from '../models/member.js';
import Transaction from '../models/transaction.js';

/**
 * Production-Ready AI Chat Controller
 * Clean, fast, and optimized for May 2026.
 */
export const chatWithAI = async (req, res) => {
  const { message, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Enforce AI limit checks based on membership tier limits
  const userRole = req.user?.role || "student";
  const limits = req.user?.limits || { aiAnalysisAccess: false };
  if (userRole !== "admin") {
    if (!limits.aiAnalysisAccess) {
      res.setHeader("Content-Type", "text/event-stream");
      res.write(`data: ${JSON.stringify({ error: true, text: "AI Analysis is restricted to Premium and Elite members. Please upgrade your subscription." })}\n\n`);
      return res.end();
    }
    if (req.user?.membership === "Premium" && (req.user?.aiQueriesCount || 0) >= 50) {
      res.setHeader("Content-Type", "text/event-stream");
      res.write(`data: ${JSON.stringify({ error: true, text: "AI Query limit reached for your Premium plan (50 max). Upgrade to Elite for unlimited queries." })}\n\n`);
      return res.end();
    }
  }

  if (!apiKey) {
    return res.status(200).json({ reply: "The Librarian is currently in the archives. Please try again later." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // RAG: Dynamic Library Search Context
    let libraryContext = "";
    try {
      const searchTerms = message.split(" ").filter(w => w.length > 3).join("|");
      if (searchTerms.length > 0) {
        const books = await Book.find({
          $or: [
            { title: { $regex: searchTerms, $options: "i" } },
            { author: { $regex: searchTerms, $options: "i" } },
            { category: { $regex: searchTerms, $options: "i" } }
          ]
        }).limit(5).select("title author category description status");
        
        if (books.length > 0) {
          libraryContext = `\n\n[SYSTEM CONTEXT: The library currently has these relevant books in its database: ${JSON.stringify(books)}]`;
        }
      }
    } catch(e) {
      console.error("RAG Search Error:", e);
    }

    const fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          ...(history || []).map(h => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }]
          })),
          { role: "user", parts: [{ text: `You are a helpful University Librarian. Provide a clean, direct, and concise answer. Do NOT list out recommendations, features, or examples of what you can help with unless explicitly asked. Use the provided SYSTEM CONTEXT if relevant to recommend specific books. Query: ${message} ${libraryContext}` }] }
        ]
      })
    };

    // Use SSE streaming endpoint for gemini-3.1-flash-lite
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent?alt=sse&key=${apiKey}`, fetchOptions);

    if (!response.ok) {
       const errorText = await response.text();
       console.error("AI API Error:", errorText);
       res.write(`data: ${JSON.stringify({ error: true, text: "I'm experiencing high traffic. Please try again shortly." })}\n\n`);
       return res.end();
    }

    // Pipe the SSE stream directly to the client
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    
    if (userRole !== "admin") {
      req.user.aiQueriesCount = (req.user.aiQueriesCount || 0) + 1;
      await req.user.save();
    }
    res.end();

  } catch (error) {
    console.error("AI Streaming Error:", error.message);
    res.write(`data: ${JSON.stringify({ error: true, text: "Connection issue. Please try again shortly." })}\n\n`);
    res.end();
  }
};

export const analyzeBook = async (req, res) => {
  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Enforce AI limit checks based on membership tier limits
  const userRole = req.user?.role || "student";
  const limits = req.user?.limits || { aiAnalysisAccess: false };
  if (userRole !== "admin") {
    if (!limits.aiAnalysisAccess) {
      return res.status(403).json({ error: "AI Analysis is restricted to Premium and Elite members. Please upgrade your subscription." });
    }
    if (req.user?.membership === "Premium" && (req.user?.aiQueriesCount || 0) >= 50) {
      return res.status(403).json({ error: "AI Query limit reached for your Premium plan (50 max). Upgrade to Elite for unlimited queries." });
    }
  }

  if (!apiKey) {
    return res.status(503).json({ error: "AI Service unavailable." });
  }

  try {
    const fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: message }] }]
      })
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, fetchOptions);
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error?.message || "AI Error");

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    if (userRole !== "admin") {
      req.user.aiQueriesCount = (req.user.aiQueriesCount || 0) + 1;
      await req.user.save();
    }
    res.json({ reply });
  } catch (error) {
    console.error("AI Analysis Error:", error.message);
    res.status(500).json({ error: "Failed to analyze book." });
  }
};

export const getDashboardSummary = async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.json({ insight: "AI Service is offline. Please configure your API Key to see dynamic insights." });
  }

  try {
    // Gather real database stats
    const totalBooks = await Book.countDocuments();
    const totalMembers = await Member.countDocuments();
    const activeLoans = await Transaction.countDocuments({ returned: false });
    
    // Check for late books
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const overdueLoans = await Transaction.countDocuments({ returned: false, dueDate: { $lt: today.toISOString() } });

    const promptText = `You are the AI Assistant for "Libraryly". 
    Analyze this real database data and provide ONE concise, professional 2-sentence insight for the librarian's dashboard. 
    Data: Total Books: ${totalBooks}, Total Members: ${totalMembers}, Currently Issued: ${activeLoans}, Overdue: ${overdueLoans}.
    Do NOT use asterisks or formatting. Make it sound intelligent and actionable.`;

    const fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }]
      })
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, fetchOptions);
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error?.message || "AI Error");

    const insight = data.candidates?.[0]?.content?.parts?.[0]?.text || "Database analysis complete. Systems are functioning normally.";
    res.json({ insight });
  } catch (error) {
    console.error("Dashboard AI Error:", error.message);
    res.json({ insight: "I'm currently unable to analyze the database. Please check back shortly." });
  }
};

export const aiExplore = async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Search query is required." });

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(503).json({ error: "AI service is offline." });
  }

  try {
    const promptText = `Analyze the following user query: "${query}". 
    Return ONLY a raw JSON object with no markdown formatting, no explanation, and no backticks.
    The JSON object MUST have two properties:
    1. "keywords": an array of 3-5 core search keywords or themes extracted from the query.
    2. "insight": a short, friendly 1-2 sentence response directly addressing their query before showing book recommendations.
    Example output: {"keywords":["sci-fi", "space"], "insight":"Space thrillers are incredibly exciting! Here are some fantastic sci-fi reads to launch you into the cosmos."}`;

    const fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }]
      })
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, fetchOptions);
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error?.message || "AI Error");

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let keywords = [];
    let insight = "Here are some top picks based on your semantic search!";
    try {
      const parsed = JSON.parse(rawText.replace(/```json/g, "").replace(/```/g, "").trim());
      keywords = parsed.keywords || [];
      if (parsed.insight) insight = parsed.insight;
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", rawText);
      keywords = query.split(" ").filter(w => w.length > 3);
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
       keywords = query.split(" ").filter(w => w.length > 3);
    }
    
    // Always include the literal user query to prevent acronym misses (e.g. "dbms" expanding to "databases" but missing the literal "dbms" title)
    keywords.push(query);

    // Now search MongoDB with these keywords
    const regexPattern = keywords.map(k => k.trim()).filter(Boolean).join("|");
    const books = await Book.find({
      $or: [
        { title: { $regex: regexPattern, $options: "i" } },
        { author: { $regex: regexPattern, $options: "i" } },
        { category: { $regex: regexPattern, $options: "i" } },
        { description: { $regex: regexPattern, $options: "i" } }
      ]
    }).limit(12);

    res.json({ keywords, insight, books });

  } catch (error) {
    console.error("AI Explore Error:", error.message);
    res.status(500).json({ error: "Failed to process semantic search.", details: error.message, stack: error.stack });
  }
};

export const semanticSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: "AI API key missing" });

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(query);
    const embedding = result.embedding.values;

    const books = await Book.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", // Requires an Atlas Vector Search index named 'vector_index'
          path: "embedding",
          queryVector: embedding,
          numCandidates: 100,
          limit: 10
        }
      },
      {
        $project: {
          title: 1,
          author: 1,
          category: 1,
          coverUrl: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    res.json(books);
  } catch (err) {
    console.error("Semantic search error:", err);
    res.status(500).json({ error: "Failed to perform semantic search" });
  }
};
