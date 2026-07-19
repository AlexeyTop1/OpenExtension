import type { ActionDefinition } from "../types";

export const generateAltText: ActionDefinition = {
  id: "generate-alt-text",
  label: "Generate alt text",
  requiredFields: [],
  buildMessages: (context) => [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Write a concise, descriptive alt text for this image (under 125 characters) suitable for a screen reader. Reply with only the alt text, no quotes or extra commentary.",
        },
        { type: "image", dataUrl: context.image?.dataUrl ?? "" },
      ],
    },
  ],
};
