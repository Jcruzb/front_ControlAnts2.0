import api from "../../services/api";

const ENDPOINT = "/assistant/messages/";

const CopilotService = Object.freeze({
  sendIntent(intent, argumentsValue) {
    return api.post(ENDPOINT, {
      intent,
      arguments: argumentsValue,
    });
  },
  sendMessage(message, context) {
    return api.post(ENDPOINT, { message, context });
  },
});

export default CopilotService;
export { ENDPOINT };
