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
      parameters: {
        name: { type: "string", description: "Get country data by name" },
      },
    },
  ],
});

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
    const response = await fetch("https://api.chucknorris.io/jokes/categories](#)

