import type { ActionDefinition } from "../types";

export const extractImageText: ActionDefinition = {
  id: "extract-image-text",
  label: "Extract text (OCR)",
  requiredFields: [],
  buildMessages: (context) => [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Extract all text visible in this image, verbatim, preserving line breaks where meaningful. If there's no text, say so plainly instead of describing the image.",
        },
        { type: "image", dataUrl: context.image?.dataUrl ?? "" },
      ],
    },
  ],
};
