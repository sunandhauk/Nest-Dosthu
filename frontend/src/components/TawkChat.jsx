import { useEffect } from "react";

const CHATLING_SCRIPT_ID = "chtl-script";
const DEFAULT_CHATBOT_ID = "2679782931";

function TawkChat() {
  useEffect(() => {
    const chatbotId =
      process.env.REACT_APP_CHATLING_BOT_ID || DEFAULT_CHATBOT_ID;

    if (!chatbotId) {
      return undefined;
    }

    window.chtlConfig = { chatbotId };

    const existingScript = document.getElementById(CHATLING_SCRIPT_ID);
    if (existingScript) {
      return undefined;
    }

    const script = document.createElement("script");
    script.id = CHATLING_SCRIPT_ID;
    script.async = true;
    script.src = "https://chatling.ai/js/embed.js";
    script.type = "text/javascript";
    script.dataset.id = chatbotId;

    document.body.appendChild(script);

    return () => {
      const injectedScript = document.getElementById(CHATLING_SCRIPT_ID);
      if (injectedScript) {
        injectedScript.remove();
      }

      delete window.chtlConfig;
    };
  }, []);

  return null;
}

export default TawkChat;
