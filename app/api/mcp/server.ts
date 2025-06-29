import { Server } from "@modelcontextprotocol/sdk/server";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema, // <-- New import
  CallToolRequestSchema, // <-- New import
  Resource,
} from "@modelcontextprotocol/sdk/types";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

// --- Mock Data ---
const characterData: Record<string, string> = {
  "spider-man": JSON.stringify({
    name: "Spider-Man",
    realName: "Peter Parker",
    powers: ["Wall-crawling", "Superhuman strength/agility", "Spider-sense"],
    affiliation: "Avengers",
    firstAppearance: "Amazing Fantasy #15 (1962)",
  }, null, 2),
  "iron-man": JSON.stringify({
    name: "Iron Man",
    realName: "Tony Stark",
    powers: ["Genius-level intellect", "Powered armor suit", "Flight", "Repulsor blasts"],
    affiliation: "Avengers",
    firstAppearance: "Tales of Suspense #39 (1963)",
  }, null, 2),
};
// --- End Mock Data ---

async function main() {
  // 1. Initialize the MCP Server
  const server = new Server(
    {
      name: "comic-bio-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {}, // <-- Declare that this server also provides tools
      },
    }
  );

  // --- Existing Resource Handlers (Optional, can be removed if only tools needed) ---
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uriTemplate: "comic-bio://characters/{name}",
          name: "Comic Character Biography",
          description: "Get detailed biography for a comic character.",
          mimeType: "application/json",
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const parts = uri.match(/^comic-bio:\/\/characters\/(.*)$/);

    if (parts && parts[1]) {
      const characterName = parts[1];
      const bio = characterData[characterName.toLowerCase()];

      if (bio) {
        return {
          contents: [
            {
              uri: uri,
              mimeType: "application/json",
              text: bio,
            },
          ],
        };
      } else {
        throw new Error(`Character '${characterName}' not found.`);
      }
    }

    throw new Error(`Invalid resource URI: ${uri}`);
  });
  // --- End Existing Resource Handlers ---

  // --- NEW: Tool Handlers ---

  // 2. Register a handler for listing tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_character_bio",
          description: "Retrieve the biography of a comic book character.",
          inputSchema: {
            type: "object",
            properties: {
              characterName: {
                type: "string",
                description: "The full name of the comic book character.",
              },
            },
            required: ["characterName"],
          },
          annotations: {
            title: "Get Character Bio",
            readOnlyHint: true, // It only reads, doesn't modify state
            openWorldHint: false, // It interacts with a closed system (your internal data)
          }
        },
      ],
    };
  });

  // 3. Register a handler for calling tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_character_bio") {
      const characterName = request.params.arguments?.characterName;

      if (typeof characterName === "string") {
        const bio = characterData[characterName.toLowerCase()];
        if (bio) {
          return {
            content: [
              {
                type: "text",
                text: bio,
              },
            ],
          };
        } else {
          return { // Use isError: true for tool-specific errors
            isError: true,
            content: [
              {
                type: "text",
                text: `Error: Character '${characterName}' not found.`
              }
            ]
          };
        }
      } else {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Error: 'characterName' argument is missing or invalid."
            }
          ]
        };
      }
    }
    // If the tool name doesn't match any known tool
    throw new Error(`Tool '${request.params.name}' not found.`);
  });

  // 4. Connect the server using the Stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("MCP Comic Bio Server started via stdio.");
  console.log("Exposing Resources and Tools...");
}

main().catch(console.error);