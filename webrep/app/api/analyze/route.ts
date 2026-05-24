import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Normalize URL - add https:// if missing
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    // Block example.com - it doesn't allow scraping
    if (normalizedUrl.includes("example.com")) {
      return NextResponse.json(
        { error: "example.com is a placeholder domain. Please enter a real business website URL." },
        { status: 400 }
      );
    }

    console.log("Fetching URL:", normalizedUrl);

    // 1. Try fetching the website HTML safely with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let htmlResponse;
    try {
      htmlResponse = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const err = fetchError as Error;
      console.error("Fetch error:", err.message);
      
      if (err.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out. The website took too long to respond." },
          { status: 408 }
        );
      }
      
      return NextResponse.json(
        { error: `Could not reach the website. Check if the URL is correct and the site is publicly accessible.` },
        { status: 400 }
      );
    }

    if (!htmlResponse.ok) {
      return NextResponse.json(
        { error: `Website returned status ${htmlResponse.status}. Try a different URL.` },
        { status: 400 }
      );
    }

    const html = await htmlResponse.text();

    if (!html || html.length < 100) {
      return NextResponse.json(
        { error: "Website returned empty or very little content." },
        { status: 400 }
      );
    }

    // 2. Extract text - improved cleaning
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")   // remove styles
      .replace(/<[^>]*>/g, " ")                          // remove tags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")                              // normalize whitespace
      .trim();

    console.log("Extracted text length:", textContent.length);

    // 3. Send to LLM for analysis
    const prompt = `You are an expert website auditor. Analyze this website content deeply and return ONLY valid JSON (no markdown, no explanation).

Evaluate these specific dimensions and assign a severity to each issue found:
- CTA presence: Is there a clear call-to-action (Buy, Contact, Sign Up, Get Started)?
- Pricing transparency: Is pricing visible or is it hidden?
- Social proof: Are there testimonials, reviews, client logos, or case studies?
- Contact information: Is there an email, phone, address, or contact form?
- Value proposition: Is the core benefit immediately clear within seconds?
- About/Team section: Does it build trust with a team or company story?
- FAQ or Support: Is there a FAQ, help section, or support info?
- Mobile/Performance signals: Any signs of slow load, large images, or poor structure?
- SEO basics: Are there headings, descriptions, and keywords?
- Trust signals: Privacy policy, SSL mention, certifications, awards?

Return this exact JSON shape:
{
  "title": "Website name",
  "industry": "Detected industry/category (e.g. SaaS, Restaurant, Agency, E-commerce)",
  "summary": "2-3 sentence summary of what this business does and who it serves",
  "score": <integer 0-100 representing overall web presence quality>,
  "scoreBreakdown": {
    "cta": <0-15>,
    "socialProof": <0-20>,
    "clarity": <0-20>,
    "contact": <0-15>,
    "trust": <0-15>,
    "seo": <0-15>
  },
  "strengths": [
    { "label": "short title", "detail": "specific observation from the site" }
  ],
  "gaps": [
    { "label": "short title", "detail": "specific actionable fix", "severity": "high|medium|low" }
  ]
}

Rules:
- strengths array: 3-5 items
- gaps array: 4-7 items, ordered by severity (high first)
- score must reflect the scoreBreakdown sum realistically
- Be specific — reference actual content from the website, not generic advice

Website content:
${textContent.slice(0, 8000)}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    let responseText = completion.choices[0].message?.content || "";
    console.log("LLM response:", responseText.slice(0, 200));

    // 4. Clean up response - handle markdown code blocks
    responseText = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // Find JSON in response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", responseText);
      return NextResponse.json(
        { error: "AI failed to generate proper analysis. Try again." },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      title: result.title || "Website Analysis",
      industry: result.industry || "General",
      summary: result.summary || "Analysis completed.",
      score: typeof result.score === "number" ? result.score : null,
      scoreBreakdown: result.scoreBreakdown || null,
      strengths: result.strengths || [],
      gaps: result.gaps || [],
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("Analyze error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch or analyze the website." },
      { status: 500 }
    );
  }
}

