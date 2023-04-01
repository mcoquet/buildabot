import * as http from "http";
import WebSocket, { WebSocketServer } from "ws";
import { ModelMessage } from "../models/types";
import { Agent } from "../agent";
import { PluginInvocation, PluginOutput } from "../plugins/types";
import { MessageRoles } from "../types";

export type WebsocketMessage = {
  type:
    | "agent-start"
    | "agent-finish"
    | "agent-error"
    | "agent-message"
    | "agent-stream-delta"
    | "plugin-start"
    | "plugin-finish"
    | "plugin-error"
    | "plugin-message";
  message?: {
    role?: MessageRoles;
    content?: string;
    plugin?: PluginInvocation;
  };
  error?: string;
  stream?: boolean;
};

export class WebsocketInterface {
  server: WebSocketServer;
  agent: Agent;

  constructor(agent: Agent, server: http.Server, path: string) {
    this.agent = agent;
    this.server = new WebSocketServer({ server: server, path: path });

    this.server.on("connection", (ws) => {
      const handlers = {
        onMessage: (message: ModelMessage) => Handlers.onMessage(ws, message),
        onToken: (delta: ModelMessage) => Handlers.onToken(ws, delta),
        onError: (err: string) => Handlers.onError(ws, err),
        onStart: () => Handlers.onStart(ws),
        onFinish: () => Handlers.onFinish(ws),
        onPluginStart: (plugin: PluginInvocation) => Handlers.onPluginStart(ws, plugin),
        onPluginFinish: (plugin: PluginInvocation) => Handlers.onPluginFinish(ws, plugin),
        onPluginError: (plugin: PluginInvocation, err: string) =>
          Handlers.onPluginError(ws, plugin, err),
        onPluginMessage: (plugin: PluginInvocation, output: PluginOutput) =>
          Handlers.onPluginMessage(ws, plugin, output),
      };

      this.agent.addHandler(handlers);

      ws.on("close", () => console.log("websocket closed"));
      ws.on("message", (data) => {
        const message = JSON.parse(data.toString());
        this.agent.run(message.content);
      });
      ws.on("error", (error) => {
        this.agent.onError("websocket error");
        console.log("websocket error");
      });
    });
  }
}

const sendJson = (ws: WebSocket.WebSocket, obj: WebsocketMessage) => ws.send(JSON.stringify(obj));

const Handlers = {
  onStart: (ws: WebSocket.WebSocket) => sendJson(ws, { type: "agent-start" }),

  onFinish: (ws: WebSocket.WebSocket) => sendJson(ws, { type: "agent-finish" }),

  onError: (ws: WebSocket.WebSocket, err: string) =>
    sendJson(ws, { type: "agent-error", error: err }),

  onMessage: (ws: WebSocket.WebSocket, message: ModelMessage) =>
    sendJson(ws, {
      type: "agent-message",
      message: {
        role: message.role,
        content: message.content,
      },
    }),

  onToken: (ws: WebSocket.WebSocket, delta: ModelMessage) =>
    sendJson(ws, {
      type: "agent-stream-delta",
      message: {
        role: delta.role,
        content: delta.content,
      },
      stream: true,
    }),

  onPluginStart: (ws: WebSocket.WebSocket, plugin: PluginInvocation) =>
    sendJson(ws, {
      type: "plugin-start",
      message: {
        role: "system",
        plugin,
      },
    }),

  onPluginFinish: (ws: WebSocket.WebSocket, plugin: PluginInvocation) =>
    sendJson(ws, { type: "plugin-finish", message: { role: "system", plugin } }),

  onPluginMessage: (ws: WebSocket.WebSocket, plugin: PluginInvocation, output: PluginOutput) =>
    sendJson(ws, {
      type: "plugin-message",
      message: {
        role: "system",
        content: output.output,
        plugin,
      },
    }),

  onPluginError: (ws: WebSocket.WebSocket, plugin: PluginInvocation, error: string) =>
    sendJson(ws, {
      type: "plugin-error",
      message: {
        role: "system",
        plugin,
      },
      error,
    }),
};
