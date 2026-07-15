import api from "../../services/api";

const ENDPOINT = "/assistant/messages/";

const CopilotService = Object.freeze({
  sendIntent(intent, argumentsValue) {
    return api.post(ENDPOINT, {
      intent,
      arguments: argumentsValue,
    });
  },
});

export default CopilotService;
export { ENDPOINT };
