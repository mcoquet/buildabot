# build-a-bot

A production-grade framework for building AI agents.

## Basic Architecture

Build-a-bot is oriented around four basic components:

- One or more _models_, which make API calls out to LLMs. (Or some other model.) Models never run within a bot; they are always called over then network.
- One or more _agents_, which compose models, prompts and plugins into meaningful behavior.
- Zero or more _plugins_, which can be used by agents to access external tools and resources.
- One or more _interfaces_, which expose functionality of your agent(s) to users, such as via a websocket, Slack bot, over email or so on.

A typical implementation will expose one agent built on a range of models and prompts and able to use a range of plugins via a websocket.

## Getting Started

To create a new project, run:

```bash
npm create buildabot@latest
```

This will create a new project in the current directory. You can then run the project with:

```bash
npm install
npm start
```

During project generation you can choose to optionally include an example agent as a starting point.

## Todo

- if a response involves plugin use, send the response with dynamic elements for plugin execution
- wire up tool execution properly (ie implement plugins)
- implement conversation memory
- implement agent scratchpad & self-prompting (chain of thought)
