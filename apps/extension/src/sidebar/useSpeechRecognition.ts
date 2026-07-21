import { useEffect, useRef, useState } from "react";
import { getPreferredLanguage } from "./preferredLanguage";
import { getVoiceInputLanguage } from "../shared/voiceInputSetting";

// Chrome's Web Speech API isn't in the standard DOM lib types — minimal shape
// for the parts used here, accessed via the vendor-prefixed global Chrome
// actually exposes (webkitSpeechRecognition). Deliberately not the
// provider-specific speech APIs (OpenAI Whisper, Gemini audio): those are
// per-provider and would break "any provider works the same," whereas this
// is a browser feature that just fills the existing text input.
interface SpeechRecognitionResultLike {
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was blocked — check the mic permission for this extension.",
  "no-speech": "Didn't catch any speech — try again.",
  "audio-capture": "No microphone found.",
  network: "Voice recognition needs a network connection.",
};

export function useSpeechRecognition(onResult: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isSupported = getSpeechRecognitionCtor() !== null;

  useEffect(() => () => recognitionRef.current?.stop(), []);

  async function toggle() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    setError(null);
    // An explicit override (set in Options) wins, since neither
    // navigator.language nor chrome.i18n.getAcceptLanguages() reliably match
    // the language someone actually speaks — the latter reflects Chrome's
    // configured content-language list, not a live "what am I speaking now" signal.
    const override = await getVoiceInputLanguage();
    const lang = override || (await getPreferredLanguage()).code;
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ")
        .trim();
      if (transcript) onResult(transcript);
    };
    recognition.onerror = (event) => {
      console.warn("[OpenExtension] Speech recognition error:", event.error);
      setError(ERROR_MESSAGES[event.error] ?? `Voice input failed (${event.error}).`);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.warn("[OpenExtension] Speech recognition failed to start.", err);
      setError("Couldn't start voice input.");
    }
  }

  return { isSupported, isListening, error, toggle };
}
