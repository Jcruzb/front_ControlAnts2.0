import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import MovementRegistration from "../components/MovementRegistration";
import api from "../../services/api";

vi.mock("../../services/api", () => ({ default: {get:vi.fn(),post:vi.fn()}, unwrapCollectionResponse:(v)=>v, getApiErrorMessage:()=>"Error de prueba" }));
const row = {kind:"expense",amount:"12.50",date:"2026-11-13",category:1,description:"Compra",alias:"",learn_alias:false,errors:[]};
const proposal = {id:"proposal-1",expires_at:"2026-11-13T09:00:00Z",movements:[row]};
beforeEach(()=>{ vi.clearAllMocks(); api.get.mockResolvedValue([{id:1,name:"Alimentación"}]); delete window.SpeechRecognition; });
async function interpret() {
  fireEvent.change(screen.getByLabelText("Movimientos en texto"),{target:{value:"Gasto 12,50 en Alimentación"}});
  fireEvent.click(screen.getByRole("button",{name:"Interpretar y revisar"}));
  await screen.findByText("Movimiento 1");
}
it("prepares reviewed rows without writing, then requires explicit confirmation",async()=>{
  api.post.mockResolvedValueOnce({rows:[row]}).mockResolvedValueOnce(proposal).mockResolvedValueOnce({created:true});
  const recorded=vi.fn(); render(<MovementRegistration year={2026} month={11} onRecorded={recorded}/>);
  await interpret();
  expect(api.post).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button",{name:"Revisar confirmación final"}));
  await screen.findByRole("button",{name:"Confirmar y registrar movimientos"});
  expect(api.post).toHaveBeenCalledTimes(2);
  expect(recorded).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"Confirmar y registrar movimientos"}));
  await screen.findByRole("status");
  expect(api.post).toHaveBeenLastCalledWith("/assistant/movement-proposals/proposal-1/confirm/",{confirmed:true});
  expect(recorded).toHaveBeenCalledTimes(1);
});
it("keeps the same immutable proposal for retry and cancellation never commits",async()=>{
  api.post.mockResolvedValueOnce({rows:[row]}).mockResolvedValueOnce(proposal).mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce({created:false});
  render(<MovementRegistration year={2026} month={11}/>); await interpret();
  fireEvent.click(screen.getByRole("button",{name:"Revisar confirmación final"}));
  fireEvent.click(await screen.findByRole("button",{name:"Confirmar y registrar movimientos"}));
  await screen.findByRole("alert");
  expect(screen.getByRole("button",{name:"Volver a editar"})).toBeDisabled();
  expect(screen.getByRole("button",{name:"Cancelar registro"})).toBeDisabled();
  fireEvent.click(screen.getByRole("button",{name:"Confirmar y registrar movimientos"}));
  await screen.findByRole("status");
  expect(api.post.mock.calls[2]).toEqual(api.post.mock.calls[3]);
});
it("requires category review and learns aliases only with explicit opt-in",async()=>{
  api.post.mockResolvedValueOnce({rows:[{...row,category:null,alias:"tienda",errors:["category"]}]}).mockResolvedValueOnce(proposal);
  render(<MovementRegistration year={2026} month={11}/>); await interpret();
  expect(screen.getByRole("button",{name:"Revisar confirmación final"})).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Categoría"),{target:{value:"1"}});
  fireEvent.click(screen.getByRole("button",{name:"Revisar confirmación final"}));
  await waitFor(()=>expect(api.post).toHaveBeenCalledTimes(2));
  expect(api.post.mock.calls[1][1].movements[0]).not.toHaveProperty("learn_alias");
  fireEvent.click(await screen.findByRole("button",{name:"Cancelar registro"}));
  expect(api.post).toHaveBeenCalledTimes(2);
});
it("voice only fills editable text and never prepares or confirms automatically",async()=>{
  let recorder;
  window.SpeechRecognition=class {constructor(){recorder=this;} start=vi.fn(); abort=vi.fn(); stop=vi.fn();};
  const {unmount}=render(<MovementRegistration year={2026} month={11}/>);
  await screen.findByRole("button",{name:"Dictar movimientos"});
  fireEvent.click(screen.getByRole("button",{name:"Dictar movimientos"}));
  const result=[{transcript:"Gasto 12 en Alimentación"}]; result.isFinal=true;
  const {act}=await import("@testing-library/react");
  await act(async()=>{recorder.onresult({results:[result]}); recorder.onend();});
  expect(screen.getByLabelText("Movimientos en texto")).toHaveValue("Gasto 12 en Alimentación");
  expect(api.post).not.toHaveBeenCalled(); unmount(); expect(recorder.abort).toHaveBeenCalled();
});
