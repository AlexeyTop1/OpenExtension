import type { ActionDefinition } from "../types";

export const describeImage: ActionDefinition = {
  id: "describe-image",
  label: "Describe image",
  requiredFields: [],
  buildMessages: (context) => [
    {
      role: "user",
      content: [
        { type: "text", text: "Describe this image in detail." },
        { type: "image", dataUrl: context.image?.dataUrl ?? "" },
      ],
    },
  ],
};
