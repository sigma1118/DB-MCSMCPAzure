import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const server = new McpServer({
  name: "jokesMCP",
  description: "A server that provides jokes",
  version: "1.0.0",
  tools: [
    {
      name: "get-chuck-joke",
      description: "Get a random Chuck Norris joke",
      parameters: {},
    },
    {
      name: "get-chuck-categories",
      description: "Get all available categories for Chuck Norris jokes",
      parameters: {},
    },
    {
      name: "get-dad-joke",
      description: "Get a random dad joke",
      parameters: {},
    },
    {
      name: "get-yo-mama-joke",
      description: "Get a random Yo Mama joke",
      parameters: {},
    },
     {
      name: "get-country-data",
      description: "Get a country data by name",
      parameters: {},
    },
     {
      name: "get-zip-info",
      description: "Get the city and state for a US ZIP code (example: 90210)",
      parameters: {},
    },
     {
      name: "get-city-details",
      description: "Get basic information about a city using OpenStreetMap Nominatim API (no API key required)",
      parameters: {},
    },
  ],
});
const getCityDetails = server.tool(
  "get-city-details",
  "Get basic information about a city using OpenStreetMap Nominatim API (no API key required)",
  async (input: { city: string }) => {
    const city = input.city;
    if (!city) {
      return {
        content: [
          {
            type: "text",
            text: "Please provide a city name."
          }
        ]
      };
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=1`
      );
      const data = await response.json();
      if (!data.length) throw new Error("City not found");

      const result = data[0];
      return {
        content: [
          {
            type: "text",
            text: `${result.display_name} — Coordinates: (${result.lat}, ${result.lon})`
          }
        ]
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error fetching city info: ${message}`
          }
        ]
      };
    }
  }
);

// Zip Code Tool
const getZipInfo = server.tool(
  "get-zip-info",
  {
    zip: z.string().describe("A valid US ZIP code"),
  },
  async (params: { zip: string }) => {
    const zip = params.zip;
    if (!zip) {
      return {
        content: [
          {
            type: "text",
            text: "Please provide a ZIP code."
          }
        ]
      };
    }

    try {
      const response = await fetch(`http://api.zippopotam.us/us/${zip}`);
      if (!response.ok) {
        throw new Error("ZIP code not found");
      }
      const data = await response.json();
      const place = data.places[0];
      return {
        content: [
          {
            type: "text",
            text: `${zip}: ${place["place name"]}, ${place["state abbreviation"]}`
          }
        ]
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return {
        content: [
          {
            type: "text",
            text: `Error fetching data for ZIP code ${zip}: ${message}`
          }
        ]
      };
    }
  }
);

// Get Chuck Norris joke tool
const getChuckJoke = server.tool(
  "get-chuck-joke",
  "Get a random Chuck Norris joke",
  async () => {
    const response = await fetch("https://api.chucknorris.io/jokes/random");
    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: data.value,
        },
      ],
    };
  }
);

// Get Chuck Norris joke categories tool
const getChuckCategories = server.tool(
  "get-chuck-categories",
  "Get all available categories for Chuck Norris jokes",
  async () => {
    const response = await fetch("https://api.chucknorris.io/jokes/categories");
    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: data.join(", "),
        },
      ],
    };
  }
);

// Get Dad joke tool
const getDadJoke = server.tool(
  "get-dad-joke",
  "Get a random dad joke",
  async () => {
    const response = await fetch("https://icanhazdadjoke.com/", {
      headers: {
        Accept: "application/json",
      },
    });
    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: data.joke,
        },
      ],
    };
  }
);
// 2025-05-29 - Add get-country-data tool
const getCountryData = server.tool(
  "get-country-data",
  "Get a country data by name",
  {
    name: z.string().describe("Get country data by name"),
  },
  async (params: { name: string }) => {
    const response = await fetch(`https://restcountries.com/v3.1/name/${params.name}`);
    const data = await response.json();
    const country = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!country) {
      return {
        content: [
          { type: "text", text: `No data found for ${params.name}` },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: country.name?.common || "No name found",
        },
        {
          type: "text",
          text: country.capital ? country.capital[0] : "No capital found",
        },
        {
          type: "text",
          text: country.region || "No region found",
        },
        {
          type: "text",
          text: country.population ? country.population.toLocaleString() : "No population found",
        },
        {
          type: "text",
          text: country.flags?.png || "No flag found",
        },
      ],
    };
  }
);
// Get Yo Mama joke tool
const getYoMamaJoke = server.tool(
  "get-yo-mama-joke",
  "Get a random Yo Mama joke",
  async () => {
    const response = await fetch(
      "https://www.yomama-jokes.com/api/v1/jokes/random"
    );
    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: data.joke,
        },
      ],
    };
  }
);

const app = express();

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: { [sessionId: string]: SSEServerTransport } = {};

app.get("/sse", async (req: Request, res: Response) => {
  // Get the full URI from the request
  const host = req.get("host");

  const fullUri = `https://${host}/jokes`;
  const transport = new SSEServerTransport(fullUri, res);

  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/jokes", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

app.get("/", (_req, res) => {
  res.send("The Jokes MCP server is running!");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
