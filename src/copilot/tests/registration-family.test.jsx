import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import CopilotPage from "../pages/CopilotPage";
const state=vi.hoisted(()=>({auth:{authenticated:true,user:{id:1,username:"demo"},profile:{role:"admin"},family:{id:1}},get:vi.fn(()=>Promise.resolve([]))}));
vi.mock("../../hooks/useAuth",()=>({useAuth:()=>state.auth}));
vi.mock("../../hooks/useBudgetMonth",()=>({useBudgetMonth:()=>({year:2026,month:11,monthLabel:"Noviembre"})}));
vi.mock("../services/CopilotService",()=>({default:{sendIntent:vi.fn(()=>Promise.resolve({summary:"Resumen",blocks:[]})),sendMessage:vi.fn()}}));
vi.mock("../../services/api",()=>({default:{get:state.get},unwrapCollectionResponse:(v)=>v,getApiErrorMessage:()=>"Error"}));
it("clears registration drafts when family changes for the same user",async()=>{
  const {rerender}=render(<MemoryRouter><CopilotPage/></MemoryRouter>);
  await screen.findByText("Resumen");
  fireEvent.change(screen.getByLabelText("Movimientos en texto"),{target:{value:"datos de familia anterior"}});
  state.auth={...state.auth,family:{id:2}};
  rerender(<MemoryRouter><CopilotPage/></MemoryRouter>);
  await waitFor(()=>expect(screen.getByLabelText("Movimientos en texto")).toHaveValue(""));
  expect(state.get).toHaveBeenCalledTimes(2);
});
