import api from "../../services/api";

const ENDPOINT = "/assistant/messages/";

const CopilotService = Object.freeze({
  sendIntent(intent, argumentsValue) {
    return api.post(ENDPOINT, {
      intent,
      arguments: argumentsValue,
    });
  },
  sendMessage(message, context, { allowAI = false } = {}) {
    return api.post(ENDPOINT, { message, context, allow_ai: allowAI === true });
  },
});

export default CopilotService;
export { ENDPOINT };
