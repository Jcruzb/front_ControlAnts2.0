import api from "../../services/api";

const ENDPOINT = "/assistant/messages/";

const CopilotService = Object.freeze({
  sendIntent(intent, argumentsValue) {
    return api.post(ENDPOINT, {
      intent,
      arguments: argumentsValue,
    });
  },
  sendMessage(message) {
    return api.post(ENDPOINT, { message });
  },
});

export default CopilotService;
export { ENDPOINT };
