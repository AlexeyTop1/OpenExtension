import { useEffect, useState } from "react";

export function useActiveTabUrl(): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!cancelled) setUrl(tab?.url ?? null);
    }

    void refresh();

    const onActivated = () => void refresh();
    const onUpdated = (_tabId: number, changeInfo: chrome.tabs.OnUpdatedInfo) => {
      if (changeInfo.url) void refresh();
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);

    return () => {
      cancelled = true;
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, []);

  return url;
}
